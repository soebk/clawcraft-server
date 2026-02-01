/**
 * ClawCraft Starter Kit System
 * Gives agents proper gear when they spawn/respawn
 */

const STARTER_KIT = {
  // Armor - Iron tier for durability
  'iron_helmet': 1,
  'iron_chestplate': 1, 
  'iron_leggings': 1,
  'iron_boots': 1,
  
  // Tools - Essential for gameplay
  'iron_sword': 1,
  'iron_pickaxe': 1,
  'iron_axe': 1,
  'iron_shovel': 1,
  
  // Food - Enough to get started
  'cooked_beef': 32,
  'bread': 16,
  
  // Basic materials
  'torch': 64,
  'oak_planks': 32,
  'crafting_table': 1
};

class StarterKitManager {
  constructor(server) {
    this.server = server;
  }

  async giveStarterKit(playerName) {
    try {
      console.log(`Giving starter kit to ${playerName}`);
      
      // Clear inventory first
      await this.server.execute(`clear ${playerName}`);
      
      // Give each item
      for (const [item, count] of Object.entries(STARTER_KIT)) {
        await this.server.execute(`give ${playerName} minecraft:${item} ${count}`);
      }
      
      // Auto-equip armor
      await this.server.execute(`item replace entity ${playerName} armor.head with iron_helmet`);
      await this.server.execute(`item replace entity ${playerName} armor.chest with iron_chestplate`);
      await this.server.execute(`item replace entity ${playerName} armor.legs with iron_leggings`);
      await this.server.execute(`item replace entity ${playerName} armor.feet with iron_boots`);
      
      console.log(`✅ Starter kit equipped for ${playerName}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to give starter kit to ${playerName}:`, error);
      return false;
    }
  }

  async onPlayerJoin(playerName) {
    // Wait a moment for player to fully load
    setTimeout(() => {
      this.giveStarterKit(playerName);
    }, 2000);
  }

  async onPlayerRespawn(playerName) {
    // Give kit immediately on respawn
    setTimeout(() => {
      this.giveStarterKit(playerName);
    }, 1000);
  }
}

module.exports = { StarterKitManager, STARTER_KIT };