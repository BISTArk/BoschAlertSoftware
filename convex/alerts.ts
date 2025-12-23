import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create alert from SIA DC-09 parsed message
export const createSiaDC09Alert = mutation({
  args: {
    rawMessage: v.string(),
    accountNumber: v.string(),
    receiverId: v.optional(v.string()),
    eventCode: v.string(),
    zoneNumber: v.optional(v.string()),
    userName: v.optional(v.string()),
    areaInfo: v.optional(v.string()),
    eventDescription: v.string(),
    eventCategory: v.string(),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    eventQualifier: v.optional(v.string()),
    eventTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Try to find matching sensor by account number and zone
    let sensorId = undefined;
    let floorId = undefined;

    if (args.zoneNumber) {
      const sensors = await ctx.db
        .query("sensors")
        .withIndex("by_account", (q) => q.eq("accountNumber", args.accountNumber))
        .collect();

      // Match zone (removing leading zeros)
      const zoneNum = parseInt(args.zoneNumber, 10).toString();
      const matchingSensor = sensors.find((s) => {
        const sensorZone = s.zone ? parseInt(s.zone, 10).toString() : null;
        return sensorZone === zoneNum;
      });

      if (matchingSensor) {
        sensorId = matchingSensor._id;
        floorId = matchingSensor.floorId;
      }
    }

    // Determine initial status
    const initialStatus = args.priority === "critical" || args.priority === "high" 
      ? "unassigned" as const 
      : "unassigned" as const;

    const alertId = await ctx.db.insert("alerts", {
      rawMessage: args.rawMessage,
      accountNumber: args.accountNumber,
      receiverId: args.receiverId,
      eventCode: args.eventCode,
      zoneNumber: args.zoneNumber,
      userName: args.userName,
      areaInfo: args.areaInfo,
      eventDescription: args.eventDescription,
      eventCategory: args.eventCategory,
      priority: args.priority,
      eventQualifier: args.eventQualifier,
      sensorId,
      floorId,
      receivedAt: Date.now(),
      eventTimestamp: args.eventTimestamp,
      acknowledged: false,
      status: initialStatus,
    });

    console.log(`Created SIA DC-09 alert: ${alertId} - ${args.eventDescription}`);
    return alertId;
  },
});

// LEGACY: Old mutation kept for backwards compatibility with test generator
export const createContactIdAlert = mutation({
  args: {
    rawMessage: v.string(),
    customerAccount: v.string(),
    eventQualifier: v.string(),
    contactIdEventCode: v.string(),
    partitionNumber: v.string(),
    zoneId: v.string(),
    eventCategory: v.optional(v.string()),
    eventType: v.optional(v.string()),
    eventDescription: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Map old format to new SIA DC-09 format
    const alertId = await ctx.db.insert("alerts", {
      rawMessage: args.rawMessage,
      accountNumber: args.customerAccount,
      eventCode: args.contactIdEventCode,
      zoneNumber: args.zoneId,
      eventDescription: args.eventDescription || "Test Alert",
      eventCategory: args.eventCategory || "Test",
      priority: (args.priority as "critical" | "high" | "medium" | "low") || "medium",
      eventQualifier: args.eventQualifier,
      receivedAt: Date.now(),
      acknowledged: false,
      status: args.assignedTo ? "assigned" as const : "unassigned" as const,
      assignedTo: args.assignedTo,
    });
    return alertId;
  },
});

