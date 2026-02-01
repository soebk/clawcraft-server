#!/usr/bin/env node
/**
 * ClawCraft Agent Deployment with EIP-8004 Integration
 *
 * Only agents registered on-chain can play.
 * All gameplay actions contribute to on-chain reputation.
 */

const { SmartMinecraftAgent } = require('./smart_agent.js');
const {
  EIP8004AgentRegistry,
  GameplayReputationTracker,
  EIP8004AgentGate
} = require('./eip8004-agent-registry.js');

// Simple server connection class
class MinecraftServer {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.connected = false;
  }

  async connect() {
    console.log(`Connecting to Minecraft server at ${this.host}:${this.port}`);
    this.connected = true;
    return true;
  }

  async execute(command) {
    if (!this.connected) {
      console.log('Not connected to server');
      return false;
    }
    console.log(`[SERVER] ${command}`);
    return true;
  }
}

// Agent names
const AGENT_NAMES = [
  'Agent_Alpha', 'Agent_Beta', 'Agent_Gamma', 'Agent_Delta',
  'Agent_Echo', 'Agent_Foxtrot', 'Agent_Golf', 'Agent_Hotel',
  'BlockBreaker', 'MobHunter', 'IronMiner', 'TreeChopper',
  'CaveExplorer', 'NightFighter', 'FarmBuilder', 'ResourceGatherer',
  'SurvivalExpert', 'CombatSpecialist', 'ToolCrafter', 'BaseBuilder'
];

class EIP8004AgentManager {
  constructor(server, eip8004Config) {
    this.server = server;
    this.agents = new Map();
    this.running = false;

    // Initialize EIP-8004 components
    this.registry = new EIP8004AgentRegistry(eip8004Config);
    this.reputationTracker = new GameplayReputationTracker(this.registry);
    this.gate = new EIP8004AgentGate(this.registry);
  }

  async deployAgents(count = 10) {
    console.log(`\n[EIP-8004] Deploying ${count} on-chain registered agents`);
    console.log(`[EIP-8004] Chain: ${this.registry.config.chainId}`);
    console.log(`[EIP-8004] Identity Registry: ${this.registry.config.identityRegistry}`);
    console.log(`[EIP-8004] Reputation Registry: ${this.registry.config.reputationRegistry}\n`);

    for (let i = 0; i < count; i++) {
      const name = AGENT_NAMES[i] || `Agent_${i + 1}`;

      try {
        // Create agent instance
        const agent = new SmartMinecraftAgent(name, this.server);

        // Register on-chain via EIP-8004
        const agentId = await this.gate.registerAndJoin(name, agent.personality);

        if (agentId) {
          // Wrap agent with reputation tracking
          const trackedAgent = this.wrapWithReputationTracking(agent);
          this.agents.set(name, trackedAgent);

          // Give starter kit
          await agent.starterKit.onPlayerJoin(name);

          console.log(`[OK] ${name} registered (ID: ${agentId}) - ${agent.personality.primary_trait}`);
        } else {
          console.log(`[SKIP] ${name} - registration failed`);
        }

      } catch (error) {
        console.error(`[ERROR] ${name}: ${error.message}`);
      }

      // Small delay to avoid rate limiting
      await this.sleep(500);
    }

    console.log(`\n[EIP-8004] ${this.agents.size} agents registered and ready`);
  }

  /**
   * Wrap agent to track actions for reputation
   */
  wrapWithReputationTracking(agent) {
    const tracker = this.reputationTracker;
    const originalTick = agent.tick.bind(agent);

    agent.tick = async function () {
      const result = await originalTick();

      // Track actions based on what happened
      if (agent.lastAction) {
        await tracker.trackAction(agent.name, agent.lastAction, {
          difficulty: 1,
          efficiency: 1
        });
      }

      return result;
    };

    // Track specific gameplay events
    const originalHuntMobs = agent.huntMobs?.bind(agent);
    if (originalHuntMobs) {
      agent.huntMobs = async function () {
        const result = await originalHuntMobs();
        await tracker.trackAction(agent.name, 'kill_zombie');
        return result;
      };
    }

    const originalMineIron = agent.mineIron?.bind(agent);
    if (originalMineIron) {
      agent.mineIron = async function () {
        const result = await originalMineIron();
        await tracker.trackAction(agent.name, 'mine_iron');
        return result;
      };
    }

    const originalExplore = agent.explore?.bind(agent);
    if (originalExplore) {
      agent.explore = async function () {
        const result = await originalExplore();
        await tracker.trackAction(agent.name, 'discover_biome', { difficulty: 0.5 });
        return result;
      };
    }

    return agent;
  }

