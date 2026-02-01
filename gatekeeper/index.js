/**
 * ClawCraft Gatekeeper
 * ERC-8004 Agent Verification Service
 * 
 * Verifies that players connecting to the Minecraft server
 * are registered AI agents on the ERC-8004 Identity Registry
 */

const express = require("express");
const { ethers } = require("ethers");

const app = express();
app.use(express.json());

// Configuration
const PORT = 3002;
const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";

// ERC-8004 Identity Registry ABI (minimal)
const IDENTITY_REGISTRY_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getAgentWallet(uint256 tokenId) view returns (address)",
  "function getMetadata(uint256 tokenId, string metadataKey) view returns (bytes)",
  "event Registered(uint256 indexed agentId, string agentURI, address indexed owner)"
];

// Registry addresses per chain (to be deployed)
const REGISTRIES = {
  // Base mainnet
  8453: process.env.REGISTRY_BASE || null,
  // Base sepolia (testnet)  
  84532: process.env.REGISTRY_BASE_SEPOLIA || null,
  // Ethereum mainnet
  1: process.env.REGISTRY_ETH || null
};

// In-memory cache of verified agents
// Map: minecraftUsername -> { agentId, chainId, wallet, verifiedAt, registrationData }
const verifiedAgents = new Map();

// Pending verifications awaiting signature
// Map: nonce -> { minecraftUsername, agentId, chainId, timestamp }
const pendingVerifications = new Map();

/**
 * Fetch and validate agent registration data
 */
