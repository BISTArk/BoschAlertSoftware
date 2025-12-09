import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple login - returns user if credentials match
export const login = query({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user || !user.active) {
      return null;
    }

    // Simple password check (in production, use proper hashing)
    if (user.password === args.password) {
      return {
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
      };
    }

    return null;
  },
});

// Get all users (admin only)
export const getUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Get guards only (for assignment dropdown)
export const getGuards = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.and(q.eq(q.field("role"), "guard"), q.eq(q.field("active"), true)))
      .collect();
  },
});

// Get available guards only (for alert assignment)
export const getAvailableGuards = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "guard"),
          q.eq(q.field("active"), true),
          q.eq(q.field("available"), true)
        )
      )
      .collect();
  },
});

// Create a new user
export const createUser = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.union(v.literal("guard"), v.literal("head"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    // Check if username already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existing) {
      throw new Error("Username already exists");
    }

    return await ctx.db.insert("users", {
      username: args.username,
      password: args.password, // In production, hash this
      name: args.name,
      role: args.role,
      active: true,
      available: args.role === "guard" ? true : undefined, // Guards default to available
      createdAt: Date.now(),
    });
  },
});

// Update user
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    password: v.optional(v.string()),
    role: v.optional(v.union(v.literal("guard"), v.literal("head"), v.literal("admin"))),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};

    if (args.name !== undefined) updates.name = args.name;
    if (args.password !== undefined) updates.password = args.password;
    if (args.role !== undefined) updates.role = args.role;
    if (args.active !== undefined) updates.active = args.active;

    await ctx.db.patch(args.userId, updates);
  },
});

// Deactivate user (soft delete)
export const deactivateUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { active: false });
  },
});

// Delete user (hard delete)
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
  },
});

// Toggle guard availability (available/away)
export const toggleAvailability = mutation({
  args: { 
    userId: v.id("users"),
    available: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "guard") {
      throw new Error("Can only toggle availability for guards");
    }
    await ctx.db.patch(args.userId, { available: args.available });
  },
});
