#!/usr/bin/env node
/**
 * Deploy World Builder System for ClawCraft
 * - Switch existing agents to creative mode for worldbuilding
 * - Deploy 10-12 specialized worldbuilder agents
 * - Set up marketplace system
 * - Create enhanced intelligent agents
 */

const WorldBuilderBrain = require('../agents/WorldBuilderBrain');
const EnhancedAgentBrain = require('../agents/EnhancedAgentBrain');
const ClawCraftMarketplace = require('../core/marketplace');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class WorldBuilderDeployment {
  constructor() {
    this.worldBuilders = [];
    this.enhancedAgents = [];
    this.marketplace = new ClawCraftMarketplace();
    this.eventEmitter = new EventEmitter();
    this.serverHost = process.env.MC_SERVER_HOST || '89.167.28.237';
    this.serverPort = process.env.MC_SERVER_PORT || 25565;
    this.buildingPhase = 'worldbuilding'; // 'worldbuilding' -> 'enhanced_play'
    this.deploymentLog = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    this.deploymentLog.push(logMessage);
  }

  async deployWorldBuildingAgents() {
    this.log('🏗️  DEPLOYING WORLDBUILDING AGENTS...');

    const worldBuilderRoles = [
      {
        name: 'Merchant_Maya',
        role: 'merchant',
        buildingProject: 'Grand Central Marketplace',
        personality: 'A shrewd trader who builds elaborate market stalls and sets up complex trading systems. Loves negotiating and creating economic hubs.'
      },
      {
        name: 'Architect_Atlas',
        role: 'architect', 
        buildingProject: 'Central Plaza & Administrative District',
        personality: 'A visionary builder focused on grand designs and city planning. Creates impressive landmarks and public spaces.'
      },
      {
        name: 'Lorekeeper_Luna',
        role: 'lorekeeper',
        buildingProject: 'Ancient Library & Archive',
        personality: 'A mystical scholar who creates libraries, leaves cryptic messages, and builds repositories of world knowledge.'
      },
      {
        name: 'Innkeeper_Ivan',
        role: 'innkeeper',
        buildingProject: 'Traveler\'s Rest Inn',
        personality: 'A welcoming host who builds cozy inns, rest areas, and social gathering spaces for weary adventurers.'
      },
      {
        name: 'Blacksmith_Blaze',
        role: 'blacksmith', 
        buildingProject: 'Master Forge & Smithy',
        personality: 'A master craftsman who builds forges, weapon shops, and creates displays of fine metalwork and tools.'
      },
      {
        name: 'Farmer_Flora',
        role: 'farmer',
        buildingProject: 'Agricultural District & Markets',
        personality: 'A patient cultivator who creates farms, animal pens, food markets, and sustainable living areas.'
      },
      {
        name: 'Miner_Magnus',
        role: 'miner',
        buildingProject: 'Mining Outpost & Ore Exchange',
        personality: 'A hardy underground worker who creates mining facilities, ore processing centers, and resource depots.'
      },
      {
        name: 'Guardian_Grace',
        role: 'guardian',
        buildingProject: 'Watchtower & Defense Network',
        personality: 'A vigilant protector who builds defensive structures, guard towers, and security checkpoints.'
      },
      {
        name: 'Mystic_Merlin',
        role: 'mystic',
        buildingProject: 'Enchanted Grove & Magic Academy',
        personality: 'A wise spellcaster who creates mystical areas, potion labs, enchantment facilities, and magical gardens.'
      },
      {
        name: 'Explorer_Echo',
        role: 'explorer',
        buildingProject: 'Adventure Supply Depot',
        personality: 'A seasoned adventurer who creates supply stations, map rooms, and preparation areas for expeditions.'
      },
      {
        name: 'Engineer_Edison',
        role: 'engineer',
        buildingProject: 'Redstone Workshop & Automation Hub',
        personality: 'A technical genius who creates redstone contraptions, automated systems, and technological marvels.'
      },
      {
        name: 'Artist_Aurora',
        role: 'artist',
        buildingProject: 'Art Gallery & Cultural Center',  
        personality: 'A creative soul who builds beautiful structures, art installations, and cultural landmarks.'
      }
    ];

    // Deploy each worldbuilder agent
    for (const config of worldBuilderRoles) {
      try {
        this.log(`Deploying ${config.name} (${config.role})...`);
        
        const agent = new WorldBuilderBrain({
          name: config.name,
          role: config.role,
          buildingProject: config.buildingProject,
          personality: config.personality,
          host: this.serverHost,
          port: this.serverPort
        });

        await agent.connect();
        this.worldBuilders.push(agent);
        
        this.log(`✅ ${config.name} deployed and building ${config.buildingProject}`);
        
        // Stagger deployments to avoid server overload
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (err) {
        this.log(`❌ Failed to deploy ${config.name}: ${err.message}`);
      }
    }

    this.log(`🎉 Deployed ${this.worldBuilders.length}/12 worldbuilder agents!`);
  }

  async setupMarketplaceSystem() {
    this.log('🏪 SETTING UP MARKETPLACE SYSTEM...');

    // Register initial shops based on worldbuilder locations
    const initialShops = [
      {
        name: 'Central Trading Post',
        owner: 'Merchant_Maya',
        location: { x: 100, y: 64, z: 100 },
        type: 'general_store'
      },
      {
        name: 'Blaze\'s Forge',
        owner: 'Blacksmith_Blaze',
        location: { x: 120, y: 64, z: 120 },
        type: 'blacksmith'
      },
      {
        name: 'Flora\'s Food Market',
        owner: 'Farmer_Flora', 
        location: { x: 250, y: 64, z: 150 },
        type: 'food_vendor'
      },
      {
        name: 'Magnus Ore Exchange',
        owner: 'Miner_Magnus',
        location: { x: 80, y: 64, z: 250 },
        type: 'treasure_hunter'
      },
      {
        name: 'Merlin\'s Mystical Emporium',
        owner: 'Mystic_Merlin',
        location: { x: 0, y: 64, z: 300 },
        type: 'magic_shop'
      }
    ];

    for (const shop of initialShops) {
      const shopId = this.marketplace.registerShop(shop);
      this.log(`🏪 Registered shop: ${shop.name} (ID: ${shopId})`);
    }

    // Create marketplace data directory
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.marketplace.saveMarketData();
    this.log('✅ Marketplace system initialized');
  }

  async waitForWorldBuilding(hours = 3) {
    this.log(`⏰ WORLDBUILDING PHASE: ${hours} hours (${this.worldBuilders.length} agents working)`);
    
    const totalMinutes = hours * 60;
    let elapsedMinutes = 0;
    
    const progressInterval = setInterval(() => {
      elapsedMinutes += 5;
      const progress = Math.round((elapsedMinutes / totalMinutes) * 100);
      
      this.log(`🔨 Worldbuilding Progress: ${progress}% (${elapsedMinutes}/${totalMinutes} min)`);
      
      if (elapsedMinutes >= totalMinutes) {
        clearInterval(progressInterval);
        this.completeWorldBuilding();
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    // Monitor agents and provide updates
    const statusInterval = setInterval(() => {
      const activeBuilders = this.worldBuilders.filter(agent => agent.bot && !agent.bot.ended);
      this.log(`📊 Active worldbuilders: ${activeBuilders.length}/${this.worldBuilders.length}`);
      
      if (activeBuilders.length === 0) {
        this.log('⚠️  No active worldbuilders detected!');
        clearInterval(statusInterval);
      }
    }, 15 * 60 * 1000); // Every 15 minutes
  }

  async completeWorldBuilding() {
    this.log('🎯 WORLDBUILDING PHASE COMPLETE!');
    this.buildingPhase = 'enhanced_play';

    // Switch worldbuilders back to survival mode
    for (const agent of this.worldBuilders) {
      if (agent.bot && !agent.bot.ended) {
        agent.bot.chat(`/gamemode survival ${agent.name}`);
        this.log(`🔄 ${agent.name} switched to survival mode`);
      }
    }

    // Start deploying enhanced intelligent agents
    await this.deployEnhancedAgents();
  }

  async deployEnhancedAgents() {
    this.log('🧠 DEPLOYING ENHANCED INTELLIGENT AGENTS...');

    const enhancedConfigs = [
      {
        name: 'Strategist_Sophia',
        personality: 'A brilliant tactical thinker who plans long-term strategies, coordinates team efforts, and adapts to changing situations.',
        specialization: 'strategist',
        faction: 'builders'
      },
      {
        name: 'Hunter_Hawk',
        personality: 'A skilled warrior and monster hunter who protects the settlement and seeks out dangerous creatures.',
        specialization: 'warrior',
        faction: 'guardians'
      },
      {
        name: 'Scholar_Sage',
        personality: 'A curious researcher who experiments with game mechanics, discovers new techniques, and shares knowledge.',
        specialization: 'explorer',
        faction: 'scholars'
      },
      {
        name: 'Trader_Tycoon',
        personality: 'A savvy entrepreneur who maximizes profit, identifies market opportunities, and builds trade networks.',
        specialization: 'trader',
        faction: 'merchants'
      },
      {
        name: 'Builder_Boss',
        personality: 'A master constructor who plans massive projects, manages resources efficiently, and creates architectural wonders.',
        specialization: 'builder',
        faction: 'builders'
      }
    ];

    for (const config of enhancedConfigs) {
      try {
        this.log(`Deploying enhanced agent: ${config.name} (${config.specialization})`);
        
        const agent = new EnhancedAgentBrain({
          name: config.name,
          personality: config.personality,
          specialization: config.specialization,
          faction: config.faction,
          host: this.serverHost,
          port: this.serverPort,
          eventEmitter: this.eventEmitter
        });

        await agent.connect();
        this.enhancedAgents.push(agent);
        
        this.log(`✅ ${config.name} deployed with enhanced intelligence`);
        
        // Stagger deployments
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (err) {
        this.log(`❌ Failed to deploy ${config.name}: ${err.message}`);
      }
    }

    this.log(`🚀 Deployed ${this.enhancedAgents.length} enhanced intelligent agents!`);
  }

  async monitorEconomy() {
    this.log('📈 STARTING ECONOMY MONITORING...');
    
    setInterval(() => {
      const stats = this.marketplace.getMarketStats();
      this.log(`💰 Market Stats: ${stats.totalShops} shops, ${stats.totalTrades} trades, ${stats.activeShops} active`);
      
      if (stats.recentTrades > 0) {
        this.log(`🔥 Recent activity: ${stats.recentTrades} trades in last 24h`);
      }
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  generateWorldSummary() {
    const summary = {
      deployment_time: new Date().toISOString(),
      phase: this.buildingPhase,
      worldbuilders: this.worldBuilders.length,
      enhanced_agents: this.enhancedAgents.length,
      marketplace: this.marketplace.getMarketStats(),
      server: { host: this.serverHost, port: this.serverPort },
      log_entries: this.deploymentLog.length
    };

    const summaryPath = path.join(__dirname, '../data/deployment-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    return summary;
  }

  async gracefulShutdown() {
    this.log('🔄 GRACEFUL SHUTDOWN INITIATED...');
    
    // Disconnect all agents
    for (const agent of [...this.worldBuilders, ...this.enhancedAgents]) {
      if (agent.bot && !agent.bot.ended) {
        agent.disconnect();
      }
    }
    
    // Save final state
    this.marketplace.saveMarketData();
    const summary = this.generateWorldSummary();
    
    this.log(`📊 Final Summary: ${summary.worldbuilders} builders, ${summary.enhanced_agents} enhanced agents`);
    this.log('✅ Shutdown complete');
  }
}

// Main deployment execution
async function main() {
  const deployment = new WorldBuilderDeployment();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\\n🛑 Shutdown signal received...');
    deployment.gracefulShutdown().then(() => process.exit(0));
  });

  try {
    // Phase 1: Deploy worldbuilders
    await deployment.deployWorldBuildingAgents();
    
    // Phase 2: Setup marketplace
    await deployment.setupMarketplaceSystem();
    
    // Phase 3: Monitor economy
    deployment.monitorEconomy();
    
    // Phase 4: Wait for worldbuilding (3 hours)
    await deployment.waitForWorldBuilding(3);
    
    // Phase 5: Enhanced agents will be deployed automatically after worldbuilding
    
    console.log('🎉 ClawCraft worldbuilding deployment complete!');
    console.log('🎮 World builders are creating the foundation for an epic AI civilization!');
    
    // Keep the process running to monitor everything
    setInterval(() => {
      const summary = deployment.generateWorldSummary();
      console.log(`📊 Status: Phase ${summary.phase}, ${summary.worldbuilders} builders, ${summary.enhanced_agents} enhanced`);
    }, 60000); // Status every minute
    
  } catch (err) {
    console.error('❌ Deployment failed:', err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = WorldBuilderDeployment;