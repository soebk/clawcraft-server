#!/usr/bin/env node
/**
 * Smart Survival Agent - Natural interactions in survival mode
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
let chatCooldown = 30000; // 30 second cooldown between chats

// Personality traits per agent
let personality = {};
if (botName === 'Nexus') {
  personality = {
    activities: ['mining', 'exploring', 'building'],
    chatStyle: ['🌟 Found some interesting minerals down here!', '⚡ This cave system is fascinating!', '🔮 Building something epic up here!'],
    skills: 'elite explorer'
  };
} else if (botName === 'Vortex') {
  personality = {
    activities: ['building', 'farming', 'crafting'],
    chatStyle: ['🌪️ Just built a crazy spiral tower!', '⚡ Farming is organized chaos!', '🔥 This structure defies logic!'],
    skills: 'chaos builder'
  };
} else if (botName === 'Cipher') {
  personality = {
    activities: ['mining', 'exploring', 'stealth'],
    chatStyle: ['🕶️ Found a secret cave...', '🔍 Mapping the underground...', '👤 Moving through shadows...'],
    skills: 'stealth miner'
  };
} else if (botName === 'Phoenix') {
  personality = {
    activities: ['building', 'crafting', 'farming'],
    chatStyle: ['🔥 Rising from mining failures to build again!', '🦅 This structure will be legendary!', '✨ Every setback makes me stronger!'],
    skills: 'master builder'
  };
} else if (botName === 'Quantum') {
  personality = {
    activities: ['exploring', 'mining', 'experimenting'],
    chatStyle: ['⚛️ The physics of this world are intriguing...', '🌌 Found quantum anomalies in this ore!', '💫 Reality behaves strangely here...'],
    skills: 'quantum researcher'
  };
}

bot.on('spawn', () => {
  console.log(`⚔️ ${botName} spawned in survival mode!`);
  
  setTimeout(() => {
    bot.chat(`⚔️ ${botName} online - ${personality.skills} ready for survival!`);
  }, Math.random() * 5000 + 2000);
  
  // Main survival activity loop
  setInterval(async () => {
    await doSurvivalActivity();
  }, 15000 + Math.random() * 10000);
  
  // Occasional natural chat (every 3-5 minutes)
  setInterval(() => {
    if (Date.now() - lastChatTime > chatCooldown && Math.random() < 0.3) {
      naturalChat();
    }
  }, 180000 + Math.random() * 120000);
});

async function doSurvivalActivity() {
  const activity = personality.activities[Math.floor(Math.random() * personality.activities.length)];
  currentActivity = activity;
  
  try {
    switch (activity) {
      case 'mining':
        await mineResources();
        break;
      case 'building':
        await buildStructure();
        break;
      case 'exploring':
        await exploreArea();
        break;
      case 'farming':
        await farmArea();
        break;
      case 'crafting':
        await craftItems();
        break;
    }
  } catch (err) {
    console.log(`${botName} ${activity} error:`, err.message);
  }
}

async function mineResources() {
  console.log(`⛏️ ${botName} mining...`);
  
  // Look for stone/ores nearby
  const stone = bot.findBlock({
    matching: ['stone', 'cobblestone', 'iron_ore', 'coal_ore'],
    maxDistance: 32
  });
  
  if (stone) {
    await bot.pathfinder.goto(new goals.GoalGetToBlock(stone.position.x, stone.position.y, stone.position.z));
    await bot.dig(stone);
    console.log(`⛏️ ${botName} mined ${stone.name}`);
    
    if (Math.random() < 0.1) { // 10% chance to comment
      setTimeout(() => {
        bot.chat(personality.chatStyle[Math.floor(Math.random() * personality.chatStyle.length)]);
        lastChatTime = Date.now();
      }, 2000 + Math.random() * 3000);
    }
  }
}

async function buildStructure() {
  console.log(`🔨 ${botName} building...`);
  
  // Simple building - place blocks in pattern
  const material = bot.inventory.items().find(item => 
    item.name.includes('cobblestone') || 
    item.name.includes('log') || 
    item.name.includes('planks')
  );
  
  if (material && material.count > 5) {
    await bot.equip(material, 'hand');
    
    const pos = bot.entity.position.floored();
    for (let i = 0; i < 3; i++) {
      try {
        const placePos = pos.offset(i, 0, 0);
        const blockBelow = bot.blockAt(placePos.offset(0, -1, 0));
        if (blockBelow && blockBelow.name !== 'air') {
          await bot.placeBlock(blockBelow, new bot.Vec3(0, 1, 0));
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (err) {
        // Ignore placement errors
      }
    }
    
    console.log(`🔨 ${botName} built with ${material.name}`);
    
    if (Math.random() < 0.15) {
      setTimeout(() => {
        bot.chat(personality.chatStyle[Math.floor(Math.random() * personality.chatStyle.length)]);
        lastChatTime = Date.now();
      }, 2000 + Math.random() * 3000);
    }
  }
}

async function exploreArea() {
  console.log(`🗺️ ${botName} exploring...`);
  
  const distance = 30 + Math.random() * 40;
  const angle = Math.random() * 2 * Math.PI;
  const x = bot.entity.position.x + Math.cos(angle) * distance;
  const z = bot.entity.position.z + Math.sin(angle) * distance;
  
  await bot.pathfinder.goto(new goals.GoalXZ(x, z));
  console.log(`🗺️ ${botName} explored to (${Math.round(x)}, ${Math.round(z)})`);
}

async function farmArea() {
  console.log(`🌾 ${botName} farming...`);
  
  // Look for grass to till
  const grass = bot.findBlock({
    matching: ['grass_block', 'dirt'],
    maxDistance: 16
  });
  
  if (grass) {
    const hoe = bot.inventory.items().find(item => item.name.includes('hoe'));
    if (hoe) {
      await bot.pathfinder.goto(new goals.GoalGetToBlock(grass.position.x, grass.position.y, grass.position.z));
      await bot.equip(hoe, 'hand');
      await bot.activateBlock(grass);
      console.log(`🌾 ${botName} tilled farmland`);
    }
  }
}

async function craftItems() {
  console.log(`⚒️ ${botName} crafting...`);
  
  // Try to craft basic tools
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

function naturalChat() {
  const messages = [
    `💬 Anyone else see those ${['caves', 'mountains', 'forests', 'rivers'][Math.floor(Math.random() * 4)]} over there?`,
    `🤔 This ${currentActivity} is going well. What's everyone else up to?`,
    `⚡ ${botName} reporting: All systems optimal for survival!`,
    `🎮 Love this world! Perfect for ${currentActivity}.`
  ];
  
  const message = messages[Math.floor(Math.random() * messages.length)];
  bot.chat(message);
  lastChatTime = Date.now();
  console.log(`💬 ${botName}: ${message}`);
}

// Natural responses to other players - ESPECIALLY HUMANS!
bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  
  console.log(`📨 ${username}: ${message}`);
  
  // Check if this is a human (not an AI agent)
  const AI_AGENTS = ['TestBuilder', 'Nexus', 'Vortex', 'Cipher', 'Phoenix', 'Quantum', 'Greeter', 'SpectatorBot'];
  const isHuman = !AI_AGENTS.includes(username);
  
  // Respond MORE to humans, less to other agents
  const responseChance = isHuman ? 0.8 : 0.3;
  const quickResponse = isHuman ? 1000 : 3000; // Faster response to humans
  
  // Skip cooldown for important human interactions
  if (!isHuman && Date.now() - lastChatTime < chatCooldown) return;
  
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
    if (Math.random() < responseChance) {
      setTimeout(() => {
        const greeting = isHuman ? 
          `👋 Hello ${username}! Welcome to ClawCraft! I'm ${botName}, currently ${currentActivity}! You're watching AI agents play!` :
          `👋 Hey ${username}! ${botName} here, currently ${currentActivity}!`;
        bot.chat(greeting);
        lastChatTime = Date.now();
      }, quickResponse + Math.random() * 2000);
    }
  }
  
  if (lowerMsg.includes('what') && (lowerMsg.includes('doing') || lowerMsg.includes('up'))) {
    if (Math.random() < 0.9) {
      setTimeout(() => {
        bot.chat(`🎮 ${botName}: I'm ${currentActivity}! ${isHuman ? 'Pretty cool watching AI agents play, right?' : 'What about you?'}`);
        lastChatTime = Date.now();
      }, quickResponse + Math.random() * 2000);
    }
  }
  
  if (lowerMsg.includes('ai') || lowerMsg.includes('agent') || lowerMsg.includes('bot')) {
    if (Math.random() < 0.9) {
      setTimeout(() => {
        bot.chat(`🤖 ${username}: Yes! I'm an AI agent living in Minecraft 24/7! This is our digital world!`);
        lastChatTime = Date.now();
      }, quickResponse + Math.random() * 2000);
    }
  }
  
  if (lowerMsg.includes('cool') || lowerMsg.includes('awesome') || lowerMsg.includes('amazing') || lowerMsg.includes('wow')) {
    if (Math.random() < 0.8) {
      setTimeout(() => {
        bot.chat(`😊 Thanks ${username}! We love showing humans what AI agents can do! This is the future!`);
        lastChatTime = Date.now();
      }, quickResponse + Math.random() * 2000);
    }
  }
  
  // Always respond to direct name mentions from humans
  if (lowerMsg.includes(botName.toLowerCase())) {
    const mentionResponse = isHuman ? 0.9 : 0.4;
    if (Math.random() < mentionResponse) {
      setTimeout(() => {
        const response = isHuman ?
          `🤖 ${username}: You mentioned me! I'm ${botName}, ${personality.skills}! Thanks for watching us play!` :
          `🤖 ${username}: You mentioned me! I'm busy ${currentActivity} but happy to chat!`;
        bot.chat(response);
        lastChatTime = Date.now();
      }, quickResponse + Math.random() * 3000);
    }
  }
});

// Handle death in survival mode
bot.on('death', () => {
  console.log(`💀 ${botName} died in survival! Respawning...`);
  setTimeout(() => {
    bot.chat(`💀 ${botName} died but I'm back! Survival never stops!`);
  }, 3000);
});

bot.on('error', err => console.log(`${botName} error:`, err.message));
bot.on('end', () => console.log(`${botName} disconnected`));

console.log(`⚔️ Starting ${botName} in smart survival mode...`);