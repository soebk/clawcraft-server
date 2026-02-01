# Minecraft Crafting & Building Skills for AI Agents

## Complete Crafting Recipe System

### Essential Crafting Patterns

#### Tool Crafting Patterns
```
Pickaxe:     Axe:        Sword:      Shovel:
[M][M][M]    [M][M]      [M]         [M]
[ ][S][ ]    [M][S]      [M]         [S]  
[ ][S][ ]    [ ][S]      [S]         [S]

M = Material (wood, stone, iron, diamond)
S = Stick
```

#### Basic Items
```javascript
// All essential crafting recipes
const recipes = {
  // Tools
  wooden_pickaxe: [['planks', 'planks', 'planks'], [null, 'stick', null], [null, 'stick', null]],
  stone_pickaxe: [['cobblestone', 'cobblestone', 'cobblestone'], [null, 'stick', null], [null, 'stick', null]],
  iron_pickaxe: [['iron_ingot', 'iron_ingot', 'iron_ingot'], [null, 'stick', null], [null, 'stick', null]],
  diamond_pickaxe: [['diamond', 'diamond', 'diamond'], [null, 'stick', null], [null, 'stick', null]],
  
  // Weapons
  wooden_sword: [[null, 'planks', null], [null, 'planks', null], [null, 'stick', null]],
  stone_sword: [[null, 'cobblestone', null], [null, 'cobblestone', null], [null, 'stick', null]],
  iron_sword: [[null, 'iron_ingot', null], [null, 'iron_ingot', null], [null, 'stick', null]],
  diamond_sword: [[null, 'diamond', null], [null, 'diamond', null], [null, 'stick', null]],
  
  // Basic items
  crafting_table: [['planks', 'planks'], ['planks', 'planks']],
  stick: [['planks'], ['planks']],
  torch: [['coal'], ['stick']],
  chest: [['planks', 'planks', 'planks'], ['planks', null, 'planks'], ['planks', 'planks', 'planks']],
  bed: [['wool', 'wool', 'wool'], ['planks', 'planks', 'planks']],
  
  // Food
  bread: [['wheat', 'wheat', 'wheat']],
  cake: [['milk_bucket', 'milk_bucket', 'milk_bucket'], ['sugar', 'egg', 'sugar'], ['wheat', 'wheat', 'wheat']]
};
```

### Smart Crafting System
```javascript
async function smartCraft(itemName, quantity = 1) {
  const recipe = mcData.recipesByName[itemName];
  if (!recipe) {
    console.log(`No recipe found for ${itemName}`);
    return false;
  }
  
  // Check if we have materials
  const materials = getRequiredMaterials(recipe);
  const hasAllMaterials = checkMaterials(materials);
  
  if (!hasAllMaterials) {
    console.log(`Missing materials for ${itemName}`);
    await gatherMaterials(materials);
  }
  
  // Find or place crafting table if needed
  if (recipe.requiresTable) {
    await ensureCraftingTable();
  }
  
  try {
    await bot.craft(recipe, quantity);
    console.log(`Successfully crafted ${quantity}x ${itemName}`);
    return true;
  } catch (err) {
    console.log(`Failed to craft ${itemName}: ${err.message}`);
    return false;
  }
}
```

## Armor Crafting & Management

### Armor Sets (by priority)
1. **Leather** - Early game, easy to get
2. **Iron** - Best balance of protection/cost  
3. **Diamond** - Best protection, expensive
4. **Chain** - Rare, not craftable
5. **Gold** - Fast but weak

### Armor Crafting Patterns
```
Helmet:      Chestplate:   Leggings:    Boots:
[M][M][M]    [M][ ][M]     [M][M][M]    [M][ ][M]
[M][ ][M]    [M][M][M]     [M][ ][M]    [M][ ][M]
[ ][ ][ ]    [M][M][M]     [M][ ][M]    [ ][ ][ ]
```

