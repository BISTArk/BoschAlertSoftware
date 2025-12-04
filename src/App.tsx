import { AlertsTable } from "@/components/alerts-table"
import { AlertsStats } from "@/components/alerts-stats"
import { ThemeToggle } from "@/components/theme-toggle"
import { Login } from "@/components/Login"
import { useAuth } from "@/contexts/AuthContext"
import { AlertCircle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

function App() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Bosch Alert Hub</h1>
              <p className="text-sm text-muted-foreground">
                SIA DC-09 Message Monitor
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <div className="font-medium">{user.name}</div>
              <div className="text-muted-foreground capitalize">{user.role}</div>
            </div>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AlertsStats />
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Security Alerts</h2>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring of SIA messages received via TCP/UDP connections
          </p>
        </div>
        <AlertsTable />
      </main>

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Listening on TCP/UDP Port 4000
        </div>
      </footer>
    </div>
  )
}

export default App
