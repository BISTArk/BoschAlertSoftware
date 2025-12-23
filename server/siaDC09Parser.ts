/**
 * SIA DC-09 Protocol Parser
 * 
 * Parses messages in SIA-DC-09 format from Bosch security panels
 * Format: [#AccountNumber|ReceiverId/EventCode/AreaInfo]
 * 
 * Examples:
 * - [#3333|Nri01/BA0008/APB] - Burglary Alarm at zone 8
 * - [#3333|Nri01/id0001/BC/AUser 1] - User 1 access control
 * - [#3333|NCW] - Network Communication Warning
 */

export interface SiaDC09Message {
  raw: string;
  accountNumber: string;
  receiverId?: string;
  areaNumber?: string; // Extracted from receiverId (e.g., "Nri01" -> "01")
  eventCode: string;
  eventQualifier?: string; // E, R, A, etc.
  zoneNumber?: string;
  userName?: string;
  areaInfo?: string;
  eventDescription: string;
  eventCategory: string;
  priority: "critical" | "high" | "medium" | "low";
  timestamp: number;
}

// SIA DC-09 Event Code Mappings
const EVENT_CODE_MAP: Record<string, {
  description: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
}> = {
  // Burglary Events
  "BA": { description: "Burglary Alarm", category: "Burglary", priority: "critical" },
  "BH": { description: "Burglary Hold-up", category: "Burglary", priority: "critical" },
  "BR": { description: "Burglary Restore", category: "Burglary", priority: "low" },
  "BT": { description: "Burglary Trouble", category: "Burglary", priority: "high" },
  
  // Fire Events
  "FA": { description: "Fire Alarm", category: "Fire", priority: "critical" },
  "FH": { description: "Fire Hold-up", category: "Fire", priority: "critical" },
  "FR": { description: "Fire Restore", category: "Fire", priority: "low" },
  "FT": { description: "Fire Trouble", category: "Fire", priority: "high" },
  
  // Medical Events
  "MA": { description: "Medical Alarm", category: "Medical", priority: "critical" },
  "MH": { description: "Medical Hold-up", category: "Medical", priority: "critical" },
  
  // Panic Events
  "PA": { description: "Panic Alarm", category: "Panic", priority: "critical" },
  "PH": { description: "Panic Hold-up", category: "Panic", priority: "critical" },
  
  // Access Control
  "BC": { description: "Access Granted", category: "Access Control", priority: "low" },
  "BD": { description: "Access Denied", category: "Access Control", priority: "medium" },
  "BF": { description: "Forced Access", category: "Access Control", priority: "high" },
  
  // Supervisory/Trouble
  "TA": { description: "Tamper Alarm", category: "Trouble", priority: "high" },
  "TR": { description: "Trouble Restore", category: "Trouble", priority: "low" },
  "TT": { description: "Test Transmission", category: "System", priority: "low" },
  
  // System Status
  "CL": { description: "System Closed/Armed", category: "System", priority: "low" },
  "OP": { description: "System Opened/Disarmed", category: "System", priority: "low" },
  "NL": { description: "Line Trouble", category: "Communication", priority: "high" },
  
  // Communication
  "NCW": { description: "Network Communication Warning", category: "Communication", priority: "medium" },
  "YC": { description: "Communication OK", category: "Communication", priority: "low" },
  
  // Zone Events
  "XW": { description: "Zone Warning", category: "Zone", priority: "medium" },
  "XR": { description: "Zone Restore", category: "Zone", priority: "low" },
};

/**
 * Parse SIA DC-09 message
 * Format: [#AccountNumber|ReceiverId/EventCode/AreaInfo]
 */
