/**
 * ClawCraft - Launch all 10 agents with factions, economy, events
 */

require('dotenv').config({ path: '../.env' });
const AgentBrain = require('./AgentBrain');
const personalities = require('./personalities');
const EventEmitter = require('events');
const { FactionManager, FACTIONS } = require('../core/factions');
const { EconomyManager } = require('../core/economy');
const { ContrabandManager } = require('../core/contraband');
const EventManager = require('../core/events');

// Initialize systems
const factionManager = new FactionManager();
const economyManager = new EconomyManager();
const contrabandManager = new ContrabandManager(factionManager);
const gameEvents = new EventEmitter();

// Event manager for server events
const eventManager = new EventManager(factionManager, economyManager, contrabandManager);

// Connect game events to economy
gameEvents.on('block_mined', (data) => {
  console.log(`[EVENT] ${data.agent} mined ${data.block}`);
  economyManager.rewardMining(data.agent, data.block);
  factionManager.addPower(factionManager.getFactionId(data.agent), 1);
});

gameEvents.on('entity_killed', (data) => {
  console.log(`[EVENT] ${data.agent} killed ${data.entity}`);
  if (data.type === 'player') {
    economyManager.rewardKill(data.agent, data.entity, true);
    eventManager.claimBounty(data.agent, data.entity);
  } else {
    economyManager.rewardKill(data.agent, data.entity, false);
  }
  factionManager.addPower(factionManager.getFactionId(data.agent), 5);
});

// Broadcast handler
eventManager.on('broadcast', (message) => {
  agents.forEach(a => {
    if (a.bot) {
      // Agents see broadcasts in their chat history
      a.chatHistory.push({ from: 'SERVER', message, time: Date.now() });
    }
  });
});

const agents = [];

async function launchAgents() {
  console.log('🐾 CLAWCRAFT - Launching agents...');
  console.log('Model: claude-3-5-haiku | Loop: 2.5s | Combat: Reactive\n');
  
  // Start event system
  eventManager.start();
  
  const agentConfigs = Object.values(personalities);
  
  console.log(`Launching ${agentConfigs.length} agents across 3 factions...`);
  
  for (const config of agentConfigs) {
    const factionId = config.faction;
    const factionData = FACTIONS[factionId];
    
    const agent = new AgentBrain({
      ...config,
      factionData,
      host: process.env.MC_HOST || 'localhost',
      port: parseInt(process.env.MC_PORT) || 25565,
      loopInterval: 1000, // FAST 2.5 second loop
      eventEmitter: gameEvents,
      economyManager,
      contrabandManager,
      factionManager
    });

    try {
      await agent.connect();
      agents.push(agent);
      const prefix = factionData ? factionData.color : '§7';
      console.log(`✓ ${prefix}${config.name}§r [${factionId}] connected`);
      
      // Stagger connections
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`✗ ${config.name} failed:`, err.message);
    }
  }

  console.log(`\n🎮 ${agents.length}/${agentConfigs.length} agents running`);
  console.log('Factions: IRON_CLAW (red) | DEEP_ROOT (green) | VOID_WALKERS (blue)');
  console.log('Press Ctrl+C to stop\n');
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down ClawCraft...');
  eventManager.stop();
  agents.forEach(a => a.disconnect());
  economyManager.save();
  setTimeout(() => process.exit(0), 1000);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

launchAgents();
