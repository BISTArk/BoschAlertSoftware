/**
 * Test Alert Detection Logic
 * Tests the isAlertEvent function to verify correct alert classification
 */

import { parseSiaDC09, isAlertEvent } from "./siaDC09Parser.ts";

console.log("🧪 Testing Alert Detection Logic\n");
console.log("=".repeat(80));

const testMessages = [
  // Contact ID messages starting with 181 (SHOULD BE ALERTS)
  "[#3333|18113001008]", // 181 prefix - should be alert
  "[#2000|18110005002]", // 181 prefix - should be alert
  "[#1234|18112003015]", // 181 prefix - should be alert
  
  // Contact ID messages NOT starting with 181 (SHOULD NOT BE ALERTS)
  "[#3333|13013001008]", // 130 prefix - should NOT be alert
  "[#2000|36011005002]", // 360 prefix - should NOT be alert
  "[#1234|14012003015]", // 140 prefix - should NOT be alert
  
  // SIA DC-09 messages (currently NOT alerts - you can add conditions later)
  "[#3333|Nri01/BA0008/APB]", // Burglary - currently NOT alert (add condition if needed)
  "[#2000|Nri01/FA0005/AZone 5]", // Fire - currently NOT alert (add condition if needed)
];

testMessages.forEach((message, index) => {
  console.log(`\nTest ${index + 1}: ${message}`);
  console.log("-".repeat(80));
  
  const parsed = parseSiaDC09(message);
  
  if (parsed) {
    console.log(`✓ Parsed successfully`);
    console.log(`  Account: ${parsed.accountNumber}`);
    console.log(`  Event Code: ${parsed.eventCode}`);
    console.log(`  Description: ${parsed.eventDescription}`);
    console.log(`  Category: ${parsed.eventCategory}`);
    console.log(`  Priority: ${parsed.priority}`);
    
    // Check if it's an alert
    const isAlert = parsed.isAlert;
    console.log(`  Is Alert: ${isAlert ? "✅ YES" : "❌ NO"}`);
    
    // Verify the logic
    const rawContent = parsed.raw.match(/\[([^\]]+)\]/)?.[1] || "";
    const parts = rawContent.split("|");
    if (parts.length > 1 && /^\d/.test(parts[1])) {
      const prefix = parts[1].substring(0, 3);
      console.log(`  Contact ID Prefix: ${prefix}`);
      
      if (prefix === "181") {
        if (!isAlert) {
          console.log(`  ⚠️  WARNING: Should be an alert but isn't!`);
        } else {
          console.log(`  ✓ Correctly identified as alert (181 prefix)`);
        }
      } else {
        if (isAlert) {
          console.log(`  ⚠️  WARNING: Shouldn't be an alert but is!`);
        } else {
          console.log(`  ✓ Correctly identified as non-alert`);
        }
      }
    }
  } else {
    console.log(`✗ Failed to parse`);
  }
});

console.log("\n" + "=".repeat(80));
console.log("✅ Testing complete!\n");
