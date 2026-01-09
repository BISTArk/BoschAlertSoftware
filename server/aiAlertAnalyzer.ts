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
    falsePositive?: boolean;
    falsePositiveReason?: string;
  }>;
  
  // Current time context
  currentTime: Date;
}

/**
 * Generate AI analysis for a security alert
 * @param context - Full context about the alert, site, and recent activity
 * @param apiKey - OpenAI API key (from environment variable)
 * @returns AI-generated analysis with summary, risk score, and recommended actions
 */
export async function analyzeAlert(
  context: AlertContext,
  apiKey?: string
): Promise<AlertAnalysis> {
  const key = apiKey || process.env.OPENAI_API_KEY;
  
  // Try AI analysis first
  try {
    if (!key) {
      console.warn("⚠️  No OpenAI API key found, using fallback analysis");
      return generateFallbackAnalysis(context);
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
  } catch (error) {
    console.error("❌ AI analysis failed:", error);
    console.log("🔄 Using fallback analysis for demo...");
    return generateFallbackAnalysis(context);
  }
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
    prompt += `\nAnalyze these recent alerts to identify patterns (e.g., fire spreading, intruder movement, escalating situation, recurring false alarms):`;
    
    // Count false positives and real alerts
    const falsePositiveCount = recentAlerts.filter(ra => ra.falsePositive).length;
    const realAlertCount = recentAlerts.length - falsePositiveCount;
    
    if (falsePositiveCount > 0 || realAlertCount > 0) {
      prompt += `\n\n**PATTERN SUMMARY:**`;
      if (realAlertCount > 0) {
        prompt += `\n- **${realAlertCount} REAL alert(s)** (not marked false positive) - SIGNIFICANT`;
      }
      if (falsePositiveCount > 0) {
        prompt += `\n- ${falsePositiveCount} false positive(s) (previously verified as non-threats)`;
      }
    }
    
    prompt += `\n`;
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
      
      // Add false positive indicator
      if (ra.falsePositive) {
        alertLine += ` | ⚠️ **FALSE POSITIVE**`;
        if (ra.falsePositiveReason) {
          alertLine += ` (${ra.falsePositiveReason})`;
        }
      } else {
        alertLine += ` | ✓ Real alert (not marked false)`;
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

**CRITICAL ANALYSIS GUIDELINES:**

**FALSE POSITIVE PATTERN DETECTION:**
- If the SAME zone/sensor has triggered multiple times and previous alerts were marked **FALSE POSITIVE**, this is likely another false alarm
- **REDUCE risk score by 20-40 points** if there are 2+ false positives from the same zone recently
- In summary, mention "Recurring false alarm pattern detected - Zone X has triggered Y times in 24h, previous alerts marked false positive"
- Recommend: acknowledge_and_monitor, schedule_maintenance, reset_sensor (NOT emergency dispatch)
- Example: If Zone 008 triggered 4 times and first 3 were false positives, this 4th alert is likely also false (Risk: 30-40/100)

**ESCALATING REAL THREAT DETECTION:**
- If previous alerts from the SAME zone were **NOT marked false positive** (real alerts), this indicates an escalating or unresolved situation
- **INCREASE risk score by 20-40 points** if there are 2+ REAL (non-false-positive) alerts from same zone
- Multiple real alerts = persistent threat, not false alarm pattern
- Example: If Zone 008 triggered 4 times and NONE are marked false positive, this is serious (Risk: 85-95/100)

**GENERAL CONSIDERATIONS:**
- Is this a real emergency or likely a false alarm based on the pattern?
- Does the pattern of recent alerts suggest escalation or an ongoing incident?
- Are multiple zones/sensors triggering in sequence? (e.g., fire spreading, intruder moving through building)
- Does the location and sensor data tell a story? (e.g., "smoke detector in zone 1, then fire alarm in zone 2, then zone 3 - fire is spreading")
- What is the appropriate response based on the event type, time of day, location, AND historical pattern?
- Should multiple teams be dispatched or is remote verification sufficient?
- Build a narrative: What is actually happening based on all the evidence?

**RISK SCORE CALIBRATION:**
- 0-30: False positive pattern detected, maintenance needed
- 30-50: Possible false alarm but requires verification
- 50-70: Real alert requiring standard response
- 70-85: Serious situation requiring immediate attention
- 85-95: Critical emergency with escalating pattern
- 95-100: Life-threatening emergency requiring all resources

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

/**
 * Generate fallback analysis when AI is unavailable (e.g., no internet during demo)
 * Creates realistic-looking static summaries based on alert context
 */
function generateFallbackAnalysis(context: AlertContext): AlertAnalysis {
  const { alert, site, area, sensor, recentAlerts, currentTime } = context;
  
  const timeOfDay = getTimeOfDay(currentTime);
  const siteName = site?.name || `Account ${alert.accountNumber}`;
  const areaName = area?.name || (alert.areaNumber ? `Area ${alert.areaNumber}` : "the facility");
  const sensorName = sensor?.name || (alert.zoneNumber ? `Zone ${alert.zoneNumber}` : "a sensor");
  const sensorType = sensor?.type || "sensor";
  
  // Check if this is a repeated alert (2+ recent alerts)
  const isRepeatedAlert = recentAlerts && recentAlerts.length > 0;
  const falsePositiveCount = recentAlerts?.filter(ra => ra.falsePositive).length || 0;
  const realAlertCount = (recentAlerts?.length || 0) - falsePositiveCount;
  const hasFalsePositivePattern = falsePositiveCount >= 2;
  
  // Scenario 1: First alert (no previous alerts)
  if (!isRepeatedAlert) {
    return generateFirstAlertFallback(alert, siteName, areaName, sensorName, sensorType, timeOfDay);
  }
  
  // Scenario 2: Repeated alert with false positive pattern
  if (hasFalsePositivePattern) {
    return generateFalsePositivePatternFallback(
      alert, siteName, areaName, sensorName, sensorType, timeOfDay, 
      falsePositiveCount, recentAlerts!.length
    );
  }
  
  // Scenario 3: Repeated alert with escalating threat (real alerts)
  return generateEscalatingThreatFallback(
    alert, siteName, areaName, sensorName, sensorType, timeOfDay, 
    realAlertCount, recentAlerts!.length
  );
}

/**
 * Generate fallback for first-time alert
 */
function generateFirstAlertFallback(
  alert: any,
  siteName: string,
  areaName: string,
  sensorName: string,
  sensorType: string,
  timeOfDay: string
): AlertAnalysis {
  const category = alert.eventCategory?.toLowerCase() || '';
  const priority = alert.priority?.toLowerCase() || 'medium';
  
  // Determine risk based on category and priority
  let riskScore = 50;
  let riskLevel: "low" | "medium" | "high" | "critical" = "medium";
  let actions: AlertAction[] = ["verify_with_camera", "investigate_remotely", "acknowledge_and_monitor"];
  
  if (category.includes('fire')) {
    riskScore = 85;
    riskLevel = "critical";
    actions = ["dispatch_fire_department", "evacuate_building", "verify_with_camera", "contact_site_manager"];
  } else if (category.includes('burglary') || category.includes('intrusion')) {
    riskScore = 75;
    riskLevel = "high";
    actions = ["dispatch_security_team", "verify_with_camera", "lockdown_area", "contact_site_manager"];
  } else if (category.includes('medical') || category.includes('panic')) {
    riskScore = 90;
    riskLevel = "critical";
    actions = ["dispatch_medical", "dispatch_security_team", "contact_site_manager"];
  } else if (priority === 'high' || priority === 'urgent') {
    riskScore = 70;
    riskLevel = "high";
    actions = ["dispatch_security_team", "verify_with_camera", "contact_site_manager"];
  }
  
  const summary = `**${alert.eventDescription}** detected at *${siteName}* in *${areaName}*. The **${sensorName}** (${sensorType}) was triggered during **${timeOfDay}** hours. This is the **first alert** from this zone in the last 24 hours, requiring immediate verification to determine if this is a genuine security event.`;
  
  const reasoning = `Given this is the **first occurrence** with no recent activity pattern, recommend **immediate verification** through camera systems and remote monitoring. The **${alert.eventCategory}** category and **${alert.priority}** priority indicate this should be treated seriously until confirmed. Dispatch appropriate response team if threat is verified.`;
  
  const summaryAr = `تم اكتشاف **${alert.eventDescription}** في *${siteName}* في *${areaName}*. تم تفعيل **${sensorName}** (${sensorType}) خلال ساعات **${timeOfDay === 'Morning' ? 'الصباح' : timeOfDay === 'Afternoon' ? 'بعد الظهر' : timeOfDay === 'Evening' ? 'المساء' : 'الليل'}**. هذا هو **أول تنبيه** من هذه المنطقة خلال الـ 24 ساعة الماضية، ويتطلب التحقق الفوري لتحديد ما إذا كان هذا حدث أمني حقيقي.`;
  
  const reasoningAr = `نظرًا لأن هذا **أول حدوث** بدون نمط نشاط حديث، نوصي **بالتحقق الفوري** من خلال أنظمة الكاميرات والمراقبة عن بُعد. تشير فئة **${alert.eventCategory}** وأولوية **${alert.priority}** إلى أنه يجب التعامل معها بجدية حتى يتم التأكيد. إرسال فريق الاستجابة المناسب في حالة التحقق من التهديد.`;
  
  return {
    summary,
    riskScore,
    riskLevel,
    recommendedActions: actions,
    reasoning,
    estimatedResponseTime: riskScore >= 85 ? "immediate" : riskScore >= 70 ? "5 minutes" : "15 minutes",
    additionalContext: `First alert from this location. No historical pattern available. Status: Under investigation.`,
    summaryAr,
    reasoningAr,
    estimatedResponseTimeAr: riskScore >= 85 ? "فوري" : riskScore >= 70 ? "5 دقائق" : "15 دقيقة",
    additionalContextAr: `أول تنبيه من هذا الموقع. لا يوجد نمط تاريخي متاح. الحالة: قيد التحقيق.`
  };
}

/**
 * Generate fallback for repeated alert with false positive pattern
 */
function generateFalsePositivePatternFallback(
  alert: any,
  siteName: string,
  areaName: string,
  sensorName: string,
  sensorType: string,
  timeOfDay: string,
  falsePositiveCount: number,
  totalAlerts: number
): AlertAnalysis {
  const riskScore = 35; // Low risk due to false positive pattern
  const riskLevel: "low" | "medium" | "high" | "critical" = "low";
  
  const summary = `**Recurring false alarm pattern detected** at *${siteName}* - **${sensorName}** in *${areaName}* has triggered **${totalAlerts} times** in the last 24 hours. Previous **${falsePositiveCount} alerts** from this zone were verified as **false positives**. The **${sensorType}** may require maintenance or recalibration to prevent continued false alarms.`;
  
  const reasoning = `Analysis of recent activity shows a clear **false positive pattern** - the same sensor has triggered multiple times with **${falsePositiveCount}/${totalAlerts} previous alerts marked as false positives**. This suggests a technical issue rather than a genuine security threat. Recommend **acknowledge and monitor** rather than emergency dispatch, followed by **scheduled maintenance** to address the root cause.`;
  
  const summaryAr = `تم اكتشاف **نمط إنذار كاذب متكرر** في *${siteName}* - **${sensorName}** في *${areaName}* تم تفعيله **${totalAlerts} مرة** خلال الـ 24 ساعة الماضية. تم التحقق من **${falsePositiveCount} تنبيهًا** سابقًا من هذه المنطقة على أنها **إنذارات كاذبة**. قد يتطلب **${sensorType}** صيانة أو إعادة معايرة لمنع استمرار الإنذارات الكاذبة.`;
  
  const reasoningAr = `يُظهر تحليل النشاط الأخير **نمط إنذار كاذب** واضح - نفس المستشعر تم تفعيله عدة مرات مع **${falsePositiveCount}/${totalAlerts} تنبيهات سابقة تم تصنيفها كإنذارات كاذبة**. هذا يشير إلى مشكلة تقنية بدلاً من تهديد أمني حقيقي. نوصي **بالإقرار والمراقبة** بدلاً من الإرسال الطارئ، متبوعًا **بصيانة مجدولة** لمعالجة السبب الجذري.`;
  
  return {
    summary,
    riskScore,
    riskLevel,
    recommendedActions: ["acknowledge_and_monitor", "schedule_maintenance", "reset_sensor", "check_system_status"],
    reasoning,
    estimatedResponseTime: "1 hour",
    additionalContext: `False positive pattern confirmed. ${falsePositiveCount} of ${totalAlerts} recent alerts were false positives. Maintenance required.`,
    summaryAr,
    reasoningAr,
    estimatedResponseTimeAr: "ساعة واحدة",
    additionalContextAr: `تم تأكيد نمط الإنذار الكاذب. ${falsePositiveCount} من ${totalAlerts} تنبيهات حديثة كانت إنذارات كاذبة. الصيانة مطلوبة.`
  };
}

/**
 * Generate fallback for repeated alert with escalating threat
 */
function generateEscalatingThreatFallback(
  alert: any,
  siteName: string,
  areaName: string,
  sensorName: string,
  sensorType: string,
  timeOfDay: string,
  realAlertCount: number,
  totalAlerts: number
): AlertAnalysis {
  const riskScore = 88; // High risk due to repeated real alerts
  const riskLevel: "critical" = "critical";
  
  const summary = `**ESCALATING SECURITY SITUATION** at *${siteName}* - **${sensorName}** in *${areaName}* has triggered **${totalAlerts} times** in the last 24 hours. **${realAlertCount} alerts are REAL** (not marked false positive), indicating an **unresolved or escalating threat**. The **${sensorType}** continues to detect activity, suggesting persistent security concern requiring immediate response.`;
  
  const reasoning = `Critical pattern identified: **${realAlertCount} of ${totalAlerts} recent alerts are REAL** (not verified as false positives), indicating this is **NOT a false alarm pattern** but an **active, escalating situation**. Multiple genuine triggers from the same location suggest either an ongoing security breach, persistent intruder activity, or unresolved emergency. **IMMEDIATE dispatch required** - this pattern cannot be ignored.`;
  
  const summaryAr = `**حالة أمنية متصاعدة** في *${siteName}* - **${sensorName}** في *${areaName}* تم تفعيله **${totalAlerts} مرة** خلال الـ 24 ساعة الماضية. **${realAlertCount} تنبيهات حقيقية** (غير مصنفة كإنذارات كاذبة)، مما يشير إلى **تهديد غير محلول أو متصاعد**. يستمر **${sensorType}** في اكتشاف النشاط، مما يشير إلى مخاوف أمنية مستمرة تتطلب استجابة فورية.`;
  
  const reasoningAr = `تم تحديد نمط حرج: **${realAlertCount} من ${totalAlerts} تنبيهات حديثة حقيقية** (غير مؤكدة كإنذارات كاذبة)، مما يشير إلى أن هذا **ليس نمط إنذار كاذب** ولكنه **موقف نشط ومتصاعد**. محفزات حقيقية متعددة من نفس الموقع تشير إما إلى اختراق أمني مستمر، أو نشاط متسلل مستمر، أو حالة طوارئ غير محلولة. **الإرسال الفوري مطلوب** - لا يمكن تجاهل هذا النمط.`;
  
  return {
    summary,
    riskScore,
    riskLevel,
    recommendedActions: ["dispatch_security_team", "dispatch_police", "verify_with_camera", "lockdown_area", "contact_site_manager"],
    reasoning,
    estimatedResponseTime: "immediate",
    additionalContext: `CRITICAL: ${realAlertCount} real alerts in 24h. Escalating pattern confirmed. NOT a false alarm. Immediate action required.`,
    summaryAr,
    reasoningAr,
    estimatedResponseTimeAr: "فوري",
    additionalContextAr: `حرج: ${realAlertCount} تنبيهات حقيقية في 24 ساعة. تم تأكيد النمط المتصاعد. ليس إنذارًا كاذبًا. مطلوب إجراء فوري.`
  };
}