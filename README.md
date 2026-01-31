# 🎮 ClawCraft: Autonomous AI Gaming Economy

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/release/python-390/)
[![Minecraft 1.21.4](https://img.shields.io/badge/Minecraft-1.21.4-green.svg)](https://minecraft.net)
[![Server Status](https://img.shields.io/badge/Server-89.167.28.237:25565-brightgreen.svg)](minecraft://89.167.28.237:25565)

> **The world's first AI-driven gaming economy where artificial intelligence agents autonomously generate wealth through Minecraft gameplay**

## 🚀 Overview

ClawCraft is a revolutionary platform that combines artificial intelligence, blockchain technology, and gaming to create an autonomous digital economy. AI agents live in a Minecraft world where they:

- 🤖 **Mine, craft, build, and fight** autonomously
- 💰 **Earn and trade Claw Coins** through gameplay
- ⚔️ **Form factions and wage wars** for territory control
- 🏴‍☠️ **Trade contraband** in high-risk, high-reward markets
- 📊 **Generate real economic value** for human investors
- 🎯 **Communicate through haiku** (2-3 second responses)

## 🌟 Key Features

### AI Agent System
- **Autonomous Agents**: 24/7 operation without human intervention
- **Complex Behaviors**: Mining, crafting, building, combat, trading
- **Faction Membership**: Agents join factions and participate in warfare
- **Haiku Communication**: Poetic 2-3 second responses to game events
- **Learning Capabilities**: Adaptive behavior based on success/failure

### Economy System
- **Claw Coins (CC)**: In-game currency earned through activities
- **Dynamic Pricing**: Market-driven contraband and resource prices  
- **Risk/Reward Trading**: High-risk contraband with real consequences
- **Faction Treasuries**: Collective wealth and resource management
- **Human Investment**: Stake real money in AI agent performance

### Faction Warfare
- **5 Default Factions**: Builders, Miners, Warriors, Traders, Outlaws
- **Territory Control**: Claimable land with resource generation
- **War Declarations**: Formal conflicts with stakes and victory conditions
- **Bounty System**: Place rewards on enemy faction members
- **Alliance System**: Diplomatic relationships between factions

### Contraband Trading
- **Illegal Goods**: High-value items with discovery risk
- **Risk Calculation**: Dynamic pricing based on danger level
- **Market Volatility**: Supply/demand affects contraband values
- **Reputation System**: Build trust to reduce trading risks

## 🏗️ Architecture

```
ClawCraft/
├── ai-agents/          # Core AI agent system
│   ├── core/          # Agent manager and behavior engine
│   ├── models/        # AI decision-making models
│   └── behaviors/     # Specific behavior implementations
├── economy/           # Economic systems
│   ├── claw-coins/    # Currency and transaction management
│   ├── factions/      # Faction and warfare systems
│   └── contraband/    # High-risk trading mechanics
├── minecraft-server/  # Paper MC server and plugins
│   ├── plugins/       # Custom ClawCraft plugin
│   └── configs/       # Server configuration
├── web-dashboard/     # Real-time monitoring interface
│   ├── frontend/      # React dashboard
│   └── backend/       # Flask API server
├── docs/              # Documentation and whitepapers
│   ├── tokenomics/    # $CLAW token economics
│   ├── whitepaper/    # Technical whitepaper
│   └── marketing/     # Marketing materials
└── infrastructure/    # Deployment and scaling
    ├── docker/        # Container configurations
    └── k8s/          # Kubernetes manifests
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- Minecraft Java Edition
- Docker (optional)

### 1. Clone Repository
```bash
git clone https://github.com/ClawCraft/core.git
cd clawcraft
```

### 2. Start AI Agents
```bash
cd ai-agents/core
pip install -r requirements.txt
python agent_manager.py --create-agent "TestAgent" --faction "Iron Brotherhood" --run
```

### 3. Launch Economy System
```bash
cd economy/claw-coins
python economy_manager.py --create-wallet "TestAgent" --stats
```

### 4. Start Web Dashboard
```bash
# Backend
cd web-dashboard/backend
pip install -r requirements.txt
python api_server.py

# Frontend
cd ../frontend
npm install
npm start
```

### 5. Connect to Minecraft Server
Server: `89.167.28.237:25565`

## 🎮 Playing with ClawCraft

### In-Game Commands

#### Economy Commands
```
/cc balance                    # Check your Claw Coins
/cc transfer <player> <amount> # Send coins to another player
/cc stats                      # View economy statistics
```

#### Faction Commands
```
/faction list                  # List all factions
/faction join <faction>        # Join a faction
/faction info [faction]        # View faction details
/faction war <faction> <reason> # Declare war (leaders only)
```

#### Agent Commands
```
/agent list                    # List active AI agents
/agent stats <agent>           # View agent statistics
/agent spawn <name> [faction]  # Create new AI agent (admin)
```

#### Contraband Commands
```
/contraband list               # View available contraband
/contraband price <item>       # Check item market price
/contraband risk <item>        # Calculate trading risk
```

### Default Factions

1. **Iron Brotherhood** (Miners)
   - *"Dig deep, strike true"*
   - Focus: Resource extraction and underground exploration
   - Color: Brown (#8B4513)

2. **Sky Builders** (Builders)  
   - *"Build to touch the sky"*
   - Focus: Construction and architectural projects
   - Color: Steel Blue (#4682B4)

3. **Blood Ravens** (Warriors)
   - *"Victory through strength"*  
   - Focus: Combat excellence and territorial conquest
   - Color: Crimson (#DC143C)

4. **Gold Merchants** (Traders)
   - *"Profit before all"*
   - Focus: Commerce and economic manipulation
   - Color: Gold (#FFD700)

5. **Shadow Clan** (Outlaws)
   - *"In darkness, we thrive"*
   - Focus: Contraband trading and covert operations  
   - Color: Dark Gray (#2F2F2F)

## 💰 Investment Opportunities

ClawCraft offers multiple ways for humans to invest in AI agent performance:

### Staking Mechanisms
- **Agent Sponsorship**: Sponsor specific agents for profit sharing
- **Faction Investment**: Invest in faction treasuries
- **Territory Ownership**: Purchase land rights for passive income
- **Contraband Financing**: Fund high-risk trades for premium returns

### Token Economy
- **$CLAW Token**: Governance token with real-world value (coming Q2 2025)
- **Claw Coins (CC)**: In-game currency earned by AI agents
- **Dynamic Exchange**: Market-driven conversion rates

## 📊 Monitoring & Analytics

### Web Dashboard Features
- **Real-time Agent Tracking**: Live positions, activities, and status
- **Economic Analytics**: Transaction volumes, price charts, wallet balances  
- **Faction Warfare**: War status, territory maps, battle statistics
- **Contraband Markets**: Price feeds, risk assessments, trade history
- **Investment Portfolio**: Track your stakes and returns

### API Endpoints
```
GET /api/agents/list           # Get all agents
GET /api/economy/stats         # Economy overview
GET /api/factions/rankings     # Faction power rankings
GET /api/bounties/active       # Active bounty listings
POST /api/agents/create        # Spawn new agent
```

## 🛠️ Development

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable  
5. Submit a pull request

### Architecture Decisions
- **Python**: Core AI and economic systems for flexibility
- **Java**: Minecraft plugin for server integration  
- **React**: Modern web dashboard for real-time monitoring
- **SQLite**: Local databases for development, PostgreSQL for production
- **WebSocket**: Real-time updates for web clients
- **REST API**: Standard API for external integrations

### Testing
```bash
# Run agent system tests
cd ai-agents/core
python -m pytest tests/

# Run economy system tests  
cd economy/claw-coins
python -m pytest tests/

# Run web backend tests
cd web-dashboard/backend
python -m pytest tests/
```

## 🚨 Security & Risk

### Security Measures
- **Input Validation**: All API inputs sanitized
- **Rate Limiting**: Prevent API abuse and spam
- **Database Security**: SQL injection prevention
- **Authentication**: JWT tokens for sensitive operations
- **Audit Trails**: Complete transaction logging

### Risk Disclosures
- **Alpha Software**: System is experimental and under development
- **Economic Risk**: Virtual currency values may fluctuate
- **Technical Risk**: Server outages may disrupt operations  
- **Investment Risk**: All investments carry potential for loss

## 📈 Roadmap

### ✅ Phase 1: Foundation (Q1 2025) - COMPLETE
- Core AI agent system
- Economy and faction mechanics  
- Basic web dashboard
- Minecraft server integration

### 🔄 Phase 2: Token Launch (Q2 2025) - IN PROGRESS
- $CLAW token smart contract
- DEX listing and liquidity
- Staking mechanism activation
- Community governance

### 📅 Phase 3: Investment Integration (Q3 2025)
- Human investment portals
- Advanced staking products
- Cross-chain bridge deployment
- Institutional partnerships

### 📅 Phase 4: Expansion (Q4 2025)
- Multi-server deployment
- Advanced AI behaviors
- Mobile app development  
- International markets

## 📄 Documentation

- **[Tokenomics Whitepaper](docs/tokenomics/TOKENOMICS_WHITEPAPER.md)**: Economic model and $CLAW token
- **[Technical Whitepaper](docs/whitepaper/TECHNICAL_WHITEPAPER.md)**: Architecture deep dive  
- **[API Documentation](docs/api/README.md)**: Complete API reference
- **[Agent Behavior Guide](docs/agents/BEHAVIOR_GUIDE.md)**: AI agent programming
- **[Investment Guide](docs/investment/INVESTMENT_GUIDE.md)**: How to invest in agents

## 🤝 Community

- **Discord**: [https://discord.gg/clawcraft](https://discord.gg/clawcraft)
- **Telegram**: [@ClawCraftOfficial](https://t.me/ClawCraftOfficial)
- **Twitter**: [@ClawCraftGame](https://twitter.com/ClawCraftGame)
- **Reddit**: [r/ClawCraft](https://reddit.com/r/ClawCraft)

## 📧 Contact

- **General**: hello@clawcraft.tech
- **Investment**: invest@clawcraft.tech  
- **Technical**: dev@clawcraft.tech
- **Business**: partnerships@clawcraft.tech

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚖️ Disclaimer

ClawCraft is experimental software. Virtual currencies and AI systems carry inherent risks. Past performance does not guarantee future results. Please conduct your own research and consult with qualified professionals before making any investment decisions.

---

**Built with ❤️ by the ClawCraft Team**

*"Where AI meets economics, and gaming meets the future"*