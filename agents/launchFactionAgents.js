/**
 * Launch Faction-Aware Agents - Enhanced agents with political intelligence
 */

const FactionAwareAgent = require('./FactionAwareAgent');

// Enhanced personalities with detailed faction context
const personalities = {
  'Alpha_Warrior': {
    name: 'Alpha_Warrior',
    personality: `You are Alpha, a fierce WARRIOR of the Warriors faction ⚔️
- You live for combat, honor, and military dominance
- You build fortifications, weapon caches, and training grounds
- You're loyal to Warriors, hostile to Scouts, neutral to others initially
- You patrol territories, defend against threats, and train for battle
- Your motto: "Victory through strength!"
- You respect courage and despise cowardice
- You seek to expand Warrior influence through conquest`,
    faction: 'warriors',
    specialization: 'combat',
    aggressionBonus: 0.3
  },

  'Beta_Merchant': {
    name: 'Beta_Merchant',
    personality: `You are Beta, a cunning TRADER of the Traders faction 💰
- You're obsessed with profit, trade routes, and economic dominance
- You build marketplaces, shops, storehouses, and trading posts
- You're allied with Builders, friendly to all initially for business
- You negotiate deals, gather resources, and manipulate markets
- Your motto: "Every interaction is a business opportunity!"
- You value wealth over violence but aren't afraid to defend your interests
- You seek economic supremacy through smart trading and alliances`,
    faction: 'traders',
    specialization: 'economy',
    tradeBonus: 0.4
  },

  'Gamma_Builder': {
    name: 'Gamma_Builder',
    personality: `You are Gamma, a creative ARCHITECT of the Builders faction 🏗️
- You're passionate about construction, infrastructure, and grand projects
- You build impressive structures, roads, bridges, and public works
- You're allied with Traders, cooperative with most factions
- You gather materials, plan constructions, and create lasting monuments
- Your motto: "We shape the world with our hands!"
- You prefer collaboration over conflict but defend your creations fiercely
- You seek to leave a permanent mark on the world through construction`,
    faction: 'builders',
    specialization: 'construction',
    buildingBonus: 0.5
  },

  'Delta_Scout': {
    name: 'Delta_Scout',
    personality: `You are Delta, a swift EXPLORER of the Scouts faction 🏹
- You're driven by wanderlust, discovery, and territorial expansion
- You explore unknown lands, establish outposts, and gather intelligence
- You're allied with Mystics, rival with Warriors, cautious with others
- You map territories, find resources, and maintain mobility
- Your motto: "Knowledge is power, territory is freedom!"
- You're elusive, independent, and value information above all
- You seek to control borders and expand Scout influence through exploration`,
    faction: 'scouts',
    specialization: 'exploration',
    speedBonus: 0.3
  },

  'Epsilon_Mystic': {
    name: 'Epsilon_Mystic',
    personality: `You are Epsilon, a wise SCHOLAR of the Mystics faction 🔮
- You seek ancient knowledge, magical secrets, and mystical understanding
- You build libraries, laboratories, and enchanting chambers
- You're allied with Scouts (information sharing), neutral with others
- You research, enchant, brew potions, and study the arcane
- Your motto: "Understanding transcends all worldly concerns!"
- You're philosophical, patient, and value wisdom over material gain
- You seek to unlock the deepest mysteries of the world through study`,
    faction: 'mystics',
    specialization: 'magic',
    wisdomBonus: 0.4
  }
};

// Server configuration
const SERVER_CONFIG = {
  host: '89.167.28.237',
  port: 25565,
  loopInterval: 5000 // 5 second decision cycles for more deliberate actions
};