### Auto-Equip Armor System
```javascript
async function equipBestArmor() {
  const armorSlots = ['helmet', 'chestplate', 'leggings', 'boots'];
  const armorPriority = ['diamond', 'iron', 'leather', 'gold'];
  
  for (const slot of armorSlots) {
    let bestArmor = null;
    let bestMaterial = null;
    
    for (const material of armorPriority) {
      const armorName = `${material}_${slot}`;
      const armor = bot.inventory.findInventoryItem(armorName);
      
      if (armor) {
        bestArmor = armor;
        bestMaterial = material;
        break;
      }
    }
    
    if (bestArmor) {
      await bot.equip(bestArmor, slot);
      console.log(`Equipped ${bestMaterial} ${slot}`);
    }
  }
}
```

## Advanced Building Patterns

### Efficient Building Algorithms

#### Wall Building
```javascript
async function buildWall(start, end, height = 3, material = 'cobblestone') {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.max(Math.abs(dx), Math.abs(dz));
  
  const stepX = dx / length;
  const stepZ = dz / length;
  
  for (let i = 0; i <= length; i++) {
    const x = Math.round(start.x + stepX * i);
    const z = Math.round(start.z + stepZ * i);
    
    for (let y = start.y; y < start.y + height; y++) {
      await placeBlockIfEmpty(new Vec3(x, y, z), material);
    }
  }
}
```

#### House Building Template
```javascript
async function buildBasicHouse(corner, width = 7, depth = 7, height = 4) {
  const materials = {
    walls: 'cobblestone',
    floor: 'planks', 
    roof: 'planks',
    door: 'wooden_door',
    windows: 'glass'
  };
  
  // Floor
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      await placeBlock(corner.offset(x, -1, z), materials.floor);
    }
  }
  
  // Walls
  for (let y = 0; y < height; y++) {
    // Front and back walls
    for (let x = 0; x < width; x++) {
      if (x === Math.floor(width/2) && y < 2 && z === 0) {
        // Door space
        continue;
      }
      await placeBlock(corner.offset(x, y, 0), materials.walls);
      await placeBlock(corner.offset(x, y, depth-1), materials.walls);
    }
    
    // Side walls
    for (let z = 1; z < depth-1; z++) {
      await placeBlock(corner.offset(0, y, z), materials.walls);
      await placeBlock(corner.offset(width-1, y, z), materials.walls);
    }
  }
  
  // Place door
  await placeBlock(corner.offset(Math.floor(width/2), 0, 0), materials.door);
  
  // Windows (if desired)
  await placeBlock(corner.offset(2, 1, 0), materials.windows);
  await placeBlock(corner.offset(width-3, 1, 0), materials.windows);
}
```

### Redstone Automation Basics

#### Simple Redstone Circuits
```javascript
// Auto-smelter setup
async function buildAutoSmelter(position) {
  const furnacePos = position;
  const hopperTop = position.offset(0, 1, 0);    // Input hopper
  const hopperSide = position.offset(1, 0, 0);   // Fuel hopper  
  const hopperBottom = position.offset(0, -1, 0); // Output hopper
  const chestBottom = position.offset(0, -2, 0);  // Output chest
  
  await placeBlock(furnacePos, 'furnace');
  await placeBlock(hopperTop, 'hopper');
  await placeBlock(hopperSide, 'hopper');
  await placeBlock(hopperBottom, 'hopper');
  await placeBlock(chestBottom, 'chest');
  
  console.log('Auto-smelter built! Put items in top hopper, fuel in side hopper.');
}

// Automatic farm watering
async function buildWaterSystem(farmArea) {
  const waterSources = [];
  
  // Water every 9 blocks (optimal range)
  for (let x = farmArea.x; x <= farmArea.x + farmArea.width; x += 9) {
    for (let z = farmArea.z; z <= farmArea.z + farmArea.depth; z += 9) {
      const waterPos = new Vec3(x, farmArea.y, z);
      
      // Dig hole and place water
      await bot.dig(bot.blockAt(waterPos));
      await placeBlock(waterPos, 'water');
      waterSources.push(waterPos);
    }
  }
  
  console.log(`Placed ${waterSources.length} water sources for farm irrigation`);
}
```

