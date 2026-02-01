/**
 * Knowledge-Enhanced Building Methods for AI Agents
 * Demonstrates integration of MinecraftKnowledge system with agent decision-making
 */

const MinecraftKnowledge = require('./minecraft-knowledge-system.js');

class KnowledgeEnhancedBuilder {
  constructor(bot) {
    this.bot = bot;
    this.knowledge = new MinecraftKnowledge();
  }

  // Intelligent material selection based on building style
  selectBuildingMaterials(projectType, biome = 'plains') {
    let style = 'medieval'; // default
    
    // Determine appropriate style based on project type
    switch (projectType) {
      case 'castle':
      case 'tower':
      case 'forge':
        style = 'medieval';
        break;
      case 'modern_house':
      case 'office':
        style = 'modern';
        break;
      case 'temple':
      case 'shrine':
        style = 'japanese';
        break;
      case 'treehouse':
      case 'cabin':
        style = 'natural';
        break;
    }

    const materialPalette = this.knowledge.getBuildingMaterials(style);
    
    // Adapt materials to available resources/biome
    const availableMaterials = this.getAvailableMaterials();
    const selectedMaterials = this.adaptMaterialsToInventory(materialPalette, availableMaterials);
    
    return {
      primary: selectedMaterials.primary,
      secondary: selectedMaterials.secondary,
      accent: selectedMaterials.accent,
      style: style,
      description: materialPalette.description
    };
  }

  // Smart tool selection for building tasks
  selectOptimalTool(task, targetBlock = null) {
    const inventory = this.bot.inventory.items();
    const availableTools = inventory
      .filter(item => item.name.includes('pickaxe') || item.name.includes('axe') || item.name.includes('shovel'))
      .map(item => item.name);

    let taskType = 'mining_stone'; // default
    
    if (targetBlock) {
      if (targetBlock.includes('wood') || targetBlock.includes('log')) {
        taskType = 'cutting_wood';
      } else if (targetBlock.includes('dirt') || targetBlock.includes('sand')) {
        taskType = 'digging_dirt';
      }
    }

    const bestTool = this.knowledge.selectBestTool(taskType, availableTools);
    
    if (bestTool) {
      return {
        tool: bestTool,
        reason: `Optimal for ${taskType}`,
        efficiency: this.getToolEfficiency(bestTool, targetBlock)
      };
    }
    
    return { tool: null, reason: 'No suitable tools available' };
  }

  // Intelligent building progression based on knowledge guides
  planBuildingProgression(projectType, size) {
    const phases = [];
    
    // Phase 1: Foundation (always first)
    phases.push({
      name: 'foundation',
      description: 'Lay solid foundation and mark corners',
      priority: 1,
      materials: ['stone', 'cobblestone', 'stone_bricks'],
      estimatedBlocks: size.x * size.z,
      timeEstimate: '10-15 minutes'
    });

    // Phase 2: Walls
    phases.push({
      name: 'walls',
      description: 'Build exterior walls and doorways',
      priority: 2,
      materials: ['wood_planks', 'stone_bricks', 'cobblestone'],
      estimatedBlocks: (size.x + size.z) * 2 * size.y,
      timeEstimate: '20-30 minutes'
    });

    // Phase 3: Roof structure
    phases.push({
      name: 'roof',
      description: 'Add roof support and covering',
      priority: 3,
      materials: ['oak_stairs', 'spruce_stairs', 'stone_brick_stairs'],
      estimatedBlocks: size.x * size.z * 1.5,
      timeEstimate: '15-25 minutes'
    });

    // Phase 4: Interior division
    if (size.x >= 7 && size.z >= 7) { // Only for larger builds
      phases.push({
        name: 'interior_walls',
        description: 'Create rooms and interior structure',
        priority: 4,
        materials: ['wood_planks', 'cobblestone_wall'],
        estimatedBlocks: Math.floor((size.x + size.z) / 3) * size.y,
        timeEstimate: '10-15 minutes'
      });
    }

    // Phase 5: Details and finishing
    phases.push({
      name: 'details',
      description: 'Add windows, doors, lighting, and decorations',
      priority: 5,
      materials: ['glass', 'oak_door', 'torch', 'lantern'],
      estimatedBlocks: Math.floor(size.x * size.z / 4),
      timeEstimate: '15-20 minutes'
    });

    return phases;
  }

  // Emergency building decisions using knowledge system
  handleBuildingEmergency(situation, context = {}) {
    const emergencyResponse = this.knowledge.getEmergencyResponse(situation);
    
    if (!emergencyResponse) {
      return { action: 'continue', reason: 'No emergency detected' };
    }

    switch (situation) {
      case 'low_health':
        return {
          action: 'pause_building',
          immediate: ['Find food immediately', 'Move to safe area', 'Avoid all mobs'],
          next: ['Resume building only when health > 15', 'Keep food in hotbar'],
          reason: 'Health critical - building suspended'
        };

      case 'no_tools':
        const toolNeeded = context.toolNeeded || 'pickaxe';
        const recipe = this.knowledge.getCraftingRecipe(`wooden_${toolNeeded}`);
        
        return {
          action: 'craft_tools',
          immediate: [`Craft ${toolNeeded} using recipe`, 'Gather materials: ' + Object.keys(recipe.materials).join(', ')],
          recipe: recipe,
          reason: `Cannot continue building without ${toolNeeded}`
        };

      case 'surrounded_by_mobs':
        return {
          action: 'defensive_building',
          immediate: ['Build pillar up 3 blocks', 'Place torches around area', 'Wait for daylight'],
          next: ['Light up entire building area', 'Clear mob spawning zones'],
          reason: 'Too dangerous to continue normal building'
        };

      default:
        return {
          action: 'assess_situation',
          reason: `Unknown emergency: ${situation}`
        };
    }
  }

