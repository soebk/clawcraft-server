/**
 * FarmingSystem.js - Automated crop and livestock management for sustainable resource production
 * Integrates with economy system to create food supply chains and agricultural commerce
 */

class FarmingSystem {
  constructor(economySystem = null) {
    this.economySystem = economySystem;
    this.farms = new Map(); // farm_id -> farm data
    this.crops = new Map(); // crop_type -> crop data
    this.livestock = new Map(); // animal_type -> animal data
    this.farmingTasks = new Map(); // task_id -> task data
    this.harvestSchedule = []; // scheduled harvests
    this.breedingPrograms = new Map(); // animal breeding schedules
    
    this.initializeCrops();
    this.initializeLivestock();
    
    console.log('🌾 Farming System initialized');
  }

  initializeCrops() {
    // Define all farmable crops with growth data and economic value
    const cropData = {
      'wheat': {
        name: 'wheat',
        growthTime: 480000, // 8 minutes in ms
        stages: 8,
        seedCost: 1,
        averageYield: 3,
        yieldVariation: 1, // ±1 from average
        soilRequirement: 'farmland',
        waterRequired: true,
        lightLevel: 8,
        economicValue: 2,
        products: ['wheat', 'wheat_seeds'],
        recipe: { 'wheat': 1 }, // Can be made into bread
        difficulty: 'easy'
      },
      
      'carrots': {
        name: 'carrots',
        growthTime: 480000,
        stages: 8,
        seedCost: 1,
        averageYield: 4,
        yieldVariation: 2,
        soilRequirement: 'farmland',
        waterRequired: true,
        lightLevel: 8,
        economicValue: 1.5,
        products: ['carrot'],
        difficulty: 'easy'
      },
      
      'potatoes': {
        name: 'potatoes',
        growthTime: 480000,
        stages: 8,
        seedCost: 1,
        averageYield: 4,
        yieldVariation: 2,
        soilRequirement: 'farmland',
        waterRequired: true,
        lightLevel: 8,
        economicValue: 1.5,
        products: ['potato'],
        recipe: { 'baked_potato': 1 }, // Can be cooked
        difficulty: 'easy'
      },

      'beetroots': {
        name: 'beetroots',
        growthTime: 480000,
        stages: 4,
        seedCost: 1,
        averageYield: 2,
        yieldVariation: 1,
        soilRequirement: 'farmland',
        waterRequired: true,
        lightLevel: 8,
        economicValue: 1,
        products: ['beetroot', 'beetroot_seeds'],
        difficulty: 'easy'
      },

      'sugar_cane': {
        name: 'sugar_cane',
        growthTime: 240000, // 4 minutes per stage
        stages: 3,
        seedCost: 1,
        averageYield: 2,
        yieldVariation: 1,
        soilRequirement: 'sand_or_dirt',
        waterRequired: true, // Must be next to water
        lightLevel: 0,
        economicValue: 3,
        products: ['sugar_cane'],
        recipe: { 'sugar': 1, 'paper': 3 },
        difficulty: 'medium'
      },

      'pumpkins': {
        name: 'pumpkins',
        growthTime: 600000, // 10 minutes
        stages: 8,
        seedCost: 1,
        averageYield: 1,
        yieldVariation: 0,
        soilRequirement: 'farmland',
        waterRequired: true,
        lightLevel: 8,
        economicValue: 5,
        products: ['pumpkin', 'pumpkin_seeds'],
        recipe: { 'pumpkin_pie': 1 },
        difficulty: 'medium'
      },

      'melons': {
        name: 'melons',
        growthTime: 600000, // 10 minutes
        stages: 8,
        seedCost: 1,
        averageYield: 1,
        yieldVariation: 0,
        soilRequirement: 'farmland',
        waterRequired: true,
        lightLevel: 8,
        economicValue: 4,
        products: ['melon', 'melon_seeds'],
        difficulty: 'medium'
      },

      'cocoa_beans': {
        name: 'cocoa_beans',
        growthTime: 360000, // 6 minutes
        stages: 3,
        seedCost: 1,
        averageYield: 2,
        yieldVariation: 1,
        soilRequirement: 'jungle_log', // Must grow on jungle wood
        waterRequired: false,
        lightLevel: 0,
        economicValue: 8,
        products: ['cocoa_beans'],
        recipe: { 'cookies': 8 },
        difficulty: 'hard'
      },

      'nether_wart': {
        name: 'nether_wart',
        growthTime: 600000, // 10 minutes
        stages: 4,
        seedCost: 5, // Rare seed
        averageYield: 2,
        yieldVariation: 2,
        soilRequirement: 'soul_sand',
        waterRequired: false,
        lightLevel: 0,
        economicValue: 15,
        products: ['nether_wart'],
        recipe: { 'awkward_potion': 1 }, // For brewing
        difficulty: 'expert'
      }
    };

    for (const [crop, data] of Object.entries(cropData)) {
      this.crops.set(crop, {
        ...data,
        totalPlanted: 0,
        totalHarvested: 0,
        currentMarketPrice: data.economicValue,
        lastPriceUpdate: Date.now()
      });
    }
  }

