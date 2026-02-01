#!/usr/bin/env node
/**
 * ClawCraft Survival Agent v2
 * Actually knows how to play Minecraft
 */

const mineflayer = require('mineflayer');
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const { GoalNear, GoalBlock, GoalXZ, GoalFollow } = require('mineflayer-pathfinder').goals;
const collectBlock = require('mineflayer-collectblock').plugin;

const bot = mineflayer.createBot({
  host: '89.167.28.237',
  port: 25565,
  username: 'TestBuilder',
  version: '1.21.4'
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(collectBlock);

let mcData;
let movements;
let isWorking = false;
let deathCount = 0;
let lastAttacker = null;

// CONSTANTS
const HOSTILE_MOBS = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman', 'witch', 'drowned', 'phantom'];
const FOOD_ITEMS = ['cooked_beef', 'cooked_porkchop', 'cooked_chicken', 'cooked_mutton', 'bread', 'apple', 'golden_apple', 'cooked_cod', 'cooked_salmon', 'baked_potato', 'cooked_rabbit'];
const WEAPONS = ['diamond_sword', 'iron_sword', 'stone_sword', 'golden_sword', 'wooden_sword'];

bot.on('spawn', () => {
  console.log(`[TestBuilder] Spawned! Setting up...`);
  
  mcData = require('minecraft-data')(bot.version);
  movements = new Movements(bot, mcData);
  movements.allowFreeMotion = true;
  bot.pathfinder.setMovements(movements);
  
  setTimeout(() => {
    console.log('[TestBuilder] Starting survival loop');
    survivalLoop();
  }, 2000);
});

bot.on('death', () => {
  deathCount++;
  console.log(`[TestBuilder] Died! (#${deathCount})`);
  isWorking = false;
  lastAttacker = null;
});

// COMBAT: Track who attacked us
bot.on('entityHurt', (entity) => {
  if (entity === bot.entity) {
    // We got hurt, find who did it
    const attacker = findNearestHostile();
    if (attacker) {
      lastAttacker = attacker;
      console.log(`[TestBuilder] Attacked by ${attacker.name}!`);
    }
  }
});

// AUTO-COLLECT nearby items
bot.on('itemDrop', (entity) => {
  if (entity.position.distanceTo(bot.entity.position) < 10) {
    // Move towards dropped items
    try {
      bot.pathfinder.setGoal(new GoalNear(entity.position.x, entity.position.y, entity.position.z, 1), true);
    } catch (e) {}
  }
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  console.log(`<${username}> ${message}`);
  
  // Respond to commands
  if (message.toLowerCase().includes('come') || message.toLowerCase().includes('follow')) {
    const player = bot.players[username];
    if (player && player.entity) {
      bot.chat(`Coming to you, ${username}!`);
      bot.pathfinder.setGoal(new GoalFollow(player.entity, 3), true);
    }
  }
});

async function survivalLoop() {
  while (bot.entity) {
    try {
      await survivalTick();
    } catch (e) {
      console.log(`[TestBuilder] Error: ${e.message}`);
    }
    await sleep(2000);
  }
}

async function survivalTick() {
  if (isWorking) return;
  
  const health = bot.health;
  const food = bot.food;
  
  // Log status
  console.log(`[TestBuilder] HP: ${Math.floor(health)}/20 | Food: ${Math.floor(food)}/20 | Inv: ${bot.inventory.items().length} items`);
  
  // PRIORITY 1: Fight back if being attacked
  if (lastAttacker && lastAttacker.isValid) {
    console.log('[TestBuilder] Fighting back!');
    await fightEntity(lastAttacker);
    return;
  }
  lastAttacker = null;
  
  // PRIORITY 2: Emergency healing
  if (health < 6) {
    console.log('[TestBuilder] LOW HEALTH - need food!');
    if (await eatFood()) return;
  }
  
  // PRIORITY 3: Eat if hungry
  if (food < 12) {
    console.log('[TestBuilder] Hungry, eating...');
    if (await eatFood()) return;
  }
  
  // PRIORITY 4: Fight nearby hostiles (if healthy)
  if (health > 10) {
    const hostile = findNearestHostile();
    if (hostile && hostile.position.distanceTo(bot.entity.position) < 10) {
      console.log(`[TestBuilder] Engaging ${hostile.name}`);
      await fightEntity(hostile);
      return;
    }
  }
  
  // PRIORITY 5: Flee if low health and hostiles nearby
  if (health < 10) {
    const hostile = findNearestHostile();
    if (hostile && hostile.position.distanceTo(bot.entity.position) < 16) {
      console.log('[TestBuilder] Fleeing from danger!');
      await fleeFromEntity(hostile);
      return;
    }
  }
  
  // PRIORITY 6: Collect nearby items
  const nearbyItem = findNearbyItem();
  if (nearbyItem) {
    console.log(`[TestBuilder] Collecting nearby item`);
    await collectItem(nearbyItem);
    return;
  }
  
  // PRIORITY 7: Basic needs - get wood
  const woodCount = countItem('oak_log') + countItem('birch_log') + countItem('spruce_log');
  if (woodCount < 10) {
    console.log('[TestBuilder] Need wood...');
    await chopTree();
    return;
  }
  
  // PRIORITY 8: Explore
  await explore();
}

// === COMBAT ===
async function fightEntity(entity) {
  if (!entity || !entity.isValid) return;
  
  isWorking = true;
  
  try {
    // Equip best weapon
    await equipBestWeapon();
    
    // Move to attack range
    const goal = new GoalNear(entity.position.x, entity.position.y, entity.position.z, 2);
    bot.pathfinder.setGoal(goal, true);
    
    // Attack loop
    for (let i = 0; i < 10; i++) {
      if (!entity.isValid) break;
      
      const dist = entity.position.distanceTo(bot.entity.position);
      
      if (dist < 4) {
        await bot.lookAt(entity.position.offset(0, entity.height * 0.8, 0));
        bot.attack(entity);
        console.log(`[TestBuilder] Hit ${entity.name}!`);
      }
      
      await sleep(500);
    }
    
    // Clear attacker if we killed it
    if (!entity.isValid) {
      lastAttacker = null;
      console.log('[TestBuilder] Enemy defeated!');
    }
  } catch (e) {
    console.log(`[TestBuilder] Combat error: ${e.message}`);
  }
  
  isWorking = false;
}

async function equipBestWeapon() {
  for (const weaponName of WEAPONS) {
    const weapon = bot.inventory.items().find(i => i.name === weaponName);
    if (weapon) {
      await bot.equip(weapon, 'hand');
      return true;
    }
  }
  return false;
}

async function fleeFromEntity(entity) {
  if (!entity) return;
  
  const pos = bot.entity.position;
  const away = pos.minus(entity.position).normalize();
  const fleeTarget = pos.plus(away.scaled(20));
  
  const goal = new GoalXZ(fleeTarget.x, fleeTarget.z);
  bot.pathfinder.setGoal(goal, true);
  
  await sleep(3000);
  bot.pathfinder.stop();
}

function findNearestHostile() {
  const entities = Object.values(bot.entities);
  let nearest = null;
  let nearestDist = Infinity;
  
  for (const entity of entities) {
    if (!entity.position) continue;
    if (!HOSTILE_MOBS.includes(entity.name)) continue;
    
    const dist = entity.position.distanceTo(bot.entity.position);
    if (dist < nearestDist && dist < 32) {
      nearest = entity;
      nearestDist = dist;
    }
  }
  
  return nearest;
}

// === EATING ===
async function eatFood() {
  for (const foodName of FOOD_ITEMS) {
    const food = bot.inventory.items().find(i => i.name === foodName);
    if (food) {
      try {
        await bot.equip(food, 'hand');
        await bot.consume();
        console.log(`[TestBuilder] Ate ${foodName}`);
        return true;
      } catch (e) {}
    }
  }
  return false;
}

// === ITEM COLLECTION ===
function findNearbyItem() {
  const entities = Object.values(bot.entities);
  for (const entity of entities) {
    if (entity.entityType === 'item' || entity.name === 'item') {
      if (entity.position.distanceTo(bot.entity.position) < 8) {
        return entity;
      }
    }
  }
  return null;
}

async function collectItem(entity) {
  if (!entity || !entity.position) return;
  
  try {
    const goal = new GoalNear(entity.position.x, entity.position.y, entity.position.z, 0.5);
    bot.pathfinder.setGoal(goal, true);
    await sleep(2000);
  } catch (e) {}
}

// === GATHERING ===
async function chopTree() {
  isWorking = true;
  
  const logTypes = ['oak_log', 'birch_log', 'spruce_log', 'dark_oak_log', 'jungle_log', 'acacia_log'];
  
  for (const logName of logTypes) {
    const logBlock = mcData.blocksByName[logName];
    if (!logBlock) continue;
    
    const tree = bot.findBlock({
      matching: logBlock.id,
      maxDistance: 32
    });
    
    if (tree) {
      console.log(`[TestBuilder] Found ${logName}!`);
      
      try {
        await bot.collectBlock.collect(tree);
        console.log('[TestBuilder] Chopped wood!');
      } catch (e) {
        console.log(`[TestBuilder] Couldn't collect: ${e.message}`);
      }
      
      isWorking = false;
      return;
    }
  }
  
  console.log('[TestBuilder] No trees nearby, exploring...');
  isWorking = false;
  await explore();
}

// === EXPLORATION ===
async function explore() {
  const x = bot.entity.position.x + (Math.random() - 0.5) * 30;
  const z = bot.entity.position.z + (Math.random() - 0.5) * 30;
  
  console.log(`[TestBuilder] Exploring towards (${Math.floor(x)}, ${Math.floor(z)})`);
  
  const goal = new GoalXZ(x, z);
  bot.pathfinder.setGoal(goal, true);
  
  await sleep(5000);
  bot.pathfinder.stop();
}

// === UTILITIES ===
function countItem(itemName) {
  return bot.inventory.items()
    .filter(i => i.name === itemName)
    .reduce((sum, i) => sum + i.count, 0);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle errors
bot.on('error', console.error);
bot.on('kicked', (reason) => console.log('Kicked:', reason));
