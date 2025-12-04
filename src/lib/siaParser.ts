/**
 * SIA DC-09 Message Parser
 * Parses SIA (Security Industry Association) DC-09 format messages
 * Example: SIA-DCS"0002R1111[#15:35:00,12-03-25|PA923005]F0E3
 */

export interface SIAMessage {
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

// SIA Event Code descriptions
const EVENT_CODES: Record<string, string> = {
  // Alarms
  PA: "Panic Alarm",
  BA: "Burglary Alarm",
  FA: "Fire Alarm",
  MA: "Medical Alarm",
  HA: "Hold-up Alarm",
  WA: "Water Alarm",
  GA: "Gas Alarm",
  TA: "Tamper Alarm",
  
  // Supervisory
  AT: "AC Power Trouble",
  YT: "Low System Battery",
  RT: "System Reset",
  JT: "RF Jamming",
  
  // Open/Close
  OP: "Opening",
  CL: "Closing",
  OG: "Opening by Group",
  CG: "Closing by Group",
  
  // Access
  DK: "Door/Window Contact",
  NL: "Door Access Granted",
  NM: "Door Access Denied",
  
  // Trouble
  YP: "System Battery Missing",
  YQ: "System Battery Low",
  YR: "System Battery Failure",
  ZT: "Phone Line Trouble",
  
  // Test
  RP: "Automatic Test",
  RY: "Periodic Test",
  
  // Cancel
  CK: "Cancel",
  
  // Bypass
  UB: "User Bypass",
  
  // Restore
  AR: "Alarm Restore",
  TR: "Trouble Restore",
  BR: "Bypass Restore",
};

/**
 * Parse a SIA DC-09 format message
 * @param message Raw SIA message string
 * @returns Parsed SIA message object
 */
export function parseSIAMessage(message: string): SIAMessage {
  const rawMessage = message.trim();
  
  // Basic SIA message pattern:
  // SIA-DCS"<length><receiver>[<data>]<checksum>
  // or simpler: SIA-DCS[<data>]
  
  const result: SIAMessage = {
    rawMessage,
    protocol: "",
    accountNumber: "",
    eventCode: "",
    messageTimestamp: "",
  };
  
  // Extract protocol (e.g., "SIA-DCS")
  const protocolMatch = message.match(/^([A-Z\-]+)/);
  if (protocolMatch) {
    result.protocol = protocolMatch[1];
  }
  
  // Extract message length (optional, between " and receiver)
  const lengthMatch = message.match(/"(\d+)/);
  if (lengthMatch) {
    result.messageLength = lengthMatch[1];
  }
  
  // Extract receiver (optional, starts with R)
  const receiverMatch = message.match(/"?\d*(R\d+)/);
  if (receiverMatch) {
    result.receiver = receiverMatch[1];
  }
  
  // Extract content between brackets [...]
  const contentMatch = message.match(/\[([^\]]+)\]/);
  if (!contentMatch) {
    throw new Error("Invalid SIA message format: missing content brackets");
  }
  
  const content = contentMatch[1];
  
  // Parse content: #HH:MM:SS,MM-DD-YY|EEZZZAAA or similar variations
  // #timestamp|eventcode+account
  
  // Extract timestamp (after #)
  const timestampMatch = content.match(/#([^|]+)/);
  if (timestampMatch) {
    result.messageTimestamp = timestampMatch[1];
  }
  
  // Extract event code and account (after |)
  const eventMatch = content.match(/\|([A-Z]{2})(\d*)/);
  if (eventMatch) {
    result.eventCode = eventMatch[1];
    result.eventDescription = EVENT_CODES[result.eventCode] || "Unknown Event";
    
    // Account number (remaining digits after event code)
    const remainingContent = content.substring(content.indexOf("|") + 3);
    const accountMatch = remainingContent.match(/(\d+)/);
    if (accountMatch) {
      result.accountNumber = accountMatch[1];
    }
  }
  
  // Extract zone/partition if present
  const zoneMatch = content.match(/\|[A-Z]{2}(\d{3})/);
  if (zoneMatch) {
    result.zone = zoneMatch[1];
  }
  
  // Extract checksum (after ])
  const checksumMatch = message.match(/\]([A-F0-9]+)$/);
  if (checksumMatch) {
    result.checksum = checksumMatch[1];
  }
  
  return result;
}

/**
 * Validate a SIA message format
 * @param message Raw SIA message string
 * @returns true if valid, false otherwise
 */
export function validateSIAMessage(message: string): boolean {
  try {
    parseSIAMessage(message);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create an ACK (acknowledgment) response for a SIA message
 * @param receiver Receiver ID (e.g., "R1111")
 * @param sequenceNumber Sequence number from original message
 * @returns ACK message string
 */
export function createACK(receiver: string, sequenceNumber: string): string {
  return `ACK"${sequenceNumber}${receiver}[]\r\n`;
}