  initializeLivestock() {
    // Define all farmable animals with breeding and production data
    const animalData = {
      'cow': {
        name: 'cow',
        breedingItem: 'wheat',
        breedingCooldown: 1200000, // 20 minutes
        products: ['raw_beef', 'leather', 'milk_bucket'],
        productionRate: { 'milk_bucket': 60000 }, // Every minute
        maturingTime: 1200000, // 20 minutes to adult
        economicValue: 25,
        feedCost: 2,
        spaceRequired: 9, // 3x3 area
        difficulty: 'easy'
      },

      'pig': {
        name: 'pig',
        breedingItem: 'carrot',
        breedingCooldown: 1200000,
        products: ['raw_porkchop'],
        maturingTime: 1200000,
        economicValue: 20,
        feedCost: 1.5,
        spaceRequired: 9,
        difficulty: 'easy'
      },

      'chicken': {
        name: 'chicken',
        breedingItem: 'wheat_seeds',
        breedingCooldown: 1200000,
        products: ['raw_chicken', 'feather', 'egg'],
        productionRate: { 'egg': 420000 }, // Every 7 minutes
        maturingTime: 1200000,
        economicValue: 15,
        feedCost: 1,
        spaceRequired: 4, // 2x2 area
        difficulty: 'easy'
      },

      'sheep': {
        name: 'sheep',
        breedingItem: 'wheat',
        breedingCooldown: 1200000,
        products: ['raw_mutton', 'white_wool'],
        productionRate: { 'white_wool': 0 }, // Shearable, not automatic
        maturingTime: 1200000,
        economicValue: 18,
        feedCost: 2,
        spaceRequired: 9,
        difficulty: 'medium'
      },

      'rabbit': {
        name: 'rabbit',
        breedingItem: 'carrot',
        breedingCooldown: 600000, // 10 minutes
        products: ['raw_rabbit', 'rabbit_hide'],
        maturingTime: 600000,
        economicValue: 12,
        feedCost: 1,
        spaceRequired: 4,
        difficulty: 'medium'
      },

      'llama': {
        name: 'llama',
        breedingItem: 'hay_bale',
        breedingCooldown: 1800000, // 30 minutes
        products: [], // Mainly for transportation and storage
        maturingTime: 1800000,
        economicValue: 35,
        feedCost: 5,
        spaceRequired: 16, // 4x4 area
        utility: 'transport', // Can carry items
        difficulty: 'hard'
      },

      'bee': {
        name: 'bee',
        breedingItem: 'flower',
        breedingCooldown: 600000,
        products: ['honey_bottle', 'honeycomb'],
        productionRate: { 'honey_bottle': 180000 }, // Every 3 minutes
        maturingTime: 600000,
        economicValue: 30,
        feedCost: 0.5, // Feeds itself from flowers
        spaceRequired: 1,
        special: 'pollination', // Boosts crop growth
        difficulty: 'expert'
      }
    };

    for (const [animal, data] of Object.entries(animalData)) {
      this.livestock.set(animal, {
        ...data,
        totalBred: 0,
        currentPopulation: 0,
        currentMarketPrice: data.economicValue,
        lastPriceUpdate: Date.now()
      });
    }
  }

