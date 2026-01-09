/**
 * Scenario-Based Packet Streamer for AI Alert Analysis
 * 
 * Interactive CLI to simulate realistic security system scenarios:
 * 1. Panel disconnection - Communication failure alerts
 * 2. Recurring false alarms - Same zone triggering multiple times (low priority pattern)
 * 3. Sequential correlated alerts - Burglary + Tamper requiring AI context
 * 4. Fire emergency - Smoke detection and spreading
 * 5. Single critical alert - Medical emergency
 * 6. Sensor not restored - Zone left open with lost supervision
 * 
 * Timeline simulates events from 3 days ago to present for comprehensive AI analysis
 */

import net from "net";
import * as readline from "readline";

const TCP_HOST = "localhost";
const TCP_PORT = 7800; // Must match siaReceiver.ts TCP_PORT
const ACCOUNT_ATM = "3333"; // ATM Location
const ACCOUNT_BRANCH1 = "4444"; // Branch 1
const ACCOUNT_BRANCH2 = "5555"; // Branch 2

interface ScenarioPacket {
  payload: string;
  timestamp: Date;
  delayAfterMs: number; // Delay before next packet (simulates real-world timing)
  eventType: "recurring_false" | "communication" | "sequential" | "single_critical" | "sensor_not_restored" | "fire" | "motion";
  // Note: description and notes are NOT included - only payload is sent in real scenarios
  // The system parses Contact ID codes from the payload to generate descriptions
}

type ScenarioType = "recurring_false" | "communication" | "sequential" | "fire" | "single_critical" | "sensor_not_restored" | "motion";

interface ScenarioOption {
  id: ScenarioType;
  name: string;
  description: string;
}

/**
 * Available scenarios
 */
const SCENARIOS: ScenarioOption[] = [
  {
    id: "sequential",
    name: "[ATM] Burglary Attack",
    description: "Account 3333 Area 01 Zone 03 - ATM Break-in + Tamper"
  },
  {
    id: "motion",
    name: "[ATM] Motion Detection",
    description: "Account 3333 Area 01 Zone 05 - Suspicious activity near ATM"
  },
  {
    id: "fire",
    name: "[Branch 1] Fire Emergency",
    description: "Account 4444 Area 01→02 - Smoke spreading through branch"
  },
  {
    id: "sensor_not_restored",
    name: "[Branch 1] Sensor Health Issue",
    description: "Account 4444 Area 02 Zone 04 - Low battery + lost supervision"
  },
  {
    id: "communication",
    name: "[Branch 2] Communication Failure",
    description: "Account 5555 Area 01 - Panel offline for 2h 15m"
  },
  {
    id: "single_critical",
    name: "[Branch 2] Medical Emergency",
    description: "Account 5555 Area 02 Zone 05 - Panic button activated"
  },
  {
    id: "recurring_false",
    name: "[Branch 2] False Alarms Pattern",
    description: "Account 5555 Area 03 Zone 08 - 4 false alarms over 4 days"
  }
];

/**
 * Generate SIA DC-09 packet with Contact ID format
 * Format: [LEN][CRC]1Ca0[SEQ][ACCOUNT][#ACCOUNT|CONTACT_ID][CRC]
 */
function generatePacket(
  accountNumber: string,
  contactId: string,
  sequenceNumber: string
): string {
  const innerContent = `#${accountNumber}|${contactId}`;
  const mainContent = `1Ca0${sequenceNumber}${accountNumber}[${innerContent}]`;
  
  // Calculate CRC (simplified - using placeholder)
  const crc = "XXXX";
  
  // Calculate length (simplified - using placeholder)
  const len = "10";
  
  return `[${len}]${crc}${mainContent}[13]`;
}

/**
 * Build recurring false alarm scenario packets (Area 01 Zone 08 over 4 days)
 */
