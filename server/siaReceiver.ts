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

// Packet counter for logging
let packetCounter = 0;

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
          areaNumber: parsed.areaNumber,
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
 * Always returns proper framed ACK, never simple 0x06
 */
function generateAckResponse(receivedData: Buffer): Buffer {
  // Extract sequence and other parts from received message
  const lfIndex = receivedData.indexOf(LF);
  const crIndex = receivedData.indexOf(CR);
  
  if (lfIndex === -1 || crIndex === -1) {
    console.error("⚠️  Invalid frame format - missing LF or CR");
    // Still try to build a minimal ACK
    return Buffer.concat([
      Buffer.from([LF]),
      Buffer.from("0000"),
      Buffer.from("[]"),
      Buffer.from([CR])
    ]);
  }
  
  // Extract the content between LF and CR
  const content = receivedData.slice(lfIndex + 1, crIndex);
  const contentStr = content.toString('ascii');
  
  // Pattern: Skip first 4 hex chars (CRC), then extract sequence until we hit [ or end
  // Examples:
  // "CDC40B[09]02690100[]" -> sequence: "0B[09]02690100"
  // "E0E50E[09]02700100[NYC]" -> sequence: "0E[09]02700100"
  // "EBCE1Ca02710100[#2000|...]" -> sequence: "1Ca02710100"
  
  if (contentStr.length < 4) {
    console.error("⚠️  Content too short");
    return Buffer.concat([
      Buffer.from([LF]),
      Buffer.from("0000[]"),
      Buffer.from([CR])
    ]);
  }
  
  // Skip CRC (first 4 chars) and extract until we hit the data portion
  const afterCrc = contentStr.substring(4);
  
  // Find where the data starts (marked by '[')
  const dataStartIndex = afterCrc.indexOf('[');
  
  let sequencePart: string;
  if (dataStartIndex !== -1) {
    // Extract everything before the '['
    sequencePart = afterCrc.substring(0, dataStartIndex);
  } else {
    // No '[' found, the whole thing is sequence (shouldn't happen)
    sequencePart = afterCrc;
  }
  
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
 * Format buffer as hex with [XX] notation
 * Example: Buffer([0x0A, 0x43, 0x44]) => "[10]CD44"
 */
function formatBufferAsHex(buffer: Buffer): string {
  let result = '';
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    // Show control characters in brackets, regular chars as hex
    if (byte === 0x0A) {
      result += '[10]';
    } else if (byte === 0x0D) {
      result += '[13]';
    } else if (byte === 0x09) {
      result += '[09]';
    } else if (byte < 0x20 || byte > 0x7E) {
      // Non-printable characters in hex
      result += byte.toString(16).toUpperCase().padStart(2, '0');
    } else {
      // Printable ASCII
      result += String.fromCharCode(byte);
    }
  }
  return result;
}

/**
 * Get current timestamp in HH:MM:SS.mmm format
 */
function getTimestamp(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const millis = now.getMilliseconds().toString().padStart(4, '0');
  return `${hours}:${minutes}:${seconds}.${millis}`;
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
    packetCounter++;
    const timestamp = getTimestamp();
    
    // Format received data like the dump
    const receivedFormatted = formatBufferAsHex(data);
    
    // Generate ACK response (always proper framed ACK)
    const ack = generateAckResponse(data);
    const ackFormatted = formatBufferAsHex(ack);
    
    // Print in dump format: timestamp <counter> received => ACK ack
    console.log(`${timestamp} <${packetCounter}> ${receivedFormatted} => ACK ${ackFormatted}`);
    
    // Send ACK
    socket.write(ack);

    // Extract SIA message from protocol frame
    const siaMessage = extractSiaMessage(data);
    
    if (!siaMessage) {
      console.log("         ⚠️  No SIA message found in frame\n");
      return;
    }
    
    console.log(`         📥 SIA: ${siaMessage}`);

    // Validate SIA DC-09 format
    if (!isValidSiaDC09(siaMessage)) {
      console.log("         ⚠️  Invalid SIA DC-09 format\n");
      return;
    }

    // Parse the message
    const parsed = parseSiaDC09(siaMessage);
    if (parsed) {
      console.log(`         ✅ Account: ${parsed.accountNumber} | Event: ${parsed.eventCode} - ${parsed.eventDescription}`);
      if (parsed.priority === "critical" || parsed.priority === "high") {
        console.log(`         🚨 Priority: ${parsed.priority.toUpperCase()}`);
      }

      // Store in database
      await storeSiaDC09Alert(parsed);
      console.log(`         💾 Stored in database\n`);
    } else {
      console.log("         ❌ Failed to parse message\n");
    }
  } catch (error) {
    console.error("         ❌ Error processing message:", error);
    // Always try to send proper framed ACK
    try {
      const ack = generateAckResponse(data);
      socket.write(ack);
    } catch (ackError) {
      console.error("         ❌ Critical: Cannot generate ACK");
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
