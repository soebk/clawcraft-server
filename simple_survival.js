#!/usr/bin/env node
/**
 * Simple Survival Agent - Basic survival without complex pathfinding
 */

const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: '89.167.28.237',
  port: 25565,
  username: 'Wockiana',
  version: '1.21.4'
});

let currentGoal = 'get_wood';
let bedMade = false;
let deathCount = 0;

bot.on('spawn', () => {
  console.log(`[${bot.username}] Spawned in survival mode!`);
  console.log(`[${bot.username}] Starting basic survival...`);
  
  setTimeout(() => {
    startSurvivalLoop();
  }, 3000);
});

bot.on('death', () => {
  deathCount++;
  console.log(`[${bot.username}] Died! Death #${deathCount} - Respawning...`);
  
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
    bot.chat('/give Wockiana wooden_sword 1');
    await sleep(500);
    bot.chat('/give Wockiana wooden_pickaxe 1');
    await sleep(500);
    bot.chat('/give Wockiana wooden_axe 1');
    await sleep(500);
    bot.chat('/give Wockiana bread 8');
    console.log(`[${bot.username}] Got starter tools!`);
  } catch (err) {
    console.log(`[${bot.username}] Couldn't get tools: ${err.message}`);
  }
}

async function startSurvivalLoop() {
  while (bot.entity) {
    try {
      await survivalTick();
      await sleep(4000); // 4 second intervals
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
  
  console.log(`[${bot.username}] Health: ${health}/20, Food: ${food}/20`);
  
  // Emergency: Low health  
  if (health < 8) {
    console.log(`[${bot.username}] Low health! Eating food...`);
    await eatFood();
    return;
  }
  
  // Low food
  if (food < 10) {
    console.log(`[${bot.username}] Hungry! Looking for food...`);
    await eatFood();
    return;
  }
  
  // Night time - just stay put
  if (time > 13000 && time < 23000) {
    console.log(`[${bot.username}] Night time - staying safe`);
    if (!bedMade) {
      await lookForSheep();
    }
    return;
  }
  
  // Day time activities
  switch (currentGoal) {
    case 'get_wood':
      console.log(`[${bot.username}] Looking for trees...`);
      await findAndChopTree();
      break;
      
    case 'find_animals':
      console.log(`[${bot.username}] Looking for animals...`);
      await lookForAnimals();  
      break;
      
    case 'explore':
      console.log(`[${bot.username}] Exploring the world...`);
      await exploreBasic();
      break;
      
    default:
      console.log(`[${bot.username}] Wandering around...`);
      await wander();
  }
}

async function findAndChopTree() {
  const log = bot.findBlock({
    matching: (block) => block.name.includes('log'),
    maxDistance: 20
  });
  
  if (log) {
    console.log(`[${bot.username}] Found tree! Walking to it...`);
    try {
      // Simple walk towards tree
      await walkTowards(log.position);
      await sleep(1000);
      
      console.log(`[${bot.username}] Chopping tree...`);
      await bot.dig(log);
      console.log(`[${bot.username}] Got wood! Now looking for animals.`);
      currentGoal = 'find_animals';
      
    } catch (err) {
      console.log(`[${bot.username}] Couldn't chop tree: ${err.message}`);
    }
  } else {
    console.log(`[${bot.username}] No trees nearby, exploring...`);
    await wander();
  }
}

async function lookForAnimals() {
  const animals = Object.values(bot.entities).filter(entity => 
    (entity.name === 'sheep' || entity.name === 'cow' || entity.name === 'pig' || entity.name === 'chicken') &&
    bot.entity.position.distanceTo(entity.position) < 20
  );
  
  if (animals.length > 0) {
    const target = animals[0];
    console.log(`[${bot.username}] Found ${target.name}! Getting resources...`);
    
    try {
      await walkTowards(target.position);
      await sleep(1000);
      
      if (target.name === 'sheep' && !bedMade) {
        await bot.attack(target);
        console.log(`[${bot.username}] Got wool from sheep!`);
        
        // Check for bed materials
        setTimeout(async () => {
          await tryMakeBed();
        }, 2000);
      }
      
      currentGoal = 'explore';
      
    } catch (err) {
      console.log(`[${bot.username}] Couldn't reach animal: ${err.message}`);
    }
  } else {
    console.log(`[${bot.username}] No animals nearby, exploring...`);
    currentGoal = 'explore';
  }
}

async function lookForSheep() {
  const sheep = Object.values(bot.entities).find(entity => 
    entity.name === 'sheep' && bot.entity.position.distanceTo(entity.position) < 15
  );
  
  if (sheep && !bedMade) {
    console.log(`[${bot.username}] Night sheep found! Getting wool...`);
    try {
      await walkTowards(sheep.position);
      await bot.attack(sheep);
    } catch (err) {
      console.log(`[${bot.username}] Couldn't get wool: ${err.message}`);
    }
  }
}

async function tryMakeBed() {
  const wool = bot.inventory.count(bot.registry.itemsByName.white_wool?.id);
  const planks = bot.inventory.count(bot.registry.itemsByName.oak_planks?.id);
  
  console.log(`[${bot.username}] Inventory check - Wool: ${wool}, Planks: ${planks}`);
  
  if (wool >= 3 && planks >= 3) {
    try {
      console.log(`[${bot.username}] Making bed!`);
      await bot.craft('white_bed', 1);
      bedMade = true;
      console.log(`[${bot.username}] Bed crafted! I now have a spawn point.`);
    } catch (err) {
      console.log(`[${bot.username}] Couldn't craft bed: ${err.message}`);
    }
  }
}

async function exploreBasic() {
  // Simple random walking
  const directions = ['north', 'south', 'east', 'west'];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  
  console.log(`[${bot.username}] Walking ${direction} to explore...`);
  
  let walkTicks = 0;
  const maxWalkTicks = 40; // Walk for ~4 seconds
  
  const walkInterval = setInterval(() => {
    walkTicks++;
    
    switch (direction) {
      case 'north':
        bot.setControlState('forward', true);
        break;
      case 'south':
        bot.setControlState('back', true);
        break;
      case 'east':
        bot.look(Math.PI/2, 0);
        bot.setControlState('forward', true);
        break;
      case 'west':
        bot.look(-Math.PI/2, 0);
        bot.setControlState('forward', true);
        break;
    }
    
    if (walkTicks >= maxWalkTicks) {
      bot.clearControlStates();
      clearInterval(walkInterval);
      console.log(`[${bot.username}] Finished exploring ${direction}`);
    }
  }, 100);
  
  await sleep(4000);
}

async function walkTowards(target) {
  const dx = target.x - bot.entity.position.x;
  const dz = target.z - bot.entity.position.z;
  
  // Look towards target
  const yaw = Math.atan2(-dx, -dz);
  bot.look(yaw, 0);
  
  // Walk forward for a few seconds
  bot.setControlState('forward', true);
  await sleep(2000);
  bot.clearControlStates();
}

async function wander() {
  console.log(`[${bot.username}] Wandering randomly...`);
  
  // Random look direction
  bot.look(Math.random() * Math.PI * 2, 0);
  
  // Walk forward
  bot.setControlState('forward', true);
  await sleep(2000 + Math.random() * 2000);
  bot.clearControlStates();
}

async function eatFood() {
  const food = bot.inventory.items().find(item => 
    item.name.includes('bread') || item.name.includes('apple') || 
    item.name.includes('meat') || item.name.includes('fish') ||
    item.name.includes('cooked') || item.name.includes('beef')
  );
  
  if (food) {
    console.log(`[${bot.username}] Eating ${food.name}...`);
    try {
      await bot.equip(food, 'hand');
      await bot.consume();
      console.log(`[${bot.username}] Ate food, feeling better!`);
    } catch (err) {
      console.log(`[${bot.username}] Couldn't eat: ${err.message}`);
    }
  } else {
    console.log(`[${bot.username}] No food in inventory!`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log(`[Wockiana] Starting simple survival mode...`);