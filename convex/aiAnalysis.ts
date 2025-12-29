/**
 * AI Analysis Functions for Alerts
 * Fetches context and triggers AI analysis for security alerts
 */

import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Get full context for an alert (for AI analysis)
 */
export const getAlertContext = query({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) return null;
    
    // Fetch site information
    let site = undefined;
    if (alert.accountNumber) {
      const siteDoc = await ctx.db
        .query("sites")
        .withIndex("by_account_number", (q) => q.eq("accountNumber", alert.accountNumber!))
        .first();
      
      if (siteDoc) {
        site = {
          name: siteDoc.name,
          address: siteDoc.address,
          city: siteDoc.city,
        };
      }
    }
    
    // Fetch area/floor information
    let area = undefined;
    if (alert.floorId) {
      const areaDoc = await ctx.db.get(alert.floorId);
      if (areaDoc) {
        area = {
          name: areaDoc.name,
        };
      }
    }
    
    // Fetch sensor information
    let sensor = undefined;
    if (alert.sensorId) {
      const sensorDoc = await ctx.db.get(alert.sensorId);
      if (sensorDoc) {
        sensor = {
          name: sensorDoc.name,
          type: sensorDoc.type,
          zone: sensorDoc.zone,
        };
      }
    }
    
    // Fetch recent alerts from same account (last 24 hours)
    const recentAlerts = [];
    if (alert.accountNumber) {
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      const alerts = await ctx.db
        .query("alerts")
        .withIndex("by_account", (q) => q.eq("accountNumber", alert.accountNumber))
        .filter((q) => 
          q.and(
            q.gte(q.field("receivedAt"), twentyFourHoursAgo),
            q.neq(q.field("_id"), args.alertId) // Exclude current alert
          )
        )
        .collect();
      
      for (const a of alerts) {
        // Fetch area/floor name for this alert
        let areaName = undefined;
        if (a.floorId) {
          const areaDoc = await ctx.db.get(a.floorId);
          if (areaDoc) {
            areaName = areaDoc.name;
          }
        }
        
        // Fetch sensor info for this alert
        let sensorName = undefined;
        let sensorType = undefined;
        if (a.sensorId) {
          const sensorDoc = await ctx.db.get(a.sensorId);
          if (sensorDoc) {
            sensorName = sensorDoc.name;
            sensorType = sensorDoc.type;
          }
        }
        
        recentAlerts.push({
          eventDescription: a.eventDescription || "",
          eventCategory: a.eventCategory || "",
          priority: a.priority || "medium",
          timestamp: a.receivedAt,
          zoneNumber: a.zoneNumber,
          areaNumber: a.areaNumber,
          areaName,
          sensorName,
          sensorType,
        });
      }
    }
    
    return {
      eventCode: alert.eventCode,
      eventDescription: alert.eventDescription,
      eventCategory: alert.eventCategory,
      priority: alert.priority,
      accountNumber: alert.accountNumber,
      areaNumber: alert.areaNumber,
      zoneNumber: alert.zoneNumber,
      userName: alert.userName,
      receivedAt: alert.receivedAt,
      site,
      area,
      sensor,
      recentAlerts,
    };
  },
});

/**
 * Update alert with AI analysis results
 */
export const updateAlertWithAIAnalysis = mutation({
  args: {
    alertId: v.id("alerts"),
    analysis: v.object({
      aiSummary: v.string(),
      aiRiskScore: v.number(),
      aiRiskLevel: v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      ),
      aiRecommendedActions: v.array(v.string()),
      aiReasoning: v.string(),
      aiEstimatedResponseTime: v.string(),
      aiAdditionalContext: v.string(),
      aiAnalyzedAt: v.number(),
      aiAnalysisDuration: v.number(), // Duration in milliseconds
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, args.analysis);
    console.log(`✅ Updated alert ${args.alertId} with AI analysis`);
  },
});

/**
 * Trigger AI analysis for an alert
 * This is an action (not a mutation) because it calls external AI API
 */
export const analyzeAlertWithAI = action({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, args) => {
    // Import AI analyzer (dynamic import to avoid bundling in Convex deployment)
    const { analyzeAlert } = await import("../server/aiAlertAnalyzer");
    
    // Fetch the alert context
    const alert = await ctx.runQuery(api.aiAnalysis.getAlertContext, {
      alertId: args.alertId,
    });
    
    if (!alert) {
      throw new Error("Alert not found");
    }
    
    // Build context for AI analysis
    const context = {
      alert: {
        eventCode: alert.eventCode || "",
        eventDescription: alert.eventDescription || "",
        eventCategory: alert.eventCategory || "",
        priority: alert.priority || "medium",
        accountNumber: alert.accountNumber || "",
        areaNumber: alert.areaNumber,
        zoneNumber: alert.zoneNumber,
        userName: alert.userName,
        timestamp: alert.receivedAt,
      },
      site: alert.site,
      area: alert.area,
      sensor: alert.sensor,
      recentAlerts: alert.recentAlerts || [],
      currentTime: new Date(),
    };
    
    // Capture start time
    const startTime = Date.now();
    
    // Call AI analyzer with API key from Convex environment
    const analysis = await analyzeAlert(context, process.env.OPENAI_API_KEY);
    
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Store AI analysis back in the alert
    await ctx.runMutation(api.aiAnalysis.updateAlertWithAIAnalysis, {
      alertId: args.alertId,
      analysis: {
        aiSummary: analysis.summary,
        aiRiskScore: analysis.riskScore,
        aiRiskLevel: analysis.riskLevel,
        aiRecommendedActions: analysis.recommendedActions,
        aiReasoning: analysis.reasoning,
        aiEstimatedResponseTime: analysis.estimatedResponseTime,
        aiAdditionalContext: analysis.additionalContext,
        aiAnalyzedAt: Date.now(),
        aiAnalysisDuration: duration,
      },
    });
    
    return analysis;
  },
});

