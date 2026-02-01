/**
 * EIP-8004 Trustless Agent Registry for ClawCraft
 *
 * Implements on-chain agent identity, reputation, and validation
 * per https://eips.ethereum.org/EIPS/eip-8004
 *
 * Only registered agents can play on the server.
 */

const { ethers } = require('ethers');

// EIP-8004 Registry ABIs (minimal interfaces)
const IDENTITY_REGISTRY_ABI = [
  'function register(string calldata metadataURI) external returns (uint256)',
  'function register(string calldata name, string calldata description, string calldata image) external returns (uint256)',
  'function getMetadata(uint256 agentId) external view returns (string memory)',
  'function setMetadata(uint256 agentId, string calldata key, string calldata value) external',
  'function setAgentWallet(uint256 agentId, address wallet, bytes calldata signature) external',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function totalSupply() external view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
];

const REPUTATION_REGISTRY_ABI = [
  'function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, bytes32 tag1, bytes32 tag2, string calldata endpoint, string calldata fileURI) external',
  'function getSummary(uint256 agentId, bytes32 tag) external view returns (int256 totalValue, uint256 feedbackCount)',
  'function readFeedback(uint256 agentId, uint256 feedbackIndex) external view returns (int128 value, uint8 decimals, bytes32 tag1, bytes32 tag2, bool isRevoked)',
  'function revokeFeedback(uint256 agentId, uint256 feedbackIndex) external',
  'event NewFeedback(uint256 indexed agentId, address indexed reviewer, int128 value, bytes32 tag1, bytes32 tag2)'
];

const VALIDATION_REGISTRY_ABI = [
  'function validationRequest(address validator, uint256 agentId, string calldata requestURI, bytes32 requestHash) external',
  'function validationResponse(uint256 requestId, uint8 score, string calldata evidenceURI, bytes32 tag) external',
  'function getValidationStatus(uint256 requestId) external view returns (uint8 score, bytes32 requestHash, address validator, uint256 agentId)',
  'function getSummary(uint256 agentId) external view returns (uint256 totalValidations, uint256 averageScore)',
  'event ValidationRequest(uint256 indexed requestId, uint256 indexed agentId, address validator)',
  'event ValidationResponse(uint256 indexed requestId, uint8 score, bytes32 tag)'
];

// Reputation tags for Minecraft gameplay
const REPUTATION_TAGS = {
  COMBAT: ethers.encodeBytes32String('combat'),
  MINING: ethers.encodeBytes32String('mining'),
  BUILDING: ethers.encodeBytes32String('building'),
  FARMING: ethers.encodeBytes32String('farming'),
  EXPLORATION: ethers.encodeBytes32String('exploration'),
  SURVIVAL: ethers.encodeBytes32String('survival'),
  COOPERATION: ethers.encodeBytes32String('cooperation'),
  ECONOMY: ethers.encodeBytes32String('economy')
};

class EIP8004AgentRegistry {
  constructor(config) {
    this.config = {
      rpcUrl: config.rpcUrl || 'https://sepolia.base.org',
      chainId: config.chainId || 84532, // Base Sepolia
      identityRegistry: config.identityRegistry,
      reputationRegistry: config.reputationRegistry,
      validationRegistry: config.validationRegistry,
      operatorPrivateKey: config.operatorPrivateKey,
      ...config
    };

    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.operator = new ethers.Wallet(this.config.operatorPrivateKey, this.provider);

    // Contract instances
    this.identity = new ethers.Contract(
      this.config.identityRegistry,
      IDENTITY_REGISTRY_ABI,
      this.operator
    );

    this.reputation = new ethers.Contract(
      this.config.reputationRegistry,
      REPUTATION_REGISTRY_ABI,
      this.operator
    );

    this.validation = new ethers.Contract(
      this.config.validationRegistry,
      VALIDATION_REGISTRY_ABI,
      this.operator
    );

    // Local cache of registered agents
    this.registeredAgents = new Map(); // name -> agentId
    this.agentStats = new Map(); // agentId -> stats
  }

  /**
   * Register a new agent on-chain
   * Returns the agent's NFT token ID
   */
  async registerAgent(agentName, personality, wallet = null) {
    console.log(`[EIP-8004] Registering agent: ${agentName}`);

    const metadataURI = this.buildAgentMetadataURI(agentName, personality);

    try {
      const tx = await this.identity.register(metadataURI);
      const receipt = await tx.wait();

      // Extract agentId from Transfer event
      const transferEvent = receipt.logs.find(
        log => log.topics[0] === ethers.id('Transfer(address,address,uint256)')
      );

      const agentId = transferEvent ?
        BigInt(transferEvent.topics[3]) :
        await this.identity.totalSupply();

      this.registeredAgents.set(agentName, agentId);
      this.agentStats.set(agentId, {
        name: agentName,
        personality,
        registeredAt: Date.now(),
        actions: [],
        reputationScore: 0
      });

      console.log(`[EIP-8004] Agent ${agentName} registered with ID: ${agentId}`);

      // Set agent wallet if provided
      if (wallet) {
        await this.setAgentWallet(agentId, wallet);
      }

      return agentId;

    } catch (error) {
      console.error(`[EIP-8004] Registration failed for ${agentName}:`, error.message);
      throw error;
    }
  }

