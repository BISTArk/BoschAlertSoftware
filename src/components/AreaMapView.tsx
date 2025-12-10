import { useEffect, useRef } from "react";


// Map customer account codes to geographic coordinates (latitude, longitude)
// These can be configured based on your actual customer locations
const CUSTOMER_LOCATIONS: Record<string, { lat: number; lng: number; name: string }> = {
  "1234": { lat: 13.0827, lng: 80.2707, name: "ATM-034, King Fahd Road" },
  "5678": { lat: 13.0897, lng: 80.2750, name: "Branch-102, Anna Salai" },
  "223010": { lat: 13.0757, lng: 80.2680, name: "Office Complex, T Nagar" },
  // Add more customer locations as needed
};

interface AreaMapViewProps {
  alerts: Array<{
    _id: string;
    customerAccount?: string;
    accountNumber?: string;
    severity?: string;
    eventDescription?: string;
    status?: string;
  }>;
}

export function AreaMapView({ alerts }: AreaMapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get severity color
  const getSeverityColor = (severity?: string): string => {
    switch (severity) {
      case "critical": return "#ef4444"; // red
      case "high": return "#f97316"; // orange
      case "medium": return "#eab308"; // yellow
      case "low": return "#3b82f6"; // blue
      default: return "#6b7280"; // gray
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw base map (simple grid/street layout)
    drawBaseMap(ctx, rect.width, rect.height);

    // Calculate bounds for all customer locations
    const allLocations = Object.values(CUSTOMER_LOCATIONS);
    const latitudes = allLocations.map(l => l.lat);
    const longitudes = allLocations.map(l => l.lng);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    // Add padding
    const latPadding = (maxLat - minLat) * 0.2;
    const lngPadding = (maxLng - minLng) * 0.2;

    // Convert lat/lng to canvas coordinates
    const latLngToCanvas = (lat: number, lng: number): { x: number; y: number } => {
      const x = ((lng - minLng + lngPadding) / (maxLng - minLng + 2 * lngPadding)) * rect.width;
      const y = ((maxLat - lat + latPadding) / (maxLat - minLat + 2 * latPadding)) * rect.height;
      return { x, y };
    };

    // Draw customer location markers
    Object.entries(CUSTOMER_LOCATIONS).forEach(([code, location]) => {
      const pos = latLngToCanvas(location.lat, location.lng);
      
      // Check if there are alerts for this location
      const locationAlerts = alerts.filter(
        a => (a.customerAccount || a.accountNumber) === code
      );

      if (locationAlerts.length > 0) {
        // Draw alert markers
        locationAlerts.forEach((alert, index) => {
          const offset = index * 5; // Offset multiple alerts at same location
          const color = getSeverityColor(alert.severity);
          
          // Draw pulsing circle for active alerts
          if (alert.status !== "resolved") {
            ctx.beginPath();
            ctx.arc(pos.x + offset, pos.y + offset, 20, 0, 2 * Math.PI);
            ctx.fillStyle = color + "40"; // Semi-transparent
            ctx.fill();
          }

          // Draw marker
          ctx.beginPath();
          ctx.arc(pos.x + offset, pos.y + offset, 8, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw alert count badge
          if (index === locationAlerts.length - 1 && locationAlerts.length > 1) {
            ctx.beginPath();
            ctx.arc(pos.x + offset + 8, pos.y + offset - 8, 10, 0, 2 * Math.PI);
            ctx.fillStyle = "#ef4444";
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 10px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(locationAlerts.length.toString(), pos.x + offset + 8, pos.y + offset - 8);
          }
        });
      } else {
        // Draw normal location marker (no alerts)
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "#10b981"; // green
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw location label
      ctx.fillStyle = "#1f2937";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(code, pos.x, pos.y + 25);
    });

  }, [alerts]);

  const drawBaseMap = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw background
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, width, height);

    // Draw grid (street layout)
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw main roads (thicker lines)
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(width * 0.3, 0);
    ctx.lineTo(width * 0.3, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, height * 0.4);
    ctx.lineTo(width, height * 0.4);
    ctx.stroke();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is near any alert marker
    // This is a simplified version - you might want to implement proper hit detection
    console.log("Map clicked at:", x, y);
  };

  return (
    <div className="relative w-full h-full bg-muted rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onClick={handleCanvasClick}
        style={{ width: "100%", height: "100%" }}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-xs">
        <div className="font-semibold mb-2">Alert Severity</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>No Alerts</span>
          </div>
        </div>
      </div>

      {/* Location info */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-xs font-semibold text-muted-foreground">MONITORED AREA</div>
        <div className="text-sm font-bold">Chennai Metro Region</div>
        <div className="text-xs text-muted-foreground mt-1">
          {Object.keys(CUSTOMER_LOCATIONS).length} Locations • {alerts.filter(a => a.status !== "resolved").length} Active Alerts
        </div>
      </div>
    </div>
  );
}