function buildRecurringFalseAlarmPackets(): ScenarioPacket[] {
  const packets: ScenarioPacket[] = [];
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  
  // DAY 1: First false alarm
  const day1Time = new Date(threeDaysAgo);
  day1Time.setHours(14, 30, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH2, "18113203008", "0100"),
    timestamp: day1Time,
    delayAfterMs: 2000,
    eventType: "recurring_false",
  });
  
  const day1Restore = new Date(day1Time.getTime() + 5 * 60 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH2, "38113203008", "0110"),
    timestamp: day1Restore,
    delayAfterMs: 5000,
    eventType: "recurring_false",
  });
  
  // DAY 2: Second false alarm
  const day2Time = new Date(twoDaysAgo);
  day2Time.setHours(9, 15, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH2, "18113203008", "0200"),
    timestamp: day2Time,
    delayAfterMs: 2000,
    eventType: "recurring_false",
  });
  
  const day2Restore = new Date(day2Time.getTime() + 3 * 60 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH2, "38113203008", "0210"),
    timestamp: day2Restore,
    delayAfterMs: 5000,
    eventType: "recurring_false",
  });
  
  // DAY 3: Third false alarm
  const day3Time = new Date(oneDayAgo);
  day3Time.setHours(16, 45, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH2, "18113203008", "0300"),
    timestamp: day3Time,
    delayAfterMs: 2000,
    eventType: "recurring_false",
  });
  
  const day3Restore = new Date(day3Time.getTime() + 4 * 60 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH2, "38113203008", "0310"),
    timestamp: day3Restore,
    delayAfterMs: 5000,
    eventType: "recurring_false",
  });
  
  // CURRENT DAY: Fourth false alarm
  const recurringAlarmTime = new Date(now);
  recurringAlarmTime.setHours(14, 30, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH2, "18113203008", "0500"),
    timestamp: recurringAlarmTime,
    delayAfterMs: 2000,
    eventType: "recurring_false",
  });
  
  const recurringRestore = new Date(recurringAlarmTime.getTime() + 6 * 60 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH2, "38113203008", "0510"),
    timestamp: recurringRestore,
    delayAfterMs: 2000,
    eventType: "recurring_false",
  });
  
  return packets;
}

/**
 * Build communication failure scenario packets (Area 01 panel disconnection)
 */
function buildCommunicationFailurePackets(): ScenarioPacket[] {
  const packets: ScenarioPacket[] = [];
  const now = new Date();
  
  const commFailTime = new Date(now);
  commFailTime.setHours(8, 0, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH2, "18135401000", "0400"),
    timestamp: commFailTime,
    delayAfterMs: 3000,
    eventType: "communication",
  });
  
  const commRestoreTime = new Date(commFailTime.getTime() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000);
  commRestoreTime.setHours(10, 15, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH2, "33135401000", "0410"),
    timestamp: commRestoreTime,
    delayAfterMs: 2000,
    eventType: "communication",
  });
  
  return packets;
}

/**
 * Build sequential correlated burglary scenario packets (Area 02 Zone 03)
 */
function buildSequentialBurglaryPackets(): ScenarioPacket[] {
  const packets: ScenarioPacket[] = [];
  const now = new Date();
  
  const realBurglaryTime = new Date(now);
  realBurglaryTime.setHours(15, 45, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT_ATM, "18113101003", "0600"),
    timestamp: realBurglaryTime,
    delayAfterMs: 1000,
    eventType: "sequential",
  });
  
  const tamperTime = new Date(realBurglaryTime.getTime() + 45 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT_ATM, "18113701003", "0610"),
    timestamp: tamperTime,
    delayAfterMs: 2000,
    eventType: "sequential",
  });
  
  return packets;
}

/**
 * Build fire emergency scenario packets (Area 04 Zone 07 spreading to Area 02 Zone 07)
 */
