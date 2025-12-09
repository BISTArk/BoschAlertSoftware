import { useState } from "react"
import { DashboardNew } from "@/components/DashboardNew"
import { AlertsTable } from "@/components/alerts-table"
import { Login } from "@/components/Login"
import { SiteMapPage } from "@/components/SiteMapPage"
import { Sidebar } from "@/components/Sidebar"
import { TopHeader } from "@/components/TopHeader"
import { GuardAvailabilityToggle } from "@/components/GuardAvailabilityToggle"
import { TestAlertGenerator } from "@/components/TestAlertGenerator"
import { useAuth } from "@/contexts/AuthContext"

function App() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<string>("dashboard");

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <>
            {user.role === "guard" && <GuardAvailabilityToggle />}
            <DashboardNew />
          </>
        );
      case "alerts":
        return (
          <>
            {user.role === "guard" && <GuardAvailabilityToggle />}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">All Security Alerts</h2>
              <p className="text-sm text-muted-foreground">
                Complete table view of all SIA messages received via TCP/UDP connections
              </p>
            </div>
            <AlertsTable />
          </>
        );
      case "locations":
        return <SiteMapPage />;
      case "sensors":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Sensors Management</h2>
            <p className="text-muted-foreground">Configure and monitor all security sensors</p>
          </div>
        );
      case "escalations":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Escalations</h2>
            <p className="text-muted-foreground">Manage alert escalation rules and workflows</p>
          </div>
        );
      case "reports":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Reports</h2>
            <p className="text-muted-foreground">Generate and view security reports and analytics</p>
          </div>
        );
      case "admin":
        return (
          <div className="space-y-6">
            <div className="text-center py-6">
              <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>
              <p className="text-muted-foreground">System administration and user management</p>
            </div>
            <div className="flex justify-center">
              <TestAlertGenerator />
            </div>
          </div>
        );
      default:
        return <DashboardNew />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      
      {/* Main Content Area */}
      <div className="ml-64">
        {/* Top Header */}
        <TopHeader />
        
        {/* Main Content */}
        <main className="pt-16 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default App
