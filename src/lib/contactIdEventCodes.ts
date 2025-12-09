/**
 * Contact ID Event Code Mapping
 * Based on SIA DC-09 Protocol Reference
 * 
 * Message Format: [Customer Account] [Event Qualifier] [Event Code] [Partition] [Zone ID]
 * Example: 1234 E 123 01 123
 * 
 * Event Qualifier: E = New Event, R = Restore
 * Partition: 00 to FF (hex), 00 for non-partitioned panels
 * Zone ID: 000-999 (000 for system status messages)
 */

export interface ContactIdEvent {
  code: string;
  category: string;
  eventType: string;
  description: string;
  restoreApplicable: boolean;
}

export const CONTACT_ID_EVENTS: Record<string, ContactIdEvent> = {
  // System Troubles (300-313)
  "300": { code: "300", category: "System Troubles", eventType: "Trouble", description: "System Trouble", restoreApplicable: true },
  "301": { code: "301", category: "System Troubles", eventType: "Trouble", description: "AC Loss", restoreApplicable: true },
  "302": { code: "302", category: "System Troubles", eventType: "Trouble", description: "Low System Battery", restoreApplicable: true },
  "303": { code: "303", category: "System Troubles", eventType: "Trouble", description: "RAM Checksum Bad", restoreApplicable: false },
  "304": { code: "304", category: "System Troubles", eventType: "Trouble", description: "ROM Checksum Bad", restoreApplicable: false },
  "305": { code: "305", category: "System Troubles", eventType: "Trouble", description: "System Reset", restoreApplicable: false },
  "306": { code: "306", category: "System Troubles", eventType: "Trouble", description: "Panel Programming Changed", restoreApplicable: false },
  "307": { code: "307", category: "System Troubles", eventType: "Trouble", description: "Self-Test Failure", restoreApplicable: true },
  "308": { code: "308", category: "System Troubles", eventType: "Trouble", description: "System Shutdown", restoreApplicable: true },
  "309": { code: "309", category: "System Troubles", eventType: "Trouble", description: "Battery Test Failure", restoreApplicable: true },
  "310": { code: "310", category: "System Troubles", eventType: "Trouble", description: "Ground Fault", restoreApplicable: true },
  "311": { code: "311", category: "System Troubles", eventType: "Trouble", description: "Battery Missing", restoreApplicable: true },
  "312": { code: "312", category: "System Troubles", eventType: "Trouble", description: "Power Supply Overcurrent", restoreApplicable: true },
  "313": { code: "313", category: "System Troubles", eventType: "Status", description: "Engineer Reset", restoreApplicable: false },

  // Sounder/Relay Troubles (320-327)
  "320": { code: "320", category: "Sounder/Relay Troubles", eventType: "Trouble", description: "Sounder/Relay Trouble", restoreApplicable: true },
  "321": { code: "321", category: "Sounder/Relay Troubles", eventType: "Trouble", description: "Bell/Siren #1", restoreApplicable: true },
  "322": { code: "322", category: "Sounder/Relay Troubles", eventType: "Trouble", description: "Bell/Siren #2", restoreApplicable: true },
  "323": { code: "323", category: "Sounder/Relay Troubles", eventType: "Trouble", description: "Alarm Relay", restoreApplicable: true },
  "324": { code: "324", category: "Sounder/Relay Troubles", eventType: "Trouble", description: "Trouble Relay", restoreApplicable: true },
  "325": { code: "325", category: "Sounder/Relay Troubles", eventType: "Trouble", description: "Reversing Relay", restoreApplicable: true },
  "326": { code: "326", category: "Sounder/Relay Troubles", eventType: "Trouble", description: "Notification Appliance Circuit #3", restoreApplicable: true },
  "327": { code: "327", category: "Sounder/Relay Troubles", eventType: "Trouble", description: "Notification Appliance Circuit #4", restoreApplicable: true },

  // System Peripheral Troubles (330-344)
  "330": { code: "330", category: "System Peripheral Troubles", eventType: "Trouble", description: "System Peripheral Trouble", restoreApplicable: true },
  "331": { code: "331", category: "System Peripheral Troubles", eventType: "Trouble", description: "Polling Loop Open", restoreApplicable: true },
  "332": { code: "332", category: "System Peripheral Troubles", eventType: "Trouble", description: "Polling Loop Short", restoreApplicable: true },
  "333": { code: "333", category: "System Peripheral Troubles", eventType: "Trouble", description: "Expansion Module Failure", restoreApplicable: true },
  "334": { code: "334", category: "System Peripheral Troubles", eventType: "Trouble", description: "Repeater Failure", restoreApplicable: true },
  "335": { code: "335", category: "System Peripheral Troubles", eventType: "Trouble", description: "Local Printer Paper Out", restoreApplicable: true },
  "336": { code: "336", category: "System Peripheral Troubles", eventType: "Trouble", description: "Local Printer Failure", restoreApplicable: true },
  "337": { code: "337", category: "System Peripheral Troubles", eventType: "Trouble", description: "Expansion Module DC Loss", restoreApplicable: true },
  "338": { code: "338", category: "System Peripheral Troubles", eventType: "Trouble", description: "Expansion Module Low Battery", restoreApplicable: true },
  "339": { code: "339", category: "System Peripheral Troubles", eventType: "Trouble", description: "Expansion Module Reset", restoreApplicable: true },
  "341": { code: "341", category: "System Peripheral Troubles", eventType: "Trouble", description: "Expansion Module Tamper", restoreApplicable: true },
  "342": { code: "342", category: "System Peripheral Troubles", eventType: "Trouble", description: "Expansion Module AC Loss", restoreApplicable: true },
  "343": { code: "343", category: "System Peripheral Troubles", eventType: "Trouble", description: "Expansion Module Self Test Fail", restoreApplicable: true },
  "344": { code: "344", category: "System Peripheral Troubles", eventType: "Trouble", description: "RF Receiver Jam Detect", restoreApplicable: true },

  // Communication Troubles (350-357)
  "350": { code: "350", category: "Communication Troubles", eventType: "Trouble", description: "Communication Failure", restoreApplicable: true },
  "351": { code: "351", category: "Communication Troubles", eventType: "Trouble", description: "Phone Line #1 Fault", restoreApplicable: true },
  "352": { code: "352", category: "Communication Troubles", eventType: "Trouble", description: "Phone Line #2 Fault", restoreApplicable: true },
  "353": { code: "353", category: "Communication Troubles", eventType: "Trouble", description: "Long Range Radio Transmitter Fault", restoreApplicable: true },
  "354": { code: "354", category: "Communication Troubles", eventType: "Trouble", description: "Failure to Communicate", restoreApplicable: true },
  "355": { code: "355", category: "Communication Troubles", eventType: "Trouble", description: "Loss of Radio Supervision", restoreApplicable: true },
  "356": { code: "356", category: "Communication Troubles", eventType: "Trouble", description: "Loss of Central Polling", restoreApplicable: true },
  "357": { code: "357", category: "Communication Troubles", eventType: "Trouble", description: "Radio Transmitter VSWR", restoreApplicable: true },

  // Protection Loop (370-376)
  "370": { code: "370", category: "Protection Loop", eventType: "Trouble", description: "Protection Loop Trouble", restoreApplicable: true },
  "371": { code: "371", category: "Protection Loop", eventType: "Trouble", description: "Protection Loop Open", restoreApplicable: true },
  "372": { code: "372", category: "Protection Loop", eventType: "Trouble", description: "Protection Loop Short", restoreApplicable: true },
  "373": { code: "373", category: "Protection Loop", eventType: "Trouble", description: "Fire Loop Trouble", restoreApplicable: true },
  "374": { code: "374", category: "Protection Loop", eventType: "Alarm", description: "Exit Error", restoreApplicable: true },
  "375": { code: "375", category: "Protection Loop", eventType: "Trouble", description: "Panic Zone Trouble", restoreApplicable: true },
  "376": { code: "376", category: "Protection Loop", eventType: "Trouble", description: "Hold-Up Zone Trouble", restoreApplicable: true },

  // Sensor (380-393)
  "380": { code: "380", category: "Sensor", eventType: "Trouble", description: "Sensor Trouble (Global)", restoreApplicable: true },
  "381": { code: "381", category: "Sensor", eventType: "Trouble", description: "Loss of RF Supervision", restoreApplicable: true },
  "382": { code: "382", category: "Sensor", eventType: "Trouble", description: "Loss of RPM Supervision", restoreApplicable: true },
  "383": { code: "383", category: "Sensor", eventType: "Trouble", description: "Sensor Tamper", restoreApplicable: true },
  "384": { code: "384", category: "Sensor", eventType: "Trouble", description: "RF Sensor Low Battery", restoreApplicable: true },
  "385": { code: "385", category: "Sensor", eventType: "Trouble", description: "Smoke High Sensitivity", restoreApplicable: true },
  "386": { code: "386", category: "Sensor", eventType: "Trouble", description: "Smoke Low Sensitivity", restoreApplicable: true },
  "387": { code: "387", category: "Sensor", eventType: "Trouble", description: "Intrusion High Sensitivity", restoreApplicable: true },
  "388": { code: "388", category: "Sensor", eventType: "Trouble", description: "Intrusion Low Sensitivity", restoreApplicable: true },
  "389": { code: "389", category: "Sensor", eventType: "Trouble", description: "Detector Self Test Fail", restoreApplicable: true },
  "391": { code: "391", category: "Sensor", eventType: "Trouble", description: "Sensor Watch Failure", restoreApplicable: true },
  "392": { code: "392", category: "Sensor", eventType: "Trouble", description: "Drift Compensation Error", restoreApplicable: true },
  "393": { code: "393", category: "Sensor", eventType: "Trouble", description: "Maintenance Alert", restoreApplicable: true },

  // Open/Close (400-465)
  "400": { code: "400", category: "Open/Close", eventType: "Opening/Closing", description: "Open/Close", restoreApplicable: true },
  "401": { code: "401", category: "Open/Close", eventType: "Opening/Closing", description: "Open/Close by User", restoreApplicable: true },
  "402": { code: "402", category: "Open/Close", eventType: "Closing", description: "Group Close", restoreApplicable: true },
  "403": { code: "403", category: "Open/Close", eventType: "Opening/Closing", description: "Automatic Open/Close", restoreApplicable: true },
  "404": { code: "404", category: "Open/Close", eventType: "Opening/Closing", description: "Late to Open/Close", restoreApplicable: true },
  "405": { code: "405", category: "Open/Close", eventType: "Event", description: "Deferred Open/Close", restoreApplicable: false },
  "406": { code: "406", category: "Open/Close", eventType: "Opening", description: "Cancel", restoreApplicable: true },
  "407": { code: "407", category: "Open/Close", eventType: "Opening/Closing", description: "Remote Arm/Disarm", restoreApplicable: true },
  "408": { code: "408", category: "Open/Close", eventType: "Closing", description: "Quick Arm", restoreApplicable: false },
  "409": { code: "409", category: "Open/Close", eventType: "Opening/Closing", description: "Keyswitch Open/Close", restoreApplicable: true },
  "441": { code: "441", category: "Open/Close", eventType: "Opening/Closing", description: "Armed Stay", restoreApplicable: true },
  "442": { code: "442", category: "Open/Close", eventType: "Opening/Closing", description: "Keyswitch Armed Stay", restoreApplicable: true },
  "450": { code: "450", category: "Open/Close", eventType: "Opening/Closing", description: "Exception Open/Close", restoreApplicable: true },
  "451": { code: "451", category: "Open/Close", eventType: "Opening/Closing", description: "Early Open/Close", restoreApplicable: true },
  "452": { code: "452", category: "Open/Close", eventType: "Opening/Closing", description: "Late Open/Close", restoreApplicable: true },
  "453": { code: "453", category: "Open/Close", eventType: "Trouble", description: "Failed to Open", restoreApplicable: false },
  "454": { code: "454", category: "Open/Close", eventType: "Trouble", description: "Failed to Close", restoreApplicable: false },
  "455": { code: "455", category: "Open/Close", eventType: "Trouble", description: "Auto-Arm Failed", restoreApplicable: false },
  "456": { code: "456", category: "Open/Close", eventType: "Closing", description: "Partial Arm", restoreApplicable: true },
  "457": { code: "457", category: "Open/Close", eventType: "Closing", description: "Exit Error", restoreApplicable: true },
  "458": { code: "458", category: "Open/Close", eventType: "Opening", description: "User on Premises", restoreApplicable: true },
  "459": { code: "459", category: "Open/Close", eventType: "Trouble", description: "Recent Close", restoreApplicable: false },
  "461": { code: "461", category: "Open/Close", eventType: "Access", description: "Wrong Code Entry", restoreApplicable: false },
  "462": { code: "462", category: "Open/Close", eventType: "Access", description: "Legal Code Entry", restoreApplicable: false },
  "463": { code: "463", category: "Open/Close", eventType: "Status", description: "Re-arm After Alarm", restoreApplicable: false },
  "464": { code: "464", category: "Open/Close", eventType: "Status", description: "Auto Arm Time Extended", restoreApplicable: false },
  "465": { code: "465", category: "Open/Close", eventType: "Status", description: "Panic Alarm Reset", restoreApplicable: false },

  // Remote Access (411-416)
  "411": { code: "411", category: "Remote Access", eventType: "Remote", description: "Callback Requested", restoreApplicable: false },
  "412": { code: "412", category: "Remote Access", eventType: "Remote", description: "Successful Download/Access", restoreApplicable: false },
  "413": { code: "413", category: "Remote Access", eventType: "Remote", description: "Unsuccessful Access", restoreApplicable: false },
  "414": { code: "414", category: "Remote Access", eventType: "Remote", description: "System Shutdown", restoreApplicable: true },
  "415": { code: "415", category: "Remote Access", eventType: "Remote", description: "Dialer Shutdown", restoreApplicable: true },
  "416": { code: "416", category: "Remote Access", eventType: "Remote", description: "Successful Upload", restoreApplicable: false },

  // Access Control (421-434)
  "421": { code: "421", category: "Access Control", eventType: "Access", description: "Access Denied", restoreApplicable: false },
  "422": { code: "422", category: "Access Control", eventType: "Access", description: "Access Report by User", restoreApplicable: false },
  "423": { code: "423", category: "Access Control", eventType: "Panic", description: "Forced Access", restoreApplicable: true },
  "424": { code: "424", category: "Access Control", eventType: "Access", description: "Egress Denied", restoreApplicable: false },
  "425": { code: "425", category: "Access Control", eventType: "Access", description: "Egress Granted", restoreApplicable: false },
  "426": { code: "426", category: "Access Control", eventType: "Access", description: "Access Door Propped Open", restoreApplicable: true },
  "427": { code: "427", category: "Access Control", eventType: "Access", description: "Access Point DSM Trouble", restoreApplicable: true },
  "428": { code: "428", category: "Access Control", eventType: "Access", description: "Access Point RTE Trouble", restoreApplicable: true },
  "429": { code: "429", category: "Access Control", eventType: "Access", description: "Access Program Mode Entry", restoreApplicable: false },
  "430": { code: "430", category: "Access Control", eventType: "Access", description: "Access Program Mode Exit", restoreApplicable: false },
  "431": { code: "431", category: "Access Control", eventType: "Access", description: "Access Threat Level Change", restoreApplicable: true },
  "432": { code: "432", category: "Access Control", eventType: "Access", description: "Access Relay/Trigger Fail", restoreApplicable: true },
  "433": { code: "433", category: "Access Control", eventType: "Access", description: "Access RTE Shunt", restoreApplicable: true },
  "434": { code: "434", category: "Access Control", eventType: "Access", description: "Access DSM Shunt", restoreApplicable: true },

  // System Disables (501)
  "501": { code: "501", category: "System Disables", eventType: "Disable", description: "Access Reader Disable", restoreApplicable: true },

  // Sounder/Relay Disables (520-527)
  "520": { code: "520", category: "Sounder/Relay Disables", eventType: "Disable", description: "Sounder/Relay Disable", restoreApplicable: true },
  "521": { code: "521", category: "Sounder/Relay Disables", eventType: "Disable", description: "Bell/Siren #1 Disable", restoreApplicable: true },
  "522": { code: "522", category: "Sounder/Relay Disables", eventType: "Disable", description: "Bell/Siren #2 Disable", restoreApplicable: true },
  "523": { code: "523", category: "Sounder/Relay Disables", eventType: "Disable", description: "Alarm Relay Disable", restoreApplicable: true },
  "524": { code: "524", category: "Sounder/Relay Disables", eventType: "Disable", description: "Trouble Relay Disable", restoreApplicable: true },
  "525": { code: "525", category: "Sounder/Relay Disables", eventType: "Disable", description: "Reversing Relay Disable", restoreApplicable: true },
  "526": { code: "526", category: "Sounder/Relay Disables", eventType: "Disable", description: "Notification Appliance Circuit #3 Disable", restoreApplicable: true },
  "527": { code: "527", category: "Sounder/Relay Disables", eventType: "Disable", description: "Notification Appliance Circuit #4 Disable", restoreApplicable: true },

  // System Peripheral Disables (531-532)
  "531": { code: "531", category: "System Peripheral Disables", eventType: "Super", description: "Module Added", restoreApplicable: false },
  "532": { code: "532", category: "System Peripheral Disables", eventType: "Super", description: "Module Removed", restoreApplicable: false },

  // Communication Disables (551-553)
  "551": { code: "551", category: "Communication Disables", eventType: "Disable", description: "Dialer Disabled", restoreApplicable: true },
  "552": { code: "552", category: "Communication Disables", eventType: "Disable", description: "Radio Transmitter Disabled", restoreApplicable: true },
  "553": { code: "553", category: "Communication Disables", eventType: "Disable", description: "Remote Upload/Download Disable", restoreApplicable: true },

  // Bypasses (570-577)
  "570": { code: "570", category: "Bypasses", eventType: "Bypass", description: "Zone/Sensor Bypass", restoreApplicable: true },
  "571": { code: "571", category: "Bypasses", eventType: "Bypass", description: "Fire Bypass", restoreApplicable: true },
  "572": { code: "572", category: "Bypasses", eventType: "Bypass", description: "24 Hour Zone Bypass", restoreApplicable: true },
  "573": { code: "573", category: "Bypasses", eventType: "Bypass", description: "Burglary Bypass", restoreApplicable: true },
  "574": { code: "574", category: "Bypasses", eventType: "Bypass", description: "Group Bypass", restoreApplicable: true },
  "575": { code: "575", category: "Bypasses", eventType: "Bypass", description: "Swinger Bypass", restoreApplicable: true },
  "576": { code: "576", category: "Bypasses", eventType: "Access", description: "Access Zone Shunt", restoreApplicable: true },
  "577": { code: "577", category: "Bypasses", eventType: "Access", description: "Access Point Bypass", restoreApplicable: true },

  // Test/Misc. (601-616)
  "601": { code: "601", category: "Test/Misc", eventType: "Test", description: "Manual Test", restoreApplicable: false },
  "602": { code: "602", category: "Test/Misc", eventType: "Test", description: "Periodic Test", restoreApplicable: false },
  "603": { code: "603", category: "Test/Misc", eventType: "Test", description: "Periodic RF Transmission", restoreApplicable: false },
  "604": { code: "604", category: "Test/Misc", eventType: "Test", description: "Fire Test", restoreApplicable: true },
  "605": { code: "605", category: "Test/Misc", eventType: "Test", description: "Status Report to Follow", restoreApplicable: true },
  "606": { code: "606", category: "Test/Misc", eventType: "Listen", description: "Listen-In to Follow", restoreApplicable: false },
  "607": { code: "607", category: "Test/Misc", eventType: "Test", description: "Walk-Test Mode", restoreApplicable: true },
  "608": { code: "608", category: "Test/Misc", eventType: "Test", description: "System Trouble Present", restoreApplicable: false },
  "609": { code: "609", category: "Test/Misc", eventType: "Listen", description: "Video Transmitter Active", restoreApplicable: false },
  "611": { code: "611", category: "Test/Misc", eventType: "Test", description: "Point Tested OK", restoreApplicable: false },
  "612": { code: "612", category: "Test/Misc", eventType: "Test", description: "Point Not Tested", restoreApplicable: false },
  "613": { code: "613", category: "Test/Misc", eventType: "Test", description: "Intrusion Zone Walk Tested", restoreApplicable: false },
  "614": { code: "614", category: "Test/Misc", eventType: "Test", description: "Fire Zone Walk Tested", restoreApplicable: false },
  "615": { code: "615", category: "Test/Misc", eventType: "Test", description: "Panic Zone Walk Tested", restoreApplicable: false },
  "616": { code: "616", category: "Test/Misc", eventType: "Trouble", description: "Service Request", restoreApplicable: true },

  // Event Log (621-628)
  "621": { code: "621", category: "Event Log", eventType: "Trouble", description: "Event Log Reset", restoreApplicable: false },
  "622": { code: "622", category: "Event Log", eventType: "Trouble", description: "Event Log 50% Full", restoreApplicable: false },
  "623": { code: "623", category: "Event Log", eventType: "Trouble", description: "Event Log 90% Full", restoreApplicable: false },
  "624": { code: "624", category: "Event Log", eventType: "Trouble", description: "Event Log Overflow", restoreApplicable: false },
  "625": { code: "625", category: "Event Log", eventType: "Trouble", description: "Time/Date Reset", restoreApplicable: false },
  "626": { code: "626", category: "Event Log", eventType: "Trouble", description: "Time/Date Inaccurate", restoreApplicable: true },
  "627": { code: "627", category: "Event Log", eventType: "Trouble", description: "Program Mode Entry", restoreApplicable: false },
  "628": { code: "628", category: "Event Log", eventType: "Trouble", description: "Program Mode Exit", restoreApplicable: false },

  // Scheduling (630-632)
  "630": { code: "630", category: "Scheduling", eventType: "Trouble", description: "Schedule Change", restoreApplicable: false },
  "631": { code: "631", category: "Scheduling", eventType: "Trouble", description: "Exception Schedule Change", restoreApplicable: false },
  "632": { code: "632", category: "Scheduling", eventType: "Trouble", description: "Access Schedule Changes", restoreApplicable: false },

  // Personnel Monitoring (641-642)
  "641": { code: "641", category: "Personnel Monitoring", eventType: "Trouble", description: "Senior Watch Trouble", restoreApplicable: true },
  "642": { code: "642", category: "Personnel Monitoring", eventType: "Status", description: "Latch-key Supervision", restoreApplicable: false },
};

