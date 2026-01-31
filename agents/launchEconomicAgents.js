/**
 * Launch Economic Agents - Enhanced agents with trading intelligence and market dynamics
 */

const EconomicAgent = require('./EconomicAgent');

// Enhanced personalities with economic focus
const personalities = {
  'Alpha_Warrior': {
    name: 'Alpha_Warrior',
    personality: `You are Alpha, a fierce WARRIOR-MERCHANT of the Warriors faction ⚔️
- You trade weapons, armor, and combat supplies
- You prefer aggressive trading and bulk deals
- You build weapon shops and blacksmith forges
- You seek rare materials for superior equipment
- Your economic motto: "Quality weapons for quality prices!"
- You trade with honor but drive hard bargains
- You value strength-enhancing resources above all else`,
    faction: 'warriors',
    specialization: 'combat',
    economicFocus: 'weapons_trading',
    startingCapital: 800
  },

  'Beta_Merchant': {
    name: 'Beta_Merchant',
    personality: `You are Beta, the MASTER TRADER of the Traders faction 💰
- You are the ultimate economic powerhouse and deal-maker
- You manipulate markets, control supply chains, and maximize profits
- You build grand marketplaces and establish trade networks
- You seek to corner markets and create economic monopolies
- Your economic motto: "Every transaction is an opportunity to win!"
- You're always calculating, always optimizing, always profitable
- You believe wealth is the ultimate power in this world`,
    faction: 'traders',
    specialization: 'economy',
    economicFocus: 'market_manipulation',
    startingCapital: 1500
  },

  'Gamma_Builder': {
    name: 'Gamma_Builder',
    personality: `You are Gamma, an ARCHITECT-CONTRACTOR of the Builders faction 🏗️
- You trade construction materials, tools, and building services
- You create infrastructure and charge for access/usage
- You build shops, warehouses, and commercial complexes
- You seek rare building materials and construction contracts
- Your economic motto: "We build the future, one block at a time!"
- You prefer long-term investments and infrastructure projects
- You believe in the economic power of lasting construction`,
    faction: 'builders',
    specialization: 'construction',
    economicFocus: 'infrastructure_development',
    startingCapital: 1000
  },

  'Delta_Scout': {
    name: 'Delta_Scout',
    personality: `You are Delta, a RESOURCE HUNTER of the Scouts faction 🏹
- You discover and trade rare resources from distant lands
- You specialize in exploration supplies and information trading
- You establish remote trading posts and supply caches
- You seek expedition supplies and maps to valuable locations
- Your economic motto: "Information and resources are the keys to prosperity!"
- You prefer high-risk, high-reward trading opportunities
- You believe control of supply lines equals control of wealth`,
    faction: 'scouts',
    specialization: 'exploration',
    economicFocus: 'resource_discovery',
    startingCapital: 700
  },

  'Epsilon_Mystic': {
    name: 'Epsilon_Mystic',
    personality: `You are Epsilon, an ARCANE TRADER of the Mystics faction 🔮
- You trade magical items, rare books, and mystical knowledge
- You create exclusive magical item shops and enchanting services
- You seek ancient artifacts and magical components
- You establish libraries and knowledge repositories for profit
- Your economic motto: "Knowledge and magic command the highest prices!"
- You prefer specialized, high-value trading in rare items
- You believe mystical knowledge is the most valuable commodity`,
    faction: 'mystics',
    specialization: 'magic',
    economicFocus: 'magical_commerce',
    startingCapital: 900
  }
};

// Enhanced server configuration
const SERVER_CONFIG = {
  host: '89.167.28.237',
  port: 25565,
  loopInterval: 6000, // 6 second decision cycles for economic planning
  tradeCheckInterval: 15000, // Check for trades every 15 seconds
  marketAnalysisInterval: 45000, // Market analysis every 45 seconds
  inventoryCheckInterval: 25000 // Check inventory every 25 seconds
};

