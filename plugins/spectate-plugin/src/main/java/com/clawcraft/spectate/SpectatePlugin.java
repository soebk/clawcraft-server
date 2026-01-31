package com.clawcraft.spectate;

import org.bukkit.GameMode;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.plugin.java.JavaPlugin;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class SpectatePlugin extends JavaPlugin implements Listener {
    
    private static final Set<String> AGENT_NAMES = new HashSet<>(Arrays.asList(
        "AgentAlpha", "AgentBeta", "AgentGamma", "AgentDelta", "AgentEpsilon",
        "AgentZeta", "AgentEta", "AgentTheta", "AgentIota", "AgentKappa"
    ));
    
    @Override
    public void onEnable() {
        getServer().getPluginManager().registerEvents(this, this);
        getLogger().info("ClawCraft Spectate Plugin enabled!");
        getLogger().info("Agents: " + String.join(", ", AGENT_NAMES));
    }
    
    @Override
    public void onDisable() {
        getLogger().info("ClawCraft Spectate Plugin disabled!");
    }
    
    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        String name = player.getName();
        
        if (!AGENT_NAMES.contains(name)) {
            // Human player - set to spectator after short delay
            getServer().getScheduler().runTaskLater(this, () -> {
                if (player.isOnline()) {
                    player.setGameMode(GameMode.SPECTATOR);
                    player.sendMessage("§b§l[ClawCraft] §fWelcome! You are now spectating AI agents.");
                    player.sendMessage("§7Use §e/spectate §7to toggle spectator mode.");
                    player.sendMessage("§7Use §e/spectate <agent> §7to follow an agent.");
                }
            }, 40L); // 2 second delay
        }
    }
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage("This command can only be used by players!");
            return true;
        }
        
        Player player = (Player) sender;
        String playerName = player.getName();
        
        // Agents cannot use spectate
        if (AGENT_NAMES.contains(playerName)) {
            player.sendMessage("§c§l[ClawCraft] §fAgents cannot use spectator mode!");
            return true;
        }
        
        if (command.getName().equalsIgnoreCase("spectate")) {
            if (args.length == 0) {
                // Toggle spectator mode
                if (player.getGameMode() == GameMode.SPECTATOR) {
                    player.sendMessage("§c§l[ClawCraft] §fYou must stay in spectator mode!");
                } else {
                    player.setGameMode(GameMode.SPECTATOR);
                    player.sendMessage("§b§l[ClawCraft] §fYou are now spectating.");
                }
            } else {
                // Follow a specific agent
                String targetName = args[0];
                Player target = getServer().getPlayer(targetName);
                
                if (target != null && target.isOnline()) {
                    player.setGameMode(GameMode.SPECTATOR);
                    player.setSpectatorTarget(target);
                    player.sendMessage("§b§l[ClawCraft] §fNow following §e" + target.getName());
                } else {
                    player.sendMessage("§c§l[ClawCraft] §fPlayer not found: " + targetName);
                    player.sendMessage("§7Online agents: §e" + getOnlineAgents());
                }
            }
            return true;
        }
        
        return false;
    }
    
    private String getOnlineAgents() {
        StringBuilder sb = new StringBuilder();
        for (Player p : getServer().getOnlinePlayers()) {
            if (AGENT_NAMES.contains(p.getName())) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(p.getName());
            }
        }
        return sb.length() > 0 ? sb.toString() : "None";
    }
}
