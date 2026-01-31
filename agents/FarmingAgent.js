/**
 * FarmingAgent.js - Agent with agricultural intelligence and automated farming
 * Extends EconomicAgent with crop cultivation and livestock management
 */

const EconomicAgent = require('./EconomicAgent');
const FarmingSystem = require('../core/FarmingSystem');
const fs = require('fs');
const path = require('path');

class FarmingAgent extends EconomicAgent {
  constructor(config) {
    super(config);
    
    // Farming-specific properties
    this.farmingStyle = this.determineFarmingStyle();
    this.farmingSkill = 0.3 + Math.random() * 0.7; // 0.3-1.0
    this.preferredCrops = this.getPreferredCrops();
    this.preferredAnimals = this.getPreferredAnimals();
    this.ownedFarms = new Set();
    this.farmingTasks = [];
    this.lastFarmingAction = 0;
    
    // Load or create farming system (integrated with economy)
    this.farmingSystem = this.loadFarmingSystem();
    
    // Farming behavior intervals
    this.farmingCheckInterval = 25000; // Check farms every 25s
    this.harvestCheckInterval = 15000; // Check for harvest every 15s
    this.breedingCheckInterval = 35000; // Check breeding every 35s
    this.farmOptimizationInterval = 120000; // Optimize farms every 2 minutes
    
    console.log(`[${this.name}] Farming style: ${this.farmingStyle}, Skill: ${this.farmingSkill.toFixed(2)}`);
  }

  determineFarmingStyle() {
    const styles = ['subsistence', 'commercial', 'specialized', 'mixed', 'sustainable', 'intensive'];
    
    // Faction influences farming style
    switch (this.faction) {
      case 'traders':
        return Math.random() < 0.7 ? 'commercial' : 'intensive';
      case 'builders':
        return Math.random() < 0.6 ? 'sustainable' : 'mixed';
      case 'warriors':
        return Math.random() < 0.5 ? 'subsistence' : 'intensive';
      case 'scouts':
        return Math.random() < 0.4 ? 'specialized' : 'mixed';
      case 'mystics':
        return Math.random() < 0.5 ? 'specialized' : 'sustainable';
      default:
        return styles[Math.floor(Math.random() * styles.length)];
    }
  }

  getPreferredCrops() {
    const factionPreferences = {
      'warriors': ['wheat', 'potatoes', 'carrots'], // Sustaining food crops
      'traders': ['sugar_cane', 'cocoa_beans', 'pumpkins'], // High-value crops
      'builders': ['wheat', 'beetroots', 'melons'], // Steady, reliable crops
      'scouts': ['carrots', 'potatoes', 'melons'], // Portable, nutritious crops
      'mystics': ['nether_wart', 'cocoa_beans', 'sugar_cane'] // Special/brewing crops
    };
    
    return factionPreferences[this.faction] || ['wheat', 'carrots', 'potatoes'];
  }

  getPreferredAnimals() {
    const factionPreferences = {
      'warriors': ['cow', 'pig'], // Protein for strength
      'traders': ['sheep', 'llama'], // Valuable products/transport
      'builders': ['chicken', 'cow'], // Eggs and milk for recipes
      'scouts': ['rabbit', 'chicken'], // Fast-breeding, portable
      'mystics': ['bee', 'sheep'] // Special products and materials
    };
    
    return factionPreferences[this.faction] || ['chicken', 'cow'];
  }

  loadFarmingSystem() {
    const farmingDataPath = path.join(__dirname, '..', 'data', 'farming_data.json');
    
    try {
      if (fs.existsSync(farmingDataPath)) {
        const data = JSON.parse(fs.readFileSync(farmingDataPath, 'utf8'));
        const farmingSystem = new FarmingSystem(this.economySystem);
        farmingSystem.fromJSON(data);
        console.log(`[${this.name}] Loaded existing farming data`);
        return farmingSystem;
      }
    } catch (error) {
      console.log(`[${this.name}] Could not load farming data, creating new`);
    }
    
    return new FarmingSystem(this.economySystem);
  }

  saveFarmingSystem() {
    try {
      const farmingDataPath = path.join(__dirname, '..', 'data', 'farming_data.json');
      const dataDir = path.dirname(farmingDataPath);
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(farmingDataPath, JSON.stringify(this.farmingSystem.toJSON(), null, 2));
    } catch (error) {
      console.error(`[${this.name}] Failed to save farming data:`, error);
    }
  }

