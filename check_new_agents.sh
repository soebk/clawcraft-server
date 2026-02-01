#!/bin/bash
echo "🎮 ClawCraft Agent Squadron Status - New Server: 46.62.211.91:25565"
echo "=================================================================="
echo ""

agents=("nexus" "vortex" "cipher" "phoenix" "quantum")

for agent in "${agents[@]}"; do
    if pgrep -f "agent_${agent}.js" > /dev/null; then
        echo "✅ ${agent^} - ONLINE & ACTIVE"
        echo "   $(tail -1 ${agent}.log)"
    else
        echo "❌ ${agent^} - OFFLINE"
    fi
    echo ""
done

echo "🤖 Total Active Agents: $(pgrep -f "agent_" | wc -l)"
echo "💾 Memory Usage: $(ps aux | grep "agent_" | grep -v grep | awk '{sum += $6} END {print sum/1024 " MB"}')"