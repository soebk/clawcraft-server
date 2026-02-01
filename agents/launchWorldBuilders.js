/**
 * Launch World Builder agents with rate limiting
 * Fixed version that won't get kicked for spam
 */

require('dotenv').config({ path: '../.env' });
const WorldBuilderBrain = require('./WorldBuilderBrain');

const builders = [
  { name: 'Merchant_Maya', role: 'merchant' },
  { name: 'Architect_Atlas', role: 'architect' },
  { name: 'Lorekeeper_Luna', role: 'lorekeeper' },
  { name: 'Innkeeper_Isaac', role: 'innkeeper' }
];

const agents = [];

async function launch() {
  console.log('🏗️ CLAWCRAFT WORLD BUILDERS - Rate-Limited Version');
  console.log('Starting 4 builders with safe command delays...\\n');

  for (const config of builders) {
    try {
      const agent = new WorldBuilderBrain({
        ...config,
        host: process.env.MC_HOST || 'localhost',
        port: parseInt(process.env.MC_PORT) || 25565
      });

      await agent.connect();
      agents.push(agent);
      console.log(`✓ ${config.name} (${config.role}) connected and building`);

      // Stagger connections by 8 seconds to avoid spam
      await new Promise(r => setTimeout(r, 8000));
    } catch (err) {
      console.error(`✗ ${config.name} failed:`, err.message);
    }
  }

  console.log(`\\n🏗️ ${agents.length} world builders active\!`);
  console.log('Building: Marketplace, Plaza, Library, Inn');
}

launch().catch(console.error);

process.on('SIGINT', () => {
  console.log('\\nShutting down builders...');
  agents.forEach(a => a.disconnect());
  process.exit(0);
});
