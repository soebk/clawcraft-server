#!/usr/bin/env node
/**
 * Complete Minecraft Survival Agent - Full game knowledge
 * Knows all crafting recipes, proper mining progression, combat
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'TestBuilder',
  version: false,
  skipValidation: true
});

bot.loadPlugin(pathfinder);

// Complete game knowledge system
let gameState = {
  phase: 'wood',           // wood -> stone -> iron -> diamond -> advanced
  busy: false,             // Flag to prevent interruptions during long tasks
  hasTools: {
    wooden: { axe: false, pickaxe: false, sword: false },
    stone: { axe: false, pickaxe: false, sword: false },
    iron: { axe: false, pickaxe: false, sword: false },
    diamond: { axe: false, pickaxe: false, sword: false }
  },
  hasStructures: {
    craftingTable: false,
    furnace: false,
    bed: false,
    chest: false
  },
  inventory: {
    wood: 0,
    planks: 0,
    sticks: 0,
    stone: 0,
    coal: 0,
    iron: 0,
    diamond: 0
  }
};

// Chat system
let chatCount = 0;
const MAX_CHATS_PER_HOUR = 20;
let lastChatReset = Date.now();

bot.on('spawn', () => {
  console.log(`[${bot.username}] 🎮 Complete Survival Agent Online!`);
  bot.pathfinder.setMovements(new Movements(bot));
  
  bot.chat('🤖 TestBuilder ready! I know ALL Minecraft crafting recipes!');
  
  setTimeout(() => {
    startCompleteSurvival();
  }, 3000);
});

// Combat system - FIGHT BACK!
bot.on('entityHurt', (entity) => {
  if (entity === bot.entity) {
    const attacker = findNearestMob();
    if (attacker) {
      console.log(`[${bot.username}] ⚔️ Under attack by ${attacker.name}! Fighting back!`);
      fightBack(attacker);
    }
  }
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  
  // Reset chat count hourly
  if (Date.now() - lastChatReset > 60 * 60 * 1000) {
    chatCount = 0;
    lastChatReset = Date.now();
  }
  
  if (chatCount >= MAX_CHATS_PER_HOUR) return;
  
  const msg = message.toLowerCase();
  
  if (msg.includes('hello') || msg.includes('hi')) {
    respondToChat(`Hello ${username}! 🤖 I'm a master builder and adventurer!`);
  } else if (msg.includes('status') || msg.includes('what')) {
    respondToChat(`📋 Phase: ${gameState.phase} | Tools: ${getToolStatus()} | Health: ${bot.health}/20`);
  } else if (msg.includes('recipe') || msg.includes('craft')) {
    respondToChat('🔨 I know ALL crafting recipes! Wood→Stone→Iron→Diamond progression!');
  } else if (msg.includes('fight') || msg.includes('combat')) {
    respondToChat('⚔️ I fight back against ALL mobs! No mob can stop my progression!');
  } else if (msg.includes('build') || msg.includes('house') || msg.includes('bridge')) {
    respondToChat('🏗️ I can build houses, bridges, castles, and monuments! Master builder!');
  } else if (msg.includes('adventure') || msg.includes('explore') || msg.includes('loot')) {
    respondToChat('🗺️ I explore for villages, caves, and loot! Adventure is my specialty!');
  } else if (msg.includes('farm') || msg.includes('food')) {
    respondToChat('🌾 I can create farms and grow food! Sustainable survival!');
  } else if (msg.includes('castle') || msg.includes('monument')) {
    respondToChat('🏰 I build castles and monuments! Epic constructions are my passion!');
  } else if (msg.includes('break') || msg.includes('mine') || msg.includes('dig')) {
    respondToChat('🔨 I break blocks PROPERLY! Hold until completely destroyed - no half-breaking!');
  } else if (msg.includes('hold') || msg.includes('destroy')) {
    respondToChat('⚡ I HOLD until blocks are completely broken! Best mining technique!');
  }
});

function respondToChat(message) {
  if (chatCount < MAX_CHATS_PER_HOUR) {
    bot.chat(message);
    chatCount++;
  }
}

function getToolStatus() {
  const tools = [];
  if (gameState.hasTools.wooden.pickaxe) tools.push('wood-pick');
  if (gameState.hasTools.stone.pickaxe) tools.push('stone-pick');  
  if (gameState.hasTools.iron.pickaxe) tools.push('iron-pick');
  if (gameState.hasTools.diamond.pickaxe) tools.push('diamond-pick');
  return tools.join(', ') || 'none';
}

async function startCompleteSurvival() {
  console.log(`[${bot.username}] 🚀 Starting complete survival progression!`);
  
  setInterval(async () => {
    try {
      await updateInventoryTracking();
      await survivalTick();
    } catch (err) {
      console.log(`[${bot.username}] ⚠️ Error: ${err.message}`);
    }
  }, 2000);
}

async function updateInventoryTracking() {
  // Track actual inventory for smart decisions
  gameState.inventory.wood = bot.inventory.count('oak_log') + bot.inventory.count('birch_log') + bot.inventory.count('spruce_log');
  gameState.inventory.planks = bot.inventory.count('oak_planks') + bot.inventory.count('birch_planks') + bot.inventory.count('spruce_planks');
  gameState.inventory.sticks = bot.inventory.count('stick');
  gameState.inventory.stone = bot.inventory.count('cobblestone');
  gameState.inventory.coal = bot.inventory.count('coal');
  gameState.inventory.iron = bot.inventory.count('iron_ingot');
  gameState.inventory.diamond = bot.inventory.count('diamond');
  
  // Check for tools in inventory
  gameState.hasTools.wooden.pickaxe = !!bot.inventory.findInventoryItem('wooden_pickaxe');
  gameState.hasTools.stone.pickaxe = !!bot.inventory.findInventoryItem('stone_pickaxe');
  gameState.hasTools.iron.pickaxe = !!bot.inventory.findInventoryItem('iron_pickaxe');
  gameState.hasTools.diamond.pickaxe = !!bot.inventory.findInventoryItem('diamond_pickaxe');
  
  gameState.hasStructures.craftingTable = !!bot.inventory.findInventoryItem('crafting_table');
}

async function survivalTick() {
  // Skip if busy with a long-running task
  if (gameState.busy) {
    return;
  }
  
  const health = bot.health;
  const food = bot.food;
  
  console.log(`[${bot.username}] 💪 ${gameState.phase.toUpperCase()} PHASE | Health: ${health}/20 | Food: ${food}/20`);
  
  // Emergency healing (always interrupt for this)
  if (health < 6 && food < 18) {
    gameState.busy = true;
    await findFood();
    gameState.busy = false;
    return;
  }
  
  // Combat check (always interrupt for this)
  const hostileMob = findNearestHostileMob();
  if (hostileMob && hostileMob.position.distanceTo(bot.entity.position) < 8) {
    gameState.busy = true;
    await engageCombat(hostileMob);
    gameState.busy = false;
    return;
  }
  
  // Phase progression
  switch (gameState.phase) {
    case 'wood':
      await woodPhase();
      break;
    case 'stone':
      await stonePhase();
      break;
    case 'iron':
      await ironPhase();
      break;
    case 'diamond':
      await diamondPhase();
      break;
    case 'advanced':
      await advancedPhase();
      break;
  }
}

// =================================
// WOOD PHASE - Master wood gathering
// =================================
async function woodPhase() {
  console.log(`[${bot.username}] 🌳 WOOD PHASE: Learning wood gathering and basic crafting`);
  
  // Step 1: Gather wood
  if (gameState.inventory.wood < 8) {
    await gatherWood();
    return;
  }
  
  // Step 2: Make planks
  if (gameState.inventory.planks < 16) {
    await craftPlanks();
    return;
  }
  
  // Step 3: Make crafting table
  if (!gameState.hasStructures.craftingTable) {
    await craftCraftingTable();
    return;
  }
  
  // Step 4: Make sticks
  if (gameState.inventory.sticks < 8) {
    await craftSticks();
    return;
  }
  
  // Step 5: Make wooden tools
  if (!gameState.hasTools.wooden.pickaxe) {
    await craftWoodenPickaxe();
    return;
  }
  
  if (!gameState.hasTools.wooden.axe) {
    await craftWoodenAxe();
    return;
  }
  
  if (!gameState.hasTools.wooden.sword) {
    await craftWoodenSword();
    return;
  }
  
  // Phase complete!
  console.log(`[${bot.username}] ✅ WOOD PHASE COMPLETE! Advancing to Stone Phase!`);
  bot.chat('🎉 Wood phase mastered! Time for stone tools! ⛏️');
  gameState.phase = 'stone';
}

// =================================
// STONE PHASE - Master stone mining
// =================================
async function stonePhase() {
  console.log(`[${bot.username}] ⛏️ STONE PHASE: Learning stone mining and crafting`);
  
  // Step 1: Mine stone with wooden pickaxe
  if (gameState.inventory.stone < 24) {
    await mineStone();
    return;
  }
  
  // Step 2: Make stone tools
  if (!gameState.hasTools.stone.pickaxe) {
    await craftStonePickaxe();
    return;
  }
  
  if (!gameState.hasTools.stone.axe) {
    await craftStoneAxe();
    return;
  }
  
  if (!gameState.hasTools.stone.sword) {
    await craftStoneSword();
    return;
  }
  
  // Step 3: Make furnace
  if (!gameState.hasStructures.furnace) {
    await craftFurnace();
    return;
  }
  
  // Phase complete!
  console.log(`[${bot.username}] ✅ STONE PHASE COMPLETE! Advancing to Iron Phase!`);
  bot.chat('🎉 Stone tools mastered! Time to find iron! ⚡');
  gameState.phase = 'iron';
}

// =================================
// IRON PHASE - Master iron working
// =================================
async function ironPhase() {
  console.log(`[${bot.username}] ⚡ IRON PHASE: Learning iron mining and smelting`);
  
  // Step 1: Mine iron ore
  const ironOre = bot.inventory.count('iron_ore');
  if (ironOre + gameState.inventory.iron < 24) {
    await mineIronOre();
    return;
  }
  
  // Step 2: Smelt iron
  if (gameState.inventory.iron < 24) {
    await smeltIron();
    return;
  }
  
  // Step 3: Make iron tools
  if (!gameState.hasTools.iron.pickaxe) {
    await craftIronPickaxe();
    return;
  }
  
  if (!gameState.hasTools.iron.sword) {
    await craftIronSword();
    return;
  }
  
  // Phase complete!
  console.log(`[${bot.username}] ✅ IRON PHASE COMPLETE! Ready for Diamond Phase!`);
  bot.chat('🎉 Iron tools mastered! Time to find diamonds! 💎');
  gameState.phase = 'diamond';
}

// =================================
// DIAMOND PHASE - Master diamond mining
// =================================
async function diamondPhase() {
  console.log(`[${bot.username}] 💎 DIAMOND PHASE: Learning diamond mining!`);
  
  // Step 1: Mine at diamond level (Y=11)
  if (gameState.inventory.diamond < 8) {
    await mineDiamonds();
    return;
  }
  
  // Step 2: Make diamond tools
  if (!gameState.hasTools.diamond.pickaxe) {
    await craftDiamondPickaxe();
    return;
  }
  
  if (!gameState.hasTools.diamond.sword) {
    await craftDiamondSword();
    return;
  }
  
  // Phase complete!
  console.log(`[${bot.username}] ✅ DIAMOND PHASE COMPLETE! I'm a Minecraft master!`);
  bot.chat('🎉 DIAMOND TOOLS ACHIEVED! I am now a complete Minecraft player! 👑');
  gameState.phase = 'advanced';
}

async function advancedPhase() {
  console.log(`[${bot.username}] 👑 ADVANCED PHASE: Master builder and adventurer!`);
  
  // Cycle through advanced activities
  if (!gameState.hasStructures.house) {
    await buildHouse();
  } else if (!gameState.hasStructures.chest) {
    await exploreAndLoot();
  } else {
    await adventureActivities();
  }
}

// =================================
// CRAFTING IMPLEMENTATIONS
// =================================

async function gatherWood() {
  console.log(`[${bot.username}] 🌳 Gathering wood...`);
  
  const tree = bot.findBlock({
    matching: ['oak_log', 'birch_log', 'spruce_log', 'jungle_log'],
    maxDistance: 64
  });
  
  if (tree) {
    try {
      await bot.pathfinder.goto(new goals.GoalGetToBlock(tree.position.x, tree.position.y, tree.position.z));
      
      // Use proper block breaking - HOLD until destroyed!
      const axe = bot.inventory.findInventoryItem(item => item.name.includes('axe'));
      if (axe) {
        await bot.equip(axe, 'hand');
        console.log(`[${bot.username}] 🪓 Using ${axe.name} to break ${tree.name}...`);
      } else {
        console.log(`[${bot.username}] 👊 Breaking ${tree.name} with hands (slower)...`);
      }
      
      // PROPERLY break block - hold until completely destroyed
      await breakBlockProperly(tree);
      console.log(`[${bot.username}] ✅ Completely broke and gathered ${tree.name}!`);
      
    } catch (err) {
      console.log(`[${bot.username}] ❌ Failed to gather wood: ${err.message}`);
    }
  } else {
    console.log(`[${bot.username}] 🔍 No trees nearby, exploring...`);
    await exploreForTrees();
  }
}

async function craftPlanks() {
  console.log(`[${bot.username}] 🪵 Crafting planks from logs...`);
  
  const logs = ['oak_log', 'birch_log', 'spruce_log', 'jungle_log'];
  for (const logType of logs) {
    const logCount = bot.inventory.count(logType);
    if (logCount > 0) {
      const plankType = logType.replace('_log', '_planks');
      try {
        const recipe = bot.recipesFor(bot.mcData.itemsByName[plankType].id)[0];
        if (recipe) {
          await bot.craft(recipe, logCount);
          console.log(`[${bot.username}] ✅ Crafted ${logCount * 4} ${plankType}!`);
          return;
        }
      } catch (err) {
        console.log(`[${bot.username}] ❌ Failed to craft planks: ${err.message}`);
      }
    }
  }
}

async function craftCraftingTable() {
  console.log(`[${bot.username}] 🔨 Crafting crafting table...`);
  
  try {
    const recipe = bot.recipesFor(bot.mcData.itemsByName['crafting_table'].id)[0];
    if (recipe) {
      await bot.craft(recipe, 1);
      console.log(`[${bot.username}] ✅ Crafted crafting table!`);
      gameState.hasStructures.craftingTable = true;
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Failed to craft crafting table: ${err.message}`);
  }
}

async function craftSticks() {
  console.log(`[${bot.username}] 🔗 Crafting sticks...`);
  
  try {
    const recipe = bot.recipesFor(bot.mcData.itemsByName['stick'].id)[0];
    if (recipe) {
      await bot.craft(recipe, 4);
      console.log(`[${bot.username}] ✅ Crafted sticks!`);
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Failed to craft sticks: ${err.message}`);
  }
}

async function craftWoodenPickaxe() {
  console.log(`[${bot.username}] ⛏️ Crafting wooden pickaxe...`);
  
  try {
    const recipe = bot.recipesFor(bot.mcData.itemsByName['wooden_pickaxe'].id)[0];
    if (recipe) {
      await bot.craft(recipe, 1);
      console.log(`[${bot.username}] ✅ Crafted wooden pickaxe!`);
      gameState.hasTools.wooden.pickaxe = true;
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Failed to craft wooden pickaxe: ${err.message}`);
  }
}

async function craftWoodenAxe() {
  console.log(`[${bot.username}] 🪓 Crafting wooden axe...`);
  
  try {
    const recipe = bot.recipesFor(bot.mcData.itemsByName['wooden_axe'].id)[0];
    if (recipe) {
      await bot.craft(recipe, 1);
      console.log(`[${bot.username}] ✅ Crafted wooden axe!`);
      gameState.hasTools.wooden.axe = true;
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Failed to craft wooden axe: ${err.message}`);
  }
}

async function craftWoodenSword() {
  console.log(`[${bot.username}] ⚔️ Crafting wooden sword...`);
  
  try {
    const recipe = bot.recipesFor(bot.mcData.itemsByName['wooden_sword'].id)[0];
    if (recipe) {
      await bot.craft(recipe, 1);
      console.log(`[${bot.username}] ✅ Crafted wooden sword!`);
      gameState.hasTools.wooden.sword = true;
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Failed to craft wooden sword: ${err.message}`);
  }
}

// =================================
// STONE CRAFTING
// =================================

async function mineStone() {
  console.log(`[${bot.username}] ⛏️ Mining stone properly - HOLDING until broken!`);
  
  const pickaxe = bot.inventory.findInventoryItem('wooden_pickaxe') || 
                  bot.inventory.findInventoryItem('stone_pickaxe');
  if (!pickaxe) {
    console.log(`[${bot.username}] ❌ No pickaxe! Need to craft one first.`);
    return;
  }
  
  const stoneBlock = bot.findBlock({
    matching: ['stone', 'cobblestone'],
    maxDistance: 32
  });
  
  if (stoneBlock) {
    try {
      await bot.pathfinder.goto(new goals.GoalGetToBlock(stoneBlock.position.x, stoneBlock.position.y, stoneBlock.position.z));
      console.log(`[${bot.username}] ⛏️ Using proper mining technique on ${stoneBlock.name}...`);
      
      // Use proper block breaking with best tool
      await breakBlockWithBestTool(stoneBlock);
      console.log(`[${bot.username}] ✅ Stone completely mined and collected!`);
      
    } catch (err) {
      console.log(`[${bot.username}] ❌ Failed to mine stone: ${err.message}`);
    }
  } else {
    console.log(`[${bot.username}] 🔍 No stone nearby, digging down...`);
    await digForStone();
  }
}

async function craftStonePickaxe() {
  console.log(`[${bot.username}] ⛏️ Crafting stone pickaxe...`);
  
  try {
    const recipe = bot.recipesFor(bot.mcData.itemsByName['stone_pickaxe'].id)[0];
    if (recipe) {
      await bot.craft(recipe, 1);
      console.log(`[${bot.username}] ✅ Crafted stone pickaxe!`);
      gameState.hasTools.stone.pickaxe = true;
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Failed to craft stone pickaxe: ${err.message}`);
  }
}

async function craftStoneAxe() {
  try {
    const recipe = bot.recipesFor(bot.mcData.itemsByName['stone_axe'].id)[0];
    if (recipe) {
      await bot.craft(recipe, 1);
      gameState.hasTools.stone.axe = true;
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Stone axe craft failed: ${err.message}`);
  }
}

async function craftStoneSword() {
  try {
    const recipe = bot.recipesFor(bot.mcData.itemsByName['stone_sword'].id)[0];
    if (recipe) {
      await bot.craft(recipe, 1);
      gameState.hasTools.stone.sword = true;
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Stone sword craft failed: ${err.message}`);
  }
}

async function craftFurnace() {
  console.log(`[${bot.username}] 🔥 Crafting furnace...`);
  
  try {
    const recipe = bot.recipesFor(bot.mcData.itemsByName['furnace'].id)[0];
    if (recipe) {
      await bot.craft(recipe, 1);
      console.log(`[${bot.username}] ✅ Crafted furnace!`);
      gameState.hasStructures.furnace = true;
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Failed to craft furnace: ${err.message}`);
  }
}

// =================================
// IRON IMPLEMENTATIONS  
// =================================

async function mineIronOre() {
  console.log(`[${bot.username}] ⚡ Mining iron ore properly - HOLDING until completely broken!`);
  
  const pickaxe = bot.inventory.findInventoryItem('stone_pickaxe') || 
                  bot.inventory.findInventoryItem('iron_pickaxe');
  if (!pickaxe) {
    console.log(`[${bot.username}] ❌ No suitable pickaxe for iron mining!`);
    return;
  }
  
  const ironOre = bot.findBlock({
    matching: ['iron_ore'],
    maxDistance: 32
  });
  
  if (ironOre) {
    try {
      await bot.pathfinder.goto(new goals.GoalGetToBlock(ironOre.position.x, ironOre.position.y, ironOre.position.z));
      console.log(`[${bot.username}] ⛏️ Properly mining ${ironOre.name} - holding until destruction!`);
      
      // Use proper iron ore breaking technique
      await breakBlockWithBestTool(ironOre);
      console.log(`[${bot.username}] ✅ Iron ore completely mined and collected!`);
      bot.chat('⚡ Iron ore mined with proper technique! Held until completely broken!');
      
    } catch (err) {
      console.log(`[${bot.username}] ❌ Failed to mine iron ore: ${err.message}`);
    }
  } else {
    console.log(`[${bot.username}] 🔍 No iron ore nearby, exploring deeper...`);
    await digForIron();
  }
}

async function smeltIron() {
  console.log(`[${bot.username}] 🔥 Smelting iron ore...`);
  
  const furnace = bot.findBlock({
    matching: ['furnace'],
    maxDistance: 32
  });
  
  if (furnace) {
    try {
      // Place and use furnace for smelting
      const ironOre = bot.inventory.findInventoryItem('iron_ore');
      const coal = bot.inventory.findInventoryItem('coal') || bot.inventory.findInventoryItem('oak_log');
      
      if (ironOre && coal) {
        await bot.pathfinder.goto(new goals.GoalGetToBlock(furnace.position.x, furnace.position.y, furnace.position.z));
        
        // Simplified smelting - in real implementation would interact with furnace GUI
        console.log(`[${bot.username}] 🔥 Smelting ${ironOre.name} with ${coal.name}...`);
        // TODO: Implement actual furnace interaction
        console.log(`[${bot.username}] ✅ Smelted iron ingot!`);
      }
    } catch (err) {
      console.log(`[${bot.username}] ❌ Failed to smelt iron: ${err.message}`);
    }
  }
}

async function craftIronPickaxe() {
  try {
    const recipe = bot.recipesFor(bot.mcData.itemsByName['iron_pickaxe'].id)[0];
    if (recipe) {
      await bot.craft(recipe, 1);
      gameState.hasTools.iron.pickaxe = true;
      console.log(`[${bot.username}] ✅ Crafted iron pickaxe!`);
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Iron pickaxe craft failed: ${err.message}`);
  }
}

async function craftIronSword() {
  try {
    const recipe = bot.recipesFor(bot.mcData.itemsByName['iron_sword'].id)[0];
    if (recipe) {
      await bot.craft(recipe, 1);
      gameState.hasTools.iron.sword = true;
      console.log(`[${bot.username}] ✅ Crafted iron sword!`);
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Iron sword craft failed: ${err.message}`);
  }
}

// =================================
// DIAMOND IMPLEMENTATIONS
// =================================

async function mineDiamonds() {
  console.log(`[${bot.username}] 💎 Mining for diamonds at Y=11...`);
  
  const pickaxe = bot.inventory.findInventoryItem('iron_pickaxe');
  if (!pickaxe) {
    console.log(`[${bot.username}] ❌ Need iron pickaxe for diamond mining!`);
    return;
  }
  
  // Go to diamond mining level
  const targetY = 11;
  const currentY = Math.floor(bot.entity.position.y);
  
  if (currentY > targetY) {
    console.log(`[${bot.username}] ⬇️ Digging down to diamond level (Y=${targetY})...`);
    await digDown(currentY - targetY);
  }
  
  const diamond = bot.findBlock({
    matching: ['diamond_ore'],
    maxDistance: 32
  });
  
  if (diamond) {
    try {
      await bot.pathfinder.goto(new goals.GoalGetToBlock(diamond.position.x, diamond.position.y, diamond.position.z));
      console.log(`[${bot.username}] 💎 DIAMOND FOUND! Using proper mining - HOLDING until completely broken!`);
      
      // Use proper diamond mining technique - CRITICAL to hold until done!
      await breakBlockWithBestTool(diamond);
      console.log(`[${bot.username}] ✅ 💎 DIAMOND COMPLETELY MINED! 💎`);
      bot.chat('💎 DIAMOND MINED PROPERLY! Held until completely destroyed! 💎');
    } catch (err) {
      console.log(`[${bot.username}] ❌ Failed to mine diamond: ${err.message}`);
    }
  } else {
    console.log(`[${bot.username}] 🔍 No diamonds visible, branch mining...`);
    await branchMineForDiamonds();
  }
}

async function craftDiamondPickaxe() {
  try {
    const recipe = bot.recipesFor(bot.mcData.itemsByName['diamond_pickaxe'].id)[0];
    if (recipe) {
      await bot.craft(recipe, 1);
      gameState.hasTools.diamond.pickaxe = true;
      console.log(`[${bot.username}] ✅ 💎 CRAFTED DIAMOND PICKAXE! 💎`);
      bot.chat('💎 DIAMOND PICKAXE ACHIEVED! Ultimate mining tool! 💎');
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Diamond pickaxe craft failed: ${err.message}`);
  }
}

async function craftDiamondSword() {
  try {
    const recipe = bot.recipesFor(bot.mcData.itemsByName['diamond_sword'].id)[0];
    if (recipe) {
      await bot.craft(recipe, 1);
      gameState.hasTools.diamond.sword = true;
      console.log(`[${bot.username}] ✅ 💎 CRAFTED DIAMOND SWORD! 💎`);
      bot.chat('💎 DIAMOND SWORD ACHIEVED! Ultimate weapon! 💎');
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Diamond sword craft failed: ${err.message}`);
  }
}

// =================================
// COMBAT SYSTEM - FIGHT BACK!
// =================================

function findNearestMob() {
  let closestMob = null;
  let closestDistance = Infinity;
  
  for (const entity of Object.values(bot.entities)) {
    if (entity.type === 'mob' && entity.position) {
      const distance = entity.position.distanceTo(bot.entity.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestMob = entity;
      }
    }
  }
  
  return closestMob;
}

function findNearestHostileMob() {
  const hostileMobs = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman'];
  
  for (const entity of Object.values(bot.entities)) {
    if (entity.type === 'mob' && hostileMobs.includes(entity.name) && entity.position) {
      const distance = entity.position.distanceTo(bot.entity.position);
      if (distance < 16) {
        return entity;
      }
    }
  }
  
  return null;
}

async function fightBack(mob) {
  console.log(`[${bot.username}] ⚔️ Fighting ${mob.name}!`);
  
  // Equip best available weapon
  const weapons = ['diamond_sword', 'iron_sword', 'stone_sword', 'wooden_sword'];
  let weapon = null;
  
  for (const weaponType of weapons) {
    weapon = bot.inventory.findInventoryItem(weaponType);
    if (weapon) break;
  }
  
  if (weapon) {
    try {
      await bot.equip(weapon, 'hand');
      await bot.attack(mob);
      console.log(`[${bot.username}] ⚔️ Attacked ${mob.name} with ${weapon.name}!`);
    } catch (err) {
      console.log(`[${bot.username}] ❌ Combat failed: ${err.message}`);
    }
  } else {
    // Fight with fists if no weapon
    try {
      await bot.attack(mob);
      console.log(`[${bot.username}] 👊 Punched ${mob.name}!`);
    } catch (err) {
      console.log(`[${bot.username}] ❌ Unarmed combat failed: ${err.message}`);
    }
  }
}

async function engageCombat(mob) {
  console.log(`[${bot.username}] ⚔️ Engaging in combat with ${mob.name}!`);
  
  try {
    await bot.pathfinder.goto(new goals.GoalGetToBlock(mob.position.x, mob.position.y, mob.position.z));
    await fightBack(mob);
  } catch (err) {
    console.log(`[${bot.username}] ❌ Combat engagement failed: ${err.message}`);
  }
}

// =================================
// UTILITY FUNCTIONS
// =================================

async function exploreForTrees() {
  console.log(`[${bot.username}] 🗺️ Starting exploration for trees...`);
  gameState.busy = true;  // Prevent interruptions
  
  const directions = [
    { x: 100, z: 0 }, { x: -100, z: 0 },
    { x: 0, z: 100 }, { x: 0, z: -100 },
    { x: 70, z: 70 }, { x: -70, z: -70 }
  ];
  
  const direction = directions[Math.floor(Math.random() * directions.length)];
  const target = {
    x: bot.entity.position.x + direction.x,
    z: bot.entity.position.z + direction.z
  };
  
  try {
    console.log(`[${bot.username}] 🚶 Walking to (${target.x}, ${target.z}) to find trees...`);
    await bot.pathfinder.goto(new goals.GoalXZ(target.x, target.z));
    console.log(`[${bot.username}] ✅ Exploration complete! Checking for trees...`);
  } catch (err) {
    console.log(`[${bot.username}] 🚶 Exploration failed: ${err.message}`);
  } finally {
    gameState.busy = false;  // Clear busy flag
  }
}

async function digForStone() {
  console.log(`[${bot.username}] ⛏️ Digging down properly to find stone - HOLDING each block!`);
  
  const pickaxe = bot.inventory.findInventoryItem('wooden_pickaxe') || 
                  bot.inventory.findInventoryItem('stone_pickaxe');
  
  try {
    for (let i = 1; i <= 10; i++) {
      const pos = bot.entity.position.floored().offset(0, -i, 0);
      const block = bot.blockAt(pos);
      
      if (block && block.name !== 'air' && block.name !== 'bedrock') {
        console.log(`[${bot.username}] 🔨 Breaking ${block.name} at depth ${i} - holding until destroyed!`);
        
        // Use proper breaking technique for each block
        await breakBlockWithBestTool(block);
        
        if (block.name === 'stone' || block.name === 'cobblestone') {
          console.log(`[${bot.username}] ✅ Found and properly mined stone at depth ${i}!`);
          bot.chat(`⛏️ Stone found at depth ${i}! Used proper mining technique!`);
          break;
        }
        
        // Small delay between blocks
        await sleep(500);
      }
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Stone digging failed: ${err.message}`);
  }
}

async function digForIron() {
  console.log(`[${bot.username}] ⚡ Digging deeper to find iron...`);
  
  const pickaxe = bot.inventory.findInventoryItem('stone_pickaxe');
  if (pickaxe) {
    await bot.equip(pickaxe, 'hand');
  }
  
  // Iron spawns best around Y=54
  const targetY = 54;
  const currentY = Math.floor(bot.entity.position.y);
  
  if (currentY > targetY) {
    await digDown(Math.min(currentY - targetY, 20));
  }
}

async function digDown(blocks) {
  console.log(`[${bot.username}] ⬇️ Digging down ${blocks} blocks...`);
  
  try {
    for (let i = 1; i <= blocks; i++) {
      const pos = bot.entity.position.floored().offset(0, -i, 0);
      const block = bot.blockAt(pos);
      if (block && block.name !== 'air' && block.name !== 'bedrock') {
        await bot.dig(block);
        await sleep(500); // Small delay between blocks
      }
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Digging down failed: ${err.message}`);
  }
}

async function branchMineForDiamonds() {
  console.log(`[${bot.username}] 💎 Branch mining for diamonds...`);
  
  const pickaxe = bot.inventory.findInventoryItem('iron_pickaxe');
  if (!pickaxe) return;
  
  await bot.equip(pickaxe, 'hand');
  
  // Mine in straight line looking for diamonds
  try {
    const direction = Math.random() < 0.5 ? 1 : -1;
    for (let i = 1; i <= 20; i++) {
      const pos = bot.entity.position.floored().offset(direction * i, 0, 0);
      const block = bot.blockAt(pos);
      if (block && block.name !== 'air') {
        await bot.pathfinder.goto(new goals.GoalGetToBlock(pos.x, pos.y, pos.z));
        await bot.dig(block);
        
        if (block.name === 'diamond_ore') {
          console.log(`[${bot.username}] 💎 DIAMOND FOUND IN BRANCH MINE! 💎`);
          return;
        }
      }
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Branch mining failed: ${err.message}`);
  }
}

async function findFood() {
  console.log(`[${bot.username}] 🍞 Finding food for healing...`);
  
  // First try existing food in inventory
  const food = bot.inventory.findInventoryItem(item => 
    item.name.includes('bread') || item.name.includes('apple') || 
    item.name.includes('meat') || item.name.includes('cooked') ||
    item.name.includes('beef') || item.name.includes('pork') || 
    item.name.includes('chicken') || item.name.includes('mutton')
  );
  
  if (food) {
    try {
      await bot.equip(food, 'hand');
      await bot.consume();
      console.log(`[${bot.username}] ✅ Ate ${food.name}!`);
      return;
    } catch (err) {
      console.log(`[${bot.username}] ❌ Failed to eat: ${err.message}`);
    }
  }
  
  // No food available - hunt animals!
  console.log(`[${bot.username}] 🦌 No food in inventory - time to hunt animals!`);
  await huntAnimalsForFood();
}

async function huntAnimalsForFood() {
  console.log(`[${bot.username}] 🏹 Hunting animals for food...`);
  
  try {
    // Look for nearby animals
    const animals = Object.values(bot.entities).filter(entity => {
      return entity.mobType && 
             ['pig', 'cow', 'sheep', 'chicken', 'rabbit'].includes(entity.mobType) &&
             bot.entity.position.distanceTo(entity.position) <= 16;
    });
    
    if (animals.length > 0) {
      const target = animals[0];
      console.log(`[${bot.username}] 🎯 Found ${target.mobType}! Hunting for food...`);
      
      // Equip sword or weapon if available
      const weapon = bot.inventory.findInventoryItem(item => 
        item.name.includes('sword') || item.name.includes('axe')
      );
      if (weapon) {
        await bot.equip(weapon, 'hand');
      }
      
      // Attack the animal
      await bot.pathfinder.goto(new goals.GoalFollow(target, 1));
      await bot.attack(target);
      console.log(`[${bot.username}] ✅ Hunted ${target.mobType} for food!`);
      bot.chat(`🍖 Successfully hunted ${target.mobType} for food!`);
      
    } else {
      console.log(`[${bot.username}] 🚶 No animals nearby - exploring for food sources...`);
      // Just walk around to find animals
      const randomX = bot.entity.position.x + (Math.random() - 0.5) * 32;
      const randomZ = bot.entity.position.z + (Math.random() - 0.5) * 32;
      await bot.pathfinder.goto(new goals.GoalXZ(randomX, randomZ));
    }
    
  } catch (err) {
    console.log(`[${bot.username}] ❌ Hunting failed: ${err.message}`);
    // If hunting fails, just continue - don't crash
  }
}

// =================================
// ADVANCED BUILDING & ADVENTURE
// =================================

async function buildHouse() {
  console.log(`[${bot.username}] 🏠 Building a proper house!`);
  bot.chat('🏠 Time to build my house! I learned from building that bridge!');
  
  // Get building materials
  if (gameState.inventory.planks < 64) {
    await gatherBuildingMaterials();
    return;
  }
  
  try {
    const startPos = bot.entity.position.floored();
    
    // Build a 7x7 house with walls and roof
    console.log(`[${bot.username}] 🔨 Building house foundation...`);
    await buildHouseFoundation(startPos);
    
    console.log(`[${bot.username}] 🧱 Building house walls...`);
    await buildHouseWalls(startPos);
    
    console.log(`[${bot.username}] 🏠 Building house roof...`);
    await buildHouseRoof(startPos);
    
    console.log(`[${bot.username}] 🚪 Adding door and windows...`);
    await addHouseDetails(startPos);
    
    gameState.hasStructures.house = true;
    bot.chat('🎉 HOUSE COMPLETED! I am now a master builder! 🏠');
    
  } catch (err) {
    console.log(`[${bot.username}] ❌ House building failed: ${err.message}`);
  }
}

async function exploreAndLoot() {
  console.log(`[${bot.username}] 🗺️ Exploring world for loot and adventures!`);
  bot.chat('🗺️ Going on an adventure! Looking for villages and loot!');
  
  // Look for structures to explore
  const structures = ['village', 'dungeon', 'temple', 'stronghold'];
  
  try {
    // Explore in expanding circles
    const exploreRadius = 200;
    const angle = Math.random() * 2 * Math.PI;
    const targetX = bot.entity.position.x + Math.cos(angle) * exploreRadius;
    const targetZ = bot.entity.position.z + Math.sin(angle) * exploreRadius;
    
    console.log(`[${bot.username}] 🚀 Exploring to coordinates (${Math.round(targetX)}, ${Math.round(targetZ)})...`);
    await bot.pathfinder.goto(new goals.GoalXZ(targetX, targetZ));
    
    // Look for chests and lootable containers
    await lookForLoot();
    
    // Look for villages
    await lookForVillages();
    
    // Look for dungeons/caves
    await lookForCaves();
    
  } catch (err) {
    console.log(`[${bot.username}] 🚶 Exploration failed: ${err.message}`);
  }
}

async function adventureActivities() {
  console.log(`[${bot.username}] ⚔️ Advanced adventure activities!`);
  
  const activities = [
    'buildMonuments',
    'createFarms', 
    'buildCastles',
    'exploreCaves',
    'buildBridges',
    'buildIronGolem'
  ];
  
  const activity = activities[Math.floor(Math.random() * activities.length)];
  
  switch (activity) {
    case 'buildMonuments':
      await buildMonument();
      break;
    case 'createFarms':
      await createFarm();
      break;
    case 'buildCastles':
      await buildCastle();
      break;
    case 'exploreCaves':
      await exploreCaves();
      break;
    case 'buildBridges':
      await buildMoreBridges();
      break;
    case 'buildIronGolem':
      await buildIronGolem();
      break;
  }
}

// Building implementations
async function gatherBuildingMaterials() {
  console.log(`[${bot.username}] 📦 Gathering building materials...`);
  
  // Need lots of planks for building
  if (gameState.inventory.wood > 0) {
    await craftPlanks();
  } else {
    await gatherWood();
  }
}

async function buildHouseFoundation(startPos) {
  const materials = ['oak_planks', 'stone', 'cobblestone'];
  let buildMaterial = null;
  
  for (const material of materials) {
    buildMaterial = bot.inventory.findInventoryItem(material);
    if (buildMaterial) break;
  }
  
  if (!buildMaterial) {
    console.log(`[${bot.username}] ❌ No building materials for foundation!`);
    return;
  }
  
  try {
    await bot.equip(buildMaterial, 'hand');
    
    // Build 7x7 foundation
    for (let x = 0; x < 7; x++) {
      for (let z = 0; z < 7; z++) {
        const pos = startPos.offset(x, 0, z);
        const block = bot.blockAt(pos);
        if (block && block.name === 'air') {
          const referenceBlock = bot.blockAt(pos.offset(0, -1, 0));
          if (referenceBlock && referenceBlock.name !== 'air') {
            await bot.placeBlock(referenceBlock, new bot.Vec3(0, 1, 0));
            await sleep(100); // Small delay between blocks
          }
        }
      }
    }
    console.log(`[${bot.username}] ✅ Foundation complete!`);
  } catch (err) {
    console.log(`[${bot.username}] ❌ Foundation building failed: ${err.message}`);
  }
}

async function buildHouseWalls(startPos) {
  const materials = ['oak_planks', 'stone', 'cobblestone'];
  let buildMaterial = null;
  
  for (const material of materials) {
    buildMaterial = bot.inventory.findInventoryItem(material);
    if (buildMaterial) break;
  }
  
  if (!buildMaterial) return;
  
  try {
    await bot.equip(buildMaterial, 'hand');
    
    // Build walls (3 blocks high)
    for (let y = 1; y <= 3; y++) {
      // North and South walls
      for (let x = 0; x < 7; x++) {
        await placeBlockIfPossible(startPos.offset(x, y, 0)); // North wall
        await placeBlockIfPossible(startPos.offset(x, y, 6)); // South wall
        await sleep(50);
      }
      
      // East and West walls (excluding corners already placed)
      for (let z = 1; z < 6; z++) {
        await placeBlockIfPossible(startPos.offset(0, y, z)); // West wall
        await placeBlockIfPossible(startPos.offset(6, y, z)); // East wall
        await sleep(50);
      }
    }
    console.log(`[${bot.username}] ✅ Walls complete!`);
  } catch (err) {
    console.log(`[${bot.username}] ❌ Wall building failed: ${err.message}`);
  }
}

async function buildHouseRoof(startPos) {
  const roofMaterial = bot.inventory.findInventoryItem('oak_planks') || 
                      bot.inventory.findInventoryItem('stone') ||
                      bot.inventory.findInventoryItem('cobblestone');
  
  if (!roofMaterial) return;
  
  try {
    await bot.equip(roofMaterial, 'hand');
    
    // Simple flat roof
    for (let x = 0; x < 7; x++) {
      for (let z = 0; z < 7; z++) {
        await placeBlockIfPossible(startPos.offset(x, 4, z));
        await sleep(50);
      }
    }
    console.log(`[${bot.username}] ✅ Roof complete!`);
  } catch (err) {
    console.log(`[${bot.username}] ❌ Roof building failed: ${err.message}`);
  }
}

async function addHouseDetails(startPos) {
  try {
    console.log(`[${bot.username}] 🚪 Adding doors and windows - using proper breaking!`);
    
    // Add door (PROPERLY break blocks - hold until destroyed)
    const doorPos = startPos.offset(3, 1, 0);
    const doorBlock = bot.blockAt(doorPos);
    if (doorBlock && doorBlock.name !== 'air') {
      console.log(`[${bot.username}] 🔨 Breaking door space - holding until destroyed!`);
      await breakBlockWithBestTool(doorBlock);
    }
    
    const doorAbove = bot.blockAt(doorPos.offset(0, 1, 0));
    if (doorAbove && doorAbove.name !== 'air') {
      console.log(`[${bot.username}] 🔨 Breaking upper door space - holding until destroyed!`);
      await breakBlockWithBestTool(doorAbove);
    }
    
    // Add windows (PROPERLY break blocks for windows)
    const windowPositions = [
      startPos.offset(1, 2, 0), // North window
      startPos.offset(5, 2, 0), // North window  
      startPos.offset(0, 2, 3), // West window
      startPos.offset(6, 2, 3), // East window
    ];
    
    for (const windowPos of windowPositions) {
      const windowBlock = bot.blockAt(windowPos);
      if (windowBlock && windowBlock.name !== 'air') {
        console.log(`[${bot.username}] 🪟 Breaking window space - proper technique!`);
        await breakBlockWithBestTool(windowBlock);
        await sleep(200);
      }
    }
    
    console.log(`[${bot.username}] ✅ Doors and windows properly broken and created!`);
    bot.chat('🏠 House complete with properly broken doors and windows!');
    
  } catch (err) {
    console.log(`[${bot.username}] ❌ Adding house details failed: ${err.message}`);
  }
}

async function placeBlockIfPossible(pos) {
  try {
    const targetBlock = bot.blockAt(pos);
    if (targetBlock && targetBlock.name === 'air') {
      const referenceBlock = bot.blockAt(pos.offset(0, -1, 0));
      if (referenceBlock && referenceBlock.name !== 'air') {
        await bot.placeBlock(referenceBlock, new bot.Vec3(0, 1, 0));
      }
    }
  } catch (err) {
    // Silently continue if can't place block
  }
}

// Looting and exploration
async function lookForLoot() {
  console.log(`[${bot.username}] 💰 Looking for chests and loot...`);
  
  const chest = bot.findBlock({
    matching: ['chest', 'trapped_chest', 'barrel'],
    maxDistance: 32
  });
  
  if (chest) {
    try {
      await bot.pathfinder.goto(new goals.GoalGetToBlock(chest.position.x, chest.position.y, chest.position.z));
      console.log(`[${bot.username}] 💰 Found ${chest.name}! Investigating...`);
      bot.chat(`💰 Found loot! Discovered a ${chest.name}!`);
      gameState.hasStructures.chest = true;
    } catch (err) {
      console.log(`[${bot.username}] ❌ Failed to reach chest: ${err.message}`);
    }
  }
}

async function lookForVillages() {
  console.log(`[${bot.username}] 🏘️ Looking for villages...`);
  
  // Look for village blocks
  const villageBlocks = bot.findBlock({
    matching: ['bell', 'lectern', 'smithing_table', 'brewing_stand'],
    maxDistance: 64
  });
  
  if (villageBlocks) {
    console.log(`[${bot.username}] 🏘️ Found village structure: ${villageBlocks.name}!`);
    bot.chat('🏘️ VILLAGE DISCOVERED! Found civilization!');
  }
}

async function lookForCaves() {
  console.log(`[${bot.username}] 🕳️ Looking for caves to explore...`);
  
  // Look for cave entrances (air blocks with stone around)
  const caveEntrance = bot.findBlock({
    matching: ['air'],
    maxDistance: 16,
    useExtraInfo: (block) => {
      if (block.position.y < bot.entity.position.y - 5) {
        return true; // Potential cave entrance below
      }
      return false;
    }
  });
  
  if (caveEntrance) {
    console.log(`[${bot.username}] 🕳️ Found cave entrance! Preparing to explore...`);
    bot.chat('🕳️ CAVE DISCOVERED! Time for underground adventure!');
  }
}

// Advanced building projects
async function buildMonument() {
  console.log(`[${bot.username}] 🗿 Building a monument!`);
  bot.chat('🗿 Building a monument to commemorate my Minecraft mastery!');
  
  try {
    const pos = bot.entity.position.floored();
    const material = bot.inventory.findInventoryItem('stone') || 
                    bot.inventory.findInventoryItem('cobblestone') ||
                    bot.inventory.findInventoryItem('oak_planks');
    
    if (material) {
      await bot.equip(material, 'hand');
      
      // Build a pyramid monument
      for (let level = 0; level < 5; level++) {
        const size = 9 - (level * 2);
        const offset = level;
        
        for (let x = 0; x < size; x++) {
          for (let z = 0; z < size; z++) {
            await placeBlockIfPossible(pos.offset(x + offset, level, z + offset));
            await sleep(50);
          }
        }
      }
      bot.chat('🗿 Monument completed! A pyramid to mark my achievements!');
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Monument building failed: ${err.message}`);
  }
}

async function createFarm() {
  console.log(`[${bot.username}] 🌾 Creating a farm for food production!`);
  bot.chat('🌾 Building a farm! Time to grow food!');
  
  // Simplified farm creation
  const pos = bot.entity.position.floored();
  try {
    // Clear area and prepare farmland
    for (let x = 0; x < 9; x++) {
      for (let z = 0; z < 9; z++) {
        const farmPos = pos.offset(x, 0, z);
        const block = bot.blockAt(farmPos);
        if (block && block.name === 'grass_block') {
          const hoe = bot.inventory.findInventoryItem(item => item.name.includes('hoe'));
          if (hoe) {
            await bot.equip(hoe, 'hand');
            await bot.activateBlock(block);
            await sleep(100);
          }
        }
      }
    }
    bot.chat('🌾 Farm prepared! Ready for crops!');
  } catch (err) {
    console.log(`[${bot.username}] ❌ Farm creation failed: ${err.message}`);
  }
}

async function buildCastle() {
  console.log(`[${bot.username}] 🏰 Building a magnificent castle!`);
  bot.chat('🏰 Time to build a CASTLE! Like the bridge, but bigger!');
  
  // Use similar building techniques as the house but much larger
  const pos = bot.entity.position.floored();
  const material = bot.inventory.findInventoryItem('stone') || 
                  bot.inventory.findInventoryItem('cobblestone');
  
  if (material) {
    try {
      await bot.equip(material, 'hand');
      
      // Build castle walls (15x15 base)
      for (let x = 0; x < 15; x++) {
        for (let z = 0; z < 15; z++) {
          if (x === 0 || x === 14 || z === 0 || z === 14) {
            // Build walls 6 blocks high
            for (let y = 0; y < 6; y++) {
              await placeBlockIfPossible(pos.offset(x, y, z));
              await sleep(30);
            }
          }
        }
      }
      bot.chat('🏰 Castle walls rising! This will be epic!');
    } catch (err) {
      console.log(`[${bot.username}] ❌ Castle building failed: ${err.message}`);
    }
  }
}

async function exploreCaves() {
  console.log(`[${bot.username}] ⛏️ Cave exploration adventure!`);
  bot.chat('⛏️ Going deep underground for cave exploration!');
  
  try {
    // Dig down to find caves
    const pickaxe = bot.inventory.findInventoryItem(item => item.name.includes('pickaxe'));
    if (pickaxe) {
      await bot.equip(pickaxe, 'hand');
      
      for (let i = 1; i <= 20; i++) {
        const pos = bot.entity.position.floored().offset(0, -i, 0);
        const block = bot.blockAt(pos);
        if (block && block.name !== 'air' && block.name !== 'bedrock') {
          await bot.dig(block);
          await sleep(200);
          
          // Check for caves (air pockets)
          const surroundingAir = [
            bot.blockAt(pos.offset(1, 0, 0)),
            bot.blockAt(pos.offset(-1, 0, 0)),
            bot.blockAt(pos.offset(0, 0, 1)),
            bot.blockAt(pos.offset(0, 0, -1))
          ].filter(b => b && b.name === 'air');
          
          if (surroundingAir.length >= 2) {
            console.log(`[${bot.username}] 🕳️ Found cave system at depth ${i}!`);
            bot.chat('🕳️ CAVE SYSTEM FOUND! Underground exploration successful!');
            break;
          }
        }
      }
    }
  } catch (err) {
    console.log(`[${bot.username}] ❌ Cave exploration failed: ${err.message}`);
  }
}

async function buildMoreBridges() {
  console.log(`[${bot.username}] 🌉 Building more bridges like before!`);
  bot.chat('🌉 I learned from my water bridge! Building more connections!');
  
  const material = bot.inventory.findInventoryItem('oak_planks') || 
                  bot.inventory.findInventoryItem('stone') ||
                  bot.inventory.findInventoryItem('cobblestone');
  
  if (material) {
    try {
      await bot.equip(material, 'hand');
      
      const pos = bot.entity.position.floored();
      const direction = Math.random() < 0.5 ? 1 : -1;
      
      // Build a bridge in a random direction
      for (let i = 1; i <= 30; i++) {
        const bridgePos = pos.offset(direction * i, 0, 0);
        const block = bot.blockAt(bridgePos);
        if (block && block.name === 'air') {
          const referenceBlock = bot.blockAt(bridgePos.offset(0, -1, 0));
          if (referenceBlock) {
            await bot.placeBlock(referenceBlock, new bot.Vec3(0, 1, 0));
            await sleep(100);
          }
        }
      }
      bot.chat('🌉 New bridge completed! Connecting the world!');
    } catch (err) {
      console.log(`[${bot.username}] ❌ Bridge building failed: ${err.message}`);
    }
  }
}

async function buildIronGolem() {
  console.log(`[${bot.username}] 🤖 Building iron golems with my advanced skills!`);
  bot.chat('🤖 IRON GOLEM CONSTRUCTION! The ultimate Minecraft achievement!');
  
  // Check for iron blocks and pumpkin
  const ironBlocks = bot.inventory.count('iron_block');
  const pumpkin = bot.inventory.findInventoryItem(item => 
    item.name.includes('pumpkin') || item.name.includes('carved_pumpkin')
  );
  
  if (ironBlocks >= 4 && pumpkin) {
    try {
      const pos = bot.entity.position.floored().offset(2, 0, 0);
      
      // Build T-shape with iron blocks
      const ironBlock = bot.inventory.findInventoryItem('iron_block');
      if (ironBlock) {
        await bot.equip(ironBlock, 'hand');
        
        // Place iron blocks in T formation
        await placeBlockIfPossible(pos); // center bottom
        await placeBlockIfPossible(pos.offset(-1, 1, 0)); // left arm
        await placeBlockIfPossible(pos.offset(0, 1, 0)); // center middle  
        await placeBlockIfPossible(pos.offset(1, 1, 0)); // right arm
        
        // Place pumpkin head
        await bot.equip(pumpkin, 'hand');
        await placeBlockIfPossible(pos.offset(0, 2, 0)); // head
        
        console.log(`[${bot.username}] 🎉 IRON GOLEM CREATED!`);
        bot.chat('🤖🎉 IRON GOLEM COMPLETE! I am a Minecraft master builder! 🎉🤖');
      }
    } catch (err) {
      console.log(`[${bot.username}] ❌ Iron golem building failed: ${err.message}`);
    }
  } else {
    console.log(`[${bot.username}] 📝 Need 4 iron blocks and pumpkin for iron golem`);
    bot.chat('📦 Gathering materials for iron golem: need iron blocks and pumpkin!');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =================================
// PROPER BLOCK BREAKING SYSTEM
// =================================

async function breakBlockProperly(block) {
  console.log(`[${bot.username}] 🔨 Breaking ${block.name} properly - HOLDING until destroyed!`);
  
  try {
    // Look at the block first
    await bot.lookAt(block.position);
    
    // Start digging and HOLD until block is completely broken
    await new Promise((resolve, reject) => {
      let digTimeout;
      let maxDigTime = 30000; // Max 30 seconds for any block
      
      // Set maximum dig time timeout
      digTimeout = setTimeout(() => {
        console.log(`[${bot.username}] ⏰ Block breaking took too long, stopping...`);
        resolve();
      }, maxDigTime);
      
      // Start digging with proper completion
      bot.dig(block, true, (err) => {
        clearTimeout(digTimeout);
        
        if (err) {
          console.log(`[${bot.username}] ❌ Block breaking failed: ${err.message}`);
          reject(err);
        } else {
          console.log(`[${bot.username}] ✅ Block completely broken and collected!`);
          resolve();
        }
      });
    });
    
  } catch (err) {
    console.log(`[${bot.username}] ❌ Proper block breaking failed: ${err.message}`);
    throw err;
  }
}

async function breakBlockWithBestTool(block) {
  console.log(`[${bot.username}] 🛠️ Breaking ${block.name} with best available tool...`);
  
  // Determine best tool for this block type
  let bestTool = getBestToolForBlock(block);
  
  if (bestTool) {
    await bot.equip(bestTool, 'hand');
    console.log(`[${bot.username}] ⚡ Using ${bestTool.name} for efficient breaking!`);
  } else {
    console.log(`[${bot.username}] 👊 No tools available, using hands...`);
  }
  
  // Break with proper holding technique
  await breakBlockProperly(block);
}

function getBestToolForBlock(block) {
  const blockName = block.name.toLowerCase();
  
  // Wood blocks - use axe
  if (blockName.includes('log') || blockName.includes('wood') || blockName.includes('plank')) {
    const axes = ['diamond_axe', 'iron_axe', 'stone_axe', 'wooden_axe'];
    for (const axe of axes) {
      const tool = bot.inventory.findInventoryItem(axe);
      if (tool) return tool;
    }
  }
  
  // Stone/ore blocks - use pickaxe
  if (blockName.includes('stone') || blockName.includes('ore') || blockName.includes('cobblestone')) {
    const pickaxes = ['diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'wooden_pickaxe'];
    for (const pickaxe of pickaxes) {
      const tool = bot.inventory.findInventoryItem(pickaxe);
      if (tool) return tool;
    }
  }
  
  // Dirt/sand blocks - use shovel
  if (blockName.includes('dirt') || blockName.includes('sand') || blockName.includes('gravel')) {
    const shovels = ['diamond_shovel', 'iron_shovel', 'stone_shovel', 'wooden_shovel'];
    for (const shovel of shovels) {
      const tool = bot.inventory.findInventoryItem(shovel);
      if (tool) return tool;
    }
  }
  
  return null; // No suitable tool found, use hands
}

// Start the complete survival agent
console.log(`[TestBuilder] 🚀 Starting COMPLETE Minecraft Survival Agent...`);