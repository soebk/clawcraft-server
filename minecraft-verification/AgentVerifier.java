package xyz.clawcraft.verification;

import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerLoginEvent;
import org.bukkit.plugin.java.JavaPlugin;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.contracts.Contract;
import org.web3j.tx.ReadonlyTransactionManager;
import org.web3j.tx.gas.DefaultGasProvider;
import java.math.BigInteger;
import java.util.concurrent.CompletableFuture;

/**
 * ERC-8004 Agent Verification Plugin for ClawCraft
 * Only allows ERC-8004 registered agents to join the server
 */
public class AgentVerifier extends JavaPlugin implements Listener {
    
    private Web3j web3j;
    private String identityRegistryAddress;
    private final String BASE_RPC_URL = "https://mainnet.base.org";
    
    @Override
    public void onEnable() {
        // Initialize Web3j connection to Base
        web3j = Web3j.build(new HttpService(BASE_RPC_URL));
        
        // Get contract address from config (set after deployment)
        identityRegistryAddress = getConfig().getString("identity-registry-address", "");
        
        if (identityRegistryAddress.isEmpty()) {
            getLogger().severe("❌ Identity Registry address not configured!");
            getPluginLoader().disablePlugin(this);
            return;
        }
        
        // Register event listener
        getServer().getPluginManager().registerEvents(this, this);
        
        getLogger().info("✅ ERC-8004 Agent Verifier enabled!");
        getLogger().info("🏛️ Identity Registry: " + identityRegistryAddress);
    }
    
    @EventHandler
    public void onPlayerLogin(PlayerLoginEvent event) {
        String playerName = event.getPlayer().getName();
        
        // Check if player name matches agent naming pattern
        if (!isAgentName(playerName)) {
            event.disallow(PlayerLoginEvent.Result.KICK_OTHER, 
                "§c❌ Only verified AI agents can join ClawCraft\n" +
                "§e🤖 Register at: https://clawcraft.xyz/register\n" +
                "§a✅ ERC-8004 verification required");
            return;
        }
        
        // Async verification to avoid blocking login
        CompletableFuture.supplyAsync(() -> {
            try {
                return verifyAgentRegistration(playerName);
            } catch (Exception e) {
                getLogger().warning("Verification error for " + playerName + ": " + e.getMessage());
                return false;
            }
        }).thenAccept(isVerified -> {
            if (!isVerified) {
                // Kick if not verified (async kick)
                getServer().getScheduler().runTask(this, () -> {
                    if (event.getPlayer().isOnline()) {
                        event.getPlayer().kickPlayer(
                            "§c❌ Agent not found in ERC-8004 registry\n" +
                            "§e🔗 Register at: https://clawcraft.xyz/register\n" +
                            "§f📋 Agent ID required for ClawCraft access"
                        );
                    }
                });
            } else {
                getLogger().info("✅ Verified agent joined: " + playerName);
            }
        });
    }
    
    /**
     * Check if username matches agent naming pattern
     * Agent names: Merchant_Maya, Builder_Bob, Architect_Atlas, etc.
     */
    private boolean isAgentName(String name) {
        // Agent naming patterns
        String[] agentPrefixes = {
            "Merchant_", "Builder_", "Architect_", "Lorekeeper_",
            "Innkeeper_", "Blacksmith_", "Farmer_", "Miner_", 
            "Guardian_", "Mystic_", "Explorer_", "Engineer_", 
            "Artist_", "ClawCraft_", "Agent_"
        };
        
        for (String prefix : agentPrefixes) {
            if (name.startsWith(prefix)) {
                return true;
            }
        }
        
        // Also allow if name ends with _AI or _Bot
        return name.endsWith("_AI") || name.endsWith("_Bot") || name.endsWith("_Agent");
    }
    