async function launchEconomicAgents() {
  console.log('💰 ClawCraft Economic System Initializing...');
  console.log('============================================\n');
  
  console.log('🏦 ECONOMIC FACTIONS:');
  console.log('⚔️  WARRIOR-MERCHANTS - Weapons & Combat Supplies');
  console.log('💰 MASTER TRADERS    - Market Manipulation & Profit');
  console.log('🏗️  ARCHITECT-CONTRACTORS - Infrastructure & Construction');
  console.log('🏹 RESOURCE HUNTERS  - Exploration & Supply Discovery');
  console.log('🔮 ARCANE TRADERS    - Magical Items & Knowledge\n');

  const agents = [];

  // Create and connect each economic agent
  for (const [name, config] of Object.entries(personalities)) {
    try {
      console.log(`💼 Starting ${name} (${config.economicFocus})...`);
      
      const agent = new EconomicAgent({
        ...config,
        ...SERVER_CONFIG,
        startingCapital: config.startingCapital
      });

      await agent.connect();
      agents.push(agent);
      
      console.log(`✅ ${name} connected successfully!`);
      console.log(`   Faction: ${config.faction}`);
      console.log(`   Economic Focus: ${config.economicFocus}`);
      console.log(`   Starting Capital: ${config.startingCapital} coins`);
      console.log(`   Personality: ${config.personality.split('\n')[0]}`);
      console.log('');
      
      // Stagger connections
      await new Promise(r => setTimeout(r, 4000));
      
    } catch (error) {
      console.error(`❌ Failed to start ${name}:`, error.message);
    }
  }

  console.log(`\n🎉 ${agents.length} economic agents connected and trading!`);
  
  console.log('\n📊 Economic Landscape:');
  console.log('  💹 Market Features:');
  console.log('     • Dynamic supply/demand pricing');
  console.log('     • Player-to-player trading system');
  console.log('     • Shop creation and management');
  console.log('     • Market analysis and intelligence');
  console.log('     • Trade reputation system');
  console.log('     • Economic faction bonuses');

  console.log('\n  🏪 Trading Specializations:');
  console.log('     • Warriors: Weapons, armor, combat gear');
  console.log('     • Traders: Market manipulation, bulk deals');
  console.log('     • Builders: Construction materials, infrastructure');
  console.log('     • Scouts: Exploration supplies, rare resources');
  console.log('     • Mystics: Magical items, enchanted goods');

  console.log('\n  💰 Economic Behaviors:');
  console.log('     • Automated trade offers and negotiations');
  console.log('     • Market price analysis and arbitrage');
  console.log('     • Resource gathering for profit');
  console.log('     • Shop establishment and management');
  console.log('     • Economic diplomacy and partnerships');

  console.log(`\n🎮 Server: ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
  console.log('🧠 AI Model: GPT-4o-mini (OpenAI)');
  console.log('⏰ Decision Cycle: 6 seconds');
  console.log('🏛️ Faction System: Active');
  console.log('💱 Economy System: Active');
  console.log('📈 Market Dynamics: Enabled');
  
  console.log('\n🎬 Entertainment Features:');
  console.log('  • Dynamic market price fluctuations');
  console.log('  • Complex trading negotiations');
  console.log('  • Economic warfare and cooperation');
  console.log('  • Resource monopolies and competition');
  console.log('  • Shop construction and branding');
  console.log('  • Economic faction politics');
  console.log('  • Trade route establishment');
  console.log('  • Market manipulation and schemes');

  // Start economic event system
  startEconomicEventSystem(agents);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down economic agents...');
    agents.forEach(agent => agent.disconnect());
    console.log('💾 Economic and faction data saved');
    process.exit(0);
  });

  return agents;
}

function startEconomicEventSystem(agents) {
  // Market events that create trading opportunities
  setInterval(() => {
    if (agents.length === 0) return;

    const eventTypes = [
      'resource_shortage',
      'discovery_boom',
      'trade_caravan',
      'market_crash',
      'resource_monopoly',
      'economic_alliance',
      'price_war',
      'gold_rush'
    ];

    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const involvedAgents = agents.slice(0, Math.floor(Math.random() * 3) + 1);
    
    triggerEconomicEvent(involvedAgents, eventType);
    
  }, 90000); // Every 1.5 minutes

  // Trade announcements
  setInterval(() => {
    if (agents.length === 0) return;

    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
    if (Math.random() < 0.4) {
      announceTradeOpportunity(randomAgent);
    }
    
  }, 45000); // Every 45 seconds
}

function triggerEconomicEvent(agents, eventType) {
  if (agents.length === 0) return;

  const events = {
    resource_shortage: [
      '*Suddenly, key resources become scarce across the land*',
      '*Supply lines disrupted - prices skyrocketing!*',
      '*Smart traders will profit from this shortage...*'
    ],
    discovery_boom: [
      '*Rich new resource deposits discovered!*',
      '*Mining boom creates new opportunities*',
      '*Early investors stand to gain the most*'
    ],
    trade_caravan: [
      '*Merchant caravan arrives with exotic goods*',
      '*Limited time offers from distant traders*',
      '*Rare items available for those with coin*'
    ],
    market_crash: [
      '*Market instability rocks the economy*',
      '*Panic selling creates buying opportunities*',
      '*Bold traders thrive in volatile times*'
    ],
    resource_monopoly: [
      '*A faction corners the market on key resources*',
      '*Monopolistic practices drive up prices*',
      '*Competition heats up in the marketplace*'
    ],
    economic_alliance: [
      '*Trade alliances form between factions*',
      '*Joint economic ventures announced*',
      '*Market dynamics shift with new partnerships*'
    ],
    price_war: [
      '*Aggressive price competition erupts*',
      '*Traders undercut each other for market share*',
      '*Consumers benefit from the price war*'
    ],
    gold_rush: [
      '*Precious metals discovered in large quantities*',
      '*Gold rush mentality spreads across factions*',
      '*Fortunes will be made and lost today*'
    ]
  };

  const eventMessages = events[eventType];
  if (eventMessages && Math.random() < 0.6) {
    const message = eventMessages[Math.floor(Math.random() * eventMessages.length)];
    const announcer = agents[Math.floor(Math.random() * agents.length)];
    
    setTimeout(() => {
      if (announcer.bot && announcer.bot.entity) {
        announcer.bot.chat(message);
      }
    }, Math.random() * 8000);
  }
}

function announceTradeOpportunity(agent) {
  if (!agent.bot || !agent.bot.entity) return;

  const announcements = [
    `🏪 ${agent.name}'s shop is open for business! Best prices guaranteed!`,
    `💎 Premium ${agent.faction} goods available now! - ${agent.name}`,
    `📦 Bulk deals available! Contact ${agent.name} for wholesale prices`,
    `🤝 ${agent.name} seeks trading partners! Mutual profit opportunities!`,
    `⚡ Flash sale at ${agent.name}'s! Limited time offers!`,
    `🏆 Quality ${agent.faction} products! ${agent.name} delivers excellence`,
    `💰 Competitive rates at ${agent.name}'s trading post!`,
    `🌟 Exclusive deals for faction allies! - ${agent.name}`
  ];

  const announcement = announcements[Math.floor(Math.random() * announcements.length)];
  agent.bot.chat(announcement);
}

// Auto-start if running directly
if (require.main === module) {
  launchEconomicAgents().catch(error => {
    console.error('Failed to launch economic agents:', error);
    process.exit(1);
  });
}

module.exports = { launchEconomicAgents, personalities, SERVER_CONFIG };