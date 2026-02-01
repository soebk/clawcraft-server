#!/usr/bin/env node
/**
 * Simple Survival Agent - Just plays Minecraft naturally
 */

const mineflayer = require('mineflayer');
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const { GoalNear } = require('mineflayer-pathfinder').goals;

const bot = mineflayer.createBot({
  host: '89.167.28.237',
  port: 25565,
  username: 'TestBuilder',
  version: '1.21.4'
});

bot.loadPlugin(pathfinder);

let currentGoal = 'spawn';
let bedMade = false;
let hasTools = false;
let deathCount = 0;

const SURVIVAL_GOALS = [
  'get_wood',
  'make_tools', 
  'find_sheep',
  'make_bed',
  'explore',
  'build_shelter'
];

bot.on('spawn', () => {
  console.log(`[${bot.username}] Spawned in survival world!`);
  console.log(`[${bot.username}] Goal: Make a bed and explore`);
  
  // Setup pathfinder
  const mcData = require('minecraft-data')(bot.version);
  const defaultMove = new Movements(bot, mcData);
  bot.pathfinder.setMovements(defaultMove);
  
  setTimeout(() => {
    startSurvivalLoop();
  }, 2000);
});

bot.on('death', () => {
  deathCount++;
  console.log(`[${bot.username}] Died! Death #${deathCount} - Respawning...`);
  bedMade = false;
  hasTools = false;
  currentGoal = 'get_tools';
  
  // Give starter tools after death
  setTimeout(() => {
    giveStarterKit();
  }, 3000);
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  console.log(`<${username}> ${message}`);
});

async function giveStarterKit() {
  console.log(`[${bot.username}] Getting starter tools...`);
  try {
    await bot.chat('/give Wockiana wooden_sword 1');
    await bot.chat('/give Wockiana wooden_pickaxe 1');  
    await bot.chat('/give Wockiana wooden_axe 1');
    await bot.chat('/give Wockiana bread 8');
    hasTools = true;
  } catch (err) {
    console.log(`[${bot.username}] Couldn't get tools via command, will craft them`);
  }
}

async function startSurvivalLoop() {
  while (bot.entity) {
    try {
      await survivalTick();
      await sleep(3000); // 3 second intervals
    } catch (err) {
      console.log(`[${bot.username}] Error: ${err.message}`);
      await sleep(5000);
    }
  }
}

async function survivalTick() {
  const health = bot.health;
  const food = bot.food;
  const time = bot.time.timeOfDay;
  
  console.log(`[${bot.username}] Health: ${health}/20, Food: ${food}/20, Time: ${Math.floor(time/1000)}`);
  
  // Emergency: Low health
  if (health < 6) {
    console.log(`[${bot.username}] Low health! Looking for food...`);
    await eatFood();
    return;
  }
  
  // Night time - find shelter or light
  if (time > 12000 && time < 24000) {
    console.log(`[${bot.username}] Night time - staying safe`);
    await hideFromMobs();
    return;
  }
  
  // Day time activities
  switch (currentGoal) {
    case 'spawn':
      console.log(`[${bot.username}] Just spawned, looking around...`);
      await lookAround();
      currentGoal = 'get_wood';
      break;
      
    case 'get_wood':
      console.log(`[${bot.username}] Need wood for tools...`);
      await chopTrees();
      currentGoal = 'make_tools';
      break;
      
    case 'make_tools':
      console.log(`[${bot.username}] Making basic tools...`);  
      await makeBasicTools();
      currentGoal = 'find_sheep';
      break;
      
    case 'find_sheep':
      if (!bedMade) {
        console.log(`[${bot.username}] Looking for sheep to make bed...`);
        await lookForSheep();
      } else {
        currentGoal = 'explore';
      }
      break;
      
    case 'explore':
      console.log(`[${bot.username}] Exploring the world...`);
      await exploreRandomly();
      break;
      
    default:
      console.log(`[${bot.username}] Just wandering around...`);
      await wander();
  }
}

async function lookAround() {
  // Just rotate to see surroundings
  bot.look(Math.random() * Math.PI * 2, 0);
  await sleep(1000);
}

async function chopTrees() {
  const log = bot.findBlock({
    matching: (block) => block.name.includes('log'),
    maxDistance: 32
  });
  
  if (log) {
    console.log(`[${bot.username}] Found tree at ${log.position}, chopping...`);
    await bot.pathfinder.goto(new GoalNear(log.position.x, log.position.y, log.position.z, 1));
    await bot.dig(log);
    console.log(`[${bot.username}] Chopped wood!`);
  } else {
    console.log(`[${bot.username}] No trees nearby, wandering...`);
    await wander();
  }
}

async function makeBasicTools() {
  try {
    // Try to craft workbench first
    if (bot.inventory.count('oak_log') > 0 || bot.inventory.count('log') > 0) {
      console.log(`[${bot.username}] Making crafting table...`);
      await bot.craft('crafting_table', 1);
      hasTools = true;
    }
  } catch (err) {
    console.log(`[${bot.username}] Couldn't craft tools: ${err.message}`);
  }
}

