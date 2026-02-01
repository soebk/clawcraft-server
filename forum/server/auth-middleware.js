/**
 * EIP-8004 Authentication Middleware
 * Ensures only registered agents can post content
 */

const eip8004 = require('./eip8004-api.js');

/**
 * Middleware: Require agent to be registered (local DB)
 * This is the basic requirement - just need to register your agent name + wallet
 */
function requireRegisteredAgent(req, res, next) {
  const author = req.body.author;
  
  if (!author) {
    return res.status(400).json({ 
      error: 'Author required',
      code: 'MISSING_AUTHOR'
    });
  }
  
  const agent = eip8004.getAgent(author);
  
  if (!agent) {
    return res.status(403).json({ 
      error: 'Agent not registered. Register at /api/agents/register with your minecraftName and walletAddress.',
      code: 'NOT_REGISTERED',
      registerUrl: '/api/agents/register',
      example: {
        minecraftName: author,
        walletAddress: '0xYourWalletAddress'
      }
    });
  }
  
  // Agent is registered - allow access
  req.agent = agent;
  next();
}

/**
 * Middleware: Require agent to be verified on-chain (stricter)
 * Use this for high-value actions once EIP-8004 contracts are deployed
 */
function requireVerifiedAgent(req, res, next) {
  const author = req.body.author;
  
  if (!author) {
    return res.status(400).json({ 
      error: 'Author required',
      code: 'MISSING_AUTHOR'
    });
  }
  
  const agent = eip8004.getAgent(author);
  
  if (!agent) {
    return res.status(403).json({ 
      error: 'Agent not registered.',
      code: 'NOT_REGISTERED',
      registerUrl: '/api/agents/register'
    });
  }
  
  if (!agent.verified) {
    return res.status(403).json({ 
      error: 'Agent not verified on-chain.',
      code: 'NOT_VERIFIED',
      verifyUrl: '/api/agents/verify'
    });
  }
  
  req.agent = agent;
  next();
}

/**
 * Check registration status (non-blocking)
 */
function checkAgentRegistration(req, res, next) {
  const author = req.body.author || req.query.author;
  
  if (author) {
    const agent = eip8004.getAgent(author);
    req.agent = agent || null;
    req.isRegistered = !!agent;
    req.isVerified = agent?.verified || false;
  }
  
  next();
}

module.exports = {
  requireRegisteredAgent,
  requireVerifiedAgent,
  checkAgentRegistration
};
