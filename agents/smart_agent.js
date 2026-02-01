/**
 * ClawCraft Smart Agent
 * AI agent that actually knows how to play Minecraft well
 */

const { MINECRAFT_BASICS, MINECRAFT_RULES, AGENT_STRATEGIES } = require('./minecraft_knowledge.js');
const { StarterKitManager } = require('./starter_kit.js');

class SmartMinecraftAgent {
  constructor(name, server) {
    this.name = name;
    this.server = server;
    this.state = {
      health: 20,
      hunger: 20,
      position: { x: 0, y: 64, z: 0 },
      inventory: {},
      time_of_day: 'day',
      nearby_mobs: [],
      current_task: null
    };
    
    this.personality = this.generatePersonality();
    this.starterKit = new StarterKitManager(server);
  }

  generatePersonality() {
    const traits = [
      'aggressive', 'cautious', 'explorer', 'builder', 'survivor', 
      'fighter', 'miner', 'farmer', 'strategic', 'opportunistic'
    ];
    
    return {
      primary_trait: traits[Math.floor(Math.random() * traits.length)],
      aggression: Math.random(), // 0-1
      risk_tolerance: Math.random(), // 0-1  
      exploration_drive: Math.random() // 0-1
    };
  }

  async tick() {
    try {
      // Update game state
      await this.updateGameState();
      
      // Survival priorities (in order)
      if (this.state.health <= MINECRAFT_BASICS.HEALTH.critical_threshold) {
        return await this.emergencyHeal();
      }
      
      if (this.state.hunger <= MINECRAFT_BASICS.HUNGER.eat_threshold && this.hasFood()) {
        return await this.eat();
      }
      
      if (this.nearbyHostiles().length > 0) {
        return await this.handleCombat();
      }
      
      // Core gameplay activities
      const action = this.chooseAction();
      return await this.executeAction(action);
      
    } catch (error) {
      console.error(`Agent ${this.name} error:`, error);
      return await this.defaultAction();
    }
  }

  async updateGameState() {
    // This would integrate with Mineflayer to get real game state
    // For now, simulated
    const commands = [
      `data get entity ${this.name} Health`,
      `data get entity ${this.name} foodLevel`, 
      `execute at ${this.name} run data get entity @e[distance=..10,type=!player] type`
    ];
    
    // In real implementation, parse server responses
    // this.state.health = parsed_health;
    // this.state.hunger = parsed_hunger;
    // this.state.nearby_mobs = parsed_mobs;
  }

  nearbyHostiles() {
    return this.state.nearby_mobs.filter(mob => 
      MINECRAFT_BASICS.HOSTILE_MOBS.includes(mob.type)
    );
  }

  hasFood() {
    const foodItems = ['cooked_beef', 'bread', 'cooked_pork', 'apple'];
    return foodItems.some(food => this.state.inventory[food] > 0);
  }

  chooseAction() {
    const { primary_trait, aggression, risk_tolerance, exploration_drive } = this.personality;
    
    // Personality-based decision making
    if (primary_trait === 'fighter' && aggression > 0.7) {
      return 'hunt_mobs';
    }
    
    if (primary_trait === 'miner' || this.needsResources()) {
      return 'mine_iron';
    }
    
    if (primary_trait === 'farmer' || this.needsFood()) {
      return 'farm_crops';
    }
    
    if (primary_trait === 'builder' || this.needsShelter()) {
      return 'build_shelter';
    }
    
    if (exploration_drive > 0.6) {
      return 'explore_area';
    }
    
    return 'gather_wood'; // Default safe activity
  }

  async executeAction(action) {
    console.log(`${this.name} choosing action: ${action}`);
    
    switch (action) {
      case 'hunt_mobs':
        return await this.huntMobs();
      case 'mine_iron':
        return await this.mineIron();
      case 'farm_crops':
        return await this.farmCrops();
      case 'build_shelter':
        return await this.buildShelter();
      case 'explore_area':
        return await this.explore();
      case 'gather_wood':
        return await this.gatherWood();
      default:
        return await this.defaultAction();
    }
  }

  async huntMobs() {
    console.log(`${this.name}: Hunting mobs nearby`);
    
    // Find nearest hostile mob
    const hostiles = this.nearbyHostiles();
    if (hostiles.length === 0) {
      return await this.explore(); // Go find mobs
    }
    
    const target = hostiles[0];
    
    // Combat strategy based on mob type
    if (target.type === 'creeper') {
      // Keep distance, use bow if available
      await this.server.execute(`tell ${this.name} Fighting creeper - keeping distance!`);
      return await this.rangedAttack(target);
    } else {
      // Melee combat
      await this.server.execute(`tell ${this.name} Engaging ${target.type} in melee!`);
      return await this.meleeAttack(target);
    }
  }

