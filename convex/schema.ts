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
  }).index("by_username", ["username"]),

  alerts: defineTable({
    // Raw SIA message
    rawMessage: v.string(),
    
    // Parsed fields from SIA DC-09 format
    protocol: v.string(), // e.g., "SIA-DCS"
    messageLength: v.optional(v.string()),
    receiver: v.optional(v.string()),
    
    // Account number
    accountNumber: v.string(),
    
    // Event code (e.g., "PA" for Panic Alarm)
    eventCode: v.string(),
    eventDescription: v.optional(v.string()),
    
    // Zone/Partition information
    zone: v.optional(v.string()),
    partition: v.optional(v.string()),
    
    // Timestamp from the message
    messageTimestamp: v.string(),
    
    // CRC/Checksum
    checksum: v.optional(v.string()),
    
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
  }).index("by_account", ["accountNumber"])
    .index("by_received_at", ["receivedAt"])
    .index("by_event_code", ["eventCode"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_status", ["status"])
    .index("by_status_and_assigned", ["status", "assignedTo"]),
});