/**
 * Get event details by code
 */
export function getEventByCode(code: string): ContactIdEvent | null {
  return CONTACT_ID_EVENTS[code] || null;
}

/**
 * Get priority level based on event code
 */
export function getEventPriority(code: string): "critical" | "high" | "medium" | "low" {
  const event = CONTACT_ID_EVENTS[code];
  if (!event) return "low";

  // Critical: Alarms, Panic, Fire
  if (event.eventType === "Alarm" || event.eventType === "Panic" || event.category === "Protection Loop") {
    return "critical";
  }

  // High: System troubles, Communication issues, Sensor issues
  if (
    event.category === "System Troubles" ||
    event.category === "Communication Troubles" ||
    event.category === "Sensor"
  ) {
    return "high";
  }

  // Medium: Access control, Disables, Bypasses
  if (
    event.category === "Access Control" ||
    event.category.includes("Disables") ||
    event.category === "Bypasses"
  ) {
    return "medium";
  }

  // Low: Test, Open/Close, Status
  return "low";
}

/**
 * Check if event code is a system status message (Zone ID should be 000)
 */
export function isSystemStatusMessage(code: string): boolean {
  const systemStatusCodes = ["301", "302", "303", "304", "305", "306", "307", "308", "309", "310", "311", "312"];
  return systemStatusCodes.includes(code);
}
