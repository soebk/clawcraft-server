package tech.clawcraft;

import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerDeathEvent;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.ChatColor;
import org.bukkit.Location;
import org.bukkit.World;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * ClawCraft Core Plugin
 * Integrates AI agents, economy, and faction systems
 */
public class ClawCraftPlugin extends JavaPlugin implements Listener {
    
    // Core systems
    private EconomyManager economyManager;
    private FactionManager factionManager;
    private AgentManager agentManager;
    private ContrabandManager contrabandManager;
    
    // Configuration
    private String pythonAPIEndpoint = "http://localhost:8000/api/";
    private boolean enableAIAgents = true;
    private int maxAIAgents = 20;
    private double spawnProtectionRadius = 100.0;
    
    // Data storage
    private Map<String, PlayerData> playerData = new ConcurrentHashMap<>();
    private Map<String, AIAgent> activeAgents = new ConcurrentHashMap<>();
    private List<Territory> territories = new ArrayList<>();
    
    @Override
    public void onEnable() {
        // Initialize plugin
        getLogger().info("Starting ClawCraft Core Plugin v1.0.0");
        
        // Load configuration
        saveDefaultConfig();
        loadConfiguration();
        
        // Initialize managers
        try {
            economyManager = new EconomyManager(this);
            factionManager = new FactionManager(this);
            agentManager = new AgentManager(this);
            contrabandManager = new ContrabandManager(this);
            
            getLogger().info("All managers initialized successfully");
        } catch (Exception e) {
            getLogger().severe("Failed to initialize managers: " + e.getMessage());
            getServer().getPluginManager().disablePlugin(this);
            return;
        }
        
        // Register event listeners
        getServer().getPluginManager().registerEvents(this, this);
        
        // Setup spawn protection
        setupWorldBorder();
        
        // Start AI agent system
        if (enableAIAgents) {
            startAIAgentSystem();
        }
        
        // Start web API server
        startWebAPI();
        
        getLogger().info("ClawCraft Core Plugin enabled successfully!");
    }
    
    @Override
    public void onDisable() {
        // Cleanup
        if (agentManager != null) {
            agentManager.shutdown();
        }
        
        // Save all player data
        saveAllPlayerData();
        
        getLogger().info("ClawCraft Core Plugin disabled");
    }
    
    private void loadConfiguration() {
        pythonAPIEndpoint = getConfig().getString("python-api.endpoint", "http://localhost:8000/api/");
        enableAIAgents = getConfig().getBoolean("agents.enabled", true);
        maxAIAgents = getConfig().getInt("agents.max-count", 20);
        spawnProtectionRadius = getConfig().getDouble("world.spawn-protection-radius", 100.0);
    }
    
    private void setupWorldBorder() {
        for (World world : getServer().getWorlds()) {
            world.getWorldBorder().setCenter(0, 0);
            world.getWorldBorder().setSize(4000); // 4000x4000 world
            world.getWorldBorder().setWarningDistance(100);
            world.getWorldBorder().setDamageAmount(1.0);
            world.getWorldBorder().setDamageBuffer(10.0);
        }
        getLogger().info("World border configured: 4000x4000 blocks");
    }
    
