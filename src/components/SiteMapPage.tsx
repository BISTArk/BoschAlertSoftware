import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { LiveAreaMap } from "@/components/LiveAreaMap";
import { LiveSiteMap } from "@/components/LiveSiteMap";
import { SiteMapSetup } from "@/components/SiteMapSetup";
import { FloorPlanEditor } from "@/components/FloorPlanEditor";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Map, MapPin } from "lucide-react";

export function SiteMapPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"live" | "setup" | "editor" | "areas">("areas");
  const [selectedSite, setSelectedSite] = useState<Id<"sites"> | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<Id<"floors"> | null>(null);

  const sites = useQuery(api.siteMap.getSites);
  const floors = useQuery(
    api.siteMap.getFloorsBySite,
    selectedSite ? { siteId: selectedSite } : "skip"
  );

  // Auto-select first site and floor
  if (sites && sites.length > 0 && !selectedSite) {
    setSelectedSite(sites[0]._id);
  }

  if (floors && floors.length > 0 && !selectedFloor) {
    setSelectedFloor(floors[0]._id);
  }

  const isAdmin = user?.role === "admin" || user?.role === "head";

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Map</h1>
          <p className="text-muted-foreground">
            {viewMode === "areas"
              ? "View areas with real-time alerts"
              : viewMode === "live"
              ? "Real-time alert visualization (legacy)"
              : viewMode === "editor"
              ? "Drag sensors to update positions"
              : "Configure sensors and floor plans"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "areas" ? "default" : "outline"}
            onClick={() => setViewMode("areas")}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Area Maps
          </Button>
          {isAdmin && (
            <>
              <Button
                variant={viewMode === "live" ? "default" : "outline"}
                onClick={() => setViewMode("live")}
              >
                <Map className="h-4 w-4 mr-2" />
                Live Map
              </Button>
              <Button
                variant={viewMode === "editor" ? "default" : "outline"}
                onClick={() => setViewMode("editor")}
              >
                <Map className="h-4 w-4 mr-2" />
                Editor
              </Button>
              <Button
                variant={viewMode === "setup" ? "default" : "outline"}
                onClick={() => setViewMode("setup")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Setup
              </Button>
            </>
          )}
        </div>
      </div>

      {viewMode === "editor" ? (
        <FloorPlanEditor />
      ) : viewMode === "areas" ? (
        <>
          {/* Site and Area Selection */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Account/Site:</span>
              <Select
                value={selectedSite || undefined}
                onValueChange={(value) => {
                  setSelectedSite(value as Id<"sites">);
                  setSelectedFloor(null);
                }}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map((site) => (
                    <SelectItem key={site._id} value={site._id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Area:</span>
              <Select
                value={selectedFloor || undefined}
                onValueChange={(value) => setSelectedFloor(value as Id<"floors">)}
                disabled={!selectedSite}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {floors?.map((floor) => (
                    <SelectItem key={floor._id} value={floor._id}>
                      {floor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Area Map */}
          {selectedFloor ? (
            <LiveAreaMap floorId={selectedFloor} />
          ) : (
            <div className="border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">
                {sites && sites.length === 0
                  ? "No sites configured. Run the seed command: npx convex run seedAreaMap"
                  : "Select an account and area to view sensors and alerts."}
              </p>
            </div>
          )}
        </>
      ) : viewMode === "live" ? (
        <>
          {/* Site and Floor Selection */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Site:</span>
              <Select
                value={selectedSite || undefined}
                onValueChange={(value) => {
                  setSelectedSite(value as Id<"sites">);
                  setSelectedFloor(null);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map((site) => (
                    <SelectItem key={site._id} value={site._id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Floor:</span>
              <Select
                value={selectedFloor || undefined}
                onValueChange={(value) => setSelectedFloor(value as Id<"floors">)}
                disabled={!selectedSite}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {floors?.map((floor) => (
                    <SelectItem key={floor._id} value={floor._id}>
                      {floor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Live Map */}
          {selectedFloor ? (
            <LiveSiteMap floorId={selectedFloor} />
          ) : (
            <div className="border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">
                {sites && sites.length === 0
                  ? "No sites configured. Create a site in Setup mode."
                  : "Select a site and floor to view the live map."}
              </p>
            </div>
          )}
        </>
      ) : viewMode === "setup" ? (
        <SiteMapSetup />
      ) : null}
    </div>
  );
}