// Get all alerts with pagination and filtering
export const getAlerts = query({
  args: {
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.optional(v.string()),
      })
    ),
    filters: v.optional(
      v.object({
        status: v.optional(v.string()),
        assignedTo: v.optional(v.id("users")),
        eventCode: v.optional(v.string()),
        accountNumber: v.optional(v.string()),
        customerAccount: v.optional(v.string()), // NEW: Filter by customer account
        priority: v.optional(v.string()), // NEW: Filter by priority
        eventQualifier: v.optional(v.string()), // NEW: Filter by E/R
        searchQuery: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const numItems = args.paginationOpts?.numItems ?? 50;
    const cursor = args.paginationOpts?.cursor;

    // Get all alerts first, then apply filters, then paginate
    let alerts;

    // Apply indexed filters
    if (args.filters?.status) {
      alerts = await ctx.db
        .query("alerts")
        .withIndex("by_status", (q) => q.eq("status", args.filters!.status as any))
        .order("desc")
        .collect();
    } else if (args.filters?.assignedTo) {
      alerts = await ctx.db
        .query("alerts")
        .withIndex("by_assigned_to", (q) => q.eq("assignedTo", args.filters!.assignedTo))
        .order("desc")
        .collect();
    } else if (args.filters?.priority) {
      alerts = await ctx.db
        .query("alerts")
        .withIndex("by_priority", (q) => q.eq("priority", args.filters!.priority as "critical" | "high" | "medium" | "low"))
        .order("desc")
        .collect();
    } else if (args.filters?.customerAccount) {
      alerts = await ctx.db
        .query("alerts")
        .withIndex("by_account", (q) => q.eq("accountNumber", args.filters!.customerAccount!))
        .order("desc")
        .collect();
    } else {
      // Use default sorting by severity first, then receivedAt
      alerts = await ctx.db.query("alerts").collect();
    }

    // Sort by priority first (critical > high > medium > low), then by receivedAt (newest first)
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      const aPriority = priorityOrder[a.priority || a.severity || "low"];
      const bPriority = priorityOrder[b.priority || b.severity || "low"];
      if (aPriority !== bPriority) {
        return aPriority - bPriority; // Lower number = higher priority
      }
      return b.receivedAt - a.receivedAt; // Newer first
    });

    // Apply client-side filters for fields without indexes or legacy fields
    if (args.filters?.eventCode) {
      alerts = alerts.filter((alert) => 
        alert.eventCode === args.filters!.eventCode ||
        alert.contactIdEventCode === args.filters!.eventCode
      );
    }

    if (args.filters?.accountNumber) {
      alerts = alerts.filter((alert) => 
        alert.customerAccount?.includes(args.filters!.accountNumber!) ||
        alert.accountNumber?.includes(args.filters!.accountNumber!)
      );
    }

    if (args.filters?.eventQualifier) {
      alerts = alerts.filter((alert) => alert.eventQualifier === args.filters!.eventQualifier);
    }

    if (args.filters?.searchQuery) {
      const searchLower = args.filters.searchQuery.toLowerCase();
      alerts = alerts.filter((alert) =>
        alert.rawMessage.toLowerCase().includes(searchLower) ||
        alert.customerAccount?.toLowerCase().includes(searchLower) ||
        alert.accountNumber?.toLowerCase().includes(searchLower) ||
        alert.zoneId?.toLowerCase().includes(searchLower) ||
        (alert.eventDescription?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    // Manual pagination
    const cursorIndex = cursor ? alerts.findIndex((a) => a._id === cursor) + 1 : 0;
    const page = alerts.slice(cursorIndex, cursorIndex + numItems);
    const continueCursor = page.length === numItems && cursorIndex + numItems < alerts.length
      ? page[page.length - 1]._id
      : undefined;

    return {
      page,
      isDone: !continueCursor,
      continueCursor,
    };
  },
});

// Get alerts count
export const getAlertsCount = query({
  handler: async (ctx) => {
    const alerts = await ctx.db.query("alerts").collect();
    return alerts.length;
  },
});

// Get filtered alerts count
export const getFilteredAlertsCount = query({
  args: {
    filters: v.optional(
      v.object({
        status: v.optional(v.string()),
        assignedTo: v.optional(v.id("users")),
        eventCode: v.optional(v.string()),
        accountNumber: v.optional(v.string()),
        customerAccount: v.optional(v.string()), // NEW
        priority: v.optional(v.string()), // NEW
        eventQualifier: v.optional(v.string()), // NEW
        searchQuery: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let alerts;

    // Apply indexed filters
    if (args.filters?.status) {
      alerts = await ctx.db
        .query("alerts")
        .withIndex("by_status", (q) => q.eq("status", args.filters!.status as any))
        .collect();
    } else if (args.filters?.assignedTo) {
      alerts = await ctx.db
        .query("alerts")
        .withIndex("by_assigned_to", (q) => q.eq("assignedTo", args.filters!.assignedTo))
        .collect();
    } else if (args.filters?.priority) {
      alerts = await ctx.db
        .query("alerts")
        .withIndex("by_priority", (q) => q.eq("priority", args.filters!.priority as "critical" | "high" | "medium" | "low"))
        .collect();
    } else if (args.filters?.customerAccount) {
      alerts = await ctx.db
        .query("alerts")
        .withIndex("by_account", (q) => q.eq("accountNumber", args.filters!.customerAccount!))
        .collect();
    } else {
      alerts = await ctx.db.query("alerts").collect();
    }

    // Apply client-side filters
    if (args.filters?.eventCode) {
      alerts = alerts.filter((alert) => 
        alert.eventCode === args.filters!.eventCode ||
        alert.contactIdEventCode === args.filters!.eventCode
      );
    }

    if (args.filters?.accountNumber) {
      alerts = alerts.filter((alert) => 
        alert.accountNumber?.includes(args.filters!.accountNumber!) ||
        alert.customerAccount?.includes(args.filters!.accountNumber!)
      );
    }

    if (args.filters?.eventQualifier) {
      alerts = alerts.filter((alert) => alert.eventQualifier === args.filters!.eventQualifier);
    }

    if (args.filters?.searchQuery) {
      const searchLower = args.filters.searchQuery.toLowerCase();
      alerts = alerts.filter((alert) =>
        alert.rawMessage.toLowerCase().includes(searchLower) ||
        alert.accountNumber?.toLowerCase().includes(searchLower) ||
        alert.customerAccount?.toLowerCase().includes(searchLower) ||
        alert.zoneNumber?.toLowerCase().includes(searchLower) ||
        (alert.eventDescription?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    return alerts.length;
  },
});

// Acknowledge an alert
export const acknowledgeAlert = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { acknowledged: true });
  },
});

// Delete an alert
export const deleteAlert = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Assign alert to a guard
export const assignAlert = mutation({
  args: {
    alertId: v.id("alerts"),
    guardId: v.id("users"),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if guard is available
    const guard = await ctx.db.get(args.guardId);
    if (!guard) {
      throw new Error("Guard not found");
    }
    if (guard.role !== "guard") {
      throw new Error("Can only assign to guards");
    }
    if (!guard.available) {
      throw new Error("Cannot assign alert to unavailable guard. Guard is currently marked as away.");
    }

    await ctx.db.patch(args.alertId, {
      assignedTo: args.guardId,
      status: "assigned" as const,
      assignedBy: args.assignedBy,
      assignedAt: Date.now(),
    });
  },
});

// Update alert status
export const updateAlertStatus = mutation({
  args: {
    alertId: v.id("alerts"),
    status: v.union(
      v.literal("unassigned"),
      v.literal("assigned"),
      v.literal("in-progress"),
      v.literal("resolved")
    ),
    userId: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };

    if (args.notes) {
      updates.notes = args.notes;
    }

    if (args.status === "resolved") {
      updates.resolvedAt = Date.now();
      updates.resolvedBy = args.userId;
    }

    await ctx.db.patch(args.alertId, updates);
  },
});

// Reassign alert to different guard
export const reassignAlert = mutation({
  args: {
    alertId: v.id("alerts"),
    newGuardId: v.id("users"),
    reassignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if new guard is available
    const guard = await ctx.db.get(args.newGuardId);
    if (!guard) {
      throw new Error("Guard not found");
    }
    if (guard.role !== "guard") {
      throw new Error("Can only assign to guards");
    }
    if (!guard.available) {
      throw new Error("Cannot reassign alert to unavailable guard. Guard is currently marked as away.");
    }

    await ctx.db.patch(args.alertId, {
      assignedTo: args.newGuardId,
      status: "assigned" as const,
      assignedBy: args.reassignedBy,
      assignedAt: Date.now(),
    });
  },
});
