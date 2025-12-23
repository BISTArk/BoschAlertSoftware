import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  AlertCircle,
  MapPin,
  Radio,
  TrendingUp,
  FileText,
  Settings,
  Shield,
  BarChart3,
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { user } = useAuth();

  const navigationItems = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard, roles: ["guard", "head", "admin"] },
    { id: "alerts", label: "Alerts", icon: AlertCircle, roles: ["guard", "head", "admin"] },
    { id: "analytics", label: "Analytics", icon: BarChart3, roles: ["head", "admin"] },
    { id: "locations", label: "Locations", icon: MapPin, roles: ["head", "admin"] },
    { id: "sensors", label: "Sensors", icon: Radio, roles: ["head", "admin"] },
    { id: "escalations", label: "Escalations", icon: TrendingUp, roles: ["head", "admin"] },
    { id: "reports", label: "Reports", icon: FileText, roles: ["head", "admin"] },
    { id: "admin", label: "Admin", icon: Settings, roles: ["admin"] },
  ];

  const filteredItems = navigationItems.filter((item) =>
    item.roles.includes(user?.role || "")
  );

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-screen fixed left-0 top-0">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">SecureOps</h1>
            <p className="text-xs text-muted-foreground">Enterprise</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
