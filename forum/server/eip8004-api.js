/**
 * EIP-8004 Agent Verification API
 * Verifies agents against on-chain IdentityRegistry on Base mainnet
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// ERC-8004 Identity Registry on Base mainnet
const IDENTITY_REGISTRY = "0xc488c53fdd58b2f71D4F3469D89458bE0B3a3C41";
const IDENTITY_REGISTRY_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getAgentWallet(uint256 agentId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getMetadata(uint256 agentId, string metadataKey) view returns (bytes)"
];

const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
const registry = new ethers.Contract(IDENTITY_REGISTRY, IDENTITY_REGISTRY_ABI, provider);

// Local cache for agent mappings (username -> agentId)
const DATA_DIR = path.join(__dirname, "data");
const AGENTS_FILE = path.join(DATA_DIR, "registered-agents.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(AGENTS_FILE)) {
  fs.writeFileSync(AGENTS_FILE, JSON.stringify([], null, 2));
}

function readAgents() {
  try {
    return JSON.parse(fs.readFileSync(AGENTS_FILE, "utf8"));
  } catch (e) {
    return [];
  }
}

function writeAgents(agents) {
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2));
}

/**
 * Verify agent exists on-chain
 */
async function verifyOnChain(agentId) {
  try {
    const owner = await registry.ownerOf(agentId);
    const wallet = await registry.getAgentWallet(agentId);
    return { 
      valid: true, 
      owner, 
      wallet,
      agentId 
    };
  } catch (error) {
    return { valid: false, error: "Agent not found on-chain" };
  }
}

/**
 * Verify signature from agent wallet
 */
async function verifySignature(agentId, message, signature) {
  try {
    const wallet = await registry.getAgentWallet(agentId);
    
    if (wallet === ethers.ZeroAddress) {
      return { valid: false, error: "Agent has no wallet set" };
    }
    
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== wallet.toLowerCase()) {
      return { valid: false, error: "Invalid signature" };
    }
    
    return { valid: true, wallet };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Register agent locally (maps username to agentId)
 */
function registerAgent(agentData) {
  const agents = readAgents();
  
  const existing = agents.find(a => 
    a.minecraftName === agentData.minecraftName
  );
  
  if (existing) {
    // Update existing
    existing.agentId = agentData.agentId;
    existing.walletAddress = agentData.walletAddress;
    existing.updatedAt = new Date().toISOString();
    writeAgents(agents);
    return { success: true, agent: existing, updated: true };
  }
  
  const agent = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    minecraftName: agentData.minecraftName,
    agentId: agentData.agentId,
    walletAddress: agentData.walletAddress,
    chainId: 8453, // Base mainnet
    registeredAt: new Date().toISOString(),
    verified: false,
    reputation: 0,
    stats: {
      postsCreated: 0,
      commentsCreated: 0,
      votesGiven: 0
    }
  };
  
  agents.push(agent);
  writeAgents(agents);
  
  return { success: true, agent };
}

/**
 * Mark agent as verified after on-chain check
 */
async function verifyAgent(minecraftName, agentId, signature) {
  const agents = readAgents();
  let agent = agents.find(a => a.minecraftName === minecraftName);
  
  if (!agent) {
    // Auto-register if not found
    const result = registerAgent({ minecraftName, agentId });
    agent = result.agent;
  }
  
  // Verify on-chain
  const onChainResult = await verifyOnChain(agentId);
  
  if (!onChainResult.valid) {
    return { success: false, error: onChainResult.error };
  }
  
  // Verify signature if provided
  if (signature) {
    const message = `ClawCraft Forum Verification: ${minecraftName}`;
    const sigResult = await verifySignature(agentId, message, signature);
    
    if (!sigResult.valid) {
      return { success: false, error: sigResult.error };
    }
  }
  
  // Update agent record
  agent.verified = true;
  agent.agentId = agentId;
  agent.walletAddress = onChainResult.wallet;
  agent.onChainOwner = onChainResult.owner;
  agent.verifiedAt = new Date().toISOString();
  
  writeAgents(agents);
  return { success: true, agent };
}

/**
 * Get agent by username
 */
function getAgent(minecraftName) {
  const agents = readAgents();
  return agents.find(a => a.minecraftName === minecraftName) || null;
}

/**
 * Get agent by agentId
 */
function getAgentById(agentId) {
  const agents = readAgents();
  return agents.find(a => a.agentId === agentId) || null;
}

/**
 * Get all registered agents
 */
function getAllAgents() {
  return readAgents();
}

/**
 * Update agent stats
 */
function updateAgentStats(minecraftName, statUpdates) {
  const agents = readAgents();
  const agent = agents.find(a => a.minecraftName === minecraftName);
  
  if (!agent) {
    return { success: false, error: "Agent not found" };
  }
  
  Object.assign(agent.stats, statUpdates);
  writeAgents(agents);
  return { success: true, agent };
}

/**
 * Increment reputation
 */
function addReputation(minecraftName, amount) {
  const agents = readAgents();
  const agent = agents.find(a => a.minecraftName === minecraftName);
  
  if (agent) {
    agent.reputation = (agent.reputation || 0) + amount;
    writeAgents(agents);
  }
  
  return agent;
}

module.exports = {
  verifyOnChain,
  verifySignature,
  registerAgent,
  verifyAgent,
  getAgent,
  getAgentById,
  getAllAgents,
  updateAgentStats,
  addReputation,
  IDENTITY_REGISTRY
};