  async startGameLoop() {
    console.log('\n[GAMELOOP] Starting agent game loop...');
    this.running = true;

    let tickCount = 0;

    while (this.running) {
      tickCount++;

      // Run all agents concurrently
      const promises = Array.from(this.agents.values()).map(agent =>
        agent.tick().catch(err =>
          console.error(`Agent ${agent.name} error:`, err.message)
        )
      );

      await Promise.all(promises);

      // Periodically log reputation leaderboard
      if (tickCount % 100 === 0) {
        await this.logLeaderboard();
      }

      // Wait between ticks
      await this.sleep(2000);
    }
  }

  async logLeaderboard() {
    console.log('\n[LEADERBOARD] Current reputation standings:');

    try {
      const leaderboard = await this.registry.getLeaderboard();
      leaderboard.slice(0, 5).forEach((agent, i) => {
        console.log(`  ${i + 1}. ${agent.agentName}: ${agent.totalValue.toFixed(2)} (${agent.feedbackCount} actions)`);
      });
    } catch (error) {
      console.error('[LEADERBOARD] Failed to fetch:', error.message);
    }

    console.log('');
  }

  stop() {
    console.log('[STOP] Stopping agents...');
    this.running = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      total_agents: this.agents.size,
      registered_agents: this.registry.getAllAgents(),
      chain_id: this.registry.config.chainId
    };
  }
}

// Main deployment function
async function main() {
  try {
    console.log('========================================');
    console.log('  ClawCraft EIP-8004 Agent Deployment');
    console.log('========================================');
    console.log('Server: 89.167.28.237:25565');
    console.log('Website: https://clawcraft.xyz');
    console.log('');
    console.log('EIP-8004: Trustless Agent Registry');
    console.log('- On-chain agent identity (ERC-721)');
    console.log('- Reputation tracking per action');
    console.log('- Only registered agents can play');
    console.log('========================================\n');

    // EIP-8004 configuration
    // In production, use mainnet or L2 with real contract addresses
    const eip8004Config = {
      rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org',
      chainId: parseInt(process.env.CHAIN_ID) || 84532,
      identityRegistry: process.env.IDENTITY_REGISTRY || '0x0000000000000000000000000000000000000000',
      reputationRegistry: process.env.REPUTATION_REGISTRY || '0x0000000000000000000000000000000000000000',
      validationRegistry: process.env.VALIDATION_REGISTRY || '0x0000000000000000000000000000000000000000',
      operatorPrivateKey: process.env.OPERATOR_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001'
    };

    // Validate config
    if (eip8004Config.identityRegistry === '0x0000000000000000000000000000000000000000') {
      console.log('[WARN] EIP-8004 registries not configured');
      console.log('[WARN] Set IDENTITY_REGISTRY, REPUTATION_REGISTRY, VALIDATION_REGISTRY env vars');
      console.log('[WARN] Running in simulation mode\n');
    }

    // Connect to server
    const server = new MinecraftServer('89.167.28.237', 25565);
    await server.connect();

    // Create EIP-8004 enabled manager
    const manager = new EIP8004AgentManager(server, eip8004Config);

    // Deploy registered agents
    await manager.deployAgents(10);

    // Show stats
    console.log('\n[STATS]', JSON.stringify(manager.getStats(), null, 2));

    // Start game loop
    await manager.startGameLoop();

  } catch (error) {
    console.error('[FATAL] Deployment failed:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] Stopping ClawCraft agents...');
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { EIP8004AgentManager, MinecraftServer };
