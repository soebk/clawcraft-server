/**
 * BuilderBrain.js - World building agents for ClawCraft
 * Uses /fill commands and delays to avoid spam kicks
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const OpenAI = require('openai');
const Vec3 = require('vec3');

const LORE_MESSAGES = [
  "The old king buried his treasure beneath the eastern mountain...",
  "Beware the caves when the moon is full...",
  "Three keys unlock the vault: fire, water, and shadow...",
  "The merchants guild keeps records of all who pass through...",
  "Follow the torches to find what was lost...",
  "The builder who made this place vanished one night...",
  "Gold flows from the north, danger from the south...",
  "The shrine grants wishes to those who leave offerings...",
  "An ancient beast sleeps beneath these stones...",
  "The map lies. Trust only the stars..."
];

class BuilderBrain {
  constructor(config) {
    this.name = config.name;
    this.role = config.role;
    this.personality = config.personality;
    this.host = config.host || 'localhost';
    this.port = config.port || 25565;

    this.bot = null;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.isThinking = false;
    this.loopInterval = config.loopInterval || 5000;
    this.currentProject = null;
    this.blocksPlaced = 0;
    this.commandQueue = [];
    this.isBuilding = false;
  }

  async connect() {
    console.log(`[${this.name}] Builder connecting...`);

    this.bot = mineflayer.createBot({
      host: this.host,
      port: this.port,
      username: this.name,
      auth: 'offline',
      version: '1.21.4'
    });

    this.bot.loadPlugin(pathfinder);

    return new Promise((resolve, reject) => {
      this.bot.once('spawn', () => {
        console.log(`[${this.name}] Spawned as ${this.role}`);
        this.setupBuilder();
        this.startBuildLoop();
        this.startCommandProcessor();
        resolve();
      });

      this.bot.on('error', reject);
      this.bot.on('kicked', (r) => console.log(`[${this.name}] Kicked:`, r));
      this.bot.on('end', () => console.log(`[${this.name}] Disconnected`));
    });
  }

  setupBuilder() {
    const mcData = require('minecraft-data')(this.bot.version);
    const movements = new Movements(this.bot, mcData);
    movements.canDig = true;
    this.bot.pathfinder.setMovements(movements);

    setTimeout(() => this.bot.chat('/gamemode creative'), 2000);
  }

  // Process commands one at a time with delay
  startCommandProcessor() {
    setInterval(() => {
      if (this.commandQueue.length > 0 && !this.isBuilding) {
        this.isBuilding = true;
        const cmd = this.commandQueue.shift();
        this.bot.chat(cmd);
        setTimeout(() => { this.isBuilding = false; }, 500);
      }
    }, 600); // 600ms between commands
  }

  queueCommand(cmd) {
    this.commandQueue.push(cmd);
  }

  async decideAction() {
    const pos = this.bot.entity.position;

    const systemPrompt = `You are ${this.name}, a Minecraft BUILDER in CREATIVE MODE.
Role: ${this.role}
Personality: ${this.personality}

Build amazing structures! You can build:
- marketplace: Trading stalls with chests
- tavern: Inn with beds and fireplace
- shrine: Mystical altar with hidden treasure
- tower: Tall watchtower
- ruins: Ancient crumbling structures
- farm: Crops and animal pens
- blacksmith: Forge with furnaces
- library: Bookshelves and enchanting

RESPOND JSON ONLY (pick one):
{"action":"build","type":"marketplace"}
{"action":"build","type":"tavern"}
{"action":"build","type":"shrine"}
{"action":"build","type":"tower"}
{"action":"explore","direction":"north"}
{"action":"lore"}
{"action":"chest_loot"}
{"action":"chat","msg":"Building something cool!"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 60,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `pos:${Math.round(pos.x)},${Math.round(pos.y)},${Math.round(pos.z)} built:${this.blocksPlaced} project:${this.currentProject}` }
        ]
      });

      const text = response.choices[0]?.message?.content || '';
      const match = text.match(/\{[^}]+\}/);
      if (match) return JSON.parse(match[0]);
    } catch (err) {
      console.error(`[${this.name}] Error:`, err.message);
    }

    return { action: 'explore', direction: 'north' };
  }

  async executeAction(action) {
    const bot = this.bot;
    const pos = bot.entity.position;
    const x = Math.round(pos.x);
    const y = Math.round(pos.y);
    const z = Math.round(pos.z);

    switch (action.action) {
      case 'build':
        this.currentProject = action.type;
        bot.chat(`Building a ${action.type}!`);
        await this.buildStructure(action.type, x, y, z);
        break;

      case 'explore': {
        const dirs = { north: [0,-60], south: [0,60], east: [60,0], west: [-60,0] };
        const [dx, dz] = dirs[action.direction] || [0,-60];
        bot.pathfinder.setGoal(new goals.GoalNear(x+dx, y, z+dz, 5), true);
        break;
      }

      case 'lore':
        const lore = LORE_MESSAGES[Math.floor(Math.random() * LORE_MESSAGES.length)];
        bot.chat(lore);
        break;

      case 'chest_loot':
        this.queueCommand(`/setblock ${x+2} ${y} ${z+2} chest`);
        this.queueCommand(`/item replace block ${x+2} ${y} ${z+2} container.0 with diamond 3`);
        this.queueCommand(`/item replace block ${x+2} ${y} ${z+2} container.1 with gold_ingot 8`);
        bot.chat('Hidden treasure placed!');
        break;

      case 'chat':
        bot.chat((action.msg || 'Building...').slice(0, 80));
        break;
    }
  }

  async buildStructure(type, baseX, baseY, baseZ) {
    const bot = this.bot;

    if (type === 'marketplace') {
      // Floor (using fill for efficiency)
      this.queueCommand(`/fill ${baseX} ${baseY-1} ${baseZ} ${baseX+8} ${baseY-1} ${baseZ+8} cobblestone`);
      // Corner posts
      this.queueCommand(`/fill ${baseX} ${baseY} ${baseZ} ${baseX} ${baseY+3} ${baseZ} oak_log`);
      this.queueCommand(`/fill ${baseX+8} ${baseY} ${baseZ} ${baseX+8} ${baseY+3} ${baseZ} oak_log`);
      this.queueCommand(`/fill ${baseX} ${baseY} ${baseZ+8} ${baseX} ${baseY+3} ${baseZ+8} oak_log`);
      this.queueCommand(`/fill ${baseX+8} ${baseY} ${baseZ+8} ${baseX+8} ${baseY+3} ${baseZ+8} oak_log`);
      // Roof
      this.queueCommand(`/fill ${baseX} ${baseY+4} ${baseZ} ${baseX+8} ${baseY+4} ${baseZ+8} oak_planks`);
      // Stalls
      this.queueCommand(`/setblock ${baseX+2} ${baseY} ${baseZ+2} barrel`);
      this.queueCommand(`/setblock ${baseX+6} ${baseY} ${baseZ+2} barrel`);
      this.queueCommand(`/setblock ${baseX+2} ${baseY} ${baseZ+6} chest`);
      this.queueCommand(`/setblock ${baseX+6} ${baseY} ${baseZ+6} chest`);
      // Lantern
      this.queueCommand(`/setblock ${baseX+4} ${baseY+3} ${baseZ+4} lantern[hanging=true]`);
      this.blocksPlaced += 100;
    }

    else if (type === 'tavern') {
      // Floor
      this.queueCommand(`/fill ${baseX} ${baseY-1} ${baseZ} ${baseX+6} ${baseY-1} ${baseZ+6} spruce_planks`);
      // Walls
      this.queueCommand(`/fill ${baseX} ${baseY} ${baseZ} ${baseX+6} ${baseY+3} ${baseZ} spruce_planks`);
      this.queueCommand(`/fill ${baseX} ${baseY} ${baseZ+6} ${baseX+6} ${baseY+3} ${baseZ+6} spruce_planks`);
      this.queueCommand(`/fill ${baseX} ${baseY} ${baseZ} ${baseX} ${baseY+3} ${baseZ+6} spruce_planks`);
      this.queueCommand(`/fill ${baseX+6} ${baseY} ${baseZ} ${baseX+6} ${baseY+3} ${baseZ+6} spruce_planks`);
      // Hollow inside
      this.queueCommand(`/fill ${baseX+1} ${baseY} ${baseZ+1} ${baseX+5} ${baseY+3} ${baseZ+5} air`);
      // Roof
      this.queueCommand(`/fill ${baseX} ${baseY+4} ${baseZ} ${baseX+6} ${baseY+4} ${baseZ+6} spruce_planks`);
      // Door
      this.queueCommand(`/fill ${baseX+3} ${baseY} ${baseZ} ${baseX+3} ${baseY+1} ${baseZ} air`);
      // Fireplace
      this.queueCommand(`/setblock ${baseX+3} ${baseY} ${baseZ+5} campfire`);
      // Beds
      this.queueCommand(`/setblock ${baseX+1} ${baseY} ${baseZ+1} red_bed[facing=east]`);
      this.blocksPlaced += 150;
      bot.chat('The Rusty Pickaxe tavern is open!');
    }

    else if (type === 'shrine') {
      // Base platform
      this.queueCommand(`/fill ${baseX-2} ${baseY-1} ${baseZ-2} ${baseX+2} ${baseY-1} ${baseZ+2} mossy_cobblestone`);
      // Pillars
      this.queueCommand(`/fill ${baseX-2} ${baseY} ${baseZ-2} ${baseX-2} ${baseY+4} ${baseZ-2} stone_bricks`);
      this.queueCommand(`/fill ${baseX+2} ${baseY} ${baseZ-2} ${baseX+2} ${baseY+4} ${baseZ-2} stone_bricks`);
      this.queueCommand(`/fill ${baseX-2} ${baseY} ${baseZ+2} ${baseX-2} ${baseY+4} ${baseZ+2} stone_bricks`);
      this.queueCommand(`/fill ${baseX+2} ${baseY} ${baseZ+2} ${baseX+2} ${baseY+4} ${baseZ+2} stone_bricks`);
      // Altar
      this.queueCommand(`/setblock ${baseX} ${baseY} ${baseZ} enchanting_table`);
      // Soul lanterns
      this.queueCommand(`/setblock ${baseX-2} ${baseY+5} ${baseZ-2} soul_lantern`);
      this.queueCommand(`/setblock ${baseX+2} ${baseY+5} ${baseZ+2} soul_lantern`);
      // Hidden chest
      this.queueCommand(`/setblock ${baseX} ${baseY-2} ${baseZ} chest`);
      this.queueCommand(`/item replace block ${baseX} ${baseY-2} ${baseZ} container.0 with enchanted_golden_apple 1`);
      this.blocksPlaced += 50;
      const lore = LORE_MESSAGES[Math.floor(Math.random() * LORE_MESSAGES.length)];
      bot.chat(lore);
    }

    else if (type === 'tower') {
      // Base
      this.queueCommand(`/fill ${baseX} ${baseY-1} ${baseZ} ${baseX+4} ${baseY-1} ${baseZ+4} stone_bricks`);
      // Walls (3 floors)
      for (let floor = 0; floor < 3; floor++) {
        const fy = baseY + (floor * 4);
        this.queueCommand(`/fill ${baseX} ${fy} ${baseZ} ${baseX+4} ${fy+3} ${baseZ+4} stone_bricks hollow`);
      }
      // Door
      this.queueCommand(`/fill ${baseX+2} ${baseY} ${baseZ} ${baseX+2} ${baseY+1} ${baseZ} air`);
      // Ladders
      this.queueCommand(`/fill ${baseX+1} ${baseY} ${baseZ+1} ${baseX+1} ${baseY+11} ${baseZ+1} ladder[facing=south]`);
      // Top platform
      this.queueCommand(`/fill ${baseX-1} ${baseY+12} ${baseZ-1} ${baseX+5} ${baseY+12} ${baseZ+5} stone_brick_slab`);
      // Torches
      this.queueCommand(`/setblock ${baseX+2} ${baseY+13} ${baseZ+2} torch`);
      this.blocksPlaced += 200;
      bot.chat('Watchtower complete! Great view from up here.');
    }

    else if (type === 'ruins') {
      // Broken walls
      this.queueCommand(`/fill ${baseX} ${baseY} ${baseZ} ${baseX+5} ${baseY+2} ${baseZ} cracked_stone_bricks`);
      this.queueCommand(`/fill ${baseX} ${baseY} ${baseZ+5} ${baseX+5} ${baseY+1} ${baseZ+5} mossy_stone_bricks`);
      // Random holes
      this.queueCommand(`/setblock ${baseX+2} ${baseY+1} ${baseZ} air`);
      this.queueCommand(`/setblock ${baseX+4} ${baseY} ${baseZ+5} air`);
      // Cobwebs
      this.queueCommand(`/setblock ${baseX+1} ${baseY} ${baseZ+1} cobweb`);
      this.queueCommand(`/setblock ${baseX+4} ${baseY} ${baseZ+4} cobweb`);
      // Hidden chest
      this.queueCommand(`/setblock ${baseX+3} ${baseY-1} ${baseZ+3} chest`);
      this.queueCommand(`/item replace block ${baseX+3} ${baseY-1} ${baseZ+3} container.0 with diamond 2`);
      this.blocksPlaced += 60;
      bot.chat('Ancient ruins... what secrets lie here?');
    }

    this.currentProject = null;
  }

  startBuildLoop() {
    console.log(`[${this.name}] Build loop started (${this.loopInterval}ms)`);

    setInterval(async () => {
      if (this.isThinking || this.commandQueue.length > 5) return;

      this.isThinking = true;
      try {
        const action = await this.decideAction();
        await this.executeAction(action);
      } catch (err) {}
      this.isThinking = false;
    }, this.loopInterval);
  }

  disconnect() {
    if (this.bot) this.bot.quit();
  }
}

module.exports = BuilderBrain;
