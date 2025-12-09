import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { FloorPlanCanvas } from "@/components/FloorPlanCanvas";
import { StatsCards } from "@/components/StatsCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function DashboardNew() {
  const { user } = useAuth();
  const [selectedFloor, setSelectedFloor] = useState<Id<"floors"> | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<Id<"alerts"> | null>(null);
  const [mapFilter, setMapFilter] = useState<"all" | "alerts">("all");

  // Fetch data
  const firstFloor = useQuery(api.siteMap.getFirstFloor);
  const alerts = useQuery(api.alerts.getAlerts, {
    paginationOpts: { numItems: 100 },
  });
  const allUsers = useQuery(api.auth.getUsers);
  const sensors = useQuery(
    api.siteMap.getSensorsByFloor,
    selectedFloor ? { floorId: selectedFloor } : "skip"
  );
  const floor = useQuery(
    api.siteMap.getFloor,
    selectedFloor ? { floorId: selectedFloor } : "skip"
  );
  const guards = useQuery(
    api.siteMap.getGuardsOnFloor,
    selectedFloor ? { floorId: selectedFloor } : "skip"
  );

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

    // Only show unresolved alerts
    return filtered.filter((alert) => alert.status !== "resolved");
  };

  const filteredAlerts = getFilteredAlerts();

  const handleAlertClick = (alert: any) => {
    setSelectedAlertId(alert._id);
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
  const alertAccountNumbers = filteredAlerts.map((a) => a.customerAccount || a.accountNumber);

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
          </CardHeader>
          <CardContent className="p-0">
            {selectedFloor && sensors && floor ? (
              <div className="h-[600px] relative">
                <FloorPlanCanvas
                  floorPlanImage={floor.floorPlanUrl}
                  sensors={sensors.map(s => ({
                    _id: s._id,
                    name: s.name,
                    accountNumber: s.accountNumber,
                    x: s.positionX,
                    y: s.positionY,
                    status: s.active ? "active" : "inactive"
                  }))}
                  guards={guards?.map(g => ({
                    _id: g._id,
                    name: g.name,
                    available: g.available
                  }))}
                  highlightAlertId={selectedAlertId}
                  alertAccountNumbers={alertAccountNumbers.filter((a): a is string => a !== undefined)}
                  width={800}
                  height={600}
                  floorWidth={floor.width}
                  floorHeight={floor.height}
                />
              </div>
            ) : (
              <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No site map available</p>
                  <p className="text-sm">Configure sites in Locations</p>
                </div>
              </div>
            )}
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
              <Badge variant="secondary">{filteredAlerts.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Real-time security events</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto">
              {filteredAlerts.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p className="text-sm">No active alerts</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredAlerts.map((alert, index) => {
                    const threat = getThreatLevel(alert.contactIdEventCode || alert.eventCode, alert.priority);
                    const assignedUser = allUsers?.find((u) => u._id === alert.assignedTo);
                    const isSelected = selectedAlertId === alert._id;
                    
                    return (
                      <div
                        key={alert._id}
                        className={`p-4 cursor-pointer transition-colors border-b border-border hover:bg-accent/50 ${
                          isSelected ? "bg-accent" : ""
                        } ${index === 0 ? "" : ""}`}
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
                              📍 {alert.customerAccount || alert.accountNumber || "N/A"} {(alert.zoneId || alert.zone) && `- Zone ${alert.zoneId || alert.zone}`}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
