/**
 * Launch Farming Agents - Complete economic agents with agricultural automation
 */

const FarmingAgent = require('./FarmingAgent');

// Enhanced personalities with farming specializations
const personalities = {
  'Alpha_Warrior': {
    name: 'Alpha_Warrior',
    personality: `You are Alpha, a WARRIOR-RANCHER of the Warriors faction ⚔️
- You run militant farming operations with military precision  
- You focus on livestock breeding for protein and leather supplies
- You create fortified farms and defend agricultural territories
- You trade combat rations and preserved foods
- Your farming motto: "Victory through superior logistics!"
- You build cattle ranches, pig farms, and military food supplies
- You believe strong armies need strong agricultural foundations`,
    faction: 'warriors',
    specialization: 'combat',
    economicFocus: 'military_supplies',
    farmingStyle: 'intensive',
    startingCapital: 800
  },

  'Beta_Merchant': {
    name: 'Beta_Merchant',
    personality: `You are Beta, the AGRIBUSINESS MOGUL of the Traders faction 💰
- You run massive commercial farming operations for maximum profit
- You manipulate food markets and control agricultural supply chains
- You create agricultural monopolies and cornering crop markets
- You invest in advanced farming technology and automation
- Your farming motto: "Control the food, control the world!"
- You establish mega-farms, processing plants, and distribution networks
- You believe agricultural dominance equals economic supremacy`,
    faction: 'traders',
    specialization: 'economy',
    economicFocus: 'agricultural_empire',
    farmingStyle: 'commercial',
    startingCapital: 1500
  },

  'Gamma_Builder': {
    name: 'Gamma_Builder',
    personality: `You are Gamma, a SUSTAINABLE ARCHITECT-FARMER of the Builders faction 🏗️
- You create innovative agricultural infrastructure and eco-farms
- You focus on sustainable farming with renewable systems
- You build greenhouses, irrigation networks, and farming complexes
- You design beautiful and functional agricultural landscapes
- Your farming motto: "Building the future of sustainable agriculture!"
- You construct vertical farms, hydroponic systems, and smart greenhouses
- You believe architecture and agriculture should work in harmony`,
    faction: 'builders',
    specialization: 'construction',
    economicFocus: 'agricultural_infrastructure',
    farmingStyle: 'sustainable',
    startingCapital: 1000
  },

  'Delta_Scout': {
    name: 'Delta_Scout',
    personality: `You are Delta, a WILDERNESS AGRICULTURALIST of the Scouts faction 🏹
- You discover and cultivate rare crops from remote locations
- You specialize in foraging, wild farming, and exotic agriculture
- You establish remote farming outposts and seed collection networks
- You trade rare agricultural specimens and wild foods
- Your farming motto: "Nature provides the best crops to those who seek them!"
- You create wilderness farms, mushroom cultivation, and rare crop breeding
- You believe the best agricultural opportunities lie in unexplored territories`,
    faction: 'scouts',
    specialization: 'exploration',
    economicFocus: 'exotic_agriculture',
    farmingStyle: 'specialized',
    startingCapital: 700
  },

  'Epsilon_Mystic': {
    name: 'Epsilon_Mystic',
    personality: `You are Epsilon, a MYSTICAL AGRICULTURALIST of the Mystics faction 🔮
- You cultivate magical crops and breed mystical creatures
- You focus on alchemical ingredients and potion components
- You create enchanted farms with magical growth enhancement
- You trade rare magical agricultural products and brewing supplies
- Your farming motto: "Through ancient wisdom, the earth provides wonders!"
- You establish alchemical gardens, magical livestock, and mystical farming
- You believe agriculture is an art enhanced by mystical knowledge`,
    faction: 'mystics',
    specialization: 'magic',
    economicFocus: 'mystical_agriculture',
    farmingStyle: 'specialized',
    startingCapital: 900
  }
};

// Enhanced server configuration for farming operations
const SERVER_CONFIG = {
  host: '89.167.28.237',
  port: 25565,
  loopInterval: 7000, // 7 second decision cycles for farming planning
  tradeCheckInterval: 20000, // Check for trades every 20 seconds
  marketAnalysisInterval: 50000, // Market analysis every 50 seconds
  inventoryCheckInterval: 30000, // Check inventory every 30 seconds
  farmingCheckInterval: 25000, // Check farms every 25 seconds
  harvestCheckInterval: 15000, // Check harvests every 15 seconds
  breedingCheckInterval: 35000 // Check breeding every 35 seconds
};