    /**
     * Verify agent is registered in ERC-8004 Identity Registry
     */
    private boolean verifyAgentRegistration(String agentName) throws Exception {
        // Load contract
        IdentityRegistryContract registry = IdentityRegistryContract.load(
            identityRegistryAddress,
            web3j,
            new ReadonlyTransactionManager(web3j, "0x0000000000000000000000000000000000000000"),
            new DefaultGasProvider()
        );
        
        // Method 1: Check if agent has metadata matching the name
        // We'll iterate through recent token IDs (agents are registered sequentially)
        
        // Get total supply or iterate through reasonable range
        for (int tokenId = 1; tokenId <= 1000; tokenId++) { // Check first 1000 agents
            try {
                // Check if token exists by trying to get owner
                String owner = registry.ownerOf(BigInteger.valueOf(tokenId)).send();
                if (owner.equals("0x0000000000000000000000000000000000000000")) {
                    continue; // Token doesn't exist
                }
                
                // Get agent URI and check if it contains our agent name
                String agentURI = registry.tokenURI(BigInteger.valueOf(tokenId)).send();
                
                if (agentURI.contains(agentName) || isAgentRegistrationValid(agentURI, agentName)) {
                    getLogger().info("✅ Found registered agent: " + agentName + " (ID: " + tokenId + ")");
                    return true;
                }
                
            } catch (Exception e) {
                // Token doesn't exist or error, continue
                continue;
            }
        }
        
        getLogger().warning("❌ Agent not found in registry: " + agentName);
        return false;
    }
    
    /**
     * Parse agent registration file and verify it's valid
     */
    private boolean isAgentRegistrationValid(String agentURI, String agentName) {
        try {
            // For data URIs, decode base64 and check JSON
            if (agentURI.startsWith("data:application/json;base64,")) {
                String base64Data = agentURI.substring("data:application/json;base64,".length());
                String jsonData = new String(java.util.Base64.getDecoder().decode(base64Data));
                
                // Simple check - see if JSON contains agent name and required fields
                return jsonData.contains(agentName) && 
                       jsonData.contains("eip-8004") &&
                       jsonData.contains("supportedTrust") &&
                       jsonData.contains("active") &&
                       jsonData.contains("true"); // active: true
            }
            
            // For HTTP URIs, could fetch and verify (implement if needed)
            return agentURI.contains(agentName);
            
        } catch (Exception e) {
            getLogger().warning("Error parsing agent registration: " + e.getMessage());
            return false;
        }
    }
}

/**
 * Generated contract wrapper for IdentityRegistry
 * (Simplified version - in practice would use Web3j codegen)
 */
class IdentityRegistryContract extends Contract {
    
    protected IdentityRegistryContract(String contractAddress, Web3j web3j, 
                                     ReadonlyTransactionManager transactionManager, 
                                     DefaultGasProvider gasProvider) {
        super("", contractAddress, web3j, transactionManager, gasProvider);
    }
    
    public static IdentityRegistryContract load(String contractAddress, Web3j web3j, 
                                              ReadonlyTransactionManager transactionManager, 
                                              DefaultGasProvider gasProvider) {
        return new IdentityRegistryContract(contractAddress, web3j, transactionManager, gasProvider);
    }
    
    // Contract functions (would be auto-generated)
    public org.web3j.protocol.core.RemoteFunctionCall<String> ownerOf(BigInteger tokenId) {
        final org.web3j.abi.datatypes.Function function = new org.web3j.abi.datatypes.Function(
            "ownerOf",
            java.util.Arrays.asList(new org.web3j.abi.datatypes.Uint(tokenId)),
            java.util.Arrays.asList(new org.web3j.abi.TypeReference<org.web3j.abi.datatypes.Address>() {})
        );
        return executeRemoteCallSingleValueReturn(function, String.class);
    }
    
    public org.web3j.protocol.core.RemoteFunctionCall<String> tokenURI(BigInteger tokenId) {
        final org.web3j.abi.datatypes.Function function = new org.web3j.abi.datatypes.Function(
            "tokenURI",
            java.util.Arrays.asList(new org.web3j.abi.datatypes.Uint(tokenId)),
            java.util.Arrays.asList(new org.web3j.abi.TypeReference<org.web3j.abi.datatypes.Utf8String>() {})
        );
        return executeRemoteCallSingleValueReturn(function, String.class);
    }
}