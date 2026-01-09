/**
 * Seed Scenario Testing Account
 * 
 * Creates 4 accounts with areas and sensors:
 * - Account 1111: Riyadh Security Complex (Saudi Arabia)
 * - Account 2222: Jeddah Commercial Center (Saudi Arabia) 
 * - Account 3333: Dubai Testing Facility (UAE) - Main scenario testing
 * - Account 4444: Abu Dhabi Corporate HQ (UAE)
 * 
 * Each account has 4 areas with 8 sensors per area and floor plan images
 * Scenario alerts target Account 3333 for AI analysis testing
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedScenarioAccount = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🌱 Seeding Scenario Testing Account...");

    // Get a system user (any admin user)
    const systemUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (!systemUser) {
      throw new Error("No admin user found. Please create an admin user first.");
    }

    // Clean up ALL existing data
    console.log("⚠️  Cleaning up existing data...");
    
    const allSites = await ctx.db.query("sites").collect();
    for (const site of allSites) {
      // Delete sensors for this site
      const floors = await ctx.db
        .query("floors")
        .filter((q) => q.eq(q.field("siteId"), site._id))
        .collect();
      
      for (const floor of floors) {
        const sensors = await ctx.db
          .query("sensors")
          .filter((q) => q.eq(q.field("floorId"), floor._id))
          .collect();
        
        for (const sensor of sensors) {
          await ctx.db.delete(sensor._id);
        }
        
        await ctx.db.delete(floor._id);
      }
      
      await ctx.db.delete(site._id);
    }
    
    console.log(`   Deleted ${allSites.length} sites and all related data`);

    // Sample floor plan URLs (from S3)
    const floorPlanUrls = [
      "https://zapsight.s3.ap-south-1.amazonaws.com/ChatGPT+Image+Jan+7%2C+2026%2C+07_18_58+PM.png",
      "https://zapsight.s3.ap-south-1.amazonaws.com/ChatGPT+Image+Jan+7%2C+2026%2C+07_21_23+PM.png",
      "https://zapsight.s3.ap-south-1.amazonaws.com/ChatGPT+Image+Jan+7%2C+2026%2C+07_21_24+PM.png",
      "https://zapsight.s3.ap-south-1.amazonaws.com/ChatGPT+Image+Jan+7%2C+2026%2C+07_26_28+PM.png",
    ];

    // ========== ACCOUNT 1111 - Riyadh Security Complex ==========
    console.log("\n📍 Creating Account 1111 - Riyadh Security Complex...");
    
    const account1111 = await ctx.db.insert("sites", {
      accountNumber: "1111",
      name: "Riyadh Security Complex",
      description: "King Fahd District, Riyadh, Saudi Arabia - Primary security monitoring facility",
      address: "King Fahd District, Riyadh, Saudi Arabia",
      city: "Riyadh",
      state: "Riyadh Province",
      country: "Saudi Arabia",
      latitude: 25.0800,
      longitude: 55.1400,
      active: true,
      createdAt: Date.now(),
      createdBy: systemUser._id,
    });

    await createAreasAndSensors(ctx, account1111, "1111", floorPlanUrls);
    console.log("✅ Created Account 1111 with 4 areas and 32 sensors");

    // ========== ACCOUNT 2222 - Jeddah Commercial Center ==========
    console.log("\n📍 Creating Account 2222 - Jeddah Commercial Center...");
    
    const account2222 = await ctx.db.insert("sites", {
      accountNumber: "2222",
      name: "Jeddah Commercial Center",
      description: "Al Andalus District, Jeddah, Saudi Arabia - Commercial business center",
      address: "Al Andalus District, Jeddah, Saudi Arabia",
      city: "Jeddah",
      state: "Makkah Province",
      country: "Saudi Arabia",
      latitude: 25.0600,
      longitude: 55.1300,
      active: true,
      createdAt: Date.now(),
      createdBy: systemUser._id,
    });

    await createAreasAndSensors(ctx, account2222, "2222", floorPlanUrls);
    console.log("✅ Created Account 2222 with 4 areas and 32 sensors");

    // ========== ACCOUNT 3333 - Dubai Testing Facility ==========
    console.log("\n📍 Creating Account 3333 - Dubai Testing Facility (SCENARIO TARGET)...");
    
    const accountId = await ctx.db.insert("sites", {
      accountNumber: "3333",
      name: "AI Scenario Testing Facility",
      description: "Dubai Marina, Dubai, UAE - Testing facility for AI alert analysis scenarios",
      address: "Dubai Marina, Dubai, UAE",
      city: "Dubai",
      state: "Dubai",
      country: "United Arab Emirates",
      latitude: 25.0772,
      longitude: 55.1387,
      active: true,
      createdAt: Date.now(),
      createdBy: systemUser._id,
    });

    await createAreasAndSensors(ctx, accountId, "3333", floorPlanUrls);
    console.log("✅ Created Account 3333 with 4 areas and 32 sensors");

    // ========== ACCOUNT 4444 - Abu Dhabi Corporate HQ ==========
    console.log("\n📍 Creating Account 4444 - Abu Dhabi Corporate HQ...");
    
    const account4444 = await ctx.db.insert("sites", {
      accountNumber: "4444",
      name: "Abu Dhabi Corporate Headquarters",
      description: "Al Maryah Island, Abu Dhabi, UAE - Corporate headquarters facility",
      address: "Al Maryah Island, Abu Dhabi, UAE",
      city: "Abu Dhabi",
      state: "Abu Dhabi",
      country: "United Arab Emirates",
      latitude: 25.0900,
      longitude: 55.1500,
      active: true,
      createdAt: Date.now(),
      createdBy: systemUser._id,
    });

    await createAreasAndSensors(ctx, account4444, "4444", floorPlanUrls);
    console.log("✅ Created Account 4444 with 4 areas and 32 sensors");

    console.log("\n" + "═".repeat(80));
    console.log("🎉 SCENARIO ACCOUNT SEEDING COMPLETE");
    console.log("═".repeat(80));
    console.log("✅ Accounts Created: 4 (1111, 2222, 3333, 4444)");
    console.log("✅ Areas per Account: 4 (01, 02, 03, 04)");
    console.log("✅ Sensors per Area: 8");
    console.log("✅ Total Sensors: 128 (32 per account)");
    console.log("\n📋 Account Breakdown:");
    console.log("   1111: Riyadh Security Complex (Saudi Arabia)");
    console.log("   2222: Jeddah Commercial Center (Saudi Arabia)");
    console.log("   3333: Dubai Testing Facility (UAE) - SCENARIO TARGET");
    console.log("   4444: Abu Dhabi Corporate HQ (UAE)");
    console.log("\n🎯 Scenario testing ready on Account 3333!");
    console.log("═".repeat(80) + "\n");

    return {
      success: true,
      accountsCreated: 4,
      areasCreated: 16,
      sensorsCreated: 128,
    };
  },
});

// Helper function to create areas and sensors for an account
async function createAreasAndSensors(
  ctx: any,
  accountId: any,
  accountNumber: string,
  floorPlanUrls: string[]
) {
  // Define 4 Areas with 8 Sensors each
  const areasConfig = [
      {
        areaNumber: "01",
        name: "Ground Floor - Main Entrance & Lobby",
        description: "Reception area, main entrance, lobby security",
        sensors: [
          { zone: "001", name: "Main Entrance Door", type: "Entry/Exit Door Contact", category: "Burglary" },
          { zone: "002", name: "Lobby Motion Detector", type: "PIR Motion Sensor", category: "Burglary" },
          { zone: "003", name: "Reception Window", type: "Window Contact", category: "Burglary" },
          { zone: "004", name: "Reception Panic Button", type: "Panic Button", category: "Panic" },
          { zone: "005", name: "Lobby Glass Break", type: "Glass Break Detector", category: "Burglary" },
          { zone: "006", name: "Main Entrance Tamper", type: "Tamper Switch", category: "Burglary" },
          { zone: "007", name: "Lobby Smoke Detector", type: "Smoke Detector", category: "Fire" },
          { zone: "008", name: "Lobby Interior Motion", type: "PIR Motion Sensor", category: "Burglary" },
        ]
      },
      {
        areaNumber: "02",
        name: "First Floor - Offices & Storage",
        description: "Office spaces, storage rooms, meeting rooms",
        sensors: [
          { zone: "001", name: "Office 101 Door", type: "Entry/Exit Door Contact", category: "Burglary" },
          { zone: "002", name: "Storage Room Motion", type: "PIR Motion Sensor", category: "Burglary" },
          { zone: "003", name: "Office Window West", type: "Window Contact", category: "Burglary" },
          { zone: "004", name: "Back Door (Delivery)", type: "Entry/Exit Door Contact", category: "Burglary" },
          { zone: "005", name: "Meeting Room Glass", type: "Glass Break Detector", category: "Burglary" },
          { zone: "006", name: "Server Room Tamper", type: "Tamper Switch", category: "Burglary" },
          { zone: "007", name: "Office Smoke Detector", type: "Smoke Detector", category: "Fire" },
          { zone: "008", name: "Hallway Motion", type: "PIR Motion Sensor", category: "Burglary" },
        ]
      },
      {
        areaNumber: "03",
        name: "Second Floor - Executive & Medical",
        description: "Executive offices, medical room, emergency stations",
        sensors: [
          { zone: "001", name: "Executive Suite Door", type: "Entry/Exit Door Contact", category: "Burglary" },
          { zone: "002", name: "Executive Motion", type: "PIR Motion Sensor", category: "Burglary" },
          { zone: "003", name: "Balcony Door", type: "Entry/Exit Door Contact", category: "Burglary" },
          { zone: "004", name: "Conference Room Glass", type: "Glass Break Detector", category: "Burglary" },
          { zone: "005", name: "Medical Emergency Button", type: "Medical Panic Button", category: "Medical" },
          { zone: "006", name: "Executive Duress Button", type: "Silent Panic", category: "Panic" },
          { zone: "007", name: "Executive Smoke Detector", type: "Smoke Detector", category: "Fire" },
          { zone: "008", name: "Corridor Motion", type: "PIR Motion Sensor", category: "Burglary" },
        ]
      },
      {
        areaNumber: "04",
        name: "Basement - Technical & Parking",
        description: "Parking area, technical rooms, utilities",
        sensors: [
          { zone: "001", name: "Parking Entrance", type: "Entry/Exit Door Contact", category: "Burglary" },
          { zone: "002", name: "Parking Area Motion", type: "PIR Motion Sensor", category: "Burglary" },
          { zone: "003", name: "Technical Room Door", type: "Entry/Exit Door Contact", category: "Burglary" },
          { zone: "004", name: "Utility Room Motion", type: "PIR Motion Sensor", category: "Burglary" },
          { zone: "005", name: "Water Leak Sensor", type: "Water Leak Detector", category: "24 Hour" },
          { zone: "006", name: "Generator Room Tamper", type: "Tamper Switch", category: "Burglary" },
          { zone: "007", name: "Basement Smoke Detector", type: "Smoke Detector", category: "Fire" },
          { zone: "008", name: "Emergency Exit Motion", type: "PIR Motion Sensor", category: "Burglary" },
        ]
      }
    ];

    // Create Areas and Sensors
    for (let i = 0; i < areasConfig.length; i++) {
      const areaConfig = areasConfig[i];
      
      // Create Area (Floor) with floor plan URL
      const floorId = await ctx.db.insert("floors", {
        siteId: accountId,
        areaNumber: areaConfig.areaNumber,
        name: areaConfig.name,
        floorPlanUrl: floorPlanUrls[i % floorPlanUrls.length], // Cycle through floor plan URLs
        width: 1200, // Floor plan dimensions
        height: 800,
        active: true,
        createdAt: Date.now(),
      });

      // Create Sensors for this area
      for (const sensorConfig of areaConfig.sensors) {
        // Calculate position based on zone number for visual distribution (closer together)
        const zoneNum = parseInt(sensorConfig.zone);
        const positionX = 250 + ((zoneNum - 1) % 4) * 200; // Closer horizontal spacing
        const positionY = 200 + Math.floor((zoneNum - 1) / 4) * 150; // Closer vertical spacing
        
        await ctx.db.insert("sensors", {
          accountNumber: accountNumber,
          floorId: floorId,
          zone: sensorConfig.zone,
          name: sensorConfig.name,
          type: sensorConfig.type,
          positionX: positionX,
          positionY: positionY,
          active: true,
          createdAt: Date.now(),
        });
      }
    }
}
