#!/bin/bash
# Spectator Mode Setup Script

echo "👁️ Configuring server for spectator-only human access..."

# Set default gamemode to spectator
screen -r minecraft -X stuff 'defaultgamemode spectator\n'
sleep 1

# Disable mob spawning (you have protective golems already)
screen -r minecraft -X stuff 'gamerule doMobSpawning false\n'
sleep 1

# Keep inventory on death
screen -r minecraft -X stuff 'gamerule keepInventory true\n'
sleep 1

# Give TestBuilder operator status
screen -r minecraft -X stuff 'op TestBuilder\n'
sleep 1

# Set spawn protection radius
screen -r minecraft -X stuff 'gamerule spawnRadius 0\n'
sleep 1

# Create spawn point command
screen -r minecraft -X stuff 'setworldspawn\n'
sleep 1

echo "✅ Server configured for spectator mode!"
echo "👁️ Human players will automatically be in spectator mode"
echo "🤖 TestBuilder has operator privileges for building"

# Function to force spectator mode for specific players
force_spectator() {
    local player=$1
    echo "👁️ Forcing $player to spectator mode..."
    screen -r minecraft -X stuff "gamemode spectator $player\n"
    sleep 1
    screen -r minecraft -X stuff "tellraw $player {\"text\":\"👁️ SPECTATOR MODE: Watch TestBuilder build!\",\"color\":\"yellow\"}\n"
    sleep 1
    screen -r minecraft -X stuff "tp $player TestBuilder\n"
}

# If player name provided as argument, force them to spectator
if [ ! -z "$1" ]; then
    force_spectator "$1"
fi

echo "🎮 To manually put a player in spectator mode: ./spectator-setup.sh <playername>"