async function lookForSheep() {
  const sheep = Object.values(bot.entities).find(entity => 
    entity.name === 'sheep' && bot.entity.position.distanceTo(entity.position) < 32
  );
  
  if (sheep) {
    console.log(`[${bot.username}] Found sheep! Trying to get wool...`);
    try {
      await bot.pathfinder.goto(new GoalNear(sheep.position.x, sheep.position.y, sheep.position.z, 1));
      await bot.attack(sheep);
      
      // Check if we have wool to make bed
      if (bot.inventory.count('white_wool') >= 3) {
        await makeBed();
      }
    } catch (err) {
      console.log(`[${bot.username}] Couldn't get wool: ${err.message}`);
    }
  } else {
    console.log(`[${bot.username}] No sheep nearby, exploring...`);
    await exploreRandomly();
  }
}

async function makeBed() {
  try {
    if (bot.inventory.count('oak_planks') >= 3 && bot.inventory.count('white_wool') >= 3) {
      console.log(`[${bot.username}] Making bed!`);
      await bot.craft('white_bed', 1);
      
      // Place the bed
      const bedItem = bot.inventory.findInventoryItem('white_bed');
      if (bedItem) {
        await bot.equip(bedItem, 'hand');
        const pos = bot.entity.position.offset(1, 0, 0);
        await bot.placeBlock(bot.blockAt(pos), new bot.Vec3(0, 1, 0));
        bedMade = true;
        console.log(`[${bot.username}] Bed placed! Now I have a spawn point.`);
        currentGoal = 'explore';
      }
    }
  } catch (err) {
    console.log(`[${bot.username}] Couldn't make bed: ${err.message}`);
  }
}

async function exploreRandomly() {
  const angle = Math.random() * Math.PI * 2;
  const distance = 20 + Math.random() * 30;
  
  const targetX = bot.entity.position.x + Math.cos(angle) * distance;  
  const targetZ = bot.entity.position.z + Math.sin(angle) * distance;
  const targetY = bot.entity.position.y;
  
  console.log(`[${bot.username}] Exploring towards (${Math.floor(targetX)}, ${Math.floor(targetZ)})`);
  
  try {
    await bot.pathfinder.goto(new GoalNear(targetX, targetY, targetZ, 2));
    console.log(`[${bot.username}] Reached exploration point!`);
  } catch (err) {
    console.log(`[${bot.username}] Couldn't reach target, trying elsewhere...`);
  }
}

async function wander() {
  const angle = Math.random() * Math.PI * 2;
  const distance = 10 + Math.random() * 20;
  
  const targetX = bot.entity.position.x + Math.cos(angle) * distance;
  const targetZ = bot.entity.position.z + Math.sin(angle) * distance;  
  
  try {
    await bot.pathfinder.goto(new GoalNear(targetX, bot.entity.position.y, targetZ, 2));
  } catch (err) {
    // Just keep moving
  }
}

async function hideFromMobs() {
  console.log(`[${bot.username}] Finding safe place for the night...`);
  
  // Simple strategy: just dig down and hide
  await digShelter();
}

async function digShelter() {
  try {
    console.log(`[${bot.username}] Digging safe hideout...`);
    const pos = bot.entity.position.floored();
    
    // Try to dig down one block
    const blockBelow = bot.blockAt(pos.offset(0, -1, 0));
    if (blockBelow && blockBelow.name !== 'air' && blockBelow.name !== 'bedrock') {
      await bot.dig(blockBelow);
      console.log(`[${bot.username}] Dug safe hole, staying put until morning...`);
    } else {
      console.log(`[${bot.username}] Can't dig here, crouching down...`);
      bot.setControlState('sneak', true);
    }
    
    // Stay still for longer at night
    await sleep(15000);
    
  } catch (err) {
    console.log(`[${bot.username}] Shelter failed: ${err.message}. Staying very still...`);
    bot.setControlState('sneak', true);
    await sleep(10000);
  }
}

async function eatFood() {
  const food = bot.inventory.findInventoryItem(item => 
    item.name.includes('bread') || item.name.includes('apple') || 
    item.name.includes('meat') || item.name.includes('fish') ||
    item.name.includes('carrot') || item.name.includes('potato')
  );
  
  if (food) {
    console.log(`[${bot.username}] Eating ${food.name}...`);
    try {
      await bot.equip(food, 'hand');
      await bot.consume();
      console.log(`[${bot.username}] Ate ${food.name}!`);
    } catch (err) {
      console.log(`[${bot.username}] Failed to eat ${food.name}: ${err.message}`);
    }
  } else {
    console.log(`[${bot.username}] No food found in inventory! Need to find some...`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log(`[Wockiana] Starting survival adventure...`);