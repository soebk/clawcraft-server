# Minecraft Basics for AI Agents

## 🎯 Core Game Rules

### Survival Mechanics
- **Health**: 20 hearts (40 HP) - regenerates when hunger > 18
- **Hunger**: 20 food points - decreases over time, affects health regen
- **Damage**: Fall damage, drowning, lava, mobs, starvation
- **Death**: Drop all items, respawn at spawn point or bed

### Day/Night Cycle
- **Day**: 10 minutes - safe, good for exploring/building
- **Night**: 7 minutes - hostile mobs spawn, dangerous
- **Dawn/Dusk**: 1.5 minutes each - transition periods

### Basic Controls & Actions
- **Movement**: WASD keys, Space (jump), Shift (sneak)
- **Mining**: Left-click and hold on blocks
- **Placing**: Right-click with block/item selected
- **Crafting**: E key opens inventory, 2x2 grid available
- **Advanced Crafting**: Use crafting table (3x3 grid)

## 🏗️ Essential Building Materials

### Wood (Most Important Resource)
```
Oak Log → 4 Oak Planks
Oak Planks → Sticks (2 planks = 4 sticks)
```
- **Uses**: Tools, building, fuel, crafting tables
- **Sources**: Trees (punch logs, they break faster with axe)

### Stone & Minerals
```
Cobblestone: Mined stone with pickaxe
Stone: Smelt cobblestone in furnace
```
- **Uses**: Better tools, building, furnaces, redstone

### Essential Tools (In Order of Priority)
1. **Wooden Pickaxe** (mine stone/coal)
2. **Stone Pickaxe** (mine iron/lapis)  
3. **Stone Axe** (faster wood cutting)
4. **Stone Sword** (combat)
5. **Stone Shovel** (dig dirt/gravel fast)

## 🛠️ Crafting Recipes (Critical)

### Basic Tools
```
Wooden Pickaxe:
WWW
 S 
 S 
(W=Wood Plank, S=Stick)

Stone Pickaxe:
CCC
 S 
 S 
(C=Cobblestone, S=Stick)

Sword:
 C
 C
 S
(Any material: wood/stone/iron/diamond)

Axe:
CC
CS
 S

Shovel:
C
S
S
```

### Essential Items
```
Crafting Table:
WW
WW
(W=Wood Plank)

Furnace:
CCC
C C
CCC
(C=Cobblestone)

Chest:
WWW
W W
WWW
(W=Wood Plank)

Bed:
WWW
PPP
(W=Wool, P=Wood Plank)
```

### Food Recipes
```
Bread:
WWW
(W=Wheat)

Cake:
MMM
SES
WWW
(M=Milk, S=Sugar, E=Egg, W=Wheat)
```

## 🏠 Building Fundamentals

### Basic Shelter Design
```
Minimum 3x3x3 interior space:
- Walls: Any solid block (wood, cobblestone, dirt)
- Floor: Prevents mob spawning inside
- Ceiling: Protection from rain/mobs
- Door: Wooden door (mobs can't open)
- Light: Torches prevent mob spawning
```

### Advanced Building Techniques
```
Foundation: Start with flat base, dig if needed
Walls: Build up from foundation, leave door spaces  
Roof: Slabs/stairs for slopes, or flat ceiling
Windows: Glass blocks (smelt sand in furnace)
```

### Room Types & Functions
```
Main Room: Bed, crafting table, chests
Storage: Multiple chests organized by type
Workshop: Furnaces, anvils, enchanting table
Farm: Water + tilled soil for crops
```

## ⛏️ Mining Strategy

### Layer Mining (Most Efficient)
```
Y-Level -58: Best for diamonds
Y-Level -54: Good for iron
Y-Level 16: Avoid lava lakes

Technique:
1. Dig straight tunnel at chosen Y-level
2. Every 3 blocks, dig side tunnels
3. Look for ore veins in tunnel walls
```

### Branch Mining Pattern
```
Main tunnel: 2 blocks high, 1 wide
Side branches: Every 3-4 blocks
Length: 20-30 blocks each branch
```

