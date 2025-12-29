/**
 * Stream Specific SIA DC-09 Packets to TCP Server
 * 
 * Streams a predefined set of SIA DC-09 packets to the local TCP server
 * Simulates real-time packet arrival from security panels
 */

import net from "net";

const TCP_HOST = "localhost";
const TCP_PORT = 7800; // Must match siaReceiver.ts TCP_PORT
const PACKET_DELAY_MS = 2000; // Delay between packets (2s = 0.5 packets/second)

// Predefined packets from log
const PACKET_STRINGS = [
  "[10]2E151Ca06100100[#3333|18113001008][13]",
  "[10]E7660B[09]06080100[][13]",
  "[10]27760B[09]06090100[][13]",
  "[10]71E91Ca06110100[#3333|18313001008][13]",
  "[10]51B31Ca06120100[#3333|18140601001][13]",
  "[10]EB1D0B[09]06130100[][13]",
  "[10]384A1Ca06140100[#3333|18137301001][13]",
  "[10]67B61Ca06150100[#3333|18337301001][13]",
  "[10]52F31Ca06160100[#3333|18137301001][13]",
  "[10]0D0F1Ca06170100[#3333|18337301001][13]",
  "[10]A4F51Ca06180100[#3333|18113402002][13]",
  "[10]7BCB1Ca06190100[#3333|18145902001][13]",
  "[10]CF4C1Ca06200100[#3333|18313402002][13]",
  "[10]00B11Ca06210100[#3333|18113402003][13]",
  "[10]25371Ca06220100[#3333|18145902001][13]",
  "[10]A0A91Ca06230100[#3333|18313402003][13]",
  "[10]20A01Ca06240100[#3333|18113403005][13]",
  "[10]CF9C1Ca06250100[#3333|18145903001][13]",
  "[10]80B81Ca06260100[#3333|18313403005][13]",
  "[10]EF3D1Ca06270100[#3333|18113401006][13]",
  "[10]A52D1Ca06280100[#3333|18145901001][13]",
  "[10]70B01Ca06290100[#3333|18313401006][13]",
  "[10]89A11Ca06300100[#3333|18140601001][13]",
  "[10]1CB81Ca06310100[#3333|18140602001][13]",
  "[10]23611Ca06320100[#3333|18140603001][13]"
];

/**
 * Send a single packet to the TCP server
 */
async function sendPacket(payload: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.connect(TCP_PORT, TCP_HOST, () => {
      // Send as ASCII string
      const buffer = Buffer.from(payload, 'ascii');
      console.log(`📤 Sending raw ASCII: ${payload}`);
      console.log(`📤 Buffer hex: ${buffer.toString('hex')}`);
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
 * Stream all predefined packets
 */
async function streamSpecificPackets() {
  try {
    console.log("\n" + "═".repeat(80));
    console.log("📡 SIA DC-09 Specific Packet Streamer (Raw ASCII)");
    console.log("═".repeat(80));
    console.log(`Target: ${TCP_HOST}:${TCP_PORT}`);
    console.log(`Delay: ${PACKET_DELAY_MS}ms between packets`);
    console.log("─".repeat(80) + "\n");

    const packets: string[] = PACKET_STRINGS;

    console.log(`📦 Loaded ${packets.length} packets\n`);

    let sentCount = 0;
    let errorCount = 0;

    for (let i = 0; i < packets.length; i++) {
      try {
        const payload = packets[i];
        
        console.log(`[${i + 1}/${packets.length}]`);
        
        await sendPacket(payload);
        sentCount++;
        
        // Wait before sending next packet
        if (sentCount < packets.length) {
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
console.log("\n⚠️  Make sure the TCP server is running first!");
console.log("   Start it with: npx tsx server/siaReceiver.ts\n");

// Small delay to let user read the message
setTimeout(() => {
  streamSpecificPackets().catch(console.error);
}, 2000);

export { streamSpecificPackets, sendPacket };