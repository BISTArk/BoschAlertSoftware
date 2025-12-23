import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Clock, TrendingUp, Users, Radio, Shield } from "lucide-react";

export function AnalyticsDashboard() {
  const analytics = useQuery(api.alerts.getAnalytics);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const getThreatColor = (score: number) => {
    if (score >= 80) return "text-red-600 dark:text-red-400";
    if (score >= 60) return "text-orange-600 dark:text-orange-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return "text-green-600 dark:text-green-400";
    if (health >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (health >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive security system analytics and insights</p>
      </div>

      {/* Section 1: Alerts Analysis */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-bold">Alerts Analysis</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Overall Threat Score */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Threat Score</CardTitle>
              <Shield className={`h-4 w-4 ${getThreatColor(analytics.alertsAnalysis.overallThreatScore)}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getThreatColor(analytics.alertsAnalysis.overallThreatScore)}`}>
                {analytics.alertsAnalysis.overallThreatScore}/100
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.alertsAnalysis.overallThreatScore >= 80 ? "Critical" : 
                 analytics.alertsAnalysis.overallThreatScore >= 60 ? "High" : 
                 analytics.alertsAnalysis.overallThreatScore >= 40 ? "Medium" : "Low"}
              </p>
            </CardContent>
          </Card>

          {/* Total Alerts Last 30 Days */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts (Last 30 Days)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.alertsAnalysis.totalAlertsLast30Days}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.alertsAnalysis.unresolvedCount} unresolved
              </p>
            </CardContent>
          </Card>

          {/* Active Locations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.alertsAnalysis.activeLocations}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.alertsAnalysis.totalLocations} total locations
              </p>
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {analytics.alertsAnalysis.criticalAlertsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Needs immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alert Distribution Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Distribution by Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution by Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.alertsAnalysis.distributionBySeverity.map((item) => (
                  <div key={item.severity} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{item.severity}</span>
                      <span className="text-muted-foreground">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.severity === 'critical' ? 'bg-red-500' :
                          item.severity === 'high' ? 'bg-orange-500' :
                          item.severity === 'medium' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Distribution by Location */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Locations by Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.alertsAnalysis.distributionByLocation.slice(0, 5).map((item, index) => (
                  <div key={item.location} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        #{index + 1} - Account {item.location}
                      </span>
                      <span className="text-muted-foreground">{item.count} alerts</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 2: Security Operators Performance */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Security Operators Performance</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Response Health */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Health</CardTitle>
              <Activity className={`h-4 w-4 ${getHealthColor(analytics.operatorsPerformance.overallResponseHealth)}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthColor(analytics.operatorsPerformance.overallResponseHealth)}`}>
                {analytics.operatorsPerformance.overallResponseHealth}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.operatorsPerformance.overallResponseHealth >= 80 ? "Excellent" : 
                 analytics.operatorsPerformance.overallResponseHealth >= 60 ? "Good" : "Needs Improvement"}
              </p>
            </CardContent>
          </Card>

          {/* Avg Resolution Time */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.operatorsPerformance.avgResolutionTime}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.operatorsPerformance.totalResolved} resolved
              </p>
            </CardContent>
          </Card>

          {/* Escalations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escalations</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.operatorsPerformance.escalationPercent}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.operatorsPerformance.escalationsCount} escalated
              </p>
            </CardContent>
          </Card>

          {/* Daily Average */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Avg Resolved</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analytics.operatorsPerformance.avgResolvedPerDay}
              </div>
              <p className="text-xs text-muted-foreground">
                alerts per day
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Resolution Time by Criticality */}
          <Card>
            <CardHeader>
              <CardTitle>Avg Resolution Time by Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.operatorsPerformance.avgTimeByPriority.map((item) => (
                  <div key={item.priority} className="flex items-center justify-between">
                    <span className="text-sm capitalize font-medium">{item.priority}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            item.priority === 'critical' ? 'bg-red-500' :
                            item.priority === 'high' ? 'bg-orange-500' :
                            item.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(item.avgMinutes / 60 * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">{item.avgTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Resolution Reasons */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Resolution Reasons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.operatorsPerformance.topResolutionReasons.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="font-medium flex-1">{item.reason}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 3: Sensor Health */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="h-6 w-6 text-green-500" />
          <h2 className="text-2xl font-bold">Sensor Health</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Overall System Health */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall System Health</CardTitle>
              <Activity className={`h-4 w-4 ${getHealthColor(analytics.sensorHealth.systemHealth)}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthColor(analytics.sensorHealth.systemHealth)}`}>
                {analytics.sensorHealth.systemHealth}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.sensorHealth.systemHealth >= 80 ? "Excellent" : 
                 analytics.sensorHealth.systemHealth >= 60 ? "Good" : "Needs Attention"}
              </p>
            </CardContent>
          </Card>

          {/* Panels Alarmed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Panels Alarmed</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.sensorHealth.panelsAlarmedPercent}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.sensorHealth.panelsAlarmed} of {analytics.sensorHealth.totalPanels} panels
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
              <div className="text-2xl font-bold">{analytics.sensorHealth.sensorsActivePercent}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.sensorHealth.sensorsActive} of {analytics.sensorHealth.totalSensors} sensors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sensor Health Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sensor Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Active Sensors</span>
                  <span className="text-green-600">{analytics.sensorHealth.sensorsActive}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${analytics.sensorHealth.sensorsActivePercent}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Alarmed Panels</span>
                  <span className="text-red-600">{analytics.sensorHealth.panelsAlarmed}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${analytics.sensorHealth.panelsAlarmedPercent}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sensors</p>
                  <p className="text-2xl font-bold">{analytics.sensorHealth.totalSensors}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Panels</p>
                  <p className="text-2xl font-bold">{analytics.sensorHealth.totalPanels}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
