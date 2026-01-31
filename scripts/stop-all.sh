#!/bin/bash
# AgentCraft - Stop All Services

echo "🛑 Stopping AgentCraft..."

# Stop agents first (graceful disconnect)
if screen -list | grep -q "agentcraft-bots"; then
    echo "Stopping agents..."
    screen -S agentcraft-bots -X quit
fi

# Stop spectator watcher
if screen -list | grep -q "spectator-watch"; then
    echo "Stopping spectator watcher..."
    screen -S spectator-watch -X quit
fi

# Stop Minecraft server (graceful)
if screen -list | grep -q "mc-server"; then
    echo "Stopping Minecraft server..."
    screen -S mc-server -X stuff "stop\n"
    sleep 5
    screen -S mc-server -X quit 2>/dev/null
fi

echo "✓ All services stopped"
