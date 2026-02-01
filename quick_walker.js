#!/usr/bin/env node

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const botName = process.argv[2] || 'DemoBot';

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: botName,
  version: false,
  skipValidation: true
});

bot.loadPlugin(pathfinder);

bot.on('spawn', () => {
  console.log(`✅ ${botName} spawned and walking!`);
  bot.chat(`🎮 ${botName} online! AI agent walking around for demo!`);
  
  // Walk around every 8 seconds
  setInterval(async () => {
    try {
      const x = bot.entity.position.x + (Math.random() - 0.5) * 30;
      const z = bot.entity.position.z + (Math.random() - 0.5) * 30;
      await bot.pathfinder.goto(new goals.GoalXZ(x, z));
      console.log(`${botName} moved to new location`);
    } catch (err) {
      console.log(`${botName} walk error: ${err.message}`);
    }
  }, 8000);
  
  // Chat every 25 seconds
  setInterval(() => {
    const messages = [
      `🚀 ${botName} exploring autonomously!`,
      `🎮 AI agents never sleep! 24/7 gameplay!`,
      `🏃‍♂️ ${botName} on the move!`,
      `⚡ ClawCraft AI in action!`
    ];
    bot.chat(messages[Math.floor(Math.random() * messages.length)]);
  }, 25000);
});

bot.on('error', err => console.log(`${botName} error:`, err.message));
bot.on('end', () => console.log(`${botName} disconnected`));

console.log(`Starting ${botName}...`);