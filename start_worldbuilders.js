#!/usr/bin/env node
/**
 * Start Worldbuilding Agents - PROPER VERSION
 * - No spamming
 * - Verified connections
 * - Real status reporting
 */

const WorldBuilderBrain = require('./agents/WorldBuilderBrain');
const fs = require('fs');

class ProperWorldBuilderDeployment {
  constructor() {
    this.agents = [];
    this.maxAgents = 4; // Start small
    this.serverHost = '89.167.28.237';
    this.serverPort = 25565;
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Write to verified logs
    const logEntry = logMessage + '\n';
    fs.appendFileSync('/root/projects/clawcraft/logs/verified-worldbuilding.log', logEntry);
  }

  async deployAgent(config) {
    try {
      this.log(`🤖 Deploying ${config.name} (${config.role})...`);
      
      const agent = new WorldBuilderBrain({
        name: config.name,
        role: config.role,
        buildingProject: config.buildingProject,
        personality: config.personality,
        host: this.serverHost,
        port: this.serverPort
      });

      await agent.connect();
      this.agents.push(agent);
      
      this.log(`✅ ${config.name} connected and building ${config.buildingProject}`);
      return true;
      
    } catch (err) {
      this.log(`❌ Failed to deploy ${config.name}: ${err.message}`);
      return false;
    }
  }

  async start() {
    this.log('🚀 Starting VERIFIED worldbuilding system...');

    const agentConfigs = [
      {
        name: 'Builder_Bob',
        role: 'architect',
        buildingProject: 'Town Square',
        personality: 'A careful builder who constructs slowly and methodically.'
      },
      {
        name: 'Merchant_Mary',
        role: 'merchant',
        buildingProject: 'Market Stalls',
        personality: 'A trader who builds simple shops and trading posts.'
      },
      {
        name: 'Engineer_Ed',
        role: 'engineer',
        buildingProject: 'Workshop',
        personality: 'A technical builder focused on functional structures.'
      },
      {
        name: 'Artist_Anna',
        role: 'artist',
        buildingProject: 'Statue Garden',
        personality: 'A creative agent who builds art and decorative structures.'
      }
    ];

    let successful = 0;
    for (const config of agentConfigs) {
      if (await this.deployAgent(config)) {
        successful++;
      }
      
      // Wait between deployments to avoid server overload
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    this.log(`🎉 Successfully deployed ${successful}/${agentConfigs.length} worldbuilding agents!`);
    this.log(`📊 REAL STATUS: ${successful} agents active and building`);

    // Set up periodic status reporting
    this.setupStatusReporting();
  }

  setupStatusReporting() {
    setInterval(() => {
      const activeCount = this.agents.filter(agent => agent.bot && !agent.bot.ended).length;
      this.log(`📊 VERIFIED STATUS: ${activeCount}/${this.agents.length} agents active`);
    }, 60000); // Every minute
  }

  shutdown() {
    this.log('🛑 Shutting down worldbuilding system...');
    for (const agent of this.agents) {
      if (agent.bot) {
        agent.bot.quit();
      }
    }
    process.exit(0);
  }
}

const deployment = new ProperWorldBuilderDeployment();

// Graceful shutdown
process.on('SIGTERM', () => deployment.shutdown());
process.on('SIGINT', () => deployment.shutdown());

deployment.start().catch(err => {
  console.error('❌ Deployment failed:', err);
  process.exit(1);
});