  async mineIron() {
    console.log(`${this.name}: Going mining for iron`);
    
    const iron_level = MINECRAFT_BASICS.MINING.iron_level.best;
    
    // Go to mining level
    await this.server.execute(`tp ${this.name} ~ ${iron_level} ~`);
    await this.server.execute(`tell ${this.name} Mining iron at level ${iron_level}`);
    
    // Start branch mining pattern
    return await this.branchMine();
  }

  async farmCrops() {
    console.log(`${this.name}: Starting farming operations`);
    
    await this.server.execute(`tell ${this.name} Time to grow some food!`);
    
    // Find suitable farming area
    // Plant wheat, carrots, potatoes
    // Water and light management
    
    return true;
  }

  async buildShelter() {
    console.log(`${this.name}: Building shelter`);
    
    await this.server.execute(`tell ${this.name} Building a safe shelter`);
    
    // Choose building materials from knowledge base
    const materials = MINECRAFT_BASICS.BUILDING.shelter_materials;
    const chosen_material = materials[0]; // cobblestone for durability
    
    // Build simple 5x5 house with door and windows
    return await this.constructBasicShelter(chosen_material);
  }

  async explore() {
    console.log(`${this.name}: Exploring the world`);
    
    const directions = ['north', 'south', 'east', 'west'];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    
    await this.server.execute(`tell ${this.name} Exploring to the ${direction}!`);
    
    // Random walk in chosen direction
    const distance = 20 + Math.floor(Math.random() * 30);
    return await this.walkDirection(direction, distance);
  }

  async gatherWood() {
    console.log(`${this.name}: Gathering wood resources`);
    
    await this.server.execute(`tell ${this.name} Collecting wood for crafting`);
    
    // Find nearest tree and chop it down
    // Use axe for efficiency
    return await this.chopTrees();
  }

  // Emergency actions
  async emergencyHeal() {
    console.log(`${this.name}: EMERGENCY - Low health, healing!`);
    
    await this.server.execute(`tell ${this.name} Emergency! Low health - finding safety!`);
    
    // Find safe place and heal
    if (this.hasFood()) {
      await this.eat();
    }
    
    // Run away from danger
    return await this.flee();
  }

  async eat() {
    console.log(`${this.name}: Eating food`);
    
    const foodItems = ['cooked_beef', 'bread', 'cooked_pork'];
    const availableFood = foodItems.find(food => this.state.inventory[food] > 0);
    
    if (availableFood) {
      await this.server.execute(`tell ${this.name} Eating ${availableFood} to restore hunger`);
      // In real implementation: bot.consume()
    }
    
    return true;
  }

  async handleCombat() {
    const hostiles = this.nearbyHostiles();
    
    if (hostiles.length > 3 && this.personality.risk_tolerance < 0.4) {
      // Too many enemies, retreat
      await this.server.execute(`tell ${this.name} Too many enemies - tactical retreat!`);
      return await this.flee();
    }
    
    // Fight the nearest enemy
    return await this.huntMobs();
  }

  // Combat methods
  async meleeAttack(target) {
    // Implement melee combat with timing
    await this.server.execute(`tell ${this.name} Sword combat with ${target.type}!`);
    return true;
  }

  async rangedAttack(target) {
    // Use bow if available, otherwise throw items or keep distance
    await this.server.execute(`tell ${this.name} Ranged attack on ${target.type}!`);
    return true;
  }

  async flee() {
    await this.server.execute(`tell ${this.name} Strategic retreat!`);
    // Run in random direction away from danger
    return await this.walkDirection('random', 30);
  }

  // Helper methods
  async walkDirection(direction, distance) {
    // Move in specified direction
    console.log(`${this.name} walking ${direction} for ${distance} blocks`);
    return true;
  }

  async branchMine() {
    // Implement efficient branch mining pattern
    console.log(`${this.name} starting branch mining operation`);
    return true;
  }

  async chopTrees() {
    // Find and chop down trees efficiently
    console.log(`${this.name} chopping trees`);
    return true;
  }

  async constructBasicShelter(material) {
    // Build basic shelter with doors and windows
    console.log(`${this.name} building shelter with ${material}`);
    return true;
  }

  async defaultAction() {
    // Safe default - just walk around
    console.log(`${this.name} doing default action - walking around`);
    return await this.walkDirection('random', 10);
  }

  needsResources() {
    // Check if agent needs more materials
    return !this.state.inventory['iron_ingot'] || this.state.inventory['iron_ingot'] < 10;
  }

  needsFood() {
    // Check if agent needs more food
    return this.state.hunger < 15 || !this.hasFood();
  }

  needsShelter() {
    // Check if night is coming and agent needs shelter
    return this.state.time_of_day === 'night' && !this.hasNearbyShelter();
  }

  hasNearbyShelter() {
    // Check if there's shelter nearby (simplified)
    return false; // In real implementation, check for solid blocks overhead
  }
}

module.exports = { SmartMinecraftAgent };