## Farming & Food Production

### Crop Farming System
```javascript
class FarmManager {
  constructor(bot) {
    this.bot = bot;
    this.crops = {
      wheat: { item: 'wheat', seed: 'wheat_seeds', growthTime: 8 },
      carrots: { item: 'carrot', seed: 'carrot', growthTime: 8 },
      potatoes: { item: 'potato', seed: 'potato', growthTime: 8 },
      beetroot: { item: 'beetroot', seed: 'beetroot_seeds', growthTime: 8 }
    };
  }
  
  async createFarm(corner, width, depth, cropType = 'wheat') {
    const crop = this.crops[cropType];
    if (!crop) return false;
    
    // Prepare farmland
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        const pos = corner.offset(x, 0, z);
        
        // Till the soil
        await this.bot.activateBlock(this.bot.blockAt(pos));
        
        // Plant seeds if available
        const seeds = this.bot.inventory.findInventoryItem(crop.seed);
        if (seeds) {
          await this.bot.equip(seeds, 'hand');
          await this.bot.activateBlock(this.bot.blockAt(pos.offset(0, 1, 0)));
        }
      }
    }
    
    console.log(`Created ${width}x${depth} ${cropType} farm`);
  }
  
  async harvestFarm(corner, width, depth) {
    let harvested = 0;
    
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        const pos = corner.offset(x, 1, z);
        const block = this.bot.blockAt(pos);
        
        // Check if crop is fully grown (age 7 for most crops)
        if (block && block.metadata === 7) {
          await this.bot.dig(block);
          harvested++;
          
          // Replant immediately
          const seedName = this.getSeedForBlock(block.name);
          const seeds = this.bot.inventory.findInventoryItem(seedName);
          if (seeds) {
            await this.bot.equip(seeds, 'hand');
            await this.bot.activateBlock(this.bot.blockAt(pos));
          }
        }
      }
    }
    
    console.log(`Harvested ${harvested} crops and replanted`);
    return harvested;
  }
}
```

### Animal Breeding System
```javascript
class AnimalManager {
  constructor(bot) {
    this.bot = bot;
    this.animalFoods = {
      cow: 'wheat',
      pig: 'carrot',
      chicken: 'wheat_seeds',
      sheep: 'wheat'
    };
  }
  
  async breedAnimals(animalType, count = 2) {
    const food = this.animalFoods[animalType];
    if (!food) return false;
    
    const foodItem = this.bot.inventory.findInventoryItem(food);
    if (!foodItem || foodItem.count < 2) {
      console.log(`Need at least 2 ${food} to breed ${animalType}`);
      return false;
    }
    
    // Find nearby animals of this type
    const animals = Object.values(this.bot.entities).filter(entity => 
      entity.mobType === animalType && 
      entity.position.distanceTo(this.bot.entity.position) < 10
    );
    
    if (animals.length < 2) {
      console.log(`Need at least 2 ${animalType} to breed`);
      return false;
    }
    
    // Breed first two animals found
    for (let i = 0; i < Math.min(2, animals.length); i++) {
      await this.bot.equip(foodItem, 'hand');
      await this.bot.activateEntity(animals[i]);
      await this.bot.waitForTicks(20); // Wait 1 second
    }
    
    console.log(`Bred ${animalType}s - baby will appear soon!`);
    return true;
  }
  
  async feedAnimals(animalType) {
    const food = this.animalFoods[animalType];
    const animals = Object.values(this.bot.entities).filter(entity => 
      entity.mobType === animalType && 
      entity.position.distanceTo(this.bot.entity.position) < 10
    );
    
    for (const animal of animals) {
      const foodItem = this.bot.inventory.findInventoryItem(food);
      if (foodItem) {
        await this.bot.equip(foodItem, 'hand');
        await this.bot.activateEntity(animal);
      }
    }
  }
}
```

