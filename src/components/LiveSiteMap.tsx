import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, User, MapPin, Hash, Tag, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface LiveSiteMapProps {
  floorId: Id<"floors">;
  highlightAlertId?: Id<"alerts"> | null;
}

export function LiveSiteMap({ floorId, highlightAlertId }: LiveSiteMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions] = useState({ width: 1200, height: 800 });

  const floor = useQuery(api.siteMap.getFloor, { floorId });
  const sensors = useQuery(api.siteMap.getSensorsByFloor, { floorId });
  const activeAlerts = useQuery(api.siteMap.getActiveAlertsForFloor, { floorId });
  const guards = useQuery(api.siteMap.getGuardsOnFloor, { floorId });

  // Animation for alert pulses
  const [pulsePhase, setPulsePhase] = useState(0);
  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((prev) => (prev + 0.1) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !floor || !sensors) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw area plan if available
    if (floor.floorPlanUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
        drawSensorsAndAlerts();
      };
      img.src = floor.floorPlanUrl;
    } else {
      // Draw grid background
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
      drawSensorsAndAlerts();
    }

    function drawSensorsAndAlerts() {
      if (!ctx || !sensors) return;

      // Draw sensors
      sensors.forEach((sensor) => {
        const x = (sensor.positionX / floor!.width) * canvas.width;
        const y = (sensor.positionY / floor!.height) * canvas.height;

        // Check if this sensor has active alerts
        const sensorAlerts = activeAlerts?.filter(
          (alert) => alert.accountNumber === sensor.accountNumber && alert.status !== "resolved"
        );
        const hasAlert = sensorAlerts && sensorAlerts.length > 0;
        const isHighlighted = highlightAlertId && sensorAlerts?.some((a) => a._id === highlightAlertId);

        if (hasAlert) {
          // Draw pulsing circle for alerts
          const pulseSize = 20 + Math.sin(pulsePhase) * 10;
          ctx.beginPath();
          ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(239, 68, 68, ${0.3 + Math.sin(pulsePhase) * 0.2})`;
          ctx.fill();

          // Draw multiple rings for critical alerts or highlighted alerts
          if (sensorAlerts![0].eventCode === "PA" || sensorAlerts![0].eventCode === "FA" || isHighlighted) {
            ctx.beginPath();
            ctx.arc(x, y, pulseSize + 15, 0, Math.PI * 2);
            ctx.strokeStyle = isHighlighted 
              ? `rgba(251, 191, 36, ${0.4 + Math.sin(pulsePhase) * 0.2})`
              : `rgba(239, 68, 68, ${0.2 + Math.sin(pulsePhase) * 0.15})`;
            ctx.lineWidth = isHighlighted ? 3 : 2;
            ctx.stroke();
          }
        }

        // Draw highlight ring for selected alert
        if (isHighlighted) {
          ctx.beginPath();
          ctx.arc(x, y, 35, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(251, 191, 36, ${0.6 + Math.sin(pulsePhase) * 0.3})`;
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        // Draw sensor icon
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = hasAlert ? "#ef4444" : getSensorColor(sensor.type);
        ctx.fill();
        ctx.strokeStyle = isHighlighted ? "#fbbf24" : "#ffffff";
        ctx.lineWidth = isHighlighted ? 3 : 2;
        ctx.stroke();

        // Draw sensor label
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(sensor.name, x, y + 25);

        // Draw alert count if multiple alerts
        if (sensorAlerts && sensorAlerts.length > 1) {
          ctx.beginPath();
          ctx.arc(x + 10, y - 10, 10, 0, Math.PI * 2);
          ctx.fillStyle = "#ef4444";
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px sans-serif";
          ctx.fillText(sensorAlerts.length.toString(), x + 10, y - 6);
        }
      });

      // Draw guards
      guards?.forEach((guard, index) => {
        // Position guards in a list on the right side
        const x = canvas.width - 150;
        const y = 50 + index * 60;

        // Draw guard avatar
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw guard icon (person)
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("👤", x, y + 6);

        // Draw guard name
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(guard.name, x + 30, y + 5);
      });
    }
  }, [floor, sensors, activeAlerts, guards, pulsePhase, highlightAlertId]);

  const getSensorColor = (type: string) => {
    const colors: Record<string, string> = {
      door: "#3b82f6",
      motion: "#8b5cf6",
      fire: "#ef4444",
      panic: "#dc2626",
      camera: "#10b981",
      smoke: "#f59e0b",
    };
    return colors[type] || "#6b7280";
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !floor || !sensors) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check if click is near any sensor
    for (const sensor of sensors) {
      const x = (sensor.positionX / floor.width) * canvas.width;
      const y = (sensor.positionY / floor.height) * canvas.height;
      const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);

      if (distance <= 15) { // Click within 15px of sensor center
        const sensorAlerts = activeAlerts?.filter(
          (alert) => alert.accountNumber === sensor.accountNumber && alert.status !== "resolved"
        );
        setSelectedSensor({ ...sensor, alerts: sensorAlerts || [] });
        setDrawerOpen(true);
        break;
      }
    }
  };

  if (!floor) {
    return <div className="text-center p-8">Loading area plan...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Map Area */}
      <div className="lg:col-span-3">
        <Card>
          <CardContent className="p-6">
            <canvas
              ref={canvasRef}
              width={dimensions.width}
              height={dimensions.height}
              className="border border-border rounded-lg bg-background w-full cursor-pointer"
              onClick={handleCanvasClick}
            />
          </CardContent>
        </Card>
      </div>

      {/* Sidebar with Legend and Active Alerts */}
      <div className="space-y-6">
        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Door Sensor</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Motion Sensor</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Fire/Panic</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Camera</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Smoke Detector</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-full bg-red-500/20 animate-pulse"></div>
              <span>Active Alert</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Active Alerts ({activeAlerts?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeAlerts && activeAlerts.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <div className="font-medium text-sm">{alert.sensor?.name || alert.accountNumber}</div>
                    <div className="text-xs text-muted-foreground mt-1">{alert.eventDescription}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.receivedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active alerts</p>
            )}
          </CardContent>
        </Card>

        {/* Guards on Floor */}
        {guards && guards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Guards on Floor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {guards.map((guard) => (
                  <div key={guard._id} className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      👤
                    </div>
                    <span>{guard.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sensor Details Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedSensor && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedSensor.name}</SheetTitle>
                <SheetDescription>
                  {selectedSensor.type.charAt(0).toUpperCase() + selectedSensor.type.slice(1)} Sensor
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Account Number</div>
                      <div className="text-sm text-muted-foreground">{selectedSensor.accountNumber}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Sensor Type</div>
                      <Badge className="mt-1" style={{ backgroundColor: getSensorColor(selectedSensor.type) }}>
                        {selectedSensor.type}
                      </Badge>
                    </div>
                  </div>

                  {selectedSensor.zone && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">Zone</div>
                        <div className="text-sm text-muted-foreground">{selectedSensor.zone}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Position</div>
                      <div className="text-sm text-muted-foreground">
                        X: {selectedSensor.positionX}, Y: {selectedSensor.positionY}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Created</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(selectedSensor.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Alerts */}
                {selectedSensor.alerts && selectedSensor.alerts.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      Active Alerts ({selectedSensor.alerts.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedSensor.alerts.map((alert: any) => (
                        <div
                          key={alert._id}
                          className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-mono text-xs bg-red-500/20 px-2 py-1 rounded">
                              {alert.eventCode}
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              {alert.status || "unassigned"}
                            </Badge>
                          </div>
                          <div className="text-sm font-medium">{alert.eventDescription}</div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {new Date(alert.receivedAt).toLocaleString()}
                          </div>
                          {alert.zone && (
                            <div className="text-xs text-muted-foreground mt-1">Zone: {alert.zone}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSensor.alerts && selectedSensor.alerts.length === 0 && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-center text-green-700 dark:text-green-400">
                      ✓ No active alerts for this sensor
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
