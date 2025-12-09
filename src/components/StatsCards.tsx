import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Flame, AlertTriangle, Clock, WifiOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function StatsCards() {
  const { user } = useAuth();
  const alerts = useQuery(api.alerts.getAlerts, {
    paginationOpts: { numItems: 1000 },
  });

  // Filter alerts based on user role
  const getFilteredAlerts = () => {
    if (!alerts?.page) return [];
    
    if (user?.role === "guard") {
      return alerts.page.filter((alert) => alert.assignedTo === user._id);
    }
    
    return alerts.page;
  };

  const filteredAlerts = getFilteredAlerts();

  // Calculate stats using new priority field
  const criticalAlerts = filteredAlerts.filter(
    (a) => a.priority === "critical" && a.status !== "resolved"
  ).length;

  const highPriorityAlerts = filteredAlerts.filter(
    (a) => a.priority === "high" && a.status !== "resolved"
  ).length;

  const unassignedAlerts = filteredAlerts.filter(
    (a) => a.status === "unassigned"
  ).length;

  // Count offline sensors (sensor troubles and communication issues)
  const offlineSensors = filteredAlerts.filter(
    (a) => (
      a.eventCategory === "Sensor" || 
      a.eventCategory === "Communication Troubles"
    ) && a.status !== "resolved"
  ).length;

  const stats = [
    {
      title: "Critical Alerts",
      value: criticalAlerts,
      subtitle: "Last 24 hours",
      icon: Flame,
      iconBg: "bg-red-500/10",
      iconColor: "text-red-500",
      trend: "up",
    },
    {
      title: "High Priority Alerts",
      value: highPriorityAlerts,
      subtitle: "Last 24 hours",
      icon: AlertTriangle,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-500",
      trend: "up",
    },
    {
      title: "Unassigned Alerts",
      value: unassignedAlerts,
      subtitle: "Last 24 hours",
      icon: Clock,
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-500",
      trend: "neutral",
    },
    {
      title: "Offline Sensors",
      value: offlineSensors,
      subtitle: "Last 24 hours",
      icon: WifiOff,
      iconBg: "bg-gray-500/10",
      iconColor: "text-gray-500",
      trend: "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", stat.iconBg)}>
                <Icon className={cn("h-6 w-6", stat.iconColor)} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
