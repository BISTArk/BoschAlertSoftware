import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Activity, Clock } from "lucide-react"

export function AlertsStats() {
  const totalCount = useQuery(api.alerts.getAlertsCount)
  const recentAlerts = useQuery(api.alerts.getAlerts, {
    paginationOpts: {
      numItems: 10,
    },
  })

  // Calculate stats
  const total = totalCount || 0
  const lastHour = recentAlerts?.page.filter((alert) => {
    const hourAgo = Date.now() - 60 * 60 * 1000
    return alert.receivedAt > hourAgo
  }).length || 0

  const uniqueAccounts = new Set(
    recentAlerts?.page.map((alert) => alert.accountNumber) || []
  ).size

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">
            All time security events
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Hour</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lastHour}</div>
          <p className="text-xs text-muted-foreground">
            Alerts in the past 60 minutes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueAccounts}</div>
          <p className="text-xs text-muted-foreground">
            Unique accounts (recent)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
