/**
 * Security Protocol Parser
 * 
 * Parses messages in SIA DC-09 and Contact ID formats from security panels
 * SIA DC-09 Format: [#AccountNumber|ReceiverId/EventCode/AreaInfo]
 * Contact ID Format: [#AccountNumber|MessageTypeEventCodeAreaPoint]
 * 
 * Examples:
 * SIA: [#3333|Nri01/BA0008/APB] - Burglary Alarm at zone 8
 * Contact ID: [#3333|18113001008] - Burglary Alarm
 */

export interface SiaDC09Message {
  raw: string;
  accountNumber: string;
  receiverId?: string;
  areaNumber?: string; // Extracted from receiverId (SIA) or area code (Contact ID)
  eventCode: string;
  eventQualifier?: string; // E, R, A, etc. (SIA) or 1,3 (Contact ID)
  zoneNumber?: string;
  userName?: string;
  areaInfo?: string;
  eventDescription: string;
  eventCategory: string;
  priority: "critical" | "high" | "medium" | "low";
  timestamp: number;
  isAlert?: boolean; // Indicates if this event should trigger an alert
}

/**
 * Determines if an event should be classified as an alert
 * Not all events are alerts - this function filters which events require alerting
 * 
 * Current conditions:
 * - Contact ID messages starting with "181" are alerts
 * 
 * @param parsed - The parsed SIA DC-09 message
 * @returns true if the event should trigger an alert, false otherwise
 */
export function isAlertEvent(parsed: SiaDC09Message): boolean {
  const rawContent = parsed.raw.match(/\[([^\]]+)\]/)?.[1] || "";
  const parts = rawContent.split("|");
  
  // Check if it's a Contact ID format message
  if (parts.length > 1 && /^\d/.test(parts[1])) {
    const contactIdData = parts[1];
    
    // Contact ID messages starting with "181" are alerts
    if (contactIdData.startsWith("181")) {
      return true;
    }
    
    // Add more Contact ID alert conditions here as needed
    // Example: if (contactIdData.startsWith("182")) { return true; }
  }
  
  // Add SIA DC-09 format alert conditions here as needed
  // Example: if (parsed.eventCode === "BA") { return true; }
  
  // By default, events are not alerts unless they match specific conditions
  return false;
}

