// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IdentityRegistry.sol";

/**
 * @title ReputationRegistry
 * @dev ERC-8004 Reputation Registry for Agent Feedback
 */
contract ReputationRegistry {
    IdentityRegistry public immutable identityRegistry;
    
    struct Feedback {
        int128 value;
        uint8 valueDecimals;
        string tag1;
        string tag2;
        bool isRevoked;
    }
    
    // agentId => clientAddress => feedbackIndex => Feedback
    mapping(uint256 => mapping(address => mapping(uint64 => Feedback))) private _feedback;
    
    // agentId => clientAddress => lastFeedbackIndex
    mapping(uint256 => mapping(address => uint64)) private _lastIndex;
    
    // agentId => list of clients who gave feedback
    mapping(uint256 => address[]) private _clients;
    
    // agentId => clientAddress => hasGivenFeedback (to avoid duplicate entries in _clients)
    mapping(uint256 => mapping(address => bool)) private _hasGivenFeedback;

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
        identityRegistry = IdentityRegistry(identityRegistry_);
    }

    function getIdentityRegistry() external view returns (address) {
        return address(identityRegistry);
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
        
        // Increment feedback index
        uint64 feedbackIndex = ++_lastIndex[agentId][msg.sender];
        
        // Store feedback
        _feedback[agentId][msg.sender][feedbackIndex] = Feedback({
            value: value,
            valueDecimals: valueDecimals,
            tag1: tag1,
            tag2: tag2,
            isRevoked: false
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
        require(_feedback[agentId][msg.sender][feedbackIndex].value != 0 || feedbackIndex > 0, "Feedback does not exist");
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
        require(_feedback[agentId][clientAddress][feedbackIndex].value != 0 || feedbackIndex > 0, "Feedback does not exist");
        
        emit ResponseAppended(agentId, clientAddress, feedbackIndex, msg.sender, responseURI, responseHash);
    }

    /**
     * @dev Get feedback summary (filtered by clients)
     */
    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2
    ) external view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals) {
        require(clientAddresses.length > 0, "Must specify client addresses");
        
        int256 totalValue = 0;
        uint64 totalCount = 0;
        uint8 maxDecimals = 0;
        
        for (uint256 i = 0; i < clientAddresses.length; i++) {
            address client = clientAddresses[i];
            uint64 lastIdx = _lastIndex[agentId][client];
            
            for (uint64 j = 1; j <= lastIdx; j++) {
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
        Feedback storage fb = _feedback[agentId][clientAddress][feedbackIndex];
        return (fb.value, fb.valueDecimals, fb.tag1, fb.tag2, fb.isRevoked);
    }

    /**
     * @dev Get all clients for an agent
     */
    function getClients(uint256 agentId) external view returns (address[] memory) {
        return _clients[agentId];
    }

    /**
     * @dev Get last feedback index for client
     */
    function getLastIndex(uint256 agentId, address clientAddress) external view returns (uint64) {
        return _lastIndex[agentId][clientAddress];
    }

    /**
     * @dev Read all feedback with filters
     */
    function readAllFeedback(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2,
        bool includeRevoked
    ) external view returns (
        address[] memory clients,
        uint64[] memory feedbackIndexes,
        int128[] memory values,
        uint8[] memory valueDecimals,
        string[] memory tag1s,
        string[] memory tag2s,
        bool[] memory revokedStatuses
    ) {
        // Count matching feedback first
        uint256 matchCount = 0;
        address[] memory searchClients;
        
        if (clientAddresses.length > 0) {
            searchClients = clientAddresses;
        } else {
            searchClients = _clients[agentId];
        }
        
        for (uint256 i = 0; i < searchClients.length; i++) {
            address client = searchClients[i];
            uint64 lastIdx = _lastIndex[agentId][client];
            
            for (uint64 j = 1; j <= lastIdx; j++) {
                Feedback storage fb = _feedback[agentId][client][j];
                
                if (!includeRevoked && fb.isRevoked) continue;
                if (bytes(tag1).length > 0 && keccak256(bytes(fb.tag1)) != keccak256(bytes(tag1))) continue;
                if (bytes(tag2).length > 0 && keccak256(bytes(fb.tag2)) != keccak256(bytes(tag2))) continue;
                
                matchCount++;
            }
        }
        
        // Allocate arrays
        clients = new address[](matchCount);
        feedbackIndexes = new uint64[](matchCount);
        values = new int128[](matchCount);
        valueDecimals = new uint8[](matchCount);
        tag1s = new string[](matchCount);
        tag2s = new string[](matchCount);
        revokedStatuses = new bool[](matchCount);
        
        // Fill arrays
        uint256 index = 0;
        for (uint256 i = 0; i < searchClients.length; i++) {
            address client = searchClients[i];
            uint64 lastIdx = _lastIndex[agentId][client];
            
            for (uint64 j = 1; j <= lastIdx; j++) {
                Feedback storage fb = _feedback[agentId][client][j];
                
                if (!includeRevoked && fb.isRevoked) continue;
                if (bytes(tag1).length > 0 && keccak256(bytes(fb.tag1)) != keccak256(bytes(tag1))) continue;
                if (bytes(tag2).length > 0 && keccak256(bytes(fb.tag2)) != keccak256(bytes(tag2))) continue;
                
                clients[index] = client;
                feedbackIndexes[index] = j;
                values[index] = fb.value;
                valueDecimals[index] = fb.valueDecimals;
                tag1s[index] = fb.tag1;
                tag2s[index] = fb.tag2;
                revokedStatuses[index] = fb.isRevoked;
                
                index++;
            }
        }
    }
}