  // Farm creation and management
  createFarm(ownerName, farmName, location, size, specialization = 'mixed') {
    const farmId = this.generateFarmId();
    
    const farm = {
      id: farmId,
      name: farmName,
      owner: ownerName,
      location: location, // {x, y, z}
      size: size, // {width, length}
      specialization, // 'crops', 'livestock', 'mixed', 'specialty'
      
      // Infrastructure
      plots: new Map(), // plot_id -> plot data
      buildings: [],
      irrigation: false,
      fencing: false,
      lighting: false,
      
      // Production data
      crops: new Map(), // crop_type -> quantity growing
      animals: new Map(), // animal_type -> animal data
      inventory: new Map(), // stored resources
      
      // Economics
      totalInvestment: 0,
      totalRevenue: 0,
      monthlyProfit: 0,
      
      // Management
      automationLevel: 0, // 0-100% automated
      efficiency: 50, // 0-100% efficiency
      lastTended: Date.now(),
      
      createdAt: Date.now(),
      isActive: true
    };

    this.farms.set(farmId, farm);
    
    console.log(`🌾 Farm created: "${farmName}" by ${ownerName} (${specialization}, ${size.width}x${size.length})`);
    
    return { success: true, farmId, farm };
  }

  // Crop management
  plantCrop(farmId, cropType, quantity, plotLocation = null) {
    const farm = this.farms.get(farmId);
    const crop = this.crops.get(cropType);
    
    if (!farm || !crop) {
      return { success: false, reason: 'Invalid farm or crop type' };
    }

    // Check if owner can afford seeds
    if (this.economySystem) {
      const seedCost = crop.seedCost * quantity;
      const wallet = this.economySystem.getPlayerWallet(farm.owner);
      
      if (wallet.coins < seedCost) {
        return { success: false, reason: 'Insufficient funds for seeds' };
      }
      
      wallet.coins -= seedCost;
      farm.totalInvestment += seedCost;
    }

    // Create planting task
    const taskId = this.generateTaskId();
    const plantingTime = Date.now();
    const harvestTime = plantingTime + crop.growthTime;
    
    const task = {
      id: taskId,
      type: 'harvest',
      farmId: farmId,
      cropType: cropType,
      quantity: quantity,
      plantedAt: plantingTime,
      harvestAt: harvestTime,
      location: plotLocation,
      status: 'growing'
    };

    this.farmingTasks.set(taskId, task);
    this.harvestSchedule.push(task);
    
    // Update farm data
    const currentCrops = farm.crops.get(cropType) || 0;
    farm.crops.set(cropType, currentCrops + quantity);
    
    // Update global crop data
    crop.totalPlanted += quantity;
    
    // Schedule automatic harvest
    setTimeout(() => {
      this.autoHarvest(taskId);
    }, crop.growthTime);

    console.log(`🌱 Planted ${quantity}x ${cropType} at ${farm.name} (harvest in ${Math.round(crop.growthTime / 60000)} minutes)`);
    
    return { success: true, taskId, harvestTime };
  }