function buildFireEmergencyPackets(): ScenarioPacket[] {
  const packets: ScenarioPacket[] = [];
  const now = new Date();
  
  const fireTime = new Date(now);
  fireTime.setHours(15, 30, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH1, "18111001007", "0650"),
    timestamp: fireTime,
    delayAfterMs: 1000,
    eventType: "fire",
  });
  
  const fireSpreadTime = new Date(fireTime.getTime() + 30 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH1, "18111002007", "0660"),
    timestamp: fireSpreadTime,
    delayAfterMs: 2000,
    eventType: "fire",
  });
  
  const fireTroubleTime = new Date(fireSpreadTime.getTime() + 15 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH1, "18137301007", "0670"),
    timestamp: fireTroubleTime,
    delayAfterMs: 2000,
    eventType: "fire",
  });
  
  return packets;
}

/**
 * Build medical emergency scenario packets (Area 03 Zone 05)
 */
function buildMedicalEmergencyPackets(): ScenarioPacket[] {
  const packets: ScenarioPacket[] = [];
  const now = new Date();
  
  const medicalTime = new Date(now);
  medicalTime.setHours(16, 0, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH2, "18110002005", "0700"),
    timestamp: medicalTime,
    delayAfterMs: 2000,
    eventType: "single_critical",
  });
  
  return packets;
}

/**
 * Build sensor not restored scenario packets (Area 02 Zone 04)
 */
function buildSensorNotRestoredPackets(): ScenarioPacket[] {
  const packets: ScenarioPacket[] = [];
  const now = new Date();
  
  const zoneOpenTime = new Date(now);
  zoneOpenTime.setHours(16, 30, 0, 0);
  
  const lostSupervisionTime = new Date(zoneOpenTime.getTime() + 1.5 * 60 * 60 * 1000);
  lostSupervisionTime.setHours(18, 0, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH1, "18138102004", "0810"),
    timestamp: lostSupervisionTime,
    delayAfterMs: 2000,
    eventType: "sensor_not_restored",
  });
  
  const lowBatteryTime = new Date(lostSupervisionTime.getTime() + 2 * 60 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT_BRANCH1, "18138402004", "0820"),
    timestamp: lowBatteryTime,
    delayAfterMs: 2000,
    eventType: "sensor_not_restored",
  });
  
  return packets;
}

/**
 * Build motion detection scenario packets (ATM Area 01 Zone 05)
 */
function buildMotionDetectionPackets(): ScenarioPacket[] {
  const packets: ScenarioPacket[] = [];
  const now = new Date();
  
  const motionTime = new Date(now);
  motionTime.setHours(17, 15, 0, 0);
  
  // First motion detection
  packets.push({
    payload: generatePacket(ACCOUNT_ATM, "18113401005", "0900"),
    timestamp: motionTime,
    delayAfterMs: 1000,
    eventType: "motion",
  });
  
  // Second motion 30 seconds later (someone loitering)
  const motion2Time = new Date(motionTime.getTime() + 30 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT_ATM, "18113401005", "0910"),
    timestamp: motion2Time,
    delayAfterMs: 2000,
    eventType: "motion",
  });
  
  // Restore after person leaves
  const motionRestoreTime = new Date(motion2Time.getTime() + 2 * 60 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT_ATM, "38113401005", "0920"),
    timestamp: motionRestoreTime,
    delayAfterMs: 2000,
    eventType: "motion",
  });
  
  return packets;
}

/**
 * Build scenario packets based on selected scenario types
 */