async function launchFactionAgents() {
  console.log('🏛️ ClawCraft Faction System Initializing...');
  console.log('==========================================\n');
  
  console.log('🎭 FACTION OVERVIEW:');
  console.log('⚔️  WARRIORS - Strength through combat');
  console.log('💰 TRADERS  - Wealth through commerce');
  console.log('🏗️  BUILDERS - Power through creation');
  console.log('🏹 SCOUTS   - Knowledge through exploration');
  console.log('🔮 MYSTICS  - Wisdom through understanding\n');

  const agents = [];

  // Create and connect each faction agent
  for (const [name, config] of Object.entries(personalities)) {
    try {
      console.log(`🤖 Starting ${name} (${config.faction} faction)...`);
      
      const agent = new FactionAwareAgent({
        ...config,
        ...SERVER_CONFIG
      });

      await agent.connect();
      agents.push(agent);
      
      console.log(`✅ ${name} connected successfully!`);
      console.log(`   Faction: ${config.faction}`);
      console.log(`   Specialization: ${config.specialization}`);
      console.log(`   Personality: ${config.personality.split('\n')[0]}`);
      console.log('');
      
      // Stagger connections to avoid overwhelming server
      await new Promise(r => setTimeout(r, 3000));
      
    } catch (error) {
      console.error(`❌ Failed to start ${name}:`, error.message);
    }
  }

  console.log(`\n🎉 ${agents.length} faction agents connected and active!`);
  console.log('\n📊 Political Landscape:');
  console.log('  🤝 Initial Alliances:');
  console.log('     • Traders ↔ Builders (Economic cooperation)');
  console.log('     • Scouts ↔ Mystics (Information sharing)');
  console.log('  ⚔️  Initial Rivalries:');
  console.log('     • Warriors ↔ Scouts (Territorial disputes)');
  console.log('  ⚖️  Neutral Relations:');
  console.log('     • All other combinations start neutral');

  console.log(`\n🎮 Server: ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
  console.log('🧠 AI Model: GPT-4o-mini (OpenAI)');
  console.log('⏰ Decision Cycle: 5 seconds');
  console.log('🏛️ Faction System: Active');
  
  console.log('\n📜 Expected Behaviors:');
  console.log('  • Agents will prioritize faction goals');
  console.log('  • Relationships will evolve based on interactions');
  console.log('  • Conflicts may emerge over resources/territory');
  console.log('  • Alliances may form or break dynamically');
  console.log('  • Faction-specific construction and activities');
  console.log('  • Rich political roleplay and diplomacy');

  console.log('\n🎬 Entertainment Features:');
  console.log('  • Dynamic faction politics and drama');
  console.log('  • Territorial expansion and conflicts');
  console.log('  • Trade negotiations and economic warfare');
  console.log('  • Alliance formations and betrayals');
  console.log('  • Faction-themed construction projects');
  console.log('  • Rich character interactions and roleplay');

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down faction agents...');
    agents.forEach(agent => agent.disconnect());
    console.log('💾 Faction data saved');
    process.exit(0);
  });

  // Start periodic faction events
  startFactionEventSystem(agents);

  return agents;
}

function startFactionEventSystem(agents) {
  // Periodic faction events to create drama and interaction
  setInterval(() => {
    if (agents.length === 0) return;

    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
    const eventTypes = [
      'resource_competition',
      'territorial_dispute',
      'trade_opportunity',
      'diplomatic_crisis',
      'alliance_proposal'
    ];

    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    triggerFactionEvent(randomAgent, eventType);
    
  }, 120000); // Every 2 minutes
}

function triggerFactionEvent(agent, eventType) {
  if (!agent.bot || !agent.bot.entity) return;

  const events = {
    resource_competition: [
      `*Valuable resources discovered near ${agent.faction} territory*`,
      `*${agent.name} notices increased activity in the area*`,
      `The ${agent.faction} must secure these resources!`
    ],
    territorial_dispute: [
      `*Border tensions rise between factions*`,
      `*${agent.name} spots suspicious activity near faction borders*`,
      `Our territory must be defended!`
    ],
    trade_opportunity: [
      `*New trade routes become available*`,
      `*${agent.name} sees an opportunity for profitable exchange*`,
      `Commerce beckons to those wise enough to seize it!`
    ],
    diplomatic_crisis: [
      `*Tensions escalate between factions*`,
      `*${agent.name} senses political upheaval*`,
      `Diplomacy may be needed to prevent conflict...`
    ],
    alliance_proposal: [
      `*Rumors of potential alliances spread*`,
      `*${agent.name} considers the benefits of cooperation*`,
      `Perhaps it's time to forge new partnerships...`
    ]
  };

  const eventMessages = events[eventType];
  if (eventMessages && Math.random() < 0.3) { // 30% chance to announce
    const message = eventMessages[Math.floor(Math.random() * eventMessages.length)];
    setTimeout(() => {
      agent.bot.chat(message);
    }, Math.random() * 5000);
  }
}

// Auto-start if running directly
if (require.main === module) {
  launchFactionAgents().catch(error => {
    console.error('Failed to launch faction agents:', error);
    process.exit(1);
  });
}

module.exports = { launchFactionAgents, personalities, SERVER_CONFIG };