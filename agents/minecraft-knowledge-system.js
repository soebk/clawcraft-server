/**
 * Minecraft Knowledge System for AI Agents
 * Provides quick access to game rules, crafting, building, and survival info
 */

class MinecraftKnowledge {
  constructor() {
    this.guides = {
      basics: '/root/projects/clawcraft/docs/MINECRAFT_BASICS.md',
      building: '/root/projects/clawcraft/docs/BUILDING_GUIDE.md', 
      quick: '/root/projects/clawcraft/docs/QUICK_REFERENCE.md',
      advanced: '/root/projects/clawcraft/docs/ADVANCED_MECHANICS.md'
    };
  }

  // Quick reference data for common agent queries
  getCraftingRecipe(item) {
    const recipes = {
      'wooden_pickaxe': {
        pattern: [['wood_planks', 'wood_planks', 'wood_planks'], [null, 'stick', null], [null, 'stick', null]],
        materials: { 'wood_planks': 3, 'stick': 2 }
      },
      'stone_pickaxe': {
        pattern: [['cobblestone', 'cobblestone', 'cobblestone'], [null, 'stick', null], [null, 'stick', null]],
        materials: { 'cobblestone': 3, 'stick': 2 }
      },
      'iron_pickaxe': {
        pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], [null, 'stick', null], [null, 'stick', null]],
        materials: { 'iron_ingot': 3, 'stick': 2 }
      },
      'crafting_table': {
        pattern: [['wood_planks', 'wood_planks'], ['wood_planks', 'wood_planks']],
        materials: { 'wood_planks': 4 }
      },
      'furnace': {
        pattern: [['cobblestone', 'cobblestone', 'cobblestone'], ['cobblestone', null, 'cobblestone'], ['cobblestone', 'cobblestone', 'cobblestone']],
        materials: { 'cobblestone': 8 }
      },
      'bed': {
        pattern: [['wool', 'wool', 'wool'], ['wood_planks', 'wood_planks', 'wood_planks']],
        materials: { 'wool': 3, 'wood_planks': 3 }
      },
      'bread': {
        pattern: [['wheat', 'wheat', 'wheat']],
        materials: { 'wheat': 3 }
      },
      'torch': {
        pattern: [['coal'], ['stick']],
        materials: { 'coal': 1, 'stick': 1 }
      }
    };
    
    return recipes[item.toLowerCase()] || null;
  }

  getMiningInfo(yLevel) {
    const oreDistribution = {
      diamond: { best: -58, range: [-64, -48], rarity: 'very_rare' },
      iron: { best: -16, range: [-64, 72], rarity: 'common' },
      gold: { best: -16, range: [-64, -48], rarity: 'uncommon' },  
      copper: { best: 48, range: [-16, 112], rarity: 'common' },
      coal: { best: 96, range: [0, 128], rarity: 'very_common' },
      lapis: { best: -32, range: [-64, 32], rarity: 'rare' },
      redstone: { best: -58, range: [-64, -32], rarity: 'uncommon' }
    };

    const availableOres = [];
    for (const [ore, info] of Object.entries(oreDistribution)) {
      if (yLevel >= info.range[0] && yLevel <= info.range[1]) {
        availableOres.push({
          ore,
          efficiency: yLevel === info.best ? 'optimal' : 'good',
          rarity: info.rarity
        });
      }
    }

    return {
      yLevel,
      availableOres,
      recommendation: yLevel === -58 ? 'Perfect for diamonds!' : 
                     yLevel === -16 ? 'Great for iron!' :
                     yLevel > 64 ? 'Surface mining - coal and copper' :
                     'Deep mining - various ores available'
    };
  }

  getFoodValue(food) {
    const foodValues = {
      'bread': { hunger: 5, saturation: 6 },
      'cooked_beef': { hunger: 8, saturation: 12.8 },
      'cooked_pork': { hunger: 8, saturation: 12.8 },
      'apple': { hunger: 4, saturation: 2.4 },
      'golden_apple': { hunger: 4, saturation: 9.6, effects: ['regeneration', 'absorption'] },
      'cooked_chicken': { hunger: 6, saturation: 7.2 },
      'baked_potato': { hunger: 5, saturation: 6 }
    };
    
    return foodValues[food.toLowerCase()] || null;
  }

  getBuildingMaterials(style) {
    const styles = {
      medieval: {
        primary: ['stone_bricks', 'oak_wood'],
        secondary: ['cobblestone', 'dark_oak_wood'],
        accent: ['iron_bars', 'glass_panes'],
        description: 'Castle-like structures with thick walls'
      },
      modern: {
        primary: ['white_concrete', 'glass'],
        secondary: ['iron_blocks', 'quartz'],
        accent: ['black_concrete', 'light_gray_concrete'],
        description: 'Clean lines and large windows'
      },
      natural: {
        primary: ['oak_logs', 'stone'],
        secondary: ['dirt', 'grass_blocks'],
        accent: ['leaves', 'flowers'],
        description: 'Blends with landscape'
      },
      japanese: {
        primary: ['dark_oak_wood', 'stone'],
        secondary: ['red_terracotta', 'white_concrete'],
        accent: ['bamboo', 'paper_walls'],
        description: 'Traditional temple architecture'
      }
    };
    
    return styles[style.toLowerCase()] || null;
  }

  getCombatInfo(mob) {
    const mobs = {
      zombie: {
        health: 20,
        damage: 2.5,
        drops: ['rotten_flesh', 'iron_ingot (rare)'],
        strategy: 'Easy melee combat, burns in daylight'
      },
      skeleton: {
        health: 20,
        damage: 4,
        drops: ['bones', 'arrows'],
        strategy: 'Keep distance, use shield or cover'
      },
      creeper: {
        health: 20,
        damage: 'explosion',
        drops: ['gunpowder'],
        strategy: 'Hit and run, NEVER let them get close!'
      },
      spider: {
        health: 16,
        damage: 2,
        drops: ['string', 'spider_eyes'],
        strategy: 'Only hostile at night, easy combat'
      },
      enderman: {
        health: 40,
        damage: 4.5,
        drops: ['ender_pearls'],
        strategy: 'Never look directly at eyes! Attack legs.'
      }
    };
    
    return mobs[mob.toLowerCase()] || null;
  }

  getSurvivalPriority(gamePhase) {
    const priorities = {
      first_day: [
        'Collect wood (20+ logs)',
        'Make basic tools (wooden pickaxe, axe)',
        'Find stone, upgrade to stone tools',
        'Get food (kill animals, find apples)',
        'Build shelter before night',
        'Make bed if possible'
      ],
      early_game: [
        'Set up organized storage',
        'Create sustainable food source',
        'Mine for iron tools and armor',
        'Expand and improve base',
        'Light up area around base'
      ],
      mid_game: [
        'Search for diamonds at Y-58',
        'Enchant tools and weapons',
        'Build advanced structures',
        'Create automated farms',
        'Explore for rare resources'
      ],
      late_game: [
        'Prepare for Nether exploration',
        'Fight Ender Dragon',
        'Build massive projects',
        'Create complex redstone systems',
        'Master all game mechanics'
      ]
    };
    
    return priorities[gamePhase] || null;
  }

  // Agent decision-making helpers
  shouldMineAtLevel(yLevel, targetOre) {
    const miningInfo = this.getMiningInfo(yLevel);
    const targetOreInfo = miningInfo.availableOres.find(ore => ore.ore === targetOre);
    
    if (!targetOreInfo) {
      return { should: false, reason: `${targetOre} not available at Y${yLevel}` };
    }
    
    return { 
      should: true, 
      efficiency: targetOreInfo.efficiency,
      reason: `Y${yLevel} is ${targetOreInfo.efficiency} for ${targetOre} mining`
    };
  }

  needsFood(currentHunger) {
    if (currentHunger <= 6) return { urgent: true, reason: 'Health not regenerating' };
    if (currentHunger <= 12) return { urgent: false, reason: 'Should eat soon' };
    return { urgent: false, reason: 'Hunger levels good' };
  }

  selectBestTool(task, availableTools) {
    const toolRankings = {
      mining_stone: ['diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'wooden_pickaxe'],
      cutting_wood: ['diamond_axe', 'iron_axe', 'stone_axe', 'wooden_axe'],
      digging_dirt: ['diamond_shovel', 'iron_shovel', 'stone_shovel', 'wooden_shovel'],
      combat: ['diamond_sword', 'iron_sword', 'stone_sword', 'wooden_sword']
    };
    
    const ranking = toolRankings[task];
    if (!ranking) return null;
    
    for (const tool of ranking) {
      if (availableTools.includes(tool)) {
        return tool;
      }
    }
    
    return null;
  }

  // Emergency response system
  getEmergencyResponse(situation) {
    const responses = {
      low_health: {
        immediate: ['Eat food immediately', 'Retreat to safe area', 'Avoid all combat'],
        next: ['Gather more food', 'Build shelter if not available', 'Sleep if nighttime']
      },
      lost: {
        immediate: ['Note current coordinates', 'Build tall marker pillar', 'Look for familiar landmarks'],
        next: ['Follow a straight direction', 'Look for villages or structures', 'Build temporary shelter at night']
      },
      no_food: {
        immediate: ['Kill nearby animals', 'Search for apples under trees', 'Look for villages'],
        next: ['Plant crops immediately', 'Set up sustainable farming', 'Always carry backup food']
      },
      surrounded_by_mobs: {
        immediate: ['Build pillar 3 blocks up', 'Wait for daylight', 'Use ranged attacks from height'],
        next: ['Light up area with torches', 'Build secure shelter', 'Clear out mob spawning areas']
      },
      no_tools: {
        immediate: ['Punch trees for wood', 'Make wooden tools first', 'Find stone for upgrades'],
        next: ['Always carry backup tools', 'Organize tool storage', 'Repair damaged tools regularly']
      }
    };
    
    return responses[situation] || null;
  }
}

// Export for use in agent systems
module.exports = MinecraftKnowledge;

// Example usage for agents:
/*
const knowledge = new MinecraftKnowledge();

// Get crafting recipe
const pickaxeRecipe = knowledge.getCraftingRecipe('iron_pickaxe');
console.log('Iron pickaxe needs:', pickaxeRecipe.materials);

// Check mining efficiency  
const diamondMining = knowledge.shouldMineAtLevel(-58, 'diamond');
console.log('Should mine diamonds at Y-58?', diamondMining);

// Get combat strategy
const creeperInfo = knowledge.getCombatInfo('creeper');
console.log('Creeper strategy:', creeperInfo.strategy);

// Emergency response
const lostResponse = knowledge.getEmergencyResponse('lost');
console.log('If lost, immediately:', lostResponse.immediate);
*/