/**
 * AI Alert Analyzer
 * Uses AI to generate summaries, risk scores, and recommended actions for security alerts
 */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Predefined action types that can be recommended
export const ALERT_ACTIONS = [
  "dispatch_security_team",
  "dispatch_police",
  "dispatch_fire_department",
  "dispatch_medical",
  "lockdown_area",
  "evacuate_building",
  "investigate_remotely",
  "verify_with_camera",
  "contact_site_manager",
  "contact_tenant",
  "silence_alarm",
  "reset_sensor",
  "acknowledge_and_monitor",
  "no_action_required",
  "schedule_maintenance",
  "check_system_status",
] as const;

export type AlertAction = typeof ALERT_ACTIONS[number];

// Schema for AI response
const AlertAnalysisSchema = z.object({
  // English fields
  summary: z.string().describe("A concise 2-3 sentence summary of the alert situation, including context and severity"),
  riskScore: z.number().min(0).max(100).describe("Risk score from 0-100, where 0 is no risk and 100 is critical emergency"),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).describe("Categorical risk level"),
  recommendedActions: z.array(z.enum(ALERT_ACTIONS as any)).min(1).max(5).describe("1-5 recommended actions in order of priority"),
  reasoning: z.string().describe("Brief explanation of why these actions are recommended"),
  estimatedResponseTime: z.string().describe("Suggested response time (e.g., 'immediate', '5 minutes', '15 minutes', '1 hour')"),
  additionalContext: z.string().describe("Any additional context or considerations (use 'None' if not applicable)"),
  
  // Arabic translations
  summaryAr: z.string().describe("Arabic translation of the summary"),
  reasoningAr: z.string().describe("Arabic translation of the reasoning"),
  estimatedResponseTimeAr: z.string().describe("Arabic translation of the estimated response time"),
  additionalContextAr: z.string().describe("Arabic translation of the additional context"),
});

export type AlertAnalysis = z.infer<typeof AlertAnalysisSchema>;

interface AlertContext {
  // Current alert
  alert: {
    eventCode: string;
    eventDescription: string;
    eventCategory: string;
    priority: string;
    accountNumber: string;
    areaNumber?: string;
    zoneNumber?: string;
    userName?: string;
    timestamp: number;
  };
  
  // Site/Account information
  site?: {
    name: string;
    address?: string;
    city?: string;
  };
  
  // Area/Floor information
  area?: {
    name: string;
  };
  
  // Sensor information
  sensor?: {
    name: string;
    type: string;
    zone: string;
  };
  
  // Recent alerts from same account (last 24 hours)
  recentAlerts?: Array<{
    eventDescription: string;
    eventCategory: string;
    priority: string;
    timestamp: number;
    zoneNumber?: string;
    areaNumber?: string;
    areaName?: string;
    sensorName?: string;
    sensorType?: string;
  }>;
  
  // Current time context
  currentTime: Date;
}

/**
 * Generate AI analysis for a security alert
 * @param context - Full context about the alert, site, and recent activity
 * @param apiKey - OpenAI API key (from environment variable)
 * @returns AI-generated analysis with summary, risk score, and recommended actions
 * @throws Error if API key is missing or AI analysis fails
 */
export async function analyzeAlert(
  context: AlertContext,
  apiKey?: string
): Promise<AlertAnalysis> {
  const key = apiKey || process.env.OPENAI_API_KEY;
  
  if (!key) {
    throw new Error("OpenAI API key not found. Set OPENAI_API_KEY environment variable to enable AI analysis.");
  }

  // Build comprehensive prompt with all context
  const prompt = buildAnalysisPrompt(context);
  
  console.log("🤖 Requesting AI analysis for alert...");

  const { object } = await generateObject({
    model: openai('gpt-5-mini'),
    schema: AlertAnalysisSchema,
    prompt,
    providerOptions: {
      openai: {
        reasoningEffort: 'minimal',
      },
    },
  });

  console.log(`✅ AI Analysis: Risk ${object.riskScore}/100 (${object.riskLevel}) - ${object.recommendedActions.length} actions`);
  
  return object;
}

/**
 * Build detailed prompt for AI analysis
 */
