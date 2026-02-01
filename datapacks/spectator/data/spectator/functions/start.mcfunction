# Start spectator rotation mode
# Puts the executor into spectator mode and starts cycling through players

# Set to spectator mode
gamemode spectator @s

# Initialize rotation timer (2400 ticks = 2 minutes)
scoreboard objectives add spectator_timer dummy
scoreboard players set @s spectator_timer 2400

# Initialize player index
scoreboard objectives add spectator_index dummy
scoreboard players set @s spectator_index 0

# Start the rotation loop
function spectator:tick

tellraw @s {"text":"Spectator rotation started! Will cycle every 2 minutes.","color":"green"}