function buildScenarioPackets(selectedScenarios: ScenarioType[]): ScenarioPacket[] {
  let allPackets: ScenarioPacket[] = [];
  
  for (const scenario of selectedScenarios) {
    let scenarioPackets: ScenarioPacket[] = [];
    
    console.log(`\n🔍 Processing scenario: "${scenario}"`);
    
    switch (scenario) {
      case "recurring_false":
        scenarioPackets = buildRecurringFalseAlarmPackets();
        break;
      case "communication":
        scenarioPackets = buildCommunicationFailurePackets();
        break;
      case "sequential":
        scenarioPackets = buildSequentialBurglaryPackets();
        break;
      case "fire":
        scenarioPackets = buildFireEmergencyPackets();
        break;
      case "single_critical":
        scenarioPackets = buildMedicalEmergencyPackets();
        break;
      case "sensor_not_restored":
        scenarioPackets = buildSensorNotRestoredPackets();
        break;
      case "motion":
        scenarioPackets = buildMotionDetectionPackets();
        break;
      default:
        console.log(`⚠️  Unknown scenario: "${scenario}"`);
    }
    
    console.log(`   Generated ${scenarioPackets.length} packets for "${scenario}"`);
    allPackets = allPackets.concat(scenarioPackets);
  }
  
  // Sort packets by timestamp
  allPackets.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  return allPackets;
}

/**
 * Send a single packet to the TCP server
 */
async function sendPacket(payload: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.connect(TCP_PORT, TCP_HOST, () => {
      const buffer = Buffer.from(payload, 'ascii');
      client.write(buffer);
    });

    client.on("data", (data) => {
      const response = data.toString("hex");
      if (response === "06") {
        console.log("✅ ACK received");
      } else {
        console.log(`📥 Response: ${response}`);
      }
      client.destroy();
      resolve();
    });

    client.on("error", (err) => {
      console.error(`❌ Error: ${err.message}`);
      reject(err);
    });

    client.on("close", () => {
      resolve();
    });

    setTimeout(() => {
      client.destroy();
      resolve();
    }, 5000);
  });
}

/**
 * Display scenario selection menu
 */
async function selectScenarios(): Promise<ScenarioType[]> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log("\n" + "═".repeat(100));
    console.log("🎬 SCENARIO PACKET STREAMER - Interactive CLI");
    console.log("═".repeat(100));
    console.log("\nAvailable Scenarios:\n");
    
    SCENARIOS.forEach((scenario, index) => {
      console.log(`  ${index + 1}. ${scenario.name}`);
      console.log(`     ${scenario.description}\n`);
    });
    
    console.log("  0. All Scenarios (Full Test)\n");
    console.log("─".repeat(100));
    
    rl.question("\nEnter scenario numbers (comma-separated, e.g., 1,3,5) or 0 for all: ", (answer) => {
      rl.close();
      
      const input = answer.trim();
      let selectedScenarios: ScenarioType[] = [];
      
      if (input === "0" || input === "") {
        // All scenarios
        selectedScenarios = SCENARIOS.map(s => s.id);
      } else {
        // Parse selected scenarios
        const selections = input.split(",").map(s => parseInt(s.trim()));
        selectedScenarios = selections
          .filter(num => num > 0 && num <= SCENARIOS.length)
          .map(num => SCENARIOS[num - 1].id);
      }
      
      if (selectedScenarios.length === 0) {
        console.log("\n❌ No valid scenarios selected. Exiting.\n");
        process.exit(0);
      }
      
      resolve(selectedScenarios);
    });
  });
}

/**
 * Stream scenario-based packets with realistic timing
 */
