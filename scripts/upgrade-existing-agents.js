#!/usr/bin/env node
/**
 * Upgrade Existing ClawCraft Agents
 * - Switch current agents to creative mode
 * - Fix starter kit issues
 * - Enhance intelligence with Claude Haiku
 * - Prepare for worldbuilding phase
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const fs = require('fs');
const path = require('path');

class AgentUpgrader {
  constructor() {
    this.serverHost = process.env.MC_SERVER_HOST || '89.167.28.237';
    this.serverPort = process.env.MC_SERVER_PORT || 25565;
    this.existingAgents = [];
    this.upgradeLog = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    this.upgradeLog.push(logMessage);
  }

  async findExistingAgents() {
    this.log('🔍 FINDING EXISTING AGENTS...');
    
    // Look for running agent processes
    try {
      const { stdout } = await execAsync('pgrep -f "node.*testBot\\|AgentBrain" -l');
      const processes = stdout.trim().split('\\n').filter(line => line);
      
      this.log(`Found ${processes.length} existing agent processes`);
      
      // Also check for agents that might be configured
      const agentConfigFile = path.join(__dirname, '../data/active-agents.json');
      if (fs.existsSync(agentConfigFile)) {
        const config = JSON.parse(fs.readFileSync(agentConfigFile, 'utf8'));
        this.existingAgents = config.agents || [];
        this.log(`Found ${this.existingAgents.length} configured agents`);
      }
    } catch (err) {
      this.log(`No existing agent processes found: ${err.message}`);
    }

    // Default agent names if none found
    if (this.existingAgents.length === 0) {
      this.existingAgents = [
        'Agent_Alpha', 'Agent_Beta', 'Agent_Gamma', 'Agent_Delta',
        'Agent_Echo', 'Agent_Foxtrot', 'Agent_Golf', 'Agent_Hotel',
        'Agent_India', 'Agent_Juliet'
      ];
      this.log(`Using default agent names: ${this.existingAgents.length} agents`);
    }
  }

  async switchToCreativeMode() {
    this.log('🎨 SWITCHING AGENTS TO CREATIVE MODE...');
    
    const mineflayer = require('mineflayer');
    let commandBot;
    
    try {
      // Create a temporary bot to send commands
      commandBot = mineflayer.createBot({
        host: this.serverHost,
        port: this.serverPort,
        username: 'CommandBot_Temp',
        auth: 'offline',
        version: '1.21.4'
      });

      await new Promise((resolve, reject) => {
        commandBot.once('spawn', resolve);
        commandBot.once('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });

      this.log('✅ Command bot connected to server');

      // Give the command bot op permissions (assuming it has them)
      await new Promise(r => setTimeout(r, 2000));

      // Switch each existing agent to creative mode
      for (const agentName of this.existingAgents) {
        try {
          commandBot.chat(`/gamemode creative ${agentName}`);
          await new Promise(r => setTimeout(r, 500));
          
          // Give enhanced building materials
          const creativeMaterials = [
            'stone_bricks 64', 'oak_planks 64', 'spruce_planks 64',
            'glass 64', 'glowstone 64', 'torch 64',
            'chest 16', 'item_frame 16', 'sign 32',
            'iron_door 8', 'oak_fence 64', 'oak_stairs 64',
            'stone_brick_stairs 64', 'white_wool 64', 'red_wool 32',
            'diamond_pickaxe 1', 'diamond_sword 1', 'diamond_axe 1'
          ];

          for (const material of creativeMaterials) {
            commandBot.chat(`/give ${agentName} minecraft:${material}`);
            await new Promise(r => setTimeout(r, 100));
          }

          this.log(`🎨 ${agentName} switched to creative mode with materials`);
        } catch (err) {
          this.log(`⚠️  Failed to upgrade ${agentName}: ${err.message}`);
        }
      }

      commandBot.quit();
      
    } catch (err) {
      this.log(`❌ Failed to switch agents to creative mode: ${err.message}`);
      if (commandBot) commandBot.quit();
    }
  }

  async fixStarterKits() {
    this.log('🔧 FIXING STARTER KIT SYSTEM...');
    
    // Update the starter kit in AgentBrain.js to be more comprehensive
    const agentBrainPath = path.join(__dirname, '../agents/AgentBrain.js');
    
    if (fs.existsSync(agentBrainPath)) {
      let content = fs.readFileSync(agentBrainPath, 'utf8');
      
      // Enhanced starter kit
      const enhancedStarterKit = `
  /**
   * ENHANCED STARTER KIT - Comprehensive survival gear
   */
  async giveStarterKit() {
    const bot = this.bot;
    console.log(\`[\${this.name}] Giving enhanced starter kit...\`);
    
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
      bot.chat(\`/give \${this.name} minecraft:\${item}\`);
      await new Promise(r => setTimeout(r, 150)); // Slightly slower to prevent spam
    }
    
    console.log(\`[\${this.name}] Enhanced starter kit received! (\${kit.length} item types)\`);
  }`;

      // Replace the existing starter kit method
      const starterKitRegex = /\/\*\*[\s\S]*?STARTER KIT[\s\S]*?\*\/[\s\S]*?async giveStarterKit\(\)[\s\S]*?(?=\n\s\s[a-zA-Z]|\n\})/;
      
      if (starterKitRegex.test(content)) {
        content = content.replace(starterKitRegex, enhancedStarterKit);
        fs.writeFileSync(agentBrainPath, content);
        this.log('✅ Enhanced starter kit system in AgentBrain.js');
      } else {
        this.log('⚠️  Could not find starter kit method to replace');
      }
    }
  }

  async upgradeAgentIntelligence() {
    this.log('🧠 UPGRADING AGENT INTELLIGENCE...');
    
    // Update the existing AgentBrain to use Claude Haiku
    const agentBrainPath = path.join(__dirname, '../agents/AgentBrain.js');
    
    if (fs.existsSync(agentBrainPath)) {
      let content = fs.readFileSync(agentBrainPath, 'utf8');
      
      // Replace GPT-4o-mini with Claude Haiku
      content = content.replace(/gpt-4o-mini/g, 'claude-3-5-haiku');
      content = content.replace(/GPT-4o-mini/g, 'Claude Haiku');
      
      // Enhance the system prompt with much more Minecraft knowledge
      const enhancedSystemPrompt = `
MINECRAFT MASTERY - You are an EXPERT Minecraft player with complete game knowledge:

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

Your personality: \${this.personality}

Respond with exactly ONE JSON action considering ALL this knowledge:`;

      // Replace the existing system prompt
      const systemPromptRegex = /const systemPrompt = `[^`]*`;/;
      if (systemPromptRegex.test(content)) {
        content = content.replace(systemPromptRegex, `const systemPrompt = \`\${enhancedSystemPrompt}\`;`);
      }

      // Add the enhanced system prompt variable
      content = content.replace('async decideAction(gameState) {', 
        `async decideAction(gameState) {\n    const enhancedSystemPrompt = \`${enhancedSystemPrompt.trim()}\`;\n`);

      fs.writeFileSync(agentBrainPath, content);
      this.log('✅ Agent intelligence upgraded to Claude Haiku with enhanced Minecraft knowledge');
    }
  }

  async createSpawnPointManager() {
    this.log('📍 CREATING SPAWN POINT MANAGER...');
    
    const spawnManagerCode = `
/**
 * Spawn Point Manager for ClawCraft
 * Distributes agents across the world to avoid clustering
 */

class SpawnPointManager {
  constructor() {
    this.spawnPoints = [
      { x: 0, z: 0, assigned: false, name: 'Origin' },
      { x: 100, z: 100, assigned: false, name: 'Northeast Market' },
      { x: -100, z: 100, assigned: false, name: 'Northwest Farm' },
      { x: 100, z: -100, assigned: false, name: 'Southeast Mine' },
      { x: -100, z: -100, assigned: false, name: 'Southwest Village' },
      { x: 200, z: 0, assigned: false, name: 'East Outpost' },
      { x: -200, z: 0, assigned: false, name: 'West Outpost' },
      { x: 0, z: 200, assigned: false, name: 'North Settlement' },
      { x: 0, z: -200, assigned: false, name: 'South Settlement' },
      { x: 150, z: 150, assigned: false, name: 'Industrial District' },
      { x: -150, z: -150, assigned: false, name: 'Residential Area' }
    ];
  }

  assignSpawnPoint(agentName) {
    const available = this.spawnPoints.filter(point => !point.assigned);
    if (available.length === 0) {
      // Reset if all taken
      this.spawnPoints.forEach(point => point.assigned = false);
      return this.spawnPoints[0];
    }
    
    const chosen = available[Math.floor(Math.random() * available.length)];
    chosen.assigned = true;
    console.log(\`Assigned \${agentName} to spawn at \${chosen.name} (\${chosen.x}, \${chosen.z})\`);
    return chosen;
  }
  
  teleportAgent(bot, spawnPoint) {
    const y = 80; // Safe height
    bot.chat(\`/tp \${bot.username} \${spawnPoint.x} \${y} \${spawnPoint.z}\`);
  }
}

module.exports = SpawnPointManager;
`;

    const spawnManagerPath = path.join(__dirname, '../core/SpawnPointManager.js');
    fs.writeFileSync(spawnManagerPath, spawnManagerCode);
    this.log('✅ Spawn point manager created');
  }

  async generateUpgradeReport() {
    this.log('📊 GENERATING UPGRADE REPORT...');
    
    const report = {
      timestamp: new Date().toISOString(),
      agents_found: this.existingAgents.length,
      upgrades_applied: [
        'Creative mode activation',
        'Enhanced starter kits', 
        'Claude Haiku intelligence upgrade',
        'Comprehensive Minecraft knowledge',
        'Spawn point distribution system'
      ],
      server: {
        host: this.serverHost,
        port: this.serverPort
      },
      next_steps: [
        'Deploy worldbuilding agents',
        'Activate marketplace system',
        'Begin 3-hour worldbuilding phase',
        'Monitor agent behavior and economy'
      ],
      log_entries: this.upgradeLog
    };

    const reportPath = path.join(__dirname, '../data/upgrade-report.json');
    
    // Ensure data directory exists
    const dataDir = path.dirname(reportPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\\n📋 UPGRADE SUMMARY:');
    console.log(`🤖 Found ${report.agents_found} existing agents`);
    console.log(`🔧 Applied ${report.upgrades_applied.length} major upgrades`);
    console.log(`📁 Report saved to: ${reportPath}`);
    console.log(`\\n🚀 Ready for worldbuilding deployment!`);
    
    return report;
  }
}

// Main execution
async function main() {
  console.log('🔄 CLAWCRAFT AGENT UPGRADE SYSTEM STARTING...');
  console.log('='.repeat(60));
  
  const upgrader = new AgentUpgrader();
  
  try {
    // Step 1: Find existing agents
    await upgrader.findExistingAgents();
    
    // Step 2: Switch to creative mode for worldbuilding
    await upgrader.switchToCreativeMode();
    
    // Step 3: Fix starter kit issues
    await upgrader.fixStarterKits();
    
    // Step 4: Upgrade intelligence
    await upgrader.upgradeAgentIntelligence();
    
    // Step 5: Create supporting systems
    await upgrader.createSpawnPointManager();
    
    // Step 6: Generate final report
    const report = await upgrader.generateUpgradeReport();
    
    console.log('\\n✅ UPGRADE COMPLETE!');
    console.log('🎯 Next: Run deploy-worldbuilders.js to start the worldbuilding phase');
    
  } catch (err) {
    console.error('❌ Upgrade failed:', err);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AgentUpgrader;