export function parseSiaDC09(message: string): SiaDC09Message | null {
  try {
    const timestamp = Date.now();
    
    // Extract content between brackets
    const bracketMatch = message.match(/\[([^\]]+)\]/);
    if (!bracketMatch) {
      console.error("No brackets found in message:", message);
      return null;
    }
    
    const content = bracketMatch[1];
    
    // Split by pipe to get account and rest
    const parts = content.split("|");
    if (parts.length < 1) {
      console.error("Invalid message format:", content);
      return null;
    }
    
    // Extract account number (remove # prefix)
    const accountNumber = parts[0].replace("#", "").trim();
    
    // If only account and event code (like [#3333|NCW])
    if (parts.length === 2 && parts[1] && !parts[1].includes("/")) {
      const eventCode = parts[1].trim();
      const eventInfo = EVENT_CODE_MAP[eventCode] || {
        description: `Unknown Event (${eventCode})`,
        category: "System",
        priority: "medium" as const
      };
      
      return {
        raw: message,
        accountNumber,
        eventCode,
        eventDescription: eventInfo.description,
        eventCategory: eventInfo.category,
        priority: eventInfo.priority,
        timestamp
      };
    }
    
    // If only account number (incomplete message)
    if (parts.length === 1 || !parts[1]) {
      return {
        raw: message,
        accountNumber,
        eventCode: "Unknown",
        eventDescription: "Incomplete Message",
        eventCategory: "System",
        priority: "low" as const,
        timestamp
      };
    }
    
    // Parse the rest: ReceiverId/EventCode/AreaInfo
    const restParts = parts[1].split("/");
    const receiverId = restParts[0]?.trim();
    
    // Extract area/partition number from receiverId (e.g., "Nri01" -> "01")
    let areaNumber = "";
    if (receiverId) {
      const areaMatch = receiverId.match(/(\d{2})$/); // Extract last 2 digits
      if (areaMatch) {
        areaNumber = areaMatch[1];
      }
    }
    
    // Extract event code (first 2-3 characters after first /)
    let eventCode = "";
    let zoneNumber = "";
    let eventQualifier = "";
    let userName = "";
    let areaInfo = "";
    
    if (restParts.length > 1) {
      const eventPart = restParts[1];
      
      // Check for user ID format (id0001)
      if (eventPart.startsWith("id")) {
        eventCode = restParts[2] || "BC"; // Usually BC for access control
        
        // Extract zone number from id0001 -> "0001"
        const idMatch = eventPart.match(/^id(\d{4})/);
        if (idMatch) {
          zoneNumber = idMatch[1]; // Extract "0001" from "id0001"
        }
        
        userName = eventPart; // Keep full id for display
        areaInfo = restParts[3] || "";
        
        // Extract user name from area info (e.g., "AUser 1")
        if (areaInfo.startsWith("A")) {
          userName = areaInfo.substring(1);
        }
      } else {
        // Standard format: EventCode + Zone number
        // e.g., "BA0008" -> eventCode="BA", zone="0008"
        const match = eventPart.match(/^([A-Z]{2})(\d{4})?/);
        if (match) {
          eventCode = match[1];
          zoneNumber = match[2] || "";
        } else {
          eventCode = eventPart.substring(0, 2);
          zoneNumber = eventPart.substring(2);
        }
        
        // Area info (like "APB" or "APoint 5")
        areaInfo = restParts[2] || "";
        if (areaInfo.startsWith("A")) {
          areaInfo = areaInfo.substring(1);
        }
      }
    }
    
    // Get event info from mapping
    const eventInfo = EVENT_CODE_MAP[eventCode] || {
      description: `Unknown Event (${eventCode})`,
      category: "Unknown",
      priority: "medium" as const
    };
    
    // Build description with context
    let description = eventInfo.description;
    if (zoneNumber) {
      description += ` - Zone ${parseInt(zoneNumber, 10)}`;
    }
    if (userName) {
      description += ` - ${userName}`;
    }
    if (areaInfo && areaInfo !== "PB") {
      description += ` (${areaInfo})`;
    }
    
    return {
      raw: message,
      accountNumber,
      receiverId,
      areaNumber,
      eventCode,
      eventQualifier,
      zoneNumber,
      userName,
      areaInfo,
      eventDescription: description,
      eventCategory: eventInfo.category,
      priority: eventInfo.priority,
      timestamp
    };
    
  } catch (error) {
    console.error("Error parsing SIA DC-09 message:", error);
    return null;
  }
}

/**
 * Validate SIA DC-09 message format
 */
export function isValidSiaDC09(message: string): boolean {
  // Basic validation: must contain brackets and account number
  return /\[#?\w+/.test(message);
}

/**
 * Generate human-readable summary from parsed message
 */
export function generateSummary(parsed: SiaDC09Message): string {
  const time = new Date(parsed.timestamp).toLocaleTimeString();
  return `[${time}] Account ${parsed.accountNumber}: ${parsed.eventDescription}`;
}
