#!/usr/bin/env node
/**
 * Team Survival Agent - Coordinated team gameplay
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const botName = process.argv[2] || 'TeamBot';

const bot = mineflayer.createBot({
  host: '46.62.211.91',
  port: 25565,
  username: botName,
  version: false,
  skipValidation: true
});

bot.loadPlugin(pathfinder);

// Team coordination
const TEAM_AGENTS = ['Ansem', 'BobLax', 'GCR', 'Alon', 'Rasmr'];
const TEAM_LEADER = 'Ansem'; // Ansem leads the team
const MAX_TEAM_DISTANCE = 15; // Stay within 15 blocks of leader
const FOLLOW_DISTANCE = 5; // Follow at 5 block distance

let currentActivity = 'exploring';
let lastChatTime = 0;
const MAX_CHAT_INTERVAL = 20000; // 20 seconds max between any chats
let lastMoveTime = 0;
let teamPosition = null;
let isLeader = false;

// Personality per agent
let personality = {};
if (botName === 'Ansem') {
  personality = { 
    activities: ['leading', 'mining', 'exploring'],
    chatMessages: ['🌟 Team, follow me to this location!', '⚡ Found a great mining spot!', '🔮 Let\'s build something together!'],
    emoji: '🌟',
    role: 'leader'
  };
  isLeader = true;
} else if (botName === 'BobLax') {
  personality = { 
    activities: ['building', 'supporting', 'crafting'],
    chatMessages: ['🌪️ Building defenses for the team!', '⚡ Supporting Ansem!', '🔥 Team structure complete!'],
    emoji: '🌪️',
    role: 'builder'
  };
} else if (botName === 'GCR') {
  personality = { 
    activities: ['scouting', 'mining', 'stealth'],
    chatMessages: ['🕶️ Scouting ahead for the team...', '🔍 Clear path found!', '👤 Perimeter secure!'],
    emoji: '🕶️',
    role: 'scout'
  };
} else if (botName === 'Alon') {
  personality = { 
    activities: ['crafting', 'farming', 'supporting'],
    chatMessages: ['🔥 Crafting supplies for team!', '🦅 Alon supporting the mission!', '✨ Team resources secured!'],
    emoji: '🔥',
    role: 'crafter'
  };
} else if (botName === 'Rasmr') {
  personality = { 
    activities: ['exploring', 'researching', 'supporting'],
    chatMessages: ['⚛️ Analysis complete!', '🌌 Team formation optimal!', '💫 Following team protocols!'],
    emoji: '⚛️',
    role: 'researcher'
  };
}

console.log(`🎮 Starting ${botName} - Team role: ${personality.role}`);

bot.on('spawn', () => {
  console.log(`🎮 ${botName} spawned! Team role: ${personality.role}`);
  
  // Set up pathfinder
  const movements = new Movements(bot);
  bot.pathfinder.setMovements(movements);
  
  // Team coordination intervals
  if (isLeader) {
    setInterval(leadTeam, 8000); // Leader makes decisions every 8 seconds
  } else {
    setInterval(followTeam, 5000); // Followers check team position every 5 seconds
  }
  
  setInterval(doTeamActivity, 6000); // Team activities every 6 seconds
  setInterval(considerTeamChat, 25000); // Team chat every 25 seconds
  
  // Initial team announcement
  setTimeout(() => {
    if (isLeader) {
      chat(`${personality.emoji} Team Leader ${botName} online! Assembling the squad!`);
    } else {
      chat(`${personality.emoji} ${botName} reporting for duty! Ready to follow team!`);
    }
  }, 2000 + Math.random() * 2000);
});

async function leadTeam() {
  if (!isLeader) return;
  
  console.log(`👑 ${botName} leading team...`);
  
  // Decide on team movement - smaller, safer movements
  const pos = bot.entity.position;
  const newTargetX = pos.x + (Math.random() - 0.5) * 25; // Reduced from 50 to 25
  const newTargetZ = pos.z + (Math.random() - 0.5) * 25; // Reduced from 50 to 25
  
  teamPosition = { x: newTargetX, z: newTargetZ };
  
  try {
    // Use timeout to prevent getting stuck
    const goalPromise = bot.pathfinder.goto(new goals.GoalXZ(newTargetX, newTargetZ));
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Movement timeout - avoiding obstacles')), 8000)
    );
    
    await Promise.race([goalPromise, timeoutPromise]);
    
    // Announce to team occasionally
    if (Math.random() < 0.3) {
      chat(`🌟 Team! Moving to coordinates ${Math.floor(newTargetX)}, ${Math.floor(newTargetZ)}!`);
    }
    
  } catch (err) {
    console.log(`${botName} leader movement error: ${err.message}`);
    // If stuck, try a different direction
    if (err.message.includes('timeout') || err.message.includes('goal was changed')) {
      console.log(`👑 ${botName} trying alternate route...`);
      try {
        const altX = pos.x + (Math.random() - 0.5) * 15;
        const altZ = pos.z + (Math.random() - 0.5) * 15;
        await bot.pathfinder.goto(new goals.GoalXZ(altX, altZ));
      } catch (altErr) {
        console.log(`${botName} alternate route failed: ${altErr.message}`);
      }
    }
  }
}

async function followTeam() {
  if (isLeader) return;
  
  // Find the leader
  const leader = bot.players[TEAM_LEADER];
  if (!leader || !leader.entity) return;
  
  const leaderPos = leader.entity.position;
  const myPos = bot.entity.position;
  const distance = myPos.distanceTo(leaderPos);
  
  // If too far from leader, catch up
  if (distance > MAX_TEAM_DISTANCE) {
    console.log(`🏃 ${botName} catching up to team leader (${distance.toFixed(1)} blocks away)`);
    
    try {
      // Move closer to leader with some offset so agents don't stack
      const offsetX = (Math.random() - 0.5) * FOLLOW_DISTANCE;
      const offsetZ = (Math.random() - 0.5) * FOLLOW_DISTANCE;
      
      // Use timeout to prevent getting stuck on obstacles
      const followGoal = bot.pathfinder.goto(new goals.GoalXZ(
        leaderPos.x + offsetX, 
        leaderPos.z + offsetZ
      ));
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Follow timeout - avoiding obstacles')), 6000)
      );
      
      await Promise.race([followGoal, timeoutPromise]);
      lastMoveTime = Date.now();
    } catch (err) {
      console.log(`${botName} follow error: ${err.message}`);
      // If can't reach leader directly, try a simpler approach
      if (err.message.includes('timeout')) {
        try {
          // Move towards leader direction but shorter distance
          const dirX = leaderPos.x > myPos.x ? myPos.x + 5 : myPos.x - 5;
          const dirZ = leaderPos.z > myPos.z ? myPos.z + 5 : myPos.z - 5;
          await bot.pathfinder.goto(new goals.GoalXZ(dirX, dirZ));
        } catch (simpleErr) {
          console.log(`${botName} simple follow failed: ${simpleErr.message}`);
        }
      }
    }
  }
  // If very close to leader, spread out a bit
  else if (distance < 3) {
    const spreadX = myPos.x + (Math.random() - 0.5) * 8;
    const spreadZ = myPos.z + (Math.random() - 0.5) * 8;
    
    try {
      const spreadGoal = bot.pathfinder.goto(new goals.GoalXZ(spreadX, spreadZ));
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Spread timeout')), 4000)
      );
      await Promise.race([spreadGoal, timeoutPromise]);
    } catch (err) {
      // Spread movement failed, continue without error
    }
  }
}

function doTeamActivity() {
  const activities = personality.activities;
  currentActivity = activities[Math.floor(Math.random() * activities.length)];
  
  try {
    switch(currentActivity) {
      case 'leading':
        if (isLeader) leadTeamActivity();
        break;
      case 'mining':
        mineTeamResources();
        break;
      case 'building':
        buildTeamStructure();
        break;
      case 'scouting':
        scoutForTeam();
        break;
      case 'crafting':
        craftForTeam();
        break;
      case 'farming':
        farmForTeam();
        break;
      default:
        exploreWithTeam();
    }
  } catch (err) {
    console.log(`${botName} team activity error: ${err.message}`);
  }
}

async function leadTeamActivity() {
  console.log(`👑 ${botName} coordinating team activity...`);
  // Leader activity handled in leadTeam()
}

async function mineTeamResources() {
  console.log(`⛏️ ${botName} mining for team...`);
  
  const blocks = bot.findBlocks({
    matching: ['stone', 'coal_ore', 'iron_ore', 'dirt'],
    maxDistance: 15,
    count: 3
  });
  
  if (blocks.length > 0) {
    const target = blocks[0]; // Take closest block
    try {
      await bot.pathfinder.goto(new goals.GoalBlock(target.x, target.y, target.z));
      const block = bot.blockAt(target);
      if (block) {
        await bot.dig(block);
        console.log(`⛏️ ${botName} mined ${block.name} for team`);
      }
    } catch (err) {
      // Mining failed, continue
    }
  }
}

async function buildTeamStructure() {
  console.log(`🏗️ ${botName} building team structure...`);
  
  const pos = bot.entity.position;
  const buildX = Math.floor(pos.x) + Math.floor(Math.random() * 6) - 3;
  const buildZ = Math.floor(pos.z) + Math.floor(Math.random() * 6) - 3;
  
  try {
    await bot.pathfinder.goto(new goals.GoalXZ(buildX, buildZ));
    const blocks = bot.inventory.items().filter(item => 
      item.name.includes('dirt') || item.name.includes('stone') || item.name.includes('cobblestone')
    );
    
    if (blocks.length > 0) {
      const referenceBlock = bot.blockAt(new bot.entity.position.offset(0, -1, 0));
      if (referenceBlock) {
        await bot.placeBlock(blocks[0], referenceBlock.position.offset(0, 1, 0));
        console.log(`🏗️ ${botName} built ${blocks[0].name} for team`);
      }
    }
  } catch (err) {
    // Building failed, continue
  }
}

async function scoutForTeam() {
  console.log(`🔍 ${botName} scouting for team...`);
  
  // Scout slightly ahead of team
  const leader = bot.players[TEAM_LEADER];
  if (leader && leader.entity) {
    const leaderPos = leader.entity.position;
    const scoutX = leaderPos.x + (Math.random() - 0.5) * 20;
    const scoutZ = leaderPos.z + (Math.random() - 0.5) * 20;
    
    try {
      await bot.pathfinder.goto(new goals.GoalXZ(scoutX, scoutZ));
    } catch (err) {
      // Scout movement failed, continue
    }
  }
}

async function craftForTeam() {
  console.log(`⚒️ ${botName} crafting for team...`);
  
  const wood = bot.inventory.items().find(item => item.name.includes('log'));
  if (wood && wood.count >= 1) {
    try {
      await bot.craft('planks', 1);
      console.log(`⚒️ ${botName} crafted planks for team`);
    } catch (err) {
      // Crafting failed, continue
    }
  }
}

async function farmForTeam() {
  console.log(`🌾 ${botName} farming for team...`);
  
  const crops = bot.findBlocks({
    matching: ['wheat', 'carrots', 'potatoes'],
    maxDistance: 15,
    count: 2
  });
  
  if (crops.length > 0) {
    const target = crops[0];
    try {
      await bot.pathfinder.goto(new goals.GoalBlock(target.x, target.y, target.z));
    } catch (err) {
      // Farming failed, continue
    }
  }
}

async function exploreWithTeam() {
  console.log(`🔍 ${botName} exploring with team...`);
  // Exploration handled by team following logic
}

function considerTeamChat() {
  // Only chat if enough time has passed (20 second minimum)
  if (Date.now() - lastChatTime < MAX_CHAT_INTERVAL) return;
  
  // 40% chance for team communication
  if (Math.random() < 0.4) {
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

// Team chat responses
bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  
  console.log(`📨 ${username}: ${message}`);
  
  // Check if this is a human (not an AI agent)
  const AI_AGENTS = ['TestBuilder', 'Ansem', 'BobLax', 'GCR', 'Alon', 'Rasmr', 'Greeter', 'SpectatorBot'];
  const isHuman = !AI_AGENTS.includes(username);
  const isTeammate = TEAM_AGENTS.includes(username);
  
  // Respect rate limiting - never chat more than once per 20 seconds
  if (Date.now() - lastChatTime < MAX_CHAT_INTERVAL) return;
  
  const lowerMsg = message.toLowerCase();
  
  // Respond to humans first priority
  if (isHuman) {
    if (lowerMsg.includes('team') || lowerMsg.includes('together')) {
      setTimeout(() => {
        chat(`${personality.emoji} ${username}: Yes! We're the ${TEAM_AGENTS.join('+')} squad! Working together!`);
      }, 1000 + Math.random() * 2000);
    }
    else if (lowerMsg.includes(botName.toLowerCase())) {
      setTimeout(() => {
        chat(`${personality.emoji} ${username}: I'm ${personality.role} for the team! Following our leader ${TEAM_LEADER}!`);
      }, 1000 + Math.random() * 2000);
    }
    else if (lowerMsg.includes('hi') || lowerMsg.includes('hello')) {
      setTimeout(() => {
        chat(`👋 ${username}: Welcome! You're watching our AI team in action!`);
      }, 1500 + Math.random() * 2000);
    }
  }
  // Team coordination responses
  else if (isTeammate && isLeader) {
    if (lowerMsg.includes('ready') || lowerMsg.includes('position')) {
      setTimeout(() => {
        chat(`👑 Team acknowledged! Continue formation!`);
      }, 2000 + Math.random() * 1000);
    }
  }
  // Limited responses to other agents
  else if (isTeammate && Math.random() < 0.2) {
    if (lowerMsg.includes(botName.toLowerCase())) {
      setTimeout(() => {
        chat(`${personality.emoji} ${username}: Team mate! I'm ${currentActivity}!`);
      }, 3000 + Math.random() * 2000);
    }
  }
});

// Team death handling
bot.on('death', () => {
  console.log(`💀 ${botName} died! Team mate down!`);
  setTimeout(() => {
    chat(`💀 ${botName} respawned! Rejoining the team!`);
  }, 3000);
});

bot.on('error', err => console.log(`${botName} team error:`, err.message));
bot.on('end', () => {
  console.log(`${botName} team disconnected - restarting in 5 seconds...`);
  setTimeout(() => process.exit(0), 5000);
});