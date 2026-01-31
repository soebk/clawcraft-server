/**
 * Launch Fixed Agents - Testing the corrected agent implementation
 */

const FixedAgentBrain = require('./FixedAgentBrain');

// Enhanced personalities with faction affiliations
const personalities = {
  'Alpha_Warrior': {
    name: 'Alpha_Warrior',
    personality: `You are Alpha, a brave WARRIOR who loves combat and exploration. 
- You seek out dangerous areas and fight hostile mobs
- You're protective of allies but aggressive to enemies
- You build defensive structures and weapon caches
- Your faction: WARRIORS - strength through combat
- Catchphrase: "Victory or death!"`,
    faction: 'warriors',
    specialization: 'combat'
  },

  'Beta_Merchant': {
    name: 'Beta_Merchant',
    personality: `You are Beta, a cunning MERCHANT who loves trade and profit.
- You focus on gathering valuable resources and trading
- You build shops, storehouses, and trading posts  
- You're always calculating costs and benefits
- Your faction: TRADERS - wealth through commerce
- Catchphrase: "Everything has a price!"`,
    faction: 'traders',
    specialization: 'economy'
  },

  'Gamma_Builder': {
    name: 'Gamma_Builder',
    personality: `You are Gamma, a creative ARCHITECT who loves grand construction.
- You design and build impressive structures
- You gather materials for ambitious building projects
- You care deeply about aesthetics and functionality
- Your faction: BUILDERS - power through creation
- Catchphrase: "Let's build something amazing!"`,
    faction: 'builders', 
    specialization: 'construction'
  },

  'Delta_Scout': {
    name: 'Delta_Scout',
    personality: `You are Delta, a curious EXPLORER who loves discovery.
- You venture into unknown areas and map new territory
- You search for rare resources and hidden treasures
- You're fast, sneaky, and good at avoiding danger
- Your faction: SCOUTS - knowledge through exploration
- Catchphrase: "What's over that hill?"`,
    faction: 'scouts',
    specialization: 'exploration'
  },

  'Epsilon_Mystic': {
    name: 'Epsilon_Mystic',
    personality: `You are Epsilon, a wise MYSTIC who seeks ancient knowledge.
- You focus on enchanting, brewing, and magical arts
- You build libraries, laboratories, and mystical structures
- You're thoughtful, mysterious, and philosophical
- Your faction: MYSTICS - wisdom through understanding
- Catchphrase: "The arcane secrets await..."`,
    faction: 'mystics',
    specialization: 'magic'
  }
};

// Server configuration
const SERVER_CONFIG = {
  host: '89.167.28.237',
  port: 25565,
  loopInterval: 4000 // 4 second decision cycles
};

async function launchAllAgents() {
  console.log('🎮 ClawCraft Fixed Agents Starting...');
  console.log('====================================\n');

  const agents = [];

  // Create and connect each agent
  for (const [name, config] of Object.entries(personalities)) {
    try {
      console.log(`🤖 Starting ${name}...`);
      
      const agent = new FixedAgentBrain({
        ...config,
        ...SERVER_CONFIG
      });

      await agent.connect();
      agents.push(agent);
      
      console.log(`✅ ${name} connected successfully!`);
      
      // Stagger connections
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to start ${name}:`, error.message);
    }
  }

  console.log(`\n🎉 ${agents.length} agents connected and active!`);
  console.log('\n📊 Agent Status:');
  agents.forEach((agent, i) => {
    const personality = Object.values(personalities)[i];
    console.log(`  ${personality.name} (${personality.faction}) - ${personality.specialization}`);
  });

  console.log('\n🎮 Server: 89.167.28.237:25565');
  console.log('📝 Watch the logs for agent activities and interactions');
  console.log('💬 Agents will chat, build, trade, and fight based on their personalities');
  console.log('\n⏰ Decision cycle: 4 seconds');
  console.log('🧠 AI Model: Claude 3.5 Sonnet (Anthropic)');

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down agents...');
    agents.forEach(agent => agent.disconnect());
    process.exit(0);
  });

  return agents;
}

// Auto-start if running directly
if (require.main === module) {
  launchAllAgents().catch(error => {
    console.error('Failed to launch agents:', error);
    process.exit(1);
  });
}

module.exports = { launchAllAgents, personalities, SERVER_CONFIG };