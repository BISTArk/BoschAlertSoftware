/**
 * SIA Message Receiver Server
 * Listens for SIA messages via TCP and UDP protocols
 * Parses messages and stores them in Convex database
 */

import net from "net";
import dgram from "dgram";
import { parseSIAMessage, createACK } from "../src/lib/siaParser.js";

const TCP_PORT = 4000;
const UDP_PORT = 4000;
const CONVEX_SITE_URL = process.env.VITE_CONVEX_URL || "http://127.0.0.1:3210";

interface ConvexAlert {
  rawMessage: string;
  protocol: string;
  messageLength?: string;
  receiver?: string;
  accountNumber: string;
  eventCode: string;
  eventDescription?: string;
  zone?: string;
  partition?: string;
  messageTimestamp: string;
  checksum?: string;
}

/**
 * Store alert in Convex database
 */
async function storeAlert(alert: ConvexAlert): Promise<void> {
  try {
    const response = await fetch(`${CONVEX_SITE_URL}/api/mutation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "alerts:createAlert",
        args: [alert],
        format: "json",
      }),
    });

    if (!response.ok) {
      console.error("Failed to store alert:", await response.text());
    } else {
      console.log("✓ Alert stored successfully");
    }
  } catch (error) {
    console.error("Error storing alert:", error);
  }
}

/**
 * Start TCP server to receive SIA messages
 */
function startTCPServer(): void {
  const server = net.createServer((socket) => {
    console.log(`TCP client connected: ${socket.remoteAddress}:${socket.remotePort}`);

    socket.on("data", async (data) => {
      const message = data.toString().trim();
      console.log(`TCP received: ${message}`);

      try {
        const parsed = parseSIAMessage(message);
        console.log("Parsed message:", parsed);

        // Store in database
        await storeAlert(parsed);

        // Send ACK
        const ack = createACK(
          parsed.receiver || "R0000",
          parsed.messageLength || "0000"
        );
        socket.write(ack);
        console.log(`TCP sent ACK: ${ack}`);
      } catch (error) {
        console.error("Error parsing SIA message:", error);
        socket.write("NAK\r\n");
      }
    });

    socket.on("error", (error) => {
      console.error("TCP socket error:", error);
    });

    socket.on("close", () => {
      console.log("TCP client disconnected");
    });
  });

  server.listen(TCP_PORT, () => {
    console.log(`✓ TCP server listening on port ${TCP_PORT}`);
  });

  server.on("error", (error) => {
    console.error("TCP server error:", error);
  });
}

/**
 * Start UDP server to receive SIA messages
 */
function startUDPServer(): void {
  const server = dgram.createSocket("udp4");

  server.on("message", async (msg, rinfo) => {
    const message = msg.toString().trim();
    console.log(`UDP received from ${rinfo.address}:${rinfo.port}: ${message}`);

    try {
      const parsed = parseSIAMessage(message);
      console.log("Parsed message:", parsed);

      // Store in database
      await storeAlert(parsed);

      // Send ACK
      const ack = createACK(
        parsed.receiver || "R0000",
        parsed.messageLength || "0000"
      );
      server.send(ack, rinfo.port, rinfo.address, (error) => {
        if (error) {
          console.error("Error sending UDP ACK:", error);
        } else {
          console.log(`UDP sent ACK to ${rinfo.address}:${rinfo.port}`);
        }
      });
    } catch (error) {
      console.error("Error parsing SIA message:", error);
      const nak = "NAK\r\n";
      server.send(nak, rinfo.port, rinfo.address);
    }
  });

  server.on("error", (error) => {
    console.error("UDP server error:", error);
    server.close();
  });

  server.on("listening", () => {
    const address = server.address();
    console.log(`✓ UDP server listening on port ${address.port}`);
  });

  server.bind(UDP_PORT);
}

/**
 * Start both TCP and UDP servers
 */
export function startServers(): void {
  console.log("🚀 Starting SIA Message Receiver Servers...\n");
  console.log(`Convex URL: ${CONVEX_SITE_URL}\n`);

  startTCPServer();
  startUDPServer();

  console.log("\n✓ All servers started successfully");
  console.log("Waiting for SIA messages...\n");
}

// Start servers if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServers();
}
