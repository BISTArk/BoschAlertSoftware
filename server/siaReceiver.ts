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
import { parseSiaDC09, isValidSiaDC09, generateSummary } from "./siaDC09Parser.ts";

// Connection mode: "server" to listen for connections, "client" to connect to remote service
const CONNECTION_MODE = process.env.CONNECTION_MODE || "server"; // server or client
const TCP_PORT = parseInt(process.env.TCP_PORT || "7800");
const TCP_HOST = process.env.TCP_HOST || "0.0.0.0"; // For server mode: 0.0.0.0 for all interfaces
const REMOTE_HOST = process.env.REMOTE_HOST || "127.0.0.1"; // For client mode: IP to connect to
const REMOTE_PORT = parseInt(process.env.REMOTE_PORT || "7800"); // For client mode: Port to connect to
const CONVEX_SITE_URL = process.env.VITE_CONVEX_URL || "http://127.0.0.1:3210";

// Protocol bytes
const LF = 0x0A;  // Line Feed [10]
const CR = 0x0D;  // Carriage Return [13]

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
 * Calculate CRC16-CCITT checksum
 */
function calculateCRC16(data: Buffer): number {
  let crc = 0xFFFF;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  
  return crc & 0xFFFF;
}

/**
 * Generate ACK response for the protocol
 * Format: [10]<CRC><SEQ><DATA>[][13]
 */
function generateAckResponse(receivedData: Buffer): Buffer {
  // Extract sequence and other parts from received message
  // Find the start after LF (0x0A) and extract up to CR (0x0D)
  const lfIndex = receivedData.indexOf(LF);
  const crIndex = receivedData.indexOf(CR);
  
  if (lfIndex === -1 || crIndex === -1) {
    console.warn("Invalid frame format, sending simple ACK");
    return Buffer.from([0x06]);
  }
  
  // Extract the content between LF and CR
  const content = receivedData.slice(lfIndex + 1, crIndex);
  const contentStr = content.toString('ascii');
  
  // Extract sequence portion (everything before the SIA message or data)
  // Pattern: CRC(4 hex chars) + SEQ + DATA
  // We need to preserve the sequence part
  const match = contentStr.match(/^([0-9A-F]{4})([0-9A-F]{2}a?\d+)/i);
  
  if (!match) {
    console.warn("Cannot parse sequence, sending simple ACK");
    return Buffer.from([0x06]);
  }
  
  const sequencePart = match[2]; // e.g., "0Ba02710100"
  
  // Build ACK payload: sequence + empty brackets
  const ackPayload = sequencePart + "[]";
  const ackPayloadBuffer = Buffer.from(ackPayload, 'ascii');
  
  // Calculate CRC for the ACK payload
  const crc = calculateCRC16(ackPayloadBuffer);
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  
  // Build complete ACK: [10] + CRC + payload + [13]
  const ackMessage = Buffer.concat([
    Buffer.from([LF]),
    Buffer.from(crcHex, 'ascii'),
    ackPayloadBuffer,
    Buffer.from([CR])
  ]);
  
  return ackMessage;
}

/**
 * Extract SIA message from protocol frame
 * Format: [10]<CRC><SEQ><DATA>[#2000|...][13]
 */
