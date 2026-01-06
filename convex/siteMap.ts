import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============= SITES =============

export const createSite = mutation({
  args: {
    accountNumber: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sites", {
      accountNumber: args.accountNumber,
      name: args.name,
      description: args.description,
      address: args.address,
      latitude: args.latitude,
      longitude: args.longitude,
      city: args.city,
      state: args.state,
      country: args.country,
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
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { siteId, ...updates } = args;
    await ctx.db.patch(siteId, updates);
  },
});

export const deleteSite = mutation({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.siteId, { active: false });
  },
});

// ============= FLOORS =============

export const createFloor = mutation({
  args: {
    siteId: v.id("sites"),
    areaNumber: v.string(),
    name: v.string(),
    width: v.number(),
    height: v.number(),
    floorPlanStorageId: v.optional(v.string()),
    floorPlanUrl: v.optional(v.string()),
    cameraIp: v.optional(v.string()),
    cameraPort: v.optional(v.number()),
    cameraUsername: v.optional(v.string()),
    cameraPassword: v.optional(v.string()),
    cameraStreamPath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("floors", {
      siteId: args.siteId,
      areaNumber: args.areaNumber,
      name: args.name,
      floorPlanStorageId: args.floorPlanStorageId,
      floorPlanUrl: args.floorPlanUrl,
      width: args.width,
      height: args.height,
      cameraIp: args.cameraIp,
      cameraPort: args.cameraPort,
      cameraUsername: args.cameraUsername,
      cameraPassword: args.cameraPassword,
      cameraStreamPath: args.cameraStreamPath,
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
      .collect()
      .then(floors => floors.sort((a, b) => a.areaNumber.localeCompare(b.areaNumber)));
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

export const getFloorByAccountAndArea = query({
  args: { 
    accountNumber: v.string(),
    areaNumber: v.string(),
  },
  handler: async (ctx, args) => {
    // Find site by account number
    const site = await ctx.db
      .query("sites")
      .withIndex("by_account_number", (q) => q.eq("accountNumber", args.accountNumber))
      .filter((q) => q.eq(q.field("active"), true))
      .first();
    
    if (!site) return null;
    
    // Find floor by site and area number
    const floor = await ctx.db
      .query("floors")
      .withIndex("by_site_and_area", (q) => 
        q.eq("siteId", site._id).eq("areaNumber", args.areaNumber)
      )
      .filter((q) => q.eq(q.field("active"), true))
      .first();
    
    return floor;
  },
});

export const getSensorsByAccountAndArea = query({
  args: { 
    accountNumber: v.string(),
    areaNumber: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the floor first
    const site = await ctx.db
      .query("sites")
      .withIndex("by_account_number", (q) => q.eq("accountNumber", args.accountNumber))
      .filter((q) => q.eq(q.field("active"), true))
      .first();
    
    if (!site) return [];
    
    const floor = await ctx.db
      .query("floors")
      .withIndex("by_site_and_area", (q) => 
        q.eq("siteId", site._id).eq("areaNumber", args.areaNumber)
      )
      .filter((q) => q.eq(q.field("active"), true))
      .first();
    
    if (!floor) return [];
    
    // Get sensors for this floor
    return await ctx.db
      .query("sensors")
      .withIndex("by_floor", (q) => q.eq("floorId", floor._id))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
  },
});

export const updateFloor = mutation({
  args: {
    floorId: v.id("floors"),
    name: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    floorPlanStorageId: v.optional(v.string()),
    floorPlanUrl: v.optional(v.string()),
    cameraIp: v.optional(v.string()),
    cameraPort: v.optional(v.number()),
    cameraUsername: v.optional(v.string()),
    cameraPassword: v.optional(v.string()),
    cameraStreamPath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { floorId, ...updates } = args;
    await ctx.db.patch(floorId, updates);
  },
});

export const deleteFloor = mutation({
  args: { floorId: v.id("floors") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.floorId, { active: false });
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
