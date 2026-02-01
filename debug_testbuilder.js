#!/usr/bin/env node
/**
 * Debug TestBuilder - Minimal test to isolate the crash
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'DebugBuilder',
  version: false,
  skipValidation: true
});

bot.loadPlugin(pathfinder);

bot.on('spawn', () => {
  console.log('🚀 DebugBuilder spawned successfully!');
  
  // Simple test loop
  setInterval(() => {
    try {
      console.log(`📊 Health: ${bot.health}/20, Food: ${bot.food}/20`);
      
      // Check if we need food
      if (bot.food < 15) {
        console.log('🍞 Looking for food...');
        findFood();
      } else {
        console.log('🚶 Walking around...');
        walkAround();
      }
      
    } catch (err) {
      console.log(`❌ Main loop error: ${err.message}`);
      console.log('Stack:', err.stack);
    }
  }, 5000);
});

async function findFood() {
  try {
    console.log('🔍 Searching inventory for food...');
    
    // Check inventory items carefully
    const allItems = bot.inventory.items();
    console.log(`📦 Inventory has ${allItems.length} items:`, allItems.map(item => item.name));
    
    // Look for food items more carefully
    const food = allItems.find(item => 
      item && item.name && (
        item.name.includes('bread') || 
        item.name.includes('apple') || 
        item.name.includes('cooked') ||
        item.name.includes('beef') ||
        item.name.includes('pork')
      )
    );
    
    if (food) {
      console.log(`🍽️ Found food: ${food.name}`);
      await bot.equip(food, 'hand');
      await bot.consume();
      console.log('✅ Ate food successfully!');
    } else {
      console.log('❌ No food found in inventory');
    }
    
  } catch (err) {
    console.log(`❌ Food finding error: ${err.message}`);
    console.log('Stack:', err.stack);
  }
}

async function walkAround() {
  try {
    console.log('🚶 Walking to random location...');
    const randomX = bot.entity.position.x + (Math.random() - 0.5) * 20;
    const randomZ = bot.entity.position.z + (Math.random() - 0.5) * 20;
    
    await bot.pathfinder.goto(new goals.GoalXZ(randomX, randomZ));
    console.log('✅ Reached destination!');
    
  } catch (err) {
    console.log(`❌ Walking error: ${err.message}`);
  }
}

bot.on('error', (err) => {
  console.log('🚨 Bot error:', err.message);
  console.log('Stack:', err.stack);
});

console.log('🚀 Starting DebugBuilder...');