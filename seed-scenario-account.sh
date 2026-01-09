#!/bin/bash

# Seed Scenario Testing Accounts (3333, 4444, 5555)
# Run this script to set up the multi-location testing environment

echo "🌱 Seeding Multi-Location Scenario Testing Accounts..."
echo ""
echo "This will create:"
echo "  • Account 3333 - ATM (Dubai, UAE)"
echo "  • Account 4444 - Branch 1 (Abu Dhabi, UAE)"
echo "  • Account 5555 - Branch 2 (Riyadh, Saudi Arabia)"
echo "  • 4 Areas per account"
echo "  • 8 Sensors per area (96 total)"
echo ""

# Run the Convex mutation
npx convex run seedScenarioAccount:seedScenarioAccount

echo ""
echo "✅ Seeding complete!"
echo ""
echo "Next steps:"
echo "  1. Start SIA receiver: npm run server"
echo "  2. Start admin API: npm run admin-api"
echo "  3. Use admin panel to stream scenarios"
echo ""
