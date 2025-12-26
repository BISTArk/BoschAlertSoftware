#!/bin/bash

# Start all AISAC services
# This script launches Convex, Vite, and the SIA receiver in separate terminals

echo "🚀 Starting Bosch Alert Hub..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
if ! command_exists npm; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "Starting services..."
echo ""
echo "This will open 3 terminal tabs/windows:"
echo "  1. Convex backend (http://127.0.0.1:3210)"
echo "  2. Web UI (http://localhost:5173)"
echo "  3. SIA receiver (TCP/UDP port 4000)"
echo ""

# Detect terminal emulator and launch commands
if command_exists gnome-terminal; then
    # GNOME Terminal
    gnome-terminal --tab --title="Convex Backend" -- bash -c "npm run convex:dev; exec bash" &
    sleep 2
    gnome-terminal --tab --title="Web UI" -- bash -c "npm run dev; exec bash" &
    sleep 1
    gnome-terminal --tab --title="SIA Receiver" -- bash -c "npm run server; exec bash" &
    echo "✅ Services started in GNOME Terminal tabs"
elif command_exists xterm; then
    # xterm
    xterm -title "Convex Backend" -e "npm run convex:dev" &
    sleep 2
    xterm -title "Web UI" -e "npm run dev" &
    sleep 1
    xterm -title "SIA Receiver" -e "npm run server" &
    echo "✅ Services started in xterm windows"
elif command_exists konsole; then
    # KDE Konsole
    konsole --new-tab -e bash -c "npm run convex:dev; exec bash" &
    sleep 2
    konsole --new-tab -e bash -c "npm run dev; exec bash" &
    sleep 1
    konsole --new-tab -e bash -c "npm run server; exec bash" &
    echo "✅ Services started in Konsole tabs"
else
    echo "⚠️  Could not detect terminal emulator."
    echo ""
    echo "Please manually run these commands in 3 separate terminals:"
    echo ""
    echo "Terminal 1: npm run convex:dev"
    echo "Terminal 2: npm run dev"
    echo "Terminal 3: npm run server"
    exit 1
fi

echo ""
echo "🌐 Services starting..."
echo ""
echo "  Convex Dashboard: http://127.0.0.1:6790"
echo "  Web UI:          http://localhost:5173"
echo "  SIA Receiver:    TCP/UDP port 4000"
echo ""
echo "💡 Run './test-sia-messages.sh' to send test messages"
echo ""
