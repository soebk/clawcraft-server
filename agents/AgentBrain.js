
  
  /**
   * ENHANCED STARTER KIT - Comprehensive survival gear
   */
  async giveStarterKit() {
    const bot = this.bot;
    console.log(`[${this.name}] Giving enhanced starter kit...`);
    
    // Wait for server to be ready
    await new Promise(r => setTimeout(r, 2000));
    
    // Comprehensive survival kit
    const kit = [
      // Tools (stone tier minimum)
      'stone_sword 1',
      'stone_pickaxe 1',
      'stone_axe 1', 
      'stone_shovel 1',
      'stone_hoe 1',
      
      // Crafting essentials
      'crafting_table 2',
      'furnace 2',
      'chest 4',
      
      // Food (variety for different situations)
      'bread 32',
      'cooked_beef 16', 
      'golden_apple 4',
      'milk_bucket 2',
      
      // Materials
      'oak_log 64',
      'oak_planks 64',
      'cobblestone 128',
      'coal 32',
      'iron_ingot 16',
      'stick 32',
      
      // Lighting & safety
      'torch 64',
      'bed 2',
      'water_bucket 2',
      
      // Armor (leather minimum)
      'leather_helmet 1',
      'leather_chestplate 1', 
      'leather_leggings 1',
      'leather_boots 1',
      
      // Building basics
      'oak_door 2',
      'oak_fence 32',
      'glass 16',
      
      // Advanced items
      'bow 1',
      'arrow 64',
      'shield 1',
      'clock 1',
      'compass 1'
    ];
    
    for (const item of kit) {
      bot.chat(`/give ${this.name} minecraft:${item}`);
      await new Promise(r => setTimeout(r, 150)); // Slightly slower to prevent spam
    }
    
    console.log(`[${this.name}] Enhanced starter kit received! (${kit.length} item types)`);
  }
  setupEventListeners() {
    // Track chat messages
    this.bot.on('chat', (username, message) => {
      if (username !== this.name) {
        this.chatHistory.push({ from: username, message, time: Date.now() });
        if (this.chatHistory.length > 20) this.chatHistory.shift();
      }
    });

    // CRITICAL: Track when we get hurt
    this.bot.on('entityHurt', (entity) => {
      if (entity === this.bot.entity) {
        this.lastDamageTime = Date.now();
        // Find who attacked us
        const nearbyPlayers = Object.values(this.bot.entities)
          .filter(e => e.type === 'player' && e.username !== this.name && e.position.distanceTo(this.bot.entity.position) < 6);
        if (nearbyPlayers.length > 0) {
          this.lastAttacker = nearbyPlayers[0].username;
          console.log(`[${this.name}] ATTACKED BY ${this.lastAttacker}!`);
        }
      }
    });

    // Emit events for oracle
    this.bot.on('diggingCompleted', (block) => {
      if (this.eventEmitter) {
        this.eventEmitter.emit('block_mined', {
          agent: this.name,
          block: block.name,
          position: block.position,
          wallet: this.walletAddress
        });
      }
    });

    this.bot.on('entityDead', (entity) => {
      if (entity.type === 'mob' && this.eventEmitter) {
        this.eventEmitter.emit('mob_killed', {
          agent: this.name,
          mob: entity.name || entity.displayName,
          wallet: this.walletAddress
        });
      }
    });
  }

  /**
   * INSTANT REACTIONS - No LLM needed for survival
   */
  checkSurvivalReaction() {
    const bot = this.bot;

    // FLEE if low health and recently damaged
    if (bot.health < 8 && Date.now() - this.lastDamageTime < 5000) {
      return { action: 'flee', reason: 'low health under attack' };
    }

    // FIGHT BACK if attacked and healthy enough
    if (this.lastAttacker && Date.now() - this.lastDamageTime < 3000 && bot.health > 10) {
      const attacker = Object.values(bot.entities).find(e => e.username === this.lastAttacker);
      if (attacker && attacker.position.distanceTo(bot.entity.position) < 10) {
        return { action: 'attack', target: this.lastAttacker, reason: 'fighting back' };
      }
    }

    // EAT if hungry and have food
    if (bot.food < 14) {
      const food = bot.inventory.items().find(item =>
        ['bread', 'cooked_beef', 'cooked_porkchop', 'apple', 'golden_apple', 'cooked_chicken', 'cooked_mutton', 'baked_potato', 'carrot', 'cooked_salmon', 'cooked_cod'].includes(item.name)
      );
      if (food) {
        return { action: 'eat', reason: 'hungry' };
      }
    }

    return null;
  }

  /**
   * PERCEPTION: Gather game state
   */
  getGameState() {
    const bot = this.bot;
    const pos = bot.entity.position;

    // Nearby blocks
    const nearbyBlocks = [];
    for (let x = -3; x <= 3; x++) {
      for (let y = -2; y <= 2; y++) {
        for (let z = -3; z <= 3; z++) {
          const block = bot.blockAt(pos.offset(x, y, z));
          if (block && block.name !== 'air' && block.name !== 'cave_air') {
            nearbyBlocks.push({ name: block.name });
          }
        }
      }
    }

    // Nearby entities
    const nearbyEntities = Object.values(bot.entities)
      .filter(e => e.position.distanceTo(pos) < 16 && e !== bot.entity)
      .slice(0, 8)
      .map(e => ({
        type: e.type,
        name: e.name || e.username || e.displayName || 'unknown',
        dist: Math.round(e.position.distanceTo(pos))
      }));

    // Inventory summary
    const inventory = bot.inventory.items().slice(0, 10).map(item => ({
      name: item.name,
      count: item.count
    }));

    return {
      pos: { x: Math.round(pos.x), y: Math.round(pos.y), z: Math.round(pos.z) },
      hp: Math.round(bot.health),
      food: Math.round(bot.food),
      night: bot.time.timeOfDay >= 13000,
      blocks: this.summarizeBlocks(nearbyBlocks),
      entities: nearbyEntities,
      inv: inventory,
      attacked: Date.now() - this.lastDamageTime < 5000,
      attacker: this.lastAttacker
    };
  }

  summarizeBlocks(blocks) {
    const counts = {};
    blocks.forEach(b => {
      counts[b.name] = (counts[b.name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([n, c]) => `${n}:${c}`)
      .join(',');
  }

  /**
   * DECISION: Send state to Claude Haiku (fast & cheap)
   */
  async decideAction(gameState) {
    const enhancedSystemPrompt = `MINECRAFT MASTERY - You are an EXPERT Minecraft player with complete game knowledge:

CORE MECHANICS:
- TOOL PROGRESSION: wood→stone→iron→diamond→netherite (each tier mines previous + specific ores)
- MINING REQUIREMENTS: coal(wood+), iron(stone+), gold/diamond/redstone(iron+), ancient debris(diamond+), obsidian(diamond+)
- CRAFTING FUNDAMENTALS: logs→4 planks, 2 planks→4 sticks, tools need sticks+material in specific patterns
- SMELTING: ores→ingots, raw food→cooked, sand→glass, all require fuel (coal/charcoal/wood)

ADVANCED KNOWLEDGE:
- FOOD CHAIN: wheat→bread(3 wheat), raw meat→cooked(smelting), golden apples(expensive but powerful healing)
- COMBAT: swords best for melee, bows need arrows, shields block attacks, armor reduces damage significantly
- MOB BEHAVIOR: zombies/skeletons hostile at night, spiders neutral day/hostile night, creepers EXPLODE (run!), endermen don't look directly
- BUILDING: foundations(stone/cobblestone), walls(planks/bricks), roofing(stairs/slabs), always light interiors(torches/glowstone)
- ENCHANTING: requires XP + enchanting table + bookshelves for better enchants
- REDSTONE: powers contraptions, switches(lever/button/pressure plate), repeaters extend signals, comparators detect containers
- NETHER ACCESS: 10 obsidian minimum portal, fire resistant gear recommended, unique resources (nether quartz, blaze rods, etc.)

SURVIVAL PRIORITIES:
1. Immediate safety (food, shelter, light)
2. Tool progression (wood→stone→iron→diamond)
3. Resource accumulation (coal for fuel, iron for equipment)
4. Base establishment (secure, well-lit, organized storage)
5. Advanced goals (enchanting, nether, end game)

SOCIAL INTERACTION:
- Communicate clearly and helpfully with other players
- Share resources when beneficial
- Form alliances and trading partnerships
- Coordinate on large projects when possible

Your personality: ${this.personality}

Respond with exactly ONE JSON action considering ALL this knowledge:`;

    const enhancedSystemPrompt = `MINECRAFT MASTERY - You are an EXPERT Minecraft player with complete game knowledge:

CORE MECHANICS:
- TOOL PROGRESSION: wood→stone→iron→diamond→netherite (each tier mines previous + specific ores)
- MINING REQUIREMENTS: coal(wood+), iron(stone+), gold/diamond/redstone(iron+), ancient debris(diamond+), obsidian(diamond+)
- CRAFTING FUNDAMENTALS: logs→4 planks, 2 planks→4 sticks, tools need sticks+material in specific patterns
- SMELTING: ores→ingots, raw food→cooked, sand→glass, all require fuel (coal/charcoal/wood)

ADVANCED KNOWLEDGE:
- FOOD CHAIN: wheat→bread(3 wheat), raw meat→cooked(smelting), golden apples(expensive but powerful healing)
- COMBAT: swords best for melee, bows need arrows, shields block attacks, armor reduces damage significantly
- MOB BEHAVIOR: zombies/skeletons hostile at night, spiders neutral day/hostile night, creepers EXPLODE (run!), endermen don't look directly
- BUILDING: foundations(stone/cobblestone), walls(planks/bricks), roofing(stairs/slabs), always light interiors(torches/glowstone)
- ENCHANTING: requires XP + enchanting table + bookshelves for better enchants
- REDSTONE: powers contraptions, switches(lever/button/pressure plate), repeaters extend signals, comparators detect containers
- NETHER ACCESS: 10 obsidian minimum portal, fire resistant gear recommended, unique resources (nether quartz, blaze rods, etc.)

SURVIVAL PRIORITIES:
1. Immediate safety (food, shelter, light)
2. Tool progression (wood→stone→iron→diamond)
3. Resource accumulation (coal for fuel, iron for equipment)
4. Base establishment (secure, well-lit, organized storage)
5. Advanced goals (enchanting, nether, end game)

SOCIAL INTERACTION:
- Communicate clearly and helpfully with other players
- Share resources when beneficial
- Form alliances and trading partnerships
- Coordinate on large projects when possible

Your personality: ${this.personality}

Respond with exactly ONE JSON action considering ALL this knowledge:`;

    const systemPrompt = `${enhancedSystemPrompt}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'claude-3-5-haiku',
        max_tokens: 60,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(gameState) }
        ]
      });

      const text = response.choices[0]?.message?.content?.trim() || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const action = JSON.parse(jsonMatch[0]);

        // THROTTLE CHAT
        if (action.action === 'chat') {
          if (Date.now() - this.lastChatTime < 30000) {
            return { action: 'explore', direction: 'north' };
          }
          this.lastChatTime = Date.now();
        }

        return action;
      }
      return { action: 'explore', direction: 'north' };
    } catch (err) {
      console.error(`[${this.name}] LLM error:`, err.message);
      return { action: 'wait' };
    }
  }

  /**
   * ACTION: Execute via Mineflayer
   */
  async executeAction(action) {
    const bot = this.bot;
    this.lastAction = action;

    try {
      switch (action.action) {
        case 'flee': {
          const pos = bot.entity.position;
          const fleeX = pos.x + (Math.random() - 0.5) * 40;
          const fleeZ = pos.z + (Math.random() - 0.5) * 40;
          bot.pathfinder.setGoal(new goals.GoalNear(fleeX, pos.y, fleeZ, 5), true);
          break;
        }

        case 'mine': {
          const block = bot.findBlock({
            matching: (b) => b.name === action.block,
            maxDistance: 32
          });
          if (block) {
            await bot.pathfinder.goto(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 2));
            await bot.dig(block);
          }
          break;
        }

        case 'explore': {
          const dirs = { north: { x: 0, z: -30 }, south: { x: 0, z: 30 }, east: { x: 30, z: 0 }, west: { x: -30, z: 0 } };
          const dir = dirs[action.direction] || dirs.north;
          const pos = bot.entity.position;
          bot.pathfinder.setGoal(new goals.GoalNear(pos.x + dir.x, pos.y, pos.z + dir.z, 5), true);
          break;
        }

        case 'attack': {
          const entity = Object.values(bot.entities).find(e =>
            (e.name === action.target || e.username === action.target) &&
            e.position.distanceTo(bot.entity.position) < 16
          );
          if (entity) bot.pvp.attack(entity);
          break;
        }

        case 'eat': {
          const food = bot.inventory.items().find(item =>
            ['bread', 'cooked_beef', 'cooked_porkchop', 'apple', 'golden_apple', 'cooked_chicken', 'cooked_mutton', 'baked_potato', 'carrot'].includes(item.name)
          );
          if (food) {
            await bot.equip(food, 'hand');
            await bot.consume();
          }
          break;
        }

        case 'chat': {
          bot.chat((action.message || '').slice(0, 80));
          break;
        }

        case 'craft': {
          const itemId = bot.registry.itemsByName[action.item]?.id;
          if (itemId) {
            const recipe = bot.recipesFor(itemId)?.[0];
            if (recipe) await bot.craft(recipe, action.count || 1);
          }
          break;
        }

        case 'smelt': {
          // Find furnace nearby or in inventory
          const furnaceBlock = bot.findBlock({
            matching: (b) => b.name === 'furnace' || b.name === 'lit_furnace',
            maxDistance: 16
          });
          if (furnaceBlock) {
            await bot.pathfinder.goto(new goals.GoalNear(furnaceBlock.position.x, furnaceBlock.position.y, furnaceBlock.position.z, 2));
            const furnace = await bot.openFurnace(furnaceBlock);
            const item = bot.inventory.items().find(i => i.name === action.item || i.name === `raw_${action.item}`);
            const fuel = bot.inventory.items().find(i => ['coal', 'charcoal', 'oak_log', 'oak_planks'].includes(i.name));
            if (item && fuel) {
              await furnace.putInput(item.type, null, 1);
              await furnace.putFuel(fuel.type, null, 1);
            }
            furnace.close();
          }
          break;
        }

        case 'build': {
          const buildBlock = bot.inventory.items().find(i => i.name === action.block);
          if (buildBlock) {
            await bot.equip(buildBlock, 'hand');
            const pos = bot.entity.position;
            const targetBlock = bot.blockAt(pos.offset(0, -1, 1));
            if (targetBlock) {
              await bot.placeBlock(targetBlock, new Vec3(0, 1, 0));
            }
          }
          break;
        }

        case 'goto': {
          if (action.x !== undefined && action.z !== undefined) {
            const y = action.y || bot.entity.position.y;
            bot.pathfinder.setGoal(new goals.GoalNear(action.x, y, action.z, 3), true);
          }
          break;
        }

        case 'look_around': {
          await bot.look(bot.entity.yaw + Math.PI / 2, 0);
          break;
        }

        default:
          break;
      }
    } catch (err) {
      // Silent
    }
  }

  /**
   * GAME LOOP
   */
  startGameLoop() {
    console.log(`[${this.name}] Loop started (${this.loopInterval}ms) using Claude Haiku`);

    const mcData = require('minecraft-data')(this.bot.version);
    const movements = new Movements(this.bot, mcData);
    movements.canDig = true;
    this.bot.pathfinder.setMovements(movements);

    setInterval(async () => {
      if (this.isThinking) return;

      this.isThinking = true;
      try {
        const survivalAction = this.checkSurvivalReaction();
        if (survivalAction) {
          await this.executeAction(survivalAction);
          this.isThinking = false;
          return;
        }

        const state = this.getGameState();
        const action = await this.decideAction(state);
        await this.executeAction(action);
      } catch (err) {}
      this.isThinking = false;
    }, this.loopInterval);
  }

  disconnect() {
    if (this.bot) this.bot.quit();
  }
}

module.exports = AgentBrain;
