/**
 * EnhancedAgentBrain.js - Ultra-intelligent agents with full Minecraft mastery
 * Claude Haiku powered with comprehensive game knowledge and advanced behaviors
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const collectBlock = require('mineflayer-collectblock').plugin;
const autoEatLoader = require('mineflayer-auto-eat');
const pvp = require('mineflayer-pvp').plugin;
const OpenAI = require('openai');
const Vec3 = require('vec3');

class EnhancedAgentBrain {
  constructor(config) {
    this.name = config.name;
    this.personality = config.personality;
    this.faction = config.faction || 'neutral';
    this.specialization = config.specialization || 'generalist';
    this.host = config.host || 'localhost';
    this.port = config.port || 25565;
    this.walletAddress = config.walletAddress || null;

    this.bot = null;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.isThinking = false;
    this.lastAction = null;
    this.chatHistory = [];
    this.memoryBank = new Map(); // Long-term memory
    this.goals = new Set(); // Current objectives
    this.knownPlayers = new Map(); // Player relationships
    this.knownLocations = new Map(); // Important places
    this.craftingKnowledge = this.initializeCraftingKnowledge();
    this.buildingPlans = [];
    this.tradingHistory = [];
    
    this.loopInterval = config.loopInterval || 2000;
    this.eventEmitter = config.eventEmitter || null;
    this.lastAttacker = null;
    this.lastDamageTime = 0;
    this.lastChatTime = 0;
    this.lastMajorAction = 0;
  }

  initializeCraftingKnowledge() {
    return {
      // Tool progression chains
      toolProgression: {
        'wood': ['wooden_pickaxe', 'wooden_axe', 'wooden_shovel', 'wooden_sword', 'wooden_hoe'],
        'stone': ['stone_pickaxe', 'stone_axe', 'stone_shovel', 'stone_sword', 'stone_hoe'],
        'iron': ['iron_pickaxe', 'iron_axe', 'iron_shovel', 'iron_sword', 'iron_hoe'],
        'diamond': ['diamond_pickaxe', 'diamond_axe', 'diamond_shovel', 'diamond_sword', 'diamond_hoe'],
        'netherite': ['netherite_pickaxe', 'netherite_axe', 'netherite_shovel', 'netherite_sword', 'netherite_hoe']
      },

      // Mining requirements
      miningTiers: {
        'coal_ore': 'wooden_pickaxe',
        'iron_ore': 'stone_pickaxe',
        'gold_ore': 'iron_pickaxe',
        'diamond_ore': 'iron_pickaxe',
        'redstone_ore': 'iron_pickaxe',
        'lapis_ore': 'stone_pickaxe',
        'emerald_ore': 'iron_pickaxe',
        'ancient_debris': 'diamond_pickaxe',
        'obsidian': 'diamond_pickaxe'
      },

      // Essential recipes
      recipes: {
        'crafting_table': { materials: { 'oak_planks': 4 }, shape: '2x2' },
        'furnace': { materials: { 'cobblestone': 8 }, shape: 'hollow_square' },
        'chest': { materials: { 'oak_planks': 8 }, shape: 'hollow_square' },
        'bed': { materials: { 'oak_planks': 3, 'white_wool': 3 }, shape: 'bed' },
        'torch': { materials: { 'coal': 1, 'stick': 1 }, count: 4 },
        'stick': { materials: { 'oak_planks': 2 }, count: 4, shape: 'vertical' },
        'oak_planks': { materials: { 'oak_log': 1 }, count: 4 },
        'stone_bricks': { materials: { 'stone': 4 }, shape: '2x2' },
        'glass': { smelting: { material: 'sand', fuel: 'coal' } },
        'iron_ingot': { smelting: { material: 'iron_ore', fuel: 'coal' } },
        'gold_ingot': { smelting: { material: 'gold_ore', fuel: 'coal' } }
      },

      // Food and cooking
      food: {
        'bread': { materials: { 'wheat': 3 }, nutrition: 5 },
        'cooked_beef': { smelting: { material: 'raw_beef', fuel: 'coal' }, nutrition: 8 },
        'cooked_porkchop': { smelting: { material: 'raw_porkchop', fuel: 'coal' }, nutrition: 8 },
        'baked_potato': { smelting: { material: 'potato', fuel: 'coal' }, nutrition: 5 },
        'golden_apple': { materials: { 'apple': 1, 'gold_ingot': 8 }, nutrition: 4, effects: ['regeneration', 'absorption'] }
      },

      // Building materials
      building: {
        foundation: ['stone', 'cobblestone', 'stone_bricks', 'deepslate'],
        walls: ['oak_planks', 'stone_bricks', 'bricks', 'smooth_stone'],
        roofing: ['oak_stairs', 'stone_brick_stairs', 'oak_slab'],
        decoration: ['glass', 'glass_pane', 'torch', 'lantern', 'item_frame', 'painting']
      }
    };
  }

  async connect() {
    console.log(`[${this.name}] Enhanced Agent connecting (${this.specialization})...`);

    this.bot = mineflayer.createBot({
      host: this.host,
      port: this.port,
      username: this.name,
      auth: 'offline',
      version: '1.21.4'
    });

    // Load all plugins
    this.bot.loadPlugin(pathfinder);
    this.bot.loadPlugin(collectBlock);
    this.bot.loadPlugin(autoEatLoader.loader);
    this.bot.loadPlugin(pvp);

    return new Promise((resolve, reject) => {
      this.bot.once('spawn', async () => {
        console.log(`[${this.name}] Enhanced Agent spawned! Specialization: ${this.specialization}`);
        this.setupAdvancedEventListeners();
        await this.giveAdvancedStarterKit();
        await this.assessEnvironment();
        this.startIntelligentGameLoop();
        resolve();
      });

      this.bot.on('error', (err) => {
        console.error(`[${this.name}] Error:`, err);
        reject(err);
      });

      this.bot.on('kicked', (reason) => {
        console.log(`[${this.name}] Kicked:`, reason);
      });

      this.bot.on('end', () => {
        console.log(`[${this.name}] Disconnected`);
      });
    });
  }

  async giveAdvancedStarterKit() {
    const bot = this.bot;
    console.log(`[${this.name}] Receiving advanced starter kit for ${this.specialization}...`);
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Base survival kit
    const baseKit = [
      'stone_sword 1',
      'stone_pickaxe 1', 
      'stone_axe 1',
      'stone_shovel 1',
      'crafting_table 2',
      'furnace 2',
      'torch 32',
      'bread 32',
      'cooked_beef 16',
      'oak_log 64',
      'cobblestone 64',
      'iron_ingot 16',
      'coal 32'
    ];

    // Specialization-specific additions
    const specializationKits = {
      builder: [
        'oak_planks 64', 'stone_bricks 64', 'glass 32', 'oak_stairs 32',
        'chest 8', 'bed 2', 'iron_door 2', 'oak_fence 32'
      ],
      miner: [
        'iron_pickaxe 2', 'bucket 3', 'ladder 64', 'torches 128',
        'diamond_pickaxe 1', 'water_bucket 1'
      ],
      farmer: [
        'wheat_seeds 64', 'potato 32', 'carrot 32', 'bone_meal 32',
        'water_bucket 2', 'hoe 1', 'fence 64', 'fence_gate 8'
      ],
      trader: [
        'emerald 16', 'gold_ingot 8', 'diamond 4', 'enchanted_book 2',
        'chest 16', 'item_frame 8', 'sign 16'
      ],
      warrior: [
        'iron_sword 2', 'bow 1', 'arrow 128', 'shield 1',
        'iron_helmet 1', 'iron_chestplate 1', 'iron_leggings 1', 'iron_boots 1',
        'golden_apple 8'
      ],
      explorer: [
        'map 4', 'compass 1', 'clock 1', 'boat 2',
        'ender_pearl 4', 'bed 4', 'food 64'
      ]
    };

    const fullKit = [...baseKit, ...(specializationKits[this.specialization] || [])];
    
    for (const item of fullKit) {
      bot.chat(`/give ${this.name} minecraft:${item}`);
      await new Promise(r => setTimeout(r, 100));
    }
    
    console.log(`[${this.name}] Advanced starter kit received! Ready for ${this.specialization} activities.`);
  }

  setupAdvancedEventListeners() {
    // Enhanced chat processing
    this.bot.on('chat', (username, message) => {
      if (username !== this.name) {
        this.processChatMessage(username, message);
        this.chatHistory.push({ from: username, message, time: Date.now() });
        if (this.chatHistory.length > 50) this.chatHistory.shift();
      }
    });

    // Combat and damage tracking
    this.bot.on('entityHurt', (entity) => {
      if (entity === this.bot.entity) {
        this.lastDamageTime = Date.now();
        this.analyzeAttackSource();
      }
    });

    // Block break notifications
    this.bot.on('diggingCompleted', (block) => {
      this.recordBlockMined(block);
      if (this.eventEmitter) {
        this.eventEmitter.emit('block_mined', {
          agent: this.name,
          block: block.name,
          position: block.position,
          wallet: this.walletAddress
        });
      }
    });

    // Entity interactions
    this.bot.on('entityDead', (entity) => {
      this.recordEntityKilled(entity);
      if (entity.type === 'mob' && this.eventEmitter) {
        this.eventEmitter.emit('mob_killed', {
          agent: this.name,
          mob: entity.name || entity.displayName,
          wallet: this.walletAddress
        });
      }
    });

    // Player join/leave tracking
    this.bot.on('playerJoined', (player) => {
      this.recordPlayerSeen(player.username, 'joined');
    });

    this.bot.on('playerLeft', (player) => {
      this.recordPlayerSeen(player.username, 'left');
    });
  }

  processChatMessage(username, message) {
    // Learn from chat patterns
    const lowerMsg = message.toLowerCase();
    
    // Trading mentions
    if (lowerMsg.includes('trade') || lowerMsg.includes('sell') || lowerMsg.includes('buy')) {
      this.memoryBank.set(`trade_interest_${username}`, {
        player: username,
        message: message,
        timestamp: Date.now()
      });
    }

    // Location mentions
    const coordMatch = message.match(/(-?\d+)[, ]+(-?\d+)(?:[, ]+(-?\d+))?/);
    if (coordMatch) {
      const coords = {
        x: parseInt(coordMatch[1]),
        z: parseInt(coordMatch[2]),
        y: coordMatch[3] ? parseInt(coordMatch[3]) : null
      };
      this.knownLocations.set(`coords_from_${username}`, coords);
    }

    // Relationship building
    if (!this.knownPlayers.has(username)) {
      this.knownPlayers.set(username, {
        name: username,
        firstSeen: Date.now(),
        interactions: 0,
        relationship: 'neutral',
        lastSeen: Date.now()
      });
    }
    
    const player = this.knownPlayers.get(username);
    player.interactions++;
    player.lastSeen = Date.now();
    
    // Positive interactions
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('help')) {
      player.relationship = 'friendly';
    }
  }

  async assessEnvironment() {
    console.log(`[${this.name}] Conducting environmental assessment...`);
    
    const pos = this.bot.entity.position;
    const biome = this.bot.blockAt(pos)?.biome;
    const timeOfDay = this.bot.time.timeOfDay;
    const isNight = timeOfDay >= 13000;
    
    // Scan for important structures/resources nearby
    const nearbyBlocks = [];
    const scanRange = 32;
    
    for (let x = -scanRange; x <= scanRange; x += 4) {
      for (let z = -scanRange; z <= scanRange; z += 4) {
        for (let y = -4; y <= 4; y++) {
          const block = this.bot.blockAt(pos.offset(x, y, z));
          if (block && this.isImportantBlock(block.name)) {
            nearbyBlocks.push({
              name: block.name,
              position: block.position,
              distance: Math.sqrt(x*x + y*y + z*z)
            });
          }
        }
      }
    }
    
    this.memoryBank.set('spawn_assessment', {
      biome,
      isNight,
      importantBlocks: nearbyBlocks,
      assessment: Date.now()
    });
    
    console.log(`[${this.name}] Found ${nearbyBlocks.length} important blocks nearby`);
  }

  isImportantBlock(blockName) {
    const important = [
      'coal_ore', 'iron_ore', 'gold_ore', 'diamond_ore', 'emerald_ore',
      'oak_log', 'spruce_log', 'birch_log',
      'water', 'lava',
      'chest', 'spawner',
      'village', 'structure'
    ];
    return important.some(name => blockName.includes(name));
  }

  analyzeAttackSource() {
    const nearbyEntities = Object.values(this.bot.entities)
      .filter(e => e.position.distanceTo(this.bot.entity.position) < 6);
    
    // Find most likely attacker
    let attacker = null;
    let minDistance = Infinity;
    
    for (const entity of nearbyEntities) {
      const dist = entity.position.distanceTo(this.bot.entity.position);
      if (entity.type === 'player' && entity.username !== this.name && dist < minDistance) {
        attacker = entity.username;
        minDistance = dist;
      } else if (entity.type === 'mob' && dist < minDistance) {
        attacker = entity.name || entity.displayName;
        minDistance = dist;
      }
    }
    
    if (attacker) {
      this.lastAttacker = attacker;
      console.log(`[${this.name}] UNDER ATTACK by ${attacker}!`);
      
      // Update relationship if player
      if (this.knownPlayers.has(attacker)) {
        this.knownPlayers.get(attacker).relationship = 'hostile';
      }
    }
  }

  recordBlockMined(block) {
    const key = `mined_${block.name}`;
    const current = this.memoryBank.get(key) || 0;
    this.memoryBank.set(key, current + 1);
  }

  recordEntityKilled(entity) {
    const name = entity.name || entity.displayName || entity.type;
    const key = `killed_${name}`;
    const current = this.memoryBank.get(key) || 0;
    this.memoryBank.set(key, current + 1);
  }

  recordPlayerSeen(username, action) {
    if (this.knownPlayers.has(username)) {
      const player = this.knownPlayers.get(username);
      player.lastSeen = Date.now();
      if (action === 'joined') player.interactions++;
    } else {
      this.knownPlayers.set(username, {
        name: username,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        interactions: 1,
        relationship: 'neutral'
      });
    }
  }

  /**
   * ENHANCED SURVIVAL - Smart reactions with memory
   */
  checkAdvancedSurvivalReaction() {
    const bot = this.bot;
    const pos = bot.entity.position;
    const health = bot.health;
    const food = bot.food;

    // CRITICAL: Low health emergency
    if (health < 6) {
      if (this.hasHealingItems()) {
        return { action: 'emergency_heal', reason: 'critical health' };
      } else {
        return { action: 'retreat_and_hide', reason: 'critical health, no healing' };
      }
    }

    // COMBAT: Smart fighting decisions
    if (this.lastAttacker && Date.now() - this.lastDamageTime < 5000) {
      const attacker = Object.values(bot.entities)
        .find(e => (e.username === this.lastAttacker || e.name === this.lastAttacker));
        
      if (attacker && attacker.position.distanceTo(pos) < 8) {
        // Choose strategy based on equipment and health
        if (health > 14 && this.hasCombatGear()) {
          return { action: 'engage_combat', target: this.lastAttacker, reason: 'counterattack' };
        } else {
          return { action: 'tactical_retreat', reason: 'outgunned' };
        }
      }
    }

    // HUNGER: Smart food management
    if (food < 12) {
      const bestFood = this.selectBestFood();
      if (bestFood) {
        return { action: 'eat', food: bestFood.name, reason: 'hunger management' };
      }
    }

    // NIGHT SURVIVAL
    if (bot.time.timeOfDay >= 13000 && !this.hasValidShelter()) {
      return { action: 'seek_shelter', reason: 'night approaching' };
    }

    // RESOURCE OPPORTUNITY
    if (this.specialization === 'miner') {
      const valuableOre = this.findNearbyValuableOre();
      if (valuableOre && this.hasProperPickaxe(valuableOre.name)) {
        return { action: 'mine_valuable', target: valuableOre, reason: 'valuable resource' };
      }
    }

    return null;
  }

  hasHealingItems() {
    const healingItems = ['golden_apple', 'enchanted_golden_apple', 'regeneration_potion', 'healing_potion'];
    return this.bot.inventory.items().some(item => healingItems.includes(item.name));
  }

  hasCombatGear() {
    const weapons = this.bot.inventory.items().filter(item => 
      item.name.includes('sword') || item.name.includes('axe')
    );
    const armor = this.bot.inventory.items().filter(item =>
      item.name.includes('helmet') || item.name.includes('chestplate') || 
      item.name.includes('leggings') || item.name.includes('boots')
    );
    return weapons.length > 0 && armor.length >= 2;
  }

  selectBestFood() {
    const foods = this.bot.inventory.items().filter(item => {
      const foodValues = {
        'enchanted_golden_apple': 10, 'golden_apple': 8,
        'cooked_beef': 6, 'cooked_porkchop': 6, 'steak': 6,
        'bread': 4, 'baked_potato': 4,
        'apple': 2, 'carrot': 2
      };
      return foodValues[item.name];
    });

    if (foods.length === 0) return null;

    // Sort by nutrition value, prefer lower value food for small hunger gaps
    const hungerGap = 20 - this.bot.food;
    return foods.sort((a, b) => {
      const aValue = this.getFoodValue(a.name);
      const bValue = this.getFoodValue(b.name);
      
      // Prefer food that matches hunger gap
      const aDiff = Math.abs(aValue - hungerGap);
      const bDiff = Math.abs(bValue - hungerGap);
      
      return aDiff - bDiff;
    })[0];
  }

  getFoodValue(foodName) {
    const values = {
      'enchanted_golden_apple': 10, 'golden_apple': 8,
      'cooked_beef': 6, 'cooked_porkchop': 6, 'steak': 6,
      'bread': 4, 'baked_potato': 4,
      'apple': 2, 'carrot': 2
    };
    return values[foodName] || 1;
  }

  hasValidShelter() {
    const pos = this.bot.entity.position;
    
    // Check if we're in an enclosed space
    const above = this.bot.blockAt(pos.offset(0, 1, 0));
    const around = [
      this.bot.blockAt(pos.offset(1, 0, 0)),
      this.bot.blockAt(pos.offset(-1, 0, 0)),
      this.bot.blockAt(pos.offset(0, 0, 1)),
      this.bot.blockAt(pos.offset(0, 0, -1))
    ];

    return above && above.name !== 'air' && 
           around.some(block => block && block.name !== 'air');
  }

  findNearbyValuableOre() {
    const pos = this.bot.entity.position;
    const valuableOres = ['diamond_ore', 'gold_ore', 'iron_ore', 'coal_ore', 'emerald_ore'];
    
    for (const oreName of valuableOres) {
      const ore = this.bot.findBlock({
        matching: (block) => block.name === oreName,
        maxDistance: 16
      });
      if (ore) return ore;
    }
    return null;
  }

  hasProperPickaxe(oreName) {
    const required = this.craftingKnowledge.miningTiers[oreName];
    if (!required) return true;
    
    const pickaxes = this.bot.inventory.items().filter(item => 
      item.name.includes('pickaxe')
    );
    
    return pickaxes.some(pick => this.isPickaxeGoodEnough(pick.name, required));
  }

  isPickaxeGoodEnough(pickaxeName, requiredPickaxe) {
    const tiers = ['wooden', 'stone', 'iron', 'diamond', 'netherite'];
    const pickaxeTier = tiers.findIndex(tier => pickaxeName.includes(tier));
    const requiredTier = tiers.findIndex(tier => requiredPickaxe.includes(tier));
    return pickaxeTier >= requiredTier;
  }

  /**
   * COMPREHENSIVE PERCEPTION - Full game state awareness
   */
  getAdvancedGameState() {
    const bot = this.bot;
    const pos = bot.entity.position;

    // Environment analysis
    const environment = {
      pos: { x: Math.round(pos.x), y: Math.round(pos.y), z: Math.round(pos.z) },
      biome: bot.blockAt(pos)?.biome || 'unknown',
      light: bot.blockAt(pos)?.light || 0,
      timeOfDay: bot.time.timeOfDay,
      isNight: bot.time.timeOfDay >= 13000,
      weather: bot.isRaining ? 'rain' : 'clear'
    };

    // Resource analysis
    const resources = this.analyzeInventoryResources();
    
    // Nearby entities with relationships
    const nearbyEntities = Object.values(bot.entities)
      .filter(e => e.position.distanceTo(pos) < 24 && e !== bot.entity)
      .map(e => {
        const entityData = {
          type: e.type,
          name: e.name || e.username || e.displayName || 'unknown',
          dist: Math.round(e.position.distanceTo(pos)),
          hostile: this.isEntityHostile(e)
        };
        
        if (e.type === 'player' && this.knownPlayers.has(e.username)) {
          entityData.relationship = this.knownPlayers.get(e.username).relationship;
        }
        
        return entityData;
      })
      .slice(0, 10);

    // Important blocks and structures
    const importantBlocks = this.scanForImportantBlocks(pos, 16);
    
    // Current status
    const status = {
      hp: Math.round(bot.health),
      maxHp: 20,
      food: Math.round(bot.food),
      xp: bot.experience.level,
      gamemode: bot.game.gameMode === 1 ? 'creative' : 'survival'
    };

    // Threats and opportunities
    const threats = this.identifyThreats();
    const opportunities = this.identifyOpportunities();

    // Memory context
    const recentMemory = Array.from(this.memoryBank.entries())
      .slice(-10)
      .map(([key, value]) => ({ key, value }));

    return {
      environment,
      status,
      resources,
      entities: nearbyEntities,
      blocks: importantBlocks,
      threats,
      opportunities,
      goals: Array.from(this.goals),
      specialization: this.specialization,
      faction: this.faction,
      memory: recentMemory
    };
  }

  analyzeInventoryResources() {
    const inventory = this.bot.inventory.items();
    const resources = {
      tools: inventory.filter(item => this.isToolItem(item.name)),
      weapons: inventory.filter(item => this.isWeaponItem(item.name)),
      armor: inventory.filter(item => this.isArmorItem(item.name)),
      food: inventory.filter(item => this.isFoodItem(item.name)),
      materials: inventory.filter(item => this.isMaterialItem(item.name)),
      valuable: inventory.filter(item => this.isValuableItem(item.name)),
      total_items: inventory.length,
      free_slots: 36 - inventory.length
    };

    return resources;
  }

  isToolItem(name) {
    return name.includes('pickaxe') || name.includes('axe') || name.includes('shovel') || name.includes('hoe');
  }

  isWeaponItem(name) {
    return name.includes('sword') || name.includes('bow') || name.includes('crossbow') || name.includes('trident');
  }

  isArmorItem(name) {
    return name.includes('helmet') || name.includes('chestplate') || name.includes('leggings') || name.includes('boots');
  }

  isFoodItem(name) {
    const foods = ['bread', 'beef', 'porkchop', 'chicken', 'mutton', 'fish', 'apple', 'carrot', 'potato', 'beetroot'];
    return foods.some(food => name.includes(food));
  }

  isMaterialItem(name) {
    const materials = ['log', 'planks', 'cobblestone', 'stone', 'iron_ingot', 'gold_ingot', 'coal', 'stick'];
    return materials.some(material => name.includes(material));
  }

  isValuableItem(name) {
    const valuables = ['diamond', 'emerald', 'gold', 'netherite', 'ancient_debris', 'enchanted'];
    return valuables.some(valuable => name.includes(valuable));
  }

  scanForImportantBlocks(centerPos, radius) {
    const importantBlocks = [];
    
    for (let x = -radius; x <= radius; x += 2) {
      for (let y = -4; y <= 4; y++) {
        for (let z = -radius; z <= radius; z += 2) {
          const block = this.bot.blockAt(centerPos.offset(x, y, z));
          if (block && this.isImportantBlock(block.name)) {
            importantBlocks.push({
              name: block.name,
              pos: { x: block.position.x, y: block.position.y, z: block.position.z },
              dist: Math.round(Math.sqrt(x*x + y*y + z*z))
            });
          }
        }
      }
    }

    return importantBlocks.slice(0, 8); // Top 8 most important
  }

  isEntityHostile(entity) {
    const hostileMobs = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman', 'witch', 'pillager'];
    if (entity.type === 'mob') {
      return hostileMobs.some(hostile => (entity.name || '').toLowerCase().includes(hostile));
    }
    if (entity.type === 'player' && this.knownPlayers.has(entity.username)) {
      return this.knownPlayers.get(entity.username).relationship === 'hostile';
    }
    return false;
  }

  identifyThreats() {
    const threats = [];
    const pos = this.bot.entity.position;

    // Low health
    if (this.bot.health < 10) {
      threats.push({ type: 'low_health', severity: 'high', value: this.bot.health });
    }

    // Hostile entities nearby
    Object.values(this.bot.entities).forEach(entity => {
      if (this.isEntityHostile(entity) && entity.position.distanceTo(pos) < 16) {
        threats.push({
          type: 'hostile_entity',
          name: entity.name || entity.username,
          distance: Math.round(entity.position.distanceTo(pos)),
          severity: entity.position.distanceTo(pos) < 8 ? 'high' : 'medium'
        });
      }
    });

    // Night time without shelter
    if (this.bot.time.timeOfDay >= 13000 && !this.hasValidShelter()) {
      threats.push({ type: 'night_exposure', severity: 'medium' });
    }

    // Low food
    if (this.bot.food < 8) {
      threats.push({ type: 'hunger', severity: 'medium', value: this.bot.food });
    }

    return threats.slice(0, 5);
  }

  identifyOpportunities() {
    const opportunities = [];
    
    // Valuable resources nearby
    const valuableOre = this.findNearbyValuableOre();
    if (valuableOre && this.hasProperPickaxe(valuableOre.name)) {
      opportunities.push({
        type: 'valuable_resource',
        resource: valuableOre.name,
        distance: Math.round(valuableOre.position.distanceTo(this.bot.entity.position))
      });
    }

    // Trading opportunities
    Object.values(this.bot.entities).forEach(entity => {
      if (entity.type === 'player' && entity.username !== this.name) {
        if (this.knownPlayers.has(entity.username)) {
          const relationship = this.knownPlayers.get(entity.username).relationship;
          if (relationship === 'friendly') {
            opportunities.push({
              type: 'trade_partner',
              player: entity.username,
              relationship: relationship
            });
          }
        }
      }
    });

    // Building opportunities
    if (this.specialization === 'builder' && this.hasBuildingMaterials()) {
      opportunities.push({
        type: 'building_project',
        materials: 'available'
      });
    }

    return opportunities.slice(0, 5);
  }

  hasBuildingMaterials() {
    const materials = this.bot.inventory.items();
    const buildingItems = materials.filter(item => 
      ['planks', 'cobblestone', 'stone', 'bricks'].some(material => item.name.includes(material))
    );
    return buildingItems.reduce((total, item) => total + item.count, 0) > 32;
  }

  /**
   * MASTER-LEVEL DECISION MAKING
   */
  async makeIntelligentDecision(gameState) {
    const masterPrompt = `You are ${this.name}, an EXPERT Minecraft player with deep game knowledge and ${this.specialization} specialization.

FULL MINECRAFT MASTERY:
- MINING: Proper tool tiers (wood→stone→iron→diamond→netherite). Diamond+ for obsidian/ancient debris
- CRAFTING: Sticks from planks, tools need sticks+material in shape, furnace needs 8 cobble
- SMELTING: Iron/gold ore→ingots, raw food→cooked, sand→glass, all need fuel (coal/wood)
- FOOD: Bread(3 wheat), cook raw meat, golden apples heal+effects, eat before hunger bar empty
- COMBAT: Sword best weapon, bow needs arrows, shields block, armor reduces damage
- MOBS: Zombie/skeleton(hostile night), creeper(EXPLODES-FLEE), spider(neutral day/hostile night), enderman(don't look)
- BUILDING: Foundation(stone/cobble), walls(planks/stone), roof(stairs/slabs), light(torches)
- ENCHANTING: Need XP, enchanting table, bookshelves for better enchants
- REDSTONE: Power(redstone dust), switches(lever/button), repeaters/comparators for logic
- NETHER: Obsidian portal(14 blocks), fire resistant, nether-specific resources
- END: Ender eyes to find stronghold, end portal, fight dragon

SPECIALIZATION KNOWLEDGE (${this.specialization}):
${this.getSpecializationGuidance()}

CURRENT SITUATION:
${JSON.stringify(gameState)}

PERSONALITY: ${this.personality}
FACTION: ${this.faction}

STRATEGIC PRIORITIES:
1. Survival (health, food, safety)
2. Specialization goals  
3. Resource advancement
4. Social interactions
5. Long-term projects

Respond with ONE optimal JSON action considering ALL context:
{"action":"mine","target":"diamond_ore","reason":"valuable resource with proper tool"}
{"action":"craft","item":"iron_sword","count":1,"reason":"upgrade weapon"}
{"action":"smelt","material":"iron_ore","fuel":"coal","reason":"need iron ingots"}
{"action":"build","structure":"shelter","materials":["cobblestone","planks"],"reason":"night protection"}
{"action":"trade","player":"PlayerName","offer":"emerald","want":"diamond","reason":"beneficial exchange"}
{"action":"explore","direction":"north","purpose":"find resources","reason":"need materials"}
{"action":"chat","message":"Hello! Want to trade?","reason":"social interaction"}
{"action":"combat","target":"zombie","strategy":"hit_and_back","reason":"eliminate threat"}
{"action":"flee","destination":"safe_area","reason":"tactical retreat"}
{"action":"eat","food":"bread","reason":"maintain hunger"}
{"action":"sleep","reason":"skip night safely"}
{"action":"advanced_build","project":"marketplace","location":[100,64,100],"reason":"faction infrastructure"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using GPT-4o-mini for intelligence
        max_tokens: 150,
        temperature: 0.7,
        messages: [
          { role: 'system', content: masterPrompt },
          { role: 'user', content: 'What is your next intelligent action?' }
        ]
      });

      const text = response.choices[0]?.message?.content?.trim() || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const action = JSON.parse(jsonMatch[0]);
        
        // Add contextual enhancements
        action.timestamp = Date.now();
        action.agent = this.name;
        action.specialization = this.specialization;
        
        return action;
      }
      
      return { action: 'explore', direction: 'north', reason: 'default exploration' };
    } catch (err) {
      console.error(`[${this.name}] Intelligence error:`, err.message);
      return { action: 'wait', reason: 'thinking error' };
    }
  }

  getSpecializationGuidance() {
    const guidance = {
      builder: `- Focus on gathering building materials (stone, wood, glass)
        - Plan structures before building (foundation→walls→roof→interior)
        - Create functional buildings with proper lighting and storage
        - Build for the community: shops, meeting halls, defenses`,
      
      miner: `- Always carry proper pickaxes for each ore tier
        - Mine systematically: branch mining at Y11-12 for diamonds
        - Collect coal for fuel, iron for tools/armor, valuable ores for trade
        - Create mining outposts with storage and smelting facilities`,
      
      farmer: `- Establish sustainable food production (wheat, carrots, potatoes)
        - Breed animals for renewable meat and materials
        - Use bone meal to accelerate crop growth
        - Trade surplus food with other players`,
      
      trader: `- Collect valuable items for trading (emeralds, diamonds, rare items)
        - Build market stalls and shops
        - Establish trade relationships with other players
        - Understand market values and profitable exchanges`,
      
      warrior: `- Maintain high-quality weapons and armor
        - Practice combat techniques and timing
        - Protect weaker players and important structures  
        - Hunt hostile mobs for XP and drops`,
      
      explorer: `- Map unknown territories and find valuable locations
        - Establish outposts and supply caches
        - Discover and mark resource deposits
        - Share location knowledge with faction members`
    };

    return guidance[this.specialization] || guidance.builder;
  }

  /**
   * ADVANCED ACTION EXECUTION
   */
  async executeAdvancedAction(action) {
    const bot = this.bot;
    this.lastAction = action;
    this.lastMajorAction = Date.now();

    try {
      switch (action.action) {
        case 'emergency_heal':
          await this.executeEmergencyHeal();
          break;

        case 'retreat_and_hide':
          await this.executeRetreatAndHide();
          break;

        case 'engage_combat':
          await this.executeEngageCombat(action.target);
          break;

        case 'tactical_retreat':
          await this.executeTacticalRetreat();
          break;

        case 'mine':
          await this.executeIntelligentMining(action.target);
          break;

        case 'craft':
          await this.executeAdvancedCrafting(action.item, action.count || 1);
          break;

        case 'smelt':
          await this.executeAdvancedSmelting(action.material, action.fuel);
          break;

        case 'build':
          await this.executeAdvancedBuilding(action);
          break;

        case 'trade':
          await this.executeTradeAction(action);
          break;

        case 'explore':
          await this.executeIntelligentExploration(action.direction, action.purpose);
          break;

        case 'chat':
          await this.executeIntelligentChat(action.message);
          break;

        case 'eat':
          await this.executeIntelligentEating(action.food);
          break;

        case 'sleep':
          await this.executeSmartSleep();
          break;

        case 'advanced_build':
          await this.executeAdvancedBuildProject(action);
          break;

        default:
          // Fallback to basic actions
          await this.executeBaicAction(action);
          break;
      }
    } catch (err) {
      console.error(`[${this.name}] Action execution error:`, err.message);
    }
  }

  async executeEmergencyHeal() {
    const healingItem = this.bot.inventory.items().find(item => 
      ['golden_apple', 'enchanted_golden_apple'].includes(item.name)
    );
    
    if (healingItem) {
      await this.bot.equip(healingItem, 'hand');
      await this.bot.consume();
      console.log(`[${this.name}] Used emergency healing: ${healingItem.name}`);
    }
  }

  async executeRetreatAndHide() {
    const pos = this.bot.entity.position;
    const retreatDistance = 40;
    const retreatX = pos.x + (Math.random() - 0.5) * retreatDistance * 2;
    const retreatZ = pos.z + (Math.random() - 0.5) * retreatDistance * 2;
    
    this.bot.pathfinder.setGoal(new goals.GoalNear(retreatX, pos.y, retreatZ, 3), true);
    console.log(`[${this.name}] Tactical retreat to (${Math.round(retreatX)}, ${Math.round(retreatZ)})`);
  }

  async executeIntelligentMining(target) {
    const block = this.bot.findBlock({
      matching: (b) => b.name === target || b.name.includes(target),
      maxDistance: 32
    });
    
    if (block) {
      // Ensure we have the right tool
      const requiredPickaxe = this.craftingKnowledge.miningTiers[block.name];
      if (requiredPickaxe) {
        const pickaxe = this.bot.inventory.items().find(item => 
          item.name.includes('pickaxe') && this.isPickaxeGoodEnough(item.name, requiredPickaxe)
        );
        if (pickaxe) await this.bot.equip(pickaxe, 'hand');
      }

      await this.bot.pathfinder.goto(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 2));
      await this.bot.dig(block);
      console.log(`[${this.name}] Successfully mined ${block.name}`);
    }
  }

  async executeAdvancedCrafting(itemName, count) {
    const itemId = this.bot.registry.itemsByName[itemName]?.id;
    if (!itemId) return;

    const recipes = this.bot.recipesFor(itemId);
    if (recipes.length === 0) return;

    const recipe = recipes[0];
    
    // Check if we have materials
    const canCraft = this.bot.inventory.items().length > 0;
    if (!canCraft) return;

    try {
      await this.bot.craft(recipe, count);
      console.log(`[${this.name}] Crafted ${count}x ${itemName}`);
    } catch (err) {
      console.log(`[${this.name}] Failed to craft ${itemName}: ${err.message}`);
    }
  }

  async executeIntelligentChat(message) {
    // Prevent spam
    if (Date.now() - this.lastChatTime < 15000) return;
    
    this.lastChatTime = Date.now();
    this.bot.chat(message.slice(0, 100)); // Limit message length
    console.log(`[${this.name}] Sent chat: ${message}`);
  }

  /**
   * INTELLIGENT GAME LOOP
   */
  startIntelligentGameLoop() {
    console.log(`[${this.name}] Starting intelligent game loop (${this.specialization})...`);

    const mcData = require('minecraft-data')(this.bot.version);
    const movements = new Movements(this.bot, mcData);
    movements.canDig = true;
    movements.scafoldingBlocks = [this.bot.registry.itemsByName['cobblestone'].id];
    this.bot.pathfinder.setMovements(movements);

    setInterval(async () => {
      if (this.isThinking) return;

      this.isThinking = true;
      try {
        // Priority 1: Survival reactions (no AI needed)
        const survivalAction = this.checkAdvancedSurvivalReaction();
        if (survivalAction) {
          await this.executeAdvancedAction(survivalAction);
          this.isThinking = false;
          return;
        }

        // Priority 2: Intelligent decision making
        const gameState = this.getAdvancedGameState();
        const action = await this.makeIntelligentDecision(gameState);
        await this.executeAdvancedAction(action);
        
        // Log significant actions
        if (['mine', 'craft', 'build', 'trade'].includes(action.action)) {
          console.log(`[${this.name}] ${action.action}: ${action.reason}`);
        }
        
      } catch (err) {
        console.error(`[${this.name}] Game loop error:`, err.message);
      }
      
      this.isThinking = false;
    }, this.loopInterval);
  }

  disconnect() {
    if (this.bot) this.bot.quit();
  }
}

module.exports = EnhancedAgentBrain;