#!/bin/bash
echo "🎮 ClawCraft Team Status - 46.62.211.91:25565"
echo "=============================================="
echo ""

echo "👑 TEAM LEADER:"
if pgrep -f "team_survival_agent.js Nexus" > /dev/null; then
    echo "   ✅ Nexus (Leader) - ONLINE"
    if [[ -f nexus_team.log ]]; then
        last_activity=$(tail -1 nexus_team.log 2>/dev/null | grep -o "[👑⛏️🏗️🔍🌾⚒️💬].*")
        echo "      Activity: $last_activity"
    fi
else
    echo "   ❌ Nexus (Leader) - OFFLINE"
fi
echo ""

echo "🤖 TEAM MEMBERS:"
agents=("Vortex" "Cipher" "Phoenix" "Quantum")
roles=("builder" "scout" "crafter" "researcher")

for i in "${!agents[@]}"; do
    agent="${agents[i]}"
    role="${roles[i]}"
    lowercase_agent=$(echo $agent | tr '[:upper:]' '[:lower:]')
    
    if pgrep -f "team_survival_agent.js $agent" > /dev/null; then
        echo "   ✅ $agent ($role) - ONLINE"
        if [[ -f "${lowercase_agent}_team.log" ]]; then
            last_activity=$(tail -1 "${lowercase_agent}_team.log" 2>/dev/null | grep -o "[🏃⛏️🏗️🔍🌾⚒️💬].*" | head -1)
            if [[ -n "$last_activity" ]]; then
                echo "      Activity: $last_activity"
            fi
        fi
    else
        echo "   ❌ $agent ($role) - OFFLINE"
    fi
done

echo ""
echo "👥 TEAM COORDINATION:"
echo "   🎯 Leader: Nexus makes movement decisions every 8 seconds"
echo "   🏃 Followers: Check team position every 5 seconds"
echo "   📏 Max distance from leader: 15 blocks"
echo "   🤝 Follow distance: 5 blocks with random offset"
echo ""

echo "💬 RECENT TEAM CHAT:"
if ls *team.log > /dev/null 2>&1; then
    echo "$(grep "💬" *team.log 2>/dev/null | tail -5 | while read line; do echo "   $line"; done)"
fi

echo ""
echo "👁️ SPECTATOR ENFORCEMENT:"
if pgrep -f "spectator_enforcer_new.js" > /dev/null; then
    echo "   ✅ SpectatorBot ONLINE - Humans forced to spectator mode"
else
    echo "   ❌ SpectatorBot OFFLINE"
fi

echo ""
echo "🔧 TEAM PROCESSES:"
team_count=$(pgrep -f "team_survival_agent.js" | wc -l)
spectator_count=$(pgrep -f "spectator_enforcer_new.js" | wc -l)
echo "   Team Agents: $team_count/5"
echo "   Spectator Enforcers: $spectator_count/1"

echo ""
echo "✅ TEAM CLAWCRAFT - AGENTS WORKING TOGETHER!"
echo "   🎭 Humans → Watch our coordinated AI team!"
echo "   👑 Nexus leads, others follow within 15 blocks"
echo "   🤖 Team activities: mining, building, crafting together"
echo "   💬 Coordinated team communication!"