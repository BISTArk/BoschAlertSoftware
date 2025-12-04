#!/bin/bash

# Test script for sending SIA messages to the Bosch Alert Hub
# This script sends various SIA DC-09 format messages to test the system

echo "🚀 Bosch Alert Hub - SIA Message Test Script"
echo "============================================="
echo ""

# Check if netcat is installed
if ! command -v nc &> /dev/null; then
    echo "❌ Error: netcat (nc) is not installed"
    echo "   Install it with: sudo apt-get install netcat (Debian/Ubuntu)"
    echo "                or: sudo yum install nmap-ncat (RedHat/CentOS)"
    exit 1
fi

echo "📡 Testing TCP connection..."
echo ""

# Test messages
declare -a messages=(
    'SIA-DCS"0002R1111[#15:35:00,12-03-25|PA923005]F0E3'
    'SIA-DCS"0002R2222[#16:45:12,12-03-25|BA001823456]A1B2'
    'SIA-DCS"0002R3333[#17:20:30,12-03-25|FA002934567]C3D4'
    'SIA-DCS"0002R4444[#18:10:45,12-03-25|MA003045678]E5F6'
    'SIA-DCS"0002R5555[#19:55:00,12-03-25|OP100156789]G7H8'
)

declare -a descriptions=(
    "Panic Alarm from account 923005"
    "Burglary Alarm from account 823456"
    "Fire Alarm from account 934567"
    "Medical Alarm from account 045678"
    "Opening event from account 156789"
)

echo "Sending ${#messages[@]} test messages..."
echo ""

for i in "${!messages[@]}"; do
    echo "[$((i+1))/${#messages[@]}] ${descriptions[$i]}"
    echo "    Message: ${messages[$i]}"
    
    # Send via TCP
    echo "${messages[$i]}" | nc localhost 4000 &
    
    # Wait a bit between messages
    sleep 1
    
    echo "    ✓ Sent via TCP"
    echo ""
done

echo "✅ All test messages sent!"
echo ""
echo "📊 Check the web UI at http://localhost:5173 to see the alerts"
echo ""
