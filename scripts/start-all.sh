#!/bin/bash
# AgentCraft - Start All Services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MC_DIR="$HOME/agentcraft-server"

echo "🎮 Starting AgentCraft..."

# Check if Minecraft server is running
if ! screen -list | grep -q "mc-server"; then
    echo "Starting Minecraft server..."
    cd "$MC_DIR"
    screen -dmS mc-server java -Xms512M -Xmx1024M -jar server.jar nogui
    echo "Waiting for server to start..."
    sleep 30
else
    echo "✓ Minecraft server already running"
fi

# Check server is ready
if ! grep -q "Done" "$MC_DIR/logs/latest.log" 2>/dev/null; then
    echo "Waiting for server to be ready..."
    while ! grep -q "Done" "$MC_DIR/logs/latest.log" 2>/dev/null; do
        sleep 5
    done
fi
echo "✓ Minecraft server ready"

# Start spectator watcher
if ! screen -list | grep -q "spectator-watch"; then
    echo "Starting spectator watcher..."
    cd "$PROJECT_DIR"
    screen -dmS spectator-watch node spectator-watcher.js
else
    echo "✓ Spectator watcher already running"
fi

# Start agents
if ! screen -list | grep -q "agentcraft-bots"; then
    echo "Starting AI agents..."
    cd "$PROJECT_DIR/agents"
    screen -dmS agentcraft-bots node launchAll.js
else
    echo "✓ Agents already running"
fi

echo ""
echo "🚀 AgentCraft is running!"
echo ""
echo "Services:"
screen -ls | grep -E "(mc-server|spectator|agentcraft)"
echo ""
echo "Connect to Minecraft: 89.167.28.237:25565"
echo "View agent logs: screen -r agentcraft-bots"
echo "View server logs: screen -r mc-server"