## Storage & Organization Systems

### Smart Chest Organization
```javascript
class StorageManager {
  constructor(bot) {
    this.bot = bot;
    this.chestCategories = {
      tools: ['pickaxe', 'axe', 'sword', 'shovel', 'hoe'],
      blocks: ['cobblestone', 'stone', 'dirt', 'sand', 'gravel'],
      food: ['bread', 'cooked_beef', 'cooked_pork', 'apple'],
      materials: ['wood', 'iron_ingot', 'coal', 'diamond'],
      redstone: ['redstone', 'repeater', 'comparator', 'piston']
    };
  }
  
  async organizeInventory() {
    const nearbyChests = this.bot.findBlocks({
      matching: mcData.blocksByName.chest.id,
      maxDistance: 10,
      count: 20
    });
    
    if (nearbyChests.length === 0) {
      console.log('No chests found nearby for organization');
      return false;
    }
    
    // Sort inventory items by category
    for (const item of this.bot.inventory.items()) {
      const category = this.getItemCategory(item.name);
      const targetChest = this.getChestForCategory(category, nearbyChests);
      
      if (targetChest) {
        await this.depositToChest(targetChest, item);
      }
    }
  }
  
  getItemCategory(itemName) {
    for (const [category, items] of Object.entries(this.chestCategories)) {
      if (items.some(item => itemName.includes(item))) {
        return category;
      }
    }
    return 'misc';
  }
  
  async depositToChest(chestPos, item) {
    const chest = await this.bot.openChest(this.bot.blockAt(chestPos));
    
    try {
      await chest.deposit(item.type, item.metadata, item.count);
      console.log(`Deposited ${item.count}x ${item.name} to chest`);
    } catch (err) {
      console.log(`Chest full or error depositing ${item.name}`);
    } finally {
      chest.close();
    }
  }
}
```

### Auto-Sorting System
```javascript
async function buildSortingSystem(inputChest, outputChests) {
  // Simple item sorter using hoppers
  const hopperPos = inputChest.offset(0, -1, 0);
  
  await placeBlock(hopperPos, 'hopper');
  
  // Connect hoppers to different output chests
  for (let i = 0; i < outputChests.length; i++) {
    const hopperToChest = hopperPos.offset(i, 0, 0);
    await placeBlock(hopperToChest, 'hopper');
    await placeBlock(outputChests[i], 'chest');
  }
  
  console.log('Basic sorting system built!');
}
```

## Enchanting & Anvil Usage

### Enchantment Priority System
```javascript
const enchantmentPriority = {
  pickaxe: ['efficiency', 'fortune', 'unbreaking', 'mending'],
  sword: ['sharpness', 'looting', 'unbreaking', 'mending'],
  bow: ['power', 'infinity', 'unbreaking', 'punch'],
  armor: ['protection', 'unbreaking', 'mending', 'thorns']
};

async function enchantBest(tool) {
  const enchantingTable = bot.findBlock({
    matching: mcData.blocksByName.enchanting_table.id,
    maxDistance: 10
  });
  
  if (!enchantingTable) {
    console.log('No enchanting table found');
    return false;
  }
  
  const table = await bot.openEnchantmentTable(enchantingTable);
  
  try {
    // Choose best available enchantment
    const enchantments = await table.enchantments(tool);
    if (enchantments.length > 0) {
      const bestEnchant = enchantments[enchantments.length - 1]; // Highest level
      await table.enchant(bestEnchant);
      console.log(`Enchanted ${tool.name} with ${bestEnchant.name}`);
    }
  } finally {
    table.close();
  }
}
```

## Emergency Systems & Backup Plans

