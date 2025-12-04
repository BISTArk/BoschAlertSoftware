import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new alert from a SIA message
export const createAlert = mutation({
  args: {
    rawMessage: v.string(),
    protocol: v.string(),
    messageLength: v.optional(v.string()),
    receiver: v.optional(v.string()),
    accountNumber: v.string(),
    eventCode: v.string(),
    eventDescription: v.optional(v.string()),
    zone: v.optional(v.string()),
    partition: v.optional(v.string()),
    messageTimestamp: v.string(),
    checksum: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const alertId = await ctx.db.insert("alerts", {
      ...args,
      receivedAt: Date.now(),
      acknowledged: false,
      status: "unassigned" as const,
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
        searchQuery: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const numItems = args.paginationOpts?.numItems ?? 50;
    const cursor = args.paginationOpts?.cursor;

    let query = ctx.db.query("alerts").order("desc");

    // Apply filters
    if (args.filters?.status) {
      query = ctx.db
        .query("alerts")
        .withIndex("by_status", (q) => q.eq("status", args.filters!.status as any))
        .order("desc");
    }

    if (args.filters?.assignedTo) {
      query = ctx.db
        .query("alerts")
        .withIndex("by_assigned_to", (q) => q.eq("assignedTo", args.filters!.assignedTo))
        .order("desc");
    }

    const results = await query.paginate({
      numItems,
      cursor: cursor ?? null,
    });

    // Apply client-side filters for fields without indexes
    let filteredPage = results.page;

    if (args.filters?.eventCode) {
      filteredPage = filteredPage.filter((alert) => alert.eventCode === args.filters!.eventCode);
    }

    if (args.filters?.accountNumber) {
      filteredPage = filteredPage.filter((alert) => alert.accountNumber.includes(args.filters!.accountNumber!));
    }

    if (args.filters?.searchQuery) {
      const searchLower = args.filters.searchQuery.toLowerCase();
      filteredPage = filteredPage.filter((alert) =>
        alert.rawMessage.toLowerCase().includes(searchLower) ||
        alert.accountNumber.toLowerCase().includes(searchLower) ||
        (alert.eventDescription?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    return {
      ...results,
      page: filteredPage,
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
    await ctx.db.patch(args.alertId, {
      assignedTo: args.newGuardId,
      status: "assigned" as const,
      assignedBy: args.reassignedBy,
      assignedAt: Date.now(),
    });
  },
});
