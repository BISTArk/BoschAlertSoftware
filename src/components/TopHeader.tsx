import { Search, Bell, Settings2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export function TopHeader() {
  const { logout } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-card flex items-center px-6 gap-4 fixed top-0 right-0 left-64 z-10">
      <h2 className="text-lg font-semibold">Security Operations Dashboard</h2>
      <p className="text-sm text-muted-foreground">Real-time monitoring and incident management</p>
      
      <div className="ml-auto flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Alerts, Locations..."
            className="pl-10 h-9 bg-background"
          />
        </div>

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            3
          </Badge>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon">
          <Settings2 className="h-5 w-5" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Logout */}
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
