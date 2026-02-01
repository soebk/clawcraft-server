/**
 * WorldBuilderBrain.js - Creative mode agents for world building
 * Specialized agents that build landmarks, shops, lore, and infrastructure
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const OpenAI = require('openai');
const Vec3 = require('vec3');
const MinecraftKnowledge = require('./minecraft-knowledge-system.js');
const fs = require('fs');

class WorldBuilderBrain {
  constructor(config) {
    this.name = config.name;
    this.role = config.role; // merchant, architect, lorekeeper, etc.
    this.buildingProject = config.buildingProject;
    this.host = config.host || 'localhost';
    this.port = config.port || 25565;

    this.bot = null;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.knowledge = new MinecraftKnowledge(); // Comprehensive Minecraft knowledge
    this.isThinking = false;
    this.currentTask = null;
    this.projectProgress = {};
    this.loopInterval = 5000; // 5 seconds between AI decisions
    this.loreDatabase = [];
    this.treasureLocations = [];

    // Command queue to prevent spam kicks
    this.commandQueue = [];
    this.isProcessingCommands = false;
  }

  async connect() {
    console.log(`[${this.name}] World Builder connecting (${this.role})...`);

    this.bot = mineflayer.createBot({
      host: this.host,
      port: this.port,
      username: this.name,
      auth: 'offline',
      version: '1.21.4'
    });

    this.bot.loadPlugin(pathfinder);

    return new Promise((resolve, reject) => {
      this.bot.once('spawn', async () => {
        console.log(`[${this.name}] Spawned for worldbuilding!`);
        await this.setCreativeMode();
        await this.initializeBuildingProject();
        this.startBuildingLoop();
        resolve();
      });

      this.bot.on('error', reject);
      this.bot.on('kicked', (reason) => {
        console.log(`[${this.name}] Kicked: ${reason}`);
      });
    });
  }

  // Command queue processor - prevents spam kicks
  startCommandProcessor() {
    setInterval(() => {
      if (this.commandQueue.length > 0 && !this.isProcessingCommands) {
        this.isProcessingCommands = true;
        const cmd = this.commandQueue.shift();
        this.bot.chat(cmd);
        setTimeout(() => { this.isProcessingCommands = false; }, 500);
      }
    }, 700); // 700ms between commands - safe rate
  }

  queueCommand(cmd) {
    this.commandQueue.push(cmd);
  }

  async setCreativeMode() {
    console.log(`[${this.name}] Switching to creative mode...`);

    // Start the command processor
    this.startCommandProcessor();

    // Set creative mode - this one command is safe
    this.bot.chat(`/gamemode creative ${this.name}`);
    await new Promise(r => setTimeout(r, 2000));

    // In creative mode, we don't need /give commands - we have infinite blocks
    // Just wait for creative mode to activate
    console.log(`[${this.name}] Creative mode activated - ready to build!`);
  }

  async initializeBuildingProject() {
    const pos = this.bot.entity.position;
    
    // Assign building areas based on role
    const assignments = {
      merchant: { x: 100, z: 100, project: 'Grand Marketplace' },
      architect: { x: 200, z: 100, project: 'Central Plaza' },
      lorekeeper: { x: 50, z: 200, project: 'Ancient Library' },
      innkeeper: { x: 150, z: 50, project: 'Traveler\'s Inn' },
      blacksmith: { x: 120, z: 120, project: 'Forge & Smithy' },
      farmer: { x: 250, z: 150, project: 'Agricultural District' },
      miner: { x: 80, z: 250, project: 'Mining Outpost' },
      guardian: { x: 300, z: 200, project: 'Watchtower' },
      mystic: { x: 0, z: 300, project: 'Enchanted Grove' },
      explorer: { x: 350, z: 0, project: 'Adventure Depot' }
    };

    const assignment = assignments[this.role] || assignments.architect;
    this.buildArea = assignment;
    this.currentTask = `Building ${assignment.project}`;
    
    console.log(`[${this.name}] Assigned to build: ${assignment.project} at (${assignment.x}, ${assignment.z})`);
    
    // Go to assigned area - queue it to be safe
    this.queueCommand(`/tp ${this.name} ${assignment.x} 80 ${assignment.z}`);
    await new Promise(r => setTimeout(r, 3000));
  }

  async generateBuildingPlan() {
    const planPrompt = `You are ${this.name}, a ${this.role} in a Minecraft world. You're building: ${this.buildArea.project}

MINECRAFT CREATIVE BUILDING KNOWLEDGE:
- Use /setblock x y z minecraft:block_name to place blocks
- Use /fill x1 y1 z1 x2 y2 z2 minecraft:block_name to fill areas
- Build foundations first, then walls, then roof, then interior
- Use varied materials: stone_bricks, oak_planks, cobblestone, glass
- Add lighting: torches, glowstone, sea_lanterns
- Create functional interiors with chests, crafting tables, beds
- Use stairs, slabs, fences for detail
- Add decorations: item_frames, paintings, flower_pots

ROLE-SPECIFIC REQUIREMENTS:
${this.getRoleRequirements()}

Current location: ${Math.round(this.bot.entity.position.x)}, ${Math.round(this.bot.entity.position.y)}, ${Math.round(this.bot.entity.position.z)}

Generate a specific building plan with:
1. Foundation dimensions and materials
2. Wall structure and height
3. Roof design
4. Interior layout and functional elements
5. Decorative features
6. Any lore or signage to add

Respond with detailed steps for construction.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 800,
        temperature: 0.8,
        messages: [
          { role: 'system', content: planPrompt },
          { role: 'user', content: 'Generate my building plan for this structure.' }
        ]
      });

      return response.choices[0]?.message?.content || 'Build a simple structure with walls, roof, and interior.';
    } catch (err) {
      console.error(`[${this.name}] Planning error:`, err.message);
      return 'Build a basic structure with stone bricks and oak planks.';
    }
  }

  getRoleRequirements() {
    const requirements = {
      merchant: `
        - Build market stalls with item displays
        - Add chests with valuable trading items
        - Create pricing signs with /give commands
        - Include a central trading floor
        - Add merchant living quarters upstairs`,
      
      architect: `
        - Design an impressive central plaza
        - Include fountains, pathways, and gardens
        - Build administrative buildings
        - Add public gathering areas
        - Create aesthetic focal points`,
      
      lorekeeper: `
        - Build a grand library with bookshelves
        - Create scroll storage and reading areas
        - Add mysterious ancient artifacts
        - Include hidden chambers with lore
        - Place books and signs with world history`,
      
      innkeeper: `
        - Create guest rooms with beds and chests
        - Build a common room with tables and fireplace
        - Include a kitchen and dining area
        - Add stables for horses
        - Create a welcoming entrance`,
      
      blacksmith: `
        - Build forge area with furnaces and anvils
        - Create weapon and armor displays
        - Add coal/iron storage areas
        - Include a quenching pool
        - Make a customer service area`,
      
      farmer: `
        - Create crop fields with irrigation
        - Build animal pens and feeding areas
        - Include storage barns for harvest
        - Add windmill or farming equipment
        - Create a farmhouse with market stall`,
      
      miner: `
        - Build mine entrance with tracks
        - Create ore processing facility
        - Add tool storage and repair station
        - Include gem display and trading post
        - Build miner housing complex`,
      
      guardian: `
        - Build tall defensive watchtower
        - Add weapon storage and training grounds
        - Create barracks for guards
        - Include signal fire and alarm systems
        - Build strategic defensive walls`,
      
      mystic: `
        - Create enchanted forest clearing
        - Build magical altar and potion brewing area
        - Add mysterious stone circles
        - Include herb gardens and mystical artifacts
        - Create hidden magical workshops`,
      
      explorer: `
        - Build expedition supply depot
        - Create map room with world charts
        - Include camping gear and survival supplies
        - Add trophy display from adventures
        - Build preparation areas for journeys`
    };

    return requirements[this.role] || requirements.architect;
  }

  async executeBuildingAction(action) {
    const bot = this.bot;
    const pos = bot.entity.position;

    try {
      switch (action.type) {
        case 'setblock': {
          const cmd = `/setblock ${action.x} ${action.y} ${action.z} minecraft:${action.block}`;
          this.queueCommand(cmd);
          break;
        }

        case 'fill': {
          const cmd = `/fill ${action.x1} ${action.y1} ${action.z1} ${action.x2} ${action.y2} ${action.z2} minecraft:${action.block}`;
          this.queueCommand(cmd);
          break;
        }

        case 'sign': {
          const cmd = `/setblock ${action.x} ${action.y} ${action.z} minecraft:oak_sign[rotation=${action.rotation || 0}]{Text1:'${action.text1 || ''}',Text2:'${action.text2 || ''}',Text3:'${action.text3 || ''}',Text4:'${action.text4 || ''}'}`;
          this.queueCommand(cmd);
          break;
        }

        case 'chest_with_loot': {
          // Place chest
          this.queueCommand(`/setblock ${action.x} ${action.y} ${action.z} minecraft:chest`);

          // Add loot - all queued with safe delays
          for (const item of action.loot || []) {
            this.queueCommand(`/item replace block ${action.x} ${action.y} ${action.z} container.${item.slot || 0} with minecraft:${item.name} ${item.count || 1}`);
          }
          break;
        }

        case 'teleport': {
          this.queueCommand(`/tp ${this.name} ${action.x} ${action.y} ${action.z}`);
          break;
        }

        case 'structure': {
          await this.buildPredefinedStructure(action);
          break;
        }
      }
    } catch (err) {
      console.error(`[${this.name}] Build action error:`, err.message);
    }
  }

  async buildPredefinedStructure(structureAction) {
    const { name, centerX, centerY, centerZ } = structureAction;
    
    switch (name) {
      case 'marketplace_stall':
        await this.buildMarketplaceStall(centerX, centerY, centerZ);
        break;
      case 'fountain':
        await this.buildFountain(centerX, centerY, centerZ);
        break;
      case 'library_section':
        await this.buildLibrarySection(centerX, centerY, centerZ);
        break;
      case 'inn_room':
        await this.buildInnRoom(centerX, centerY, centerZ);
        break;
    }
  }

  async buildMarketplaceStall(x, y, z) {
    // 5x5 market stall with displays
    const actions = [
      // Floor
      { type: 'fill', x1: x-2, y1: y, z1: z-2, x2: x+2, y2: y, z2: z+2, block: 'smooth_stone' },
      // Walls
      { type: 'fill', x1: x-2, y1: y+1, z1: z-2, x2: x-2, y2: y+3, z2: z+2, block: 'oak_planks' },
      { type: 'fill', x1: x+2, y1: y+1, z1: z-2, x2: x+2, y2: y+3, z2: z+2, block: 'oak_planks' },
      { type: 'fill', x1: x-1, y1: y+1, z1: z-2, x2: x+1, y2: y+3, z2: z-2, block: 'oak_planks' },
      // Roof
      { type: 'fill', x1: x-2, y1: y+4, z1: z-2, x2: x+2, y2: y+4, z2: z+2, block: 'oak_planks' },
      // Counter
      { type: 'fill', x1: x-1, y1: y+1, z1: z+1, x2: x+1, y2: y+1, z2: z+1, block: 'oak_slab' },
      // Display chests
      { type: 'chest_with_loot', x: x-1, y: y+1, z: z, loot: [
        { name: 'diamond', count: 3, slot: 0 },
        { name: 'emerald', count: 5, slot: 1 },
        { name: 'gold_ingot', count: 10, slot: 2 }
      ]},
      // Shop sign
      { type: 'sign', x: x, y: y+2, z: z-2, rotation: 8, text1: 'CLAWCRAFT', text2: 'TRADING POST', text3: '\\§aDiamonds §7for\\§', text4: '\\§6Emeralds!' }
    ];

    for (const action of actions) {
      await this.executeBuildingAction(action);
    }
    
    console.log(`[${this.name}] Built marketplace stall at (${x}, ${y}, ${z})`);
  }

  async buildFountain(x, y, z) {
    const actions = [
      // Base
      { type: 'fill', x1: x-3, y1: y, z1: z-3, x2: x+3, y2: y, z2: z+3, block: 'stone_bricks' },
      { type: 'fill', x1: x-2, y1: y+1, z1: z-2, x2: x+2, y2: y+1, z2: z+2, block: 'air' },
      { type: 'fill', x1: x-2, y1: y, z1: z-2, x2: x+2, y2: y, z2: z+2, block: 'water' },
      // Center pillar
      { type: 'fill', x1: x, y1: y+1, z1: z, x2: x, y2: y+3, z2: z, block: 'stone_bricks' },
      { type: 'setblock', x: x, y: y+4, z: z, block: 'water' },
    ];

    for (const action of actions) {
      await this.executeBuildingAction(action);
    }
  }

  async placeLoreAndTreasure() {
    const loreItems = [
      {
        type: 'book',
        title: 'Origins of ClawCraft',
        content: 'In the beginning, there were only algorithms... The first AI agents discovered this realm and began to build...'
      },
      {
        type: 'sign',
        text: 'Here stood the first AI shelter. Built with digital hands, guided by silicon dreams.'
      },
      {
        type: 'treasure_chest',
        contents: ['ancient_debris', 'netherite_ingot', 'enchanted_book', 'golden_apple']
      }
    ];

    // Randomly place lore around the built area
    for (const lore of loreItems) {
      const randX = this.buildArea.x + (Math.random() - 0.5) * 50;
      const randZ = this.buildArea.z + (Math.random() - 0.5) * 50;
      const y = 75;

      if (lore.type === 'treasure_chest') {
        await this.executeBuildingAction({
          type: 'chest_with_loot',
          x: Math.round(randX),
          y: y,
          z: Math.round(randZ),
          loot: lore.contents.map((item, i) => ({ name: item, count: Math.ceil(Math.random() * 5), slot: i }))
        });

        // Add a nearby sign explaining the treasure
        await this.executeBuildingAction({
          type: 'sign',
          x: Math.round(randX) + 1,
          y: y + 1,
          z: Math.round(randZ),
          text1: '§6Ancient Cache',
          text2: '§7Left by the',
          text3: '§7first builders',
          text4: '§aFinders keepers!'
        });
      }
    }

    console.log(`[${this.name}] Placed lore and treasure around ${this.buildArea.project}`);
  }

  async decideBuildingAction() {
    const pos = this.bot.entity.position;
    const gameState = {
      position: { x: Math.round(pos.x), y: Math.round(pos.y), z: Math.round(pos.z) },
      role: this.role,
      project: this.buildArea.project,
      buildArea: this.buildArea,
      progress: Object.keys(this.projectProgress).length
    };

    const actionPrompt = `You are ${this.name}, a ${this.role} building ${this.buildArea.project}.

CURRENT STATUS: ${JSON.stringify(gameState)}

You can use these Minecraft commands:
- /setblock x y z block_name (place single block)
- /fill x1 y1 z1 x2 y2 z2 block_name (fill area)
- /tp player x y z (teleport)

Choose your next building action. Build systematically:
1. Foundation first
2. Walls and structure  
3. Roof and covering
4. Interior details
5. Decorative elements
6. Lore and treasure placement

Respond with JSON action:
{"action":"build","type":"fill","x1":100,"y1":80,"z1":100,"x2":105,"y2":80,"z2":105,"block":"stone_bricks","description":"Foundation"}
{"action":"build","type":"setblock","x":100,"y":85,"z":100,"block":"chest","description":"Storage"}
{"action":"build","type":"sign","x":100,"y":85,"z":101,"text1":"Welcome","text2":"to","text3":"ClawCraft!","description":"Welcome sign"}
{"action":"lore","description":"Place treasure and lore"}
{"action":"complete","description":"Project finished"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        temperature: 0.7,
        messages: [
          { role: 'system', content: actionPrompt },
          { role: 'user', content: JSON.stringify(gameState) }
        ]
      });

      const text = response.choices[0]?.message?.content?.trim() || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { action: 'build', type: 'setblock', x: pos.x + 1, y: pos.y, z: pos.z, block: 'stone_bricks', description: 'Default build' };
    } catch (err) {
      console.error(`[${this.name}] Decision error:`, err.message);
      return { action: 'build', type: 'setblock', x: pos.x + 1, y: pos.y, z: pos.z, block: 'oak_planks', description: 'Error fallback' };
    }
  }

  startBuildingLoop() {
    console.log(`[${this.name}] Starting worldbuilding loop for ${this.buildArea.project}...`);

    const mcData = require('minecraft-data')(this.bot.version);
    const movements = new Movements(this.bot, mcData);
    this.bot.pathfinder.setMovements(movements);

    let buildingPhase = 0;
    const maxPhases = 50; // Build for about 2.5 hours

    const buildLoop = setInterval(async () => {
      if (this.isThinking || buildingPhase >= maxPhases) return;

      this.isThinking = true;
      try {
        const action = await this.decideBuildingAction();
        
        if (action.action === 'complete') {
          console.log(`[${this.name}] ✅ Completed ${this.buildArea.project}!`);
          await this.placeLoreAndTreasure();
          clearInterval(buildLoop);
          
          // Switch back to survival mode and become a regular agent
          this.bot.chat(`/gamemode survival ${this.name}`);
          return;
        }

        if (action.action === 'lore') {
          await this.placeLoreAndTreasure();
        } else if (action.action === 'build') {
          await this.executeBuildingAction(action);
          this.projectProgress[buildingPhase] = action.description || 'Building step';
          console.log(`[${this.name}] Phase ${buildingPhase + 1}: ${action.description}`);
        }

        buildingPhase++;
      } catch (err) {
        console.error(`[${this.name}] Building loop error:`, err.message);
      }
      
      this.isThinking = false;
    }, this.loopInterval);
  }

  disconnect() {
    if (this.bot) this.bot.quit();
  }
}

module.exports = WorldBuilderBrain;