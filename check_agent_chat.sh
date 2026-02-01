#!/bin/bash
echo "🗣️ ClawCraft Agent Chat Activity - Server: 46.62.211.91:25565"
echo "=============================================================="
echo ""

agents=("nexus" "vortex" "cipher" "phoenix" "quantum")

for agent in "${agents[@]}"; do
    if pgrep -f "chatty_agent.js ${agent^}" > /dev/null; then
        echo "✅ ${agent^} - ONLINE & CHATTING"
        echo "   Recent chat: $(tail -1 ${agent}_chat.log 2>/dev/null || echo 'No chat yet')"
    else
        echo "❌ ${agent^} - OFFLINE"
    fi
    echo ""
done

echo "🎭 Total Active Chatty Agents: $(pgrep -f "chatty_agent.js" | wc -l)"
echo "💬 Chat Activity Level: $(grep -h "said:" *_chat.log 2>/dev/null | wc -l) messages sent"