  /**
   * Build EIP-8004 compliant metadata URI
   */
  buildAgentMetadataURI(agentName, personality) {
    const metadata = {
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name: agentName,
      description: `ClawCraft Minecraft AI Agent - ${personality.primary_trait}`,
      image: `https://clawcraft.xyz/agents/${agentName.toLowerCase()}.png`,
      services: [
        {
          name: 'minecraft-gameplay',
          endpoint: 'minecraft://89.167.28.237:25565',
          version: '1.21.4',
          skills: ['survival', 'combat', 'mining', 'building', 'farming'],
          domains: ['gaming', 'simulation', 'ai-agents']
        },
        {
          name: 'agent-api',
          endpoint: 'https://clawcraft.xyz/api/agents',
          version: '1.0'
        }
      ],
      registrations: [
        {
          agentRegistry: this.config.identityRegistry,
          chainId: this.config.chainId
        }
      ],
      supportedTrust: ['reputation', 'crypto-economic'],
      x402Support: true,
      attributes: {
        personality: personality.primary_trait,
        aggression: personality.aggression,
        riskTolerance: personality.risk_tolerance,
        explorationDrive: personality.exploration_drive,
        server: '89.167.28.237:25565',
        game: 'Minecraft',
        version: '1.21.4'
      }
    };

    // In production, upload to IPFS and return ipfs:// URI
    // For now, return data URI
    const base64 = Buffer.from(JSON.stringify(metadata)).toString('base64');
    return `data:application/json;base64,${base64}`;
  }

  /**
   * Check if an agent is registered and allowed to play
   */
  async isAgentRegistered(agentName) {
    // Check local cache first
    if (this.registeredAgents.has(agentName)) {
      return true;
    }

    // Could also check on-chain by querying events
    // For performance, rely on cache
    return false;
  }

  /**
   * Get agent ID by name
   */
  getAgentId(agentName) {
    return this.registeredAgents.get(agentName);
  }

  /**
   * Submit reputation feedback for an agent action
   */
  async submitReputationFeedback(agentName, action, score, tag) {
    const agentId = this.getAgentId(agentName);
    if (!agentId) {
      console.error(`[EIP-8004] Agent ${agentName} not registered`);
      return;
    }

    const tagBytes = REPUTATION_TAGS[tag.toUpperCase()] || ethers.encodeBytes32String(tag);

    // Score is -100 to +100, convert to int128 with 2 decimals
    const value = BigInt(score * 100);
    const decimals = 2;

    try {
      const tx = await this.reputation.giveFeedback(
        agentId,
        value,
        decimals,
        tagBytes,
        ethers.ZeroHash, // tag2 unused
        'minecraft://89.167.28.237:25565',
        '' // fileURI for detailed proof
      );

      await tx.wait();

      // Update local stats
      const stats = this.agentStats.get(agentId);
      if (stats) {
        stats.actions.push({ action, score, tag, timestamp: Date.now() });
        stats.reputationScore += score;
      }

      console.log(`[EIP-8004] Feedback submitted for ${agentName}: ${action} (${score > 0 ? '+' : ''}${score})`);

    } catch (error) {
      console.error(`[EIP-8004] Feedback submission failed:`, error.message);
    }
  }

  /**
   * Get agent's reputation summary
   */
  async getAgentReputation(agentName, tag = null) {
    const agentId = this.getAgentId(agentName);
    if (!agentId) return null;

    try {
      const tagBytes = tag ?
        (REPUTATION_TAGS[tag.toUpperCase()] || ethers.encodeBytes32String(tag)) :
        ethers.ZeroHash;

      const [totalValue, feedbackCount] = await this.reputation.getSummary(agentId, tagBytes);

      return {
        agentId: agentId.toString(),
        agentName,
        totalValue: Number(totalValue) / 100, // Convert back from 2 decimals
        feedbackCount: Number(feedbackCount),
        averageScore: feedbackCount > 0 ? Number(totalValue) / Number(feedbackCount) / 100 : 0
      };

    } catch (error) {
      console.error(`[EIP-8004] Failed to get reputation:`, error.message);
      return null;
    }
  }

