// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IdentityRegistry.sol";

/**
 * @title ReputationRegistry
 * @dev ERC-8004 Reputation Registry for Agent Feedback
 * @notice Fixed version with security improvements
 */
contract ReputationRegistry {
    IdentityRegistry public immutable identityRegistry;
    
    // Maximum feedback entries to iterate in view functions
    uint256 public constant MAX_ITERATION = 100;
    
    struct Feedback {
        int128 value;
        uint8 valueDecimals;
        string tag1;
        string tag2;
        bool isRevoked;
        uint256 timestamp;
    }
    
    // agentId => clientAddress => feedbackIndex => Feedback
    mapping(uint256 => mapping(address => mapping(uint64 => Feedback))) private _feedback;
    
    // agentId => clientAddress => lastFeedbackIndex
    mapping(uint256 => mapping(address => uint64)) private _lastIndex;
    
    // agentId => list of clients who gave feedback
    mapping(uint256 => address[]) private _clients;
    
    // agentId => clientAddress => hasGivenFeedback (to avoid duplicate entries in _clients)
    mapping(uint256 => mapping(address => bool)) private _hasGivenFeedback;
    
    // Rate limiting: clientAddress => agentId => lastFeedbackTime
    mapping(address => mapping(uint256 => uint256)) private _lastFeedbackTime;
    
    // Minimum time between feedback from same client to same agent (1 hour)
    uint256 public constant FEEDBACK_COOLDOWN = 1 hours;

    event NewFeedback(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        int128 value,
        uint8 valueDecimals,
        string indexed indexedTag1,
        string tag1,
        string tag2,
        string endpoint,
        string feedbackURI,
        bytes32 feedbackHash
    );
    
    event FeedbackRevoked(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 indexed feedbackIndex
    );
    
    event ResponseAppended(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        address indexed responder,
        string responseURI,
        bytes32 responseHash
    );

    constructor(address identityRegistry_) {
        require(identityRegistry_ != address(0), "Invalid registry address");
        identityRegistry = IdentityRegistry(identityRegistry_);
    }

    function getIdentityRegistry() external view returns (address) {
        return address(identityRegistry);
    }

    /**
     * @dev Check if feedback exists
     */
    function _feedbackExists(uint256 agentId, address client, uint64 feedbackIndex) 
        internal 
        view 
        returns (bool) 
    {
        return feedbackIndex > 0 && feedbackIndex <= _lastIndex[agentId][client];
    }

    /**
     * @dev Give feedback to an agent
     */
    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external {
        // Verify agent exists
        require(identityRegistry.ownerOf(agentId) != address(0), "Agent does not exist");
        
        // Verify decimals
        require(valueDecimals <= 18, "Invalid valueDecimals");
        
        // Verify feedback submitter is not agent owner or operator
        address agentOwner = identityRegistry.ownerOf(agentId);
        require(agentOwner != msg.sender, "Cannot give feedback to own agent");
        require(!identityRegistry.isApprovedForAll(agentOwner, msg.sender), "Cannot give feedback to own agent");
        
        // Rate limiting
        require(
            block.timestamp >= _lastFeedbackTime[msg.sender][agentId] + FEEDBACK_COOLDOWN,
            "Feedback cooldown not elapsed"
        );
        _lastFeedbackTime[msg.sender][agentId] = block.timestamp;
        
        // Increment feedback index
        uint64 feedbackIndex = ++_lastIndex[agentId][msg.sender];
        
        // Store feedback
        _feedback[agentId][msg.sender][feedbackIndex] = Feedback({
            value: value,
            valueDecimals: valueDecimals,
            tag1: tag1,
            tag2: tag2,
            isRevoked: false,
            timestamp: block.timestamp
        });
        
        // Add client to list if first feedback
        if (!_hasGivenFeedback[agentId][msg.sender]) {
            _clients[agentId].push(msg.sender);
            _hasGivenFeedback[agentId][msg.sender] = true;
        }
        
        emit NewFeedback(
            agentId,
            msg.sender,
            feedbackIndex,
            value,
            valueDecimals,
            tag1,
            tag1,
            tag2,
            endpoint,
            feedbackURI,
            feedbackHash
        );
    }

    /**
     * @dev Revoke feedback
     */
    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external {
        require(_feedbackExists(agentId, msg.sender, feedbackIndex), "Feedback does not exist");
        require(!_feedback[agentId][msg.sender][feedbackIndex].isRevoked, "Already revoked");
        
        _feedback[agentId][msg.sender][feedbackIndex].isRevoked = true;
        
        emit FeedbackRevoked(agentId, msg.sender, feedbackIndex);
    }

    /**
     * @dev Append response to feedback
     */
    function appendResponse(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex,
        string calldata responseURI,
        bytes32 responseHash
    ) external {
        require(_feedbackExists(agentId, clientAddress, feedbackIndex), "Feedback does not exist");
        
        emit ResponseAppended(agentId, clientAddress, feedbackIndex, msg.sender, responseURI, responseHash);
    }

    /**
     * @dev Get feedback summary with pagination
     */
    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2
    ) external view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals) {
        require(clientAddresses.length > 0, "Must specify client addresses");
        require(clientAddresses.length <= MAX_ITERATION, "Too many clients");
        
        int256 totalValue = 0;
        uint64 totalCount = 0;
        uint8 maxDecimals = 0;
        uint256 iterations = 0;
        
        for (uint256 i = 0; i < clientAddresses.length && iterations < MAX_ITERATION; i++) {
            address client = clientAddresses[i];
            uint64 lastIdx = _lastIndex[agentId][client];
            
            for (uint64 j = 1; j <= lastIdx && iterations < MAX_ITERATION; j++) {
                iterations++;
                Feedback storage fb = _feedback[agentId][client][j];
                
                if (fb.isRevoked) continue;
                
                // Apply tag filters if specified
                if (bytes(tag1).length > 0 && keccak256(bytes(fb.tag1)) != keccak256(bytes(tag1))) continue;
                if (bytes(tag2).length > 0 && keccak256(bytes(fb.tag2)) != keccak256(bytes(tag2))) continue;
                
                totalValue += int256(fb.value);
                totalCount++;
                if (fb.valueDecimals > maxDecimals) {
                    maxDecimals = fb.valueDecimals;
                }
            }
        }
        
        return (totalCount, int128(totalValue), maxDecimals);
    }

    /**
     * @dev Read specific feedback
     */
    function readFeedback(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex
    ) external view returns (
        int128 value,
        uint8 valueDecimals,
        string memory tag1,
        string memory tag2,
        bool isRevoked
    ) {
        require(_feedbackExists(agentId, clientAddress, feedbackIndex), "Feedback does not exist");
        Feedback storage fb = _feedback[agentId][clientAddress][feedbackIndex];
        return (fb.value, fb.valueDecimals, fb.tag1, fb.tag2, fb.isRevoked);
    }

    /**
     * @dev Get all clients for an agent (paginated)
     */
    function getClients(uint256 agentId, uint256 offset, uint256 limit) 
        external 
        view 
        returns (address[] memory) 
    {
        address[] storage allClients = _clients[agentId];
        
        if (offset >= allClients.length) {
            return new address[](0);
        }
        
        uint256 end = offset + limit;
        if (end > allClients.length) {
            end = allClients.length;
        }
        
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allClients[i];
        }
        
        return result;
    }

    /**
     * @dev Get total client count for an agent
     */
    function getClientCount(uint256 agentId) external view returns (uint256) {
        return _clients[agentId].length;
    }

    /**
     * @dev Get last feedback index for client
     */
    function getLastIndex(uint256 agentId, address clientAddress) external view returns (uint64) {
        return _lastIndex[agentId][clientAddress];
    }

    /**
     * @dev Read feedback with pagination
     */
    function readFeedbackPaginated(
        uint256 agentId,
        address clientAddress,
        uint64 startIndex,
        uint64 limit
    ) external view returns (
        uint64[] memory feedbackIndexes,
        int128[] memory values,
        uint8[] memory valueDecimals,
        string[] memory tag1s,
        string[] memory tag2s,
        bool[] memory revokedStatuses
    ) {
        uint64 lastIdx = _lastIndex[agentId][clientAddress];
        
        if (startIndex > lastIdx || startIndex == 0) {
            return (
                new uint64[](0),
                new int128[](0),
                new uint8[](0),
                new string[](0),
                new string[](0),
                new bool[](0)
            );
        }
        
        uint64 endIndex = startIndex + limit - 1;
        if (endIndex > lastIdx) {
            endIndex = lastIdx;
        }
        
        uint64 resultSize = endIndex - startIndex + 1;
        
        feedbackIndexes = new uint64[](resultSize);
        values = new int128[](resultSize);
        valueDecimals = new uint8[](resultSize);
        tag1s = new string[](resultSize);
        tag2s = new string[](resultSize);
        revokedStatuses = new bool[](resultSize);
        
        for (uint64 i = 0; i < resultSize; i++) {
            uint64 idx = startIndex + i;
            Feedback storage fb = _feedback[agentId][clientAddress][idx];
            
            feedbackIndexes[i] = idx;
            values[i] = fb.value;
            valueDecimals[i] = fb.valueDecimals;
            tag1s[i] = fb.tag1;
            tag2s[i] = fb.tag2;
            revokedStatuses[i] = fb.isRevoked;
        }
    }
}