function buildAnalysisPrompt(context: AlertContext): string {
  console.log("🧠 Building AI analysis prompt...", context);
  const { alert, site, area, sensor, recentAlerts, currentTime } = context;
  
  const timeOfDay = getTimeOfDay(currentTime);
  const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  
  let prompt = `You are a security operations AI assistant analyzing a security alert. Provide a professional analysis.

**CURRENT ALERT:**
- Event: ${alert.eventDescription} (Code: ${alert.eventCode})
- Category: ${alert.eventCategory}
- Priority: ${alert.priority}
- Time: ${new Date(alert.timestamp).toLocaleString()} (${timeOfDay}, ${dayOfWeek})`;

  if (site) {
    prompt += `\n\n**LOCATION:**
- Site: ${site.name}`;
    if (site.address) prompt += `\n- Address: ${site.address}`;
    if (site.city) prompt += `\n- City: ${site.city}`;
  }

  if (area) {
    prompt += `\n- Area: ${area.name}`;
  }

  if (sensor) {
    prompt += `\n\n**SENSOR:**
- Name: ${sensor.name}
- Type: ${sensor.type}
- Zone: ${sensor.zone}`;
  }

  if (alert.userName) {
    prompt += `\n- User: ${alert.userName}`;
  }

  if (recentAlerts && recentAlerts.length > 0) {
    prompt += `\n\n**RECENT ALERTS (Last 24h):**`;
    prompt += `\nAnalyze these recent alerts to identify patterns (e.g., fire spreading, intruder movement, escalating situation):`;
    recentAlerts.slice(0, 5).forEach((ra, idx) => {
      const timeAgo = getTimeAgo(currentTime.getTime() - ra.timestamp);
      let alertLine = `\n${idx + 1}. ${ra.eventDescription} (${ra.priority}) - ${timeAgo} ago`;
      
      // Add location details
      const locationParts = [];
      if (ra.areaName) locationParts.push(`Area: ${ra.areaName}`);
      if (ra.zoneNumber) locationParts.push(`Zone ${ra.zoneNumber}`);
      if (locationParts.length > 0) {
        alertLine += ` | ${locationParts.join(', ')}`;
      }
      
      // Add sensor details
      if (ra.sensorName || ra.sensorType) {
        const sensorParts = [];
        if (ra.sensorName) sensorParts.push(ra.sensorName);
        if (ra.sensorType) sensorParts.push(`(${ra.sensorType})`);
        alertLine += ` | Sensor: ${sensorParts.join(' ')}`;
      }
      
      prompt += alertLine;
    });
    
    if (recentAlerts.length > 5) {
      prompt += `\n... and ${recentAlerts.length - 5} more alerts`;
    }
  } else {
    prompt += `\n\n**RECENT ALERTS:** None in the last 24 hours (this is the first alert)`;
  }

  prompt += `\n\n**YOUR TASK:**
Analyze this security alert and provide:
1. A clear, actionable summary for security personnel (in English, with markdown formatting)
2. An accurate risk score (0-100) based on severity, context, and patterns
3. The top 1-5 recommended actions from the available action list
4. Reasoning for your recommendations (in English, with markdown formatting)
5. Suggested response time (in English)
6. Arabic translations of all text fields (summary, reasoning, response time, and additional context, with markdown formatting)

**FORMATTING INSTRUCTIONS:**
- Use **bold** for important terms, locations, and critical information
- Use *italic* for emphasis or context
- Use bullet points (- or •) for lists when appropriate
- Keep formatting natural and enhance readability

**AVAILABLE ACTIONS:**
${ALERT_ACTIONS.join(', ')}

Consider:
- Is this a real emergency or likely a false alarm?
- Does the pattern of recent alerts suggest escalation or an ongoing incident?
- Are multiple zones/sensors triggering in sequence? (e.g., fire spreading, intruder moving through building)
- Does the location and sensor data tell a story? (e.g., "smoke detector in zone 1, then fire alarm in zone 2, then zone 3 - fire is spreading")
- What is the appropriate response based on the event type, time of day, and location?
- Should multiple teams be dispatched or is remote verification sufficient?
- Build a narrative: What is actually happening based on all the evidence?

**IMPORTANT - ARABIC TRANSLATION:**
Provide accurate Arabic translations for:
- summaryAr: Full Arabic translation of your English summary (with markdown formatting)
- reasoningAr: Full Arabic translation of your reasoning (with markdown formatting)
- estimatedResponseTimeAr: Arabic translation of the response time (e.g., "فوري" for immediate, "5 دقائق" for 5 minutes)
- additionalContextAr: Arabic translation of additional context (use "لا يوجد" if none, with markdown formatting)

Ensure Arabic text is natural, professional, and appropriate for security operations personnel.`;

  return prompt;
}

/**
 * Get time of day description
 */
function getTimeOfDay(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

/**
 * Get human-readable time ago
 */
function getTimeAgo(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return "just now";
}