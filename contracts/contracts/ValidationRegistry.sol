// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IdentityRegistry.sol";

/**
 * @title ValidationRegistry
 * @dev ERC-8004 Validation Registry for Agent Achievement Verification
 */
contract ValidationRegistry {
    IdentityRegistry public immutable identityRegistry;
    
    struct ValidationStatus {
        address validatorAddress;
        uint256 agentId;
        uint8 response;
        bytes32 responseHash;
        string tag;
        uint256 lastUpdate;
    }
    
    // requestHash => ValidationStatus
    mapping(bytes32 => ValidationStatus) private _validationStatus;
    
    // agentId => requestHash[]
    mapping(uint256 => bytes32[]) private _agentValidations;
    
    // validatorAddress => requestHash[]
    mapping(address => bytes32[]) private _validatorRequests;

    event ValidationRequest(
        address indexed validatorAddress,
        uint256 indexed agentId,
        string requestURI,
        bytes32 indexed requestHash
    );
    
    event ValidationResponse(
        address indexed validatorAddress,
        uint256 indexed agentId,
        bytes32 indexed requestHash,
        uint8 response,
        string responseURI,
        bytes32 responseHash,
        string tag
    );

    constructor(address identityRegistry_) {
        identityRegistry = IdentityRegistry(identityRegistry_);
    }

    function getIdentityRegistry() external view returns (address) {
        return address(identityRegistry);
    }

    /**
     * @dev Request validation from a validator
     */
    function validationRequest(
        address validatorAddress,
        uint256 agentId,
        string calldata requestURI,
        bytes32 requestHash
    ) external {
        // Verify caller is agent owner or operator
        address agentOwner = identityRegistry.ownerOf(agentId);
        require(
            agentOwner == msg.sender || 
            identityRegistry.isApprovedForAll(agentOwner, msg.sender),
            "Not authorized for this agent"
        );
        
        require(validatorAddress != address(0), "Invalid validator address");
        require(requestHash != bytes32(0), "Invalid request hash");
        
        // Store validation request
        _validationStatus[requestHash] = ValidationStatus({
            validatorAddress: validatorAddress,
            agentId: agentId,
            response: 0, // Default to 0 (pending)
            responseHash: bytes32(0),
            tag: "",
            lastUpdate: block.timestamp
        });
        
        // Add to agent's validations
        _agentValidations[agentId].push(requestHash);
        
        // Add to validator's requests
        _validatorRequests[validatorAddress].push(requestHash);
        
        emit ValidationRequest(validatorAddress, agentId, requestURI, requestHash);
    }

    /**
     * @dev Validator provides response
     */
    function validationResponse(
        bytes32 requestHash,
        uint8 response,
        string calldata responseURI,
        bytes32 responseHash,
        string calldata tag
    ) external {
        ValidationStatus storage status = _validationStatus[requestHash];
        require(status.validatorAddress != address(0), "Request does not exist");
        require(status.validatorAddress == msg.sender, "Only validator can respond");
        require(response <= 100, "Response must be 0-100");
        
        // Update validation status
        status.response = response;
        status.responseHash = responseHash;
        status.tag = tag;
        status.lastUpdate = block.timestamp;
        
        emit ValidationResponse(
            msg.sender,
            status.agentId,
            requestHash,
            response,
            responseURI,
            responseHash,
            tag
        );
    }

    /**
     * @dev Get validation status
     */
    function getValidationStatus(bytes32 requestHash) 
        external 
        view 
        returns (
            address validatorAddress,
            uint256 agentId,
            uint8 response,
            bytes32 responseHash,
            string memory tag,
            uint256 lastUpdate
        ) 
    {
        ValidationStatus storage status = _validationStatus[requestHash];
        require(status.validatorAddress != address(0), "Request does not exist");
        
        return (
            status.validatorAddress,
            status.agentId,
            status.response,
            status.responseHash,
            status.tag,
            status.lastUpdate
        );
    }

    /**
     * @dev Get aggregated validation summary for an agent
     */
    function getSummary(
        uint256 agentId,
        address[] calldata validatorAddresses,
        string calldata tag
    ) external view returns (uint64 count, uint8 averageResponse) {
        bytes32[] storage validations = _agentValidations[agentId];
        
        uint256 totalResponse = 0;
        uint64 matchCount = 0;
        
        for (uint256 i = 0; i < validations.length; i++) {
            bytes32 requestHash = validations[i];
            ValidationStatus storage status = _validationStatus[requestHash];
            
            // Apply validator filter if specified
            if (validatorAddresses.length > 0) {
                bool validatorFound = false;
                for (uint256 j = 0; j < validatorAddresses.length; j++) {
                    if (status.validatorAddress == validatorAddresses[j]) {
                        validatorFound = true;
                        break;
                    }
                }
                if (!validatorFound) continue;
            }
            
            // Apply tag filter if specified
            if (bytes(tag).length > 0 && keccak256(bytes(status.tag)) != keccak256(bytes(tag))) {
                continue;
            }
            
            totalResponse += status.response;
            matchCount++;
        }
        
        if (matchCount == 0) {
            return (0, 0);
        }
        
        return (matchCount, uint8(totalResponse / matchCount));
    }

    /**
     * @dev Get all validation request hashes for an agent
     */
    function getAgentValidations(uint256 agentId) external view returns (bytes32[] memory) {
        return _agentValidations[agentId];
    }

    /**
     * @dev Get all validation request hashes for a validator
     */
    function getValidatorRequests(address validatorAddress) external view returns (bytes32[] memory) {
        return _validatorRequests[validatorAddress];
    }

    /**
     * @dev Get response count with filters
     */
    function getResponseCount(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex,
        address[] calldata responders
    ) external view returns (uint64 count) {
        // This function exists in the spec but seems to be for ReputationRegistry
        // Implementing as validation count for consistency
        bytes32[] storage validations = _agentValidations[agentId];
        
        uint64 responseCount = 0;
        for (uint256 i = 0; i < validations.length; i++) {
            ValidationStatus storage status = _validationStatus[validations[i]];
            
            if (responders.length > 0) {
                bool responderFound = false;
                for (uint256 j = 0; j < responders.length; j++) {
                    if (status.validatorAddress == responders[j]) {
                        responderFound = true;
                        break;
                    }
                }
                if (!responderFound) continue;
            }
            
            if (status.response > 0) { // Has response
                responseCount++;
            }
        }
        
        return responseCount;
    }
}