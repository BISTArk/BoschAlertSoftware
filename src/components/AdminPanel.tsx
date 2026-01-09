import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertTriangle, 
  Radio, 
  Flame, 
  Heart, 
  DoorOpen, 
  RefreshCw,
  Trash2,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Radar
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "recurring_false",
    name: "Recurring False Alarms",
    description: "Branch 2 Area 03 Zone 08 - 4 false alarms over 4 days",
    icon: <RefreshCw className="h-5 w-5" />,
    color: "text-yellow-500"
  },
  {
    id: "communication",
    name: "Communication Failure",
    description: "Branch 2 Area 01 - Panel disconnection for 2h 15m",
    icon: <Radio className="h-5 w-5" />,
    color: "text-orange-500"
  },
  {
    id: "sequential",
    name: "Sequential Correlated Burglary",
    description: "ATM Area 01 Zone 03 - Burglary + Tamper (45s apart)",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-red-500"
  },
  {
    id: "motion",
    name: "Motion Detection",
    description: "ATM Area 01 Zone 05 - Repeated motion, potential loitering",
    icon: <Radar className="h-5 w-5" />,
    color: "text-blue-500"
  },
  {
    id: "fire",
    name: "Fire Emergency",
    description: "Branch 1 Area 01→02 Zone 07 - Smoke spreading from basement",
    icon: <Flame className="h-5 w-5" />,
    color: "text-red-600"
  },
  {
    id: "single_critical",
    name: "Medical Emergency",
    description: "Branch 2 Area 02 Zone 05 - Medical panic button",
    icon: <Heart className="h-5 w-5" />,
    color: "text-pink-500"
  },
  {
    id: "sensor_not_restored",
    name: "Sensor Not Restored",
    description: "Branch 1 Area 02 Zone 04 - Open + lost supervision + low battery",
    icon: <DoorOpen className="h-5 w-5" />,
    color: "text-purple-500"
  }
];

export function AdminPanel() {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<string>("");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  const clearAllAlerts = useMutation(api.migration.clearAllAlerts);

  const toggleScenario = (scenarioId: string) => {
    setSelectedScenarios(prev => 
      prev.includes(scenarioId) 
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const selectAll = () => {
    setSelectedScenarios(SCENARIOS.map(s => s.id));
  };

  const deselectAll = () => {
    setSelectedScenarios([]);
  };

  const streamScenarios = async () => {
    if (selectedScenarios.length === 0) {
      alert("Please select at least one scenario");
      return;
    }

    setIsStreaming(true);
    setStreamingStatus("Connecting to scenario streamer...");

    try {
      // Call the backend endpoint to trigger scenario streaming
      const response = await fetch("http://localhost:7801/stream-scenarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenarios: selectedScenarios
        })
      });

      if (!response.ok) {
        throw new Error("Failed to start scenario streaming");
      }

      setStreamingStatus("✅ Scenarios streaming started! Check the terminal for progress.");
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setStreamingStatus("");
        setIsStreaming(false);
      }, 5000);
    } catch (error) {
      console.error("Error streaming scenarios:", error);
      setStreamingStatus("❌ Error: Make sure the Admin API is running on port 7801");
      setIsStreaming(false);
    }
  };

  const handleClearAlerts = async () => {
    setIsClearing(true);
    try {
      await clearAllAlerts();
      setShowClearDialog(false);
      alert("✅ All alerts cleared successfully!");
    } catch (error) {
      console.error("Error clearing alerts:", error);
      alert("❌ Failed to clear alerts");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Admin Panel</h2>
        <p className="text-muted-foreground">
          System administration, scenario testing, and database management
        </p>
      </div>

      {/* Scenario Testing Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Scenario Testing
              </CardTitle>
              <CardDescription className="mt-2">
                Simulate realistic security system scenarios for AI testing
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAll}
                disabled={selectedScenarios.length === SCENARIOS.length}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={deselectAll}
                disabled={selectedScenarios.length === 0}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Deselect All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scenarios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCENARIOS.map((scenario) => (
              <Card
                key={scenario.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedScenarios.includes(scenario.id)
                    ? "border-primary border-2 bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => toggleScenario(scenario.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedScenarios.includes(scenario.id)}
                      onCheckedChange={() => toggleScenario(scenario.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={scenario.color}>
                          {scenario.icon}
                        </div>
                        <h3 className="font-semibold text-sm">
                          {scenario.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {scenario.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Count Badge */}
          {selectedScenarios.length > 0 && (
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="px-4 py-2">
                {selectedScenarios.length} scenario{selectedScenarios.length !== 1 ? 's' : ''} selected
              </Badge>
            </div>
          )}

          {/* Stream Button */}
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={streamScenarios}
              disabled={selectedScenarios.length === 0 || isStreaming}
              size="lg"
              className="w-full max-w-md"
            >
              {isStreaming ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Streaming...
                </>
              ) : (
                <>
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Stream Selected Scenarios
                </>
              )}
            </Button>
            
            {streamingStatus && (
              <div className={`text-sm px-4 py-2 rounded-md ${
                streamingStatus.startsWith("✅") 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              }`}>
                {streamingStatus}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Prerequisites & Instructions:
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Admin API must be running: <code className="bg-muted px-1 py-0.5 rounded">npx tsx server/adminApi.ts</code></li>
              <li>TCP Server must be running: <code className="bg-muted px-1 py-0.5 rounded">npx tsx server/siaReceiver.ts</code></li>
              <li>Alert analyzer should be active for AI analysis</li>
              <li>Database should be seeded with account 3333</li>
              <li>For recurring false alarms: Mark first 3 alerts as false positive via UI for pattern detection</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Database Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Database Management
          </CardTitle>
          <CardDescription>
            Manage alerts and database operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={() => setShowClearDialog(true)}
              variant="destructive"
              size="lg"
              className="w-full max-w-md"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Clear All Alerts
            </Button>
            <p className="text-xs text-muted-foreground text-center max-w-md">
              ⚠️ This will permanently delete all alerts from the database. This action cannot be undone.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Clear Alerts Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete All Alerts?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>ALL alerts</strong> from the database.
              This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAlerts}
              disabled={isClearing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isClearing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete All Alerts"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
