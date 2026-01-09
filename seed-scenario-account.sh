#!/bin/bash

# Seed Scenario Account 3333
# Run this script to set up the Dubai testing facility with 4 areas and 32 sensors

echo "🌱 Seeding Scenario Testing Account 3333..."
echo ""
echo "This will create:"
echo "  • Account 3333 (Dubai, UAE)"
echo "  • 4 Areas (01, 02, 03, 04)"
echo "  • 8 Sensors per area (32 total)"
echo ""

# Run the Convex mutation
npx convex run seedScenarioAccount:seedScenarioAccount

echo ""
echo "✅ Seeding complete!"
echo ""
echo "Next steps:"
echo "  1. Start SIA receiver: npx tsx server/siaReceiver.ts"
echo "  2. Run scenarios: npx tsx server/scenarioPacketStreamer.ts"
echo ""
