/**
 * Stream SIA DC-09 Packets to TCP Server
 * 
 * Reads decoded packets from JSON file and streams them to the local TCP server
 * Simulates real-time packet arrival from Bosch security panels
 */

import net from "net";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TCP_HOST = "localhost";
const TCP_PORT = 7800; // Must match siaReceiver.ts TCP_PORT
const PACKET_DELAY_MS = 2000; // Delay between packets (2s = 0.5 packets/second)

interface TcpPacket {
  packet_number: number;
  timestamp: string;
  protocol: string;
  src_ip: string;
  dest_ip: string;
  src_port: number;
  dest_port: number;
  payload_length: number;
  payload: string;
}

/**
 * Send a single packet to the TCP server
 */
async function sendPacket(payloadHex: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.connect(TCP_PORT, TCP_HOST, () => {
      // Convert hex string to buffer
      const buffer = Buffer.from(payloadHex, 'hex');
      const decoded = buffer.toString('ascii').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
      console.log(`📤 Sending (decoded): ${decoded}`);
      client.write(buffer);
    });

    client.on("data", (data) => {
      const response = data.toString("hex");
      if (response === "06") {
        console.log("✅ ACK received (0x06)\n");
      } else {
        console.log(`📥 Response: ${response}\n`);
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

    // Timeout after 5 seconds
    setTimeout(() => {
      client.destroy();
      resolve();
    }, 5000);
  });
}

/**
 * Stream all packets from JSON file
 */
async function streamPackets() {
  try {
    console.log("\n" + "═".repeat(80));
    console.log("📡 SIA DC-09 Packet Streamer");
    console.log("═".repeat(80));
    console.log(`Target: ${TCP_HOST}:${TCP_PORT}`);
    console.log(`Delay: ${PACKET_DELAY_MS}ms between packets`);
    console.log("─".repeat(80) + "\n");

    // Read the JSON file
    const jsonPath = path.join(__dirname, "../Zap6800_Logs/SIA/tcp_packets_20251216_152501.json");
    const jsonContent = await fs.readFile(jsonPath, "utf-8");
    const jsonData = JSON.parse(jsonContent);
    const packets: TcpPacket[] = jsonData.packets || [];

    console.log(`📦 Loaded ${packets.length} packets from file\n`);

    console.log("🔎 Filtering security event packets...");
    // Filter non-empty payloads (actual security events)
    const securityPackets = packets.filter(
      p => p.payload && 
           p.payload.trim() !== "" && 
           p.payload !== "06" // Skip ACK responses (hex)
    );

    console.log(`🔍 Found ${securityPackets.length} security event packets\n`);
    console.log("─".repeat(80) + "\n");

    let sentCount = 0;
    let errorCount = 0;

    for (const packet of securityPackets) {
      try {
        const payloadHex = packet.payload.trim();
        
        console.log(`[${sentCount + 1}/${securityPackets.length}]`);
        console.log(`Time: ${packet.timestamp}`);
        
        await sendPacket(payloadHex);
        sentCount++;
        
        // Wait before sending next packet
        if (sentCount < securityPackets.length) {
          await new Promise(resolve => setTimeout(resolve, PACKET_DELAY_MS));
        }
      } catch (error) {
        console.error(`❌ Failed to send packet: ${error}`);
        errorCount++;
      }
    }

    console.log("\n" + "═".repeat(80));
    console.log("📊 Streaming Complete");
    console.log("═".repeat(80));
    console.log(`✅ Successfully sent: ${sentCount} packets`);
    console.log(`❌ Errors: ${errorCount} packets`);
    console.log(`⏱️  Total time: ${((sentCount * PACKET_DELAY_MS) / 1000).toFixed(1)}s`);
    console.log("═".repeat(80) + "\n");

  } catch (error) {
    console.error("\n❌ Fatal Error:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("\n⚠️  Make sure the TCP server is running first!");
  console.log("   Start it with: npx tsx server/siaReceiver.ts\n");
  
  // Small delay to let user read the message
  setTimeout(() => {
    streamPackets().catch(console.error);
  }, 2000);
}

export { streamPackets, sendPacket };
