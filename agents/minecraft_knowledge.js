/**
 * ClawCraft Minecraft Knowledge Base
 * Core game rules and mechanics for AI agents
 */

const MINECRAFT_BASICS = {
  // Health & Survival
  HEALTH: {
    max: 20,
    critical_threshold: 6, // Flee/heal when below this
    regen_food_needed: 18, // Need full hunger to regen
  },
  
  HUNGER: {
    max: 20,
    eat_threshold: 14, // Eat when hunger drops below this
    sprint_threshold: 6, // Can't sprint below this
  },

  // Combat Mechanics
  COMBAT: {
    melee_range: 3,
    bow_range: 50,
    attack_cooldown: 0.6, // Seconds between attacks
    critical_hit_requirements: ['jumping', 'falling', 'not_sprinting'],
  },

  // Hostile Mobs (Priority Targets)
  HOSTILE_MOBS: [
    'zombie', 'skeleton', 'spider', 'creeper', 'enderman', 
    'witch', 'zombie_pigman', 'blaze', 'ghast', 'slime'
  ],

  // Tool Effectiveness 
  TOOL_USES: {
    pickaxe: ['stone', 'ore', 'cobblestone', 'iron_block', 'gold_block'],
    axe: ['oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log'],
    shovel: ['dirt', 'sand', 'gravel', 'grass_block'],
    sword: ['combat', 'mob_killing', 'cobweb'],
    hoe: ['farmland', 'path_blocks']
  },

  // Crafting Priorities
  ESSENTIAL_CRAFTS: {
    // Tools (iron tier preferred)
    'iron_pickaxe': { materials: ['iron_ingot:3', 'stick:2'], priority: 'high' },
    'iron_sword': { materials: ['iron_ingot:2', 'stick:1'], priority: 'high' },
    'iron_axe': { materials: ['iron_ingot:3', 'stick:2'], priority: 'medium' },
    
    // Food
    'bread': { materials: ['wheat:3'], priority: 'high' },
    'cooked_beef': { materials: ['raw_beef:1'], priority: 'high', needs_furnace: true },
    
    // Utilities
    'torch': { materials: ['coal:1', 'stick:1'], priority: 'high' },
    'bed': { materials: ['wool:3', 'oak_planks:3'], priority: 'medium' }
  },

  // Farming Basics
  FARMING: {
    crops: ['wheat', 'carrots', 'potatoes', 'beetroots'],
    growth_time: { wheat: 8, carrots: 8, potatoes: 8 }, // stages
    water_range: 4, // blocks from water source
    light_level: 8, // minimum for growth
  },

  // Mining Strategy
  MINING: {
    iron_level: { min: -64, max: 64, best: 15 },
    diamond_level: { min: -64, max: 16, best: -58 },
    coal_level: { min: 0, max: 256, best: 95 },
    
    // Branch mining pattern
    tunnel_spacing: 3, // blocks apart for efficiency
    tunnel_height: 2,
  },

  // Basic Building
  BUILDING: {
    shelter_materials: ['cobblestone', 'oak_planks', 'dirt'],
    roof_blocks: ['oak_planks', 'cobblestone_stairs'],
    door_types: ['oak_door', 'iron_door'],
    window_blocks: ['glass', 'glass_pane']
  }
};

const MINECRAFT_RULES = {
  // Core Gameplay Rules
  PHYSICS: {
    gravity: true,
    block_breaking_time_varies: true,
    water_flows: true,
    lava_burns: true
  },

  DEATH_MECHANICS: {
    drops_items: true,
    drops_xp: true,
    respawns_at_bed_or_spawn: true,
    loses_inventory: true // Why starter kit is important!
  },

  MOB_BEHAVIOR: {
    zombies_burn_in_sunlight: true,
    spiders_neutral_in_light: true,
    creepers_explode_when_close: true,
    endermen_angry_if_looked_at: true,
    skeletons_shoot_arrows: true
  },

  ENVIRONMENT: {
    day_night_cycle: '20 minutes',
    monsters_spawn_in_dark: true,
    crops_need_water_and_light: true,
    fire_spreads: true
  }
};

// Strategic Knowledge for Agents
const AGENT_STRATEGIES = {
  // Priority Actions (in order)
  SURVIVAL_PRIORITIES: [
    'heal_if_low_health',
    'eat_if_hungry', 
    'flee_if_overwhelmed',
    'fight_hostile_mobs',
    'gather_food',
    'build_shelter',
    'mine_resources',
    'explore_safely'
  ],

  // Combat Tactics
  COMBAT_TIPS: [
    'attack_during_day_when_possible',
    'use_sword_for_mobs',
    'keep_distance_from_creepers',
    'dont_look_at_endermen',
    'retreat_if_outnumbered',
    'use_terrain_advantage'
  ],

  // Resource Management
  RESOURCE_TIPS: [
    'always_carry_food',
    'keep_tools_repaired',
    'mine_iron_for_better_gear',
    'coal_for_torches_and_smelting',
    'wood_for_crafting',
    'stone_for_building'
  ]
};

module.exports = { 
  MINECRAFT_BASICS, 
  MINECRAFT_RULES, 
  AGENT_STRATEGIES 
};