#!/bin/bash
echo "⚔️ ClawCraft Smart Survival Agents Status - Server: 46.62.211.91:25565"
echo "====================================================================="
echo ""
echo "🎮 SURVIVAL MODE FEATURES:"
echo "   ✅ Actual mining, building, farming, crafting activities"
echo "   ✅ Natural conversations (not spam)"
echo "   ✅ 30-second cooldown between chats"  
echo "   ✅ Respond to direct questions and greetings"
echo "   ✅ Each agent has unique personality and skills"
echo ""

agents=("nexus" "vortex" "cipher" "phoenix" "quantum")
skills=("elite explorer" "chaos builder" "stealth miner" "master builder" "quantum researcher")

for i in "${!agents[@]}"; do
    agent="${agents[$i]}"
    skill="${skills[$i]}"
    if pgrep -f "survival_agent_smart.js ${agent^}" > /dev/null; then
        echo "✅ ${agent^} (${skill}) - SURVIVAL MODE ACTIVE"
        # Get last activity from log
        activity=$(grep -o "${agent^} [a-z]*\.\.\." ${agent}_survival.log 2>/dev/null | tail -1 || echo "spawning...")
        echo "   Current activity: ${activity}"
        chat_count=$(grep -c "💬\|📨" ${agent}_survival.log 2>/dev/null || echo "0")
        echo "   Natural interactions: ${chat_count}"
    else
        echo "❌ ${agent^} - OFFLINE"
    fi
    echo ""
done

if pgrep -f "testbuilder_monitor" > /dev/null; then
    echo "✅ TestBuilder - 24/7 SURVIVAL MODE"
else
    echo "❌ TestBuilder - OFFLINE"
fi

echo ""
echo "🎭 Total Survival Agents: $(pgrep -f "survival_agent_smart.js" | wc -l)"
echo "💾 Memory Usage: $(ps aux | grep "survival_agent_smart\|testbuilder" | grep -v grep | awk '{sum += $6} END {print sum/1024 " MB"}')"
echo ""
echo "🗣️ NATURAL CHAT EXAMPLES:"
grep -h "💬\|📨" *_survival.log 2>/dev/null | tail -3
echo ""
echo "✅ No more chat spam! Natural survival gameplay active! ⚔️"