#!/usr/bin/env node
/**
 * Smart Minecraft Survival Agent
 * Incorporates advanced survival skills and intelligent decision making
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalNear, GoalBlock, GoalXZ, GoalY, GoalInvert, GoalFollow } = goals;

class SmartSurvivalAgent {
  constructor(username, role = 'survivor') {
    this.username = username;
    this.role = role;
    this.bot = null;
    this.mcData = null;
    this.currentActivity = 'spawning';
    this.lastActivityTime = Date.now();
    this.survivalPriorities = this.initializePriorities();
    this.inventory = new InventoryManager();
    this.craftingQueue = [];
    this.emergencyMode = false;
    
    this.init();
  }

  init() {
    console.log(`🎮 Starting ${this.username} - Role: ${this.role}`);
    
    this.bot = mineflayer.createBot({
      host: '89.167.28.237',
      port: 25565,
      username: this.username,
      version: '1.21.4',
      auth: 'offline'
    });

    this.setupEventHandlers();
    this.loadPlugins();
  }

  initializePriorities() {
    return {
      // Critical survival needs (0-100 scale)
      health: () => this.bot?.health || 0,
      food: () => this.bot?.food || 0,
      safety: () => this.calculateSafetyLevel(),
      tools: () => this.calculateToolQuality(),
      shelter: () => this.hasShelter() ? 80 : 20,
      resources: () => this.calculateResourceLevel()
    };
  }

  loadPlugins() {
    try {
      this.bot.loadPlugin(pathfinder);
      
      this.mcData = require('minecraft-data')(this.bot.version);
      const movements = new Movements(this.bot, this.mcData);
      movements.canDig = true;
      movements.scafoldingBlocks = [this.mcData.blocksByName.cobblestone?.id].filter(Boolean);
      
      if (this.bot.pathfinder) {
        this.bot.pathfinder.setMovements(movements);
      }
    } catch (err) {
      console.log(`⚠️ [${this.username}] Plugin loading failed:`, err.message);
    }
  }

  setupEventHandlers() {
    this.bot.once('spawn', () => this.onSpawn());
    this.bot.on('chat', (username, message) => this.onChat(username, message));
    this.bot.on('health', () => this.onHealthChange());
    this.bot.on('physicTick', () => this.onTick());
    this.bot.on('entityHurt', (entity) => this.onEntityHurt(entity));
    this.bot.on('error', err => this.onError(err));
    this.bot.on('end', () => this.onDisconnect());
  }

  async onSpawn() {
    console.log(`🎮 ${this.username} spawned! Role: ${this.role}`);
    this.currentActivity = 'assessing_situation';
    
    // Initial situational assessment
    await this.sleep(1000);
    await this.assessSituation();
    await this.startMainLoop();
  }

  async assessSituation() {
    const timeOfDay = this.bot.time.timeOfDay;
    const isDaytime = timeOfDay < 12000;
    const health = this.bot.health;
    const food = this.bot.food;
    
    console.log(`📊 [${this.username}] Assessment - Health: ${health}/20, Food: ${food}/20, Time: ${isDaytime ? 'Day' : 'Night'}`);
    
    // Determine immediate priorities
    if (health < 10 || food < 6) {
      this.emergencyMode = true;
      this.currentActivity = 'emergency_survival';
    } else if (!isDaytime && !this.hasShelter()) {
      this.currentActivity = 'find_shelter';
    } else {
      this.currentActivity = 'gather_resources';
      this.emergencyMode = false;
    }
  }

  async startMainLoop() {
    while (this.bot && this.bot.entity) {
      try {
        await this.executeMainActivity();
        await this.sleep(2000); // 2 second cycle
      } catch (error) {
        console.log(`❌ [${this.username}] Main loop error:`, error.message);
        await this.sleep(5000);
      }
    }
  }

  async executeMainActivity() {
    // Emergency check first
    if (this.bot.health < 8 || this.bot.food < 4) {
      await this.handleEmergency();
      return;
    }

    // Activity routing based on intelligence
    switch (this.currentActivity) {
      case 'emergency_survival':
        await this.handleEmergency();
        break;
      case 'gather_resources':
        await this.gatherEssentialResources();
        break;
      case 'craft_tools':
        await this.smartCrafting();
        break;
      case 'find_food':
        await this.findFood();
        break;
      case 'find_shelter':
        await this.findOrBuildShelter();
        break;
      case 'explore':
        await this.intelligentExploration();
        break;
      default:
        await this.assessSituation();
    }

    // Update activity based on current needs
    await this.updateActivity();
  }

  async handleEmergency() {
    console.log(`🚨 [${this.username}] Emergency mode - Health: ${this.bot.health}, Food: ${this.bot.food}`);
    
    // Priority 1: Immediate food
    if (this.bot.food < 6) {
      await this.findImmediateFood();
    }
    
    // Priority 2: Flee from threats
    const threats = this.detectThreats();
    if (threats.length > 0) {
      await this.fleeFromThreats(threats);
    }
    
    // Priority 3: Find safe space
    await this.findSafeSpace();
    
    // Priority 4: Basic shelter if night
    const timeOfDay = this.bot.time.timeOfDay;
    if (timeOfDay > 13000 && timeOfDay < 23000) {
      await this.buildEmergencyShelter();
    }
  }

  async gatherEssentialResources() {
    const priorities = this.calculateResourcePriorities();
    
    console.log(`⛏️ [${this.username}] Gathering resources - Priority: ${priorities[0]?.type}`);
    
    if (priorities.length === 0) {
      this.currentActivity = 'explore';
      return;
    }

    const topPriority = priorities[0];
    
    switch (topPriority.type) {
      case 'wood':
        await this.gatherWood();
        break;
      case 'stone':
        await this.gatherStone();
        break;
      case 'coal':
        await this.findCoal();
        break;
      case 'iron':
        await this.findIron();
        break;
      case 'food':
        this.currentActivity = 'find_food';
        break;
    }
  }

  calculateResourcePriorities() {
    const needs = [];
    
    // Check tool needs
    if (!this.hasBasicTools()) {
      needs.push({ type: 'wood', priority: 100, reason: 'need_basic_tools' });
    }
    
    if (this.hasWoodenTools() && !this.hasStoneTools()) {
      needs.push({ type: 'stone', priority: 90, reason: 'upgrade_to_stone' });
    }
    
    if (!this.hasCoal() && this.hasStoneTools()) {
      needs.push({ type: 'coal', priority: 80, reason: 'need_torches' });
    }
    
    if (this.bot.food < 12) {
      needs.push({ type: 'food', priority: 95, reason: 'low_food' });
    }
    
    if (this.hasStoneTools() && !this.hasIronTools()) {
      needs.push({ type: 'iron', priority: 70, reason: 'upgrade_to_iron' });
    }
    
    return needs.sort((a, b) => b.priority - a.priority);
  }

  async gatherWood() {
    const wood = this.bot.findBlock({
      matching: [
        this.mcData.blocksByName.oak_log?.id,
        this.mcData.blocksByName.birch_log?.id,
        this.mcData.blocksByName.spruce_log?.id,
        this.mcData.blocksByName.jungle_log?.id
      ].filter(Boolean),
      maxDistance: 32
    });

    if (wood) {
      console.log(`🌳 [${this.username}] Found wood at ${wood.position}`);
      
      try {
        await this.bot.pathfinder.goto(new GoalBlock(wood.x, wood.y, wood.z));
        await this.bot.dig(wood);
        
        // Look for more wood nearby
        await this.gatherNearbyWood(wood.position);
        
        // Craft basic tools if we have enough wood
        if (this.getItemCount('oak_log') >= 4) {
          await this.craftBasicTools();
        }
      } catch (err) {
        console.log(`❌ [${this.username}] Wood gathering failed:`, err.message);
      }
    } else {
      console.log(`🔍 [${this.username}] No wood found nearby, exploring...`);
      this.currentActivity = 'explore';
    }
  }

  async gatherNearbyWood(centerPos) {
    const nearbyWood = this.bot.findBlocks({
      matching: [
        this.mcData.blocksByName.oak_log?.id,
        this.mcData.blocksByName.birch_log?.id,
        this.mcData.blocksByName.spruce_log?.id
      ].filter(Boolean),
      maxDistance: 8,
      count: 10
    });

    for (const woodPos of nearbyWood) {
      try {
        const block = this.bot.blockAt(woodPos);
        if (block) {
          await this.bot.pathfinder.goto(new GoalBlock(woodPos.x, woodPos.y, woodPos.z));
          await this.bot.dig(block);
          await this.sleep(500);
        }
      } catch (err) {
        // Skip this wood block if unreachable
        continue;
      }
    }
  }

  async craftBasicTools() {
    // Convert logs to planks
    const logs = this.bot.inventory.findInventoryItem(item => item.name.includes('log'));
    if (logs) {
      await this.smartCraft('oak_planks', Math.min(logs.count, 8));
    }
    
    // Craft sticks
    await this.smartCraft('stick', 4);
    
    // Craft essential tools in priority order
    if (!this.hasTool('pickaxe')) {
      await this.smartCraft('wooden_pickaxe', 1);
    }
    
    if (!this.hasTool('axe')) {
      await this.smartCraft('wooden_axe', 1);
    }
    
    if (!this.hasTool('sword')) {
      await this.smartCraft('wooden_sword', 1);
    }
    
    // Craft workbench for future use
    if (!this.hasItem('crafting_table')) {
      await this.smartCraft('crafting_table', 1);
    }
  }

  async gatherStone() {
    // Look for surface stone or dig down
    let stone = this.bot.findBlock({
      matching: this.mcData.blocksByName.stone?.id,
      maxDistance: 32
    });
    
    if (!stone) {
      // Dig down to find stone
      console.log(`⬇️ [${this.username}] Digging down to find stone`);
      await this.safeDigDown();
      return;
    }
    
    try {
      await this.bot.pathfinder.goto(new GoalBlock(stone.x, stone.y, stone.z));
      await this.mineStoneDeposit(stone.position);
      
      // Upgrade to stone tools
      if (this.getItemCount('cobblestone') >= 8) {
        await this.upgradeToStoneTools();
      }
    } catch (err) {
      console.log(`❌ [${this.username}] Stone gathering failed:`, err.message);
    }
  }

  async safeDigDown() {
    const startPos = this.bot.entity.position.clone();
    let currentDepth = 0;
    const maxDepth = 20;
    
    while (currentDepth < maxDepth) {
      const belowBlock = this.bot.blockAt(this.bot.entity.position.offset(0, -1, 0));
      
      if (belowBlock && belowBlock.name !== 'air' && belowBlock.name !== 'lava') {
        try {
          await this.bot.dig(belowBlock);
          await this.sleep(200);
          
          if (belowBlock.name === 'stone' || belowBlock.name === 'cobblestone') {
            console.log(`⛏️ [${this.username}] Found stone at depth ${currentDepth}`);
            await this.mineStoneDeposit(belowBlock.position);
            break;
          }
          
          currentDepth++;
        } catch (err) {
          console.log(`❌ [${this.username}] Dig down failed:`, err.message);
          break;
        }
      } else {
        // Hit air or lava, stop digging
        break;
      }
    }
    
    // Build ladder back up if needed
    await this.buildEscapeRoute(startPos);
  }

  async mineStoneDeposit(centerPos) {
    const stoneBlocks = this.bot.findBlocks({
      matching: [this.mcData.blocksByName.stone?.id, this.mcData.blocksByName.cobblestone?.id].filter(Boolean),
      maxDistance: 5,
      count: 20
    });

    let minedCount = 0;
    for (const stonePos of stoneBlocks) {
      try {
        const block = this.bot.blockAt(stonePos);
        if (block && this.hasTool('pickaxe')) {
          await this.bot.dig(block);
          minedCount++;
          await this.sleep(300);
          
          if (minedCount >= 10) break; // Don't mine too much at once
        }
      } catch (err) {
        continue;
      }
    }
    
    console.log(`⛏️ [${this.username}] Mined ${minedCount} stone blocks`);
  }

  async upgradeToStoneTools() {
    console.log(`🔧 [${this.username}] Upgrading to stone tools`);
    
    const toolUpgrades = ['stone_pickaxe', 'stone_axe', 'stone_sword'];
    
    for (const tool of toolUpgrades) {
      if (!this.hasItem(tool)) {
        await this.smartCraft(tool, 1);
      }
    }
  }

  async findFood() {
    console.log(`🍖 [${this.username}] Looking for food - Current: ${this.bot.food}/20`);
    
    // Priority 1: Hunt animals
    const animals = this.findNearbyAnimals();
    if (animals.length > 0) {
      await this.huntAnimals(animals);
      return;
    }
    
    // Priority 2: Look for apples from trees
    await this.searchForApples();
    
    // Priority 3: Emergency food (rotten flesh)
    const rottenFlesh = this.bot.inventory.findInventoryItem('rotten_flesh');
    if (rottenFlesh && this.bot.food < 8) {
      console.log(`🤢 [${this.username}] Eating rotten flesh as emergency food`);
      await this.bot.consume();
    }
    
    // If still no food, switch to exploration to find animals
    if (this.bot.food < 10) {
      this.currentActivity = 'explore';
    }
  }

  findNearbyAnimals() {
    const passiveAnimals = ['pig', 'cow', 'chicken', 'sheep'];
    return Object.values(this.bot.entities).filter(entity => 
      entity.mobType && 
      passiveAnimals.includes(entity.mobType) &&
      entity.position.distanceTo(this.bot.entity.position) < 16
    );
  }

  async huntAnimals(animals) {
    const sword = this.bot.inventory.findInventoryItem(item => item.name.includes('sword'));
    if (sword) {
      await this.bot.equip(sword, 'hand');
    }
    
    for (const animal of animals.slice(0, 3)) { // Hunt max 3 at once
      try {
        console.log(`🏹 [${this.username}] Hunting ${animal.mobType}`);
        await this.bot.pathfinder.goto(new GoalNear(animal.position.x, animal.position.y, animal.position.z, 2));
        await this.bot.attack(animal);
        await this.sleep(1000);
        
        // Cook meat if we have coal/wood
        if (this.hasItem('raw_beef') || this.hasItem('raw_pork')) {
          await this.cookFood();
        }
      } catch (err) {
        console.log(`❌ [${this.username}] Hunting failed:`, err.message);
      }
    }
  }

  async cookFood() {
    const furnace = this.bot.findBlock({
      matching: this.mcData.blocksByName.furnace?.id,
      maxDistance: 32
    });
    
    if (!furnace) {
      // Build a furnace if we have cobblestone
      if (this.getItemCount('cobblestone') >= 8) {
        await this.smartCraft('furnace', 1);
        // Place and use furnace
        // TODO: Add furnace placement logic
      }
      return;
    }
    
    // TODO: Add cooking logic
  }

  detectThreats() {
    const hostileMobs = ['zombie', 'skeleton', 'creeper', 'spider', 'enderman'];
    return Object.values(this.bot.entities).filter(entity => 
      entity.mobType && 
      hostileMobs.includes(entity.mobType) &&
      entity.position.distanceTo(this.bot.entity.position) < 16
    );
  }

  async fleeFromThreats(threats) {
    const nearestThreat = threats[0];
    console.log(`🏃 [${this.username}] Fleeing from ${nearestThreat.mobType}`);
    
    // Calculate flee direction (opposite of threat)
    const fleeVector = this.bot.entity.position.clone()
      .subtract(nearestThreat.position)
      .normalize()
      .scale(20);
    
    const fleePosition = this.bot.entity.position.clone().add(fleeVector);
    
    try {
      await this.bot.pathfinder.goto(new GoalXZ(fleePosition.x, fleePosition.z));
    } catch (err) {
      // If flee path blocked, try vertical escape
      await this.bot.pathfinder.goto(new GoalY(this.bot.entity.position.y + 5));
    }
  }

  async buildEmergencyShelter() {
    console.log(`🏠 [${this.username}] Building emergency shelter`);
    
    const buildMaterial = this.getBuildMaterial();
    if (!buildMaterial) {
      console.log(`❌ [${this.username}] No building materials for shelter`);
      return;
    }
    
    const pos = this.bot.entity.position.floored();
    const shelterBlocks = [
      pos.offset(-1, 0, -1), pos.offset(0, 0, -1), pos.offset(1, 0, -1),
      pos.offset(-1, 0, 0),                        pos.offset(1, 0, 0),
      pos.offset(-1, 0, 1),  pos.offset(0, 0, 1),  pos.offset(1, 0, 1)
    ];
    
    // Build walls
    for (const wallPos of shelterBlocks) {
      await this.placeBlockSafe(wallPos, buildMaterial);
      await this.placeBlockSafe(wallPos.offset(0, 1, 0), buildMaterial);
    }
    
    // Build roof
    for (const roofPos of shelterBlocks) {
      await this.placeBlockSafe(roofPos.offset(0, 2, 0), buildMaterial);
    }
    
    // Add light
    if (this.hasItem('torch')) {
      await this.placeBlockSafe(pos, 'torch');
    }
    
    console.log(`✅ [${this.username}] Emergency shelter complete`);
  }

  // Utility functions
  async smartCraft(itemName, quantity = 1) {
    try {
      const recipe = this.mcData.recipesByName[itemName];
      if (recipe) {
        await this.bot.craft(recipe, quantity);
        console.log(`🔧 [${this.username}] Crafted ${quantity}x ${itemName}`);
        return true;
      }
    } catch (err) {
      console.log(`❌ [${this.username}] Failed to craft ${itemName}:`, err.message);
    }
    return false;
  }

  async placeBlockSafe(position, blockType) {
    try {
      const item = this.bot.inventory.findInventoryItem(blockType);
      if (item) {
        await this.bot.equip(item, 'hand');
        await this.bot.placeBlock(this.bot.blockAt(position), new this.bot.Vec3(0, 1, 0));
      }
    } catch (err) {
      // Ignore placement errors
    }
  }

  hasBasicTools() {
    return this.hasTool('pickaxe') && this.hasTool('axe');
  }

  hasWoodenTools() {
    return this.hasItem('wooden_pickaxe') || this.hasItem('wooden_axe');
  }

  hasStoneTools() {
    return this.hasItem('stone_pickaxe') || this.hasItem('stone_axe');
  }

  hasIronTools() {
    return this.hasItem('iron_pickaxe') || this.hasItem('iron_axe');
  }

  hasTool(toolType) {
    return this.bot.inventory.items().some(item => 
      item.name.includes(toolType)
    );
  }

  hasItem(itemName) {
    return this.bot.inventory.findInventoryItem(itemName) !== null;
  }

  hasCoal() {
    return this.hasItem('coal') || this.hasItem('charcoal');
  }

  getItemCount(itemName) {
    const item = this.bot.inventory.findInventoryItem(itemName);
    return item ? item.count : 0;
  }

  getBuildMaterial() {
    const materials = ['cobblestone', 'stone', 'dirt', 'oak_planks'];
    for (const material of materials) {
      if (this.getItemCount(material) >= 20) {
        return material;
      }
    }
    return null;
  }

  calculateSafetyLevel() {
    const threats = this.detectThreats();
    const timeOfDay = this.bot.time.timeOfDay;
    const isDaytime = timeOfDay < 12000;
    
    let safety = isDaytime ? 80 : 40;
    safety -= threats.length * 20;
    
    return Math.max(0, safety);
  }

  calculateToolQuality() {
    if (this.hasIronTools()) return 90;
    if (this.hasStoneTools()) return 70;
    if (this.hasWoodenTools()) return 50;
    return 20;
  }

  calculateResourceLevel() {
    const wood = this.getItemCount('oak_log') + this.getItemCount('oak_planks');
    const stone = this.getItemCount('cobblestone');
    const coal = this.getItemCount('coal');
    
    return Math.min(100, (wood + stone + coal) * 2);
  }

  hasShelter() {
    // TODO: Implement shelter detection
    return false;
  }

  async updateActivity() {
    const health = this.bot.health;
    const food = this.bot.food;
    const timeOfDay = this.bot.time.timeOfDay;
    
    // Emergency conditions
    if (health < 8 || food < 4) {
      this.currentActivity = 'emergency_survival';
      return;
    }
    
    // Night safety
    if (timeOfDay > 13000 && timeOfDay < 23000 && !this.hasShelter()) {
      this.currentActivity = 'find_shelter';
      return;
    }
    
    // Resource-based decisions
    if (!this.hasBasicTools()) {
      this.currentActivity = 'gather_resources';
    } else if (food < 12) {
      this.currentActivity = 'find_food';
    } else if (this.hasWoodenTools() && !this.hasStoneTools()) {
      this.currentActivity = 'gather_resources'; // For stone
    } else {
      this.currentActivity = 'explore';
    }
  }

  async intelligentExploration() {
    console.log(`🔍 [${this.username}] Exploring intelligently`);
    
    // Look for interesting landmarks
    const targets = this.bot.findBlocks({
      matching: [
        this.mcData.blocksByName.coal_ore?.id,
        this.mcData.blocksByName.iron_ore?.id,
        this.mcData.blocksByName.oak_log?.id
      ].filter(Boolean),
      maxDistance: 32,
      count: 5
    });
    
    if (targets.length > 0) {
      const target = targets[0];
      try {
        await this.bot.pathfinder.goto(new GoalNear(target.x, target.y, target.z, 2));
        this.currentActivity = 'gather_resources';
      } catch (err) {
        // Continue exploring if can't reach target
      }
    } else {
      // Random exploration
      const randomDirection = Math.random() * 2 * Math.PI;
      const distance = 20 + Math.random() * 20;
      const targetX = this.bot.entity.position.x + Math.cos(randomDirection) * distance;
      const targetZ = this.bot.entity.position.z + Math.sin(randomDirection) * distance;
      
      try {
        await this.bot.pathfinder.goto(new GoalXZ(targetX, targetZ));
      } catch (err) {
        // Try different direction
      }
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Event handlers
  onHealthChange() {
    if (this.bot.health < 10) {
      console.log(`❤️ [${this.username}] Low health: ${this.bot.health}/20`);
    }
  }

  onChat(username, message) {
    if (username !== this.bot.username) {
      console.log(`💬 [${this.username}] ${username}: ${message}`);
      
      // Respond to basic interactions
      if (message.toLowerCase().includes(this.username.toLowerCase())) {
        this.bot.chat(`👋 Hello ${username}! I'm ${this.role} ${this.username}`);
      }
    }
  }

  onEntityHurt(entity) {
    if (entity === this.bot.entity) {
      console.log(`🤕 [${this.username}] I was hurt! Health: ${this.bot.health}/20`);
      this.emergencyMode = true;
      this.currentActivity = 'emergency_survival';
    }
  }

  onError(err) {
    console.log(`❌ [${this.username}] Bot error:`, err.message);
  }

  onDisconnect() {
    console.log(`🔌 [${this.username}] Disconnected. Attempting to reconnect...`);
    setTimeout(() => {
      this.init();
    }, 5000);
  }

  onTick() {
    // Efficient tick handler - only run essential checks
    if (Date.now() - this.lastActivityTime > 30000) {
      // Force activity update if stuck
      this.lastActivityTime = Date.now();
      this.currentActivity = 'assess_situation';
    }
  }
}

// Inventory management helper
class InventoryManager {
  constructor() {
    this.essentialItems = {
      tools: ['pickaxe', 'axe', 'sword', 'shovel'],
      food: ['cooked_beef', 'bread', 'cooked_pork'],
      materials: ['cobblestone', 'oak_planks', 'coal'],
      safety: ['torch', 'water_bucket']
    };
  }
  
  // TODO: Implement smart inventory management
}

// Start the agent
if (require.main === module) {
  const args = process.argv.slice(2);
  const username = args[0] || 'SmartBot';
  const role = args[1] || 'survivor';
  
  new SmartSurvivalAgent(username, role);
}

module.exports = SmartSurvivalAgent;