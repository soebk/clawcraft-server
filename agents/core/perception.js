/**
 * Perception System - Parse Minecraft game state for LLM
 * Converts raw Mineflayer data into human-readable context
 */

class PerceptionSystem {
  constructor(bot) {
    this.bot = bot;
  }

  /**
   * Get complete game state summary for LLM
   * @returns {Object} Structured game state
   */
  getGameState() {
    return {
      agent: this.getAgentState(),
      environment: this.getEnvironmentState(),
      entities: this.getNearbyEntities(),
      inventory: this.getInventoryState(),
      goals: this.getCurrentGoals(),
    };
  }

  /**
   * Get agent's current state (health, position, etc.)
   */
  getAgentState() {
    const bot = this.bot;
    return {
      username: bot.username,
      health: bot.health,
      food: bot.food,
      position: {
        x: Math.floor(bot.entity.position.x),
        y: Math.floor(bot.entity.position.y),
        z: Math.floor(bot.entity.position.z),
      },
      gameMode: bot.game.gameMode,
      experience: {
        level: bot.experience.level,
        points: bot.experience.points,
      },
    };
  }

  /**
   * Get environment information (biome, time, weather)
   */
  getEnvironmentState() {
    const bot = this.bot;
    const time = bot.time.timeOfDay;
    const isDay = time < 6000 || time > 18000;
    
    return {
      biome: bot.blockAt(bot.entity.position)?.biome?.name || unknown,
      time: time,
      isDay: isDay,
      weather: bot.isRaining ? raining : clear,
    };
  }

  /**
   * Get nearby entities (players, mobs, items)
   */
  getNearbyEntities() {
    const bot = this.bot;
    const range = 16; // blocks
    const entities = Object.values(bot.entities)
      .filter(entity => entity.position.distanceTo(bot.entity.position) < range)
      .map(entity => ({
        type: entity.name,
        username: entity.username || null,
        distance: Math.floor(entity.position.distanceTo(bot.entity.position)),
        position: {
          x: Math.floor(entity.position.x),
          y: Math.floor(entity.position.y),
          z: Math.floor(entity.position.z),
        },
      }));

    return entities;
  }

  /**
   * Get inventory state
   */
  getInventoryState() {
    const bot = this.bot;
    const items = bot.inventory.items().map(item => ({
      name: item.name,
      count: item.count,
      slot: item.slot,
    }));

    return {
      totalItems: items.length,
      items: items,
      emptySlots: 36 - items.length, // 36 slots in main inventory
    };
  }

  /**
   * Get current goals/objectives
   */
  getCurrentGoals() {
    // This will be populated by the decision system
    return this.bot.currentGoals || [];
  }

  /**
   * Convert game state to natural language for LLM
   */
  toNaturalLanguage() {
    const state = this.getGameState();
    const { agent, environment, entities, inventory } = state;

    let description = `You are ${agent.username}, an autonomous Minecraft agent.\n\n`;
    
    description += `Current Status:\n`;
    description += `- Health: ${agent.health}/20\n`;
    description += `- Food: ${agent.food}/20\n`;
    description += `- Position: (${agent.position.x}, ${agent.position.y}, ${agent.position.z})\n`;
    description += `- Experience Level: ${agent.experience.level}\n\n`;

    description += `Environment:\n`;
    description += `- Biome: ${environment.biome}\n`;
    description += `- Time: ${environment.isDay ? Day : Night}\n`;
    description += `- Weather: ${environment.weather}\n\n`;

    if (entities.length > 0) {
      description += `Nearby Entities:\n`;
      entities.forEach(entity => {
        description += `- ${entity.type}${entity.username ? ` (${entity.username})` : } at distance ${entity.distance} blocks\n`;
      });
      description += `\n`;
    }

    description += `Inventory (${inventory.totalItems} items):\n`;
    if (inventory.items.length > 0) {
      inventory.items.forEach(item => {
        description += `- ${item.name} x${item.count}\n`;
      });
    } else {
      description += `- Empty\n`;
    }

    return description;
  }
}

module.exports = PerceptionSystem;
