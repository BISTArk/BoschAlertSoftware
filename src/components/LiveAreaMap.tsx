import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MapPin } from "lucide-react";

interface LiveAreaMapProps {
  floorId: Id<"floors">; // This represents an area in our new system
  showAlerts?: boolean;
}

export function LiveAreaMap({ floorId, showAlerts = true }: LiveAreaMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get area data including area plan URL
  const floor = useQuery(api.siteMap.getFloor, { floorId });
  
  // Get sensors in this area
  const allSensors = useQuery(api.siteMap.getSensorsByFloor, { floorId });
  
  // Get recent alerts for this area's account
  const alerts = useQuery(api.alerts.getAlerts, {
    paginationOpts: { numItems: 100 },
  });

  // Filter alerts to match sensors in this area
  const areaAlerts = alerts?.page.filter((alert) => {
    if (!alert.accountNumber || !allSensors) return false;
    
    // Check if alert matches any sensor in this area
    return allSensors.some(
      (sensor) => 
        sensor.accountNumber === alert.accountNumber && 
        sensor.zone === alert.zoneNumber &&
        alert.status !== "resolved"
    );
  }) || [];

  // Use floor dimensions from database to match sensor positions
  const width = floor?.width || 1200;
  const height = floor?.height || 800;

  useEffect(() => {
    if (!canvasRef.current || !allSensors) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match floor dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear canvas with light background (area plan style)
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, width, height);

    const drawGrid = () => {
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    const drawSensors = () => {
      // Draw sensors
      allSensors.forEach((sensor) => {
      // Check if sensor has an active alert (normalize zone numbers for comparison)
      const hasAlert = areaAlerts.some(
        (alert) => normalizeZone(alert.zoneNumber) === normalizeZone(sensor.zone)
      );

      const x = sensor.positionX;
      const y = sensor.positionY;

      // Draw sensor circle
      ctx.beginPath();
      ctx.arc(x, y, hasAlert ? 20 : 15, 0, 2 * Math.PI);

      if (hasAlert) {
        // Highlight sensor with alert
        const alert = areaAlerts.find((a) => normalizeZone(a.zoneNumber) === normalizeZone(sensor.zone));
        const priorityColor = getPriorityColor(alert?.priority);
        
        ctx.fillStyle = priorityColor;
        ctx.fill();

        // Outer glow
        ctx.strokeStyle = priorityColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Pulsing circle
        ctx.beginPath();
        ctx.arc(x, y, 35, 0, 2 * Math.PI);
        ctx.strokeStyle = priorityColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        // Normal sensor
        ctx.fillStyle = sensor.color || "#6b7280";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw sensor label
      ctx.fillStyle = "#1f2937";
      ctx.font = hasAlert ? "bold 14px sans-serif" : "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(sensor.name, x, y - 30);

      // Draw zone number
      ctx.font = "10px sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.fillText(`Zone ${sensor.zone}`, x, y - 15);
    });
    };

    // Load and draw area plan image if available
    if (floor?.floorPlanUrl) {
      const img = new Image();
      // Don't set crossOrigin to avoid CORS issues with external images
      img.onload = () => {
        console.log("LiveAreaMap: Floor plan image loaded successfully");
        ctx.globalAlpha = 0.4;
        ctx.drawImage(img, 0, 0, width, height);
        ctx.globalAlpha = 1.0;
        drawSensors();
      };
      img.onerror = (e) => {
        console.error("LiveAreaMap: Failed to load floor plan image:", floor.floorPlanUrl, e);
        // If image fails to load, draw grid as fallback
        drawGrid();
        drawSensors();
      };
      console.log("LiveAreaMap: Loading floor plan image from URL:", floor.floorPlanUrl);
      img.src = floor.floorPlanUrl;
    } else {
      // No area plan, draw grid
      drawGrid();
      drawSensors();
    }
  }, [allSensors, areaAlerts, width, height, floor]);

  // Normalize zone numbers to 4-digit format for comparison
  const normalizeZone = (zone?: string): string => {
    if (!zone) return "";
    // Remove leading zeros and pad to 4 digits
    const numericZone = parseInt(zone, 10);
    if (isNaN(numericZone)) return zone;
    return numericZone.toString().padStart(4, "0");
  };

  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case "critical": return "#dc2626";
      case "high": return "#f97316";
      case "medium": return "#eab308";
      case "low": return "#3b82f6";
      default: return "#ef4444";
    }
  };

  if (!allSensors) {
    return (
      <Card className="w-full">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Loading area map...</p>
        </CardContent>
      </Card>
    );
  }

  if (allSensors.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            No Sensors Configured
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No sensors have been configured for this area yet.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Add sensors in the Setup mode or run the seed command.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get account number from first sensor
  const accountNumber = allSensors[0]?.accountNumber;

  return (
    <div className="space-y-4">
      {/* Area Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Area Map
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Account {accountNumber}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {allSensors.length} Sensors
              </Badge>
              {areaAlerts.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {areaAlerts.length} Active Alert{areaAlerts.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Canvas Map */}
      <Card>
        <CardContent className="p-6">
          <div className="relative w-full overflow-auto bg-muted/30 rounded-lg border">
            <canvas
              ref={canvasRef}
              className="max-w-full"
              style={{ display: "block" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {showAlerts && areaAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Active Alerts in This Area
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {areaAlerts.map((alert) => (
              <div
                key={alert._id}
                className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/30"
              >
                <div>
                  <p className="font-medium">{alert.eventDescription}</p>
                  <p className="text-sm text-muted-foreground">
                    Zone {alert.zoneNumber} • {alert.eventCategory}
                  </p>
                </div>
                <Badge variant="destructive">
                  {alert.priority?.toUpperCase() || "HIGH"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sensor List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-md">All Sensors in Area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {allSensors.map((sensor) => {
              const hasAlert = areaAlerts.some(
                (alert) => alert.zoneNumber === sensor.zone
              );

              return (
                <div
                  key={sensor._id}
                  className={`p-3 rounded-lg border ${
                    hasAlert
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-muted border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">
                      {sensor.name}
                    </span>
                    {hasAlert && (
                      <Badge variant="destructive" className="text-xs">
                        Alert
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Zone {sensor.zone} • {sensor.type}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
