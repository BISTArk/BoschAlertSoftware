import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Clock, Video, Lock, Send, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertActions } from "@/components/AlertActions";
import { AreaFloorPlanView } from "@/components/AreaFloorPlanView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

  const updateStatus = useMutation(api.alerts.updateAlertStatus);

  const alert = useQuery(api.alerts.getAlerts, {
    filters: {},
  })?.page.find((a) => a._id === alertId);

  // Get all users to find assigned guard
  const allUsers = useQuery(api.auth.getUsers);
  const assignedUser = allUsers?.find((u) => u._id === alert?.assignedTo);

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

  // Calculate time elapsed
  const timeElapsed = Math.floor((Date.now() - alert.receivedAt) / 1000);
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

  // Mock data for AI summary and risk trend (replace with real data later)
  const aiRiskScore = 87;
  const riskIncrease = 14;
  const patternSummary = "Repeated unauthorized access attempts detected at this location. Pattern matches 3 previous incidents this month. Individual bypassed card reader system during off-hours.";

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
              <p className="text-sm text-muted-foreground">
                Account {alert.accountNumber}, Zone {alert.zoneNumber || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Assign/Reassign button for heads and admins */}
            {(user?.role === "head" || user?.role === "admin") && (
              <AlertActions
                alertId={alertId}
                currentStatus={alert.status}
                assignedTo={alert.assignedTo}
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
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              {/* AI Summary */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">AI SUMMARY</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium mb-1">Incident Type</p>
                      <p className="text-lg font-semibold">
                        {alert.eventDescription || "Unauthorized Access - Forced Entry"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">AI Risk Score</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-red-500">{aiRiskScore}</span>
                        <span className="text-lg text-muted-foreground">/100</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Pattern Summary</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {patternSummary}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Trend */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">RISK TREND</p>
                    <p className="text-xs text-muted-foreground">Repeat pattern at this location</p>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-6 w-6 text-red-500" />
                    <span className="text-3xl font-bold text-red-500">+{riskIncrease}%</span>
                    <span className="text-sm text-muted-foreground">Risk Increase</span>
                  </div>
                  {/* Bar Chart */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground mb-2">Last 8 hours</p>
                    <div className="flex items-end gap-1 h-32">
                      {[45, 52, 48, 65, 72, 58, 78, 87].map((value, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end">
                          <div
                            className="bg-red-500 rounded-t-lg"
                            style={{ height: `${value}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: AI Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                Step 1: AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  Pattern matches <span className="font-semibold text-purple-600">'Forced Entry'</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  3 previous alerts at this location this month
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Step 2: AI recommended Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="verify-visual" />
                <Label htmlFor="verify-visual" className="text-sm font-normal">
                  Visually Confirm Intruder
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="verify-card" />
                <Label htmlFor="verify-card" className="text-sm font-normal">
                  Check Card Access Logs
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="call-guard" />
                <Label htmlFor="call-guard" className="text-sm font-normal">
                  Call the On-Site Guard
                </Label>
              </div>
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
              <div className="relative aspect-4/3 bg-black rounded-lg overflow-hidden">
                {/* Placeholder for camera feed - replace with actual video feed */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Video className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Camera Feed Unavailable</p>
                    <Badge variant="outline" className="mt-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                      Live
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-sm font-medium">
                  Account {alert.accountNumber}, Zone {alert.zoneNumber || "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Camera 1 - Main Entrance
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