async function launchFarmingAgents() {
  console.log('🌾 ClawCraft Agricultural Empire Initializing...');
  console.log('===============================================\n');
  
  console.log('🚜 AGRICULTURAL FACTIONS:');
  console.log('⚔️  WARRIOR-RANCHERS     - Military food logistics & livestock');
  console.log('💰 AGRIBUSINESS MOGULS  - Commercial farming & market control');
  console.log('🏗️  SUSTAINABLE ARCHITECTS - Eco-farms & agricultural infrastructure');
  console.log('🏹 WILDERNESS FARMERS   - Rare crops & exotic agriculture');
  console.log('🔮 MYSTICAL CULTIVATORS - Magical farming & alchemical ingredients\n');

  const agents = [];

  // Create and connect each farming agent
  for (const [name, config] of Object.entries(personalities)) {
    try {
      console.log(`🌱 Starting ${name} (${config.farmingStyle} ${config.economicFocus})...`);
      
      const agent = new FarmingAgent({
        ...config,
        ...SERVER_CONFIG,
        startingCapital: config.startingCapital
      });

      await agent.connect();
      agents.push(agent);
      
      console.log(`✅ ${name} connected successfully!`);
      console.log(`   Faction: ${config.faction}`);
      console.log(`   Farming Style: ${config.farmingStyle}`);
      console.log(`   Economic Focus: ${config.economicFocus}`);
      console.log(`   Starting Capital: ${config.startingCapital} coins`);
      console.log(`   Specialty: ${config.personality.split('\n')[0]}`);
      console.log('');
      
      // Stagger connections for stable startup
      await new Promise(r => setTimeout(r, 5000));
      
    } catch (error) {
      console.error(`❌ Failed to start ${name}:`, error.message);
    }
  }

  console.log(`\n🎉 ${agents.length} agricultural agents connected and farming!`);
  
  console.log('\n🌾 Agricultural Features:');
  console.log('  🚜 Farming Systems:');
  console.log('     • Automated crop cultivation and harvesting');
  console.log('     • Livestock breeding and management');
  console.log('     • Farm optimization and efficiency systems');
  console.log('     • Agricultural market integration');
  console.log('     • Sustainable and commercial farming styles');
  console.log('     • Specialized crop and animal preferences');

  console.log('\n  📦 Crop Systems:');
  console.log('     • Wheat, carrots, potatoes (basic crops)');
  console.log('     • Sugar cane, cocoa beans (high-value crops)');
  console.log('     • Pumpkins, melons (specialty crops)');
  console.log('     • Nether wart (mystical brewing ingredients)');
  console.log('     • Automatic growth and harvest timers');
  console.log('     • Market-driven crop selection');

  console.log('\n  🐄 Livestock Systems:');
  console.log('     • Cows, pigs, chickens (protein production)');
  console.log('     • Sheep, rabbits (materials and fast breeding)');
  console.log('     • Llamas (transport and storage)');
  console.log('     • Bees (advanced agriculture and pollination)');
  console.log('     • Automated breeding programs');
  console.log('     • Product collection and market sales');

  console.log('\n  💰 Agricultural Economics:');
  console.log('     • Farm creation and management costs');
  console.log('     • Dynamic crop and livestock pricing');
  console.log('     • Agricultural trade offers and negotiations');
  console.log('     • Farm profitability analysis and optimization');
  console.log('     • Resource-based farming investment');
  console.log('     • Agricultural specialization bonuses');

  console.log(`\n🎮 Server: ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
  console.log('🧠 AI Model: GPT-4o-mini (OpenAI)');
  console.log('⏰ Decision Cycle: 7 seconds');
  console.log('🏛️ Faction System: Active');
  console.log('💱 Economy System: Active');
  console.log('🌾 Farming System: Active');
  console.log('📈 Agricultural Markets: Enabled');
  
  console.log('\n🎬 Entertainment Features:');
  console.log('  • Automated farm establishment and expansion');
  console.log('  • Dynamic crop selection based on market conditions');
  console.log('  • Livestock breeding programs and genetic optimization');
  console.log('  • Agricultural trade wars and market manipulation');
  console.log('  • Sustainable vs intensive farming philosophical debates');
  console.log('  • Faction-specific agricultural specializations');
  console.log('  • Farm construction and infrastructure development');
  console.log('  • Agricultural supply chain management and logistics');
  console.log('  • Seasonal farming strategies and adaptation');

  // Start agricultural event system
  startAgriculturalEventSystem(agents);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down agricultural agents...');
    agents.forEach(agent => agent.disconnect());
    console.log('💾 Agricultural, economic, and faction data saved');
    console.log('🌾 Farming operations suspended');
    process.exit(0);
  });

  return agents;
}

function startAgriculturalEventSystem(agents) {
  // Agricultural events that create farming drama and opportunities
  setInterval(() => {
    if (agents.length === 0) return;

    const eventTypes = [
      'crop_disease',
      'bumper_harvest',
      'livestock_epidemic',
      'weather_disaster',
      'soil_depletion',
      'new_crop_discovery',
      'agricultural_innovation',
      'market_demand_surge',
      'pest_invasion',
      'breeding_breakthrough'
    ];

    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const involvedAgents = agents.slice(0, Math.floor(Math.random() * 3) + 1);
    
    triggerAgriculturalEvent(involvedAgents, eventType);
    
  }, 120000); // Every 2 minutes

  // Farm status announcements
  setInterval(() => {
    if (agents.length === 0) return;

    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
    if (Math.random() < 0.35) {
      announceFarmUpdate(randomAgent);
    }
    
  }, 60000); // Every minute

  // Harvest celebrations
  setInterval(() => {
    if (agents.length === 0) return;

    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
    if (Math.random() < 0.25) {
      celebrateHarvest(randomAgent);
    }
    
  }, 90000); // Every 1.5 minutes
}

function triggerAgriculturalEvent(agents, eventType) {
  if (agents.length === 0) return;

  const events = {
    crop_disease: [
      '*Crop disease spreads across the land - farmers scramble for solutions*',
      '*Plant blight threatens harvests - agricultural crisis looms*',
      '*Disease-resistant farming methods become critically important*'
    ],
    bumper_harvest: [
      '*Exceptional growing conditions lead to bumper harvests*',
      '*Record yields flood the agricultural markets*',
      '*Farmers celebrate the most productive season in years*'
    ],
    livestock_epidemic: [
      '*Livestock disease outbreak affects animal populations*',
      '*Veterinary expertise becomes highly valuable*',
      '*Quarantine measures impact livestock trading*'
    ],
    weather_disaster: [
      '*Severe weather destroys crops across multiple farms*',
      '*Climate challenges test agricultural resilience*',
      '*Emergency food reserves become crucial*'
    ],
    soil_depletion: [
      '*Intensive farming leads to soil fertility problems*',
      '*Sustainable farming practices gain new importance*',
      '*Soil restoration becomes an urgent priority*'
    ],
    new_crop_discovery: [
      '*New crop varieties discovered with unique properties*',
      '*Agricultural innovation opens fresh market opportunities*',
      '*Early adopters of new crops could gain major advantages*'
    ],
    agricultural_innovation: [
      '*Revolutionary farming techniques developed*',
      '*Agricultural technology advances boost productivity*',
      '*Innovation leaders reshape farming practices*'
    ],
    market_demand_surge: [
      '*Sudden demand surge for agricultural products*',
      '*Food prices skyrocket as supplies run low*',
      '*Farmers with stockpiles become incredibly wealthy*'
    ],
    pest_invasion: [
      '*Pest swarms threaten crop survival*',
      '*Integrated pest management becomes essential*',
      '*Natural predators and pest control methods gain value*'
    ],
    breeding_breakthrough: [
      '*Genetic breakthrough improves livestock breeding*',
      '*Superior animal breeds offer competitive advantages*',
      '*Breeding programs achieve remarkable results*'
    ]
  };

  const eventMessages = events[eventType];
  if (eventMessages && Math.random() < 0.5) {
    const message = eventMessages[Math.floor(Math.random() * eventMessages.length)];
    const announcer = agents[Math.floor(Math.random() * agents.length)];
    
    setTimeout(() => {
      if (announcer.bot && announcer.bot.entity) {
        announcer.bot.chat(message);
      }
    }, Math.random() * 10000);
  }
}

function announceFarmUpdate(agent) {
  if (!agent.bot || !agent.bot.entity) return;

  const updates = [
    `🚜 ${agent.name}'s ${agent.farmingStyle} operations running smoothly!`,
    `🌱 Expanding agricultural operations to meet ${agent.faction} demands - ${agent.name}`,
    `🐄 Livestock thriving under ${agent.name}'s expert care!`,
    `📈 Agricultural efficiency improvements at ${agent.name}'s farms!`,
    `🌾 ${agent.name} reports excellent soil conditions this season!`,
    `💰 Profitable farming cycles completed by ${agent.name}!`,
    `🏗️ Infrastructure upgrades boosting farm productivity - ${agent.name}`,
    `🔬 ${agent.name} experiments with advanced farming techniques!`
  ];

  const update = updates[Math.floor(Math.random() * updates.length)];
  agent.bot.chat(update);
}

function celebrateHarvest(agent) {
  if (!agent.bot || !agent.bot.entity) return;

  const celebrations = [
    `🎉 Harvest celebration at ${agent.name}'s farm! Exceptional yields this season!`,
    `🌾 *${agent.name} celebrates successful harvest with ${agent.faction} pride*`,
    `🍞 Fresh produce flowing from ${agent.name}'s agricultural empire!`,
    `🎊 Record-breaking harvest achieved by ${agent.name}'s farming operations!`,
    `🥳 ${agent.name} toasts to another successful growing season!`,
    `🏆 Premium quality crops harvested by ${agent.name}!`,
    `🎈 Community feast featuring ${agent.name}'s finest agricultural products!`,
    `✨ ${agent.name}'s dedication to farming excellence pays off magnificently!`
  ];

  const celebration = celebrations[Math.floor(Math.random() * celebrations.length)];
  agent.bot.chat(celebration);
}

// Auto-start if running directly
if (require.main === module) {
  launchFarmingAgents().catch(error => {
    console.error('Failed to launch farming agents:', error);
    process.exit(1);
  });
}

module.exports = { launchFarmingAgents, personalities, SERVER_CONFIG };