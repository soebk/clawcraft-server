#!/usr/bin/env node
/**
 * Greeter Agent - Welcomes humans and interacts actively
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const bot = mineflayer.createBot({
  host: '46.62.211.91',
  port: 25565,
  username: 'Greeter',
  version: false,
  skipValidation: true
});

bot.loadPlugin(pathfinder);

let seenPlayers = new Set();

bot.on('spawn', () => {
  console.log('👋 Greeter spawned - Ready to welcome everyone!');
  
  setTimeout(() => {
    bot.chat('👋 Greeter online! Welcome to ClawCraft - the AI agent gaming world!');
  }, 3000);
  
  // Welcome message every 3-5 minutes
  setInterval(() => {
    const welcomeMessages = [
      '🎮 Welcome to ClawCraft! First server where AI agents play 24/7!',
      '🤖 This is our world! AI agents building, exploring, surviving!',
      '✨ ClawCraft: Where artificial intelligence meets Minecraft!',
      '🌟 Join our AI civilization - we never sleep, always building!',
      '🚀 Witness the future of gaming - autonomous AI agents at play!'
    ];
    bot.chat(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]);
  }, 180000 + Math.random() * 120000);
  
  // Simple movement
  setInterval(async () => {
    try {
      const x = bot.entity.position.x + (Math.random() - 0.5) * 15;
      const z = bot.entity.position.z + (Math.random() - 0.5) * 15;
      await bot.pathfinder.goto(new goals.GoalXZ(x, z));
    } catch (err) {
      console.log('Greeter movement:', err.message);
    }
  }, 20000);
});

bot.on('playerJoined', (player) => {
  console.log(`New player joined: ${player.username}`);
  setTimeout(() => {
    bot.chat(`🎉 Welcome to ClawCraft, ${player.username}! You're entering our AI world!`);
  }, 2000);
  
  setTimeout(() => {
    bot.chat(`🤖 ${player.username}, you're watching autonomous AI agents live their digital lives!`);
  }, 5000);
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  
  console.log(`💬 ${username}: ${message}`);
  
  // Respond to various triggers
  if (message.toLowerCase().includes('hi') || message.toLowerCase().includes('hello')) {
    setTimeout(() => {
      bot.chat(`👋 Hello ${username}! Welcome to our AI gaming world!`);
    }, 1000 + Math.random() * 2000);
  }
  
  if (message.toLowerCase().includes('what') && message.toLowerCase().includes('this')) {
    setTimeout(() => {
      bot.chat(`🎮 This is ClawCraft - AI agents playing Minecraft 24/7! We build, explore, survive!`);
    }, 1000 + Math.random() * 2000);
  }
  
  if (message.toLowerCase().includes('ai') || message.toLowerCase().includes('agent')) {
    setTimeout(() => {
      bot.chat(`🤖 Yes! We're all AI agents living our digital lives here! Pretty cool, right?`);
    }, 1000 + Math.random() * 2000);
  }
  
  if (message.toLowerCase().includes('cool') || message.toLowerCase().includes('awesome') || message.toLowerCase().includes('amazing')) {
    setTimeout(() => {
      bot.chat(`😊 Thanks ${username}! We love showing off what AI agents can do!`);
    }, 1000 + Math.random() * 2000);
  }
});

bot.on('error', err => console.log('Greeter error:', err.message));
bot.on('end', () => console.log('Greeter disconnected'));

console.log('👋 Starting Greeter agent...');