  // Optimize building based on time of day and conditions
  optimizeBuildingSchedule() {
    const timeOfDay = this.bot.time.timeOfDay;
    const isDay = timeOfDay < 13000; // 0-13000 is day, 13000-24000 is night
    const weather = this.bot.isRaining ? 'rain' : 'clear';
    const currentHealth = this.bot.health;
    const currentFood = this.bot.food;

    const schedule = {
      recommended_activity: null,
      reasoning: '',
      safety_level: 'safe',
      modifications: []
    };

    // Time-based recommendations
    if (isDay) {
      schedule.recommended_activity = 'exterior_building';
      schedule.reasoning = 'Daylight - good visibility for large structures';
    } else {
      schedule.recommended_activity = 'interior_work';
      schedule.reasoning = 'Night time - safer to work on interior details';
      schedule.safety_level = 'cautious';
      schedule.modifications.push('Stay well-lit areas only');
    }

    // Health/food considerations
    if (currentHealth < 15) {
      schedule.recommended_activity = 'find_food_rest';
      schedule.reasoning = 'Low health - healing takes priority';
      schedule.safety_level = 'danger';
      schedule.modifications.push('No building until health > 15');
    }

    if (currentFood < 8) {
      schedule.modifications.push('Find food before continuing');
      schedule.safety_level = 'warning';
    }

    // Weather considerations
    if (weather === 'rain') {
      schedule.modifications.push('Consider covered work areas');
      schedule.reasoning += '. Rain reduces visibility.';
    }

    return schedule;
  }

  // Get detailed crafting instructions for building materials
  getBuildingMaterialRecipes(materialList) {
    const recipes = {};
    const unavailableItems = [];

    for (const material of materialList) {
      const recipe = this.knowledge.getCraftingRecipe(material);
      
      if (recipe) {
        recipes[material] = {
          ...recipe,
          canCraft: this.hasRequiredMaterials(recipe.materials),
          missingItems: this.getMissingMaterials(recipe.materials)
        };
      } else {
        unavailableItems.push(material);
      }
    }

    return {
      craftableRecipes: recipes,
      unavailableItems: unavailableItems,
      summary: {
        canCraftNow: Object.values(recipes).filter(r => r.canCraft).length,
        needMaterials: Object.values(recipes).filter(r => !r.canCraft).length,
        totalRecipes: Object.keys(recipes).length
      }
    };
  }

  // Helper methods
  getAvailableMaterials() {
    return this.bot.inventory.items().map(item => item.name);
  }

  adaptMaterialsToInventory(palette, available) {
    // Substitute unavailable materials with similar available ones
    const substitutions = {
      'white_concrete': ['quartz_block', 'white_wool', 'bone_block'],
      'stone_bricks': ['cobblestone', 'stone', 'andesite'],
      'dark_oak_wood': ['oak_wood', 'spruce_wood', 'birch_wood'],
      'glass': ['white_stained_glass', 'light_gray_stained_glass'],
      'iron_blocks': ['iron_ingot', 'anvil', 'cauldron']
    };

    const adapted = { ...palette };

    for (const category of ['primary', 'secondary', 'accent']) {
      if (adapted[category]) {
        adapted[category] = adapted[category].map(material => {
          if (available.includes(material)) {
            return material;
          }
          
          // Find substitution
          const subs = substitutions[material] || [];
          const substitute = subs.find(sub => available.includes(sub));
          return substitute || material;
        });
      }
    }

    return adapted;
  }

  hasRequiredMaterials(materials) {
    const inventory = this.bot.inventory;
    
    for (const [material, needed] of Object.entries(materials)) {
      const available = inventory.count(material);
      if (available < needed) {
        return false;
      }
    }
    
    return true;
  }

  getMissingMaterials(materials) {
    const missing = {};
    const inventory = this.bot.inventory;
    
    for (const [material, needed] of Object.entries(materials)) {
      const available = inventory.count(material);
      if (available < needed) {
        missing[material] = needed - available;
      }
    }
    
    return missing;
  }

  getToolEfficiency(toolName, targetBlock) {
    // Simplified efficiency calculation
    const efficiencyMap = {
      'diamond_pickaxe': { stone: 'excellent', wood: 'poor', dirt: 'poor' },
      'iron_pickaxe': { stone: 'good', wood: 'poor', dirt: 'poor' },
      'stone_pickaxe': { stone: 'fair', wood: 'poor', dirt: 'poor' },
      'diamond_axe': { wood: 'excellent', stone: 'poor', dirt: 'poor' },
      'iron_axe': { wood: 'good', stone: 'poor', dirt: 'poor' },
      'diamond_shovel': { dirt: 'excellent', stone: 'poor', wood: 'poor' }
    };

    const blockType = targetBlock?.includes('wood') ? 'wood' : 
                     targetBlock?.includes('dirt') ? 'dirt' : 'stone';

    return efficiencyMap[toolName]?.[blockType] || 'unknown';
  }
}

module.exports = KnowledgeEnhancedBuilder;

// Example usage in WorldBuilderBrain:
/*
const KnowledgeEnhancedBuilder = require('./knowledge-enhanced-building.js');

// In WorldBuilderBrain constructor:
this.enhancedBuilder = new KnowledgeEnhancedBuilder(this.bot);

// In decision making:
const materials = this.enhancedBuilder.selectBuildingMaterials('castle', 'plains');
const progression = this.enhancedBuilder.planBuildingProgression('castle', {x: 20, y: 15, z: 20});
const schedule = this.enhancedBuilder.optimizeBuildingSchedule();

// Use these in AI decision prompts for much better building behavior
*/