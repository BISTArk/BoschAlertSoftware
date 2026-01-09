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
  const eventCode = alert.eventCode;
  
  // Get specific context based on event code
  const eventContext = getEventContext(eventCode, category, siteName, areaName, sensorName, sensorType, timeOfDay);
  
  const summary = `**${alert.eventDescription}** detected at **${siteName}** in **${areaName}**. The **${sensorName}** (${sensorType}) triggered during **${timeOfDay}** hours. ${eventContext.details} This is the **first alert** from this sensor in the last 24 hours, requiring immediate verification to determine if this is a genuine security event.`;
  
  const reasoning = `Given this is the **first occurrence** with no recent activity pattern, recommend **immediate verification** through camera systems and remote monitoring. ${eventContext.reasoning} The **${alert.eventCategory}** category and **${alert.priority}** priority level indicate this should be treated seriously until confirmed. ${eventContext.actionGuidance}`;
  
  const timeOfDayAr = timeOfDay === 'Morning' ? 'الصباح' : timeOfDay === 'Afternoon' ? 'بعد الظهر' : timeOfDay === 'Evening' ? 'المساء' : 'الليل';
  
  const summaryAr = `تم اكتشاف **${alert.eventDescription}** في **${siteName}** في **${areaName}**. تم تفعيل **${sensorName}** (${sensorType}) خلال ساعات **${timeOfDayAr}**. ${eventContext.detailsAr} هذا هو **أول تنبيه** من هذا المستشعر خلال الـ 24 ساعة الماضية، ويتطلب التحقق الفوري لتحديد ما إذا كان هذا حدث أمني حقيقي.`;
  
  const reasoningAr = `نظرًا لأن هذا **أول حدوث** بدون نمط نشاط حديث، نوصي **بالتحقق الفوري** من خلال أنظمة الكاميرات والمراقبة عن بُعد. ${eventContext.reasoningAr} تشير فئة **${alert.eventCategory}** ومستوى الأولوية **${alert.priority}** إلى أنه يجب التعامل معها بجدية حتى يتم التأكيد. ${eventContext.actionGuidanceAr}`;
  
  return {
    summary,
    riskScore: eventContext.riskScore,
    riskLevel: eventContext.riskLevel,
    recommendedActions: eventContext.actions,
    reasoning,
    estimatedResponseTime: eventContext.responseTime,
    additionalContext: `First alert from ${siteName}. ${eventContext.additionalInfo}`,
    summaryAr,
    reasoningAr,
    estimatedResponseTimeAr: eventContext.responseTimeAr,
    additionalContextAr: `أول تنبيه من ${siteName}. ${eventContext.additionalInfoAr}`
  };
}

/**
 * Get event-specific context for more realistic fallback summaries
 */
