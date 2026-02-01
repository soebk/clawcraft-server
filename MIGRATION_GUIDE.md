# 🚀 ClawCraft Server Migration Guide

## Current Server Problems
- **RAM:** 4GB → Agents need 8GB+ 
- **CPU:** 2 cores → Need 4-8 cores for AI processing
- **Performance:** Lagging with 3 AI agents

## Recommended Hetzner Upgrade
```
CCX23 (RECOMMENDED):
- 8GB RAM 
- 4 vCPUs (AMD EPYC) 
- 160GB NVMe SSD
- ~€22.61/month

OR CCX33 (IDEAL):
- 16GB RAM
- 8 vCPUs 
- 240GB NVMe SSD  
- ~€40.61/month
```

## 📦 What to Backup & Transfer

### 1. ClawCraft Project (CRITICAL)
```bash
/root/projects/clawcraft/   # Entire AI agent system
```

### 2. Minecraft World Data (CRITICAL) 
```bash
/root/agentcraft-server/agentcraft-world/        # World save
/root/agentcraft-server/server.properties        # Server config
/root/agentcraft-server/whitelist.json          # Player permissions
/root/agentcraft-server/plugins/                # Any plugins
```

### 3. OpenClaw Workspace (IMPORTANT)
```bash
/root/.openclaw/workspace/    # Your AI assistant setup
```

## 🎯 Migration Steps

### Phase 1: Create Backup (5 minutes)
```bash
# Run this on current server:
cd /root
tar -czf clawcraft-backup.tar.gz projects/clawcraft/ agentcraft-server/ .openclaw/workspace/
ls -lh clawcraft-backup.tar.gz  # Should be ~500MB-1GB
```

### Phase 2: Transfer to New Server (10 minutes)  
1. **Spin up new Hetzner CCX23/CCX33**
2. **Install prerequisites on new server:**
```bash
# On new server:
apt update && apt install -y nodejs npm screen git openjdk-21-jre-headless
npm install -g pm2
```

3. **Transfer backup:**
```bash
# From old server to new:
scp clawcraft-backup.tar.gz root@NEW_SERVER_IP:/root/
```

### Phase 3: Restore & Launch (15 minutes)
```bash
# On new server:
cd /root
tar -xzf clawcraft-backup.tar.gz

# Install Node dependencies
cd /root/projects/clawcraft
npm install

# Start Minecraft server
cd /root/agentcraft-server  
screen -dmS minecraft java -Xmx4G -Xms2G -jar server.jar nogui

# Wait 30 seconds, then start AI agents
cd /root/projects/clawcraft
node testbuilder_monitor.js
```

## ⚡ Performance Improvements Expected

**Before (4GB/2CPU):**
- 3 agents = server lag/crashes
- High memory pressure
- CPU bottlenecks

**After (8GB+/4CPU+):**
- 6+ agents smoothly
- Room for expansion  
- Stable 24/7 operations
- Better player experience

## 🔄 DNS Update
Update your domain `clawcraft.xyz` A record:
```
OLD: 89.167.28.237
NEW: [NEW_SERVER_IP]
```

## 📞 Need Help?
I can help with:
- Running backup commands
- Monitoring the transfer
- Troubleshooting any issues
- Testing after migration

**Ready to start? Let me know when you have the new server ready!**