  autoHarvest(taskId) {
    const task = this.farmingTasks.get(taskId);
    if (!task || task.status !== 'growing') return;

    const farm = this.farms.get(task.farmId);
    const crop = this.crops.get(task.cropType);
    
    if (!farm || !crop) return;

    // Calculate yield with variation
    const baseYield = crop.averageYield * task.quantity;
    const variation = (Math.random() - 0.5) * crop.yieldVariation * 2 * task.quantity;
    const totalYield = Math.max(1, Math.floor(baseYield + variation));
    
    // Apply farm efficiency bonus
    const efficiencyBonus = farm.efficiency / 100;
    const finalYield = Math.floor(totalYield * (1 + efficiencyBonus * 0.5));

    // Add to farm inventory
    const currentInventory = farm.inventory.get(task.cropType) || 0;
    farm.inventory.set(task.cropType, currentInventory + finalYield);
    
    // Update economics if system available
    if (this.economySystem) {
      this.economySystem.addResource(farm.owner, task.cropType, finalYield);
      
      const revenue = finalYield * crop.economicValue;
      farm.totalRevenue += revenue;
      
      // Update market prices based on supply
      this.economySystem.updateMarketData(task.cropType, finalYield, 'sell');
    }

    // Update global data
    crop.totalHarvested += finalYield;
    
    // Update task
    task.status = 'harvested';
    task.yield = finalYield;
    task.harvestedAt = Date.now();
    
    // Remove from active crops
    const currentCrops = farm.crops.get(task.cropType) || 0;
    farm.crops.set(task.cropType, Math.max(0, currentCrops - task.quantity));

    console.log(`🌾 Auto-harvested ${finalYield}x ${task.cropType} from ${farm.name} (${task.quantity} plants -> ${finalYield} yield)`);
    
    return { success: true, yield: finalYield };
  }

  // Livestock management
  addAnimal(farmId, animalType, quantity = 1) {
    const farm = this.farms.get(farmId);
    const animal = this.livestock.get(animalType);
    
    if (!farm || !animal) {
      return { success: false, reason: 'Invalid farm or animal type' };
    }

    // Check space requirements
    const requiredSpace = animal.spaceRequired * quantity;
    const availableSpace = this.calculateAvailableSpace(farm);
    
    if (requiredSpace > availableSpace) {
      return { success: false, reason: 'Insufficient space for animals' };
    }

    // Check cost
    if (this.economySystem) {
      const cost = animal.economicValue * quantity;
      const wallet = this.economySystem.getPlayerWallet(farm.owner);
      
      if (wallet.coins < cost) {
        return { success: false, reason: 'Insufficient funds for animals' };
      }
      
      wallet.coins -= cost;
      farm.totalInvestment += cost;
    }

    // Add animals to farm
    const currentAnimals = farm.animals.get(animalType) || { count: 0, adults: 0, babies: 0 };
    currentAnimals.count += quantity;
    currentAnimals.adults += quantity; // Assume bought animals are adults
    farm.animals.set(animalType, currentAnimals);
    
    // Update global data
    animal.totalBred += quantity;
    animal.currentPopulation += quantity;
    
    // Set up production schedules for producing animals
    if (animal.productionRate) {
      this.setupAnimalProduction(farmId, animalType, quantity);
    }

    console.log(`🐄 Added ${quantity}x ${animalType} to ${farm.name}`);
    
    return { success: true };
  }

  setupAnimalProduction(farmId, animalType, quantity) {
    const animal = this.livestock.get(animalType);
    if (!animal.productionRate) return;

    for (const [product, interval] of Object.entries(animal.productionRate)) {
      const productionLoop = setInterval(() => {
        this.produceAnimalProduct(farmId, animalType, product, quantity);
      }, interval);
      
      // Store interval ID for cleanup (would need better management in production)
      if (!this.productionIntervals) this.productionIntervals = new Map();
      this.productionIntervals.set(`${farmId}_${animalType}_${product}`, productionLoop);
    }
  }

