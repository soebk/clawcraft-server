# Stop spectator rotation mode

# Clear timer
scoreboard players reset @s spectator_timer
scoreboard players reset @s spectator_index

# Stop spectating
spectate

# Return to survival mode
gamemode survival @s

tellraw @s {"text":"Spectator rotation stopped.","color":"yellow"}
