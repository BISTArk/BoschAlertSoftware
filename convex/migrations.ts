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