function extractSiaMessage(data: Buffer): string | null {
  const dataStr = data.toString('ascii');
  
  // Look for SIA message pattern [#...] or [...|...]
  const siaMatch = dataStr.match(/(\[#?\d+[^\]]*\])/);
  
  if (siaMatch) {
    return siaMatch[1];
  }
  
  return null;
}

/**
 * Handle incoming SIA DC-09 data from a socket connection
 */
async function handleSiaData(data: Buffer, socket: net.Socket): Promise<void> {
  try {
    // Convert buffer to hex for logging
    const hexData = data.toString("hex");
    console.log(`📥 Raw data (hex): ${hexData}`);

    // Try to decode as ASCII
    const rawMessage = data.toString("ascii");
    console.log(`📥 Decoded frame: ${rawMessage}`);

    // Extract SIA message from protocol frame
    const siaMessage = extractSiaMessage(data);
    
    if (!siaMessage) {
      console.warn("⚠️  No SIA message found in frame");
      const ack = generateAckResponse(data);
      socket.write(ack);
      console.log(`✅ Sent ACK: ${ack.toString('hex')}\n`);
      console.log("─".repeat(80));
      return;
    }
    
    console.log(`📥 Extracted SIA: ${siaMessage}`);

    // Validate SIA DC-09 format
    if (!isValidSiaDC09(siaMessage)) {
      console.warn("⚠️  Invalid SIA DC-09 format");
      const ack = generateAckResponse(data);
      socket.write(ack);
      console.log(`✅ Sent ACK: ${ack.toString('hex')}\n`);
      console.log("─".repeat(80));
      return;
    }

    // Parse the message
    const parsed = parseSiaDC09(siaMessage);
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

    // Generate and send ACK response
    const ack = generateAckResponse(data);
    socket.write(ack);
    console.log(`✅ Sent ACK: ${ack.toString('hex')}`);
    console.log(`   ASCII: ${ack.toString('ascii').replace(/\n/g, '[LF]').replace(/\r/g, '[CR]')}\n`);
    console.log("─".repeat(80));
  } catch (error) {
    console.error("❌ Error processing message:", error);
    // Try to send ACK anyway
    try {
      const ack = generateAckResponse(data);
      socket.write(ack);
    } catch (ackError) {
      socket.write(Buffer.from([0x06])); // Fallback to simple ACK
    }
  }
}

/**
 * Start TCP server to listen for incoming SIA DC-09 connections
 */
function startTCPServer(): void {
  const server = net.createServer((socket) => {
    console.log(`\n📡 TCP client connected: ${socket.remoteAddress}:${socket.remotePort}`);

    socket.on("data", (data) => handleSiaData(data, socket));

    socket.on("error", (error) => {
      console.error("❌ TCP socket error:", error);
    });

    socket.on("close", () => {
      console.log("📡 TCP client disconnected\n");
    });
  });

  server.listen(TCP_PORT, TCP_HOST, () => {
    console.log(`✅ TCP server listening on ${TCP_HOST}:${TCP_PORT}`);
  });

  server.on("error", (error) => {
    console.error("❌ TCP server error:", error);
  });
}

/**
 * Start TCP client to connect to remote SIA DC-09 service
 */
function startTCPClient(): void {
  console.log(`🔌 Attempting to connect to ${REMOTE_HOST}:${REMOTE_PORT}...`);

  const socket = net.createConnection({
    host: REMOTE_HOST,
    port: REMOTE_PORT,
  });

  socket.on("connect", () => {
    console.log(`✅ Connected to remote service at ${REMOTE_HOST}:${REMOTE_PORT}`);
    console.log("⏳ Listening for SIA DC-09 messages...\n");
  });

  socket.on("data", (data) => handleSiaData(data, socket));

  socket.on("error", (error) => {
    console.error("❌ TCP connection error:", error.message);
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(() => startTCPClient(), 5000);
  });

  socket.on("close", () => {
    console.log("📡 Connection closed");
    console.log("🔄 Reconnecting in 5 seconds...");
    setTimeout(() => startTCPClient(), 5000);
  });
}

/**
 * Start SIA DC-09 receiver (server or client mode)
 */
export function startServers(): void {
  console.log("\n" + "═".repeat(80));
  console.log("🚀 SIA DC-09 Message Receiver");
  console.log("═".repeat(80));
  console.log(`Mode: ${CONNECTION_MODE.toUpperCase()}`);
  console.log(`Convex URL: ${CONVEX_SITE_URL}`);
  
  if (CONNECTION_MODE === "client") {
    console.log(`Remote Host: ${REMOTE_HOST}`);
    console.log(`Remote Port: ${REMOTE_PORT}`);
    console.log("─".repeat(80) + "\n");
    startTCPClient();
  } else {
    console.log(`TCP Host: ${TCP_HOST}`);
    console.log(`TCP Port: ${TCP_PORT}`);
    console.log("─".repeat(80) + "\n");
    startTCPServer();
    console.log("\n✅ Server started successfully");
    console.log("⏳ Waiting for SIA DC-09 messages from security panels...\n");
  }
}

// Start server if this file is run directly
// if (import.meta.url === `file://${process.argv[1]}`) {
  startServers();
// }