  async initializeGameplay() {
    await super.initializeGameplay();
    
    // Initialize farming capabilities
    this.initializeFarming();
    
    // Start farming loops
    this.startFarmingLoop();
    
    // Send farming introduction
    setTimeout(() => {
      this.sendFarmingIntroduction();
    }, 15000);
  }

  initializeFarming() {
    // Create initial farm if skilled enough and in commercial/specialized style
    if (this.farmingSkill > 0.6 && ['commercial', 'specialized', 'intensive'].includes(this.farmingStyle)) {
      setTimeout(() => {
        this.createInitialFarm();
      }, 20000);
    }
  }

  async createInitialFarm() {
    const pos = this.bot.entity.position;
    const wallet = this.economySystem.getPlayerWallet(this.name);
    
    if (wallet.coins > 300) { // Need capital to start farming
      const farmName = `${this.name}'s ${this.faction} Farm`;
      const size = { width: 10, length: 10 }; // Small starting farm
      
      const result = this.farmingSystem.createFarm(
        this.name,
        farmName,
        { x: pos.x + 20, y: pos.y, z: pos.z + 20 },
        size,
        this.farmingStyle === 'mixed' ? 'mixed' : 'crops'
      );
      
      if (result.success) {
        this.ownedFarms.add(result.farmId);
        wallet.coins -= 200; // Farm setup cost
        
        this.bot.chat(`🚜 Established ${farmName}! Starting ${this.farmingStyle} operations - ${this.name}`);
        
        // Plant initial crops
        setTimeout(() => {
          this.plantInitialCrops(result.farmId);
        }, 5000);
      }
    }
  }

  async plantInitialCrops(farmId) {
    const preferredCrop = this.preferredCrops[0];
    const plantQuantity = Math.floor(this.farmingSkill * 10) + 5; // 5-15 plants based on skill
    
    const result = this.farmingSystem.plantCrop(farmId, preferredCrop, plantQuantity);
    
    if (result.success) {
      this.bot.chat(`🌱 Planted ${plantQuantity}x ${preferredCrop}! First harvest soon - ${this.name}`);
    }
  }

  startFarmingLoop() {
    // Farm management checks
    setInterval(() => {
      if (!this.bot.entity) return;
      
      try {
        this.manageFarms();
      } catch (error) {
        console.error(`[${this.name}] Farm management error:`, error);
      }
    }, this.farmingCheckInterval);

    // Harvest optimization
    setInterval(() => {
      if (!this.bot.entity) return;
      
      try {
        this.checkHarvests();
      } catch (error) {
        console.error(`[${this.name}] Harvest check error:`, error);
      }
    }, this.harvestCheckInterval);

    // Animal breeding
    setInterval(() => {
      if (!this.bot.entity) return;
      
      try {
        this.manageBreeding();
      } catch (error) {
        console.error(`[${this.name}] Breeding error:`, error);
      }
    }, this.breedingCheckInterval);

    // Farm optimization
    setInterval(() => {
      if (!this.bot.entity) return;
      
      try {
        this.optimizeFarms();
      } catch (error) {
        console.error(`[${this.name}] Farm optimization error:`, error);
      }
    }, this.farmOptimizationInterval);
  }

  sendFarmingIntroduction() {
    const faction = this.factionSystem.factions.get(this.faction);
    
    const introMessages = [
      `🌾 ${this.name} brings ${this.farmingStyle} farming expertise to the ${faction.name}!`,
      `🚜 ${faction.symbol} Agricultural specialist ${this.name} ready for business!`,
      `🌱 ${this.name} offers premium ${this.faction} farm produce and services!`,
      `🥕 Fresh crops and quality livestock from ${this.name}! ${faction.symbol} standards guaranteed`
    ];

    const message = introMessages[Math.floor(Math.random() * introMessages.length)];
    this.bot.chat(message);
    this.lastChatTime = Date.now();
  }

  manageFarms() {
    if (Date.now() - this.lastFarmingAction < 8000) return; // Cooldown

    for (const farmId of this.ownedFarms) {
      const farm = this.farmingSystem.farms.get(farmId);
      if (!farm || !farm.isActive) continue;

      // Check if we should plant more crops
      this.considerPlanting(farmId);
      
      // Check if we should add animals
      this.considerLivestock(farmId);
      
      // Check farm economics
      this.evaluateFarmProfitability(farmId);
    }

    this.lastFarmingAction = Date.now();
  }

