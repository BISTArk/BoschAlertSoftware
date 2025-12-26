import { useState } from "react";
import { Book, Home, Settings, Users, Bell, Map, BarChart, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export function Documentation({ onBack }: { onBack?: () => void }) {
  const [activeSection, setActiveSection] = useState("overview");

  const sections: DocSection[] = [
    {
      id: "overview",
      title: "Overview",
      icon: <Home className="h-4 w-4" />,
      content: <OverviewSection />
    },
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <Book className="h-4 w-4" />,
      content: <GettingStartedSection />
    },
    {
      id: "site-mapping",
      title: "Sensor Setup",
      icon: <Map className="h-4 w-4" />,
      content: <SiteMappingSection />
    },
    {
      id: "features",
      title: "Features",
      icon: <Shield className="h-4 w-4" />,
      content: <FeaturesSection />
    },
    {
      id: "user-guide",
      title: "User Guide",
      icon: <Users className="h-4 w-4" />,
      content: <UserGuideSection />
    },
    {
      id: "alerts",
      title: "Alert Management",
      icon: <Bell className="h-4 w-4" />,
      content: <AlertsSection />
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: <BarChart className="h-4 w-4" />,
      content: <AnalyticsSection />
    },
    {
      id: "admin",
      title: "Administration",
      icon: <Settings className="h-4 w-4" />,
      content: <AdminSection />
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Book className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AISAC Documentation</h1>
              <p className="text-muted-foreground">Comprehensive guide to using the security alert management system</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full h-auto gap-2">
            {sections.map((section) => (
              <TabsTrigger 
                key={section.id} 
                value={section.id}
                className="flex items-center gap-2 px-3 py-2"
              >
                {section.icon}
                <span className="hidden sm:inline">{section.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="space-y-6">
              {section.content}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

// Overview Section
function OverviewSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to AISAC</CardTitle>
          <CardDescription>Enterprise security alert management system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            AISAC (AI-led Sensors and Control) is a comprehensive security alert management system designed to receive, process, 
            and manage security alerts from security panels using the SIA DC-09 protocol. The system 
            provides real-time monitoring, intelligent alert routing, and powerful analytics for security operations.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Real-time SIA DC-09 protocol message processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>TCP/UDP server for receiving security panel alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Multi-site and multi-area support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Role-based access control (Guards, Heads, Admins)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Interactive area plans and site mapping</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Intelligent alert assignment and escalation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Frontend:</strong> React + Vite + TypeScript</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Backend:</strong> Convex (Real-time database)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Alert Receiver:</strong> Node.js TCP/UDP server</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Protocol:</strong> SIA DC-09 (DC-09-1998.10)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>UI:</strong> Tailwind CSS + shadcn/ui</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Getting Started Section
function GettingStartedSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Prerequisites</h3>
            <ul className="space-y-2 text-sm ml-4">
              <li>• Node.js 18.x or higher (for backend and Convex)</li>
              <li>• Modern web browser (Chrome, Firefox, Edge, Safari)</li>
              <li>• Windows server (x64)</li>
              <li>• Open ports for SIA receiver (default: 7800) and web server (default: 3000)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Hardware Requirements</h3>
            <ul className="space-y-2 text-sm ml-4">
              <li>• <strong>CPU:</strong> Dual-core processor or better</li>
              <li>• <strong>RAM:</strong> 4GB minimum (8GB recommended)</li>
              <li>• <strong>Storage:</strong> 2GB available disk space</li>
              <li>• <strong>Network:</strong> Stable LAN connection</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>On-Premises Installation & Setup</CardTitle>
          <CardDescription>How to deploy AISAC for on-premises use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Step 1: Extract the Deployment Package</h3>
            <ul className="space-y-2 text-sm ml-4">
              <li>• Extract the provided ZIP file containing all necessary files to your server.</li>
              <li>• The package includes the frontend build, backend code, and startup scripts.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Step 2: Start the Backend Services</h3>
            <p className="text-sm mb-2">Double-click the <span className="font-mono">start-backend.bat</span> file to start the Convex backend and SIA receiver:</p>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm mb-2">
              <p>@echo off</p>
              <p>REM Start Convex backend</p>
              <p>start /B npx convex dev --no-interactive</p>
              <p>REM Wait for Convex to start (adjust timeout as needed)</p>
              <p>PING 127.0.0.1 -n 6 &gt;NUL</p>
              <p>REM Start SIA receiver</p>
              <p>start /B node server\server.js</p>
              <p>echo AISAC backend and SIA receiver started.</p>
              <p>pause</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">This will run in the background. A command prompt window will appear briefly and then close.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Step 3: Start the Frontend</h3>
            <p className="text-sm mb-2">Double-click the <span className="font-mono">start-frontend.bat</span> file to start the web server:</p>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm mb-2">
              <p>@echo off</p>
              <p>REM Start frontend web server</p>
              <p>npx serve dist -s -l 3000</p>
              <p>pause</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">This will start a local web server on port 3000. Open your browser and navigate to <span className="font-mono">http://localhost:3000</span></p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Step 4: Access the Application</h3>
            <ul className="space-y-2 text-sm ml-4">
              <li>• Open your web browser and go to <span className="font-mono">http://localhost:3000</span></li>
              <li>• Log in using the default credentials provided below.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Step 5: (Optional) Seed Initial Data</h3>
            <ul className="space-y-2 text-sm ml-4">
              <li>• If you need demo data, run the provided seed scripts by double-clicking <span className="font-mono">seed-data.bat</span></li>
              <li>• Default user accounts are listed below.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default User Accounts</CardTitle>
          <CardDescription>Use these credentials to log in after setup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="border rounded-lg p-3">
              <p className="font-semibold text-sm mb-1">Admin Account</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Username:</span>
                <span className="font-mono">admin</span>
                <span className="text-muted-foreground">Password:</span>
                <span className="font-mono">admin123</span>
              </div>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-semibold text-sm mb-1">Head Account</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Username:</span>
                <span className="font-mono">head1</span>
                <span className="text-muted-foreground">Password:</span>
                <span className="font-mono">head123</span>
              </div>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-semibold text-sm mb-1">Guard Accounts</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Username:</span>
                <span className="font-mono">guard1</span>
                <span className="text-muted-foreground">Password:</span>
                <span className="font-mono">guard123</span>
                <span className="text-muted-foreground">Username:</span>
                <span className="font-mono">guard2</span>
                <span className="text-muted-foreground">Password:</span>
                <span className="font-mono">guard123</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Features Section
function FeaturesSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Core Features</CardTitle>
          <CardDescription>Comprehensive security alert management capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Real-Time Alert Processing
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                <li>• Receives SIA DC-09 formatted messages via TCP/UDP</li>
                <li>• Automatic event classification and prioritization</li>
                <li>• Support for burglary, fire, panic, and access control events</li>
                <li>• Real-time dashboard updates</li>
                <li>• Alert status tracking (unassigned, assigned, in-progress, resolved)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Role-Based Access Control
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                <li>• <strong>Guard:</strong> View assigned alerts, update status, respond to incidents</li>
                <li>• <strong>Head:</strong> Assign alerts, monitor teams, view all sites</li>
                <li>• <strong>Admin:</strong> Full system access, user management, configuration</li>
                <li>• Multi-account access for cross-site monitoring</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Map className="h-4 w-4" />
                Interactive Site Mapping
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                <li>• Upload and annotate area plans</li>
                <li>• Visual sensor placement on area plans</li>
                <li>• Real-time alert location visualization</li>
                <li>• Multi-area support per site</li>
                <li>• Click sensors to view details and history</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Advanced Analytics
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                <li>• Alert trends and patterns over time</li>
                <li>• Response time analytics</li>
                <li>• Event category distribution</li>
                <li>• Peak hours and hotspot analysis</li>
                <li>• Guard performance metrics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert Workflow Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-semibold mb-1">Intelligent Assignment</h4>
              <p className="text-sm text-muted-foreground">
                Automatically or manually assign alerts to available guards based on priority, location, and workload.
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold mb-1">Guard Availability Status</h4>
              <p className="text-sm text-muted-foreground">
                Guards can mark themselves as available/away. System prevents assignment to unavailable guards.
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold mb-1">Response Actions</h4>
              <p className="text-sm text-muted-foreground">
                Predefined response actions: Lockdown, Dispatch, Investigate with guided workflows.
              </p>
            </div>
            <div className="border-l-4 border-amber-500 pl-4">
              <h4 className="font-semibold mb-1">Notes and Documentation</h4>
              <p className="text-sm text-muted-foreground">
                Add detailed notes to each alert for audit trails and handover documentation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// User Guide Section
function UserGuideSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Using AISAC by Role</CardTitle>
          <CardDescription>Role-specific guides for different user types</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="guard" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="guard">Guard</TabsTrigger>
              <TabsTrigger value="head">Head</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="guard" className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-3">Guard User Guide</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Guards are the front-line responders who handle assigned security alerts.
                </p>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">1. Setting Your Availability</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Use the availability toggle at the top of the dashboard to indicate if you're on duty:
                    </p>
                    <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                      <li>• <strong>Available (Green):</strong> You can receive new alert assignments</li>
                      <li>• <strong>Away (Gray):</strong> You won't receive new assignments</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">2. Viewing Assigned Alerts</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Your dashboard shows alerts assigned to you:
                    </p>
                    <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                      <li>• Click on any alert to view full details</li>
                      <li>• Red badges indicate high-priority alerts</li>
                      <li>• Time stamps show how long ago the alert was received</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">3. Responding to Alerts</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Follow the guided workflow when responding:
                    </p>
                    <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                      <li>• <strong>Step 1:</strong> Click "Start" to mark alert as in-progress</li>
                      <li>• <strong>Step 2:</strong> Review alert details and sensor location</li>
                      <li>• <strong>Step 3:</strong> Choose response action (Lockdown/Dispatch/Investigate)</li>
                      <li>• <strong>Step 4:</strong> Add notes and mark as resolved when complete</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">4. Using Area Plans</h4>
                    <p className="text-sm text-muted-foreground">
                      Visual area plans show sensor locations. Click on sensors to view their status and recent alerts.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="head" className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-3">Head User Guide</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Heads supervise guards, assign alerts, and monitor overall security operations.
                </p>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">1. Monitoring All Alerts</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      View all alerts across your assigned sites:
                    </p>
                    <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                      <li>• Navigate to "Alerts" tab for complete table view</li>
                      <li>• Filter by status, priority, or account</li>
                      <li>• Search for specific events or zones</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">2. Assigning Alerts to Guards</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Manually assign or reassign alerts:
                    </p>
                    <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                      <li>• Click "Assign" button on any unassigned alert</li>
                      <li>• Select an available guard from the dropdown</li>
                      <li>• System only shows guards marked as available</li>
                      <li>• Use "Reassign" to transfer alerts between guards</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">3. Viewing Analytics</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Access the Analytics dashboard to:
                    </p>
                    <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                      <li>• Track response times and resolution rates</li>
                      <li>• Identify peak alert times and hotspots</li>
                      <li>• Monitor guard performance and availability</li>
                      <li>• Generate reports for management</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">4. Site and Area Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Navigate to "Locations" to view and manage site configurations, area plans, and sensor placements.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-3">Admin User Guide</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Admins have full system access for configuration, user management, and testing.
                </p>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">1. User Management</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Create and manage user accounts:
                    </p>
                    <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                      <li>• Navigate to Admin panel</li>
                      <li>• Add new guards, heads, or admins</li>
                      <li>• Assign users to specific customer accounts</li>
                      <li>• Deactivate or remove users as needed</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">2. Testing Alert Generation</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Use the Test Alert Generator to:
                    </p>
                    <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                      <li>• Generate sample SIA DC-09 alerts for testing</li>
                      <li>• Select event types and priorities</li>
                      <li>• Test workflow without real security panel</li>
                      <li>• Verify alert routing and assignment logic</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">3. System Configuration</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Configure system-wide settings:
                    </p>
                    <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                      <li>• Set up new customer accounts and sites</li>
                      <li>• Configure areas and partitions</li>
                      <li>• Add and position sensors on area plans</li>
                      <li>• Manage escalation rules (future feature)</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">4. Database Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Use Convex dashboard to view raw data, run migrations, and perform backups.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Alerts Section
function AlertsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Understanding Security Alerts</CardTitle>
          <CardDescription>SIA DC-09 protocol event types and priorities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Alert Priorities</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-red-50 dark:bg-red-950">
                <div className="w-3 h-3 rounded-full bg-red-500 mt-1" />
                <div>
                  <p className="font-semibold text-sm">Critical</p>
                  <p className="text-xs text-muted-foreground">
                    Immediate response required. Includes fire alarms, panic buttons, hold-up alarms.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-orange-50 dark:bg-orange-950">
                <div className="w-3 h-3 rounded-full bg-orange-500 mt-1" />
                <div>
                  <p className="font-semibold text-sm">High</p>
                  <p className="text-xs text-muted-foreground">
                    Urgent attention needed. Includes burglary alarms, forced entry, unauthorized access.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1" />
                <div>
                  <p className="font-semibold text-sm">Medium</p>
                  <p className="text-xs text-muted-foreground">
                    Requires attention soon. Includes access denied, late to close, supervision issues.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="w-3 h-3 rounded-full bg-blue-500 mt-1" />
                <div>
                  <p className="font-semibold text-sm">Low</p>
                  <p className="text-xs text-muted-foreground">
                    Informational. Includes system restores, routine opens/closes, test messages.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Common Event Codes (SIA DC-09)</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="border rounded-lg p-3">
                <p className="font-mono text-sm font-semibold mb-1">BA - Burglary</p>
                <p className="text-xs text-muted-foreground">Intrusion detection activated</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-mono text-sm font-semibold mb-1">FA - Fire Alarm</p>
                <p className="text-xs text-muted-foreground">Fire detection system activated</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-mono text-sm font-semibold mb-1">PA - Panic Alarm</p>
                <p className="text-xs text-muted-foreground">Emergency panic button pressed</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-mono text-sm font-semibold mb-1">HA - Hold-up</p>
                <p className="text-xs text-muted-foreground">Silent hold-up alarm activated</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-mono text-sm font-semibold mb-1">BR - Burglary Restore</p>
                <p className="text-xs text-muted-foreground">Burglary zone restored to normal</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-mono text-sm font-semibold mb-1">OP - Open</p>
                <p className="text-xs text-muted-foreground">System armed by authorized user</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-mono text-sm font-semibold mb-1">CL - Close</p>
                <p className="text-xs text-muted-foreground">System disarmed by authorized user</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-mono text-sm font-semibold mb-1">TA - Tamper</p>
                <p className="text-xs text-muted-foreground">Device tamper detected</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert Lifecycle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold">1</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Alert Received</p>
                <p className="text-xs text-muted-foreground">
                  SIA DC-09 message received via TCP/UDP, parsed, and stored in database with timestamp and priority.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold">2</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Assignment</p>
                <p className="text-xs text-muted-foreground">
                  Head/Admin assigns alert to available guard. Status changes to "assigned".
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold">3</span>
              </div>
              <div>
                <p className="font-semibold text-sm">In Progress</p>
                <p className="text-xs text-muted-foreground">
                  Guard accepts assignment and begins response. Can choose lockdown, dispatch, or investigate actions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold">4</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Resolved</p>
                <p className="text-xs text-muted-foreground">
                  Guard marks alert as resolved with notes. Resolution time and actions are recorded for analytics.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Site Mapping Section
function SiteMappingSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sensor Setup</CardTitle>
          <CardDescription>Setting up sensors and area plans</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Understanding the Hierarchy</h3>
            <div className="space-y-2 text-sm">
              <div className="border-l-4 border-primary pl-3">
                <p className="font-semibold">Sites (Accounts)</p>
                <p className="text-muted-foreground">Top-level customer locations, identified by account number (e.g., "3333")</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-3 ml-4">
                <p className="font-semibold">Areas</p>
                <p className="text-muted-foreground">Sub-divisions within a site, identified by area number (e.g., "01", "02")</p>
              </div>
              <div className="border-l-4 border-green-500 pl-3 ml-8">
                <p className="font-semibold">Sensors (Zones/Points)</p>
                <p className="text-muted-foreground">Individual detection devices, identified by zone number (e.g., "0008")</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Creating a New Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-semibold">1.</span>
              <div>
                <p className="font-semibold">Navigate to Admin Panel</p>
                <p className="text-muted-foreground">Only available to Admin users</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">2.</span>
              <div>
                <p className="font-semibold">Add Account Information</p>
                <p className="text-muted-foreground">Enter account number, name, address, and description</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">3.</span>
              <div>
                <p className="font-semibold">Configure Areas</p>
                <p className="text-muted-foreground">Add areas with area numbers matching your security panel configuration</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">4.</span>
              <div>
                <p className="font-semibold">Upload Area Plans</p>
                <p className="text-muted-foreground">Upload image files (PNG, JPG) for each area</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">5.</span>
              <div>
                <p className="font-semibold">Place Sensors</p>
                <p className="text-muted-foreground">Click on area plan to add sensors with correct zone numbers</p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Area Plan Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use high-resolution images (1920x1080 or higher recommended)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Ensure area plans are properly scaled and oriented</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Label sensor positions accurately to match physical installation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use consistent naming conventions for sensors (e.g., "Main Entrance Door", "Server Room Motion")</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Test sensor positioning by generating test alerts</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sensor Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-sm mb-2">Required Fields:</p>
              <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                <li>• <strong>Name:</strong> Descriptive name for the sensor</li>
                <li>• <strong>Type:</strong> door, motion, fire, panic, camera, etc.</li>
                <li>• <strong>Zone Number:</strong> Must match security panel configuration</li>
                <li>• <strong>Position:</strong> X,Y coordinates on area plan</li>
              </ul>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm font-semibold mb-1">⚠️ Important</p>
              <p className="text-xs text-muted-foreground">
                Zone numbers must exactly match your security panel configuration. Mismatched zone numbers will result in alerts not being linked to the correct sensors.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Analytics Section
function AnalyticsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>Understanding your security metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-sm">Alert Trends</h4>
              <p className="text-xs text-muted-foreground">
                View alert volume over time periods (daily, weekly, monthly). Identify patterns and unusual spikes.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-sm">Response Time Analysis</h4>
              <p className="text-xs text-muted-foreground">
                Track average time from alert receipt to acknowledgment, assignment, and resolution.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-sm">Event Category Distribution</h4>
              <p className="text-xs text-muted-foreground">
                See breakdown of alert types: burglary, fire, access control, etc. Identify which systems trigger most alerts.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-sm">Peak Hours Analysis</h4>
              <p className="text-xs text-muted-foreground">
                Identify times of day with highest alert volume. Optimize guard scheduling accordingly.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-sm">Hotspot Zones</h4>
              <p className="text-xs text-muted-foreground">
                Identify sensors/zones with most frequent alerts. May indicate equipment issues or high-risk areas.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-sm">Guard Performance</h4>
              <p className="text-xs text-muted-foreground">
                Track individual guard metrics: alerts handled, average response time, resolution rate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="text-2xl">📊</div>
              <div>
                <p className="font-semibold text-sm">Alert Resolution Rate</p>
                <p className="text-xs text-muted-foreground">
                  Percentage of alerts resolved vs. total alerts received. Target: &gt;95%
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="text-2xl">⏱️</div>
              <div>
                <p className="font-semibold text-sm">Average Response Time</p>
                <p className="text-xs text-muted-foreground">
                  Time from alert receipt to guard action. Target: Critical &lt;5min, High &lt;15min
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="text-2xl">✅</div>
              <div>
                <p className="font-semibold text-sm">First-Time Resolution Rate</p>
                <p className="text-xs text-muted-foreground">
                  Alerts resolved without escalation or reassignment. Target: &gt;85%
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="text-2xl">👥</div>
              <div>
                <p className="font-semibold text-sm">Guard Availability</p>
                <p className="text-xs text-muted-foreground">
                  Percentage of time guards are marked as available. Monitor for adequate coverage.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Section
function AdminSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Administration</CardTitle>
          <CardDescription>Advanced configuration and management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">SIA Receiver Configuration</h3>
            <p className="text-sm text-muted-foreground mb-3">
              The SIA receiver runs as a separate Node.js service that can operate in two modes: Server mode (listens for connections) or Client mode (connects to a remote service).
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-2">Server Mode (Default)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Listens for incoming connections from security panels:
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono mb-2">
                  <p># Start in server mode:</p>
                  <p>npm run server</p>
                  <p className="mt-2"># Default Configuration:</p>
                  <p>TCP_HOST: 0.0.0.0</p>
                  <p>TCP_PORT: 7800</p>
                  <p>Protocol: SIA DC-09</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure your security panels to send messages to the server's IP address on port 7800.
                </p>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-semibold text-sm mb-2">Client Mode</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Connects to a remote SIA DC-09 service:
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono mb-2">
                  <p># Start in client mode (Windows):</p>
                  <p>$env:CONNECTION_MODE="client"; $env:REMOTE_HOST="127.0.0.1"; $env:REMOTE_PORT="7800"; npm run server</p>
                  <p className="mt-2"># Start in client mode (Linux/Mac):</p>
                  <p>CONNECTION_MODE=client REMOTE_HOST=127.0.0.1 REMOTE_PORT=7800 npm run server</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Client mode is useful when connecting to existing SIA receivers or for testing with remote systems.
                </p>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-semibold text-sm mb-2">Environment Variables</h4>
                <ul className="space-y-1 text-xs text-muted-foreground ml-4">
                  <li>• <strong>CONNECTION_MODE:</strong> "server" or "client" (default: server)</li>
                  <li>• <strong>TCP_HOST:</strong> Server mode bind address (default: 0.0.0.0)</li>
                  <li>• <strong>TCP_PORT:</strong> Server mode listen port (default: 7800)</li>
                  <li>• <strong>REMOTE_HOST:</strong> Client mode remote IP (default: 127.0.0.1)</li>
                  <li>• <strong>REMOTE_PORT:</strong> Client mode remote port (default: 7800)</li>
                  <li>• <strong>VITE_CONVEX_URL:</strong> Convex backend URL</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold mb-2 text-sm">Convex Database</h4>
            <p className="text-sm text-muted-foreground mb-2">
              The system uses Convex as the real-time database backend.
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground ml-6">
              <li>• Access Convex dashboard for raw data queries</li>
              <li>• Run migrations using npx convex run migrations</li>
              <li>• Export data for backup purposes</li>
              <li>• Monitor database performance and usage</li>
            </ul>
          </div>

          <div className="border-t pt-3">
            <h4 className="font-semibold mb-2 text-sm">Database Management CLI</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Interactive CLI tool for managing alerts database:
            </p>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm space-y-1 mb-2">
              <p># Start the database manager:</p>
              <p>tsx server/dbManager.ts</p>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Available operations:</p>
            <ul className="space-y-1 text-xs text-muted-foreground ml-6">
              <li>• Count alerts in database</li>
              <li>• List recent alerts (last 20)</li>
              <li>• Migrate old format alerts to SIA DC-09</li>
              <li>• Clear ALL alerts (with confirmation)</li>
            </ul>
          </div>

          <div className="border-t pt-3">
            <h4 className="font-semibold mb-2 text-sm">Seeding Test Data</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Commands for resetting or seeding database:
            </p>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm space-y-1">
              <p># Seed initial data:</p>
              <p>npx convex run seed</p>
              <p className="mt-2"># Seed area map:</p>
              <p>npx convex run seedAreaMap</p>
              <p className="mt-2"># Clear and reseed:</p>
              <p>npx convex run clearAndSeed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="border-l-4 border-red-500 pl-3">
              <p className="font-semibold text-sm mb-1">Alerts Not Appearing</p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• Verify SIA receiver is running (npm run server)</li>
                <li>• Check security panel is sending to correct IP/port</li>
                <li>• Review server console logs for parsing errors</li>
                <li>• Confirm account numbers match between panel and database</li>
              </ul>
            </div>
            <div className="border-l-4 border-orange-500 pl-3">
              <p className="font-semibold text-sm mb-1">Sensors Not Linking to Alerts</p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• Verify zone numbers match exactly (remove leading zeros)</li>
                <li>• Check sensor is assigned to correct account number</li>
                <li>• Ensure area numbers match receiver ID format</li>
              </ul>
            </div>
            <div className="border-l-4 border-blue-500 pl-3">
              <p className="font-semibold text-sm mb-1">Guards Not Receiving Assignments</p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• Confirm guard is marked as "Available"</li>
                <li>• Check guard has correct customer account associations</li>
                <li>• Verify user role is set to "guard"</li>
              </ul>
            </div>
            <div className="border-l-4 border-green-500 pl-3">
              <p className="font-semibold text-sm mb-1">Area Plans Not Displaying</p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• Verify image was uploaded successfully</li>
                <li>• Check browser console for CORS or loading errors</li>
                <li>• Ensure image format is supported (PNG, JPG)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support & Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <span className="font-semibold">SIA DC-09 Specification:</span>
              <span className="text-muted-foreground">DC-09-1998.10</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold">Framework:</span>
              <span className="text-muted-foreground">React 19 + Vite</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold">Database:</span>
              <span className="text-muted-foreground">Convex</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold">Version:</span>
              <span className="text-muted-foreground">1.0.0</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
