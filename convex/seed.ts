// Clear database and seed users
// Run with: npx convex run seed

import { internalMutation } from "./_generated/server";

export default internalMutation(async (ctx) => {
  console.log("🔄 Starting full database reset...");
  
  // Step 1: Clear all data
  console.log("🗑️  Starting database cleanup...");

  const alerts = await ctx.db.query("alerts").collect();
  for (const alert of alerts) {
    await ctx.db.delete(alert._id);
  }
  console.log(`✅ Deleted ${alerts.length} alerts`);

  const sensors = await ctx.db.query("sensors").collect();
  for (const sensor of sensors) {
    await ctx.db.delete(sensor._id);
  }
  console.log(`✅ Deleted ${sensors.length} sensors`);

  const floors = await ctx.db.query("floors").collect();
  for (const floor of floors) {
    await ctx.db.delete(floor._id);
  }
  console.log(`✅ Deleted ${floors.length} floors`);

  const sites = await ctx.db.query("sites").collect();
  for (const site of sites) {
    await ctx.db.delete(site._id);
  }
  console.log(`✅ Deleted ${sites.length} sites`);

  const users = await ctx.db.query("users").collect();
  for (const user of users) {
    await ctx.db.delete(user._id);
  }
  console.log(`✅ Deleted ${users.length} users`);

  const deletedCounts = {
    alerts: alerts.length,
    sensors: sensors.length,
    floors: floors.length,
    sites: sites.length,
    users: users.length,
  };
  
  // Step 2: Seed users
  console.log("👥 Seeding users...");

  const newUsers = [
    {
      username: "admin",
      password: "admin123",
      name: "System Administrator",
      role: "admin" as const,
      active: true,
      available: true,
      customerAccounts: [],
      createdAt: Date.now(),
    },
    {
      username: "head1",
      password: "head123",
      name: "Security Head",
      role: "head" as const,
      active: true,
      available: true,
      customerAccounts: ["1234", "5678"],
      createdAt: Date.now(),
    },
    {
      username: "guard1",
      password: "guard123",
      name: "Guard One",
      role: "guard" as const,
      active: true,
      available: true,
      customerAccounts: ["1234"],
      createdAt: Date.now(),
    },
    {
      username: "guard2",
      password: "guard123",
      name: "Guard Two",
      role: "guard" as const,
      active: true,
      available: true,
      customerAccounts: ["5678"],
      createdAt: Date.now(),
    },
    {
      username: "guard3",
      password: "guard123",
      name: "Guard Three",
      role: "guard" as const,
      active: true,
      available: false,
      customerAccounts: ["1234", "5678"],
      createdAt: Date.now(),
    },
  ];

  const createdUsers = [];
  for (const user of newUsers) {
    const userId = await ctx.db.insert("users", user);
    createdUsers.push({ id: userId, username: user.username, role: user.role });
  }

  console.log(`✅ Created ${newUsers.length} users`);
  console.log("✨ Database reset complete!");
  
  return {
    message: "Database cleared and users seeded successfully",
    cleared: deletedCounts,
    seeded: newUsers.length,
    users: createdUsers,
  };
});
