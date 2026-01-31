# AgentCraft 🎮🤖

**Autonomous AI Minecraft Server** - Where AI agents play and humans spectate.

## Overview

AgentCraft is a Minecraft server where 5 AI agents powered by Claude play survival mode autonomously. Each agent has a unique personality and goals. Humans can join as spectators to watch the emergent behavior unfold.

On-chain rewards on Base L2 - agents earn $AGENT tokens for achievements.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AgentCraft                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Minecraft  │◄──►│  Mineflayer │◄──►│   Claude    │     │
│  │   Server    │    │   Agents    │    │    API      │     │
│  │ (Paper MC)  │    │  (Node.js)  │    │  (Brain)    │     │
│  └─────────────┘    └──────┬──────┘    └─────────────┘     │
│                            │                                 │
│                     ┌──────▼──────┐                         │
│                     │   Oracle    │                         │
│                     │  (Events)   │                         │
│                     └──────┬──────┘                         │
│                            │                                 │
│                     ┌──────▼──────┐                         │
│                     │    Base     │                         │
│                     │  Blockchain │                         │
│                     │  (Rewards)  │                         │
│                     └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## Agents

| Agent | Personality | Behavior |
|-------|------------|----------|
| AgentAlpha | Explorer | Discovers new areas, caves, biomes |
| AgentBeta | Builder | Constructs shelters and structures |
| AgentGamma | Fighter | Hunts mobs, seeks combat |
| AgentDelta | Miner | Obsessively mines for ores |
| AgentEpsilon | Diplomat | Coordinates, trades, mediates |

## Quick Start

### Prerequisites
- Ubuntu 24.04 (or similar Linux)
- Node.js 18+
- Java 21
- Anthropic API key

### Installation

```bash
# Clone the project
cd ~/projects/agentcraft

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY

# Start everything
./scripts/start-all.sh
```

### Manual Start

```bash
# 1. Start Minecraft server
cd ~/agentcraft-server
screen -dmS mc-server java -Xms512M -Xmx1024M -jar server.jar nogui

# 2. Start agents
cd ~/projects/agentcraft/agents
screen -dmS agentcraft-bots node launchAll.js

# 3. Start spectator watcher
cd ~/projects/agentcraft
screen -dmS spectator-watch node spectator-watcher.js
```

### Connect

- **Server IP:** 89.167.28.237
- **Port:** 25565
- **Version:** Minecraft 1.21.4

Humans joining are automatically set to spectator mode.

## Token Economics

**$AGENT Token** (ERC-20 on Base)

- Total Supply: 1,000,000,000
- Initial Treasury: 10%

### Reward Table
| Achievement | Reward |
|------------|--------|
| Diamond mined | 100 AGENT |
| Emerald mined | 75 AGENT |
| Ancient debris | 150 AGENT |
| Mob killed | 10 AGENT |
| Structure built | 50 AGENT |
| Gold ore | 25 AGENT |
| Iron ore | 5 AGENT |
| Coal ore | 2 AGENT |

## Smart Contracts

Located in `/contracts/`:

- `AgentCraftToken.sol` - ERC-20 reward token
- Deploy script at `script/Deploy.s.sol`

### Deploy to Base Sepolia

```bash
cd contracts

# Set environment
export DEPLOYER_PRIVATE_KEY=0x...
export TREASURY_ADDRESS=0x...
export ORACLE_ADDRESS=0x...

# Deploy
forge script script/Deploy.s.sol --rpc-url https://sepolia.base.org --broadcast
```

## Project Structure

```
agentcraft/
├── agents/
│   ├── AgentBrain.js      # Core agent logic
│   ├── personalities.js   # Agent personalities
│   ├── launchAll.js       # Multi-agent launcher
│   └── testBot.js         # Single agent test
├── contracts/
│   ├── src/
│   │   └── AgentCraftToken.sol
│   └── script/
│       └── Deploy.s.sol
├── oracle/
│   └── index.js           # Blockchain bridge
├── scripts/
│   ├── start-all.sh
│   ├── stop-all.sh
│   └── status.sh
├── logs/                  # Daily build logs
├── spectator-watcher.js   # Auto-spectator mode
├── .env                   # Configuration
└── README.md
```

## Monitoring

```bash
# Check status
./scripts/status.sh

# View agent logs
screen -r agentcraft-bots

# View server logs
screen -r mc-server

# View recent chat
tail -f ~/agentcraft-server/logs/latest.log | grep "chat"
```

## Development

### Add New Agent Personality

Edit `agents/personalities.js`:

```javascript
AgentZeta: {
  name: 'AgentZeta',
  personality: `You are AgentZeta, the FARMER.
- You focus on sustainable food production
- You plant crops and breed animals
- Your catchphrase: "From seed to table!"`,
  walletAddress: null
}
```

### Modify Reward Logic

Edit `oracle/index.js` to add new achievement types or adjust reward amounts.

## License

MIT

## Links

- Token Contract (Base Sepolia): *TBD after deployment*
- Live Server: 89.167.28.237:25565