// SIA DC-09 and Contact ID Event Code Mappings
const EVENT_CODE_MAP: Record<string, {
  description: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
}> = {
  // SIA DC-09 Events
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

  // Contact ID Events
  // Medical Alarms
  "100": { description: "Medical Emergency - Personal Emergency", category: "Medical", priority: "critical" },
  "101": { description: "Medical Emergency - Pendant Transmitter", category: "Medical", priority: "critical" },
  "102": { description: "Medical Emergency - Fail to Report In", category: "Medical", priority: "critical" },

  // Fire Alarms
  "110": { description: "Fire Alarm", category: "Fire", priority: "critical" },
  "111": { description: "Fire Alarm - Smoke w/Verification", category: "Fire", priority: "critical" },
  "112": { description: "Fire Alarm - Combustion", category: "Fire", priority: "critical" },
  "113": { description: "Fire Alarm - Water Flow", category: "Fire", priority: "critical" },
  "114": { description: "Fire Alarm - Heat Sensor", category: "Fire", priority: "critical" },
  "115": { description: "Fire Alarm - Pull Station", category: "Fire", priority: "critical" },
  "116": { description: "Fire Alarm - Duct Sensor", category: "Fire", priority: "critical" },
  "117": { description: "Fire Alarm - Flame Sensor", category: "Fire", priority: "critical" },
  "118": { description: "Fire Alarm - Near Alarm", category: "Fire", priority: "critical" },

  // Panic Alarms
  "120": { description: "Panic Alarm", category: "Panic", priority: "critical" },
  "121": { description: "Panic Alarm - Duress", category: "Panic", priority: "critical" },
  "122": { description: "Panic Alarm - Silent", category: "Panic", priority: "critical" },
  "123": { description: "Panic Alarm - Audible", category: "Panic", priority: "critical" },
  "124": { description: "Panic Alarm - Duress Access Granted", category: "Panic", priority: "critical" },
  "125": { description: "Panic Alarm - Duress Egress Granted", category: "Panic", priority: "critical" },

  // Burglary Alarms
  "130": { description: "Burglary Alarm", category: "Burglary", priority: "critical" },
  "131": { description: "Burglary Alarm - Perimeter", category: "Burglary", priority: "critical" },
  "132": { description: "Burglary Alarm - Interior", category: "Burglary", priority: "critical" },
  "133": { description: "Burglary Alarm - 24 Hour (Aux)", category: "Burglary", priority: "critical" },
  "134": { description: "Burglary Alarm - Entry/Exit", category: "Burglary", priority: "critical" },
  "135": { description: "Burglary Alarm - Day/Night", category: "Burglary", priority: "critical" },
  "136": { description: "Burglary Alarm - Outdoor", category: "Burglary", priority: "critical" },
  "137": { description: "Burglary Alarm - Tamper", category: "Burglary", priority: "critical" },
  "138": { description: "Burglary Alarm - Near Alarm", category: "Burglary", priority: "critical" },
  "139": { description: "Burglary Alarm - Intrusion Verifier", category: "Burglary", priority: "critical" },

  // General Alarms
  "140": { description: "General Alarm", category: "General", priority: "high" },
  "141": { description: "General Alarm - Polling Loop Open", category: "General", priority: "high" },
  "142": { description: "General Alarm - Polling Loop Short", category: "General", priority: "high" },
  "143": { description: "General Alarm - Expansion Module Failure", category: "General", priority: "high" },
  "144": { description: "General Alarm - Sensor Tamper", category: "General", priority: "high" },
  "145": { description: "General Alarm - Expansion Module Tamper", category: "General", priority: "high" },
  "146": { description: "General Alarm - Silent Burglary", category: "General", priority: "high" },

  // 24 Hour Non-Burglary
  "150": { description: "24 Hour Non-Burglary", category: "24 Hour", priority: "high" },
  "151": { description: "Gas Detected", category: "24 Hour", priority: "high" },
  "152": { description: "Refrigeration", category: "24 Hour", priority: "high" },
  "153": { description: "Loss of Heat", category: "24 Hour", priority: "high" },
  "154": { description: "Water Leakage", category: "24 Hour", priority: "high" },
  "155": { description: "Foil Break", category: "24 Hour", priority: "high" },
  "156": { description: "Day Trouble", category: "24 Hour", priority: "high" },
  "157": { description: "Low Bottled Gas Level", category: "24 Hour", priority: "high" },
  "158": { description: "High Temperature", category: "24 Hour", priority: "high" },
  "159": { description: "Low Temperature", category: "24 Hour", priority: "high" },
  "161": { description: "Loss of Air Flow", category: "24 Hour", priority: "high" },
  "162": { description: "Carbon Monoxide Detected", category: "24 Hour", priority: "high" },
  "163": { description: "Tank Level", category: "24 Hour", priority: "high" },

  // Fire Supervisory
  "200": { description: "Fire Supervisory", category: "Fire Supervisory", priority: "high" },
  "201": { description: "Low Water Pressure", category: "Fire Supervisory", priority: "high" },
  "202": { description: "Low CO2", category: "Fire Supervisory", priority: "high" },
  "203": { description: "Gate Valve Sensor", category: "Fire Supervisory", priority: "high" },
  "204": { description: "Low Water Level", category: "Fire Supervisory", priority: "high" },
  "205": { description: "Pump Activated", category: "Fire Supervisory", priority: "high" },
  "206": { description: "Pump Failure", category: "Fire Supervisory", priority: "high" },

  // System Troubles
  "300": { description: "System Trouble", category: "System Trouble", priority: "high" },
  "301": { description: "AC Loss", category: "System Trouble", priority: "high" },
  "302": { description: "Low System Battery", category: "System Trouble", priority: "high" },
  "303": { description: "RAM Checksum Bad", category: "System Trouble", priority: "high" },
  "304": { description: "ROM Checksum Bad", category: "System Trouble", priority: "high" },
  "305": { description: "System Reset", category: "System Trouble", priority: "high" },
  "306": { description: "Panel Program Change", category: "System Trouble", priority: "high" },
  "307": { description: "Self-Test Failure", category: "System Trouble", priority: "high" },
  "308": { description: "System Shutdown", category: "System Trouble", priority: "high" },
  "309": { description: "Battery Test Failure", category: "System Trouble", priority: "high" },
  "310": { description: "Ground Fault", category: "System Trouble", priority: "high" },
  "311": { description: "Battery Missing", category: "System Trouble", priority: "high" },
  "312": { description: "Power Supply Overcurrent", category: "System Trouble", priority: "high" },
  "313": { description: "Engineer Reset", category: "System Trouble", priority: "low" },

  // Sounder/Relay Troubles
  "320": { description: "Sounder/Relay Trouble", category: "Sounder/Relay Trouble", priority: "high" },
  "321": { description: "Bell 1 Trouble", category: "Sounder/Relay Trouble", priority: "high" },
  "322": { description: "Bell 2 Trouble", category: "Sounder/Relay Trouble", priority: "high" },
  "323": { description: "Alarm Relay Trouble", category: "Sounder/Relay Trouble", priority: "high" },
  "324": { description: "Trouble Relay Trouble", category: "Sounder/Relay Trouble", priority: "high" },
  "325": { description: "Reversing Relay Trouble", category: "Sounder/Relay Trouble", priority: "high" },
  "326": { description: "Notification Appliance CKT #3 Trouble", category: "Sounder/Relay Trouble", priority: "high" },
  "327": { description: "Notification Appliance CKT #4 Trouble", category: "Sounder/Relay Trouble", priority: "high" },

  // System Peripheral Troubles
  "330": { description: "System Peripheral Trouble", category: "System Peripheral Trouble", priority: "high" },
  "331": { description: "Polling Loop Open Trouble", category: "System Peripheral Trouble", priority: "high" },
  "332": { description: "Polling Loop Short Trouble", category: "System Peripheral Trouble", priority: "high" },
  "333": { description: "Expansion Module Failure", category: "System Peripheral Trouble", priority: "high" },
  "334": { description: "Repeater Failure", category: "System Peripheral Trouble", priority: "high" },
  "335": { description: "Local Printer Paper Out", category: "System Peripheral Trouble", priority: "high" },
  "336": { description: "Local Printer Failure", category: "System Peripheral Trouble", priority: "high" },
  "337": { description: "Expansion Module DC Loss", category: "System Peripheral Trouble", priority: "high" },
  "338": { description: "Expansion Module Low Battery", category: "System Peripheral Trouble", priority: "high" },
  "339": { description: "Expansion Module Reset", category: "System Peripheral Trouble", priority: "high" },
  "341": { description: "Expansion Module Tamper", category: "System Peripheral Trouble", priority: "high" },
  "342": { description: "Expansion Module AC Loss", category: "System Peripheral Trouble", priority: "high" },
  "343": { description: "Expansion Module Self-Test Failure", category: "System Peripheral Trouble", priority: "high" },
  "344": { description: "RF Receiver Jam Detect", category: "System Peripheral Trouble", priority: "high" },

  // Communication Troubles
  "350": { description: "Communication Failure", category: "Communication Trouble", priority: "high" },
  "351": { description: "Telco 1 Fault", category: "Communication Trouble", priority: "high" },
  "352": { description: "Telco 2 Fault", category: "Communication Trouble", priority: "high" },
  "353": { description: "LR Radio Transmitter Fault", category: "Communication Trouble", priority: "high" },
  "354": { description: "Failure to Communicate", category: "Communication Trouble", priority: "high" },
  "355": { description: "Loss of Radio Supervision", category: "Communication Trouble", priority: "high" },
  "356": { description: "Loss of Central Polling", category: "Communication Trouble", priority: "high" },

  // Protection Loop
  "370": { description: "Protection Loop Trouble", category: "Protection Loop", priority: "high" },
  "371": { description: "Protection Loop Open", category: "Protection Loop", priority: "high" },
  "372": { description: "Protection Loop Short", category: "Protection Loop", priority: "high" },
  "373": { description: "Fire Trouble", category: "Protection Loop", priority: "high" },
  "374": { description: "Exit Error (By User)", category: "Protection Loop", priority: "high" },
  "375": { description: "Panic Zone Trouble", category: "Protection Loop", priority: "high" },
  "376": { description: "Hold-Up Zone Trouble", category: "Protection Loop", priority: "high" },

  // Sensor
  "380": { description: "Sensor Trouble - Global", category: "Sensor Trouble", priority: "high" },
  "381": { description: "Loss of Supervision - RF", category: "Sensor Trouble", priority: "high" },
  "382": { description: "Loss of Supervision - RPM", category: "Sensor Trouble", priority: "high" },
  "383": { description: "Sensor Tamper", category: "Sensor Trouble", priority: "high" },
  "384": { description: "RF Low Battery", category: "Sensor Trouble", priority: "high" },
  "385": { description: "Smoke High Sensitivity", category: "Sensor Trouble", priority: "high" },
  "386": { description: "Smoke Low Sensitivity", category: "Sensor Trouble", priority: "high" },
  "387": { description: "Intrusion High Sensitivity", category: "Sensor Trouble", priority: "high" },
  "388": { description: "Intrusion Low Sensitivity", category: "Sensor Trouble", priority: "high" },
  "389": { description: "Sensor Self-Test Failure", category: "Sensor Trouble", priority: "high" },
  "391": { description: "Sensor Watch Failure", category: "Sensor Trouble", priority: "high" },
  "392": { description: "Drift Compensation Error", category: "Sensor Trouble", priority: "high" },
  "393": { description: "Maintenance Alert", category: "Sensor Trouble", priority: "high" },

  // Open/Close
  "400": { description: "Open/Close", category: "Open/Close", priority: "low" },
  "401": { description: "Open/Close by User", category: "Open/Close", priority: "low" },
  "402": { description: "Group Open/Close", category: "Open/Close", priority: "low" },
  "403": { description: "Automatic Open/Close", category: "Open/Close", priority: "low" },
  "404": { description: "Late to Open/Close", category: "Open/Close", priority: "medium" },
  "405": { description: "Deferred Open/Close", category: "Open/Close", priority: "low" },
  "406": { description: "Cancel (By User)", category: "Open/Close", priority: "low" },
  "407": { description: "Remote Arm/Disarm", category: "Open/Close", priority: "low" },
  "408": { description: "Quick Arm", category: "Open/Close", priority: "low" },
  "409": { description: "Keyswitch Open/Close", category: "Open/Close", priority: "low" },
  "441": { description: "Armed Stay", category: "Open/Close", priority: "low" },
  "442": { description: "Keyswitch Armed Stay", category: "Open/Close", priority: "low" },
  "450": { description: "Exception Open/Close", category: "Open/Close", priority: "low" },
  "451": { description: "Early Open/Close", category: "Open/Close", priority: "low" },
  "452": { description: "Late Open/Close", category: "Open/Close", priority: "medium" },
  "453": { description: "Fail to Open", category: "Open/Close", priority: "high" },
  "454": { description: "Fail to Close", category: "Open/Close", priority: "high" },
  "455": { description: "Auto-Arm Failed", category: "Open/Close", priority: "high" },
  "456": { description: "Partial Arm", category: "Open/Close", priority: "low" },
  "457": { description: "Exit Error (User)", category: "Open/Close", priority: "high" },
  "458": { description: "User on Premises", category: "Open/Close", priority: "low" },
  "459": { description: "Recent Close", category: "Open/Close", priority: "low" },
  "461": { description: "Wrong Code Entry", category: "Open/Close", priority: "medium" },
  "462": { description: "Legal Code Entry", category: "Open/Close", priority: "low" },
  "463": { description: "Re-arm after Alarm", category: "Open/Close", priority: "low" },
  "464": { description: "Auto Arm Time Extended", category: "Open/Close", priority: "low" },
  "465": { description: "Panic Alarm Reset", category: "Open/Close", priority: "low" },

  // Remote Access
  "411": { description: "Callback Requested", category: "Remote Access", priority: "low" },
  "412": { description: "Successful Download/Access", category: "Remote Access", priority: "low" },
  "413": { description: "Unsuccessful Access", category: "Remote Access", priority: "medium" },
  "414": { description: "System Shutdown", category: "Remote Access", priority: "low" },
  "415": { description: "Dialer Shutdown", category: "Remote Access", priority: "low" },
  "416": { description: "Successful Upload", category: "Remote Access", priority: "low" },

  // Access Control
  "421": { description: "Access Denied", category: "Access Control", priority: "medium" },
  "422": { description: "Access Report by User", category: "Access Control", priority: "low" },
  "423": { description: "Forced Access", category: "Access Control", priority: "high" },
  "424": { description: "Egress Denied", category: "Access Control", priority: "medium" },
  "425": { description: "Egress Granted", category: "Access Control", priority: "low" },
  "426": { description: "Access Door Propped Open", category: "Access Control", priority: "high" },
  "427": { description: "Access Point DSM Trouble", category: "Access Control", priority: "high" },
  "428": { description: "Access Point RTE Trouble", category: "Access Control", priority: "high" },
  "429": { description: "Access Program Mode Entry", category: "Access Control", priority: "low" },
  "430": { description: "Access Program Mode Exit", category: "Access Control", priority: "low" },
  "431": { description: "Access Threat Level Change", category: "Access Control", priority: "low" },
  "432": { description: "Access Relay/Trigger Failure", category: "Access Control", priority: "high" },
  "433": { description: "Access RTE Shunt", category: "Access Control", priority: "low" },
  "434": { description: "Access DSM Shunt", category: "Access Control", priority: "low" },

  // System Disables
  "501": { description: "Access Reader Disable", category: "System Disable", priority: "low" },
  "520": { description: "Sounder/Relay Disable", category: "System Disable", priority: "low" },
  "521": { description: "Bell 1 Disable", category: "System Disable", priority: "low" },
  "522": { description: "Bell 2 Disable", category: "System Disable", priority: "low" },
  "523": { description: "Alarm Relay Disable", category: "System Disable", priority: "low" },
  "524": { description: "Trouble Relay Disable", category: "System Disable", priority: "low" },
  "525": { description: "Reversing Relay Disable", category: "System Disable", priority: "low" },
  "526": { description: "Notification Appliance Ckt #3 Disable", category: "System Disable", priority: "low" },
  "527": { description: "Notification Appliance Ckt #4 Disable", category: "System Disable", priority: "low" },
  "531": { description: "Module Added", category: "System Disable", priority: "low" },
  "532": { description: "Module Removed", category: "System Disable", priority: "low" },
  "551": { description: "Dialer Disabled", category: "System Disable", priority: "low" },
  "552": { description: "Radio Transmitter Disabled", category: "System Disable", priority: "low" },
  "553": { description: "Remote Upload/Download Disable", category: "System Disable", priority: "low" },

  // Bypasses
  "570": { description: "Zone/Sensor Bypass", category: "Bypass", priority: "low" },
  "571": { description: "Fire Bypass", category: "Bypass", priority: "low" },
  "572": { description: "24 Hour Zone Bypass", category: "Bypass", priority: "low" },
  "573": { description: "Burg. Bypass", category: "Bypass", priority: "low" },
  "574": { description: "Group Bypass", category: "Bypass", priority: "low" },
  "575": { description: "Swinger Bypass", category: "Bypass", priority: "low" },
  "576": { description: "Access Zone Shunt", category: "Bypass", priority: "low" },
  "577": { description: "Access Point Bypass", category: "Bypass", priority: "low" },

  // Test/Misc
  "601": { description: "Manual Test", category: "Test", priority: "low" },
  "602": { description: "Periodic Test", category: "Test", priority: "low" },
  "603": { description: "Periodic RF Transmission", category: "Test", priority: "low" },
  "604": { description: "Fire Test", category: "Test", priority: "low" },
  "605": { description: "Status Report to Follow", category: "Test", priority: "low" },
  "606": { description: "Listen-In to Follow", category: "Test", priority: "low" },
  "607": { description: "Walk-Test Mode", category: "Test", priority: "low" },
  "608": { description: "System Trouble Present", category: "Test", priority: "low" },
  "609": { description: "Video Transmitter Active", category: "Test", priority: "low" },
  "611": { description: "Point Tested OK", category: "Test", priority: "low" },
  "612": { description: "Point Not Tested", category: "Test", priority: "low" },
  "613": { description: "Intrusion Zone Walk Tested", category: "Test", priority: "low" },
  "614": { description: "Fire Zone Walk Tested", category: "Test", priority: "low" },
  "615": { description: "Panic Zone Walk Tested", category: "Test", priority: "low" },
  "616": { description: "Service Request", category: "Test", priority: "low" },

  // Event Log
  "621": { description: "Event Log Reset", category: "Event Log", priority: "low" },
  "622": { description: "Event Log 50% Full", category: "Event Log", priority: "medium" },
  "623": { description: "Event Log 90% Full", category: "Event Log", priority: "high" },
  "624": { description: "Event Log Overflow", category: "Event Log", priority: "high" },
  "625": { description: "Time/Date Reset", category: "Event Log", priority: "low" },
  "626": { description: "Time/Date Inaccurate", category: "Event Log", priority: "high" },
  "627": { description: "Program Mode Entry", category: "Event Log", priority: "low" },
  "628": { description: "Program Mode Exit", category: "Event Log", priority: "low" },

  // Scheduling
  "630": { description: "Schedule Change", category: "Scheduling", priority: "low" },
  "631": { description: "Exception Schedule Change", category: "Scheduling", priority: "low" },
  "632": { description: "Access Schedule Changes", category: "Scheduling", priority: "low" },

  // Personnel Monitoring
  "641": { description: "Senior Watch Trouble", category: "Personnel Monitoring", priority: "high" },
  "642": { description: "Latch-key Supervision", category: "Personnel Monitoring", priority: "low" },

  // Special Codes
  "750": { description: "Special Code 750", category: "Special", priority: "medium" },
  "751": { description: "Special Code 751", category: "Special", priority: "medium" },
  "752": { description: "Special Code 752", category: "Special", priority: "medium" },
  "753": { description: "Special Code 753", category: "Special", priority: "medium" },
  "754": { description: "Special Code 754", category: "Special", priority: "medium" },
  "755": { description: "Special Code 755", category: "Special", priority: "medium" },
  "756": { description: "Special Code 756", category: "Special", priority: "medium" },
  "757": { description: "Special Code 757", category: "Special", priority: "medium" },
  "758": { description: "Special Code 758", category: "Special", priority: "medium" },
  "759": { description: "Special Code 759", category: "Special", priority: "medium" },
  "760": { description: "Special Code 760", category: "Special", priority: "medium" },
  "761": { description: "Special Code 761", category: "Special", priority: "medium" },
  "762": { description: "Special Code 762", category: "Special", priority: "medium" },
  "763": { description: "Special Code 763", category: "Special", priority: "medium" },
  "764": { description: "Special Code 764", category: "Special", priority: "medium" },
  "765": { description: "Special Code 765", category: "Special", priority: "medium" },
  "766": { description: "Special Code 766", category: "Special", priority: "medium" },
  "767": { description: "Special Code 767", category: "Special", priority: "medium" },
  "768": { description: "Special Code 768", category: "Special", priority: "medium" },
  "769": { description: "Special Code 769", category: "Special", priority: "medium" },
  "770": { description: "Special Code 770", category: "Special", priority: "medium" },
  "771": { description: "Special Code 771", category: "Special", priority: "medium" },
  "772": { description: "Special Code 772", category: "Special", priority: "medium" },
  "773": { description: "Special Code 773", category: "Special", priority: "medium" },
  "774": { description: "Special Code 774", category: "Special", priority: "medium" },
  "775": { description: "Special Code 775", category: "Special", priority: "medium" },
  "776": { description: "Special Code 776", category: "Special", priority: "medium" },
  "777": { description: "Special Code 777", category: "Special", priority: "medium" },
  "778": { description: "Special Code 778", category: "Special", priority: "medium" },
  "779": { description: "Special Code 779", category: "Special", priority: "medium" },
  "780": { description: "Special Code 780", category: "Special", priority: "medium" },
  "781": { description: "Special Code 781", category: "Special", priority: "medium" },
  "782": { description: "Special Code 782", category: "Special", priority: "medium" },
  "783": { description: "Special Code 783", category: "Special", priority: "medium" },
  "784": { description: "Special Code 784", category: "Special", priority: "medium" },
  "785": { description: "Special Code 785", category: "Special", priority: "medium" },
  "786": { description: "Special Code 786", category: "Special", priority: "medium" },
  "787": { description: "Special Code 787", category: "Special", priority: "medium" },
  "788": { description: "Special Code 788", category: "Special", priority: "medium" },
  "789": { description: "Special Code 789", category: "Special", priority: "medium" },
};

