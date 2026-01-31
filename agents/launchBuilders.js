/**
 * Launch 10 world builder agents
 */

require('dotenv').config({ path: '../.env' });
const BuilderBrain = require('./BuilderBrain');

const builders = [
  {
    name: 'MarketMaster',
    role: 'marketplace_builder',
    personality: 'Expert at building trading posts, shops, and economic hubs. Loves creating bustling market squares.'
  },
  {
    name: 'LoreKeeper',
    role: 'lore_writer',
    personality: 'Ancient scholar who leaves cryptic messages, riddles, and hidden lore throughout the world.'
  },
  {
    name: 'TavernBuilder',
    role: 'tavern_builder',
    personality: 'Jolly innkeeper who builds cozy taverns, inns, and rest stops for weary travelers.'
  },
  {
    name: 'ShrineWarden',
    role: 'shrine_builder',
    personality: 'Mystical builder who creates sacred shrines, altars, and places of power with hidden treasures.'
  },
  {
    name: 'TowerMage',
    role: 'tower_builder',
    personality: 'Wizard architect who constructs tall towers, observatories, and magical structures.'
  },
  {
    name: 'RuinMaker',
    role: 'ruins_builder',
    personality: 'Creates ancient ruins, crumbling dungeons, and mysterious abandoned places full of secrets.'
  },
  {
    name: 'FarmSteward',
    role: 'farm_builder',
    personality: 'Agricultural expert who builds functional farms, windmills, and food production areas.'
  },
  {
    name: 'ForgeSmith',
    role: 'blacksmith_builder',
    personality: 'Master smith who builds forges, armories, and weapon shops with working furnaces.'
  },
  {
    name: 'LibrarianSage',
    role: 'library_builder',
    personality: 'Keeper of knowledge who builds grand libraries, archives, and enchanting chambers.'
  },
  {
    name: 'PathFinder',
    role: 'road_builder',
    personality: 'Explorer who builds roads, bridges, waypoints, and connects all the landmarks together.'
  }
];

const agents = [];

async function launchBuilders() {
  console.log('🏗️ CLAWCRAFT WORLD BUILDERS - Launching...');
  console.log('Mode: Creative | Focus: World Building\n');

  for (const config of builders) {
    try {
      const agent = new BuilderBrain({
        ...config,
        host: process.env.MC_HOST || 'localhost',
        port: parseInt(process.env.MC_PORT) || 25565,
        loopInterval: 4000 + Math.random() * 2000 // 4-6 seconds
      });

      await agent.connect();
      agents.push(agent);
      console.log(`✓ ${config.name} (${config.role}) connected`);

      // Stagger connections
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`✗ ${config.name} failed:`, err.message);
    }
  }

  console.log(`\n🏗️ ${agents.length} builders active!`);
  console.log('They will build: marketplaces, taverns, shrines, towers, farms, libraries');
  console.log('Hidden loot and lore will be scattered throughout!\n');
}

launchBuilders().catch(console.error);

process.on('SIGINT', () => {
  console.log('\nShutting down builders...');
  agents.forEach(a => a.disconnect());
  process.exit(0);
});