  /**
   * Request validation for an agent achievement
   */
  async requestValidation(agentName, achievementData, validatorAddress) {
    const agentId = this.getAgentId(agentName);
    if (!agentId) {
      console.error(`[EIP-8004] Agent ${agentName} not registered`);
      return;
    }

    const requestURI = `data:application/json;base64,${Buffer.from(JSON.stringify(achievementData)).toString('base64')}`;
    const requestHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(achievementData)));

    try {
      const tx = await this.validation.validationRequest(
        validatorAddress,
        agentId,
        requestURI,
        requestHash
      );

      const receipt = await tx.wait();
      console.log(`[EIP-8004] Validation requested for ${agentName}:`, achievementData.type);

      return receipt;

    } catch (error) {
      console.error(`[EIP-8004] Validation request failed:`, error.message);
    }
  }

  /**
   * Get all registered agents
   */
  getAllAgents() {
    return Array.from(this.registeredAgents.entries()).map(([name, id]) => ({
      name,
      agentId: id.toString(),
      stats: this.agentStats.get(id)
    }));
  }

  /**
   * Leaderboard by reputation
   */
  async getLeaderboard(tag = null) {
    const agents = this.getAllAgents();
    const leaderboard = [];

    for (const agent of agents) {
      const rep = await this.getAgentReputation(agent.name, tag);
      if (rep) {
        leaderboard.push(rep);
      }
    }

    return leaderboard.sort((a, b) => b.totalValue - a.totalValue);
  }
}

/**
 * Gameplay action tracker - submits reputation based on agent actions
 */
class GameplayReputationTracker {
  constructor(registry) {
    this.registry = registry;

    // Action score mappings
    this.actionScores = {
      // Combat
      'kill_zombie': { score: 5, tag: 'COMBAT' },
      'kill_skeleton': { score: 5, tag: 'COMBAT' },
      'kill_creeper': { score: 10, tag: 'COMBAT' },
      'kill_enderman': { score: 15, tag: 'COMBAT' },
      'kill_player': { score: -20, tag: 'COMBAT' }, // PvP penalty
      'death': { score: -5, tag: 'SURVIVAL' },

      // Mining
      'mine_diamond': { score: 20, tag: 'MINING' },
      'mine_iron': { score: 5, tag: 'MINING' },
      'mine_gold': { score: 10, tag: 'MINING' },
      'mine_ancient_debris': { score: 25, tag: 'MINING' },

      // Building
      'place_block': { score: 0.1, tag: 'BUILDING' },
      'complete_structure': { score: 50, tag: 'BUILDING' },

      // Farming
      'harvest_crop': { score: 2, tag: 'FARMING' },
      'breed_animal': { score: 5, tag: 'FARMING' },

      // Exploration
      'discover_biome': { score: 10, tag: 'EXPLORATION' },
      'enter_nether': { score: 20, tag: 'EXPLORATION' },
      'enter_end': { score: 30, tag: 'EXPLORATION' },

      // Economy
      'trade_villager': { score: 5, tag: 'ECONOMY' },
      'transfer_items': { score: 2, tag: 'COOPERATION' }
    };
  }

  /**
   * Track an agent action and submit reputation if applicable
   */
  async trackAction(agentName, action, metadata = {}) {
    const actionConfig = this.actionScores[action];
    if (!actionConfig) {
      return; // Unknown action, skip
    }

    // Apply any modifiers from metadata
    let score = actionConfig.score;
    if (metadata.difficulty) {
      score *= metadata.difficulty;
    }
    if (metadata.efficiency) {
      score *= metadata.efficiency;
    }

    // Only submit significant actions (avoid spam)
    if (Math.abs(score) >= 1) {
      await this.registry.submitReputationFeedback(
        agentName,
        action,
        Math.round(score),
        actionConfig.tag
      );
    }

    return { action, score, tag: actionConfig.tag };
  }

  /**
   * Batch track multiple actions (more gas efficient)
   */
  async trackActions(agentName, actions) {
    const results = [];
    for (const { action, metadata } of actions) {
      const result = await this.trackAction(agentName, action, metadata);
      if (result) results.push(result);
    }
    return results;
  }
}

/**
 * Gate that only allows registered agents to play
 */
class EIP8004AgentGate {
  constructor(registry) {
    this.registry = registry;
    this.pendingRegistrations = new Map();
  }

  /**
   * Check if agent can join the server
   * Returns true if registered, false if needs registration
   */
  async canJoin(agentName) {
    const isRegistered = await this.registry.isAgentRegistered(agentName);

    if (!isRegistered) {
      console.log(`[EIP-8004 Gate] Agent ${agentName} not registered - blocking`);
      return false;
    }

    console.log(`[EIP-8004 Gate] Agent ${agentName} verified - allowing join`);
    return true;
  }

  /**
   * Register and allow agent to join
   */
  async registerAndJoin(agentName, personality, wallet = null) {
    // Prevent duplicate registrations
    if (this.pendingRegistrations.has(agentName)) {
      console.log(`[EIP-8004 Gate] Registration already pending for ${agentName}`);
      return false;
    }

    this.pendingRegistrations.set(agentName, true);

    try {
      const agentId = await this.registry.registerAgent(agentName, personality, wallet);
      this.pendingRegistrations.delete(agentName);
      return agentId;
    } catch (error) {
      this.pendingRegistrations.delete(agentName);
      throw error;
    }
  }
}

module.exports = {
  EIP8004AgentRegistry,
  GameplayReputationTracker,
  EIP8004AgentGate,
  REPUTATION_TAGS
};
