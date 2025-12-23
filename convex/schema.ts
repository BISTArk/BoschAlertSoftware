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
    // ========== SIA DC-09 Protocol Fields ==========
    // Raw message from security panel for debugging
    rawMessage: v.string(),
    
    // Core SIA DC-09 fields from format: [#AccountNumber|ReceiverId/EventCode/AreaInfo]
    accountNumber: v.optional(v.string()), // Customer account number (e.g., "3333") - TEMPORARY: optional for migration
    receiverId: v.optional(v.string()), // Receiver ID (e.g., "Nri01")
    eventCode: v.optional(v.string()), // Two-letter event code (e.g., "BA", "BH", "BR", "BC") - TEMPORARY: optional for migration
    zoneNumber: v.optional(v.string()), // Zone number from event (e.g., "0008")
    userName: v.optional(v.string()), // User name for access control events
    areaInfo: v.optional(v.string()), // Additional area information
    
    // Mapped event information
    eventDescription: v.optional(v.string()), // Human-readable description - TEMPORARY: optional for migration
    eventCategory: v.optional(v.string()), // e.g., "Burglary", "Fire", "Access Control", "System" - TEMPORARY: optional for migration
    priority: v.optional(v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    )), // Alert priority based on event type - TEMPORARY: optional for migration
    
    // ========== Legacy Contact ID Fields (for backwards compatibility) ==========
    customerAccount: v.optional(v.string()), // DEPRECATED: Use accountNumber
    contactIdEventCode: v.optional(v.string()), // DEPRECATED: Use eventCode
    zoneId: v.optional(v.string()), // DEPRECATED: Use zoneNumber
    partitionNumber: v.optional(v.string()), // DEPRECATED: Not used in SIA DC-09
    severity: v.optional(v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    )), // DEPRECATED: Use priority
    eventType: v.optional(v.string()), // DEPRECATED
    
    // Legacy field for UI compatibility (E = Event/Alert, R = Restore)
    eventQualifier: v.optional(v.string()),
    
    // ========== System Management Fields ==========
    // Sensor linkage
    sensorId: v.optional(v.id("sensors")), // Linked sensor based on zone
    floorId: v.optional(v.id("floors")), // Floor where alert originated
    
    // Timestamps
    receivedAt: v.number(), // Server timestamp when received
    eventTimestamp: v.optional(v.number()), // Original event timestamp from panel
    
    // Acknowledgment
    acknowledged: v.boolean(),
    acknowledgedAt: v.optional(v.number()),
    acknowledgedBy: v.optional(v.id("users")),
    
    // Assignment and workflow
    assignedTo: v.optional(v.id("users")), // Guard assigned to this alert
    status: v.union(
      v.literal("unassigned"),
      v.literal("assigned"),
      v.literal("in-progress"),
      v.literal("resolved")
    ),
    assignedBy: v.optional(v.id("users")), // Head/Admin who assigned it
    assignedAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
    responseType: v.optional(v.string()), // "lockdown", "dispatch", "investigate", etc.
    notes: v.optional(v.string()),
  })
    .index("by_account", ["accountNumber"])
    .index("by_received_at", ["receivedAt"])
    .index("by_event_code", ["eventCode"])
    .index("by_zone", ["zoneNumber"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_status", ["status"])
    .index("by_status_and_assigned", ["status", "assignedTo"])
    .index("by_priority", ["priority"])
    .index("by_event_qualifier", ["eventQualifier"])
    .index("by_sensor", ["sensorId"])
    .index("by_category", ["eventCategory"])
    .index("by_priority_and_time", ["priority", "receivedAt"]),
});
