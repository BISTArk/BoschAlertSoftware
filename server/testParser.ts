/**
 * Security Protocol Parser Test
 * Tests the parser with SIA DC-09 and Contact ID packet data
 */

import { parseSiaDC09, generateSummary } from './siaDC09Parser.js';

// Real packet examples from security panel captures
const testMessages = [
  // SIA DC-09 Examples
  // Burglary Alarms
  "[#3333|Nri01/BA0008/APB]",
  "[#3333|Nri01/BA0005/APB]",
  
  // Burglary Hold-ups
  "[#3333|Nri01/BH0008/APB]",
  
  // Burglary Restores
  "[#3333|Nri01/BR0005/APB]",
  "[#3333|Nri01/BR0008/APB]",
  
  // Unknown Zone Warnings
  "[#3333|Nri01/XW0005/APB]",
  
  // User Access Control
  "[#3333|Nri01/id0001/BC/AUser 1]",
  
  // Network Communication Warning
  "[#3333|NCW]",

  // Contact ID Examples
  "[#3333|18113001008]", // Burglary Alarm - Area 01, Point 008
  "[#3333|18313001008]", // Burglary Restore - Area 01, Point 008
  "[#3333|18140603001]", // Cancel by User - Area 03, Point 001
  "[#3333|18113402002]", // Burglary Entry/Exit - Area 02, Point 002
];

console.log("\n" + "═".repeat(80));
console.log("Security Protocol Parser Test (SIA DC-09 & Contact ID)");
console.log("═".repeat(80) + "\n");

let successCount = 0;
let failCount = 0;

testMessages.forEach((message, index) => {
  console.log(`\nTest ${index + 1}: ${message}`);
  console.log("─".repeat(80));
  
  try {
    const parsed = parseSiaDC09(message);
    
    if (parsed) {
      console.log(`✅ SUCCESS`);
      console.log(`   Account Number: ${parsed.accountNumber}`);
      console.log(`   Receiver ID: ${parsed.receiverId || "N/A"}`);
      console.log(`   Event Code: ${parsed.eventCode}`);
      console.log(`   Event Description: ${parsed.eventDescription}`);
      console.log(`   Event Category: ${parsed.eventCategory}`);
      console.log(`   Priority: ${parsed.priority.toUpperCase()}`);
      if (parsed.zoneNumber) console.log(`   Zone Number: ${parsed.zoneNumber}`);
      if (parsed.userName) console.log(`   User Name: ${parsed.userName}`);
      if (parsed.areaInfo) console.log(`   Area Info: ${parsed.areaInfo}`);
      console.log(`   Summary: ${generateSummary(parsed)}`);
      successCount++;
    } else {
      console.log(`❌ FAILED - Parser returned null`);
      failCount++;
    }
  } catch (error) {
    console.log(`❌ FAILED - Error: ${error}`);
    failCount++;
  }
});

console.log("\n" + "═".repeat(80));
console.log(`Test Results: ${successCount} passed, ${failCount} failed out of ${testMessages.length} total`);
console.log("═".repeat(80) + "\n");

process.exit(failCount > 0 ? 1 : 0);
