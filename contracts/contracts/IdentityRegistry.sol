// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title IdentityRegistry
 * @dev ERC-8004 Identity Registry for Trustless Agents
 */
contract IdentityRegistry is ERC721URIStorage, Ownable, EIP712 {
    using ECDSA for bytes32;

    uint256 private _nextAgentId = 1;
    
    // agentId => metadataKey => metadataValue
    mapping(uint256 => mapping(string => bytes)) private _metadata;
    
    // agentId => wallet address (for payments)
    mapping(uint256 => address) private _agentWallets;
    
    // EIP-712 type hash for wallet updates
    bytes32 private constant WALLET_UPDATE_TYPEHASH = 
        keccak256("WalletUpdate(uint256 agentId,address newWallet,uint256 deadline)");

    struct MetadataEntry {
        string metadataKey;
        bytes metadataValue;
    }

    event Registered(uint256 indexed agentId, string agentURI, address indexed owner);
    event MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue);
    event URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy);

    constructor() ERC721("AgentIdentity", "AGENT") EIP712("IdentityRegistry", "1") Ownable(msg.sender) {}

    /**
     * @dev Register a new agent with URI and optional metadata
     */
    function register(string calldata agentURI, MetadataEntry[] calldata metadata) 
        external 
        returns (uint256 agentId) 
    {
        agentId = _nextAgentId++;
        _mint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);
        
        // Set agentWallet to owner by default
        _agentWallets[agentId] = msg.sender;
        emit MetadataSet(agentId, "agentWallet", "agentWallet", abi.encodePacked(msg.sender));
        
        // Set additional metadata
        for (uint256 i = 0; i < metadata.length; i++) {
            require(
                keccak256(bytes(metadata[i].metadataKey)) != keccak256(bytes("agentWallet")),
                "Cannot set reserved agentWallet key"
            );
            _metadata[agentId][metadata[i].metadataKey] = metadata[i].metadataValue;
            emit MetadataSet(agentId, metadata[i].metadataKey, metadata[i].metadataKey, metadata[i].metadataValue);
        }
        
        emit Registered(agentId, agentURI, msg.sender);
    }

    /**
     * @dev Register a new agent with just URI
     */
    function register(string calldata agentURI) external returns (uint256 agentId) {
        MetadataEntry[] memory emptyMetadata;
        return this.register(agentURI, emptyMetadata);
    }

    /**
     * @dev Register a new agent (URI set later)
     */
    function register() external returns (uint256 agentId) {
        return this.register("");
    }

    /**
     * @dev Update agent URI
     */
    function setAgentURI(uint256 agentId, string calldata newURI) external {
        require(_isAuthorized(_ownerOf(agentId), msg.sender, agentId), "Not authorized");
        _setTokenURI(agentId, newURI);
        emit URIUpdated(agentId, newURI, msg.sender);
    }

    /**
     * @dev Get metadata for an agent
     */
    function getMetadata(uint256 agentId, string calldata metadataKey) 
        external 
        view 
        returns (bytes memory) 
    {
        require(_ownerOf(agentId) != address(0), "Agent does not exist");
        
        if (keccak256(bytes(metadataKey)) == keccak256(bytes("agentWallet"))) {
            return abi.encodePacked(_agentWallets[agentId]);
        }
        
        return _metadata[agentId][metadataKey];
    }

    /**
     * @dev Set metadata for an agent
     */
    function setMetadata(uint256 agentId, string calldata metadataKey, bytes calldata metadataValue) 
        external 
    {
        require(_isAuthorized(_ownerOf(agentId), msg.sender, agentId), "Not authorized");
        require(
            keccak256(bytes(metadataKey)) != keccak256(bytes("agentWallet")),
            "Use setAgentWallet for wallet updates"
        );
        
        _metadata[agentId][metadataKey] = metadataValue;
        emit MetadataSet(agentId, metadataKey, metadataKey, metadataValue);
    }

    /**
     * @dev Set agent wallet with signature verification
     */
    function setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes calldata signature) 
        external 
    {
        require(_isAuthorized(_ownerOf(agentId), msg.sender, agentId), "Not authorized");
        require(block.timestamp <= deadline, "Signature expired");
        
        bytes32 structHash = keccak256(abi.encode(WALLET_UPDATE_TYPEHASH, agentId, newWallet, deadline));
        bytes32 hash = _hashTypedDataV4(structHash);
        
        address signer = hash.recover(signature);
        require(signer == newWallet, "Invalid signature");
        
        _agentWallets[agentId] = newWallet;
        emit MetadataSet(agentId, "agentWallet", "agentWallet", abi.encodePacked(newWallet));
    }

    /**
     * @dev Get agent wallet address
     */
    function getAgentWallet(uint256 agentId) external view returns (address) {
        require(_ownerOf(agentId) != address(0), "Agent does not exist");
        return _agentWallets[agentId];
    }

    /**
     * @dev Unset agent wallet (reset to zero address)
     */
    function unsetAgentWallet(uint256 agentId) external {
        require(_isAuthorized(_ownerOf(agentId), msg.sender, agentId), "Not authorized");
        _agentWallets[agentId] = address(0);
        emit MetadataSet(agentId, "agentWallet", "agentWallet", abi.encodePacked(address(0)));
    }

    /**
     * @dev Clear agent wallet on transfer
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        if (from != address(0) && to != address(0)) { // Transfer (not mint/burn)
            _agentWallets[tokenId] = address(0);
            emit MetadataSet(tokenId, "agentWallet", "agentWallet", abi.encodePacked(address(0)));
        }
        
        return super._update(to, tokenId, auth);
    }
}