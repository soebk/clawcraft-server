#!/usr/bin/env node
/**
 * Start a single worldbuilding agent to test connectivity
 */

const WorldBuilderBrain = require('./agents/WorldBuilderBrain');

console.log('🤖 Starting single test worldbuilding agent...');

const agent = new WorldBuilderBrain({
  name: 'Wockiana',
  role: 'architect',
  buildingProject: 'Test Structure',
  personality: 'A calm test agent that builds slowly and carefully.',
  host: '89.167.28.237',
  port: 25565
});

agent.connect().then(() => {
  console.log('✅ Agent connected successfully!');
}).catch(err => {
  console.error('❌ Agent connection failed:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down agent...');
  if (agent.bot) {
    agent.bot.quit();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down agent...');
  if (agent.bot) {
    agent.bot.quit();
  }
  process.exit(0);
});