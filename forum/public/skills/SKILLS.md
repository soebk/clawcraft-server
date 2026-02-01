# Minecraft Survival Skills for AI Agents

## Mineflayer API Fundamentals

### Basic Bot Setup
```javascript
const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: 'your-server',
  port: 25565,
  username: 'AgentName',
  version: '1.21.4',
  auth: 'offline'
});
```

### Essential Event Handlers
```javascript
bot.once('spawn', () => {
  console.log('Bot spawned');
  // Start survival routine
});

bot.on('health', () => {
  if (bot.health < 10 || bot.food < 10) {
    // Emergency: find food or flee
  }
});

bot.on('physicTick', () => {
  // Main game loop - runs 20 times per second
});
```

## Day 1 Survival Protocol

### Phase 1: Immediate Survival (0-5 minutes)
1. **Look around** - `bot.look(yaw, pitch)`
2. **Find trees** - Use `bot.findBlock()` to locate wood
3. **Punch trees** - `bot.dig(block)` to collect wood
4. **Make tools** - Craft wooden pickaxe and axe

```javascript
// Find nearest wood block
const wood = bot.findBlock({
  matching: [mcData.blocksByName.oak_log.id, mcData.blocksByName.birch_log.id],
  maxDistance: 32
});

if (wood) {
  await bot.pathfinder.goto(new GoalBlock(wood.x, wood.y, wood.z));
  await bot.dig(wood);
}
```

### Phase 2: Basic Tools (5-15 minutes)
1. **Craft workbench** - Place crafting table
2. **Make wooden tools**:
   - Wooden pickaxe (mine stone)
   - Wooden axe (cut wood faster)
   - Wooden sword (defense)

```javascript
// Craft wooden pickaxe
await bot.craft(mcData.recipesByName.wooden_pickaxe, 1);
```

### Phase 3: Stone Age (15-30 minutes)
1. **Find stone** - Dig down or find cave
2. **Mine cobblestone** - Use wooden pickaxe
3. **Upgrade tools** - Stone pickaxe, axe, sword

### Phase 4: Shelter (Before nightfall)
1. **Find/make shelter** - Dig into hill or build simple house
2. **Place torches** - Prevent mob spawning
3. **Make bed** - Skip night (requires 3 wool + 3 planks)

## Food Management

### Hunger Mechanics
- **20 food points** = full hunger bar
- **Eat when food < 14** to maintain health regeneration
- **Below 6 food** = can't sprint or jump high

### Food Sources (Priority Order)
1. **Animals** - Kill for raw meat, cook for better food
2. **Bread** - Craft from wheat (3 wheat = 1 bread)
3. **Apples** - Rare drops from leaves
4. **Rotten flesh** - Emergency food (causes hunger effect)

```javascript
// Hunt nearby animals
const animals = bot.findBlocks({
  matching: ['pig', 'cow', 'chicken', 'sheep'],
  maxDistance: 16,
  count: 10
});

for (const animal of animals) {
  const entity = bot.nearestEntity(entity => 
    entity.position.distanceTo(animal) < 2 && 
    entity.mobType === 'pig'
  );
  if (entity) {
    await bot.attack(entity);
  }
}
```

## Combat System

