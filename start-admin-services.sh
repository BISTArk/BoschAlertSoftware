#!/bin/bash

# Start All Services for BoschAlertHub Admin Panel
# This script starts all required services in separate terminal tabs/windows

echo "════════════════════════════════════════════════════════════════"
echo "🚀 Starting BoschAlertHub Services"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Starting the following services:"
echo "  1. Convex Backend (dev server)"
echo "  2. SIA Receiver (TCP port 7800)"
echo "  3. Admin API Server (HTTP port 7801)"
echo "  4. Vite Dev Server (UI)"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Check if running in a terminal that supports terminal multiplexing
if command -v gnome-terminal &> /dev/null; then
    echo "📱 Using gnome-terminal..."
    gnome-terminal --tab --title="Convex Backend" -- bash -c "npm run convex:dev; exec bash" &
    sleep 2
    gnome-terminal --tab --title="SIA Receiver" -- bash -c "npx tsx server/siaReceiver.ts; exec bash" &
    sleep 1
    gnome-terminal --tab --title="Admin API" -- bash -c "npm run admin-api; exec bash" &
    sleep 1
    gnome-terminal --tab --title="Vite Dev Server" -- bash -c "npm run dev; exec bash" &
    
elif command -v tmux &> /dev/null; then
    echo "📱 Using tmux..."
    tmux new-session -d -s boschalert
    tmux rename-window -t boschalert:0 'Services'
    
    tmux send-keys -t boschalert:0 'npm run convex:dev' C-m
    tmux split-window -t boschalert:0 -h
    tmux send-keys -t boschalert:0 'sleep 3 && npx tsx server/siaReceiver.ts' C-m
    tmux split-window -t boschalert:0 -v
    tmux send-keys -t boschalert:0 'sleep 4 && npm run admin-api' C-m
    tmux split-window -t boschalert:0.0 -v
    tmux send-keys -t boschalert:0 'sleep 5 && npm run dev' C-m
    
    tmux attach-session -t boschalert
    
else
    echo "❌ No supported terminal multiplexer found (gnome-terminal or tmux)"
    echo ""
    echo "Please run the following commands in separate terminals:"
    echo ""
    echo "Terminal 1: npm run convex:dev"
    echo "Terminal 2: npx tsx server/siaReceiver.ts"
    echo "Terminal 3: npm run admin-api"
    echo "Terminal 4: npm run dev"
    echo ""
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ All services started!"
echo ""
echo "Access points:"
echo "  UI:        http://localhost:5173"
echo "  Admin API: http://localhost:7801"
echo "  SIA TCP:   localhost:7800"
echo "════════════════════════════════════════════════════════════════"