async function streamScenarioPackets(selectedScenarios?: ScenarioType[]) {
  try {
    // If no scenarios provided, prompt user
    if (!selectedScenarios) {
      selectedScenarios = await selectScenarios();
    }
    
    console.log("\n" + "═".repeat(100));
    console.log("📋 SELECTED SCENARIOS");
    console.log("═".repeat(100));
    
    selectedScenarios.forEach(scenarioId => {
      const scenario = SCENARIOS.find(s => s.id === scenarioId);
      if (scenario) {
        console.log(`  ✓ ${scenario.name} - ${scenario.description}`);
      }
    });
    
    console.log("\n" + "─".repeat(100));
    console.log(`Target: ${TCP_HOST}:${TCP_PORT}`);
    console.log(`Accounts: ATM (3333), Branch 1 (4444), Branch 2 (5555)`);
    console.log("─".repeat(100) + "\n");

    const packets = buildScenarioPackets(selectedScenarios);
    console.log(`📦 Generated ${packets.length} packets\n`);
    
    // Show manual false positive marking instructions
    if (selectedScenarios.includes("recurring_false")) {
      console.log("📌 NOTE: For recurring false alarm scenario:");
      console.log("   After each false alarm is sent, manually mark it as false positive in the UI");
      console.log("   using the 'False Positive' button. This helps AI learn the pattern.\n");
    }
    
    console.log("─".repeat(100) + "\n");

    let sentCount = 0;
    let errorCount = 0;

    for (let i = 0; i < packets.length; i++) {
      const packet = packets[i];
      
      try {
        console.log(`\n[${i + 1}/${packets.length}] 📅 ${packet.timestamp.toLocaleString()}`);
        console.log(`🏷️  Type: ${packet.eventType.toUpperCase().replace(/_/g, ' ')}`);
        console.log(`� Payload: ${packet.payload}`);
        console.log(`   (Description will be parsed from Contact ID code in payload)`);
        
        await sendPacket(packet.payload);
        sentCount++;
        
        // For recurring false alarms, prompt user to mark manually
        // Skip the 4th alarm (last one) as it's the "current" alarm for demo
        if (packet.eventType === "recurring_false" && 
            packet.payload.includes("18113203008") &&
            (packet.payload.includes("0100") || packet.payload.includes("0200") || packet.payload.includes("0300"))) {
          console.log("\n⚠️  ACTION REQUIRED: Go to the UI and mark this alert as FALSE POSITIVE");
          console.log("   Reason suggestions:");
          if (packet.payload.includes("0100")) {
            console.log("   → 'Spider web on sensor'");
          } else if (packet.payload.includes("0200")) {
            console.log("   → 'Sensor sensitivity too high'");
          } else if (packet.payload.includes("0300")) {
            console.log("   → 'HVAC air flow triggering sensor'");
          }
          console.log("   Then press Enter to continue...");
          
          // Wait for user to press Enter
          await new Promise<void>((resolve) => {
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout
            });
            rl.question('', () => {
              rl.close();
              resolve();
            });
          });
        }
        
        // Wait before sending next packet (realistic timing)
        if (i < packets.length - 1) {
          const delaySeconds = (packet.delayAfterMs / 1000).toFixed(1);
          console.log(`⏳ Waiting ${delaySeconds}s before next packet...`);
          await new Promise(resolve => setTimeout(resolve, packet.delayAfterMs));
        }
      } catch (error) {
        console.error(`❌ Failed to send packet: ${error}`);
        errorCount++;
      }
    }

    console.log("\n" + "═".repeat(100));
    console.log("📊 SCENARIO STREAMING COMPLETE");
    console.log("═".repeat(100));
    console.log(`✅ Successfully sent: ${sentCount} packets`);
    console.log(`❌ Errors: ${errorCount} packets`);
    
    // Show AI analysis expectations for selected scenarios
    console.log("\n🎯 AI ANALYSIS EXPECTATIONS:\n");
    
    if (selectedScenarios.includes("sequential")) {
      console.log("  • [ATM 3333] Area 01 Zone 03: Correlate burglary+tamper as active ATM break-in (HIGH PRIORITY)");
    }
    if (selectedScenarios.includes("motion")) {
      console.log("  • [ATM 3333] Area 01 Zone 05: Repeated motion detection - potential loitering");
    }
    if (selectedScenarios.includes("fire")) {
      console.log("  • [Branch 1 4444] Area 01→02: Correlate sequential smoke alarms as fire spreading (CRITICAL)");
    }
    if (selectedScenarios.includes("sensor_not_restored")) {
      console.log("  • [Branch 1 4444] Area 02 Zone 04: Flag sensor battery issue and supervision loss");
    }
    if (selectedScenarios.includes("communication")) {
      console.log("  • [Branch 2 5555] Area 01: Note panel was offline 2h 15m");
    }
    if (selectedScenarios.includes("single_critical")) {
      console.log("  • [Branch 2 5555] Area 02 Zone 05: Medical panic - immediate emergency dispatch");
    }
    if (selectedScenarios.includes("recurring_false")) {
      console.log("  • [Branch 2 5555] Area 03 Zone 08: AI should detect false alarm pattern (if marked)");
    }
    
    console.log("\n" + "═".repeat(100) + "\n");

  } catch (error) {
    console.error("\n❌ Fatal Error:", error);
    process.exit(1);
  }
}