  produceAnimalProduct(farmId, animalType, product, animalCount) {
    const farm = this.farms.get(farmId);
    if (!farm || !farm.isActive) return;

    const animals = farm.animals.get(animalType);
    if (!animals || animals.adults === 0) return;

    // Calculate production based on adult animals
    const productionAmount = Math.floor(animals.adults * 0.8); // 80% of adults produce

    if (productionAmount > 0) {
      // Add to farm inventory
      const currentInventory = farm.inventory.get(product) || 0;
      farm.inventory.set(product, currentInventory + productionAmount);
      
      // Add to owner's resources
      if (this.economySystem) {
        this.economySystem.addResource(farm.owner, product, productionAmount);
        
        const animal = this.livestock.get(animalType);
        const revenue = productionAmount * (animal.economicValue * 0.1); // 10% of animal value per production
        farm.totalRevenue += revenue;
      }

      console.log(`🥛 ${farm.name} produced ${productionAmount}x ${product} from ${animalType}s`);
    }
  }

  // Breeding system
  breedAnimals(farmId, animalType) {
    const farm = this.farms.get(farmId);
    const animal = this.livestock.get(animalType);
    
    if (!farm || !animal) {
      return { success: false, reason: 'Invalid farm or animal type' };
    }

    const animals = farm.animals.get(animalType);
    if (!animals || animals.adults < 2) {
      return { success: false, reason: 'Need at least 2 adult animals to breed' };
    }

    // Check if we have breeding items
    const breedingItemCost = 2; // Need 2 items to breed
    if (this.economySystem) {
      if (!this.economySystem.hasResource(farm.owner, animal.breedingItem, breedingItemCost)) {
        return { success: false, reason: `Need ${breedingItemCost}x ${animal.breedingItem} for breeding` };
      }
      
      this.economySystem.removeResource(farm.owner, animal.breedingItem, breedingItemCost);
    }

    // Create baby animals
    const babies = 1; // Usually 1 baby per breeding
    animals.babies += babies;
    animals.count += babies;
    
    farm.animals.set(animalType, animals);
    
    // Schedule maturation
    setTimeout(() => {
      this.matureAnimals(farmId, animalType, babies);
    }, animal.maturingTime);

    console.log(`💕 Bred ${animalType}s at ${farm.name} - ${babies} babies born`);
    
    return { success: true, babies };
  }

  matureAnimals(farmId, animalType, quantity) {
    const farm = this.farms.get(farmId);
    if (!farm) return;

    const animals = farm.animals.get(animalType);
    if (!animals) return;

    animals.babies = Math.max(0, animals.babies - quantity);
    animals.adults += quantity;
    
    farm.animals.set(animalType, animals);

    console.log(`🐄 ${quantity}x ${animalType} matured to adults at ${farm.name}`);
  }

  // Farm automation and AI
  optimizeFarm(farmId) {
    const farm = this.farms.get(farmId);
    if (!farm) return false;

    // Calculate optimal crop rotation
    const optimalCrops = this.calculateOptimalCrops(farm);
    
    // Suggest infrastructure improvements
    const improvements = this.suggestImprovements(farm);
    
    // Update efficiency based on infrastructure
    farm.efficiency = this.calculateEfficiency(farm);
    
    console.log(`🚜 Optimized ${farm.name} - Efficiency: ${farm.efficiency}%`);
    
    return {
      optimalCrops,
      improvements,
      efficiency: farm.efficiency
    };
  }

  calculateOptimalCrops(farm) {
    // Simple optimization - prefer high-value, fast-growing crops
    const profitableCrops = [];
    
    for (const [cropName, crop] of this.crops) {
      const profitPerHour = (crop.economicValue * crop.averageYield) / (crop.growthTime / 3600000);
      profitableCrops.push({ crop: cropName, profitPerHour, data: crop });
    }
    
    return profitableCrops
      .sort((a, b) => b.profitPerHour - a.profitPerHour)
      .slice(0, 5);
  }