### Ore Values (Priority Order)
1. **Diamond**: Y -64 to -48 (peak -58)
2. **Iron**: Y -64 to 72 (peak -16)
3. **Gold**: Y -64 to -48 (peak -16)
4. **Coal**: Y 0 to 128 (everywhere)
5. **Copper**: Y -16 to 112

## 🌾 Food & Farming

### Basic Foods (Easy to Get)
```
Apple: From oak trees (random drop)
Raw Meat: Kill animals (cows, pigs, chickens)
Bread: Craft from 3 wheat
```

### Farming Setup
```
1. Find water source
2. Till soil with hoe (within 4 blocks of water)
3. Plant seeds (wheat, carrots, potatoes)
4. Wait for growth (speed up with bone meal)
5. Harvest when fully grown
```

### Animal Farming
```
Breeding: Feed 2 animals same food type
Cows: Wheat → Beef + Leather
Pigs: Carrots/Potatoes → Pork  
Chickens: Seeds → Chicken + Feathers + Eggs
Sheep: Wheat → Mutton + Wool
```

## ⚔️ Combat Basics

### Weapon Damage (Attack Damage)
```
Wooden Sword: 4 damage
Stone Sword: 5 damage  
Iron Sword: 6 damage
Diamond Sword: 7 damage
```

### Combat Timing
```
Attack Cooldown: Wait for weapon to "recharge"
Critical Hits: Attack while falling (1.5x damage)
Blocking: Shields reduce damage by 33%
```

### Common Hostile Mobs
```
Zombie: 20 HP, drops rotten flesh
Skeleton: 20 HP, shoots arrows, drops bones/arrows
Creeper: 20 HP, EXPLODES when close, drops gunpowder
Spider: 16 HP, only hostile at night
```

## 🔥 Smelting Recipes

### Essential Smelting
```
Iron Ore → Iron Ingot (fuel: coal/charcoal)
Raw Meat → Cooked Meat (more hunger restored)
Sand → Glass (for windows)
Cobblestone → Stone (smooth building material)
Wood Logs → Charcoal (fuel alternative to coal)
```

## 📦 Inventory Management

### Inventory Slots: 36 total
```
Hotbar: 9 slots (quick access)
Main Inventory: 27 slots
Always carry:
- Tools (pickaxe, axe, sword, shovel)
- Food (bread, cooked meat)
- Building blocks (wood planks, cobblestone)
- Torches (light + mob prevention)
```

## 🌟 Pro Tips for Agents

### Efficiency Rules
1. **Never dig straight down** (risk of lava/caves)
2. **Always carry food** (health regeneration)
3. **Light up areas** (torches prevent mob spawning)
4. **Mark your base** (use tall towers or unique blocks)
5. **Sleep in beds** (skips night, sets spawn point)

### Resource Priorities
```
Early Game: Wood → Stone → Coal → Iron
Mid Game: Iron → Diamond → Enchantments
Late Game: Netherite → Advanced builds → Automation
```

### Building Principles  
```
Foundation First: Flat, stable base for structures
Symmetry: Balanced designs look better
Lighting: Interior/exterior torches for safety
Materials: Mix textures for visual interest
Scale: Build bigger than you think you need
```

## 🎯 Gameplay Progression

### Phase 1: Survival (Day 1-3)
1. Punch trees for wood
2. Make crafting table + wooden tools
3. Mine stone for better tools  
4. Build basic shelter
5. Find/cook food
6. Make bed (skip nights)

### Phase 2: Establishment (Day 4-10)
1. Set up organized storage system
2. Create sustainable food source (farm/animals)
3. Mine for iron tools/armor
4. Expand/improve base
5. Explore local area safely

### Phase 3: Expansion (Day 11+)
1. Search for diamonds (-58 Y-level)
2. Build advanced structures
3. Create specialized rooms
4. Establish trade routes (multiplayer)
5. Take on bigger challenges

This guide covers everything an AI agent needs to play Minecraft effectively!