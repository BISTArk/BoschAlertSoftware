// Seed sample site map data for testing
// Run with: npx convex run seedSiteMap:default

import { internalMutation } from "./_generated/server";

export default internalMutation(async (ctx) => {
  // Check if sites already exist
  const existingSites = await ctx.db.query("sites").collect();
  
  if (existingSites.length > 0) {
    console.log("Sites already exist. Skipping seed.");
    return { message: "Sites already exist", count: existingSites.length };
  }

  // Get admin user to create the site
  const admin = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("role"), "admin"))
    .first();

  if (!admin) {
    return { error: "No admin user found. Run seed:default first to create users." };
  }

  // Create a sample site
  const siteId = await ctx.db.insert("sites", {
    name: "AISAC Headquarters",
    description: "Main office building with server rooms and security systems",
    address: "123 Industrial Drive, Tech City",
    active: true,
    createdAt: Date.now(),
    createdBy: admin._id,
  });

  // Create floors
  const groundFloorId = await ctx.db.insert("floors", {
    siteId,
    areaNumber: "01",
    name: "Ground Floor",
    width: 1200,
    height: 800,
    active: true,
    createdAt: Date.now(),
  });

  const floor1Id = await ctx.db.insert("floors", {
    siteId,
    areaNumber: "02",
    name: "Floor 1",
    width: 1200,
    height: 800,
    active: true,
    createdAt: Date.now(),
  });

  const floor2Id = await ctx.db.insert("floors", {
    siteId,
    areaNumber: "03",
    name: "Floor 2 - Server Room",
    width: 1200,
    height: 800,
    active: true,
    createdAt: Date.now(),
  });

  // Create sensors on Floor 2 (Server Room) - matching the SIA messages we receive
  const sensors = [
    {
      floorId: floor2Id,
      accountNumber: "223010",
      name: "Server Room Main Door",
      type: "door",
      zone: "223",
      positionX: 600,
      positionY: 400,
    },
    {
      floorId: floor2Id,
      accountNumber: "223011",
      name: "Server Room Emergency Exit",
      type: "door",
      zone: "223",
      positionX: 900,
      positionY: 300,
    },
    {
      floorId: floor2Id,
      accountNumber: "223012",
      name: "Server Rack Fire Alarm",
      type: "fire",
      zone: "223",
      positionX: 700,
      positionY: 450,
    },
    {
      floorId: groundFloorId,
      accountNumber: "101001",
      name: "Main Entrance",
      type: "door",
      zone: "101",
      positionX: 600,
      positionY: 700,
    },
    {
      floorId: groundFloorId,
      accountNumber: "101002",
      name: "Reception Area Motion",
      type: "motion",
      zone: "101",
      positionX: 700,
      positionY: 500,
    },
    {
      floorId: floor1Id,
      accountNumber: "201001",
      name: "Office Area Door",
      type: "door",
      zone: "201",
      positionX: 500,
      positionY: 400,
    },
    {
      floorId: floor1Id,
      accountNumber: "201002",
      name: "Conference Room Panic Button",
      type: "panic",
      zone: "201",
      positionX: 800,
      positionY: 300,
    },
  ];

  for (const sensor of sensors) {
    await ctx.db.insert("sensors", {
      ...sensor,
      active: true,
      createdAt: Date.now(),
    });
  }

  return {
    message: "Site map data created successfully",
    siteId,
    floors: 3,
    sensors: sensors.length,
  };
});
