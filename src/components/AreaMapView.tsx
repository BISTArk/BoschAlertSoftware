import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import location mapping
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

// Helper to get zone coordinates from location mapping
const getZoneCoordinates = (accountNumber?: string, eventCode?: string, zoneNumber?: string) => {
  if (!accountNumber || !zoneNumber) return null;
  
  const account = locationMapping.accounts[accountNumber as keyof typeof locationMapping.accounts];
  if (!account) return null;
  
  // Look up zone by zone number only (e.g., "0008", "0005", "0001")
  const zones = account.zones as Record<string, { coordinates: { lat: number; lng: number } }>;
  const zone = zones[zoneNumber];
  if (!zone) return null;
  
  return zone.coordinates;
};

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
      // Fit bounds to show all markers with alerts
      const bounds: L.LatLngBoundsExpression = alerts
        .map(alert => getZoneCoordinates(alert.accountNumber, alert.eventCode, alert.zoneNumber))
        .filter((coords): coords is { lat: number; lng: number } => coords !== null)
        .map(coords => [coords.lat, coords.lng] as [number, number]);

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

        {/* Show all zone markers from location mapping */}
        {Object.entries(locationMapping.accounts).map(([accountNumber, account]) =>
          Object.entries(account.zones).map(([zoneId, zone]) => {
            // Check if there are active alerts for this zone
            // Match by zone number only (zones are now keyed by zone number, not eventCode+zoneNumber)
            const zoneAlerts = alerts.filter(a => {
              if (a.accountNumber !== accountNumber) return false;
              
              // Match by zone number only (e.g., "0008")
              return a.zoneNumber === zoneId;
            });
            
            const hasAlert = zoneAlerts.length > 0;
            const priority = zoneAlerts[0]?.priority || "low";

            return (
              <div key={`${accountNumber}-${zoneId}`}>
                {/* Zone marker */}
                <Marker position={[zone.coordinates.lat, zone.coordinates.lng]}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-bold">{zone.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Account: {accountNumber} • Zone: {zoneId}
                      </div>
                      <div className="text-xs mt-1">{zone.location}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {zone.description}
                      </div>
                      {hasAlert && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="font-semibold text-red-600">⚠️ ACTIVE ALERT</div>
                          {zoneAlerts.map(alert => (
                            <div key={alert._id} className="text-xs mt-1">
                              {alert.eventDescription}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {/* Pulsing circle for active alerts */}
                {hasAlert && (
                  <Circle
                    center={[zone.coordinates.lat, zone.coordinates.lng]}
                    radius={100}
                    pathOptions={{
                      color: getPriorityColor(priority),
                      fillColor: getPriorityColor(priority),
                      fillOpacity: 0.4,
                      weight: 2,
                      className: "animate-pulse"
                    }}
                  />
                )}
              </div>
            );
          })
        )}
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
