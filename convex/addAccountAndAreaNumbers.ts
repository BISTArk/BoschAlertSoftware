// Migration to add accountNumber to sites and areaNumber to floors
// Run with: npx convex run addAccountAndAreaNumbers

import { internalMutation } from "./_generated/server";

export default internalMutation(async (ctx) => {
  console.log("🔄 Starting migration: Adding accountNumber and areaNumber fields...");

  // Update sites with account numbers
  const sites = await ctx.db.query("sites").collect();
  console.log(`Found ${sites.length} sites to update`);

  for (const site of sites) {
    // Extract account number from site name or generate from ID
    let accountNumber = "9999"; // Default fallback
    
    // Try to extract from name (e.g., "Account 3333" or "3333 - Name")
    const accountMatch = site.name.match(/(\d{4})/);
    if (accountMatch) {
      accountNumber = accountMatch[1];
    } else {
      // Generate account number from timestamp + random
      accountNumber = String(1000 + sites.indexOf(site));
    }

    await ctx.db.patch(site._id, {
      accountNumber: accountNumber,
    });
    
    console.log(`✅ Site "${site.name}" → Account ${accountNumber}`);
  }

  // Update floors with area numbers
  const floors = await ctx.db.query("floors").collect();
  console.log(`\nFound ${floors.length} floors to update`);

  for (const floor of floors) {
    // Extract area number from floor name
    let areaNumber = "01"; // Default
    
    // Try to extract from name (e.g., "Area 01" or "01 - Name")
    const areaMatch = floor.name.match(/Area\s+(\d{2})|^(\d{2})\s*-/);
    if (areaMatch) {
      areaNumber = areaMatch[1] || areaMatch[2];
    }

    await ctx.db.patch(floor._id, {
      areaNumber: areaNumber,
    });
    
    console.log(`✅ Floor "${floor.name}" → Area ${areaNumber}`);
  }

  // Update sensors to ensure zone is required
  const sensors = await ctx.db.query("sensors").collect();
  console.log(`\nFound ${sensors.length} sensors to check`);

  for (const sensor of sensors) {
    if (!sensor.zone) {
      // Generate zone number from sensor name or use a default
      const zoneMatch = sensor.name.match(/(\d{4})/);
      const zone = zoneMatch ? zoneMatch[1] : String(sensors.indexOf(sensor) + 1).padStart(4, '0');
      
      await ctx.db.patch(sensor._id, {
        zone: zone,
      });
      
      console.log(`✅ Sensor "${sensor.name}" → Zone ${zone}`);
    }
  }

  console.log("\n✅ Migration complete!");
  return {
    success: true,
    sitesUpdated: sites.length,
    floorsUpdated: floors.length,
    sensorsUpdated: sensors.filter(s => !s.zone).length,
  };
});
