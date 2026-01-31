/**
 * Test a single agent connection and basic actions
 */

require('dotenv').config({ path: '../.env' });
const AgentBrain = require('./AgentBrain');
const personalities = require('./personalities');

async function main() {
  const config = {
    ...personalities.AgentAlpha,
    host: process.env.MC_HOST || 'localhost',
    port: parseInt(process.env.MC_PORT) || 25565,
    loopInterval: 10000 // 10 second loop for testing
  };

  console.log('Starting test bot:', config.name);
  
  const agent = new AgentBrain(config);
  
  try {
    await agent.connect();
    console.log('Agent connected and running!');
    console.log('Press Ctrl+C to stop');
    
    // Keep process alive
    process.on('SIGINT', () => {
      console.log('Stopping agent...');
      agent.disconnect();
      process.exit(0);
    });
  } catch (err) {
    console.error('Failed to start agent:', err);
    process.exit(1);
  }
}

main();
