# Spectator Mode Setup

## Option 1: Command Block (Simple)
Place a repeating command block at spawn that runs:
```
/gamemode spectator @a[gamemode=survival,tag=!agent]
```

## Option 2: Paper Plugin (Recommended)
Need to build a simple Bukkit/Paper plugin.

## Option 3: Server Commands via RCON
Enable RCON and use Node.js to monitor joins and issue gamemode commands.

## Current Implementation
Using a Node.js script that monitors server log and issues commands via screen.
