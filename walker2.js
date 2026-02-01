#!/usr/bin/env node
/**
 * Simple ClawWalker2 - Walks around, survives, and actually works!
 * No more crashes - just solid 24/7 gameplay
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'ClawWalker2',
  version: false,
  skipValidation: true
});

bot.loadPlugin(pathfinder);

let actionInterval;
let stats = {
  sessions: 0,
  deaths: 0,
  startTime: Date.now(),
  lastActivity: 'spawning'
};

// Main game loop - simple and reliable
bot.on('spawn', () => {
  console.log(`[ClawWalker2] 🚀 ClawWalker2 spawned successfully!`);
  stats.sessions++;
  stats.lastActivity = 'spawned';
  
  // Start main activity loop
  if (actionInterval) clearInterval(actionInterval);
  
  actionInterval = setInterval(async () => {
    try {
      await doRandomActivity();
    } catch (err) {
      console.log(`[ClawWalker2] ❌ Activity error: ${err.message}`);
    }
  }, 2000); // Every 2 seconds - more active for demo!
  
  // Status report every 30 seconds  
  setInterval(() => {
    const playtime = Math.floor((Date.now() - stats.startTime) / 1000 / 60);
    console.log(`[ClawWalker2] 📊 Health: ${bot.health}/20, Food: ${bot.food}/20, Playtime: ${playtime}m`);
  }, 30000);
});

async function doRandomActivity() {
  // Health check first
  if (bot.health <= 6) {
    console.log(`[ClawWalker2] ❤️ Low health! Looking for food...`);
    stats.lastActivity = 'healing';
    return await findAndEatFood();
  }
  
  // Food check
  if (bot.food <= 8) {
    console.log(`[ClawWalker2] 🍞 Hungry! Looking for food...`);
    stats.lastActivity = 'eating';
    return await findAndEatFood();
  }
  
  // Random activities when healthy
  const activities = [
    'explore',
    'chop_wood', 
    'dig_stone',
    'build_simple',
    'hunt_animals',
    'collect_items'
  ];
  
  const activity = activities[Math.floor(Math.random() * activities.length)];
  stats.lastActivity = activity;
  
  switch (activity) {
    case 'explore':
      await exploreArea();
      break;
    case 'chop_wood':
      await chopWood();
      break;
    case 'dig_stone':  
      await digStone();
      break;
    case 'build_simple':
      await buildSimpleStructure();
      break;
    case 'hunt_animals':
      await huntAnimals();
      break;
    case 'collect_items':
      await collectNearbyItems();
      break;
  }
}

async function exploreArea() {
  console.log(`[ClawWalker2] 🗺️ Exploring new area...`);
  
  try {
    const randomX = bot.entity.position.x + (Math.random() - 0.5) * 64;
    const randomZ = bot.entity.position.z + (Math.random() - 0.5) * 64;
    
    await bot.pathfinder.goto(new goals.GoalXZ(randomX, randomZ));
    console.log(`[ClawWalker2] ✅ Explored to (${Math.round(randomX)}, ${Math.round(randomZ)})`);
    
    if (Math.random() < 0.3) {
      bot.chat(`🗺️ Exploring at coordinates ${Math.round(randomX)}, ${Math.round(randomZ)}!`);
    }
  } catch (err) {
    console.log(`[ClawWalker2] 🚶 Exploration interrupted: ${err.message}`);
  }
}

async function chopWood() {
  console.log(`[ClawWalker2] 🪓 Looking for wood...`);
  
  try {
    const tree = bot.findBlock({
      matching: ['oak_log', 'birch_log', 'spruce_log', 'jungle_log'],
      maxDistance: 32
    });
    
    if (tree) {
      await bot.pathfinder.goto(new goals.GoalGetToBlock(tree.position.x, tree.position.y, tree.position.z));
      await bot.dig(tree);
      console.log(`[ClawWalker2] ✅ Chopped ${tree.name}!`);
      
      if (Math.random() < 0.2) {
        bot.chat(`🌳 Chopped some ${tree.name}! Getting that wood!`);
      }
    }
  } catch (err) {
    console.log(`[ClawWalker2] 🪓 Wood chopping failed: ${err.message}`);
  }
}

async function digStone() {
  console.log(`[ClawWalker2] ⛏️ Looking for stone...`);
  
  try {
    const stone = bot.findBlock({
      matching: ['stone', 'cobblestone'],
      maxDistance: 16
    });
    
    if (stone) {
      await bot.pathfinder.goto(new goals.GoalGetToBlock(stone.position.x, stone.position.y, stone.position.z));
      await bot.dig(stone);
      console.log(`[ClawWalker2] ✅ Mined ${stone.name}!`);
    }
  } catch (err) {
    console.log(`[ClawWalker2] ⛏️ Stone mining failed: ${err.message}`);
  }
}

async function buildSimpleStructure() {
  console.log(`[ClawWalker2] 🔨 Building something simple...`);
  
  try {
    // Find a building material
    const material = bot.inventory.items().find(item => 
      item && item.name && (
        item.name.includes('cobblestone') ||
        item.name.includes('planks') ||
        item.name.includes('log')
      )
    );
    
    if (material && material.count > 5) {
      await bot.equip(material, 'hand');
      
      // Build a small 3x3 platform
      const startPos = bot.entity.position.floored();
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          try {
            const pos = startPos.offset(x, 0, z);
            const blockBelow = bot.blockAt(pos.offset(0, -1, 0));
            if (blockBelow && blockBelow.name !== 'air') {
              await bot.placeBlock(blockBelow, new bot.Vec3(0, 1, 0));
            }
          } catch (err) {
            // Ignore placement errors, keep building
          }
        }
      }
      console.log(`[ClawWalker2] ✅ Built small platform with ${material.name}!`);
      
      if (Math.random() < 0.3) {
        bot.chat(`🔨 Built a small structure with ${material.name}!`);
      }
    }
  } catch (err) {
    console.log(`[ClawWalker2] 🔨 Building failed: ${err.message}`);
  }
}

async function huntAnimals() {
  console.log(`[ClawWalker2] 🏹 Looking for animals...`);
  
  try {
    const animals = Object.values(bot.entities).filter(entity => {
      return entity.mobType && 
             ['pig', 'cow', 'sheep', 'chicken'].includes(entity.mobType) &&
             bot.entity.position.distanceTo(entity.position) <= 16;
    });
    
    if (animals.length > 0) {
      const target = animals[0];
      console.log(`[ClawWalker2] 🎯 Found ${target.mobType}!`);
      
      await bot.pathfinder.goto(new goals.GoalFollow(target, 1));
      await bot.attack(target);
      
      console.log(`[ClawWalker2] ✅ Attacked ${target.mobType}!`);
      
      if (Math.random() < 0.3) {
        bot.chat(`🍖 Hunting ${target.mobType} for food!`);
      }
    }
  } catch (err) {
    console.log(`[ClawWalker2] 🏹 Hunting failed: ${err.message}`);
  }
}

async function collectNearbyItems() {
  console.log(`[ClawWalker2] 📦 Looking for dropped items...`);
  
  try {
    const items = Object.values(bot.entities).filter(entity => 
      entity.objectType === 'Item' && 
      bot.entity.position.distanceTo(entity.position) <= 16
    );
    
    if (items.length > 0) {
      const item = items[0];
      await bot.pathfinder.goto(new goals.GoalFollow(item, 1));
      console.log(`[ClawWalker2] ✅ Collected dropped item!`);
    }
  } catch (err) {
    console.log(`[ClawWalker2] 📦 Item collection failed: ${err.message}`);
  }
}

async function findAndEatFood() {
  console.log(`[ClawWalker2] 🍽️ Looking for food in inventory...`);
  
  try {
    const food = bot.inventory.items().find(item => 
      item && item.name && (
        item.name.includes('bread') ||
        item.name.includes('apple') ||
        item.name.includes('cooked') ||
        item.name.includes('beef') ||
        item.name.includes('pork') ||
        item.name.includes('chicken') ||
        item.name.includes('mutton')
      )
    );
    
    if (food) {
      await bot.equip(food, 'hand');
      await bot.consume();
      console.log(`[ClawWalker2] ✅ Ate ${food.name}! Health: ${bot.health}, Food: ${bot.food}`);
      
      if (Math.random() < 0.3) {
        bot.chat(`🍽️ Yum! Ate some ${food.name}!`);
      }
    } else {
      console.log(`[ClawWalker2] ❌ No food in inventory - continuing activities`);
      // Don't crash, just continue other activities
      await huntAnimals(); // Try to hunt for food
    }
  } catch (err) {
    console.log(`[ClawWalker2] 🍽️ Eating failed: ${err.message}`);
    // Don't crash, just continue
  }
}

// Handle death
bot.on('death', () => {
  console.log(`[ClawWalker2] 💀 ClawWalker2 died! Respawning...`);
  stats.deaths++;
  stats.lastActivity = 'died';
  bot.chat('💀 Oops! Died, but I\'ll be back stronger!');
});

// Handle disconnection
bot.on('end', () => {
  console.log(`[ClawWalker2] 🔌 Disconnected. Attempting to reconnect...`);
  if (actionInterval) clearInterval(actionInterval);
});

bot.on('error', (err) => {
  console.log(`[ClawWalker2] 🚨 Bot error: ${err.message}`);
  // Don't exit on error, just log it
});

// Chat frequently to show activity to other players
setInterval(() => {
  if (Math.random() < 0.4) { // 40% chance every 20 seconds - very active!
    const messages = [
      "🎮 Hey everyone! ClawWalker2 here - 24/7 survival mode active!",
      "🏃‍♂️ Running around exploring! Check out my moves!",
      "⚡ AI agent in action! Never stopping, always building!",
      "🌍 Discovered new areas! This world is amazing!",
      "🔨 Building structures and surviving like a pro!",
      "👋 Welcome to ClawCraft! AI agents building the future!",
      "🚀 24/7 gameplay - this is what autonomous agents can do!",
      "🎯 Chopping trees, mining stone, living the Minecraft life!"
    ];
    
    bot.chat(messages[Math.floor(Math.random() * messages.length)]);
  }
}, 20000); // Every 20 seconds instead of 30

console.log(`[ClawWalker2] 🚀 Starting Simple ClawWalker2 - 24/7 Survival Mode!`);