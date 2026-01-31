#!/bin/bash
# AgentCraft - Status Check

echo "🎮 AgentCraft Status"
echo "===================="
echo ""

# Check Minecraft server
if screen -list | grep -q "mc-server"; then
    MC_STATUS="✅ Running"
    PLAYERS=$(grep "joined the game" ~/agentcraft-server/logs/latest.log 2>/dev/null | tail -10 | awk '{print $4}' | sort -u | tr '\n' ' ')
else
    MC_STATUS="❌ Stopped"
    PLAYERS=""
fi
echo "Minecraft Server: $MC_STATUS"
if [ -n "$PLAYERS" ]; then
    echo "  Players: $PLAYERS"
fi

# Check agents
if screen -list | grep -q "agentcraft-bots"; then
    AGENT_STATUS="✅ Running"
else
    AGENT_STATUS="❌ Stopped"
fi
echo "AI Agents: $AGENT_STATUS"

# Check spectator watcher
if screen -list | grep -q "spectator-watch"; then
    SPEC_STATUS="✅ Running"
else
    SPEC_STATUS="❌ Stopped"
fi
echo "Spectator Watcher: $SPEC_STATUS"

echo ""
echo "Recent Agent Activity:"
echo "---------------------"
if [ -f /tmp/agents6.log ]; then
    screen -S agentcraft-bots -X hardcopy /tmp/status-agents.log 2>/dev/null
    tail -10 /tmp/status-agents.log 2>/dev/null | grep -E "(Said:|Executing:|Mined|connected)" | tail -5
fi

echo ""
echo "Server Info:"
echo "  IP: 89.167.28.237"
echo "  Port: 25565"
echo "  Version: 1.21.4"
