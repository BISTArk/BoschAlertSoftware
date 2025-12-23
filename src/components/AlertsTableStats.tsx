import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Radio, Clock } from "lucide-react";

export function AlertsTableStats() {
  const stats = useQuery(api.alerts.getAlertStats);

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getHealthColor = (health: number) => {
    if (health >= 80) return "text-green-600 dark:text-green-400";
    if (health >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (health >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Overall System Health */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <Activity className={`h-4 w-4 ${getHealthColor(stats.systemHealth)}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getHealthColor(stats.systemHealth)}`}>
            {stats.systemHealth}%
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.systemHealth >= 80 ? "Excellent" : stats.systemHealth >= 60 ? "Good" : stats.systemHealth >= 40 ? "Fair" : "Needs Attention"}
          </p>
        </CardContent>
      </Card>

      {/* Panel Alarmed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Panels Alarmed</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.panelsAlarmedPercent}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.panelsAlarmed} of {stats.totalPanels} panels
          </p>
        </CardContent>
      </Card>

      {/* Sensors Active */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sensors Active</CardTitle>
          <Radio className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.sensorsActivePercent}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.sensorsActive} of {stats.totalSensors} sensors
          </p>
        </CardContent>
      </Card>

      {/* Average Resolution Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgResolutionTime}</div>
          <p className="text-xs text-muted-foreground">
            {stats.resolvedAlertsCount} alerts resolved
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
