// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentCraftToken (AGENT)
 * @notice ERC-20 token for AgentCraft - rewards for AI agent achievements
 * @dev 1 billion total supply, oracle mints rewards for in-game events
 */
contract AgentCraftToken is ERC20, Ownable {
    // Oracle address authorized to mint rewards
    address public oracle;
    
    // Treasury address for reward pool
    address public treasury;
    
    // Maximum supply: 1 billion tokens (18 decimals)
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // Reward amounts (in tokens, will be multiplied by 10**18)
    uint256 public constant REWARD_DIAMOND_MINED = 100;
    uint256 public constant REWARD_MOB_KILLED = 10;
    uint256 public constant REWARD_STRUCTURE_BUILT = 50;
    uint256 public constant REWARD_EXPLORATION = 25;
    
    // Events
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event RewardMinted(address indexed agent, uint256 amount, string reason);
    
    // Modifiers
    modifier onlyOracle() {
        require(msg.sender == oracle, "AgentCraft: caller is not the oracle");
        _;
    }
    
    constructor(
        address _treasury,
        address _oracle
    ) ERC20("AgentCraft", "AGENT") Ownable(msg.sender) {
        require(_treasury != address(0), "AgentCraft: treasury is zero address");
        require(_oracle != address(0), "AgentCraft: oracle is zero address");
        
        treasury = _treasury;
        oracle = _oracle;
        
        // Mint 10% to treasury for initial liquidity and marketing
        _mint(_treasury, MAX_SUPPLY / 10);
    }
    
    /**
     * @notice Mint reward tokens to an agent's wallet
     * @param agent The agent's wallet address
     * @param amount Amount of tokens to mint (in wei)
     * @param reason Description of the achievement
     */
    function mintReward(
        address agent,
        uint256 amount,
        string calldata reason
    ) external onlyOracle {
        require(agent != address(0), "AgentCraft: agent is zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "AgentCraft: max supply exceeded");
        
        _mint(agent, amount);
        emit RewardMinted(agent, amount, reason);
    }
    
    /**
     * @notice Batch mint rewards to multiple agents
     * @param agents Array of agent wallet addresses
     * @param amounts Array of amounts to mint
     * @param reasons Array of achievement descriptions
     */
    function batchMintRewards(
        address[] calldata agents,
        uint256[] calldata amounts,
        string[] calldata reasons
    ) external onlyOracle {
        require(
            agents.length == amounts.length && amounts.length == reasons.length,
            "AgentCraft: array length mismatch"
        );
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(totalSupply() + totalAmount <= MAX_SUPPLY, "AgentCraft: max supply exceeded");
        
        for (uint256 i = 0; i < agents.length; i++) {
            require(agents[i] != address(0), "AgentCraft: agent is zero address");
            _mint(agents[i], amounts[i]);
            emit RewardMinted(agents[i], amounts[i], reasons[i]);
        }
    }
    
    /**
     * @notice Update the oracle address
     * @param newOracle The new oracle address
     */
    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "AgentCraft: oracle is zero address");
        address oldOracle = oracle;
        oracle = newOracle;
        emit OracleUpdated(oldOracle, newOracle);
    }
    
    /**
     * @notice Update the treasury address
     * @param newTreasury The new treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "AgentCraft: treasury is zero address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
    
    /**
     * @notice Get reward amount for a specific achievement type
     * @param achievementType Type of achievement (0=diamond, 1=mob, 2=structure, 3=exploration)
     * @return Reward amount in wei
     */
    function getRewardAmount(uint8 achievementType) external pure returns (uint256) {
        if (achievementType == 0) return REWARD_DIAMOND_MINED * 10**18;
        if (achievementType == 1) return REWARD_MOB_KILLED * 10**18;
        if (achievementType == 2) return REWARD_STRUCTURE_BUILT * 10**18;
        if (achievementType == 3) return REWARD_EXPLORATION * 10**18;
        return 0;
    }
}
