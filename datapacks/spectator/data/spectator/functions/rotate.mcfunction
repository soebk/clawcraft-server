# Rotate to the next player in the list
# This cycles through all non-spectator players

# Reset timer for next rotation (2400 ticks = 2 minutes)
scoreboard players set @s spectator_timer 2400

# Increment index
scoreboard players add @s spectator_index 1

# Count online non-spectator players
execute store result score #player_count spectator_timer run execute if entity @a[gamemode=!spectator]

# Reset index if it exceeds player count
execute if score @s spectator_index >= #player_count spectator_timer run scoreboard players set @s spectator_index 0

# Spectate the player at current index
# Note: Minecraft doesn't have native array indexing, so we use a workaround
execute if score @s spectator_index matches 0 run spectate @a[gamemode=!spectator,limit=1,sort=nearest]
execute if score @s spectator_index matches 1 run spectate @a[gamemode=!spectator,limit=1,sort=furthest]
execute if score @s spectator_index matches 2 run spectate @r[gamemode=!spectator]

# Announce rotation
execute if entity @a[gamemode=!spectator] run tellraw @s [{"text":"Now spectating: ","color":"gray"},{"selector":"@a[gamemode=!spectator,limit=1,sort=nearest]","color":"yellow"}]
