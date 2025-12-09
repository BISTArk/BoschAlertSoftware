import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    password: v.string(), // In production, this would be hashed
    name: v.string(),
    role: v.union(v.literal("guard"), v.literal("head"), v.literal("admin")),
    createdAt: v.number(),
    active: v.boolean(),
    // Customer account associations - users can be associated with multiple customer accounts
    customerAccounts: v.optional(v.array(v.string())), // Array of customer account numbers this user has access to
    // Guard availability status
    available: v.optional(v.boolean()), // true = available, false = away
    // Guard location tracking (optional)
    currentFloorId: v.optional(v.id("floors")),
    lastSeenAt: v.optional(v.number()),
  }).index("by_username", ["username"])
    .index("by_floor", ["currentFloorId"])
    .index("by_role_and_available", ["role", "available"]),

  sites: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    createdBy: v.id("users"),
  }),

  floors: defineTable({
    siteId: v.id("sites"),
    name: v.string(), // e.g., "Floor 1", "Ground Floor", "Basement"
    floorNumber: v.number(),
    floorPlanUrl: v.optional(v.string()), // URL to uploaded floor plan image
    floorPlanStorageId: v.optional(v.string()), // Convex storage ID
    width: v.number(), // Floor plan dimensions for coordinate system
    height: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_site", ["siteId"])
    .index("by_site_and_floor", ["siteId", "floorNumber"]),

  sensors: defineTable({
    floorId: v.id("floors"),
    accountNumber: v.string(), // Links to alert accountNumber
    name: v.string(), // e.g., "Server Room Door", "Main Entrance"
    type: v.string(), // e.g., "door", "motion", "fire", "panic", "camera"
    zone: v.optional(v.string()),
    // Position on floor plan (percentage or pixel coordinates)
    positionX: v.number(),
    positionY: v.number(),
    // Visual properties
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_floor", ["floorId"])
    .index("by_account", ["accountNumber"])
    .index("by_floor_and_account", ["floorId", "accountNumber"]),

  alerts: defineTable({
    // Raw SIA message (for backwards compatibility and debugging)
    rawMessage: v.string(),
    
    // NEW: Contact ID Format - Message Format: [Customer Account] [Event Qualifier] [Event Code] [Partition] [Zone ID]
    // Example: "1234 E 123 01 123"
    customerAccount: v.optional(v.string()), // Customer (Subscriber Account Number) - identifies which customer
    eventQualifier: v.optional(v.string()), // E = New Event, R = Restore
    contactIdEventCode: v.optional(v.string()), // Event Code (300-789) - refer to Contact ID mapping
    partitionNumber: v.optional(v.string()), // Group or Partition Number, 00 to FF (hex), 00 for non-partitioned
    zoneId: v.optional(v.string()), // Zone ID number (001-999) or user number, 000 for system status messages
    
    // Mapped event information from Contact ID code
    eventCategory: v.optional(v.string()), // e.g., "System Troubles", "Sensor", "Open/Close"
    eventType: v.optional(v.string()), // e.g., "Alarm", "Trouble", "Status"
    eventDescription: v.optional(v.string()), // Human-readable description
    priority: v.optional(v.string()), // "critical", "high", "medium", "low"
    severity: v.optional(v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    )), // Alert severity classification
    
    // Legacy/backwards compatibility fields
    protocol: v.optional(v.string()), // e.g., "SIA-DCS"
    messageLength: v.optional(v.string()),
    receiver: v.optional(v.string()),
    accountNumber: v.optional(v.string()), // DEPRECATED: Use customerAccount instead
    eventCode: v.optional(v.string()), // DEPRECATED: Use contactIdEventCode instead
    zone: v.optional(v.string()), // DEPRECATED: Use zoneId instead
    partition: v.optional(v.string()), // DEPRECATED: Use partitionNumber instead
    messageTimestamp: v.optional(v.string()),
    checksum: v.optional(v.string()),
    
    // Sensor linkage - links zoneId to actual sensor in the system
    sensorId: v.optional(v.id("sensors")), // Linked sensor based on zoneId
    floorId: v.optional(v.id("floors")), // Floor where the alert originated
    
    // Additional metadata
    receivedAt: v.number(), // Server timestamp when received
    
    // Acknowledgment status
    acknowledged: v.boolean(),
    
    // Assignment and status
    assignedTo: v.optional(v.id("users")), // Guard assigned to this alert
    status: v.optional(
      v.union(
        v.literal("unassigned"),
        v.literal("assigned"),
        v.literal("in-progress"),
        v.literal("resolved")
      )
    ),
    assignedBy: v.optional(v.id("users")), // Head/Admin who assigned it
    assignedAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  }).index("by_customer_account", ["customerAccount"])
    .index("by_received_at", ["receivedAt"])
    .index("by_contact_id_event_code", ["contactIdEventCode"])
    .index("by_zone_id", ["zoneId"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_status", ["status"])
    .index("by_status_and_assigned", ["status", "assignedTo"])
    .index("by_priority", ["priority"])
    .index("by_event_qualifier", ["eventQualifier"])
    .index("by_sensor", ["sensorId"])
    .index("by_severity", ["severity"])
    .index("by_severity_and_time", ["severity", "receivedAt"]),
});
