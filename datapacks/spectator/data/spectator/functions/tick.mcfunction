# Tick function - runs every tick for spectators
# Decrements timer and rotates when it hits 0

# Only run for players in spectator mode with active timer
execute as @a[gamemode=spectator,scores={spectator_timer=1..}] run scoreboard players remove @s spectator_timer 1

# When timer hits 0, rotate to next player
execute as @a[gamemode=spectator,scores={spectator_timer=0}] run function spectator:rotate