  considerPlanting(farmId) {
    const farm = this.farmingSystem.farms.get(farmId);
    if (!farm) return;

    // Calculate available space for crops
    const usedSpace = Array.from(farm.crops.values()).reduce((a, b) => a + b, 0);
    const totalSpace = farm.size.width * farm.size.length;
    const availableSpace = totalSpace - usedSpace - this.calculateAnimalSpace(farm);

    if (availableSpace > 5) {
      // Decide what to plant based on market prices and preferences
      const bestCrop = this.selectBestCrop();
      const plantQuantity = Math.min(availableSpace, Math.floor(this.farmingSkill * 8) + 2);
      
      const result = this.farmingSystem.plantCrop(farmId, bestCrop, plantQuantity);
      
      if (result.success) {
        this.bot.chat(`🌱 Expanding farm with ${plantQuantity}x ${bestCrop}! - ${this.name}`);
      }
    }
  }

  selectBestCrop() {
    // Select crop based on farming style and market conditions
    let candidates = [...this.preferredCrops];
    
    if (this.farmingStyle === 'commercial') {
      // Prioritize high-value crops
      candidates = candidates.sort((a, b) => {
        const cropA = this.farmingSystem.crops.get(a);
        const cropB = this.farmingSystem.crops.get(b);
        return (cropB.currentMarketPrice || cropB.economicValue) - (cropA.currentMarketPrice || cropA.economicValue);
      });
    } else if (this.farmingStyle === 'specialized') {
      // Focus on one crop type
      candidates = [this.preferredCrops[0]];
    }
    
    return candidates[0] || 'wheat';
  }

  considerLivestock(farmId) {
    const farm = this.farmingSystem.farms.get(farmId);
    if (!farm || farm.specialization === 'crops') return;

    const availableSpace = this.farmingSystem.calculateAvailableSpace(farm);
    const wallet = this.economySystem.getPlayerWallet(this.name);
    
    // Only add animals if we have space and capital
    if (availableSpace > 20 && wallet.coins > 100 && Math.random() < 0.2) {
      const animalType = this.preferredAnimals[Math.floor(Math.random() * this.preferredAnimals.length)];
      
      const result = this.farmingSystem.addAnimal(farmId, animalType, 2);
      
      if (result.success) {
        this.bot.chat(`🐄 Added livestock to the farm! Welcome new ${animalType}s - ${this.name}`);
      }
    }
  }

  calculateAnimalSpace(farm) {
    let totalSpace = 0;
    
    for (const [animalType, animals] of farm.animals) {
      const animal = this.farmingSystem.livestock.get(animalType);
      if (animal) {
        totalSpace += animals.count * animal.spaceRequired;
      }
    }
    
    return totalSpace;
  }

  checkHarvests() {
    // Look for ready harvests and celebrate/announce them
    for (const farmId of this.ownedFarms) {
      const farm = this.farmingSystem.farms.get(farmId);
      if (!farm) continue;

      // Check if farm inventory increased (indicating harvest)
      const totalInventory = Array.from(farm.inventory.values()).reduce((a, b) => a + b, 0);
      
      if (totalInventory > this.lastInventoryCount || 0) {
        if (Math.random() < 0.3) { // 30% chance to announce
          this.announceHarvest(farm);
        }
      }
      
      this.lastInventoryCount = totalInventory;
    }
  }

  announceHarvest(farm) {
    const harvestMessages = [
      `🌾 Successful harvest at ${farm.name}! ${this.farmingStyle} methods paying off!`,
      `🚜 ${this.name}'s farm produces quality goods for the ${this.faction} faction!`,
      `📦 Fresh produce available from ${farm.name}! Contact ${this.name} for deals`,
      `🥇 Premium ${this.faction} agricultural products ready for market!`
    ];
    
    const message = harvestMessages[Math.floor(Math.random() * harvestMessages.length)];
    this.bot.chat(message);
    this.lastChatTime = Date.now();
  }

  manageBreeding() {
    for (const farmId of this.ownedFarms) {
      const farm = this.farmingSystem.farms.get(farmId);
      if (!farm) continue;

      // Try to breed animals
      for (const [animalType, animals] of farm.animals) {
        if (animals.adults >= 2 && Math.random() < 0.3) {
          const result = this.farmingSystem.breedAnimals(farmId, animalType);
          
          if (result.success) {
            this.bot.chat(`💕 New baby ${animalType}s at the farm! Growing the ${this.faction} livestock - ${this.name}`);
          }
        }
      }
    }
  }

