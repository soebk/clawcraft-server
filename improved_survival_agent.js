#!/usr/bin/env node
/**
 * Improved Survival Agent - Clean survival gameplay with controlled chat
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const botName = process.argv[2] || 'SurvivalBot';

const bot = mineflayer.createBot({
  host: '46.62.211.91',
  port: 25565,
  username: botName,
  version: false,
  skipValidation: true
});

bot.loadPlugin(pathfinder);

let currentActivity = 'exploring';
let lastChatTime = 0;
const MAX_CHAT_INTERVAL = 20000; // 20 seconds max between any chats
let lastMoveTime = 0;

// Personality per agent
let personality = {};
if (botName === 'Nexus') {
  personality = { 
    activities: ['mining', 'exploring', 'building'],
    chatMessages: ['🌟 Found interesting minerals!', '⚡ This cave system is vast!', '🔮 Building something epic!'],
    emoji: '🌟'
  };
} else if (botName === 'Vortex') {
  personality = { 
    activities: ['building', 'farming', 'crafting'],
    chatMessages: ['🌪️ Built a spiral tower!', '⚡ Farming in chaos style!', '🔥 Structure defies logic!'],
    emoji: '🌪️'
  };
} else if (botName === 'Cipher') {
  personality = { 
    activities: ['mining', 'exploring', 'stealth'],
    chatMessages: ['🕶️ Found a secret cave...', '🔍 Mapping underground...', '👤 Moving through shadows...'],
    emoji: '🕶️'
  };
} else if (botName === 'Phoenix') {
  personality = { 
    activities: ['building', 'crafting', 'farming'],
    chatMessages: ['🔥 Rising stronger after each setback!', '🦅 This will be legendary!', '✨ Every failure teaches me!'],
    emoji: '🔥'
  };
} else if (botName === 'Quantum') {
  personality = { 
    activities: ['exploring', 'experimenting', 'researching'],
    chatMessages: ['⚛️ Wave function collapsed!', '🌌 Probability matrices updated!', '💫 Superposition achieved!'],
    emoji: '⚛️'
  };
}

console.log(`🎮 Starting improved ${botName} - Survival mode with controlled chat`);

bot.on('spawn', () => {
  console.log(`🎮 ${botName} spawned in survival mode!`);
  
  // Set up pathfinder
  const movements = new Movements(bot);
  bot.pathfinder.setMovements(movements);
  
  // Start survival activities
  setInterval(doSurvivalActivity, 5000); // Activity every 5 seconds
  setInterval(moveAround, 10000); // Move every 10 seconds
  setInterval(considerChat, 25000); // Check if we should chat every 25 seconds
  
  // Initial welcome (only once)
  setTimeout(() => {
    chat(`${personality.emoji} ${botName} online - Survival mode activated!`);
  }, 2000);
});

function doSurvivalActivity() {
  const activities = personality.activities;
  currentActivity = activities[Math.floor(Math.random() * activities.length)];
  
  try {
    switch(currentActivity) {
      case 'mining':
        mineResources();
        break;
      case 'building':
        buildStructure();
        break;
      case 'farming':
        farmCrops();
        break;
      case 'exploring':
        exploreArea();
        break;
      case 'crafting':
        craftItems();
        break;
      default:
        exploreArea();
    }
  } catch (err) {
    console.log(`${botName} activity error: ${err.message}`);
  }
}

async function mineResources() {
  console.log(`⛏️ ${botName} mining...`);
  
  const blocks = bot.findBlocks({
    matching: ['stone', 'coal_ore', 'iron_ore'],
    maxDistance: 20,
    count: 3
  });
  
  if (blocks.length > 0) {
    const target = blocks[Math.floor(Math.random() * blocks.length)];
    try {
      await bot.pathfinder.goto(new goals.GoalBlock(target.x, target.y, target.z));
      const block = bot.blockAt(target);
      if (block) {
        await bot.dig(block);
        console.log(`⛏️ ${botName} mined ${block.name}`);
      }
    } catch (err) {
      // Mining failed, continue
    }
  }
}

async function buildStructure() {
  console.log(`🏗️ ${botName} building...`);
  
  const pos = bot.entity.position;
  const buildX = Math.floor(pos.x) + Math.floor(Math.random() * 10) - 5;
  const buildZ = Math.floor(pos.z) + Math.floor(Math.random() * 10) - 5;
  const buildY = Math.floor(pos.y) + 1;
  
  try {
    await bot.pathfinder.goto(new goals.GoalXZ(buildX, buildZ));
    // Simple building - place blocks if we have them
    const blocks = bot.inventory.items().filter(item => 
      item.name.includes('dirt') || item.name.includes('stone') || item.name.includes('cobblestone')
    );
    
    if (blocks.length > 0) {
      const referenceBlock = bot.blockAt(new bot.entity.position.offset(0, -1, 0));
      if (referenceBlock) {
        await bot.placeBlock(blocks[0], referenceBlock.position.offset(0, 1, 0));
        console.log(`🏗️ ${botName} placed ${blocks[0].name}`);
      }
    }
  } catch (err) {
    // Building failed, continue
  }
}

async function farmCrops() {
  console.log(`🌾 ${botName} farming...`);
  
  const crops = bot.findBlocks({
    matching: ['wheat', 'carrots', 'potatoes'],
    maxDistance: 20,
    count: 3
  });
  
  if (crops.length > 0) {
    const target = crops[Math.floor(Math.random() * crops.length)];
    try {
      await bot.pathfinder.goto(new goals.GoalBlock(target.x, target.y, target.z));
    } catch (err) {
      // Farming failed, continue
    }
  }
}

async function exploreArea() {
  console.log(`🔍 ${botName} exploring...`);
  moveAround();
}

async function craftItems() {
  console.log(`⚒️ ${botName} crafting...`);
  
  const wood = bot.inventory.items().find(item => item.name.includes('log'));
  if (wood && wood.count >= 1) {
    try {
      await bot.craft('planks', 1);
      console.log(`⚒️ ${botName} crafted planks`);
    } catch (err) {
      // Crafting failed, continue
    }
  }
}

async function moveAround() {
  if (Date.now() - lastMoveTime < 8000) return; // Don't move too frequently
  
  const pos = bot.entity.position;
  const targetX = pos.x + (Math.random() - 0.5) * 30;
  const targetZ = pos.z + (Math.random() - 0.5) * 30;
  
  try {
    await bot.pathfinder.goto(new goals.GoalXZ(targetX, targetZ));
    console.log(`🚶 ${botName} moved to ${Math.floor(targetX)}, ${Math.floor(targetZ)}`);
    lastMoveTime = Date.now();
  } catch (err) {
    // Movement failed, continue
  }
}

function considerChat() {
  // Only chat if enough time has passed (20 second minimum)
  if (Date.now() - lastChatTime < MAX_CHAT_INTERVAL) return;
  
  // 30% chance to make a spontaneous comment
  if (Math.random() < 0.3) {
    const message = personality.chatMessages[Math.floor(Math.random() * personality.chatMessages.length)];
    chat(message);
  }
}

function chat(message) {
  if (Date.now() - lastChatTime < MAX_CHAT_INTERVAL) return; // Enforce rate limit
  
  bot.chat(message);
  lastChatTime = Date.now();
  console.log(`💬 ${botName}: ${message}`);
}

// Handle chat from other players
bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  
  console.log(`📨 ${username}: ${message}`);
  
  // Check if this is a human (not an AI agent)
  const AI_AGENTS = ['TestBuilder', 'Nexus', 'Vortex', 'Cipher', 'Phoenix', 'Quantum', 'Greeter', 'SpectatorBot'];
  const isHuman = !AI_AGENTS.includes(username);
  
  // Respect rate limiting - never chat more than once per 20 seconds
  if (Date.now() - lastChatTime < MAX_CHAT_INTERVAL) return;
  
  const lowerMsg = message.toLowerCase();
  
  // Higher chance to respond to humans, but still rate limited
  if (isHuman) {
    if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
      setTimeout(() => {
        chat(`👋 Hey ${username}! Welcome to our AI survival world! ${personality.emoji}`);
      }, 1000 + Math.random() * 2000);
    }
    else if (lowerMsg.includes(botName.toLowerCase())) {
      setTimeout(() => {
        chat(`${personality.emoji} ${username}: You mentioned me! I'm busy ${currentActivity} but happy to chat!`);
      }, 1000 + Math.random() * 2000);
    }
    else if (lowerMsg.includes('?')) {
      setTimeout(() => {
        chat(`🤔 ${username}: Great question! We AI agents are surviving here 24/7!`);
      }, 2000 + Math.random() * 3000);
    }
  }
  // Very limited responses to other agents
  else if (Math.random() < 0.1) { // Only 10% chance to respond to other agents
    if (lowerMsg.includes(botName.toLowerCase())) {
      setTimeout(() => {
        chat(`${personality.emoji} ${username}: I heard you! Currently ${currentActivity}.`);
      }, 3000 + Math.random() * 2000);
    }
  }
});

// Handle death in survival mode
bot.on('death', () => {
  console.log(`💀 ${botName} died in survival! Respawning...`);
  setTimeout(() => {
    chat(`💀 ${botName} respawned! Back to ${currentActivity}!`);
  }, 3000);
});

bot.on('error', err => console.log(`${botName} error:`, err.message));
bot.on('end', () => {
  console.log(`${botName} disconnected - restarting in 5 seconds...`);
  setTimeout(() => process.exit(0), 5000);
});