function getEventContext(
  eventCode: string,
  category: string,
  siteName: string,
  areaName: string,
  sensorName: string,
  sensorType: string,
  timeOfDay: string
) {
  const categoryLower = category.toLowerCase();
  
  // Burglary events (130-139, BA)
  if (eventCode === '130' || eventCode === 'BA' || categoryLower.includes('burglary')) {
    return {
      riskScore: 78,
      riskLevel: "high" as const,
      actions: ["dispatch_security_team", "verify_with_camera", "lockdown_area", "contact_site_manager"] as AlertAction[],
      responseTime: "5 minutes",
      responseTimeAr: "5 دقائق",
      details: `Potential unauthorized access or intrusion detected at ${siteName}.`,
      detailsAr: `تم اكتشاف وصول غير مصرح به محتمل أو تطفل في ${siteName}.`,
      reasoning: `Burglary alarms during ${timeOfDay} hours require swift security response to prevent potential theft or property damage.`,
      reasoningAr: `تتطلب إنذارات السرقة خلال ساعات ${timeOfDay === 'Morning' ? 'الصباح' : timeOfDay === 'Afternoon' ? 'بعد الظهر' : timeOfDay === 'Evening' ? 'المساء' : 'الليل'} استجابة أمنية سريعة لمنع السرقة المحتملة أو تلف الممتلكات.`,
      actionGuidance: "Dispatch security team to investigate on-site while monitoring via cameras.",
      actionGuidanceAr: "إرسال فريق الأمن للتحقيق في الموقع أثناء المراقبة عبر الكاميرات.",
      additionalInfo: "No recent activity. Security assessment in progress.",
      additionalInfoAr: "لا يوجد نشاط حديث. تقييم أمني قيد التنفيذ."
    };
  }
  
  // Fire events (110-118, FA)
  if (eventCode.startsWith('11') || eventCode === 'FA' || categoryLower.includes('fire')) {
    return {
      riskScore: 88,
      riskLevel: "critical" as const,
      actions: ["dispatch_fire_department", "evacuate_building", "verify_with_camera", "contact_site_manager"] as AlertAction[],
      responseTime: "immediate",
      responseTimeAr: "فوري",
      details: `Fire alarm activated at ${siteName} - potential fire hazard detected.`,
      detailsAr: `تم تفعيل إنذار الحريق في ${siteName} - تم اكتشاف خطر حريق محتمل.`,
      reasoning: `Fire alarms are life-threatening emergencies requiring immediate evacuation protocols and fire department dispatch.`,
      reasoningAr: `إنذارات الحريق هي حالات طوارئ تهدد الحياة وتتطلب بروتوكولات إخلاء فورية وإرسال فرقة الإطفاء.`,
      actionGuidance: "Activate evacuation procedures immediately and verify through multiple sensors.",
      actionGuidanceAr: "تفعيل إجراءات الإخلاء فورًا والتحقق من خلال أجهزة استشعار متعددة.",
      additionalInfo: "Life safety priority. Immediate response required.",
      additionalInfoAr: "أولوية سلامة الحياة. مطلوب استجابة فورية."
    };
  }
  
  // Medical/Panic events (100-102, 120-125, MA, PA)
  if (eventCode.startsWith('10') || eventCode.startsWith('12') || eventCode === 'MA' || eventCode === 'PA' || 
      categoryLower.includes('medical') || categoryLower.includes('panic')) {
    return {
      riskScore: 92,
      riskLevel: "critical" as const,
      actions: ["dispatch_medical", "dispatch_security_team", "contact_site_manager", "verify_with_camera"] as AlertAction[],
      responseTime: "immediate",
      responseTimeAr: "فوري",
      details: `Emergency panic/medical button activated at ${siteName} - person in distress.`,
      detailsAr: `تم تفعيل زر الطوارئ الطبي/الذعر في ${siteName} - شخص في محنة.`,
      reasoning: `Medical emergencies and panic alarms indicate immediate danger to personnel requiring urgent medical and security response.`,
      reasoningAr: `حالات الطوارئ الطبية وإنذارات الذعر تشير إلى خطر فوري على الموظفين ويتطلب استجابة طبية وأمنية عاجلة.`,
      actionGuidance: "Dispatch medical services and security immediately. Person may be in life-threatening situation.",
      actionGuidanceAr: "إرسال الخدمات الطبية والأمن فورًا. قد يكون الشخص في موقف يهدد حياته.",
      additionalInfo: "Life-threatening emergency. Multiple teams dispatched.",
      additionalInfoAr: "حالة طوارئ تهدد الحياة. تم إرسال فرق متعددة."
    };
  }
  
  // Communication/System troubles (350-356, NL, NCW)
  if (eventCode.startsWith('35') || eventCode === 'NL' || eventCode === 'NCW' || 
      categoryLower.includes('communication')) {
    return {
      riskScore: 62,
      riskLevel: "high" as const,
      actions: ["check_system_status", "investigate_remotely", "contact_site_manager", "schedule_maintenance"] as AlertAction[],
      responseTime: "15 minutes",
      responseTimeAr: "15 دقيقة",
      details: `Communication system trouble detected at ${siteName} - potential connectivity issue.`,
      detailsAr: `تم اكتشاف مشكلة في نظام الاتصالات في ${siteName} - مشكلة اتصال محتملة.`,
      reasoning: `Communication failures can mask other security events and require immediate system diagnostics to restore monitoring capabilities.`,
      reasoningAr: `يمكن أن تخفي حالات فشل الاتصالات أحداث أمنية أخرى وتتطلب تشخيصات نظام فورية لاستعادة قدرات المراقبة.`,
      actionGuidance: "Check all communication channels and verify system connectivity.",
      actionGuidanceAr: "تحقق من جميع قنوات الاتصال والتحقق من اتصال النظام.",
      additionalInfo: "System integrity check required.",
      additionalInfoAr: "مطلوب فحص سلامة النظام."
    };
  }
  
  // Sensor troubles (380-393)
  if (eventCode.startsWith('38') || categoryLower.includes('sensor')) {
    return {
      riskScore: 55,
      riskLevel: "medium" as const,
      actions: ["check_system_status", "schedule_maintenance", "investigate_remotely", "acknowledge_and_monitor"] as AlertAction[],
      responseTime: "1 hour",
      responseTimeAr: "ساعة واحدة",
      details: `Sensor health issue detected at ${siteName} - ${sensorName} may require maintenance.`,
      detailsAr: `تم اكتشاف مشكلة في صحة المستشعر في ${siteName} - ${sensorName} قد يتطلب صيانة.`,
      reasoning: `Sensor malfunctions can lead to false alarms or missed genuine threats, requiring prompt maintenance to ensure system reliability.`,
      reasoningAr: `يمكن أن تؤدي أعطال المستشعرات إلى إنذارات كاذبة أو تفويت تهديدات حقيقية، مما يتطلب صيانة سريعة لضمان موثوقية النظام.`,
      actionGuidance: "Schedule technician visit to inspect and repair sensor.",
      actionGuidanceAr: "جدولة زيارة فني لفحص وإصلاح المستشعر.",
      additionalInfo: "Maintenance recommended to prevent system degradation.",
      additionalInfoAr: "الصيانة الموصى بها لمنع تدهور النظام."
    };
  }
  
  // 24-hour non-burglary (150-163)
  if (eventCode.startsWith('15') || eventCode.startsWith('16')) {
    return {
      riskScore: 70,
      riskLevel: "high" as const,
      actions: ["dispatch_security_team", "verify_with_camera", "contact_site_manager", "investigate_remotely"] as AlertAction[],
      responseTime: "10 minutes",
      responseTimeAr: "10 دقائق",
      details: `Environmental hazard detected at ${siteName} - ${sensorName} triggered.`,
      detailsAr: `تم اكتشاف خطر بيئي في ${siteName} - ${sensorName} تم تفعيله.`,
      reasoning: `24-hour zones monitor critical environmental conditions that can cause property damage or safety hazards.`,
      reasoningAr: `تراقب مناطق 24 ساعة الظروف البيئية الحرجة التي يمكن أن تسبب أضرارًا في الممتلكات أو مخاطر على السلامة.`,
      actionGuidance: "Verify conditions and dispatch appropriate response team based on hazard type.",
      actionGuidanceAr: "التحقق من الظروف وإرسال فريق الاستجابة المناسب بناءً على نوع الخطر.",
      additionalInfo: "Environmental monitoring active.",
      additionalInfoAr: "المراقبة البيئية نشطة."
    };
  }
  
  // Default for unknown events
  return {
    riskScore: 60,
    riskLevel: "medium" as const,
    actions: ["verify_with_camera", "investigate_remotely", "acknowledge_and_monitor", "contact_site_manager"] as AlertAction[],
    responseTime: "15 minutes",
    responseTimeAr: "15 دقيقة",
    details: `Security event detected at ${siteName}.`,
    detailsAr: `تم اكتشاف حدث أمني في ${siteName}.`,
    reasoning: `Standard security protocol requires verification and assessment before determining appropriate response level.`,
    reasoningAr: `يتطلب بروتوكول الأمان القياسي التحقق والتقييم قبل تحديد مستوى الاستجابة المناسب.`,
    actionGuidance: "Monitor situation and escalate if threat is confirmed.",
    actionGuidanceAr: "مراقبة الوضع والتصعيد في حالة تأكيد التهديد.",
    additionalInfo: "Under investigation.",
    additionalInfoAr: "قيد التحقيق."
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
  
  const summary = `**Recurring false alarm pattern detected** at **${siteName}** - **${sensorName}** in **${areaName}** has triggered **${totalAlerts} times** in the last 24 hours. Previous **${falsePositiveCount} alerts** from this sensor were verified as **false positives**. The **${sensorType}** at **${siteName}** may require maintenance or recalibration to prevent continued false alarms from this location.`;
  
  const reasoning = `Analysis of recent activity from **${siteName}** shows a clear **false positive pattern** - the **${sensorName}** (${sensorType}) has triggered multiple times with **${falsePositiveCount}/${totalAlerts} previous alerts marked as false positives**. This suggests a **technical issue or environmental interference** at this specific location rather than a genuine security threat. Recommend **acknowledge and monitor** rather than emergency dispatch, followed by **scheduled maintenance** to address the root cause and restore sensor reliability at **${siteName}**.`;
  
  const summaryAr = `تم اكتشاف **نمط إنذار كاذب متكرر** في **${siteName}** - **${sensorName}** في **${areaName}** تم تفعيله **${totalAlerts} مرة** خلال الـ 24 ساعة الماضية. تم التحقق من **${falsePositiveCount} تنبيهًا** سابقًا من هذا المستشعر على أنها **إنذارات كاذبة**. قد يتطلب **${sensorType}** في **${siteName}** صيانة أو إعادة معايرة لمنع استمرار الإنذارات الكاذبة من هذا الموقع.`;
  
  const reasoningAr = `يُظهر تحليل النشاط الأخير من **${siteName}** **نمط إنذار كاذب** واضح - **${sensorName}** (${sensorType}) تم تفعيله عدة مرات مع **${falsePositiveCount}/${totalAlerts} تنبيهات سابقة تم تصنيفها كإنذارات كاذبة**. هذا يشير إلى **مشكلة تقنية أو تداخل بيئي** في هذا الموقع المحدد بدلاً من تهديد أمني حقيقي. نوصي **بالإقرار والمراقبة** بدلاً من الإرسال الطارئ، متبوعًا **بصيانة مجدولة** لمعالجة السبب الجذري واستعادة موثوقية المستشعر في **${siteName}**.`;
  
  return {
    summary,
    riskScore,
    riskLevel,
    recommendedActions: ["acknowledge_and_monitor", "schedule_maintenance", "reset_sensor", "check_system_status"],
    reasoning,
    estimatedResponseTime: "1 hour",
    additionalContext: `False positive pattern confirmed at ${siteName}. ${falsePositiveCount} of ${totalAlerts} recent alerts were false positives. ${sensorName} requires maintenance.`,
    summaryAr,
    reasoningAr,
    estimatedResponseTimeAr: "ساعة واحدة",
    additionalContextAr: `تم تأكيد نمط الإنذار الكاذب في ${siteName}. ${falsePositiveCount} من ${totalAlerts} تنبيهات حديثة كانت إنذارات كاذبة. ${sensorName} يتطلب صيانة.`
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
  
  const summary = `**ESCALATING SECURITY SITUATION** at **${siteName}** - **${sensorName}** in **${areaName}** has triggered **${totalAlerts} times** in the last 24 hours. **${realAlertCount} alerts are REAL** (not marked false positive), indicating an **unresolved or escalating threat** at this location. The **${sensorType}** at **${siteName}** continues to detect activity during **${timeOfDay}** hours, suggesting persistent security concern requiring immediate on-site response.`;
  
  const reasoning = `Critical pattern identified at **${siteName}**: **${realAlertCount} of ${totalAlerts} recent alerts are REAL** (not verified as false positives), indicating this is **NOT a false alarm pattern** but an **active, escalating situation** requiring immediate attention. Multiple genuine triggers from **${sensorName}** in **${areaName}** suggest either an **ongoing security breach**, **persistent intruder activity**, or **unresolved emergency** at this specific location. The fact that these are legitimate alerts (not marked false positive) indicates a serious security compromise at **${siteName}**. **IMMEDIATE dispatch of security and police required** - this escalating pattern at a high-value location cannot be ignored.`;
  
  const summaryAr = `**حالة أمنية متصاعدة** في **${siteName}** - **${sensorName}** في **${areaName}** تم تفعيله **${totalAlerts} مرة** خلال الـ 24 ساعة الماضية. **${realAlertCount} تنبيهات حقيقية** (غير مصنفة كإنذارات كاذبة)، مما يشير إلى **تهديد غير محلول أو متصاعد** في هذا الموقع. يستمر **${sensorType}** في **${siteName}** في اكتشاف النشاط خلال ساعات **${timeOfDay === 'Morning' ? 'الصباح' : timeOfDay === 'Afternoon' ? 'بعد الظهر' : timeOfDay === 'Evening' ? 'المساء' : 'الليل'}**، مما يشير إلى مخاوف أمنية مستمرة تتطلب استجابة فورية في الموقع.`;
  
  const reasoningAr = `تم تحديد نمط حرج في **${siteName}**: **${realAlertCount} من ${totalAlerts} تنبيهات حديثة حقيقية** (غير مؤكدة كإنذارات كاذبة)، مما يشير إلى أن هذا **ليس نمط إنذار كاذب** ولكنه **موقف نشط ومتصاعد** يتطلب اهتمامًا فوريًا. محفزات حقيقية متعددة من **${sensorName}** في **${areaName}** تشير إما إلى **اختراق أمني مستمر**، أو **نشاط متسلل مستمر**، أو **حالة طوارئ غير محلولة** في هذا الموقع المحدد. حقيقة أن هذه تنبيهات شرعية (غير مصنفة كإنذارات كاذبة) تشير إلى اختراق أمني خطير في **${siteName}**. **الإرسال الفوري للأمن والشرطة مطلوب** - لا يمكن تجاهل هذا النمط المتصاعد في موقع عالي القيمة.`;
  
  return {
    summary,
    riskScore,
    riskLevel,
    recommendedActions: ["dispatch_security_team", "dispatch_police", "verify_with_camera", "lockdown_area", "contact_site_manager"],
    reasoning,
    estimatedResponseTime: "immediate",
    additionalContext: `CRITICAL at ${siteName}: ${realAlertCount} real alerts in 24h from ${sensorName}. Escalating pattern confirmed. NOT a false alarm. Immediate action required.`,
    summaryAr,
    reasoningAr,
    estimatedResponseTimeAr: "فوري",
    additionalContextAr: `حرج في ${siteName}: ${realAlertCount} تنبيهات حقيقية في 24 ساعة من ${sensorName}. تم تأكيد النمط المتصاعد. ليس إنذارًا كاذبًا. مطلوب إجراء فوري.`
  };
}