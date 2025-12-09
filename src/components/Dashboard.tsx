import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { FloorPlanCanvas } from "@/components/FloorPlanCanvas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, TrendingUp } from "lucide-react";

export function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"active" | "queue" | "watchlist">("active");
  const [selectedFloor, setSelectedFloor] = useState<Id<"floors"> | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<Id<"alerts"> | null>(null);

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

  // Filter alerts based on user role and tab
  const getFilteredAlerts = () => {
    if (!alerts?.page) return [];

    let filtered = alerts.page;

    // Filter by user role
    if (user?.role === "guard") {
      // Guards see only their assigned alerts
      filtered = filtered.filter((alert) => alert.assignedTo === user._id);
    }

    // Filter by tab
    switch (activeTab) {
      case "active":
        filtered = filtered.filter(
          (alert) => alert.status !== "resolved" && alert.status !== "unassigned"
        );
        break;
      case "queue":
        filtered = filtered.filter((alert) => alert.status === "unassigned");
        break;
      case "watchlist":
        // Watchlist could be alerts marked for follow-up
        filtered = filtered.filter((alert) => alert.status === "resolved");
        break;
    }

    return filtered;
  };

  const filteredAlerts = getFilteredAlerts();

  // Calculate stats
  const activeIncidents = alerts?.page.filter(
    (alert) => alert.status !== "resolved"
  ).length || 0;

  const myLoad = user?.role === "guard"
    ? Math.min(
        100,
        Math.round(
          (alerts?.page.filter((a) => a.assignedTo === user._id && a.status !== "resolved")
            .length || 0) * 33.33
        )
      )
    : 0;

  const calculateResponseTime = () => {
    if (!alerts?.page) return "0s";
    const resolvedAlerts = alerts.page.filter(
      (a) => a.status === "resolved" && a.resolvedAt && a.assignedAt
    );
    if (resolvedAlerts.length === 0) return "0s";

    const avgTime =
      resolvedAlerts.reduce((sum, alert) => {
        return sum + (alert.resolvedAt! - alert.assignedAt!);
      }, 0) / resolvedAlerts.length;

    const seconds = Math.round(avgTime / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.round(minutes / 60)}h`;
  };

  const getThreatLevel = (eventCode?: string, priority?: string) => {
    // Use new priority field if available
    if (priority === "critical") return { level: "Critical", color: "bg-red-500" };
    if (priority === "high") return { level: "High", color: "bg-orange-500" };
    if (priority === "medium") return { level: "Medium", color: "bg-cyan-500" };
    if (priority === "low") return { level: "Low", color: "bg-green-500" };
    
    // Fallback to old event code mapping for backwards compatibility
    const critical = ["PA", "FA", "MA"]; // Panic, Fire, Medical
    const high = ["BA", "UA"]; // Burglary, Unauthorized Access
    const medium = ["TR", "TA"]; // Trouble, Tamper
    
    if (eventCode && critical.includes(eventCode)) return { level: "Critical", color: "bg-red-500" };
    if (eventCode && high.includes(eventCode)) return { level: "High", color: "bg-orange-500" };
    if (eventCode && medium.includes(eventCode)) return { level: "Medium", color: "bg-cyan-500" };
    return { level: "Low", color: "bg-green-500" };
  };

  // Filter alerts for threat counts based on user role
  const alertsForCounting = user?.role === "guard"
    ? alerts?.page.filter((a) => a.assignedTo === user._id) || []
    : alerts?.page || [];

  const threatCounts = {
    critical: alertsForCounting.filter((a) => getThreatLevel(a.contactIdEventCode || a.eventCode, a.priority).level === "Critical" && a.status !== "resolved").length,
    high: alertsForCounting.filter((a) => getThreatLevel(a.contactIdEventCode || a.eventCode, a.priority).level === "High" && a.status !== "resolved").length,
    medium: alertsForCounting.filter((a) => getThreatLevel(a.contactIdEventCode || a.eventCode, a.priority).level === "Medium" && a.status !== "resolved").length,
    low: alertsForCounting.filter((a) => getThreatLevel(a.contactIdEventCode || a.eventCode, a.priority).level === "Low" && a.status !== "resolved").length,
  };

  const handleAlertClick = (alert: any) => {
    setSelectedAlertId(alert._id);
    // Keep current floor - alerts will be highlighted on the active floor's map
    // In future, we could add a query to find which floor has the sensor for this account number
  };

  // Get account numbers for alerts that should be highlighted
  const alertAccountNumbers = filteredAlerts
    .filter((a) => a.status !== "resolved")
    .map((a) => a.customerAccount || a.accountNumber)
    .filter((a): a is string => a !== undefined);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      case "in-progress":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
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

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-12 gap-4">
      {/* Left Sidebar - Alert List */}
      <div className="col-span-3 flex flex-col space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "active"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "queue"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Queue
          </button>
          <button
            onClick={() => setActiveTab("watchlist")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "watchlist"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Watchlist
          </button>
        </div>

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No alerts in {activeTab}
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const threat = getThreatLevel(alert.contactIdEventCode || alert.eventCode, alert.priority);
              const assignedUser = allUsers?.find((u) => u._id === alert.assignedTo);
              
              return (
                <Card
                  key={alert._id}
                  className={`p-3 cursor-pointer transition-all hover:border-primary ${
                    selectedAlertId === alert._id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="font-semibold text-sm">
                        {alert.eventDescription || alert.eventCode}
                      </span>
                    </div>
                    <Badge
                      className={`text-xs ${getStatusBadgeColor(alert.status || "unassigned")}`}
                      variant="outline"
                    >
                      {alert.status === "in-progress" ? "In Progress" : alert.status || "Unassigned"}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>{alert.customerAccount || alert.accountNumber || "N/A"} {(alert.zoneId || alert.zone) && `- Zone ${alert.zoneId || alert.zone}`}</div>
                    <div className="flex items-center justify-between">
                      <span>{formatTimeAgo(alert.receivedAt)}</span>
                      {assignedUser && (
                        <span className="text-primary">{assignedUser.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${threat.color}`} />
                    <span className="text-xs font-medium">{threat.level}</span>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Center - Site Map */}
      <div className="col-span-6 flex flex-col space-y-4">
        <Card className="flex-1 p-4 overflow-hidden bg-linear-to-br from-purple-900/20 to-indigo-900/20">
          {selectedFloor && sensors && floor ? (
            <div className="h-full flex flex-col">
              <div className="mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {floor.name}
                </h3>
              </div>
              <div className="flex-1 flex items-center justify-center overflow-hidden">
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
                  alertAccountNumbers={alertAccountNumbers}
                  width={800}
                  height={500}
                  floorWidth={floor.width}
                  floorHeight={floor.height}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No site map available</p>
                <p className="text-sm">Configure sites in Site Map Setup</p>
              </div>
            </div>
          )}
        </Card>

        {/* Map Legend */}
        <Card className="p-3">
          <div className="flex items-center gap-6 text-xs">
            <span className="font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Map Legend
            </span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Sensors</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
              <span>Active Alert</span>
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Critical ({threatCounts.critical})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>High ({threatCounts.high})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span>Medium ({threatCounts.medium})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Low ({threatCounts.low})</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Sidebar - Stats */}
      <div className="col-span-3 flex flex-col space-y-4">
        {/* My Load - Only for Guards */}
        {user?.role === "guard" && (
          <Card className="p-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-4">MY LOAD</div>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - myLoad / 100)}`}
                    className="text-primary transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold">{myLoad}%</div>
                  <div className="text-xs text-muted-foreground">
                    {filteredAlerts.filter((a) => a.status !== "resolved").length} Active
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Active Incidents */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">ACTIVE INCIDENTS</div>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-4xl font-bold text-primary">{activeIncidents}</div>
        </Card>

        {/* Response Time */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">RESPONSE TIME</div>
            <Clock className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-4xl font-bold text-green-500">{calculateResponseTime()}</div>
          <div className="text-xs text-muted-foreground mt-1">Average</div>
        </Card>

        {/* Additional Stats for Heads/Admins */}
        {(user?.role === "head" || user?.role === "admin") && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">TEAM STATUS</div>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Available Guards</span>
                <span className="font-semibold">
                  {allUsers?.filter((u) => u.role === "guard" && u.available).length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Guards</span>
                <span className="font-semibold">
                  {allUsers?.filter((u) => u.role === "guard").length || 0}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