  suggestImprovements(farm) {
    const improvements = [];
    
    if (!farm.irrigation) {
      improvements.push({ type: 'irrigation', cost: 200, benefit: '+20% growth speed' });
    }
    
    if (!farm.fencing) {
      improvements.push({ type: 'fencing', cost: 100, benefit: 'Animal protection' });
    }
    
    if (!farm.lighting) {
      improvements.push({ type: 'lighting', cost: 150, benefit: 'Night growth' });
    }
    
    return improvements;
  }

  calculateEfficiency(farm) {
    let efficiency = 50; // Base efficiency
    
    if (farm.irrigation) efficiency += 15;
    if (farm.fencing) efficiency += 10;
    if (farm.lighting) efficiency += 10;
    
    // Automation bonus
    efficiency += farm.automationLevel * 0.3;
    
    return Math.min(100, efficiency);
  }

  calculateAvailableSpace(farm) {
    const totalSpace = farm.size.width * farm.size.length;
    let usedSpace = 0;
    
    // Calculate space used by animals
    for (const [animalType, animals] of farm.animals) {
      const animal = this.livestock.get(animalType);
      if (animal) {
        usedSpace += animals.count * animal.spaceRequired;
      }
    }
    
    return Math.max(0, totalSpace - usedSpace);
  }

  // Farm economics integration
  calculateFarmValue(farmId) {
    const farm = this.farms.get(farmId);
    if (!farm) return 0;

    let totalValue = 0;
    
    // Infrastructure value
    totalValue += farm.totalInvestment * 0.8; // Depreciation
    
    // Inventory value
    for (const [item, quantity] of farm.inventory) {
      if (this.economySystem) {
        totalValue += quantity * this.economySystem.getResourceValue(item);
      }
    }
    
    // Animal value
    for (const [animalType, animals] of farm.animals) {
      const animal = this.livestock.get(animalType);
      if (animal) {
        totalValue += animals.count * animal.economicValue * 0.9; // Livestock depreciation
      }
    }
    
    return totalValue;
  }

  // Utility functions
  generateFarmId() {
    return 'farm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateTaskId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Market integration
  updateMarketPrices() {
    // Update crop prices based on supply/demand
    for (const [cropName, crop] of this.crops) {
      if (this.economySystem) {
        const marketData = this.economySystem.resources.get(cropName);
        if (marketData) {
          crop.currentMarketPrice = marketData.currentPrice;
          crop.lastPriceUpdate = Date.now();
        }
      }
    }
  }

  // Serialization
  toJSON() {
    return {
      farms: Array.from(this.farms.entries()),
      crops: Array.from(this.crops.entries()),
      livestock: Array.from(this.livestock.entries()),
      farmingTasks: Array.from(this.farmingTasks.entries()),
      harvestSchedule: this.harvestSchedule,
      breedingPrograms: Array.from(this.breedingPrograms.entries())
    };
  }

  fromJSON(data) {
    if (data.farms) this.farms = new Map(data.farms);
    if (data.crops) this.crops = new Map(data.crops);
    if (data.livestock) this.livestock = new Map(data.livestock);
    if (data.farmingTasks) this.farmingTasks = new Map(data.farmingTasks);
    if (data.harvestSchedule) this.harvestSchedule = data.harvestSchedule;
    if (data.breedingPrograms) this.breedingPrograms = new Map(data.breedingPrograms);
    
    // Restart production timers and harvest schedules
    this.restartProductionSystems();
  }

  restartProductionSystems() {
    // Restart animal production
    for (const [farmId, farm] of this.farms) {
      for (const [animalType, animals] of farm.animals) {
        if (animals.adults > 0) {
          this.setupAnimalProduction(farmId, animalType, animals.adults);
        }
      }
    }
    
    // Restart crop timers for growing crops
    for (const task of this.harvestSchedule) {
      if (task.status === 'growing' && task.harvestAt > Date.now()) {
        const remainingTime = task.harvestAt - Date.now();
        setTimeout(() => {
          this.autoHarvest(task.id);
        }, remainingTime);
      }
    }
  }
}

module.exports = FarmingSystem;