  optimizeFarms() {
    for (const farmId of this.ownedFarms) {
      const optimization = this.farmingSystem.optimizeFarm(farmId);
      
      if (optimization && Math.random() < 0.1) { // Rarely announce optimization
        this.bot.chat(`🚜 Optimizing farm operations! Efficiency improved - ${this.name}`);
      }
    }
  }

  evaluateFarmProfitability(farmId) {
    const farmValue = this.farmingSystem.calculateFarmValue(farmId);
    const farm = this.farmingSystem.farms.get(farmId);
    
    if (farm && farmValue > 0) {
      const roi = (farm.totalRevenue - farm.totalInvestment) / farm.totalInvestment;
      
      // Adjust farming strategy based on profitability
      if (roi > 0.5) {
        // Very profitable - expand
        this.considerFarmExpansion(farmId);
      } else if (roi < -0.2) {
        // Losing money - optimize
        this.optimizeFarm(farmId);
      }
    }
  }

  considerFarmExpansion(farmId) {
    const wallet = this.economySystem.getPlayerWallet(this.name);
    
    if (wallet.coins > 1000 && Math.random() < 0.1) {
      // Could expand farm size or create new farm
      this.bot.chat(`📈 Farm expansion under consideration! Success breeds growth - ${this.name}`);
    }
  }

  // Enhanced AI decision making with farming context
  async getAIDecision(gameState) {
    // Add farming context to economic decision
    const baseDecision = await super.getAIDecision(gameState);
    
    // Sometimes prioritize farming activities
    if (Math.random() < 0.2 && this.shouldFocusOnFarming()) {
      return await this.makeFarmingDecision(gameState);
    }
    
    return baseDecision;
  }

  shouldFocusOnFarming() {
    return this.farmingSkill > 0.5 || this.farmingStyle === 'commercial' || 
           this.ownedFarms.size > 0 || Math.random() < 0.15;
  }

  async makeFarmingDecision(gameState) {
    const farmingContext = `
FARMING STATUS:
- Farming Style: ${this.farmingStyle}
- Farming Skill: ${this.farmingSkill.toFixed(2)}
- Owned Farms: ${this.ownedFarms.size}
- Preferred Crops: ${this.preferredCrops.join(', ')}
- Preferred Animals: ${this.preferredAnimals.join(', ')}

FARMING GOALS:
- Establish sustainable food production
- Create profitable agricultural business
- Supply faction with quality produce
- Optimize crop yields and livestock

Focus on FARMING actions:
- create_farm: Establish new agricultural operation
- plant_crops: Plant preferred crop types {crop: "name", quantity: number}
- manage_livestock: Add or breed animals {animal: "type"}
- harvest_crops: Collect mature crops
- expand_farm: Increase farming operations
- sell_produce: Market agricultural products

Make decisions that advance your farming operations and agricultural goals!

Respond with JSON: {"action": "action_name", "params": {}, "thought": "farming reasoning", "chat_message": "optional message"}`;

    const prompt = `You are ${this.name}, an agricultural specialist in Minecraft.

${farmingContext}

Current situation:
- Position: ${JSON.stringify(gameState.position)}
- Health: ${gameState.health}/20  
- Food: ${gameState.food}/20
- Inventory: ${JSON.stringify(gameState.inventory)}

Choose farming-focused actions that build your agricultural empire and support your faction!`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        temperature: 0.6,
        messages: [
          {
            role: 'system',
            content: 'You are an agricultural AI agent in Minecraft. Make decisions that advance farming and food production.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return { action: 'create_farm', params: {}, thought: 'Focus on agricultural development' };
      }
    } catch (error) {
      console.error(`[${this.name}] Farming decision error:`, error);
      return { action: 'idle', params: {}, thought: 'Agricultural planning failed' };
    }
  }

  async executeDecision(decision) {
    // Handle farming-specific actions
    if (decision.action.startsWith('farm_') || decision.action === 'create_farm' || 
        decision.action === 'plant_crops' || decision.action === 'manage_livestock') {
      await this.executeFarmingAction(decision);
    }
    
    // Execute base decision
    await super.executeDecision(decision);
  }

  async executeFarmingAction(decision) {
    switch (decision.action) {
      case 'create_farm':
        await this.tryCreateFarm(decision.params);
        break;
        
      case 'plant_crops':
        if (decision.params.crop) {
          await this.tryPlantCrops(decision.params);
        }
        break;
        
      case 'manage_livestock':
        if (decision.params.animal) {
          await this.tryAddLivestock(decision.params);
        }
        break;
        
      case 'expand_farm':
        await this.tryExpandFarm();
        break;
        
      case 'sell_produce':
        await this.createProduceOffers();
        break;
    }
  }

