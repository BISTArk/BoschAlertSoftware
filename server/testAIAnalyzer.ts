/**
 * Test AI Alert Analyzer
 * Tests the AI analysis functionality with sample alert data
 */

import { analyzeAlert, ALERT_ACTIONS } from "./aiAlertAnalyzer";

console.log("🧪 Testing AI Alert Analyzer\n");
console.log("=".repeat(80));

// Check if API key is available
const hasApiKey = !!process.env.OPENAI_API_KEY;
console.log(`OpenAI API Key: ${hasApiKey ? "✅ Found" : "❌ Not found"}`);
if (!hasApiKey) {
  console.log("⚠️  AI analysis will fail without API key - this is expected behavior");
}
console.log(`Available Actions: ${ALERT_ACTIONS.length}`);
console.log("=".repeat(80) + "\n");

async function testAnalysis() {
  // Test Case 1: Critical burglary alarm
  console.log("Test 1: Critical Burglary Alarm");
  console.log("-".repeat(80));
  
  const context1 = {
    alert: {
      eventCode: "130",
      eventDescription: "Burglary Alarm - Point 8 - Area 1",
      eventCategory: "Burglary",
      priority: "critical",
      accountNumber: "3333",
      areaNumber: "01",
      zoneNumber: "008",
      timestamp: Date.now(),
    },
    site: {
      name: "Downtown Office Building",
      address: "123 Main Street",
      city: "New York",
    },
    area: {
      name: "Area 01 - Ground Floor",
    },
    sensor: {
      name: "Main Entrance Motion Detector",
      type: "motion",
      zone: "008",
    },
    recentAlerts: [
      {
        eventDescription: "Access Denied - Point 5",
        eventCategory: "Access Control",
        priority: "medium",
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
        zoneNumber: "005",
      },
      {
        eventDescription: "Access Denied - Point 5",
        eventCategory: "Access Control",
        priority: "medium",
        timestamp: Date.now() - 8 * 60 * 1000, // 8 minutes ago
        zoneNumber: "005",
      },
    ],
    currentTime: new Date(),
  };

  try {
    const analysis1 = await analyzeAlert(context1);
    console.log("\n✅ Analysis Result:");
    console.log(`   Summary: ${analysis1.summary}`);
    console.log(`   Risk Score: ${analysis1.riskScore}/100 (${analysis1.riskLevel})`);
    console.log(`   Recommended Actions: ${analysis1.recommendedActions.join(", ")}`);
    console.log(`   Response Time: ${analysis1.estimatedResponseTime}`);
    console.log(`   Reasoning: ${analysis1.reasoning}`);
    if (analysis1.additionalContext) {
      console.log(`   Additional Context: ${analysis1.additionalContext}`);
    }
  } catch (error: any) {
    console.error("❌ Analysis failed:", error.message);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Test Case 2: Fire alarm with no recent activity
  console.log("Test 2: Fire Alarm - No Recent Activity");
  console.log("-".repeat(80));

  const context2 = {
    alert: {
      eventCode: "110",
      eventDescription: "Fire Alarm - Point 12",
      eventCategory: "Fire",
      priority: "critical",
      accountNumber: "2000",
      zoneNumber: "012",
      timestamp: Date.now(),
    },
    site: {
      name: "Manufacturing Plant",
      address: "456 Industrial Blvd",
      city: "Chicago",
    },
    sensor: {
      name: "Warehouse Smoke Detector",
      type: "fire",
      zone: "012",
    },
    recentAlerts: [], // No recent alerts
    currentTime: new Date(),
  };

  try {
    const analysis2 = await analyzeAlert(context2);
    console.log("\n✅ Analysis Result:");
    console.log(`   Summary: ${analysis2.summary}`);
    console.log(`   Risk Score: ${analysis2.riskScore}/100 (${analysis2.riskLevel})`);
    console.log(`   Recommended Actions: ${analysis2.recommendedActions.join(", ")}`);
    console.log(`   Response Time: ${analysis2.estimatedResponseTime}`);
    console.log(`   Reasoning: ${analysis2.reasoning}`);
  } catch (error: any) {
    console.error("❌ Analysis failed:", error.message);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Test Case 3: Access control event (low priority)
  console.log("Test 3: Access Control - Low Priority");
  console.log("-".repeat(80));

  const context3 = {
    alert: {
      eventCode: "BC",
      eventDescription: "Access Granted - User John Doe",
      eventCategory: "Access Control",
      priority: "low",
      accountNumber: "1234",
      userName: "John Doe",
      timestamp: Date.now(),
    },
    site: {
      name: "Corporate Headquarters",
      city: "San Francisco",
    },
    currentTime: new Date(),
  };

  try {
    const analysis3 = await analyzeAlert(context3);
    console.log("\n✅ Analysis Result:");
    console.log(`   Summary: ${analysis3.summary}`);
    console.log(`   Risk Score: ${analysis3.riskScore}/100 (${analysis3.riskLevel})`);
    console.log(`   Recommended Actions: ${analysis3.recommendedActions.join(", ")}`);
    console.log(`   Response Time: ${analysis3.estimatedResponseTime}`);
  } catch (error: any) {
    console.error("❌ Analysis failed:", error.message);
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ Testing complete!\n");
}

testAnalysis();