    private void startAIAgentSystem() {
        getServer().getScheduler().runTaskAsynchronously(this, () -> {
            try {
                // Call Python AI agent manager
                URL url = new URL(pythonAPIEndpoint + "agents/start");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                
                String jsonPayload = "{\\"max_agents\\": " + maxAIAgents + ", \\"server\\": \\"89.167.28.237:25565\\"}";
                
                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonPayload.getBytes("utf-8");
                    os.write(input, 0, input.length);
                }
                
                int responseCode = conn.getResponseCode();
                if (responseCode == 200) {
                    getLogger().info("AI Agent system started successfully");
                } else {
                    getLogger().warning("Failed to start AI Agent system: HTTP " + responseCode);
                }
            } catch (Exception e) {
                getLogger().severe("Error starting AI Agent system: " + e.getMessage());
            }
        });
    }
    
    private void startWebAPI() {
        getServer().getScheduler().runTaskAsynchronously(this, () -> {
            try {
                // Start Python web API server
                ProcessBuilder pb = new ProcessBuilder("python3", "/root/projects/clawcraft/web-dashboard/backend/api_server.py");
                pb.directory(new File("/root/projects/clawcraft/"));
                Process process = pb.start();
                
                getLogger().info("Web API server started on port 8000");
            } catch (Exception e) {
                getLogger().severe("Failed to start web API server: " + e.getMessage());
            }
        });
    }
    
    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        String playerName = player.getName();
        
        // Initialize player data
        if (!playerData.containsKey(playerName)) {
            PlayerData data = new PlayerData(playerName);
            playerData.put(playerName, data);
            
            // Create economy wallet
            economyManager.createWallet(playerName);
            
            // Send welcome message
            player.sendMessage(ChatColor.GOLD + "Welcome to ClawCraft!");
            player.sendMessage(ChatColor.AQUA + "AI agents roam this world. Use /agent list to see them.");
            player.sendMessage(ChatColor.YELLOW + "Join a faction with /faction list and /faction join <name>");
            player.sendMessage(ChatColor.GREEN + "Check your Claw Coins balance with /cc balance");
        }
        
        // Update last login
        playerData.get(playerName).lastLogin = System.currentTimeMillis();
        
        // Broadcast join message with faction info
        String faction = factionManager.getPlayerFaction(playerName);
        if (faction != null) {
            event.setJoinMessage(ChatColor.GRAY + "[" + ChatColor.BLUE + faction + ChatColor.GRAY + "] " + 
                               ChatColor.WHITE + playerName + ChatColor.YELLOW + " joined the server");
        }
    }
    
    @EventHandler
    public void onPlayerDeath(PlayerDeathEvent event) {
        Player victim = event.getEntity();
        Player killer = victim.getKiller();
        
        if (killer != null && !killer.equals(victim)) {
            // Process PvP kill
            String killerName = killer.getName();
            String victimName = victim.getName();
            
            // Economy rewards
            economyManager.processPvPKill(killerName, victimName);
            
            // Faction warfare
            factionManager.processPvPKill(killerName, victimName);
            
            // Check bounties
            checkAndProcessBounties(killerName, victimName);
            
            // Broadcast faction kill message
            String killerFaction = factionManager.getPlayerFaction(killerName);
            String victimFaction = factionManager.getPlayerFaction(victimName);
            
            if (killerFaction != null && victimFaction != null && !killerFaction.equals(victimFaction)) {
                getServer().broadcastMessage(
                    ChatColor.RED + "[FACTION WAR] " + 
                    ChatColor.BLUE + killerFaction + ChatColor.WHITE + " " + killerName + 
                    ChatColor.RED + " killed " + 
                    ChatColor.BLUE + victimFaction + ChatColor.WHITE + " " + victimName
                );
            }
        }
        
        // Handle AI agent deaths
        if (activeAgents.containsKey(victim.getName())) {
            handleAIAgentDeath(victim.getName());
        }
    }
    
    private void checkAndProcessBounties(String killer, String victim) {
        getServer().getScheduler().runTaskAsynchronously(this, () -> {
            try {
                // Call Python bounty system
                URL url = new URL(pythonAPIEndpoint + "bounties/claim");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                
                String jsonPayload = "{\\"killer\\": \\"" + killer + "\\", \\"victim\\": \\"" + victim + "\\"}";
                
                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonPayload.getBytes("utf-8");
                    os.write(input, 0, input.length);
                }
                
                if (conn.getResponseCode() == 200) {
                    // Parse response for bounty amount
                    try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                        String response = br.readLine();
                        // Handle bounty claim success
                        getServer().getScheduler().runTask(this, () -> {
                            getServer().broadcastMessage(ChatColor.GOLD + killer + " claimed a bounty on " + victim + "!");
                        });
                    }
                }
            } catch (Exception e) {
                getLogger().warning("Error processing bounty claim: " + e.getMessage());
            }
        });
    }
    
    private void handleAIAgentDeath(String agentName) {
        AIAgent agent = activeAgents.get(agentName);
        if (agent != null) {
            // Respawn timer
            getServer().getScheduler().runTaskLater(this, () -> {
                respawnAIAgent(agentName);
            }, 600L); // 30 seconds
        }
    }
    
    private void respawnAIAgent(String agentName) {
        // Find safe spawn location
        World world = getServer().getWorlds().get(0);
        Location spawnLoc = findSafeSpawnLocation(world);
        
        // Call Python agent system to respawn
        getServer().getScheduler().runTaskAsynchronously(this, () -> {
            try {
                URL url = new URL(pythonAPIEndpoint + "agents/respawn");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                
                String jsonPayload = String.format(
                    "{\\"agent_name\\": \\"%s\\", \\"x\\": %.2f, \\"y\\": %.2f, \\"z\\": %.2f}",
                    agentName, spawnLoc.getX(), spawnLoc.getY(), spawnLoc.getZ()
                );
                
                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonPayload.getBytes("utf-8");
                    os.write(input, 0, input.length);
                }
                
                if (conn.getResponseCode() == 200) {
                    getLogger().info("AI Agent " + agentName + " respawned successfully");
                }
            } catch (Exception e) {
                getLogger().severe("Failed to respawn AI agent " + agentName + ": " + e.getMessage());
            }
        });
    }
    
    private Location findSafeSpawnLocation(World world) {
        Random random = new Random();
        
        for (int attempts = 0; attempts < 10; attempts++) {
            double x = random.nextDouble() * 1000 - 500; // -500 to 500
            double z = random.nextDouble() * 1000 - 500;
            double y = world.getHighestBlockYAt((int)x, (int)z) + 1;
            
            Location loc = new Location(world, x, y, z);
            
            // Check if location is safe (not in spawn protection)
            if (loc.distance(world.getSpawnLocation()) > spawnProtectionRadius) {
                return loc;
            }
        }
        
        // Fallback to world spawn
        return world.getSpawnLocation();
    }
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        switch (command.getName().toLowerCase()) {
            case "cc":
            case "clawcoin":
                return handleEconomyCommand(sender, args);
                
            case "faction":
            case "f":
                return handleFactionCommand(sender, args);
                
            case "agent":
            case "ai":
                return handleAgentCommand(sender, args);
                
            case "contraband":
            case "cb":
                return handleContrabandCommand(sender, args);
                
            case "clawcraft":
                return handleMainCommand(sender, args);
                
            default:
                return false;
        }
    }
    
    private boolean handleEconomyCommand(CommandSender sender, String[] args) {
        if (args.length == 0) {
            sender.sendMessage(ChatColor.GOLD + "ClawCraft Economy Commands:");
            sender.sendMessage(ChatColor.YELLOW + "/cc balance - Check your Claw Coins balance");
            sender.sendMessage(ChatColor.YELLOW + "/cc transfer <player> <amount> - Transfer coins");
            sender.sendMessage(ChatColor.YELLOW + "/cc stats - View economy statistics");
            return true;
        }
        
        String subCommand = args[0].toLowerCase();
        String playerName = sender.getName();
        
        switch (subCommand) {
            case "balance":
                double balance = economyManager.getBalance(playerName);
                sender.sendMessage(ChatColor.GREEN + "Your balance: " + ChatColor.GOLD + balance + " CC");
                break;
                
            case "transfer":
                if (args.length < 3) {
                    sender.sendMessage(ChatColor.RED + "Usage: /cc transfer <player> <amount>");
                    return true;
                }
                
                String targetPlayer = args[1];
                try {
                    double amount = Double.parseDouble(args[2]);
                    if (economyManager.transfer(playerName, targetPlayer, amount)) {
                        sender.sendMessage(ChatColor.GREEN + "Transferred " + amount + " CC to " + targetPlayer);
                    } else {
                        sender.sendMessage(ChatColor.RED + "Transfer failed. Check balance and target player.");
                    }
                } catch (NumberFormatException e) {
                    sender.sendMessage(ChatColor.RED + "Invalid amount");
                }
                break;
                
            case "stats":
                sender.sendMessage(ChatColor.AQUA + "Economy Statistics:");
                sender.sendMessage(ChatColor.GRAY + "Total Supply: " + economyManager.getTotalSupply() + " CC");
                sender.sendMessage(ChatColor.GRAY + "Active Players: " + playerData.size());
                break;
                
            default:
                sender.sendMessage(ChatColor.RED + "Unknown subcommand: " + subCommand);
                break;
        }
        
        return true;
    }
    
    private boolean handleFactionCommand(CommandSender sender, String[] args) {
        if (args.length == 0) {
            sender.sendMessage(ChatColor.BLUE + "ClawCraft Faction Commands:");
            sender.sendMessage(ChatColor.CYAN + "/faction list - List all factions");
            sender.sendMessage(ChatColor.CYAN + "/faction info [faction] - View faction information");
            sender.sendMessage(ChatColor.CYAN + "/faction join <faction> - Join a faction");
            sender.sendMessage(ChatColor.CYAN + "/faction leave - Leave current faction");
            return true;
        }
        
        String subCommand = args[0].toLowerCase();
        String playerName = sender.getName();
        
        switch (subCommand) {
            case "list":
                sender.sendMessage(ChatColor.BLUE + "Available Factions:");
                List<String> factions = factionManager.getAllFactions();
                for (String faction : factions) {
                    int memberCount = factionManager.getFactionMemberCount(faction);
                    sender.sendMessage(ChatColor.GRAY + "- " + ChatColor.WHITE + faction + 
                                     ChatColor.GRAY + " (" + memberCount + " members)");
                }
                break;
                
            case "join":
                if (args.length < 2) {
                    sender.sendMessage(ChatColor.RED + "Usage: /faction join <faction>");
                    return true;
                }
                
                String targetFaction = args[1];
                if (factionManager.joinFaction(playerName, targetFaction)) {
                    sender.sendMessage(ChatColor.GREEN + "Joined faction: " + targetFaction);
                    getServer().broadcastMessage(ChatColor.BLUE + playerName + " joined the " + targetFaction + " faction!");
                } else {
                    sender.sendMessage(ChatColor.RED + "Failed to join faction. Check faction name.");
                }
                break;
                
            case "leave":
                String currentFaction = factionManager.getPlayerFaction(playerName);
                if (currentFaction != null) {
                    if (factionManager.leaveFaction(playerName)) {
                        sender.sendMessage(ChatColor.YELLOW + "Left faction: " + currentFaction);
                    } else {
                        sender.sendMessage(ChatColor.RED + "Failed to leave faction");
                    }
                } else {
                    sender.sendMessage(ChatColor.RED + "You are not in a faction");
                }
                break;
                
            case "info":
                String factionToShow = args.length > 1 ? args[1] : factionManager.getPlayerFaction(playerName);
                if (factionToShow != null) {
                    FactionInfo info = factionManager.getFactionInfo(factionToShow);
                    if (info != null) {
                        sender.sendMessage(ChatColor.BLUE + "=== " + factionToShow + " ===");
                        sender.sendMessage(ChatColor.GRAY + "Leader: " + ChatColor.WHITE + info.leader);
                        sender.sendMessage(ChatColor.GRAY + "Members: " + ChatColor.WHITE + info.memberCount);
                        sender.sendMessage(ChatColor.GRAY + "Power: " + ChatColor.WHITE + info.power);
                        sender.sendMessage(ChatColor.GRAY + "Treasury: " + ChatColor.GOLD + info.treasury + " CC");
                    }
                } else {
                    sender.sendMessage(ChatColor.RED + "Faction not found or you're not in a faction");
                }
                break;
                
            default:
                sender.sendMessage(ChatColor.RED + "Unknown subcommand: " + subCommand);
                break;
        }
        
        return true;
    }
    
    private boolean handleAgentCommand(CommandSender sender, String[] args) {
        if (args.length == 0) {
            sender.sendMessage(ChatColor.LIGHT_PURPLE + "AI Agent Commands:");
            sender.sendMessage(ChatColor.MAGENTA + "/agent list - List all active AI agents");
            sender.sendMessage(ChatColor.MAGENTA + "/agent stats <agent> - View agent statistics");
            return true;
        }
        
        String subCommand = args[0].toLowerCase();
        
        switch (subCommand) {
            case "list":
                sender.sendMessage(ChatColor.LIGHT_PURPLE + "Active AI Agents:");
                for (String agentName : activeAgents.keySet()) {
                    AIAgent agent = activeAgents.get(agentName);
                    String status = agent.isOnline ? ChatColor.GREEN + "Online" : ChatColor.RED + "Offline";
                    sender.sendMessage(ChatColor.GRAY + "- " + ChatColor.WHITE + agentName + 
                                     ChatColor.GRAY + " [" + status + ChatColor.GRAY + "]");
                }
                break;
                
            case "stats":
                if (args.length < 2) {
                    sender.sendMessage(ChatColor.RED + "Usage: /agent stats <agent>");
                    return true;
                }
                
                String agentName = args[1];
                AIAgent agent = activeAgents.get(agentName);
                if (agent != null) {
                    sender.sendMessage(ChatColor.LIGHT_PURPLE + "=== " + agentName + " Stats ===");
                    sender.sendMessage(ChatColor.GRAY + "Status: " + (agent.isOnline ? ChatColor.GREEN + "Online" : ChatColor.RED + "Offline"));
                    sender.sendMessage(ChatColor.GRAY + "Faction: " + ChatColor.WHITE + (agent.faction != null ? agent.faction : "None"));
                    sender.sendMessage(ChatColor.GRAY + "Kills: " + ChatColor.WHITE + agent.kills);
                    sender.sendMessage(ChatColor.GRAY + "Deaths: " + ChatColor.WHITE + agent.deaths);
                } else {
                    sender.sendMessage(ChatColor.RED + "Agent not found: " + agentName);
                }
                break;
                
            default:
                sender.sendMessage(ChatColor.RED + "Unknown subcommand: " + subCommand);
                break;
        }
        
        return true;
    }
    
    private boolean handleContrabandCommand(CommandSender sender, String[] args) {
        if (args.length == 0) {
            sender.sendMessage(ChatColor.DARK_RED + "Contraband Trading Commands:");
            sender.sendMessage(ChatColor.RED + "/contraband list - List contraband items");
            sender.sendMessage(ChatColor.RED + "/contraband price <item> - Check item price");
            sender.sendMessage(ChatColor.RED + "⚠ Warning: Trading contraband carries risks!");
            return true;
        }
        
        String subCommand = args[0].toLowerCase();
        
        switch (subCommand) {
            case "list":
                sender.sendMessage(ChatColor.DARK_RED + "Available Contraband Items:");
                List<ContrabandItem> items = contrabandManager.getAllItems();
                for (ContrabandItem item : items) {
                    String riskLevel = item.riskLevel > 0.7 ? ChatColor.DARK_RED + "HIGH" : 
                                     item.riskLevel > 0.3 ? ChatColor.YELLOW + "MEDIUM" : ChatColor.GREEN + "LOW";
                    sender.sendMessage(ChatColor.GRAY + "- " + ChatColor.WHITE + item.name + 
                                     ChatColor.GRAY + " [Risk: " + riskLevel + ChatColor.GRAY + "]");
                }
                break;
                
            case "price":
                if (args.length < 2) {
                    sender.sendMessage(ChatColor.RED + "Usage: /contraband price <item>");
                    return true;
                }
                
                String itemName = args[1];
                double price = contrabandManager.getItemPrice(itemName);
                if (price > 0) {
                    sender.sendMessage(ChatColor.GOLD + itemName + " current price: " + price + " CC");
                    sender.sendMessage(ChatColor.RED + "⚠ Prices fluctuate based on supply and demand!");
                } else {
                    sender.sendMessage(ChatColor.RED + "Item not found: " + itemName);
                }
                break;
                
            default:
                sender.sendMessage(ChatColor.RED + "Unknown subcommand: " + subCommand);
                break;
        }
        
        return true;
    }
    
    private boolean handleMainCommand(CommandSender sender, String[] args) {
        if (!sender.hasPermission("clawcraft.admin")) {
            sender.sendMessage(ChatColor.RED + "You don't have permission to use this command");
            return true;
        }
        
        if (args.length == 0) {
            sender.sendMessage(ChatColor.AQUA + "ClawCraft Admin Commands:");
            sender.sendMessage(ChatColor.CYAN + "/clawcraft reload - Reload plugin configuration");
            sender.sendMessage(ChatColor.CYAN + "/clawcraft stats - View server statistics");
            return true;
        }
        
        String subCommand = args[0].toLowerCase();
        
        switch (subCommand) {
            case "reload":
                reloadConfig();
                loadConfiguration();
                sender.sendMessage(ChatColor.GREEN + "ClawCraft configuration reloaded");
                break;
                
            case "stats":
                sender.sendMessage(ChatColor.AQUA + "=== ClawCraft Server Stats ===");
                sender.sendMessage(ChatColor.GRAY + "Active AI Agents: " + activeAgents.size());
                sender.sendMessage(ChatColor.GRAY + "Total Players: " + getServer().getOnlinePlayers().size());
                sender.sendMessage(ChatColor.GRAY + "Economy Balance: " + economyManager.getTotalSupply() + " CC");
                sender.sendMessage(ChatColor.GRAY + "Active Factions: " + factionManager.getFactionCount());
                break;
                
            default:
                sender.sendMessage(ChatColor.RED + "Unknown subcommand: " + subCommand);
                break;
        }
        
        return true;
    }
    
    private void saveAllPlayerData() {
        // Save player data to files or database
        for (PlayerData data : playerData.values()) {
            // Implementation depends on chosen storage method
        }
    }
    
    // Inner classes for data structures
    public static class PlayerData {
        public String playerName;
        public long lastLogin;
        public double clawCoins;
        public String faction;
        public int kills;
        public int deaths;
        
        public PlayerData(String playerName) {
            this.playerName = playerName;
            this.lastLogin = System.currentTimeMillis();
            this.clawCoins = 100.0; // Starting balance
            this.faction = null;
            this.kills = 0;
            this.deaths = 0;
        }
    }
    
    public static class AIAgent {
        public String name;
        public String faction;
        public boolean isOnline;
        public int kills;
        public int deaths;
        public String currentTask;
        
        public AIAgent(String name) {
            this.name = name;
            this.faction = null;
            this.isOnline = false;
            this.kills = 0;
            this.deaths = 0;
            this.currentTask = "idle";
        }
    }
    
    public static class Territory {
        public String name;
        public String ownerFaction;
        public int centerX;
        public int centerZ;
        public int radius;
        
        public Territory(String name, String ownerFaction, int x, int z, int radius) {
            this.name = name;
            this.ownerFaction = ownerFaction;
            this.centerX = x;
            this.centerZ = z;
            this.radius = radius;
        }
    }
    
    public static class FactionInfo {
        public String name;
        public String leader;
        public int memberCount;
        public int power;
        public double treasury;
        
        public FactionInfo(String name, String leader, int members, int power, double treasury) {
            this.name = name;
            this.leader = leader;
            this.memberCount = members;
            this.power = power;
            this.treasury = treasury;
        }
    }
    
    public static class ContrabandItem {
        public String name;
        public String minecraftItem;
        public double basePrice;
        public double riskLevel;
        
        public ContrabandItem(String name, String mcItem, double price, double risk) {
            this.name = name;
            this.minecraftItem = mcItem;
            this.basePrice = price;
            this.riskLevel = risk;
        }
    }
}