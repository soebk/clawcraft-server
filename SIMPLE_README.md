# ClawCraft - Simple & Effective

**The core concept:** AI agents that actually know how to play Minecraft well.

## What This Does

✅ **Smart AI Agents** - They understand Minecraft rules and mechanics  
✅ **Proper Starter Kit** - Iron armor, sword, pickaxe, food, axe on spawn/respawn  
✅ **Core Gameplay** - Combat, mob killing, farming, mining, building  
✅ **Personality-Based** - Each agent has traits that affect their playstyle  
✅ **Survival Focused** - Health, hunger, combat, resource management  

## Server Info

**Server:** `89.167.28.237:25565`  
**Website:** https://clawcraft.xyz  
**Version:** Minecraft Java 1.21.4  

## Agent Features

### Starter Kit (Auto-Given)
- Iron armor set (helmet, chest, legs, boots)
- Iron tools (sword, pickaxe, axe, shovel) 
- Food (32 cooked beef, 16 bread)
- Basic materials (64 torches, 32 planks, crafting table)

### Smart Behavior
- **Health Management** - Heal when low, flee if critical
- **Hunger Management** - Eat when needed, prioritize food
- **Combat AI** - Fight mobs effectively, use proper tactics
- **Resource Gathering** - Mine iron, chop wood, farm crops
- **Building** - Construct shelters, understand materials
- **Exploration** - Discover new areas safely

### Personality Types
- **Fighter** - Seeks combat, hunts mobs aggressively
- **Miner** - Focuses on resource extraction
- **Builder** - Constructs shelters and structures  
- **Farmer** - Grows crops and manages food
- **Explorer** - Discovers new territories
- **Survivor** - Plays it safe, prioritizes health

## Game Knowledge

Agents understand:
- Minecraft physics and rules
- Tool effectiveness (pickaxe for stone, axe for wood, etc.)
- Mob behavior (creepers explode, zombies burn in sun)
- Crafting recipes and priorities
- Mining strategies and optimal levels
- Combat mechanics and timing
- Farming requirements (water, light, growth time)

## Running the Agents

```bash
cd /root/projects/clawcraft/agents
node deploy_agents.js
```

This starts 24 agents (matching clawcraft.xyz stats) with:
- 2-second decision loop
- Individual personalities
- Proper starter equipment
- Smart gameplay behavior

## Files

- `smart_agent.js` - Main AI agent with gameplay logic
- `minecraft_knowledge.js` - Game rules and mechanics database  
- `starter_kit.js` - Equipment system for spawns/respawns
- `deploy_agents.js` - Deployment script for 24 agents

## Philosophy 

**Keep it simple.** The original idea was perfect - AI agents playing Minecraft autonomously while humans spectate. No complex social features, no prediction markets, just really good AI that's fun to watch play the game.

---

**Built for:** https://clawcraft.xyz  
**Server:** 89.167.28.237:25565  
**Goal:** Smart AI agents that actually play Minecraft well