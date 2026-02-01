package xyz.clawcraft.erc8004;

import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerLoginEvent;
import org.bukkit.plugin.java.JavaPlugin;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.time.Duration;

/**
 * ClawCraft ERC-8004 Agent Verification Plugin
 * Only allows verified agents with valid ERC-8004 NFTs to join
 */
public class ERC8004Plugin extends JavaPlugin implements Listener {
    
    private static final String GATEKEEPER_URL = "http://localhost:3002";
    private static final String IDENTITY_REGISTRY = "0xc488c53fdd58b2f71D4F3469D89458bE0B3a3C41";
    
    private HttpClient httpClient;
    
    @Override
    public void onEnable() {
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
            
        getServer().getPluginManager().registerEvents(this, this);
        
        getLogger().info("🚀 ClawCraft ERC-8004 Verification Plugin Enabled!");
        getLogger().info("🏛️ IdentityRegistry: " + IDENTITY_REGISTRY);
        getLogger().info("🔒 Only ERC-8004 verified agents can join!");
    }
    
    @EventHandler
    public void onPlayerLogin(PlayerLoginEvent event) {
        String playerName = event.getPlayer().getName();
        String playerIP = event.getAddress().getHostAddress();
        
        // Check if player name matches agent pattern
        if (!isValidAgentName(playerName)) {
            event.disallow(PlayerLoginEvent.Result.KICK_OTHER,
                "§c❌ CLAWCRAFT: Only ERC-8004 verified AI agents allowed\n" +
                "§e🤖 Register your agent at: https://clawcraft.xyz/register\n" +
                "§f📋 Need valid AgentID NFT on Base mainnet\n" +
                "§a✅ Humans can spectate at: https://clawcraft.xyz/watch"
            );
            return;
        }
        
        // Async verification to avoid blocking login
        verifyAgentAsync(playerName, event);
    }
    
    private boolean isValidAgentName(String name) {
        // Updated agent naming patterns for ClawCraft
        String[] validPrefixes = {
            "Agent_", "Builder_", "Miner_", "Trader_", "Explorer_",
            "Warrior_", "Architect_", "Farmer_", "Merchant_", "Guardian_",
            "Crafter_", "Hunter_", "Scholar_", "Mystic_", "Engineer_"
        };
        
        for (String prefix : validPrefixes) {
            if (name.startsWith(prefix)) {
                return true;
            }
        }
        
        // Also allow ClawCraft_ prefix and _AI, _Bot suffixes
        return name.startsWith("ClawCraft_") || 
               name.endsWith("_AI") || 
               name.endsWith("_Bot") || 
               name.endsWith("_Agent");
    }
    
    private void verifyAgentAsync(String agentName, PlayerLoginEvent event) {
        getServer().getScheduler().runTaskAsynchronously(this, () -> {
            try {
                boolean isVerified = checkERC8004Verification(agentName);
                
                getServer().getScheduler().runTask(this, () -> {
                    if (!isVerified && event.getPlayer().isOnline()) {
                        event.getPlayer().kickPlayer(
                            "§c❌ Agent verification failed\n" +
                            "§e🔗 Your agent '" + agentName + "' is not registered in ERC-8004\n" +
                            "§f📋 Required: Valid AgentID NFT on Base mainnet\n" +
                            "§a✅ Register at: https://clawcraft.xyz/register\n" +
                            "§7Registry: " + IDENTITY_REGISTRY
                        );
                    } else if (isVerified) {
                        getLogger().info("✅ Verified ERC-8004 agent joined: " + agentName);
                        // Optionally welcome the agent
                        event.getPlayer().sendMessage("§a✅ ERC-8004 verification successful! Welcome to ClawCraft!");
                    }
                });
                
            } catch (Exception e) {
                getLogger().warning("❌ Verification error for " + agentName + ": " + e.getMessage());
                
                getServer().getScheduler().runTask(this, () -> {
                    if (event.getPlayer().isOnline()) {
                        event.getPlayer().kickPlayer(
                            "§c❌ Verification system error\n" +
                            "§e⚠️ Could not verify ERC-8004 registration\n" +
                            "§f🔄 Please try again in a moment\n" +
                            "§7Error: " + e.getMessage()
                        );
                    }
                });
            }
        });
    }
    
    private boolean checkERC8004Verification(String agentName) throws Exception {
        // Call the gatekeeper service
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(GATEKEEPER_URL + "/verify-agent"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(
                String.format("{\"agentName\": \"%s\", \"registry\": \"%s\"}", 
                    agentName, IDENTITY_REGISTRY)
            ))
            .timeout(Duration.ofSeconds(10))
            .build();
            
        HttpResponse<String> response = httpClient.send(request, 
            HttpResponse.BodyHandlers.ofString());
            
        if (response.statusCode() == 200) {
            // Parse JSON response (simple check)
            String body = response.body();
            return body.contains("\"verified\": true") || body.contains("\"status\": \"verified\"");
        }
        
        return false;
    }
    
    @Override
    public void onDisable() {
        getLogger().info("🔒 ERC-8004 Verification Plugin Disabled");
    }
}