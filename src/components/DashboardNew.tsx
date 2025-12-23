import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { AreaMapView } from "@/components/AreaMapView";
import { StatsCards } from "@/components/StatsCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface DashboardNewProps {
  onAlertClick?: (alertId: Id<"alerts">) => void;
}

export function DashboardNew({ onAlertClick }: DashboardNewProps = {}) {
  const { user } = useAuth();
  const [selectedFloor, setSelectedFloor] = useState<Id<"floors"> | null>(null);
  const [mapFilter, setMapFilter] = useState<"all" | "alerts">("all");
  const [activeTab, setActiveTab] = useState<"alerts" | "events">("alerts");
  const [showOnlyActive, setShowOnlyActive] = useState(true); // Default to only active alerts

  // Fetch data
  const firstFloor = useQuery(api.siteMap.getFirstFloor);
  const alerts = useQuery(api.alerts.getAlerts, {
    paginationOpts: { numItems: 100 },
  });
  const allUsers = useQuery(api.auth.getUsers);


  // Auto-select first floor
  useEffect(() => {
    if (firstFloor && !selectedFloor) {
      setSelectedFloor(firstFloor._id);
    }
  }, [firstFloor, selectedFloor]);

  // Filter alerts based on user role
  const getFilteredAlerts = () => {
    if (!alerts?.page) return [];

    let filtered = alerts.page;

    // Filter by user role
    if (user?.role === "guard") {
      filtered = filtered.filter((alert) => alert.assignedTo === user._id);
    }

    // Filter by active/all toggle
    if (showOnlyActive) {
      // Only show unresolved alerts (not resolved)
      filtered = filtered.filter((alert) => alert.status !== "resolved");
    }
    // If showOnlyActive is false, show all alerts (including resolved)

    return filtered;
  };

  const filteredAlerts = getFilteredAlerts();

  // Debug: Log alerts being passed to map
  useEffect(() => {
    console.log("📊 Dashboard - Filtered Alerts:", filteredAlerts.length);
    console.log("📍 Alert Details:", filteredAlerts.map(a => ({
      id: a._id,
      account: a.accountNumber,
      eventCode: a.eventCode,
      zone: a.zoneNumber,
      description: a.eventDescription,
      status: a.status
    })));
  }, [filteredAlerts]);

  const handleAlertClick = (alert: any) => {
    onAlertClick?.(alert._id);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "in-progress":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-red-500/20 text-red-400 border-red-500/30";
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getThreatLevel = (eventCode?: string, priority?: string) => {
    // Use new priority field if available
    if (priority === "critical") return { level: "Critical", color: "bg-red-500" };
    if (priority === "high") return { level: "High", color: "bg-orange-500" };
    if (priority === "medium") return { level: "Medium", color: "bg-cyan-500" };
    if (priority === "low") return { level: "Low", color: "bg-green-500" };
    
    // Fallback to old event code mapping for backwards compatibility
    const critical = ["PA", "FA", "MA"];
    const high = ["BA", "UA"];
    const medium = ["TR", "TA"];
    
    if (eventCode && critical.includes(eventCode)) return { level: "Critical", color: "bg-red-500" };
    if (eventCode && high.includes(eventCode)) return { level: "High", color: "bg-orange-500" };
    if (eventCode && medium.includes(eventCode)) return { level: "Medium", color: "bg-cyan-500" };
    return { level: "Low", color: "bg-green-500" };
  };

  // Get account numbers for alerts that should be highlighted


  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Map - 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Security Map</CardTitle>
              <div className="flex items-center gap-4">
                {/* Active/All Alerts Toggle */}
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-active"
                    checked={showOnlyActive}
                    onCheckedChange={setShowOnlyActive}
                  />
                  <Label htmlFor="show-active" className="text-sm cursor-pointer">
                    {showOnlyActive ? "Active Only" : "Show All"}
                  </Label>
                </div>
                
                {/* Map Filter Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={mapFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMapFilter("all")}
                  >
                    All Locations
                  </Button>
                  <Button
                    variant={mapFilter === "alerts" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMapFilter("alerts")}
                  >
                    Alerts Only
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px] relative">
              <AreaMapView
                alerts={filteredAlerts.map(a => ({
                  _id: a._id,
                  accountNumber: a.accountNumber,
                  eventCode: a.eventCode,
                  zoneNumber: a.zoneNumber,
                  priority: a.priority,
                  eventDescription: a.eventDescription,
                  status: a.status
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Live Alerts Feed - 1/3 width */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Live Alerts Feed
              </CardTitle>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{filteredAlerts.length}</Badge>
                {showOnlyActive && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    Active Only
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Real-time security events</p>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "alerts" | "events")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                <TabsTrigger value="alerts" className="rounded-none">
                  Alerts
                  <Badge variant="secondary" className="ml-2">
                    {filteredAlerts.filter(a => a.eventQualifier !== "R").length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="events" className="rounded-none">
                  Events
                  <Badge variant="secondary" className="ml-2">
                    {filteredAlerts.filter(a => a.eventQualifier === "R").length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="alerts" className="mt-0">
                <div className="max-h-[520px] overflow-y-auto">
                  {filteredAlerts.filter(a => a.eventQualifier !== "R").length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <p className="text-sm">No active alerts</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {filteredAlerts
                        .filter(alert => alert.eventQualifier !== "R")
                        .map((alert, index) => {
                          const threat = getThreatLevel(alert.eventCode, alert.priority);
                          const assignedUser = allUsers?.find((u) => u._id === alert.assignedTo);
                          
                          return (
                            <div
                              key={alert._id}
                              className={`p-4 cursor-pointer transition-colors border-b border-border hover:bg-accent/50 ${index === 0 ? "" : ""}`}
                              onClick={() => handleAlertClick(alert)}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${threat.color}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-semibold truncate">
                                      {alert.eventDescription || alert.eventCode}
                                    </h4>
                                    <Badge
                                      className={`text-xs ml-2 ${getStatusBadgeColor(alert.status || "unassigned")}`}
                                      variant="outline"
                                    >
                                      {alert.status === "in-progress" ? "In Progress" : alert.status || "Unassigned"}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    📍 {alert.accountNumber || alert.customerAccount || "N/A"} {alert.zoneNumber && `- Zone ${alert.zoneNumber}`}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>⏰ {formatTimeAgo(alert.receivedAt)}</span>
                                    {assignedUser && (
                                      <span className="text-primary">👤 {assignedUser.name}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="events" className="mt-0">
                <div className="max-h-[520px] overflow-y-auto">
                  {filteredAlerts.filter(a => a.eventQualifier === "R").length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <p className="text-sm">No events recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {filteredAlerts
                        .filter(alert => alert.eventQualifier === "R")
                        .map((alert, index) => {
                          const assignedUser = allUsers?.find((u) => u._id === alert.assignedTo);
                          
                          return (
                            <div
                              key={alert._id}
                              className={`p-4 cursor-pointer transition-colors border-b border-border hover:bg-accent/50 ${index === 0 ? "" : ""}`}
                              onClick={() => handleAlertClick(alert)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full mt-2 bg-green-500" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-semibold truncate">
                                      {alert.eventDescription || alert.eventCode} - Restored
                                    </h4>
                                    <Badge
                                      className="text-xs ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      variant="outline"
                                    >
                                      Restore
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    📍 {alert.accountNumber || alert.customerAccount || "N/A"} {alert.zoneNumber && `- Zone ${alert.zoneNumber}`}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>⏰ {formatTimeAgo(alert.receivedAt)}</span>
                                    {assignedUser && (
                                      <span className="text-primary">👤 {assignedUser.name}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