/**
 * Parse SIA DC-09 or Contact ID message
 * SIA DC-09 Format: [#AccountNumber|ReceiverId/EventCode/AreaInfo]
 * Contact ID Format: [#AccountNumber|MessageTypeEventCodeAreaPoint]
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
    
    // Check for Contact ID format (starts with digits)
    if (parts.length > 1 && /^\d/.test(parts[1])) {
      const rest = parts[1];
      if (rest.length >= 11) {
        const messageType = rest.substring(0, 3);
        const eventCode = rest.substring(3, 6);
        const areaNumber = rest.substring(6, 8);
        const zoneNumber = rest.substring(8, 11);
        const eventQualifier = messageType[0]; // '1' for new, '3' for restore
        
        const eventInfo = EVENT_CODE_MAP[eventCode] || {
          description: `Unknown Event (${eventCode})`,
          category: "Unknown",
          priority: "medium" as const
        };
        
        // Build description with context
        let description = eventInfo.description;
        if (zoneNumber && zoneNumber !== '000') {
          description += ` - Point ${parseInt(zoneNumber, 10)}`;
        }
        if (areaNumber && areaNumber !== '00') {
          description += ` - Area ${parseInt(areaNumber, 10)}`;
        }
        
        const result: SiaDC09Message = {
          raw: message,
          accountNumber,
          eventCode,
          eventQualifier,
          areaNumber,
          zoneNumber,
          eventDescription: description,
          eventCategory: eventInfo.category,
          priority: eventInfo.priority,
          timestamp,
          isAlert: false // Temporary, will be set below
        };
        result.isAlert = isAlertEvent(result);
        return result;
      } else {
        // Incomplete Contact ID message
        const result: SiaDC09Message = {
          raw: message,
          accountNumber,
          eventCode: "Unknown",
          eventDescription: "Incomplete Contact ID Message",
          eventCategory: "System",
          priority: "low" as const,
          timestamp,
          isAlert: false // Temporary, will be set below
        };
        result.isAlert = isAlertEvent(result);
        return result;
      }
    }
    
    // SIA DC-09 parsing continues...
    
    // If only account and event code (like [#3333|NCW])
    if (parts.length === 2 && parts[1] && !parts[1].includes("/")) {
      const eventCode = parts[1].trim();
      const eventInfo = EVENT_CODE_MAP[eventCode] || {
        description: `Unknown Event (${eventCode})`,
        category: "System",
        priority: "medium" as const
      };
      
      const result: SiaDC09Message = {
        raw: message,
        accountNumber,
        eventCode,
        eventDescription: eventInfo.description,
        eventCategory: eventInfo.category,
        priority: eventInfo.priority,
        timestamp,
        isAlert: false // Temporary, will be set below
      };
      result.isAlert = isAlertEvent(result);
      return result;
    }
    
    // If only account number (incomplete message)
    if (parts.length === 1 || !parts[1]) {
      const result: SiaDC09Message = {
        raw: message,
        accountNumber,
        eventCode: "Unknown",
        eventDescription: "Incomplete Message",
        eventCategory: "System",
        priority: "low" as const,
        timestamp,
        isAlert: false // Temporary, will be set below
      };
      result.isAlert = isAlertEvent(result);
      return result;
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
    
    const result: SiaDC09Message = {
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
      timestamp,
      isAlert: false // Temporary, will be set below
    };
    result.isAlert = isAlertEvent(result);
    return result;
    
  } catch (error) {
    console.error("Error parsing SIA DC-09 message:", error);
    return null;
  }
}

/**
 * Validate SIA DC-09 or Contact ID message format
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
