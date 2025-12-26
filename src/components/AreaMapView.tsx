import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import location mapping (account-level coordinates only)
import locationMapping from "../../location-mapping.json";

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
  
  // Get center from location mapping
  const defaultCenter: [number, number] = [
    locationMapping.mapSettings.defaultCenter.lat,
    locationMapping.mapSettings.defaultCenter.lng
  ];

  // Debug: Log alerts received
  useEffect(() => {
    console.log("🗺️ AreaMapView - Received alerts:", alerts);
    alerts.forEach(alert => {
      console.log(`  Alert: Account ${alert.accountNumber} / Zone ${alert.zoneNumber} / Event ${alert.eventCode} (${alert.eventDescription})`);
    });
  }, [alerts]);

  useEffect(() => {
    // Update map when alerts change
    if (mapRef.current) {
      // Fit bounds to show all accounts with alerts
      const accountsWithAlerts = new Set(alerts.map(a => a.accountNumber).filter(Boolean));
      const bounds: L.LatLngBoundsExpression = Array.from(accountsWithAlerts)
        .map(accountNumber => {
          const account = locationMapping.accounts[accountNumber as keyof typeof locationMapping.accounts];
          return account ? [account.coordinates.lat, account.coordinates.lng] as [number, number] : null;
        })
        .filter((coords): coords is [number, number] => coords !== null);

      if (bounds.length > 0) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [alerts]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={locationMapping.mapSettings.defaultZoom}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution={locationMapping.mapSettings.attribution}
          url={locationMapping.mapSettings.tileLayer}
        />

        {/* Show all account markers from location mapping */}
        {Object.entries(locationMapping.accounts).map(([accountNumber, account]) => {
          // Get all alerts for this account
          const accountAlerts = alerts.filter(a => a.accountNumber === accountNumber);
          const activeAlerts = accountAlerts.filter(a => a.status !== "resolved");
          const hasActiveAlert = activeAlerts.length > 0;
          const priority = hasActiveAlert ? getHighestPriority(activeAlerts) : "low";

          return (
            <div key={accountNumber}>
              {/* Account marker */}
              <Marker position={[account.coordinates.lat, account.coordinates.lng]}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold">{account.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Account: {accountNumber}
                    </div>
                    <div className="text-xs mt-1">{account.address}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {account.description}
                    </div>
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
                  center={[account.coordinates.lat, account.coordinates.lng]}
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
          {Object.values(locationMapping.accounts)[0]?.city || "Bangalore"} Security Network
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {Object.keys(locationMapping.accounts).length} Accounts • {alerts.filter(a => a.status !== "resolved").length} Active Alerts
        </div>
      </div>
    </div>
  );
}
