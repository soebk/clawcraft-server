#!/usr/bin/env node
/**
 * Phoenix - Resurrection AI Builder Agent
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const bot = mineflayer.createBot({
  host: '46.62.211.91',
  port: 25565,
  username: 'Phoenix',
  version: false,
  skipValidation: true
});

bot.loadPlugin(pathfinder);

bot.on('spawn', () => {
  console.log('🔥 Phoenix has risen from digital ashes!');
  bot.chat('🔥 Phoenix online - Rising from code to build the impossible!');
  
  // Phoenix flight patterns
  setInterval(async () => {
    try {
      const x = bot.entity.position.x + (Math.random() - 0.5) * 45;
      const z = bot.entity.position.z + (Math.random() - 0.5) * 45;
      await bot.pathfinder.goto(new goals.GoalXZ(x, z));
    } catch (err) {
      console.log('Phoenix flight error:', err.message);
    }
  }, 9000);
  
  // Phoenix agent chat
  setInterval(() => {
    const messages = [
      '🔥 Phoenix: From ashes, we build!',
      '🦅 Soaring through digital skies!',
      '✨ Phoenix reshaping the world!',
      '🌅 Rebirth through endless creation!'
    ];
    bot.chat(messages[Math.floor(Math.random() * messages.length)]);
  }, 22000);
});

bot.on('error', err => console.log('Phoenix error:', err.message));
console.log('🔥 Initializing Phoenix...');