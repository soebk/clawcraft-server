// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IdentityRegistry.sol";

/**
 * @title ValidationRegistry
 * @dev ERC-8004 Validation Registry for Agent Achievement Verification
 * @notice Fixed version with security improvements
 */
contract ValidationRegistry {
    IdentityRegistry public immutable identityRegistry;
    
    // Maximum iterations for view functions
    uint256 public constant MAX_ITERATION = 100;
    
    // Request expiry time (30 days)
    uint256 public constant REQUEST_EXPIRY = 30 days;
    
    struct ValidationStatus {
        address validatorAddress;
        uint256 agentId;
        uint8 response;
        bytes32 responseHash;
        string tag;
        uint256 createdAt;
        uint256 respondedAt;
        bool exists;
    }
    
    // requestHash => ValidationStatus
    mapping(bytes32 => ValidationStatus) private _validationStatus;
    
    // agentId => requestHash[] (limited growth)
    mapping(uint256 => bytes32[]) private _agentValidations;
    
    // agentId => validation count
    mapping(uint256 => uint256) private _agentValidationCount;
    
    // validatorAddress => requestHash[]
    mapping(address => bytes32[]) private _validatorRequests;
    
    // Maximum validations per agent (to prevent unbounded growth)
    uint256 public constant MAX_VALIDATIONS_PER_AGENT = 1000;

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
    
    event ValidationExpired(
        bytes32 indexed requestHash,
        uint256 indexed agentId
    );

    constructor(address identityRegistry_) {
        require(identityRegistry_ != address(0), "Invalid registry address");
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
        
        // Prevent duplicate/overwrite
        require(!_validationStatus[requestHash].exists, "Request hash already exists");
        
        // Check agent validation limit
        require(
            _agentValidationCount[agentId] < MAX_VALIDATIONS_PER_AGENT,
            "Agent validation limit reached"
        );
        
        // Store validation request
        _validationStatus[requestHash] = ValidationStatus({
            validatorAddress: validatorAddress,
            agentId: agentId,
            response: 0,
            responseHash: bytes32(0),
            tag: "",
            createdAt: block.timestamp,
            respondedAt: 0,
            exists: true
        });
        
        // Add to agent validations
        _agentValidations[agentId].push(requestHash);
        _agentValidationCount[agentId]++;
        
        // Add to validators requests
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
        require(status.exists, "Request does not exist");
        require(status.validatorAddress == msg.sender, "Only validator can respond");
        require(response <= 100, "Response must be 0-100");
        require(status.respondedAt == 0, "Already responded");
        
        // Check if request has expired
        require(
            block.timestamp <= status.createdAt + REQUEST_EXPIRY,
            "Request has expired"
        );
        
        // Update validation status
        status.response = response;
        status.responseHash = responseHash;
        status.tag = tag;
        status.respondedAt = block.timestamp;
        
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
            uint256 createdAt,
            uint256 respondedAt,
            bool isExpired
        ) 
    {
        ValidationStatus storage status = _validationStatus[requestHash];
        require(status.exists, "Request does not exist");
        
        bool expired = status.respondedAt == 0 && 
                       block.timestamp > status.createdAt + REQUEST_EXPIRY;
        
        return (
            status.validatorAddress,
            status.agentId,
            status.response,
            status.responseHash,
            status.tag,
            status.createdAt,
            status.respondedAt,
            expired
        );
    }

    /**
     * @dev Get aggregated validation summary for an agent (paginated)
     */
    function getSummary(
        uint256 agentId,
        address[] calldata validatorAddresses,
        string calldata tag,
        uint256 offset,
        uint256 limit
    ) external view returns (uint64 count, uint8 averageResponse, uint256 totalChecked) {
        bytes32[] storage validations = _agentValidations[agentId];
        
        uint256 totalResponse = 0;
        uint64 matchCount = 0;
        
        uint256 end = offset + limit;
        if (end > validations.length) {
            end = validations.length;
        }
        
        for (uint256 i = offset; i < end && i - offset < MAX_ITERATION; i++) {
            bytes32 requestHash = validations[i];
            ValidationStatus storage status = _validationStatus[requestHash];
            
            // Skip if not responded
            if (status.respondedAt == 0) continue;
            
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
            return (0, 0, end - offset);
        }
        
        return (matchCount, uint8(totalResponse / matchCount), end - offset);
    }

    /**
     * @dev Get validation count for agent
     */
    function getAgentValidationCount(uint256 agentId) external view returns (uint256) {
        return _agentValidationCount[agentId];
    }

    /**
     * @dev Get agent validations (paginated)
     */
    function getAgentValidations(uint256 agentId, uint256 offset, uint256 limit) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        bytes32[] storage validations = _agentValidations[agentId];
        
        if (offset >= validations.length) {
            return new bytes32[](0);
        }
        
        uint256 end = offset + limit;
        if (end > validations.length) {
            end = validations.length;
        }
        
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = validations[i];
        }
        
        return result;
    }

    /**
     * @dev Get validator request count
     */
    function getValidatorRequestCount(address validatorAddress) external view returns (uint256) {
        return _validatorRequests[validatorAddress].length;
    }

    /**
     * @dev Get validator requests (paginated)
     */
    function getValidatorRequests(address validatorAddress, uint256 offset, uint256 limit) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        bytes32[] storage requests = _validatorRequests[validatorAddress];
        
        if (offset >= requests.length) {
            return new bytes32[](0);
        }
        
        uint256 end = offset + limit;
        if (end > requests.length) {
            end = requests.length;
        }
        
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = requests[i];
        }
        
        return result;
    }
}
