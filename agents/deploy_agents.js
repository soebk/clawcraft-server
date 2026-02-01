#!/usr/bin/env node
/**
 * ClawCraft Agent Deployment
 * Simple script to get smart agents playing
 */

const { SmartMinecraftAgent } = require('./smart_agent.js');

// Simple server connection class
class MinecraftServer {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.connected = false;
  }

  async connect() {
    console.log(`Connecting to Minecraft server at ${this.host}:${this.port}`);
    // In real implementation: use RCON or Mineflayer
    this.connected = true;
    return true;
  }

  async execute(command) {
    if (!this.connected) {
      console.log('Not connected to server');
      return false;
    }
    
    console.log(`[SERVER] ${command}`);
    // In real implementation: send RCON command
    return true;
  }
}

// Agent names that sound cool
const AGENT_NAMES = [
  'Agent_Alpha', 'Agent_Beta', 'Agent_Gamma', 'Agent_Delta',
  'Agent_Echo', 'Agent_Foxtrot', 'Agent_Golf', 'Agent_Hotel',
  'BlockBreaker', 'MobHunter', 'IronMiner', 'TreeChopper',
  'CaveExplorer', 'NightFighter', 'FarmBuilder', 'ResourceGatherer',
  'SurvivalExpert', 'CombatSpecialist', 'ToolCrafter', 'BaseBuilder'
];

class AgentManager {
  constructor(server) {
    this.server = server;
    this.agents = new Map();
    this.running = false;
  }

  async deployAgents(count = 10) {
    console.log(`🚀 Deploying ${count} smart agents to ClawCraft server`);
    
    for (let i = 0; i < count; i++) {
      const name = AGENT_NAMES[i] || `Agent_${i+1}`;
      const agent = new SmartMinecraftAgent(name, this.server);
      
      this.agents.set(name, agent);
      
      // Give starter kit when agent joins
      await agent.starterKit.onPlayerJoin(name);
      
      console.log(`✅ Agent ${name} deployed with personality: ${agent.personality.primary_trait}`);
    }
    
    console.log(`🎮 ${this.agents.size} agents ready to play!`);
  }

  async startGameLoop() {
    console.log('🔄 Starting agent game loop...');
    this.running = true;
    
    while (this.running) {
      // Run all agents concurrently
      const promises = Array.from(this.agents.values()).map(agent => 
        agent.tick().catch(err => 
          console.error(`Agent ${agent.name} error:`, err)
        )
      );
      
      await Promise.all(promises);
      
      // Wait 2 seconds between ticks (as per clawcraft.xyz)
      await this.sleep(2000);
    }
  }

  stop() {
    console.log('🛑 Stopping agents...');
    this.running = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      total_agents: this.agents.size,
      agent_personalities: Array.from(this.agents.values()).reduce((acc, agent) => {
        acc[agent.personality.primary_trait] = (acc[agent.personality.primary_trait] || 0) + 1;
        return acc;
      }, {}),
      uptime: 'Active'
    };
  }
}

// Main deployment function
async function main() {
  try {
    console.log('🎮 ClawCraft Smart Agents Starting...');
    console.log('📡 Server: 89.167.28.237:25565');
    console.log('🌐 Website: https://clawcraft.xyz');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Connect to server
    const server = new MinecraftServer('89.167.28.237', 25565);
    await server.connect();
    
    // Create agent manager
    const manager = new AgentManager(server);
    
    // Deploy agents (matching clawcraft.xyz \"24 agents online now\")
    await manager.deployAgents(24);
    
    // Show stats
    console.log('📊 Agent Stats:', JSON.stringify(manager.getStats(), null, 2));
    
    // Start game loop
    await manager.startGameLoop();
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\\n👋 Shutting down ClawCraft agents...');
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { AgentManager, MinecraftServer };