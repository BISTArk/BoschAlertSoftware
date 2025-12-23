import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============= SITES =============

export const createSite = mutation({
  args: {
    accountNumber: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sites", {
      accountNumber: args.accountNumber,
      name: args.name,
      description: args.description,
      address: args.address,
      active: true,
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });
  },
});

export const getSites = query({
  handler: async (ctx) => {
    return await ctx.db.query("sites").filter((q) => q.eq(q.field("active"), true)).collect();
  },
});

export const getSite = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.siteId);
  },
});

export const updateSite = mutation({
  args: {
    siteId: v.id("sites"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { siteId, ...updates } = args;
    await ctx.db.patch(siteId, updates);
  },
});

// ============= FLOORS =============

export const createFloor = mutation({
  args: {
    siteId: v.id("sites"),
    areaNumber: v.string(),
    name: v.string(),
    floorNumber: v.number(),
    width: v.number(),
    height: v.number(),
    floorPlanStorageId: v.optional(v.string()),
    floorPlanUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("floors", {
      siteId: args.siteId,
      areaNumber: args.areaNumber,
      name: args.name,
      floorNumber: args.floorNumber,
      floorPlanStorageId: args.floorPlanStorageId,
      floorPlanUrl: args.floorPlanUrl,
      width: args.width,
      height: args.height,
      active: true,
      createdAt: Date.now(),
    });
  },
});

export const getFloorsBySite = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("floors")
      .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
  },
});

export const getFirstFloor = query({
  handler: async (ctx) => {
    const sites = await ctx.db.query("sites").filter((q) => q.eq(q.field("active"), true)).first();
    if (!sites) return null;
    
    const floor = await ctx.db
      .query("floors")
      .withIndex("by_site", (q) => q.eq("siteId", sites._id))
      .filter((q) => q.eq(q.field("active"), true))
      .first();
    
    return floor;
  },
});

export const getFloor = query({
  args: { floorId: v.id("floors") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.floorId);
  },
});

export const updateFloor = mutation({
  args: {
    floorId: v.id("floors"),
    name: v.optional(v.string()),
    floorNumber: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    floorPlanStorageId: v.optional(v.string()),
    floorPlanUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { floorId, ...updates } = args;
    await ctx.db.patch(floorId, updates);
  },
});

// ============= SENSORS =============

export const createSensor = mutation({
  args: {
    floorId: v.id("floors"),
    accountNumber: v.string(),
    name: v.string(),
    type: v.string(),
    zone: v.string(),
    positionX: v.number(),
    positionY: v.number(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sensors", {
      floorId: args.floorId,
      accountNumber: args.accountNumber,
      name: args.name,
      type: args.type,
      zone: args.zone,
      positionX: args.positionX,
      positionY: args.positionY,
      icon: args.icon,
      color: args.color,
      active: true,
      createdAt: Date.now(),
    });
  },
});

export const getSensorsByFloor = query({
  args: { floorId: v.id("floors") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sensors")
      .withIndex("by_floor", (q) => q.eq("floorId", args.floorId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
  },
});

export const getSensorByAccount = query({
  args: { accountNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sensors")
      .withIndex("by_account", (q) => q.eq("accountNumber", args.accountNumber))
      .first();
  },
});

export const updateSensor = mutation({
  args: {
    sensorId: v.id("sensors"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    zone: v.optional(v.string()),
    positionX: v.optional(v.number()),
    positionY: v.optional(v.number()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { sensorId, ...updates } = args;
    await ctx.db.patch(sensorId, updates);
  },
});

export const deleteSensor = mutation({
  args: { sensorId: v.id("sensors") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sensorId, { active: false });
  },
});

// ============= ACTIVE ALERTS ON MAP =============

export const getActiveAlertsForFloor = query({
  args: { floorId: v.id("floors") },
  handler: async (ctx, args) => {
    // Get all sensors on this floor
    const sensors = await ctx.db
      .query("sensors")
      .withIndex("by_floor", (q) => q.eq("floorId", args.floorId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // Get active alerts for these sensors
    const accountNumbers = sensors.map((s) => s.accountNumber);
    const alerts = await ctx.db
      .query("alerts")
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "resolved"),
          q.or(...accountNumbers.map((acc) => q.eq(q.field("accountNumber"), acc)))
        )
      )
      .order("desc")
      .take(100);

    // Combine sensor info with alerts
    return alerts.map((alert) => {
      const sensor = sensors.find((s) => s.accountNumber === alert.accountNumber);
      return {
        ...alert,
        sensor: sensor || null,
      };
    });
  },
});

// Get guards currently on this floor
export const getGuardsOnFloor = query({
  args: { floorId: v.id("floors") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_floor", (q) => q.eq("currentFloorId", args.floorId))
      .filter((q) => q.and(q.eq(q.field("role"), "guard"), q.eq(q.field("active"), true)))
      .collect();
  },
});

// Update guard location
export const updateGuardLocation = mutation({
  args: {
    userId: v.id("users"),
    floorId: v.optional(v.id("floors")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      currentFloorId: args.floorId,
      lastSeenAt: Date.now(),
    });
  },
});
