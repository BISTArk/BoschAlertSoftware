// Migrate existing alerts to add status field
// Run with: npx convex run migrations:setDefaultStatus

import { internalMutation } from "./_generated/server";

export default internalMutation(async (ctx) => {
  const alerts = await ctx.db.query("alerts").collect();
  
  let updated = 0;
  for (const alert of alerts) {
    if (!alert.status) {
      await ctx.db.patch(alert._id, {
        status: "unassigned" as const,
      });
      updated++;
    }
  }

  return { message: "Migration completed", alertsUpdated: updated, totalAlerts: alerts.length };
});

// Migration to set all guards as available by default
// Run with: npx convex run migrations:setGuardsAvailable
export const setGuardsAvailable = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    let updated = 0;
    for (const user of users) {
      if (user.role === "guard" && user.available === undefined) {
        await ctx.db.patch(user._id, { available: true });
        updated++;
      }
    }
    
    return { message: "Migration completed", guardsUpdated: updated };
  },
});
