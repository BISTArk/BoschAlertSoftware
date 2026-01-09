/**
 * HTTP API for Admin Panel
 * Provides endpoints for scenario streaming and other admin operations
 */

import express from "express";
import cors from "cors";
import { handleScenarioRequest } from "./scenarioPacketStreamer.js";

const app = express();
const PORT = 7801; // Different port from SIA Receiver (7800)

app.use(cors());
app.use(express.json());

/**
 * POST /stream-scenarios
 * Body: { scenarios: string[] }
 */
app.post("/stream-scenarios", async (req, res) => {
  const { scenarios } = req.body;
  
  if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
    return res.status(400).json({ 
      error: "Invalid request. Provide 'scenarios' array with at least one scenario ID." 
    });
  }

  console.log("\n🌐 HTTP API: Received scenario streaming request");
  console.log("📋 Scenarios:", scenarios);

  // Start streaming in background
  handleScenarioRequest(scenarios)
    .then(() => {
      console.log("✅ HTTP API: Scenario streaming completed successfully");
    })
    .catch((error) => {
      console.error("❌ HTTP API: Scenario streaming error:", error);
    });

  // Return immediately to the client
  res.json({ 
    success: true, 
    message: `Started streaming ${scenarios.length} scenario(s)`,
    scenarios: scenarios
  });
});

/**
 * GET /health
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "BoschAlertHub Admin API",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log("\n" + "═".repeat(80));
  console.log("🚀 Admin API Server Started");
  console.log("═".repeat(80));
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`📋 Endpoints:`);
  console.log(`   POST /stream-scenarios - Trigger scenario streaming`);
  console.log(`   GET  /health          - Health check`);
  console.log("─".repeat(80));
  console.log("⚠️  Prerequisites:");
  console.log("   • SIA Receiver must be running on port 7800");
  console.log("   • Database should be seeded with test data");
  console.log("═".repeat(80) + "\n");
});
