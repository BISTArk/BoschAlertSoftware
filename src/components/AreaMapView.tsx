import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// Fix Leaflet's default icon issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface AreaMapViewProps {
  alerts: Array<{
    _id: string;
    accountNumber?: string;
    priority?: "critical" | "high" | "medium" | "low";
    eventDescription?: string;
    status?: string;
    eventCode?: string;
    zoneNumber?: string;
  }>;
}

// Get priority color
const getPriorityColor = (priority?: "critical" | "high" | "medium" | "low"): string => {
  switch (priority) {
    case "critical": return "#dc2626"; // red
    case "high": return "#f97316"; // orange
    case "medium": return "#eab308"; // yellow
    case "low": return "#3b82f6"; // blue
    default: return "#6b7280"; // gray
  }
};

// Get highest priority from a list of alerts
const getHighestPriority = (alerts: Array<{ priority?: string }>): "critical" | "high" | "medium" | "low" => {
  const priorities = alerts.map(a => a.priority).filter(Boolean);
  if (priorities.includes("critical")) return "critical";
  if (priorities.includes("high")) return "high";
  if (priorities.includes("medium")) return "medium";
  return "low";
};

export function AreaMapView({ alerts }: AreaMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  
  // Fetch sites from database
  const sites = useQuery(api.siteMap.getSites);
  
  // Default center (Riyadh, Saudi Arabia)
  const defaultCenter: [number, number] = [24.7136, 46.6753];
  
  // Get actual center from first site with coordinates
  const mapCenter: [number, number] = sites?.find(s => s.latitude && s.longitude)
    ? [sites.find(s => s.latitude && s.longitude)!.latitude!, sites.find(s => s.latitude && s.longitude)!.longitude!]
    : defaultCenter;

  // Debug: Log alerts received
  useEffect(() => {
    console.log("🗺️ AreaMapView - Received alerts:", alerts);
    alerts.forEach(alert => {
      console.log(`  Alert: Account ${alert.accountNumber} / Zone ${alert.zoneNumber} / Event ${alert.eventCode} (${alert.eventDescription})`);
    });
  }, [alerts]);

  useEffect(() => {
    // Update map when alerts change
    if (mapRef.current && sites) {
      // Fit bounds to show all accounts with alerts
      const accountsWithAlerts = new Set(alerts.map(a => a.accountNumber).filter(Boolean));
      const bounds: L.LatLngBoundsExpression = Array.from(accountsWithAlerts)
        .map(accountNumber => {
          const site = sites.find(s => s.accountNumber === accountNumber);
          return (site?.latitude && site?.longitude) ? [site.latitude, site.longitude] as [number, number] : null;
        })
        .filter((coords): coords is [number, number] => coords !== null);

      if (bounds.length > 0) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [alerts, sites]);

  // Loading state
  if (!sites) {
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-muted">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Show all site markers from database */}
        {sites.filter(site => site.latitude && site.longitude).map((site) => {
          // Get all alerts for this account
          const accountAlerts = alerts.filter(a => a.accountNumber === site.accountNumber);
          const activeAlerts = accountAlerts.filter(a => a.status !== "resolved");
          const hasActiveAlert = activeAlerts.length > 0;
          const priority = hasActiveAlert ? getHighestPriority(activeAlerts) : "low";

          return (
            <div key={site._id}>
              {/* Account marker */}
              <Marker position={[site.latitude!, site.longitude!]}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold">{site.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Account: {site.accountNumber}
                    </div>
                    {site.address && <div className="text-xs mt-1">{site.address}</div>}
                    {site.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {site.description}
                      </div>
                    )}
                    {hasActiveAlert && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="font-semibold text-red-600">
                          ⚠️ {activeAlerts.length} ACTIVE ALERT{activeAlerts.length > 1 ? 'S' : ''}
                        </div>
                        {activeAlerts.slice(0, 5).map(alert => (
                          <div key={alert._id} className="text-xs mt-1">
                            <span className="font-mono">{alert.eventCode}</span> - {alert.eventDescription}
                            {alert.zoneNumber && <span className="text-muted-foreground"> (Zone {alert.zoneNumber})</span>}
                          </div>
                        ))}
                        {activeAlerts.length > 5 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            +{activeAlerts.length - 5} more...
                          </div>
                        )}
                      </div>
                    )}
                    {!hasActiveAlert && accountAlerts.length > 0 && (
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                        All alerts resolved
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Pulsing circle for active alerts */}
              {hasActiveAlert && (
                <Circle
                  center={[site.latitude!, site.longitude!]}
                  radius={500}
                  pathOptions={{
                    color: getPriorityColor(priority),
                    fillColor: getPriorityColor(priority),
                    fillOpacity: 0.3,
                    weight: 2,
                    className: "animate-pulse"
                  }}
                />
              )}
            </div>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg text-xs z-1000">
        <div className="font-semibold mb-2">Alert Severity</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#dc2626" }} />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f97316" }} />
            <span>High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#eab308" }} />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
            <span>Low</span>
          </div>
        </div>
      </div>

      {/* Location info */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-1000">
        <div className="text-xs font-semibold text-muted-foreground">MONITORED AREA</div>
        <div className="text-sm font-bold">
          {sites.find(s => s.city)?.city || "Riyadh"} Security Network
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {sites.length} Accounts • {alerts.filter(a => a.status !== "resolved").length} Active Alerts
        </div>
      </div>
    </div>
  );
}