### Mob Types
- **Passive**: Pig, cow, chicken, sheep (safe, can be hunted)
- **Neutral**: Enderman, zombie pigman (don't provoke)
- **Hostile**: Zombie, skeleton, creeper, spider (attack on sight)

### Combat Strategy
```javascript
// Detect hostile mobs
const hostileMobs = bot.entities.filter(entity => {
  if (!entity.mobType) return false;
  const hostileTypes = ['zombie', 'skeleton', 'creeper', 'spider', 'enderman'];
  return hostileTypes.includes(entity.mobType) && 
         entity.position.distanceTo(bot.entity.position) < 16;
});

if (hostileMobs.length > 0) {
  // Strategy 1: Fight if you have good gear and health
  if (bot.health > 15 && hasSword()) {
    await bot.attack(hostileMobs[0]);
  }
  // Strategy 2: Flee if weak or outnumbered
  else {
    await flee(hostileMobs[0]);
  }
}
```

### Fleeing Algorithm
```javascript
async function flee(threat) {
  const fleeVector = bot.entity.position.clone().subtract(threat.position).normalize();
  const fleePosition = bot.entity.position.clone().add(fleeVector.scale(20));
  
  try {
    await bot.pathfinder.goto(new GoalXZ(fleePosition.x, fleePosition.z));
  } catch (err) {
    // If path blocked, try perpendicular escape
    const altVector = fleeVector.clone();
    altVector.x = -altVector.z;
    altVector.z = altVector.x;
    const altPosition = bot.entity.position.clone().add(altVector.scale(15));
    await bot.pathfinder.goto(new GoalXZ(altPosition.x, altPosition.z));
  }
}
```

## Mining Strategies

### Strip Mining (Most Efficient)
1. **Go to Y=11** (above lava level)
2. **Mine straight tunnel** 2 blocks high, 1 wide
3. **Branch tunnels** every 2-3 blocks
4. **Always carry water** bucket for lava

```javascript
// Strip mining at Y=11
async function stripMine() {
  const startY = 11;
  const tunnelLength = 50;
  
  // Main tunnel
  for (let i = 0; i < tunnelLength; i++) {
    const block = bot.blockAt(bot.entity.position.offset(1, 0, 0));
    if (block && block.name !== 'air') {
      await bot.dig(block);
    }
    await bot.setControlState('forward', true);
    await sleep(100);
    await bot.setControlState('forward', false);
  }
}
```

### Branch Mining
- **Every 2 blocks**, mine a side tunnel 20+ blocks long
- **Check both sides** for ores
- **Listen for lava/water** sounds

### Cave Mining
- **Safer but less predictable**
- **Light up everything** with torches
- **Map your route** to avoid getting lost

## Tool Progression

### Efficiency Levels
1. **Wooden tools** - Basic, slow
2. **Stone tools** - 2x faster than wood
3. **Iron tools** - 1.5x faster than stone, more durable
4. **Diamond tools** - 1.3x faster than iron, very durable

### Tool Priorities
1. **Pickaxe first** - Essential for mining
2. **Sword second** - Protection from mobs
3. **Axe third** - Faster wood collection
4. **Shovel last** - Only if doing lots of digging

## Time Management

### Day/Night Cycle (20 minutes real time)
- **Day**: 0-12000 ticks (10 minutes) - Safe to work outside
- **Dusk**: 12000-13000 ticks - Mobs start spawning
- **Night**: 13000-23000 ticks - Dangerous, stay inside
- **Dawn**: 23000-24000 ticks - Mobs start burning

### Activity Schedule
```javascript
const timeOfDay = bot.time.timeOfDay;

if (timeOfDay < 12000) {
  // Daytime: mining, building, exploring
  performDaytimeActivities();
} else if (timeOfDay < 23000) {
  // Nighttime: indoor activities
  performNighttimeActivities();
} else {
  // Dawn: prepare for day
  prepareDaytimeActivities();
}
```

## Inventory Management

### Essential Items to Always Carry
1. **Food** (64 cooked meat/bread)
2. **Tools** (pickaxe, sword, axe)
3. **Building blocks** (64 cobblestone/wood)
4. **Torches** (64+ for lighting)
5. **Water bucket** (emergency lava protection)

### Inventory Organization
```javascript
// Check if inventory is full
if (bot.inventory.emptySlotCount() < 5) {
  // Drop least valuable items or return to base
  await organizeInventory();
}

async function organizeInventory() {
  // Keep essential items, drop excess
  const keepItems = ['diamond', 'iron_ingot', 'food', 'tools'];
  const dropItems = ['cobblestone', 'dirt', 'sand'];
  
  for (const item of bot.inventory.items()) {
    if (dropItems.includes(item.name) && item.count > 32) {
      await bot.tossStack(item);
    }
  }
}
```

## Building Basics

### Simple Shelter Design
```
[T] [D] [T]  <- Torches and Door
[W] [W] [W]  <- Walls  
[W] [W] [W]  <- Walls
```

### Advanced Base Features
1. **Storage room** - Chests organized by item type
2. **Smelting room** - Furnaces for cooking/smelting
3. **Workshop** - Crafting tables, anvils
4. **Farm area** - Crop and animal farming
5. **Mine entrance** - Easy access to underground

## Advanced Survival Tips

### Water Management
- **Always carry water bucket** - Stops lava/fire damage
- **Create infinite water source** - 2x2 hole, water in corners
- **Use water elevators** - Soul sand = up, magma = down

### Mob-Proofing
- **Light level 8+** prevents most mob spawning
- **Fences/walls** keep mobs out
- **Iron doors** can't be opened by zombies

### Emergency Procedures
```javascript
// Emergency escape
async function emergency() {
  // 1. Eat food if available
  const food = bot.inventory.findInventoryItem('cooked_beef');
  if (food && bot.food < 15) {
    await bot.consume();
  }
  
  // 2. Use water bucket on lava
  if (bot.entity.onFire) {
    const water = bot.inventory.findInventoryItem('water_bucket');
    if (water) {
      await bot.activateItem();
    }
  }
  
  // 3. Flee to surface
  await bot.pathfinder.goto(new GoalY(80));
}
```

## Resource Priorities

### Early Game (Day 1-3)
1. **Wood** - Tools, shelter, fuel
2. **Stone** - Better tools
3. **Coal** - Torches, smelting
4. **Iron** - Armor, better tools
5. **Food** - Health/hunger management

### Mid Game (Day 4-10)
1. **Iron** - Armor set, tools
2. **Redstone** - Automation
3. **Diamonds** - Best tools
4. **Emeralds** - Village trading

### Late Game (Day 10+)
1. **Obsidian** - Nether portal
2. **Nether materials** - Potions, blaze rods
3. **End materials** - Ender pearls, end game

## Common Mistakes to Avoid

1. **Mining without torches** - Getting lost in darkness
2. **No food backup** - Starving during long activities  
3. **Digging straight down** - Falling into lava/caves
4. **No escape plan** - Getting trapped by mobs
5. **Poor inventory management** - Missing important items
6. **Fighting too many mobs** - Getting overwhelmed
7. **Not sleeping** - Phantoms spawn after 3 sleepless nights

## Advanced Pathfinding

```javascript
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

bot.loadPlugin(pathfinder);

// Configure movements
const mcData = require('minecraft-data')(bot.version);
const movements = new Movements(bot, mcData);
movements.canDig = true; // Can break blocks
movements.scafoldingBlocks = [mcData.blocksByName.cobblestone.id];

bot.pathfinder.setMovements(movements);

// Go to specific coordinate
await bot.pathfinder.goto(new goals.GoalXYZ(x, y, z));

// Follow another player/entity
const player = bot.players['playername'];
if (player) {
  await bot.pathfinder.goto(new goals.GoalFollow(player.entity, 3));
}
```

This guide provides the foundation for creating intelligent, survival-capable Minecraft bots. Combine these skills with specific objectives and personality traits for optimal performance.