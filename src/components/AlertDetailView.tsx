import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Clock, Video, Lock, Send, CheckCircle, AlertCircle, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertActions } from "@/components/AlertActions";
import { AreaFloorPlanView } from "@/components/AreaFloorPlanView";
import { CameraStream } from "@/components/CameraStream";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownText } from "@/components/MarkdownText";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AlertDetailViewProps {
  alertId: Id<"alerts">;
  onBack: () => void;
}

export function AlertDetailView({ alertId, onBack }: AlertDetailViewProps) {
  const { user } = useAuth();
  const [showLockdownDialog, setShowLockdownDialog] = useState(false);
  const [showDispatchDialog, setShowDispatchDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showInvestigateDialog, setShowInvestigateDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const updateStatus = useMutation(api.alerts.updateAlertStatus);

  const alert = useQuery(api.alerts.getAlerts, {
    filters: {},
  })?.page.find((a) => a._id === alertId);

  // Get all users to find assigned guard
  const allUsers = useQuery(api.auth.getUsers);
  const assignedUser = allUsers?.find((u) => u._id === alert?.assignedTo);

  // Get area/floor data for camera configuration
  const areaData = useQuery(
    api.siteMap.getFloorByAccountAndArea,
    alert?.accountNumber && alert?.areaNumber
      ? { accountNumber: alert.accountNumber, areaNumber: alert.areaNumber }
      : "skip"
  );

  // Update timer every second
  useEffect(() => {
    if (!alert) return;

    // Initial calculation
    setTimeElapsed(Math.floor((Date.now() - alert.receivedAt) / 1000));

    // Update every second
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - alert.receivedAt) / 1000));
    }, 1000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [alert?.receivedAt]);

  const handleAction = async (action: string) => {
    if (!user) return;

    try {
      // All actions move alert to in-progress if not already
      if (alert?.status !== "in-progress" && alert?.status !== "resolved") {
        await updateStatus({
          alertId,
          status: "in-progress",
          userId: user._id,
          notes: `Action taken: ${action}`,
        });
      }
      // Close dialogs
      setShowLockdownDialog(false);
      setShowDispatchDialog(false);
      setShowInvestigateDialog(false);
    } catch (error) {
      console.error("Error updating alert:", error);
    }
  };

  const handleResolve = async () => {
    if (!user) return;

    try {
      await updateStatus({
        alertId,
        status: "resolved",
        userId: user._id,
        notes: "Alert resolved",
      });
      setShowResolveDialog(false);
      // Return to previous view after a short delay
      setTimeout(() => onBack(), 1000);
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  };

  const handleClose = async () => {
    if (!user) return;

    try {
      await updateStatus({
        alertId,
        status: "resolved",
        userId: user._id,
        notes: "Incident closed",
      });
      setShowCloseDialog(false);
      // Return to previous view after a short delay
      setTimeout(() => onBack(), 1000);
    } catch (error) {
      console.error("Error closing incident:", error);
    }
  };

  if (!alert) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">Loading alert details...</p>
        </div>
      </div>
    );
  }

  // Calculate time display from elapsed seconds
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Get severity badge color
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Get AI analysis data or use fallback
  const hasAIAnalysis = alert.aiSummary && alert.aiRiskScore !== undefined;
  const aiRiskScore = hasAIAnalysis ? alert.aiRiskScore : null;
  const aiSummary = hasAIAnalysis ? alert.aiSummary : null;
  const aiRecommendedActions = hasAIAnalysis ? alert.aiRecommendedActions : [];
  const aiRiskLevel = hasAIAnalysis ? alert.aiRiskLevel : null;
  
  // Format action text for display
  const formatAction = (action: string) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                Incident #{alert._id.slice(-6)}: {alert.eventDescription || "Security Alert"}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Account {alert.accountNumber}, Zone {alert.zoneNumber || "N/A"}
                </p>
                {alert.falsePositive && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    False Positive
                    {alert.falsePositiveReason && (
                      <span className="ml-1">· {alert.falsePositiveReason}</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Assign/Reassign button for heads and admins */}
            {(user?.role === "head" || user?.role === "admin") && (
              <AlertActions
                alertId={alertId}
                currentStatus={alert.status}
                assignedTo={alert.assignedTo}
                falsePositive={alert.falsePositive}
              />
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              <span className="text-3xl font-mono font-bold text-red-500">{timeDisplay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6 p-6">
        {/* Left Column - Overview & Steps */}
        <div className="col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: AI Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasAIAnalysis ? (
                <Tabs defaultValue="english" className="w-full">
                  <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
                    <TabsTrigger value="english" className="flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      English
                    </TabsTrigger>
                    <TabsTrigger value="arabic" className="flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      العربية
                    </TabsTrigger>
                  </TabsList>

                  {/* English Content */}
                  <TabsContent value="english" className="mt-0">
                    <div className="grid grid-cols-2 gap-6">
                      {/* AI Summary */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">AI SUMMARY</p>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium mb-1">Incident Type</p>
                              <p className="text-lg font-semibold">
                                {alert.eventDescription || "Security Alert"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">AI Risk Score</p>
                              <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-bold ${
                                  aiRiskScore! >= 80 ? "text-red-500" :
                                  aiRiskScore! >= 60 ? "text-orange-500" :
                                  aiRiskScore! >= 40 ? "text-yellow-500" :
                                  "text-green-500"
                                }`}>{aiRiskScore}</span>
                                <span className="text-lg text-muted-foreground">/100</span>
                                <Badge className={`ml-2 ${
                                  aiRiskLevel === "critical" ? "bg-red-600" :
                                  aiRiskLevel === "high" ? "bg-orange-600" :
                                  aiRiskLevel === "medium" ? "bg-yellow-600" :
                                  "bg-green-600"
                                }`}>{aiRiskLevel?.toUpperCase()}</Badge>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">AI Summary</p>
                              <MarkdownText 
                                text={aiSummary || ""} 
                                className="text-sm text-muted-foreground leading-relaxed"
                              />
                            </div>
                            {alert.aiReasoning && (
                              <div>
                                <p className="text-sm font-medium mb-1">Analysis Reasoning</p>
                                <MarkdownText 
                                  text={alert.aiReasoning} 
                                  className="text-sm text-muted-foreground leading-relaxed"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Risk Details */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-3">RESPONSE TIME</p>
                          <div className="flex items-center gap-2 mb-4">
                            <Clock className="h-6 w-6 text-blue-500" />
                            <span className="text-2xl font-bold">{alert.aiEstimatedResponseTime || "Unknown"}</span>
                          </div>
                          {alert.aiAdditionalContext && alert.aiAdditionalContext !== "None" && (
                            <div>
                              <p className="text-sm font-medium mb-1">Additional Context</p>
                              <MarkdownText 
                                text={alert.aiAdditionalContext} 
                                className="text-sm text-muted-foreground leading-relaxed"
                              />
                            </div>
                          )}
                          <div className="mt-4">
                            <p className="text-xs text-muted-foreground mb-1">AI Analysis Completed</p>
                            <p className="text-sm">
                              {alert.aiAnalyzedAt ? new Date(alert.aiAnalyzedAt).toLocaleString() : "N/A"}
                            </p>
                            {alert.aiAnalysisDuration && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Analysis took {(alert.aiAnalysisDuration / 1000).toFixed(2)}s
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Arabic Content */}
                  <TabsContent value="arabic" className="mt-0" dir="rtl">
                    <div className="grid grid-cols-2 gap-6">
                      {/* AI Summary in Arabic */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">ملخص الذكاء الاصطناعي</p>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium mb-1">نوع الحادث</p>
                              <p className="text-lg font-semibold">
                                {alert.eventDescription || "تنبيه أمني"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">درجة المخاطرة بواسطة الذكاء الاصطناعي</p>
                              <div className="flex items-baseline gap-2" >
                                <span className={`text-4xl font-bold ${
                                  aiRiskScore! >= 80 ? "text-red-500" :
                                  aiRiskScore! >= 60 ? "text-orange-500" :
                                  aiRiskScore! >= 40 ? "text-yellow-500" :
                                  "text-green-500"
                                }`}>{aiRiskScore}</span>
                                <span className="text-lg text-muted-foreground">/100</span>
                                <Badge className={`ml-2 ${
                                  aiRiskLevel === "critical" ? "bg-red-600" :
                                  aiRiskLevel === "high" ? "bg-orange-600" :
                                  aiRiskLevel === "medium" ? "bg-yellow-600" :
                                  "bg-green-600"
                                }`}>
                                  {aiRiskLevel === "critical" ? "حرج" :
                                   aiRiskLevel === "high" ? "عالي" :
                                   aiRiskLevel === "medium" ? "متوسط" :
                                   "منخفض"}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <MarkdownText 
                                text={alert.aiSummaryAr || aiSummary || ""} 
                                className="text-sm text-muted-foreground leading-relaxed"
                              />
                            </div>
                            {alert.aiReasoningAr && (
                              <div>
                                <p className="text-sm font-medium mb-1">تحليل الأسباب</p>
                                <MarkdownText 
                                  text={alert.aiReasoningAr} 
                                  className="text-sm text-muted-foreground leading-relaxed"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Risk Details in Arabic */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-3">وقت الاستجابة</p>
                          <div className="flex items-center gap-2 mb-4">
                            <Clock className="h-6 w-6 text-blue-500" />
                            <span className="text-2xl font-bold">{alert.aiEstimatedResponseTimeAr || alert.aiEstimatedResponseTime || "غير معروف"}</span>
                          </div>
                          {alert.aiAdditionalContextAr && alert.aiAdditionalContextAr !== "لا يوجد" && (
                            <div>
                              <p className="text-sm font-medium mb-1">سياق إضافي</p>
                              <MarkdownText 
                                text={alert.aiAdditionalContextAr} 
                                className="text-sm text-muted-foreground leading-relaxed"
                              />
                            </div>
                          )}
                          <div className="mt-4">
                            <p className="text-xs text-muted-foreground mb-1">اكتمل التحليل بواسطة الذكاء الاصطناعي</p>
                            <p className="text-sm">
                              <span dir="ltr">{alert.aiAnalyzedAt ? new Date(alert.aiAnalyzedAt).toLocaleString() : "N/A"}</span>
                            </p>
                            {alert.aiAnalysisDuration && (
                              <p className="text-xs text-muted-foreground mt-1">
                                استغرق التحليل <span dir="ltr">{(alert.aiAnalysisDuration / 1000).toFixed(2)}s</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                  <p className="text-lg font-semibold mb-2">AI Analysis Not Available</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Error generating AI summary. Showing basic alert information.
                  </p>
                  <div className="bg-muted p-4 rounded-lg text-left max-w-md mx-auto">
                    <p className="text-sm font-medium mb-2">Basic Alert Info:</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Event: {alert.eventDescription || "Security Alert"}</p>
                      <p>• Category: {alert.eventCategory || "Unknown"}</p>
                      <p>• Priority: {(alert.priority || "medium").toUpperCase()}</p>
                      <p>• Account: {alert.accountNumber}</p>
                      <p>• Zone: {alert.zoneNumber || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: AI Recommended Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Step 2: AI Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasAIAnalysis && aiRecommendedActions && aiRecommendedActions.length > 0 ? (
                aiRecommendedActions.map((action, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox id={`action-${index}`} />
                    <Label htmlFor={`action-${index}`} className="text-sm font-normal">
                      {formatAction(action)}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No AI-recommended actions available. Please follow standard procedures.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Response */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Send className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                Step 3: Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Button 
                  variant="destructive" 
                  size="lg" 
                  className="flex-1"
                  onClick={() => setShowLockdownDialog(true)}
                  disabled={alert.status === "resolved"}
                >
                  <Lock className="h-5 w-5 mr-2" />
                  Lockdown
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1"
                  onClick={() => setShowDispatchDialog(true)}
                  disabled={alert.status === "resolved"}
                >
                  <Send className="h-5 w-5 mr-2" />
                  Dispatch
                </Button>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowInvestigateDialog(true)}
                disabled={alert.status === "resolved"}
              >
                <Clock className="h-4 w-4 mr-2" />
                Investigate
              </Button>
            </CardContent>
          </Card>

          {/* Step 4: Incident Summary & Resolution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                Step 4: Incident Summary & Resolution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timeline */}
              <div>
                <p className="text-sm font-medium mb-3">Incident Timeline</p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="w-0.5 h-full bg-border" />
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-sm font-medium">Alert Received</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.receivedAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.eventDescription || "Security alert detected"}
                      </p>
                    </div>
                  </div>
                  
                  {alert.status !== "unassigned" && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <div className="w-0.5 h-full bg-border" />
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="text-sm font-medium">Investigation Started</p>
                        <p className="text-xs text-muted-foreground">
                          Status: {alert.status}
                        </p>
                      </div>
                    </div>
                  )}

                  {alert.status === "resolved" && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Incident Resolved</p>
                        <p className="text-xs text-muted-foreground">
                          Incident closed successfully
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="pt-2 border-t border-border">
                <p className="text-sm font-medium mb-2">Summary</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>• Location: Account {alert.accountNumber}, Zone {alert.zoneNumber || "N/A"}</p>
                  <p>• Event Type: {alert.eventDescription || "Security Alert"}</p>
                  <p>• Priority: {(alert.priority || alert.severity || "low").toUpperCase()}</p>
                  <p>• Time Elapsed: {timeDisplay}</p>
                </div>
              </div>

              {/* Resolution Actions */}
              <div className="pt-2 space-y-2">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full"
                  onClick={() => setShowResolveDialog(true)}
                  disabled={alert.status === "resolved"}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Resolve Incident
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full"
                  onClick={() => setShowCloseDialog(true)}
                  disabled={alert.status === "resolved"}
                >
                  Close Incident
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Camera Feed & Details */}
        <div className="space-y-6">
          {/* Camera Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Camera Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <CameraStream
                cameraIp={areaData?.cameraIp}
                cameraPort={areaData?.cameraPort}
                cameraUsername={areaData?.cameraUsername}
                cameraPassword={areaData?.cameraPassword}
                cameraStreamPath={areaData?.cameraStreamPath}
                fallbackVideoUrl={areaData?.fallbackVideoUrl}
                accountNumber={alert.accountNumber || ""}
                areaNumber={alert.areaNumber}
                zoneNumber={alert.zoneNumber}
              />
              <div className="mt-3 space-y-1">
                <p className="text-sm font-medium">
                  Account {alert.accountNumber}, Zone {alert.zoneNumber || "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {areaData?.name || `Area ${alert.areaNumber || "N/A"}`}
                  {areaData?.cameraIp && ` - Camera: ${areaData.cameraIp}`}
                </p>
              </div>
              <Button variant="destructive" className="w-full mt-3">
                <Video className="h-4 w-4 mr-2" />
                Full Video
              </Button>
            </CardContent>
          </Card>

          {/* Alert Details */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Priority</p>
                <Badge className={getSeverityColor(alert.priority || alert.severity)}>
                  {(alert.priority || alert.severity || "low").toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="outline">
                  {(alert.status || "unassigned").toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                {assignedUser ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {assignedUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{assignedUser.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{assignedUser.role}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not assigned</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Event Code</p>
                <p className="text-sm font-mono">{alert.eventCode || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Event Qualifier</p>
                <p className="text-sm">
                  {alert.eventQualifier === "E" ? "New Event" : alert.eventQualifier === "R" ? "Restore" : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Category</p>
                <p className="text-sm">{alert.eventCategory || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Receiver ID</p>
                <p className="text-sm font-mono">{alert.receiverId || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Received At</p>
                <p className="text-sm">{new Date(alert.receivedAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Raw Message</p>
                <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                  {alert.rawMessage}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Area Floor Plan - Full Width Section */}
      <div className="px-6 pb-6">
        <AreaFloorPlanView
          accountNumber={alert.accountNumber}
          areaNumber={alert.areaNumber}
          zoneNumber={alert.zoneNumber}
          priority={alert.priority || alert.severity}
        />
      </div>

      {/* Confirmation Dialogs */}
      {/* Lockdown Dialog */}
      <Dialog open={showLockdownDialog} onOpenChange={setShowLockdownDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Lockdown</DialogTitle>
            <DialogDescription>
              This will initiate a security lockdown at Account {alert.accountNumber}, Zone {alert.zoneNumber || "N/A"}.
              All access points will be secured.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockdownDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleAction("Lockdown")}>
              Confirm Lockdown
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispatch Dialog */}
      <Dialog open={showDispatchDialog} onOpenChange={setShowDispatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Dispatch</DialogTitle>
            <DialogDescription>
              This will dispatch security personnel to Account {alert.accountNumber}, Zone {alert.zoneNumber || "N/A"}.
              Expected response time: 5-10 minutes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDispatchDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleAction("Dispatch")}>
              Confirm Dispatch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Investigate Dialog */}
      <Dialog open={showInvestigateDialog} onOpenChange={setShowInvestigateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Investigate Alert</DialogTitle>
            <DialogDescription>
              This will mark the alert as under investigation and move it to in-progress status.
              You can continue monitoring the situation and take further actions as needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvestigateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleAction("Investigate")}>
              Start Investigation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Are you sure you want to resolve this alert? This action will mark the incident as resolved
              and close it from the active alerts list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve}>
              Resolve Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Incident Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Incident</DialogTitle>
            <DialogDescription>
              Are you sure you want to close this incident? This will mark it as resolved and remove it
              from the active incidents dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleClose}>
              Close Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
