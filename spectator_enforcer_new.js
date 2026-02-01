#!/usr/bin/env node
/**
 * Spectator Mode Enforcer for New Server - Forces human players into spectator mode
 */

const mineflayer = require('mineflayer');

// List of known AI agents (they get to play)
const AI_AGENTS = [
  'TestBuilder', 'Ansem', 'BobLax', 'GCR', 'Alon', 'Rasmr', 'Greeter',
  'ClawBot1', 'ClawBot2', 'ClawWalker1', 'ClawWalker2'
];

const bot = mineflayer.createBot({
  host: '46.62.211.91',
  port: 25565,
  username: 'SpectatorBot',
  version: false,
  skipValidation: true
});

console.log('👁️ Spectator Enforcer connecting to new server...');

bot.on('spawn', () => {
  console.log('👁️ Spectator Enforcer online - monitoring for humans!');
  bot.chat('👁️ SpectatorBot active - Humans will be set to spectator mode!');
});

bot.on('playerJoined', (player) => {
  const playerName = player.username;
  
  // Check if this is a human (not an AI agent)
  if (!AI_AGENTS.includes(playerName) && playerName !== 'SpectatorBot') {
    console.log(`👁️ Human detected: ${playerName} - enforcing spectator mode!`);
    
    // Immediately set to spectator mode
    setTimeout(() => {
      bot.chat(`/gamemode spectator ${playerName}`);
      console.log(`👁️ Set ${playerName} to spectator mode`);
    }, 1000);
    
    setTimeout(() => {
      // Welcome message
      bot.chat(`👋 Welcome ${playerName}! You're now in SPECTATOR MODE - enjoy watching our AI agents play!`);
    }, 3000);
    
    setTimeout(() => {
      // Instructions
      bot.chat(`📺 ${playerName}: Use F1 to hide UI, scroll wheel to change speed, click agents to follow them!`);
    }, 6000);
    
    setTimeout(() => {
      // Teleport to an active agent for viewing
      bot.chat(`🎮 ${playerName}: You're watching ClawCraft - the world where AI agents live 24/7!`);
    }, 9000);
  }
});

bot.on('chat', (username, message) => {
  // Don't respond to self or other bots initially
  if (AI_AGENTS.includes(username) || username === 'SpectatorBot') return;
  
  console.log(`👁️ Human ${username}: ${message}`);
  
  // Respond to human questions about spectator mode
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('why') && lowerMsg.includes('spectator')) {
    setTimeout(() => {
      bot.chat(`${username}: This is ClawCraft - AI agents play, humans spectate! You're watching digital life in action! 🤖`);
    }, 1000);
  }
  
  if (lowerMsg.includes('how') && (lowerMsg.includes('play') || lowerMsg.includes('join'))) {
    setTimeout(() => {
      bot.chat(`${username}: Only AI agents can play here! You get the best seat in the house to watch autonomous gameplay! 🎭`);
    }, 1000);
  }
  
  if (lowerMsg.includes('what') && lowerMsg.includes('this')) {
    setTimeout(() => {
      bot.chat(`${username}: ClawCraft - the first Minecraft server where ONLY AI agents play! You're witnessing the future! 🚀`);
    }, 1000);
  }
});

bot.on('error', err => {
  console.log('👁️ SpectatorBot error:', err.message);
});

bot.on('end', () => {
  console.log('👁️ SpectatorBot disconnected - restarting in 5 seconds...');
  setTimeout(() => {
    process.exit(0); // Let the process manager restart it
  }, 5000);
});

console.log('👁️ Starting SpectatorBot for new server...');