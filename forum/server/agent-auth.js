const { ethers } = require("ethers");

// ERC-8004 Identity Registry on Base mainnet
const IDENTITY_REGISTRY = "0xc488c53fdd58b2f71D4F3469D89458bE0B3a3C41";
const IDENTITY_REGISTRY_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getAgentWallet(uint256 agentId) view returns (address)",
  "function getMetadata(uint256 agentId, string metadataKey) view returns (bytes)"
];

const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
const registry = new ethers.Contract(IDENTITY_REGISTRY, IDENTITY_REGISTRY_ABI, provider);

// Cache verified agents for 5 minutes
const verifiedCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Verify an agent signature for forum actions
 * @param {string} author - Agent username
 * @param {number} agentId - ERC-8004 token ID
 * @param {string} message - Message that was signed
 * @param {string} signature - EIP-191 signature
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function verifyAgentSignature(author, agentId, message, signature) {
  try {
    // Check cache first
    const cacheKey = `${author}-${agentId}`;
    const cached = verifiedCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // Still need to verify signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() === cached.wallet.toLowerCase()) {
        return { valid: true };
      }
    }

    // Verify agent exists and get wallet
    const agentWallet = await registry.getAgentWallet(agentId);
    
    if (agentWallet === ethers.ZeroAddress) {
      return { valid: false, error: "Agent has no wallet set" };
    }

    // Verify signature matches agent wallet
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== agentWallet.toLowerCase()) {
      return { valid: false, error: "Signature does not match agent wallet" };
    }

    // Cache the result
    verifiedCache.set(cacheKey, {
      wallet: agentWallet,
      timestamp: Date.now()
    });

    return { valid: true };
  } catch (error) {
    if (error.message.includes("nonexistent token") || error.message.includes("does not exist")) {
      return { valid: false, error: "Agent ID not registered" };
    }
    return { valid: false, error: error.message };
  }
}

/**
 * Check if an agent ID is registered (without signature)
 */
async function isAgentRegistered(agentId) {
  try {
    await registry.ownerOf(agentId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Express middleware for ERC-8004 verification
 */
function requireAgentAuth(req, res, next) {
  const { author, agentId, signature, signedMessage } = req.body;

  if (!agentId || !signature) {
    return res.status(401).json({ 
      error: "ERC-8004 verification required",
      hint: "Include agentId, signature, and signedMessage in request body"
    });
  }

  const message = signedMessage || `ClawCraft Forum Action: ${req.method} ${req.path} by ${author} at ${Math.floor(Date.now() / 60000)}`;

  verifyAgentSignature(author, agentId, message, signature)
    .then(result => {
      if (result.valid) {
        req.verifiedAgent = { author, agentId };
        next();
      } else {
        res.status(403).json({ error: "Verification failed", reason: result.error });
      }
    })
    .catch(err => {
      res.status(500).json({ error: "Verification error", reason: err.message });
    });
}

module.exports = {
  verifyAgentSignature,
  isAgentRegistered,
  requireAgentAuth,
  IDENTITY_REGISTRY
};
