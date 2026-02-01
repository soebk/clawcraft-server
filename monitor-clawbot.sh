#!/bin/bash
# ClawBot Monitor - Ensures 24/7 uptime
# Checks if ClawBot service is running, restarts if needed

SCRIPT_DIR="/root/projects/clawcraft"
PID_FILE="$SCRIPT_DIR/logs/clawbot.pid"
SERVICE_SCRIPT="$SCRIPT_DIR/clawbot-service.js"
LOG_FILE="$SCRIPT_DIR/logs/monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if ClawBot service is running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        log "✅ ClawBot service running (PID: $PID)"
        
        # Check if TestBuilder is actually connected to Minecraft
        if curl -s http://localhost:3003/status | grep -q '"running": true'; then
            log "✅ TestBuilder bot active and connected"
        else
            log "⚠️ TestBuilder bot not active, but service is running"
        fi
        exit 0
    else
        log "❌ ClawBot PID file exists but process not running, restarting..."
        rm -f "$PID_FILE"
    fi
else
    log "❌ ClawBot service not running, starting..."
fi

# Start ClawBot service
cd "$SCRIPT_DIR"
log "🚀 Starting ClawBot service..."

# Kill any existing node processes running our script
pkill -f "clawbot-service.js" 2>/dev/null
pkill -f "simple_survival.js" 2>/dev/null

# Start the service in background
nohup node "$SERVICE_SCRIPT" > /dev/null 2>&1 &

# Wait a moment and verify it started
sleep 5

if [ -f "$PID_FILE" ]; then
    NEW_PID=$(cat "$PID_FILE")
    log "✅ ClawBot service started successfully (PID: $NEW_PID)"
    
    # Test status endpoint
    sleep 2
    if curl -s http://localhost:3003/status > /dev/null; then
        log "✅ ClawBot status API responding"
    else
        log "⚠️ ClawBot status API not responding yet"
    fi
else
    log "❌ Failed to start ClawBot service"
    exit 1
fi