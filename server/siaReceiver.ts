/**
 * SIA DC-09 Message Receiver Server
 * Listens for SIA DC-09 protocol messages via TCP
 * Parses messages from Bosch security panels and stores them in Convex
 * 
 * Protocol Format: [#AccountNumber|ReceiverId/EventCode/AreaInfo]
 * Examples:
 * - [#3333|Nri01/BA0008/APB] - Burglary Alarm Zone 8
 * - [#3333|Nri01/id0001/BC/AUser 1] - User Access
 */

import net from "net";
import { parseSiaDC09, isValidSiaDC09, generateSummary } from "./siaDC09Parser.js";

const TCP_PORT = 4000;
const CONVEX_SITE_URL = process.env.VITE_CONVEX_URL || "http://127.0.0.1:3210";

// ACK response byte (standard acknowledgment)
const ACK_BYTE = Buffer.from([0x06]);

/**
 * Store SIA DC-09 alert in Convex database
 */
async function storeSiaDC09Alert(parsed: ReturnType<typeof parseSiaDC09>): Promise<void> {
  if (!parsed) {
    console.error("Cannot store null parsed message");
    return;
  }

  try {
    const response = await fetch(`${CONVEX_SITE_URL}/api/mutation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "alerts:createSiaDC09Alert",
        args: [{
          rawMessage: parsed.raw,
          accountNumber: parsed.accountNumber,
          receiverId: parsed.receiverId,
          eventCode: parsed.eventCode,
          zoneNumber: parsed.zoneNumber,
          userName: parsed.userName,
          areaInfo: parsed.areaInfo,
          eventDescription: parsed.eventDescription,
          eventCategory: parsed.eventCategory,
          priority: parsed.priority,
          eventQualifier: parsed.eventQualifier,
          eventTimestamp: parsed.timestamp,
        }],
        format: "json",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to store alert:", errorText);
    } else {
      console.log("✓ Alert stored in Convex");
    }
  } catch (error) {
    console.error("Error storing alert:", error);
  }
}

/**
 * Start TCP server to receive SIA DC-09 messages
 */
function startTCPServer(): void {
  const server = net.createServer((socket) => {
    console.log(`\n📡 TCP client connected: ${socket.remoteAddress}:${socket.remotePort}`);

    socket.on("data", async (data) => {
      try {
        // Convert buffer to hex for logging
        const hexData = data.toString("hex");
        console.log(`📥 Raw data (hex): ${hexData}`);

        // Try to decode as ASCII
        const message = data.toString("ascii").trim();
        console.log(`📥 Decoded message: ${message}`);

        // Validate SIA DC-09 format
        if (!isValidSiaDC09(message)) {
          console.warn("⚠️  Invalid SIA DC-09 format, ignoring...");
          socket.write(ACK_BYTE); // Still acknowledge to keep connection
          return;
        }

        // Parse the message
        const parsed = parseSiaDC09(message);
        if (parsed) {
          console.log(`\n✅ Parsed SIA DC-09 Message:`);
          console.log(`   Account: ${parsed.accountNumber}`);
          console.log(`   Receiver: ${parsed.receiverId || "N/A"}`);
          console.log(`   Event: ${parsed.eventCode} - ${parsed.eventDescription}`);
          console.log(`   Category: ${parsed.eventCategory}`);
          console.log(`   Priority: ${parsed.priority.toUpperCase()}`);
          if (parsed.zoneNumber) console.log(`   Zone: ${parsed.zoneNumber}`);
          if (parsed.userName) console.log(`   User: ${parsed.userName}`);
          if (parsed.areaInfo) console.log(`   Area: ${parsed.areaInfo}`);

          // Store in database
          await storeSiaDC09Alert(parsed);

          // Generate summary
          const summary = generateSummary(parsed);
          console.log(`   Summary: ${summary}\n`);
        } else {
          console.error("❌ Failed to parse message");
        }

        // Send ACK (0x06 byte)
        socket.write(ACK_BYTE);
        console.log("✅ Sent ACK (0x06)\n");
        console.log("─".repeat(80));
      } catch (error) {
        console.error("❌ Error processing message:", error);
        socket.write(ACK_BYTE); // Still acknowledge to prevent retransmission
      }
    });

    socket.on("error", (error) => {
      console.error("❌ TCP socket error:", error);
    });

    socket.on("close", () => {
      console.log("📡 TCP client disconnected\n");
    });
  });

  server.listen(TCP_PORT, () => {
    console.log(`✅ TCP server listening on port ${TCP_PORT}`);
  });

  server.on("error", (error) => {
    console.error("❌ TCP server error:", error);
  });
}

/**
 * Start SIA DC-09 receiver server
 */
export function startServers(): void {
  console.log("\n" + "═".repeat(80));
  console.log("🚀 SIA DC-09 Message Receiver Server");
  console.log("═".repeat(80));
  console.log(`Convex URL: ${CONVEX_SITE_URL}`);
  console.log(`TCP Port: ${TCP_PORT}`);
  console.log("─".repeat(80) + "\n");

  startTCPServer();

  console.log("\n✅ Server started successfully");
  console.log("⏳ Waiting for SIA DC-09 messages from security panels...\n");
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServers();
}