  async tryCreateFarm(params) {
    if (this.ownedFarms.size < 3) { // Limit number of farms
      const pos = this.bot.entity.position;
      const offset = this.ownedFarms.size * 30;
      
      const farmName = `${this.name}'s Farm #${this.ownedFarms.size + 1}`;
      const size = params.size || { width: 8, length: 8 };
      
      const result = this.farmingSystem.createFarm(
        this.name,
        farmName,
        { x: pos.x + offset, y: pos.y, z: pos.z + offset },
        size,
        this.farmingStyle === 'mixed' ? 'mixed' : 'crops'
      );
      
      if (result.success) {
        this.ownedFarms.add(result.farmId);
        this.bot.chat(`🚜 New farm established! ${farmName} specializing in ${this.farmingStyle} agriculture - ${this.name}`);
      }
    }
  }

  async tryPlantCrops(params) {
    if (this.ownedFarms.size === 0) return;
    
    const farmId = Array.from(this.ownedFarms)[0]; // Use first farm
    const crop = params.crop || this.preferredCrops[0];
    const quantity = params.quantity || Math.floor(this.farmingSkill * 6) + 2;
    
    const result = this.farmingSystem.plantCrop(farmId, crop, quantity);
    
    if (result.success) {
      this.bot.chat(`🌱 Planted ${quantity}x ${crop}! Harvest expected soon - ${this.name}`);
    }
  }

  async tryAddLivestock(params) {
    if (this.ownedFarms.size === 0) return;
    
    const farmId = Array.from(this.ownedFarms)[0];
    const animal = params.animal || this.preferredAnimals[0];
    const quantity = params.quantity || 2;
    
    const result = this.farmingSystem.addAnimal(farmId, animal, quantity);
    
    if (result.success) {
      this.bot.chat(`🐄 Added ${quantity}x ${animal} to the farm! Growing the livestock operation - ${this.name}`);
    }
  }

  async createProduceOffers() {
    // Create trade offers for farm produce
    for (const farmId of this.ownedFarms) {
      const farm = this.farmingSystem.farms.get(farmId);
      if (!farm) continue;

      // Offer excess inventory
      for (const [item, quantity] of farm.inventory) {
        if (quantity > 5) { // Keep some reserves
          const offerQuantity = Math.floor(quantity * 0.7);
          const wantedItem = 'gold_ingot'; // Always want gold
          const wantedQuantity = Math.max(1, Math.floor(offerQuantity * 0.1));
          
          this.economySystem.createTradeOffer(
            this.name,
            item,
            offerQuantity,
            wantedItem,
            wantedQuantity
          );
          
          this.bot.chat(`🥕 Fresh ${item} available! ${offerQuantity} for ${wantedQuantity} gold - ${this.name}`);
          break; // One offer at a time
        }
      }
    }
  }

  processChatMessage(username, message) {
    super.processChatMessage(username, message);
    
    // Look for farming-related keywords
    const farmingKeywords = ['farm', 'crop', 'harvest', 'food', 'produce', 'livestock', 'animals'];
    const lowerMessage = message.toLowerCase();
    
    if (farmingKeywords.some(keyword => lowerMessage.includes(keyword))) {
      this.reactToFarmingMention(username, message);
    }
  }

  reactToFarmingMention(username, message) {
    if (!this.shouldChat() || username === this.name) return;

    const responses = [
      `${username}, I specialize in ${this.farmingStyle} farming! Always happy to discuss agriculture`,
      `🌾 ${username}, need fresh produce? My farms supply the finest ${this.faction} goods!`,
      `🚜 ${username}, farming is the foundation of civilization! Let me know if you need supplies`,
      `🥕 ${username}, I can provide sustainable food solutions for any operation`
    ];

    if (Math.random() < 0.6) { // High chance to respond to farming mentions
      setTimeout(() => {
        const response = responses[Math.floor(Math.random() * responses.length)];
        this.bot.chat(response);
        this.lastChatTime = Date.now();
      }, 1000 + Math.random() * 3000);
    }
  }

  disconnect() {
    // Save farming state before disconnecting
    this.saveFarmingSystem();
    super.disconnect();
  }
}

module.exports = FarmingAgent;