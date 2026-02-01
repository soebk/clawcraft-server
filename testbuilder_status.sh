#!/bin/bash
# Quick TestBuilder status check

cd /root/projects/clawcraft

echo "🎮 TestBuilder 24/7 ClawBot Quick Status"
echo "========================================"
echo ""

# Check if the monitor process is running
if pgrep -f "testbuilder_monitor.js" > /dev/null; then
    echo "✅ Monitor Process: RUNNING"
else
    echo "❌ Monitor Process: NOT RUNNING"
    echo "   Run: cd /root/projects/clawcraft && node testbuilder_monitor.js"
fi

echo ""
echo "📊 Current Gaming Stats:"
node testbuilder_dashboard.js summary
echo ""

echo "🔍 Last 5 log entries:"
if [ -f "logs/testbuilder-24-7.log" ]; then
    tail -5 logs/testbuilder-24-7.log | sed 's/\[.*\] //' | sed 's/^/   /'
else
    echo "   No log file found"
fi

echo ""
echo "⏰ To see live dashboard: node testbuilder_dashboard.js live"
echo "📋 To see full report: node testbuilder_dashboard.js"