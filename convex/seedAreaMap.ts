// Seed area-based site map data matching area-mapping.json structure
// Run with: npx convex run seedAreaMap:default

import { internalMutation } from "./_generated/server";

export default internalMutation(async (ctx) => {
  console.log("🏢 Starting area-based site map seeding...");

  // Get admin user to create the sites
  const admin = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("role"), "admin"))
    .first();

  if (!admin) {
    return { error: "No admin user found. Run seed:default first to create users." };
  }

  // Clear existing data
  console.log("🗑️  Clearing existing site map data...");
  const sensors = await ctx.db.query("sensors").collect();
  for (const sensor of sensors) {
    await ctx.db.delete(sensor._id);
  }
  const floors = await ctx.db.query("floors").collect();
  for (const floor of floors) {
    await ctx.db.delete(floor._id);
  }
  const sites = await ctx.db.query("sites").collect();
  for (const site of sites) {
    await ctx.db.delete(site._id);
  }
  console.log(`✅ Cleared ${sensors.length} sensors, ${floors.length} floors, ${sites.length} sites`);

  // ========== Account 3333 - Bosch Security Campus ==========
  console.log("📍 Creating Account 3333 - Bosch Security Campus...");
  
  const site3333 = await ctx.db.insert("sites", {
    accountNumber: "3333",
    name: "AISAC Security Campus - Riyadh",
    description: "Main campus security facility",
    address: "King Abdulaziz Road, Riyadh",
    latitude: 24.7136,
    longitude: 46.6753,
    city: "Riyadh",
    state: "Riyadh Province",
    country: "Saudi Arabia",
    active: true,
    createdAt: Date.now(),
    createdBy: admin._id,
  });

  // Area 01 - Main Building Ground Floor
  const area3333_01 = await ctx.db.insert("floors", {
    siteId: site3333,
    areaNumber: "01",
    name: "Area 01 - Main Building Ground Floor",
    width: 1000,
    height: 800,
    active: true,
    createdAt: Date.now(),
  });

  // Sensors for Area 3333-01
  await ctx.db.insert("sensors", {
    floorId: area3333_01,
    accountNumber: "3333",
    name: "User Access Point",
    type: "access_control",
    zone: "0001",
    positionX: 150,
    positionY: 400,
    icon: "door",
    color: "#3b82f6",
    active: true,
    createdAt: Date.now(),
  });

  await ctx.db.insert("sensors", {
    floorId: area3333_01,
    accountNumber: "3333",
    name: "Point 5 - Monitoring Station",
    type: "panic",
    zone: "0005",
    positionX: 500,
    positionY: 300,
    icon: "alert",
    color: "#ef4444",
    active: true,
    createdAt: Date.now(),
  });

  await ctx.db.insert("sensors", {
    floorId: area3333_01,
    accountNumber: "3333",
    name: "Zone 8 - Main Entrance",
    type: "motion",
    zone: "0008",
    positionX: 200,
    positionY: 500,
    icon: "sensor",
    color: "#f97316",
    active: true,
    createdAt: Date.now(),
  });

  console.log("✅ Created Area 01 with 3 sensors (zones 0001, 0005, 0008)");

  // Area 02 - Main Building First Floor
  const area3333_02 = await ctx.db.insert("floors", {
    siteId: site3333,
    areaNumber: "02",
    name: "Area 02 - Main Building First Floor",
    width: 1000,
    height: 800,
    active: true,
    createdAt: Date.now(),
  });

  // Sensors for Area 3333-02
  await ctx.db.insert("sensors", {
    floorId: area3333_02,
    accountNumber: "3333",
    name: "Conference Room Entry",
    type: "door",
    zone: "0010",
    positionX: 300,
    positionY: 200,
    icon: "door",
    color: "#3b82f6",
    active: true,
    createdAt: Date.now(),
  });

  await ctx.db.insert("sensors", {
    floorId: area3333_02,
    accountNumber: "3333",
    name: "Server Room Motion",
    type: "motion",
    zone: "0011",
    positionX: 700,
    positionY: 400,
    icon: "sensor",
    color: "#f97316",
    active: true,
    createdAt: Date.now(),
  });

  console.log("✅ Created Area 02 with 2 sensors (zones 0010, 0011)");

  // ========== Account 2222 - Electronics City ==========
  console.log("📍 Creating Account 2222 - Electronics City...");
  
  const site2222 = await ctx.db.insert("sites", {
    accountNumber: "2222",
    name: "Secondary Security Site - Riyadh Mall",
    description: "Warehouse and server facility",
    address: "Riyadh Mall, Riyadh",
    latitude: 24.6974,
    longitude: 46.6844,
    city: "Riyadh",
    state: "Riyadh Province",
    country: "Saudi Arabia",
    active: true,
    createdAt: Date.now(),
    createdBy: admin._id,
  });

  // Area 01 - Warehouse Floor
  const area2222_01 = await ctx.db.insert("floors", {
    siteId: site2222,
    areaNumber: "01",
    name: "Area 01 - Warehouse Floor",
    width: 1200,
    height: 900,
    active: true,
    createdAt: Date.now(),
  });

  // Sensors for Area 2222-01
  await ctx.db.insert("sensors", {
    floorId: area2222_01,
    accountNumber: "2222",
    name: "Loading Dock Entry",
    type: "door",
    zone: "0001",
    positionX: 200,
    positionY: 600,
    icon: "door",
    color: "#3b82f6",
    active: true,
    createdAt: Date.now(),
  });

  await ctx.db.insert("sensors", {
    floorId: area2222_01,
    accountNumber: "2222",
    name: "Warehouse Motion Sensor",
    type: "motion",
    zone: "0002",
    positionX: 600,
    positionY: 400,
    icon: "sensor",
    color: "#f97316",
    active: true,
    createdAt: Date.now(),
  });

  console.log("✅ Created Area 01 with 2 sensors (zones 0001, 0002)");

  // ========== Account 1111 - Whitefield ==========
  console.log("📍 Creating Account 1111 - Whitefield...");
  
  const site1111 = await ctx.db.insert("sites", {
    accountNumber: "1111",
    name: "Branch Office - Kingdom Centre",
    description: "Branch office location",
    address: "Kingdom Centre, Riyadh",
    latitude: 24.7114,
    longitude: 46.6744,
    city: "Riyadh",
    state: "Riyadh Province",
    country: "Saudi Arabia",
    active: true,
    createdAt: Date.now(),
    createdBy: admin._id,
  });

  // Area 01 - Reception and Office
  const area1111_01 = await ctx.db.insert("floors", {
    siteId: site1111,
    areaNumber: "01",
    name: "Area 01 - Reception and Office",
    width: 800,
    height: 600,
    active: true,
    createdAt: Date.now(),
  });

  // Sensors for Area 1111-01
  await ctx.db.insert("sensors", {
    floorId: area1111_01,
    accountNumber: "1111",
    name: "Reception Entrance",
    type: "door",
    zone: "0001",
    positionX: 400,
    positionY: 300,
    icon: "door",
    color: "#3b82f6",
    active: true,
    createdAt: Date.now(),
  });

  console.log("✅ Created Area 01 with 1 sensor (zone 0001)");

  console.log("\n📊 Summary:");
  console.log("  • Account 3333: 2 areas, 5 sensors");
  console.log("  • Account 2222: 1 area, 2 sensors");
  console.log("  • Account 1111: 1 area, 1 sensor");
  console.log("  • Total: 3 sites, 4 areas, 8 sensors");
  console.log("\n✅ Area-based site map seeding complete!");

  return {
    success: true,
    sites: 3,
    areas: 4,
    sensors: 8,
    accounts: ["3333", "2222", "1111"],
  };
});
