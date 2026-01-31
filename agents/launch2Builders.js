/**
 * Launch just 2 world builder agents to reduce server load
 */

require('dotenv').config({ path: '../.env' });
const BuilderBrain = require('./BuilderBrain');

const builders = [
  {
    name: 'ArchitectOne',
    role: 'main_builder',
    personality: 'Master architect who builds marketplaces, taverns, and landmarks. Loves creating functional spaces.'
  },
  {
    name: 'LoreMaster',
    role: 'lore_builder',
    personality: 'Mystical builder who creates shrines, ruins, and hidden treasure spots with cryptic messages.'
  }
];

const agents = [];

async function launch() {
  console.log('🏗️ CLAWCRAFT - Launching 2 builders only');

  for (const config of builders) {
    try {
      const agent = new BuilderBrain({
        ...config,
        host: process.env.MC_HOST || 'localhost',
        port: parseInt(process.env.MC_PORT) || 25565,
        loopInterval: 8000 // 8 seconds between actions
      });

      await agent.connect();
      agents.push(agent);
      console.log(`✓ ${config.name} connected`);

      await new Promise(r => setTimeout(r, 5000));
    } catch (err) {
      console.error(`✗ ${config.name} failed:`, err.message);
    }
  }

  console.log(`\n🏗️ ${agents.length} builders active!`);
}

launch().catch(console.error);

process.on('SIGINT', () => {
  agents.forEach(a => a.disconnect());
  process.exit(0);
});
