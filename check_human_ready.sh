#!/bin/bash
echo "👁️ ClawCraft Human-Ready Status - Server: 46.62.211.91:25565"
echo "============================================================="
echo ""

echo "🎭 SPECTATOR ENFORCEMENT:"
if pgrep -f "spectator_enforcer_new.js" > /dev/null; then
    echo "   ✅ SpectatorBot ONLINE - Humans will be forced to spectator mode"
    echo "   Recent activity: $(tail -1 spectator.log 2>/dev/null)"
else
    echo "   ❌ SpectatorBot OFFLINE - Humans might be able to play!"
fi
echo ""

echo "🤖 AI AGENTS (Human-Responsive):"
agents=("nexus" "vortex" "cipher" "phoenix" "quantum")
skills=("elite explorer" "chaos builder" "stealth miner" "master builder" "quantum researcher")

for i in "${!agents[@]}"; do
    agent="${agents[$i]}"
    skill="${skills[$i]}"
    if pgrep -f "survival_agent_smart.js ${agent^}" > /dev/null; then
        echo "   ✅ ${agent^} (${skill}) - ONLINE & Human-Responsive"
        activity=$(grep -o "${agent^} [a-z]*\.\.\." ${agent}_human_responsive.log 2>/dev/null | tail -1 || echo "starting...")
        echo "      Current: ${activity}"
    else
        echo "   ❌ ${agent^} - OFFLINE"
    fi
done

if pgrep -f "testbuilder_monitor" > /dev/null; then
    echo "   ✅ TestBuilder - 24/7 SURVIVAL MODE"
else
    echo "   ❌ TestBuilder - OFFLINE"
fi

echo ""
echo "💬 HUMAN INTERACTION FEATURES:"
echo "   ✅ 80% response rate to human greetings (vs 30% to other agents)"  
echo "   ✅ Faster responses to humans (1-2 seconds vs 3-5 seconds)"
echo "   ✅ Special welcome messages for humans"
echo "   ✅ Explain ClawCraft concept when asked"
echo "   ✅ React to human compliments and questions"
echo "   ✅ Always respond to name mentions from humans (90% vs 40%)"
echo ""

total_agents=$(pgrep -f "survival_agent_smart.js\|testbuilder_monitor\|spectator_enforcer" | wc -l)
echo "🎭 Total Active Processes: ${total_agents}"
echo "💾 Memory Usage: $(ps aux | grep -E "survival_agent_smart\|testbuilder\|spectator" | grep -v grep | awk '{sum += $6} END {print sum/1024 " MB"}' || echo "0 MB")"
echo ""
echo "✅ READY FOR HUMAN PLAYERS!"
echo "   - Humans auto-set to spectator mode"  
echo "   - Agents will welcome and interact with humans"
echo "   - Agents explain ClawCraft concept naturally"
echo "   - Pure AI gameplay with human audience! 🎮👥"