// Run if executed directly (ES module check)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  console.log("\n⚠️  PREREQUISITES:");
  console.log("   1. TCP Server must be running: npx tsx server/siaReceiver.ts");
  console.log("   2. Alert analyzer should be active for AI analysis");
  console.log("   3. Database should be seeded with account 3333\n");
  
  setTimeout(() => {
    streamScenarioPackets().catch(console.error);
  }, 3000);
}

export { streamScenarioPackets, buildScenarioPackets };

/**
 * HTTP endpoint handler for programmatic scenario streaming
 */
export async function handleScenarioRequest(scenarios: string[]): Promise<void> {
  const scenarioTypes = scenarios as ScenarioType[];
  console.log("\n" + "═".repeat(100));
  console.log("📋 SCENARIO STREAMING REQUEST (Programmatic)");
  console.log("═".repeat(100));
  
  scenarioTypes.forEach(scenarioId => {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      console.log(`  ✓ ${scenario.name} - ${scenario.description}`);
    }
  });
  
  console.log("\n" + "─".repeat(100));
  console.log(`Target: ${TCP_HOST}:${TCP_PORT}`);
  console.log(`Accounts: ATM (${ACCOUNT_ATM}), Branch 1 (${ACCOUNT_BRANCH1}), Branch 2 (${ACCOUNT_BRANCH2})`);
  console.log("─".repeat(100) + "\n");

  const packets = buildScenarioPackets(scenarioTypes);
  console.log(`📦 Generated ${packets.length} packets\n`);
  
  // Show manual false positive marking instructions
  if (scenarioTypes.includes("recurring_false")) {
    console.log("📌 NOTE: For recurring false alarm scenario:");
    console.log("   After each false alarm is sent, manually mark it as false positive in the UI");
    console.log("   using the 'False Positive' button. This helps AI learn the pattern.\n");
  }
  
  console.log("─".repeat(100) + "\n");

  let sentCount = 0;
  let errorCount = 0;

  for (let i = 0; i < packets.length; i++) {
    const packet = packets[i];
    
    try {
      console.log(`\n[${i + 1}/${packets.length}] 📅 ${packet.timestamp.toLocaleString()}`);
      console.log(`🏷️  Type: ${packet.eventType.toUpperCase().replace(/_/g, ' ')}`);
      console.log(`� Payload: ${packet.payload}`);
      console.log(`   (Description will be parsed from Contact ID code in payload)`);
      
      await sendPacket(packet.payload);
      sentCount++;
      
      // Wait before sending next packet (realistic timing)
      if (i < packets.length - 1) {
        const delaySeconds = (packet.delayAfterMs / 1000).toFixed(1);
        console.log(`⏳ Waiting ${delaySeconds}s before next packet...`);
        await new Promise(resolve => setTimeout(resolve, packet.delayAfterMs));
      }
    } catch (error) {
      console.error(`❌ Failed to send packet: ${error}`);
      errorCount++;
    }
  }

  console.log("\n" + "═".repeat(100));
  console.log("📊 SCENARIO STREAMING COMPLETE");
  console.log("═".repeat(100));
  console.log(`✅ Successfully sent: ${sentCount} packets`);
  console.log(`❌ Errors: ${errorCount} packets`);
  console.log("\n" + "═".repeat(100) + "\n");
}
