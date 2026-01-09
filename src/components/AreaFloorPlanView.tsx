import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Camera, Flame, Lock, Radio } from "lucide-react";

interface AreaFloorPlanViewProps {
  accountNumber?: string;
  areaNumber?: string;
  zoneNumber?: string;
  priority?: "critical" | "high" | "medium" | "low";
}

// Icon mapping
const getIconComponent = (iconName?: string) => {
  switch (iconName) {
    case "door":
      return Lock;
    case "alert":
    case "sensor":
      return Radio;
    case "camera":
      return Camera;
    case "flame":
      return Flame;
    default:
      return AlertCircle;
  }
};

// Priority colors
const getPriorityColor = (priority?: "critical" | "high" | "medium" | "low"): string => {
  switch (priority) {
    case "critical": return "#dc2626";
    case "high": return "#f97316";
    case "medium": return "#eab308";
    case "low": return "#3b82f6";
    default: return "#6b7280";
  }
};

// Normalize zone numbers to 4-digit format for comparison
const normalizeZone = (zone?: string): string => {
  if (!zone) return "";
  // Remove leading zeros and pad to 4 digits
  const numericZone = parseInt(zone, 10);
  if (isNaN(numericZone)) return zone;
  return numericZone.toString().padStart(4, "0");
};

export function AreaFloorPlanView({
  accountNumber,
  areaNumber,
  zoneNumber,
  priority
}: AreaFloorPlanViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch floor plan from database
  const dbFloor = useQuery(
    api.siteMap.getFloorByAccountAndArea,
    accountNumber && areaNumber ? {
      accountNumber,
      areaNumber,
    } : "skip"
  );

  // Fetch sensors from database
  const dbSensors = useQuery(
    api.siteMap.getSensorsByAccountAndArea,
    accountNumber && areaNumber ? {
      accountNumber,
      areaNumber,
    } : "skip"
  );

  // Fetch all alerts for this area
  const allAlerts = useQuery(api.alerts.getAlerts, {
    filters: accountNumber && areaNumber ? {
      accountNumber,
    } : {},
  });

  // Filter alerts for this specific area
  const areaAlerts = allAlerts?.page.filter(alert => 
    alert.accountNumber === accountNumber && 
    alert.areaNumber === areaNumber
  ) || [];

  // Get area data from database
  const getAreaData = () => {
    if (!accountNumber || !areaNumber) {
      console.log("AreaFloorPlanView: Missing data", { accountNumber, areaNumber });
      return null;
    }
    
    
    // Use database data only
    if (!dbFloor || dbSensors === undefined) {
      return null;
    }

    
    // Convert database sensors to expected format
    const sensorsMap: Record<string, any> = {};
    dbSensors.forEach((sensor: any) => {
      sensorsMap[sensor.zone] = {
        name: sensor.name,
        type: sensor.type,
        description: sensor.name,
        positionX: sensor.positionX,
        positionY: sensor.positionY,
        icon: sensor.icon || "sensor",
        color: sensor.color || "#6b7280",
      };
    });
    
    return {
      accountNumber,
      areaNumber,
      areaName: dbFloor.name,
      description: `Area ${dbFloor.areaNumber}`,
      floorPlanUrl: dbFloor.floorPlanUrl || "",
      dimensions: {
        width: dbFloor.width,
        height: dbFloor.height,
      },
      sensors: sensorsMap,
    };
  };

  const areaData = getAreaData();

  useEffect(() => {
    if (!canvasRef.current || !areaData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const width = areaData.dimensions.width;
    const height = areaData.dimensions.height;
    canvas.width = width;
    canvas.height = height;

    const drawGridFallback = () => {
      // Clear canvas
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = "#2a2a2a";
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
      const sensors = areaData.sensors || {};
      Object.entries(sensors).forEach(([sensorZone, sensor]: [string, any]) => {
        // Normalize both zone numbers for comparison
        const normalizedSensorZone = normalizeZone(sensorZone);
        const normalizedAlertZone = normalizeZone(zoneNumber);
        const isActive = normalizedSensorZone === normalizedAlertZone;
        const x = sensor.positionX;
        const y = sensor.positionY;

        // Draw sensor circle
        ctx.beginPath();
        ctx.arc(x, y, isActive ? 20 : 15, 0, 2 * Math.PI);
        
        if (isActive) {
          // Highlight active sensor with pulsing effect
          ctx.fillStyle = getPriorityColor(priority);
          ctx.fill();
          
          // Outer glow
          ctx.strokeStyle = getPriorityColor(priority);
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Draw larger circle for emphasis
          ctx.beginPath();
          ctx.arc(x, y, 35, 0, 2 * Math.PI);
          ctx.strokeStyle = getPriorityColor(priority);
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
        ctx.fillStyle = "#ffffff";
        ctx.font = isActive ? "bold 14px sans-serif" : "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(sensor.name, x, y - 30);
        
        // Draw zone number
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#9ca3af";
        ctx.fillText(`Zone ${sensorZone}`, x, y - 15);
      });
    };

    // Check if floor plan URL exists and is valid
    if (!areaData.floorPlanUrl || areaData.floorPlanUrl === "") {
      console.log("AreaFloorPlanView: No floor plan URL configured, using grid fallback.");
      drawGridFallback();
      drawSensors();
      return;
    }

    // Load and draw floor plan image
    const img = new Image();
    img.src = areaData.floorPlanUrl;
    
    img.onload = () => {
      // Draw the floor plan image with reduced opacity for better sensor visibility
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, 0, 0, width, height);
      ctx.globalAlpha = 1.0;
      
      // Draw sensors on top of the image
      drawSensors();
    };
    
    img.onerror = () => {
      console.log("AreaFloorPlanView: Floor plan image failed to load from:", areaData);
      // If image fails to load, draw grid as fallback
      drawGridFallback();
      drawSensors();
    };

  }, [areaData, zoneNumber, priority, dbFloor, dbSensors]);

  if (!areaData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Area Map Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {accountNumber && areaNumber 
              ? `No floor plan configured for Account ${accountNumber}, Area ${areaNumber}`
              : "Missing account or area information"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Admins can configure floor plans in the <strong>Site Map Setup</strong> page.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sensors = areaData.sensors || {};
  const activeSensor = zoneNumber ? sensors[zoneNumber] : null;

  return (
    <div className="space-y-4">
      {/* Area Info Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{areaData.areaName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{areaData.description}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              Account {accountNumber} - Area {areaNumber}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Floor Plan Canvas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Floor Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto bg-muted/30 rounded-lg border">
            <canvas
              ref={canvasRef}
              className="max-w-full"
              style={{ display: "block" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Sensor Info */}
      {activeSensor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <AlertCircle className="w-5 h-5" style={{ color: getPriorityColor(priority) }} />
              Active Sensor - Zone {zoneNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Name:</span>
              <p className="font-medium">{activeSensor.name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Type:</span>
              <p>{activeSensor.type}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Description:</span>
              <p>{activeSensor.description}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Position:</span>
              <p>X: {activeSensor.positionX}, Y: {activeSensor.positionY}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Alerts in Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-md">All Alerts in Area</CardTitle>
        </CardHeader>
        <CardContent>
          {areaAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No alerts in this area
            </p>
          ) : (
            <div className="space-y-2">
              {areaAlerts.map((alert) => {
                const isCurrentAlert = alert.zoneNumber === zoneNumber;
                const alertPriority = alert.priority || "low";
                
                return (
                  <div
                    key={alert._id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isCurrentAlert 
                        ? "bg-red-500/10 border-red-500/30" 
                        : "bg-muted border"
                    }`}
                  >
                    <div 
                      className="p-2 rounded-full"
                      style={{ 
                        backgroundColor: `${getPriorityColor(alertPriority)}20`,
                        color: getPriorityColor(alertPriority)
                      }}
                    >
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {alert.eventDescription || "Security Alert"}
                        </span>
                        {isCurrentAlert && (
                          <Badge variant="destructive" className="text-xs">Current Alert</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Zone {alert.zoneNumber || "N/A"} • {alert.eventCode || "Unknown"} • {new Date(alert.receivedAt).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          className="text-xs"
                          style={{
                            backgroundColor: `${getPriorityColor(alertPriority)}20`,
                            color: getPriorityColor(alertPriority),
                            border: `1px solid ${getPriorityColor(alertPriority)}40`
                          }}
                        >
                          {alertPriority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.status || "unassigned"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
