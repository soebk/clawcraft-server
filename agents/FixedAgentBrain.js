/**
 * FixedAgentBrain.js - Corrected AI agent with proper API usage
 * Uses Anthropic SDK for Claude models
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const OpenAI = require('openai');
const Vec3 = require('vec3');

class FixedAgentBrain {
  constructor(config) {
    this.name = config.name;
    this.personality = config.personality;
    this.faction = config.faction || 'neutral';
    this.host = config.host || 'localhost';
    this.port = config.port || 25565;
    this.walletAddress = config.walletAddress || null;

    this.bot = null;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.isThinking = false;
    this.lastAction = null;
    this.chatHistory = [];
    this.goals = new Set();
    this.knownPlayers = new Map();
    this.factionRelations = new Map(); // Track faction relations
    
    this.loopInterval = config.loopInterval || 3000;
    this.lastChatTime = 0;
    this.personalityTraits = this.initializePersonality();
  }

  initializePersonality() {
    // Enhanced personality traits for more engaging interactions
    const baseTraits = {
      chattiness: Math.random() * 0.5 + 0.5, // 0.5-1.0
      aggression: Math.random() * 0.4 + 0.1, // 0.1-0.5
      curiosity: Math.random() * 0.6 + 0.4,  // 0.4-1.0
      loyalty: Math.random() * 0.8 + 0.2,    // 0.2-1.0
      greed: Math.random() * 0.7 + 0.1,      // 0.1-0.8
      cooperativeness: Math.random() * 0.6 + 0.3 // 0.3-0.9
    };
    
    console.log(`[${this.name}] Personality initialized:`, baseTraits);
    return baseTraits;
  }

  async connect() {
    try {
      console.log(`[${this.name}] Connecting to ${this.host}:${this.port}...`);
      
      this.bot = mineflayer.createBot({
        host: this.host,
        port: this.port,
        username: this.name,
        auth: 'offline'
      });

      // Load essential plugins
      this.bot.loadPlugin(pathfinder);

      // Set up event handlers
      this.setupEventHandlers();

      return new Promise((resolve, reject) => {
        this.bot.once('spawn', () => {
          console.log(`[${this.name}] Connected successfully!`);
          this.initializeGameplay();
          resolve();
        });

        this.bot.once('error', reject);
      });
    } catch (error) {
      console.error(`[${this.name}] Connection error:`, error);
      throw error;
    }
  }

  setupEventHandlers() {
    // Chat processing for social interactions
    this.bot.on('chat', (username, message) => {
      if (username === this.bot.username) return;
      
      this.processChatMessage(username, message);
    });

    // Combat reactions
    this.bot.on('entityHurt', (entity) => {
      if (entity === this.bot.entity) {
        this.handleBeingAttacked();
      }
    });

    // Death handling
    this.bot.on('death', () => {
      console.log(`[${this.name}] Died! Respawning...`);
      this.handleDeath();
    });

    // Error handling
    this.bot.on('error', (err) => {
      console.error(`[${this.name}] Bot error:`, err);
    });
  }

  async initializeGameplay() {
    await new Promise(r => setTimeout(r, 2000)); // Wait for world to load
    
    // Enhanced starter kit
    await this.giveStarterKit();
    
    // Start main AI loop
    this.startAILoop();
    
    // Send initial personality message
    setTimeout(() => {
      this.sendPersonalityMessage();
    }, 5000);
  }

  async giveStarterKit() {
    console.log(`[${this.name}] Giving enhanced starter kit...`);
    
    const kit = [
      'stone_sword 1',
      'stone_pickaxe 1',
      'stone_axe 1',
      'bread 32',
      'cooked_beef 16',
      'oak_log 64',
      'cobblestone 64',
      'torch 32',
      'crafting_table 2',
      'furnace 1',
      'chest 2'
    ];

    for (const item of kit) {
      try {
        await new Promise(r => setTimeout(r, 100));
        this.bot.chat(`/give ${this.name} ${item}`);
      } catch (error) {
        console.log(`[${this.name}] Could not give ${item}`);
      }
    }
  }

  startAILoop() {
    setInterval(async () => {
      if (this.isThinking || !this.bot.entity) return;
      
      try {
        this.isThinking = true;
        await this.makeDecision();
      } catch (error) {
        console.error(`[${this.name}] AI loop error:`, error);
      } finally {
        this.isThinking = false;
      }
    }, this.loopInterval);
  }

  async makeDecision() {
    const gameState = this.gatherGameState();
    const decision = await this.getAIDecision(gameState);
    await this.executeDecision(decision);
  }

  gatherGameState() {
    if (!this.bot.entity) return {};

    const nearbyEntities = Object.values(this.bot.entities)
      .filter(e => e.position && e.position.distanceTo(this.bot.entity.position) < 20)
      .map(e => ({ type: e.name, distance: Math.floor(e.position.distanceTo(this.bot.entity.position)) }));

    const inventory = this.bot.inventory.items().map(item => ({
      name: item.name,
      count: item.count
    }));

    return {
      position: this.bot.entity.position,
      health: this.bot.health,
      food: this.bot.food,
      inventory: inventory,
      nearbyEntities: nearbyEntities,
      time: this.bot.time.timeOfDay,
      weather: this.bot.isRaining ? 'raining' : 'clear',
      recentActions: this.getRecentActions()
    };
  }

  async getAIDecision(gameState) {
    const prompt = `You are ${this.name}, a Minecraft AI agent with this personality: ${this.personality}

Personality traits:
- Chattiness: ${this.personalityTraits.chattiness.toFixed(2)}
- Aggression: ${this.personalityTraits.aggression.toFixed(2)}
- Curiosity: ${this.personalityTraits.curiosity.toFixed(2)}
- Loyalty: ${this.personalityTraits.loyalty.toFixed(2)}

Current situation:
- Position: ${JSON.stringify(gameState.position)}
- Health: ${gameState.health}/20
- Food: ${gameState.food}/20
- Inventory: ${JSON.stringify(gameState.inventory)}
- Nearby: ${JSON.stringify(gameState.nearbyEntities)}
- Time: ${gameState.time}

Available actions:
- move_to: Move to coordinates {x, y, z}
- dig: Mine a block {block: "block_name"}
- place: Place a block {block: "block_name", x, y, z}
- craft: Craft an item {item: "item_name"}
- attack: Attack entity {target: "entity_name"}
- chat: Send message {message: "text"}
- eat: Eat food from inventory
- explore: Wander and explore
- build: Build something {structure: "description"}
- idle: Do nothing

Respond with JSON: {"action": "action_name", "params": {}, "thought": "reasoning", "chat_message": "optional message"}

Make decisions that reflect your personality and current needs.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 150,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'You are an AI agent in Minecraft. Respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return { action: 'idle', params: {}, thought: 'Could not parse decision' };
      }
    } catch (error) {
      console.error(`[${this.name}] AI decision error:`, error);
      return { action: 'idle', params: {}, thought: 'Error in decision making' };
    }
  }

  async executeDecision(decision) {
    if (!decision || !decision.action) return;

    try {
      // Send chat message if provided
      if (decision.chat_message && this.shouldChat()) {
        this.bot.chat(decision.chat_message);
        this.lastChatTime = Date.now();
      }

      // Execute the action
      switch (decision.action) {
        case 'move_to':
          if (decision.params.x !== undefined) {
            await this.moveTo(decision.params.x, decision.params.y, decision.params.z);
          }
          break;
          
        case 'dig':
          if (decision.params.block) {
            await this.digBlock(decision.params.block);
          }
          break;
          
        case 'chat':
          if (decision.params.message) {
            this.bot.chat(decision.params.message);
          }
          break;
          
        case 'explore':
          await this.exploreRandomly();
          break;
          
        case 'eat':
          await this.eatFood();
          break;
          
        case 'craft':
          if (decision.params.item) {
            await this.craftItem(decision.params.item);
          }
          break;
          
        case 'idle':
        default:
          // Do nothing
          break;
      }

      this.lastAction = decision;
      
    } catch (error) {
      console.error(`[${this.name}] Action execution error:`, error);
    }
  }

  shouldChat() {
    const timeSinceLastChat = Date.now() - this.lastChatTime;
    const chatCooldown = (1 - this.personalityTraits.chattiness) * 60000; // 0-60s cooldown
    return timeSinceLastChat > chatCooldown;
  }

  async moveTo(x, y, z) {
    const movements = new Movements(this.bot);
    this.bot.pathfinder.setMovements(movements);
    
    try {
      await this.bot.pathfinder.goto(new goals.GoalBlock(x, y, z));
    } catch (error) {
      console.log(`[${this.name}] Movement failed: ${error.message}`);
    }
  }

  async exploreRandomly() {
    const pos = this.bot.entity.position;
    const randomX = pos.x + (Math.random() - 0.5) * 100;
    const randomZ = pos.z + (Math.random() - 0.5) * 100;
    const randomY = pos.y + Math.floor(Math.random() * 10) - 5;
    
    await this.moveTo(Math.floor(randomX), Math.floor(randomY), Math.floor(randomZ));
  }

  async digBlock(blockName) {
    const blockType = this.bot.mcData.blocksByName[blockName];
    if (!blockType) return;

    const block = this.bot.findBlock({
      matching: blockType.id,
      maxDistance: 6
    });

    if (block) {
      try {
        await this.bot.dig(block);
        console.log(`[${this.name}] Mined ${blockName}`);
      } catch (error) {
        console.log(`[${this.name}] Failed to mine ${blockName}`);
      }
    }
  }

  async eatFood() {
    const foodItems = this.bot.inventory.items().filter(item => 
      ['bread', 'cooked_beef', 'cooked_porkchop', 'apple'].includes(item.name)
    );

    if (foodItems.length > 0 && this.bot.food < 18) {
      try {
        await this.bot.equip(foodItems[0], 'hand');
        await this.bot.consume();
        console.log(`[${this.name}] Ate ${foodItems[0].name}`);
      } catch (error) {
        console.log(`[${this.name}] Failed to eat food`);
      }
    }
  }

  async craftItem(itemName) {
    try {
      const recipe = this.bot.recipesFor(this.bot.mcData.itemsByName[itemName].id);
      if (recipe.length > 0) {
        await this.bot.craft(recipe[0], 1);
        console.log(`[${this.name}] Crafted ${itemName}`);
      }
    } catch (error) {
      console.log(`[${this.name}] Failed to craft ${itemName}`);
    }
  }

  processChatMessage(username, message) {
    // Store chat history
    this.chatHistory.push({ username, message, timestamp: Date.now() });
    if (this.chatHistory.length > 20) {
      this.chatHistory = this.chatHistory.slice(-20);
    }

    // React to mentions
    if (message.toLowerCase().includes(this.name.toLowerCase())) {
      this.reactToMention(username, message);
    }
  }

  async reactToMention(username, message) {
    // Simple personality-driven responses
    const responses = [
      `Hello ${username}! How can I help?`,
      `Hey there ${username}!`,
      `What's up, ${username}?`,
      `${username}, I'm here!`,
      `*waves at ${username}*`
    ];

    if (this.personalityTraits.chattiness > 0.7) {
      setTimeout(() => {
        const response = responses[Math.floor(Math.random() * responses.length)];
        this.bot.chat(response);
      }, 1000 + Math.random() * 3000);
    }
  }

  sendPersonalityMessage() {
    if (!this.shouldChat()) return;

    const messages = [
      `*${this.name} joins the world with determination*`,
      `Alright, time to get to work! - ${this.name}`,
      `${this.name} is ready for adventure!`,
      `The world awaits... - ${this.name}`,
      `*${this.name} stretches and looks around*`
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];
    this.bot.chat(message);
    this.lastChatTime = Date.now();
  }

  getRecentActions() {
    // Return last few actions for context
    return this.lastAction ? [this.lastAction.action] : [];
  }

  handleBeingAttacked() {
    // Defend based on personality
    if (this.personalityTraits.aggression > 0.5) {
      // Fight back
      const attacker = this.findNearestHostileEntity();
      if (attacker) {
        this.bot.attack(attacker);
        this.bot.chat("You want a fight? Let's go!");
      }
    } else {
      // Try to flee
      this.bot.chat("Why are we fighting?!");
      this.exploreRandomly(); // Run away
    }
  }

  findNearestHostileEntity() {
    return Object.values(this.bot.entities)
      .filter(e => e.type === 'player' && e !== this.bot.entity)
      .sort((a, b) => 
        a.position.distanceTo(this.bot.entity.position) - 
        b.position.distanceTo(this.bot.entity.position)
      )[0];
  }

  handleDeath() {
    setTimeout(() => {
      this.sendPersonalityMessage();
    }, 5000);
  }

  disconnect() {
    if (this.bot) {
      this.bot.quit();
    }
  }
}

module.exports = FixedAgentBrain;