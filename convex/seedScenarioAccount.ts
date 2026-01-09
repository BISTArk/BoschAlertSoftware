/**
 * Seed Scenario Testing Accounts
 * 
 * Creates 3 accounts for multi-location scenario testing:
 * - Account 3333: ATM Location (Dubai, UAE) - Burglary + Motion scenarios
 * - Account 4444: Branch 1 (Abu Dhabi, UAE) - Fire + Sensor Health scenarios
 * - Account 5555: Branch 2 (Riyadh, Saudi Arabia) - Communication + Medical + False Alarm scenarios
 * 
 * Each account has 4 areas with 8 sensors per area and floor plan images
 * Scenarios are distributed across accounts to test AI analysis in multi-location environment
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

    // ========== ACCOUNT 3333 - ATM Location ==========
    console.log("\n🏧 Creating Account 3333 - ATM Location...");
    
    const account3333 = await ctx.db.insert("sites", {
      accountNumber: "3333",
      name: "ATM - Downtown Dubai",
      description: "Dubai Marina ATM - High-security ATM location with burglary and motion detection",
      address: "Dubai Marina Walk, Dubai, UAE",
      city: "Dubai",
      state: "Dubai",
      country: "United Arab Emirates",
      latitude: 25.0772,
      longitude: 55.1387,
      active: true,
      createdAt: Date.now(),
      createdBy: systemUser._id,
    });

    await createAreasAndSensors(ctx, account3333, "3333", floorPlanUrls);
    console.log("✅ Created Account 3333 (ATM) with 4 areas and 32 sensors");
    console.log("   Scenarios: Burglary (Area 01 Zone 03), Motion Detection (Area 01 Zone 05)");

    // ========== ACCOUNT 4444 - Branch 1 ==========
    console.log("\n🏦 Creating Account 4444 - Branch 1...");
    
    const account4444 = await ctx.db.insert("sites", {
      accountNumber: "4444",
      name: "Branch 1 - Abu Dhabi Main",
      description: "Abu Dhabi Main Branch - Fire safety and sensor health monitoring",
      address: "Business Bay, Dubai, UAE",
      city: "Dubai",
      state: "Dubai",
      country: "United Arab Emirates",
      latitude: 25.1870,
      longitude: 55.2590,
      active: true,
      createdAt: Date.now(),
      createdBy: systemUser._id,
    });

    await createAreasAndSensors(ctx, account4444, "4444", floorPlanUrls);
    console.log("✅ Created Account 4444 (Branch 1) with 4 areas and 32 sensors");
    console.log("   Scenarios: Fire Emergency (Area 01-02 Zone 07), Sensor Health (Area 02 Zone 04)");

    // ========== ACCOUNT 5555 - Branch 2 ==========
    console.log("\n🏦 Creating Account 5555 - Branch 2...");
    
    const account5555 = await ctx.db.insert("sites", {
      accountNumber: "5555",
      name: "Branch 2 - Riyadh Central",
      description: "Riyadh Central Branch - Communication reliability and medical emergency response",
      address: "Jumeirah Beach Road, Dubai, UAE",
      city: "Dubai",
      state: "Dubai",
      country: "United Arab Emirates",
      latitude: 25.2048,
      longitude: 55.2708,
      active: true,
      createdAt: Date.now(),
      createdBy: systemUser._id,
    });

    await createAreasAndSensors(ctx, account5555, "5555", floorPlanUrls);
    console.log("✅ Created Account 4444 with 4 areas and 32 sensors");

    console.log("\n" + "═".repeat(80));
    console.log("🎉 SCENARIO ACCOUNT SEEDING COMPLETE");
    await createAreasAndSensors(ctx, account5555, "5555", floorPlanUrls);
    console.log("✅ Created Account 5555 (Branch 2) with 4 areas and 32 sensors");
    console.log("   Scenarios: Communication Failure (Area 01), Medical Emergency (Area 02 Zone 05), False Alarms (Area 03 Zone 08)");

    console.log("\n" + "═".repeat(80));
    console.log("🎉 SCENARIO ACCOUNTS SEEDED SUCCESSFULLY!");
    console.log("═".repeat(80));
    console.log("✅ Accounts Created: 3 (3333, 4444, 5555)");
    console.log("✅ Areas per Account: 4 (01, 02, 03, 04)");
    console.log("✅ Sensors per Area: 8");
    console.log("✅ Total Sensors: 96 (32 per account)");
    console.log("\n📋 Account Breakdown:");
    console.log("   3333: ATM - Downtown Dubai (UAE) - Burglary + Motion");
    console.log("   4444: Branch 1 - Abu Dhabi Main (UAE) - Fire + Sensor Health");
    console.log("   5555: Branch 2 - Riyadh Central (Saudi Arabia) - Communication + Medical + False Alarms");
    console.log("\n🎯 Multi-location scenario testing ready!");
    console.log("═".repeat(80) + "\n");

    return {
      success: true,
      accountsCreated: 3,
      areasCreated: 12,
      sensorsCreated: 96,
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