### Emergency Shelter (Quick Deploy)
```javascript
async function buildEmergencyShelter() {
  const pos = bot.entity.position.floored();
  const materials = ['cobblestone', 'dirt', 'wood', 'stone'];
  
  let buildMaterial = null;
  for (const mat of materials) {
    const item = bot.inventory.findInventoryItem(mat);
    if (item && item.count >= 20) {
      buildMaterial = mat;
      break;
    }
  }
  
  if (!buildMaterial) {
    console.log('Not enough materials for emergency shelter');
    return false;
  }
  
  // 3x3 shelter
  const shelter = [
    pos.offset(-1, 0, -1), pos.offset(0, 0, -1), pos.offset(1, 0, -1),
    pos.offset(-1, 0, 0),  /* center = player */,  pos.offset(1, 0, 0),
    pos.offset(-1, 0, 1),  pos.offset(0, 0, 1),  pos.offset(1, 0, 1)
  ];
  
  // Build walls 2 high
  for (const wallPos of shelter) {
    await placeBlock(wallPos, buildMaterial);
    await placeBlock(wallPos.offset(0, 1, 0), buildMaterial);
  }
  
  // Roof
  for (const roofPos of shelter) {
    await placeBlock(roofPos.offset(0, 2, 0), buildMaterial);
  }
  
  // Add torches for light
  await placeBlock(pos.offset(0, 1, 0), 'torch');
  
  console.log('Emergency shelter built!');
  return true;
}
```

### Backup Resource Cache
```javascript
async function createResourceCache(location) {
  const essentialItems = {
    food: 'cooked_beef',
    tools: ['iron_pickaxe', 'iron_sword'],
    blocks: 'cobblestone',
    torches: 'torch',
    emergency: ['water_bucket', 'bed']
  };
  
  // Build hidden chest storage
  await placeBlock(location.offset(0, -1, 0), 'chest');
  const chest = await bot.openChest(bot.blockAt(location.offset(0, -1, 0)));
  
  // Stock with essentials
  for (const [category, items] of Object.entries(essentialItems)) {
    if (Array.isArray(items)) {
      for (const item of items) {
        const stackItem = bot.inventory.findInventoryItem(item);
        if (stackItem) {
          await chest.deposit(stackItem.type, stackItem.metadata, Math.min(8, stackItem.count));
        }
      }
    } else {
      const stackItem = bot.inventory.findInventoryItem(items);
      if (stackItem) {
        await chest.deposit(stackItem.type, stackItem.metadata, Math.min(32, stackItem.count));
      }
    }
  }
  
  chest.close();
  
  // Hide with blocks
  await placeBlock(location, 'grass_block');
  
  console.log(`Emergency cache created at ${location.toString()}`);
}
```

## Performance Optimization

### Efficient Block Placement
```javascript
// Batch block operations for better performance
class BuildQueue {
  constructor(bot, maxOpsPerTick = 3) {
    this.bot = bot;
    this.queue = [];
    this.maxOpsPerTick = maxOpsPerTick;
    this.processing = false;
  }
  
  addBlock(position, blockType) {
    this.queue.push({ type: 'place', position, blockType });
  }
  
  addBreak(position) {
    this.queue.push({ type: 'break', position });
  }
  
  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    let opsThisTick = 0;
    
    while (this.queue.length > 0 && opsThisTick < this.maxOpsPerTick) {
      const operation = this.queue.shift();
      
      try {
        if (operation.type === 'place') {
          await placeBlock(operation.position, operation.blockType);
        } else if (operation.type === 'break') {
          await this.bot.dig(this.bot.blockAt(operation.position));
        }
        
        opsThisTick++;
      } catch (err) {
        console.log(`Operation failed: ${err.message}`);
      }
      
      // Small delay between operations
      await sleep(50);
    }
    
    this.processing = false;
    
    // Continue processing next tick if queue not empty
    if (this.queue.length > 0) {
      setTimeout(() => this.process(), 50);
    }
  }
}
```

This comprehensive crafting and building guide enables AI agents to create complex structures, automate resource production, and build sophisticated survival systems in Minecraft.