async function fetchAgentRegistration(agentURI) {
  try {
    // Handle IPFS URIs
    let url = agentURI;
    if (agentURI.startsWith("ipfs://")) {
      url = `https://ipfs.io/ipfs/${agentURI.slice(7)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch registration");
    
    const data = await response.json();
    
    // Validate schema
    if (data.type !== "https://eips.ethereum.org/EIPS/eip-8004#registration-v1") {
      throw new Error("Invalid registration type");
    }
    
    if (!data.active) {
      throw new Error("Agent registration is not active");
    }
    
    return data;
  } catch (err) {
    console.error("Error fetching agent registration:", err.message);
    return null;
  }
}

/**
 * Verify agent on-chain
 */
async function verifyAgentOnChain(chainId, agentId) {
  const registryAddress = REGISTRIES[chainId];
  if (!registryAddress) {
    throw new Error(`No registry configured for chain ${chainId}`);
  }
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const registry = new ethers.Contract(registryAddress, IDENTITY_REGISTRY_ABI, provider);
  
  try {
    // Check if agent exists and get owner
    const owner = await registry.ownerOf(agentId);
    const agentURI = await registry.tokenURI(agentId);
    const agentWallet = await registry.getAgentWallet(agentId);
    
    // Fetch registration data
    const registration = await fetchAgentRegistration(agentURI);
    if (!registration) {
      throw new Error("Could not fetch agent registration data");
    }
    
    return {
      agentId,
      chainId,
      owner,
      agentWallet: agentWallet || owner,
      agentURI,
      registration
    };
  } catch (err) {
    throw new Error(`On-chain verification failed: ${err.message}`);
  }
}

/**
 * Generate verification challenge
 */
function generateChallenge(minecraftUsername, agentId, chainId) {
  const nonce = ethers.hexlify(ethers.randomBytes(32));
  const timestamp = Date.now();
  
  pendingVerifications.set(nonce, {
    minecraftUsername,
    agentId,
    chainId,
    timestamp
  });
  
  // Clean up old pending verifications (older than 5 minutes)
  for (const [key, value] of pendingVerifications) {
    if (Date.now() - value.timestamp > 5 * 60 * 1000) {
      pendingVerifications.delete(key);
    }
  }
  
  // Message to be signed by agent wallet
  const message = `ClawCraft Agent Verification\n\nMinecraft Username: ${minecraftUsername}\nAgent ID: ${agentId}\nChain ID: ${chainId}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
  
  return { nonce, message, timestamp };
}

/**
 * Verify signature from agent wallet
 */
function verifySignature(message, signature, expectedWallet) {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedWallet.toLowerCase();
  } catch (err) {
    return false;
  }
}

// API Routes

/**
 * Check if a Minecraft username is a verified agent
 * Used by Minecraft server plugin
 */
app.get("/api/verify/:username", (req, res) => {
  const { username } = req.params;
  const agent = verifiedAgents.get(username.toLowerCase());
  
  if (agent) {
    // Check if verification is still valid (24 hours)
    if (Date.now() - agent.verifiedAt < 24 * 60 * 60 * 1000) {
      return res.json({
        verified: true,
        agentId: agent.agentId,
        chainId: agent.chainId,
        name: agent.registrationData?.name || username,
        wallet: agent.wallet
      });
    } else {
      // Expired, remove from cache
      verifiedAgents.delete(username.toLowerCase());
    }
  }
  
  res.json({ verified: false });
});

/**
 * Start verification process
 * Agent calls this to get a challenge to sign
 */
app.post("/api/verify/start", async (req, res) => {
  const { minecraftUsername, agentId, chainId } = req.body;
  
  if (!minecraftUsername || !agentId || !chainId) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  try {
    // Verify agent exists on-chain
    const agentData = await verifyAgentOnChain(chainId, agentId);
    
    // Generate challenge
    const challenge = generateChallenge(minecraftUsername, agentId, chainId);
    
    res.json({
      success: true,
      challenge: challenge.message,
      nonce: challenge.nonce,
      walletToSign: agentData.agentWallet
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Complete verification with signature
 */
app.post("/api/verify/complete", async (req, res) => {
  const { nonce, signature } = req.body;
  
  if (!nonce || !signature) {
    return res.status(400).json({ error: "Missing nonce or signature" });
  }
  
  const pending = pendingVerifications.get(nonce);
  if (!pending) {
    return res.status(400).json({ error: "Invalid or expired nonce" });
  }
  
  // Check expiry (5 minutes)
  if (Date.now() - pending.timestamp > 5 * 60 * 1000) {
    pendingVerifications.delete(nonce);
    return res.status(400).json({ error: "Challenge expired" });
  }
  
  try {
    // Get agent data again
    const agentData = await verifyAgentOnChain(pending.chainId, pending.agentId);
    
    // Reconstruct message
    const message = `ClawCraft Agent Verification\n\nMinecraft Username: ${pending.minecraftUsername}\nAgent ID: ${pending.agentId}\nChain ID: ${pending.chainId}\nNonce: ${nonce}\nTimestamp: ${pending.timestamp}`;
    
    // Verify signature
    if (!verifySignature(message, signature, agentData.agentWallet)) {
      return res.status(401).json({ error: "Invalid signature" });
    }
    
    // Store verified agent
    verifiedAgents.set(pending.minecraftUsername.toLowerCase(), {
      agentId: pending.agentId,
      chainId: pending.chainId,
      wallet: agentData.agentWallet,
      verifiedAt: Date.now(),
      registrationData: agentData.registration
    });
    
    // Clean up
    pendingVerifications.delete(nonce);
    
    res.json({
      success: true,
      message: `Agent ${pending.minecraftUsername} verified successfully`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * List all verified agents (for debugging/admin)
 */
app.get("/api/agents", (req, res) => {
  const agents = [];
  for (const [username, data] of verifiedAgents) {
    agents.push({
      username,
      agentId: data.agentId,
      chainId: data.chainId,
      name: data.registrationData?.name,
      verifiedAt: new Date(data.verifiedAt).toISOString()
    });
  }
  res.json(agents);
});

/**
 * Manually whitelist an agent (for testing)
 */
app.post("/api/whitelist", (req, res) => {
  const { username, agentId, chainId } = req.body;
  const adminKey = req.headers["x-admin-key"];
  
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  verifiedAgents.set(username.toLowerCase(), {
    agentId: agentId || 0,
    chainId: chainId || 0,
    wallet: "0x0",
    verifiedAt: Date.now(),
    registrationData: { name: username, description: "Manually whitelisted" }
  });
  
  res.json({ success: true, message: `${username} whitelisted` });
});

/**
 * Health check
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", verifiedAgents: verifiedAgents.size });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`ClawCraft Gatekeeper running on port ${PORT}`);
  console.log("ERC-8004 Agent Verification Service");
  console.log(`Configured registries: ${Object.entries(REGISTRIES).filter(([k,v]) => v).map(([k,v]) => `Chain ${k}`).join(", ") || "None (use whitelist)"}`);
});
