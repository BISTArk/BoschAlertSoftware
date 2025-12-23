/**
 * Database Migration Script
 * Migrates old Contact ID format data to SIA DC-09 format
 */

import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Query to count existing alerts
export const countAlerts = query({
  args: {},
  handler: async (ctx) => {
    const alerts = await ctx.db.query("alerts").collect();
    const oldFormat = alerts.filter(a => a.customerAccount && !a.accountNumber).length;
    const newFormat = alerts.filter(a => a.accountNumber).length;
    
    return {
      total: alerts.length,
      oldFormat,
      newFormat,
      byStatus: {
        unassigned: alerts.filter(a => a.status === "unassigned").length,
        assigned: alerts.filter(a => a.status === "assigned").length,
        inProgress: alerts.filter(a => a.status === "in-progress").length,
        resolved: alerts.filter(a => a.status === "resolved").length,
      }
    };
  },
});

// Migrate old Contact ID format to SIA DC-09 format
export const migrateContactIdToSiaDC09 = mutation({
  args: {},
  handler: async (ctx) => {
    const alerts = await ctx.db.query("alerts").collect();
    
    let migrated = 0;
    let skipped = 0;
    
    for (const alert of alerts) {
      // Skip if already in new format
      if (alert.accountNumber && alert.eventCode) {
        skipped++;
        continue;
      }
      
      // Skip if missing essential old format fields
      if (!alert.customerAccount && !alert.contactIdEventCode) {
        skipped++;
        continue;
      }
      
      // Migrate to new format
      await ctx.db.patch(alert._id, {
        accountNumber: alert.customerAccount || alert.accountNumber || "Unknown",
        eventCode: alert.contactIdEventCode || alert.eventCode || "Unknown",
        zoneNumber: alert.zoneId || alert.zoneNumber,
        eventDescription: alert.eventDescription || "Migrated Alert",
        eventCategory: alert.eventCategory || "System",
        priority: alert.priority || alert.severity || "medium",
      });
      
      migrated++;
    }
    
    return {
      total: alerts.length,
      migrated,
      skipped,
      message: `Migrated ${migrated} alerts, skipped ${skipped}`
    };
  },
});

// Delete all existing alerts (admin only)
export const clearAllAlerts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const alerts = await ctx.db.query("alerts").collect();
    
    console.log(`Deleting ${alerts.length} alerts...`);
    
    for (const alert of alerts) {
      await ctx.db.delete(alert._id);
    }
    
    console.log("✓ All alerts deleted");
    return { deleted: alerts.length };
  },
});

// Query for testing - Get all alerts with basic info
export const listAlerts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const alerts = await ctx.db
      .query("alerts")
      .order("desc")
      .take(limit);
    
    return alerts.map(alert => ({
      _id: alert._id,
      accountNumber: alert.accountNumber || alert.customerAccount,
      eventCode: alert.eventCode || alert.contactIdEventCode,
      eventDescription: alert.eventDescription,
      priority: alert.priority || alert.severity,
      status: alert.status,
      receivedAt: new Date(alert.receivedAt).toISOString(),
      isOldFormat: !alert.accountNumber && !!alert.customerAccount,
    }));
  },
});
