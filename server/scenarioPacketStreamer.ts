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
const ACCOUNT = "3333";

interface ScenarioPacket {
  payload: string;
  description: string;
  timestamp: Date;
  delayAfterMs: number; // Delay before next packet (simulates real-world timing)
  eventType: "recurring_false" | "communication" | "sequential" | "single_critical" | "sensor_not_restored" | "fire";
  notes?: string;
}

type ScenarioType = "recurring_false" | "communication" | "sequential" | "fire" | "single_critical" | "sensor_not_restored";

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
    id: "recurring_false",
    name: "Recurring False Alarms",
    description: "Area 01 Zone 08 (Lobby Motion) - 4 false alarms over 4 days"
  },
  {
    id: "communication",
    name: "Communication Failure",
    description: "Area 01 panel disconnection for 2h 15m"
  },
  {
    id: "sequential",
    name: "Sequential Correlated Burglary",
    description: "Area 02 Zone 03 (Window) - Burglary + Tamper (45s apart)"
  },
  {
    id: "fire",
    name: "Fire Emergency",
    description: "Area 04→02 Zone 07 - Smoke spreading from basement"
  },
  {
    id: "single_critical",
    name: "Medical Emergency",
    description: "Area 03 Zone 05 - Medical panic button"
  },
  {
    id: "sensor_not_restored",
    name: "Sensor Not Restored",
    description: "Area 02 Zone 04 (Back Door) - Open + lost supervision + low battery"
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
    payload: generatePacket(ACCOUNT, "18113201008", "0100"),
    description: "DAY 1: Burglary Alarm - Interior - Area 01 Zone 08 (Lobby Motion) - FALSE ALARM #1",
    timestamp: day1Time,
    delayAfterMs: 2000,
    eventType: "recurring_false",
    notes: "First occurrence on Area 01 Zone 08 (Lobby Interior Motion). Resolution: Spider web on sensor"
  });
  
  const day1Restore = new Date(day1Time.getTime() + 5 * 60 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT, "38113201008", "0110"),
    description: "DAY 1: Area 01 Zone 08 Restored",
    timestamp: day1Restore,
    delayAfterMs: 5000,
    eventType: "recurring_false",
    notes: "Zone cleared manually"
  });
  
  // DAY 2: Second false alarm
  const day2Time = new Date(twoDaysAgo);
  day2Time.setHours(9, 15, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT, "18113201008", "0200"),
    description: "DAY 2: Burglary Alarm - Interior - Area 01 Zone 08 (Lobby Motion) - FALSE ALARM #2",
    timestamp: day2Time,
    delayAfterMs: 2000,
    eventType: "recurring_false",
    notes: "Second occurrence - same zone. Resolution: Sensor sensitivity too high"
  });
  
  const day2Restore = new Date(day2Time.getTime() + 3 * 60 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT, "38113201008", "0210"),
    description: "DAY 2: Area 01 Zone 08 Restored",
    timestamp: day2Restore,
    delayAfterMs: 5000,
    eventType: "recurring_false",
    notes: "Zone cleared"
  });
  
  // DAY 3: Third false alarm
  const day3Time = new Date(oneDayAgo);
  day3Time.setHours(16, 45, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT, "18113201008", "0300"),
    description: "DAY 3: Burglary Alarm - Interior - Area 01 Zone 08 (Lobby Motion) - FALSE ALARM #3",
    timestamp: day3Time,
    delayAfterMs: 2000,
    eventType: "recurring_false",
    notes: "Third occurrence in 3 days. Resolution: HVAC air flow triggering motion sensor"
  });
  
  const day3Restore = new Date(day3Time.getTime() + 4 * 60 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT, "38113201008", "0310"),
    description: "DAY 3: Area 01 Zone 08 Restored",
    timestamp: day3Restore,
    delayAfterMs: 5000,
    eventType: "recurring_false",
    notes: "Zone cleared"
  });
  
  // CURRENT DAY: Fourth false alarm
  const recurringAlarmTime = new Date(now);
  recurringAlarmTime.setHours(14, 30, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT, "18113201008", "0500"),
    description: "TODAY 2:30 PM: Burglary - Interior - Area 01 Zone 08 (Lobby Motion) - FALSE ALARM #4",
    timestamp: recurringAlarmTime,
    delayAfterMs: 2000,
    eventType: "recurring_false",
    notes: "Fourth occurrence in 4 days - AI should detect pattern, lower priority, suggest sensor replacement"
  });
  
  const recurringRestore = new Date(recurringAlarmTime.getTime() + 6 * 60 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT, "38113201008", "0510"),
    description: "TODAY 2:36 PM: Area 01 Zone 08 Restored",
    timestamp: recurringRestore,
    delayAfterMs: 2000,
    eventType: "recurring_false",
    notes: "Zone cleared - likely another false alarm"
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
    payload: generatePacket(ACCOUNT, "18135401000", "0400"),
    description: "TODAY 8:00 AM: Communication Failure - Telco 1 Fault - Area 01",
    timestamp: commFailTime,
    delayAfterMs: 3000,
    eventType: "communication",
    notes: "Panel lost communication with monitoring station. Network cable unplugged."
  });
  
  const commRestoreTime = new Date(commFailTime.getTime() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000);
  commRestoreTime.setHours(10, 15, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT, "33135401000", "0410"),
    description: "TODAY 10:15 AM: Communication Restored - Area 01",
    timestamp: commRestoreTime,
    delayAfterMs: 2000,
    eventType: "communication",
    notes: "Network cable reconnected. Communication with monitoring station restored."
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
    payload: generatePacket(ACCOUNT, "18113102003", "0600"),
    description: "TODAY 3:45 PM: REAL BURGLARY - Perimeter - Area 02 Zone 03 (Office Window West)",
    timestamp: realBurglaryTime,
    delayAfterMs: 1000,
    eventType: "sequential",
    notes: "CRITICAL: Actual intrusion attempt. Window sensor triggered on Area 02 Zone 03."
  });
  
  const tamperTime = new Date(realBurglaryTime.getTime() + 45 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT, "18113702003", "0610"),
    description: "TODAY 3:45:45 PM: Tamper Alarm - Area 02 Zone 03 (Office Window West)",
    timestamp: tamperTime,
    delayAfterMs: 2000,
    eventType: "sequential",
    notes: "CRITICAL: Tamper detected 45s after breach on Area 02 Zone 03. AI correlate as active intrusion."
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
    payload: generatePacket(ACCOUNT, "18111004007", "0650"),
    description: "TODAY 3:30 PM: FIRE ALARM - Smoke Detector - Area 04 Zone 007 (Basement Smoke Detector)",
    timestamp: fireTime,
    delayAfterMs: 1000,
    eventType: "fire",
    notes: "CRITICAL: Smoke detected in basement on Area 04 Zone 007. Possible electrical fire."
  });
  
  const fireSpreadTime = new Date(fireTime.getTime() + 30 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT, "18111002007", "0660"),
    description: "TODAY 3:30:30 PM: FIRE ALARM - Smoke Detector - Area 02 Zone 007 (Office Smoke Detector)",
    timestamp: fireSpreadTime,
    delayAfterMs: 2000,
    eventType: "fire",
    notes: "CRITICAL: Second smoke alarm 30s later on Area 02 Zone 007. AI should correlate as fire spreading up from basement."
  });
  
  const fireTroubleTime = new Date(fireSpreadTime.getTime() + 15 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT, "18137304007", "0670"),
    description: "TODAY 3:30:45 PM: Fire Trouble - Area 04 Zone 007 (Basement Smoke Detector)",
    timestamp: fireTroubleTime,
    delayAfterMs: 2000,
    eventType: "fire",
    notes: "Fire trouble signal from basement detector - sensor may be damaged by fire or battery failing under alarm condition."
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
    payload: generatePacket(ACCOUNT, "18110003005", "0700"),
    description: "TODAY 4:00 PM: Medical Emergency - Area 03 Zone 005 (Medical Emergency Button)",
    timestamp: medicalTime,
    delayAfterMs: 2000,
    eventType: "single_critical",
    notes: "CRITICAL: Medical panic button pressed on Area 03 Zone 005. Immediate dispatch required."
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
  
  // packets.push({
  //   payload: generatePacket(ACCOUNT, "18113402004", "0800"),
  //   description: "TODAY 4:30 PM: Burglary - Entry/Exit - Area 02 Zone 004 (Back Door Delivery)",
  //   timestamp: zoneOpenTime,
  //   delayAfterMs: 3000,
  //   eventType: "sensor_not_restored",
  //   notes: "Area 02 Zone 004 (back door) triggered but will not restore - sensor malfunction or door left open"
  // });
  
  const lostSupervisionTime = new Date(zoneOpenTime.getTime() + 1.5 * 60 * 60 * 1000);
  lostSupervisionTime.setHours(18, 0, 0, 0);
  
  packets.push({
    payload: generatePacket(ACCOUNT, "18138102004", "0810"),
    description: "TODAY 6:00 PM: Loss of Supervision - RF - Area 02 Zone 004",
    timestamp: lostSupervisionTime,
    delayAfterMs: 2000,
    eventType: "sensor_not_restored",
    notes: "ALERT: Area 02 Zone 004 not restored after 1.5 hours. Battery dead or door open. Immediate attention required."
  });
  
  const lowBatteryTime = new Date(lostSupervisionTime.getTime() + 2 * 60 * 1000);
  packets.push({
    payload: generatePacket(ACCOUNT, "18138402004", "0820"),
    description: "TODAY 6:02 PM: RF Low Battery - Area 02 Zone 004 (Back Door)",
    timestamp: lowBatteryTime,
    delayAfterMs: 2000,
    eventType: "sensor_not_restored",
    notes: "Area 02 Zone 004 sensor battery critically low - explains lost supervision"
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
    }
    
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
    console.log(`Account: ${ACCOUNT}`);
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
        console.log(`📝 ${packet.description}`);
        if (packet.notes) {
          console.log(`💡 ${packet.notes}`);
        }
        console.log(`📤 Payload: ${packet.payload}`);
        
        await sendPacket(packet.payload);
        sentCount++;
        
        // For recurring false alarms, prompt user to mark manually
        if (packet.eventType === "recurring_false" && 
            packet.description.includes("FALSE ALARM") &&
            !packet.description.includes("#4")) {
          console.log("\n⚠️  ACTION REQUIRED: Go to the UI and mark this alert as FALSE POSITIVE");
          console.log("   Reason suggestions:");
          if (packet.description.includes("#1")) {
            console.log("   → 'Spider web on sensor'");
          } else if (packet.description.includes("#2")) {
            console.log("   → 'Sensor sensitivity too high'");
          } else if (packet.description.includes("#3")) {
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
    
    if (selectedScenarios.includes("recurring_false")) {
      console.log("  • Area 01 Zone 08 pattern: AI should detect recurring false alarms (if marked), suggest lower priority");
    }
    if (selectedScenarios.includes("communication")) {
      console.log("  • Area 01 communication: Note panel was offline 2h 15m");
    }
    if (selectedScenarios.includes("sequential")) {
      console.log("  • Area 02 Zone 03 burglary+tamper: Correlate as active intrusion (HIGH PRIORITY)");
    }
    if (selectedScenarios.includes("fire")) {
      console.log("  • Area 04→02 Zone 07 fire: Correlate sequential smoke alarms as fire spreading (CRITICAL)");
    }
    if (selectedScenarios.includes("single_critical")) {
      console.log("  • Area 03 Zone 05 medical: Recommend immediate emergency dispatch");
    }
    if (selectedScenarios.includes("sensor_not_restored")) {
      console.log("  • Area 02 Zone 04 not restored: Flag sensor battery issue and open door risk");
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
  console.log(`Account: ${ACCOUNT}`);
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
      console.log(`📝 ${packet.description}`);
      if (packet.notes) {
        console.log(`💡 ${packet.notes}`);
      }
      console.log(`📤 Payload: ${packet.payload}`);
      
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
