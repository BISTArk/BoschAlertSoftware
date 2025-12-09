/**
 * SIA DC-09 Contact ID Message Parser
 * 
 * Message Format: [Customer Account] [Event Qualifier] [Event Code] [Partition] [Zone ID]
 * Example: "1234 E 123 01 123"
 * 
 * Components:
 * 1. Customer Account Number - Identifies the subscriber/customer
 * 2. Event Qualifier - E = New Event, R = Restore
 * 3. Event Code - 3-digit code (300-789) referring to Contact ID event codes
 * 4. Partition Number - 00 to FF (2 Hex digits), 00 for non-partitioned panels
 * 5. Zone ID - 001 to 999 (reporting alarm) or user number, 000 for system status messages
 */

import { getEventByCode, getEventPriority, isSystemStatusMessage } from "./contactIdEventCodes";

export interface ParsedContactIdMessage {
  customerAccount: string;
  eventQualifier: "E" | "R"; // E = New Event, R = Restore
  contactIdEventCode: string;
  partitionNumber: string;
  zoneId: string;
  eventCategory?: string;
  eventType?: string;
  eventDescription?: string;
  priority?: "critical" | "high" | "medium" | "low";
  isSystemStatus: boolean;
  isRestore: boolean;
}

/**
 * Parse Contact ID message format
 * Format: "1234 E 123 01 123"
 */
export function parseContactIdMessage(message: string): ParsedContactIdMessage | null {
  // Remove extra whitespace and split by spaces
  const parts = message.trim().split(/\s+/);

  // Validate we have exactly 5 parts
  if (parts.length !== 5) {
    console.error(`Invalid Contact ID message format. Expected 5 parts, got ${parts.length}:`, message);
    return null;
  }

  const [customerAccount, eventQualifier, contactIdEventCode, partitionNumber, zoneId] = parts;

  // Validate event qualifier
  if (eventQualifier !== "E" && eventQualifier !== "R") {
    console.error(`Invalid event qualifier: ${eventQualifier}. Expected 'E' or 'R'`);
    return null;
  }

  // Validate event code is 3 digits
  if (!/^\d{3}$/.test(contactIdEventCode)) {
    console.error(`Invalid event code: ${contactIdEventCode}. Expected 3 digits`);
    return null;
  }

  // Validate partition number is 2 hex digits
  if (!/^[0-9A-Fa-f]{2}$/.test(partitionNumber)) {
    console.error(`Invalid partition number: ${partitionNumber}. Expected 2 hex digits`);
    return null;
  }

  // Validate zone ID is 3 digits
  if (!/^\d{3}$/.test(zoneId)) {
    console.error(`Invalid zone ID: ${zoneId}. Expected 3 digits`);
    return null;
  }

  // Get event details from mapping
  const eventDetails = getEventByCode(contactIdEventCode);
  const priority = getEventPriority(contactIdEventCode);
  const isSystemStatus = isSystemStatusMessage(contactIdEventCode);
  const isRestore = eventQualifier === "R";

  return {
    customerAccount,
    eventQualifier: eventQualifier as "E" | "R",
    contactIdEventCode,
    partitionNumber,
    zoneId,
    eventCategory: eventDetails?.category,
    eventType: eventDetails?.eventType,
    eventDescription: eventDetails?.description,
    priority,
    isSystemStatus,
    isRestore,
  };
}

/**
 * Parse legacy SIA DC-09 format (for backwards compatibility)
 * This handles the old format if needed
 */
export function parseLegacySiaMessage(message: string): {
  accountNumber?: string;
  eventCode?: string;
  zone?: string;
} | null {
  // Simple regex to extract basic info from old format
  // Adjust this based on your old message format
  const match = message.match(/Ri(\d+)\[#([A-Z]{2})\|.*?Nri(\d+)/);
  
  if (!match) {
    return null;
  }

  return {
    accountNumber: match[1],
    eventCode: match[2],
    zone: match[3],
  };
}

/**
 * Validate if a message is in the new Contact ID format
 */
export function isContactIdFormat(message: string): boolean {
  const parts = message.trim().split(/\s+/);
  
  // Check if it has 5 parts
  if (parts.length !== 5) {
    return false;
  }

  const [, eventQualifier, eventCode, partition, zoneId] = parts;

  // Check format of each component
  return (
    (eventQualifier === "E" || eventQualifier === "R") &&
    /^\d{3}$/.test(eventCode) &&
    /^[0-9A-Fa-f]{2}$/.test(partition) &&
    /^\d{3}$/.test(zoneId)
  );
}

/**
 * Format zone ID for display (removes leading zeros)
 */
export function formatZoneId(zoneId: string): string {
  if (zoneId === "000") {
    return "System";
  }
  return parseInt(zoneId, 10).toString();
}

/**
 * Format partition number for display
 */
export function formatPartition(partitionNumber: string): string {
  if (partitionNumber === "00") {
    return "Main";
  }
  return `Partition ${parseInt(partitionNumber, 16)}`;
}

/**
 * Generate a human-readable alert message
 */
export function generateAlertMessage(parsed: ParsedContactIdMessage): string {
  const zoneDisplay = formatZoneId(parsed.zoneId);
  const qualifier = parsed.isRestore ? "Restored" : "New";
  const description = parsed.eventDescription || `Event ${parsed.contactIdEventCode}`;
  
  if (parsed.isSystemStatus) {
    return `${qualifier}: ${description}`;
  }
  
  return `${qualifier}: ${description} - Zone ${zoneDisplay}`;
}
