// Create initial users for testing
// Run with: npx convex run seed:seedUsers

import { internalMutation } from "./_generated/server";

export default internalMutation(async (ctx) => {
  // Check if users already exist
  const existingUsers = await ctx.db.query("users").collect();
  
  if (existingUsers.length > 0) {
    console.log("Users already exist. Skipping seed.");
    return { message: "Users already exist", count: existingUsers.length };
  }

  // Create sample users
  const users = [
    {
      username: "admin",
      password: "admin123",
      name: "System Administrator",
      role: "admin" as const,
      active: true,
      createdAt: Date.now(),
    },
    {
      username: "head1",
      password: "head123",
      name: "Security Head",
      role: "head" as const,
      active: true,
      createdAt: Date.now(),
    },
    {
      username: "guard1",
      password: "guard123",
      name: "Guard One",
      role: "guard" as const,
      active: true,
      createdAt: Date.now(),
    },
    {
      username: "guard2",
      password: "guard123",
      name: "Guard Two",
      role: "guard" as const,
      active: true,
      createdAt: Date.now(),
    },
  ];

  for (const user of users) {
    await ctx.db.insert("users", user);
  }

  return { message: "Users created successfully", count: users.length };
});
