import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Building, Layers, Wifi, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SiteMapSetup() {
  const { user } = useAuth();
  const [showSiteDialog, setShowSiteDialog] = useState(false);
  const [showFloorDialog, setShowFloorDialog] = useState(false);
  const [showSensorDialog, setShowSensorDialog] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Id<"sites"> | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<Id<"floors"> | null>(null);
  
  // Edit mode states
  const [editingSite, setEditingSite] = useState<Id<"sites"> | null>(null);
  const [editingFloor, setEditingFloor] = useState<Id<"floors"> | null>(null);
  const [editingSensor, setEditingSensor] = useState<Id<"sensors"> | null>(null);

  const sites = useQuery(api.siteMap.getSites);
  const floors = useQuery(
    api.siteMap.getFloorsBySite,
    selectedSite ? { siteId: selectedSite } : "skip"
  );
  const sensors = useQuery(
    api.siteMap.getSensorsByFloor,
    selectedFloor ? { floorId: selectedFloor } : "skip"
  );

  const createSite = useMutation(api.siteMap.createSite);
  const updateSite = useMutation(api.siteMap.updateSite);
  const createFloor = useMutation(api.siteMap.createFloor);
  const updateFloor = useMutation(api.siteMap.updateFloor);
  const createSensor = useMutation(api.siteMap.createSensor);
  const updateSensor = useMutation(api.siteMap.updateSensor);
  const deleteSensor = useMutation(api.siteMap.deleteSensor);

  // Form states
  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [siteAccount, setSiteAccount] = useState("");

  const [floorName, setFloorName] = useState("");
  const [floorAccount, setFloorAccount] = useState("");
  const [floorArea, setFloorArea] = useState("");
  const [floorWidth, setFloorWidth] = useState("1200");
  const [floorHeight, setFloorHeight] = useState("800");
  const [floorPlanUrl, setFloorPlanUrl] = useState("");

  const [sensorName, setSensorName] = useState("");
  const [sensorAccount, setSensorAccount] = useState("");
  const [sensorArea, setSensorArea] = useState("");
  const [sensorType, setSensorType] = useState("door");
  const [sensorZone, setSensorZone] = useState("");
  const [sensorX, setSensorX] = useState("100");
  const [sensorY, setSensorY] = useState("100");

  const handleSaveSite = async () => {
    if (!siteName || !siteAccount) return;

    if (editingSite) {
      await updateSite({
        siteId: editingSite,
        name: siteName,
        description: siteDescription || undefined,
        address: siteAddress || undefined,
      });
    } else {
      if (!user) return;
      await createSite({
        accountNumber: siteAccount,
        name: siteName,
        description: siteDescription || undefined,
        address: siteAddress || undefined,
        createdBy: user._id,
      });
    }

    setSiteName("");
    setSiteDescription("");
    setSiteAddress("");
    setSiteAccount("");
    setEditingSite(null);
    setShowSiteDialog(false);
  };

  const handleEditSite = (site: any) => {
    setEditingSite(site._id);
    setSiteName(site.name);
    setSiteDescription(site.description || "");
    setSiteAddress(site.address || "");
    setSiteAccount(site.accountNumber || "");
    setShowSiteDialog(true);
  };

  const handleSaveFloor = async () => {
    if (!floorName || !floorArea) return;

    if (editingFloor) {
      await updateFloor({
        floorId: editingFloor,
        name: floorName,
        width: parseInt(floorWidth) || 1200,
        height: parseInt(floorHeight) || 800,
        floorPlanUrl: floorPlanUrl || undefined,
      });
    } else {
      if (!selectedSite) return;
      await createFloor({
        siteId: selectedSite,
        areaNumber: floorArea,
        name: floorName,
        width: parseInt(floorWidth) || 1200,
        height: parseInt(floorHeight) || 800,
        floorPlanUrl: floorPlanUrl || undefined,
      });
    }

    setFloorName("");
    setFloorAccount("");
    setFloorArea("");
    setFloorPlanUrl("");
    setEditingFloor(null);
    setShowFloorDialog(false);
  };

  const handleEditFloor = (floor: any) => {
    setEditingFloor(floor._id);
    setFloorName(floor.name);
    setFloorWidth(floor.width.toString());
    setFloorHeight(floor.height.toString());
    setFloorPlanUrl(floor.floorPlanUrl || "");
    setShowFloorDialog(true);
  };

  const handleSaveSensor = async () => {
    if (!sensorName || !sensorAccount) return;

    if (editingSensor) {
      await updateSensor({
        sensorId: editingSensor,
        name: sensorName,
        type: sensorType,
        zone: sensorZone || undefined,
        positionX: parseInt(sensorX) || 0,
        positionY: parseInt(sensorY) || 0,
      });
    } else {
      if (!selectedFloor) return;
      await createSensor({
        floorId: selectedFloor,
        accountNumber: sensorAccount,
        name: sensorName,
        type: sensorType,
        zone: sensorZone || "",
        positionX: parseInt(sensorX) || 0,
        positionY: parseInt(sensorY) || 0,
      });
    }

    setSensorName("");
    setSensorAccount("");
    setSensorArea("");
    setSensorZone("");
    setSensorX("100");
    setSensorY("100");
    setEditingSensor(null);
    setShowSensorDialog(false);
  };

  const handleEditSensor = (sensor: any) => {
    setEditingSensor(sensor._id);
    setSensorName(sensor.name);
    setSensorAccount(sensor.accountNumber);
    setSensorArea(sensor.areaNumber || "");
    setSensorType(sensor.type);
    setSensorZone(sensor.zone || "");
    setSensorX(sensor.positionX.toString());
    setSensorY(sensor.positionY.toString());
    setShowSensorDialog(true);
  };

  const handleDeleteSensor = async (sensorId: Id<"sensors">) => {
    if (confirm("Are you sure you want to delete this sensor?")) {
      await deleteSensor({ sensorId });
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">You don't have permission to access this page. Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Map Setup</h1>
          <p className="text-muted-foreground">Configure sites, floors, and sensor locations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Sites
            </CardTitle>
            <CardDescription>Manage your locations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setShowSiteDialog(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Site
            </Button>

            <div className="space-y-2">
              {sites?.map((site) => (
                <div
                  key={site._id}
                  className={`p-3 rounded-lg border transition-colors ${
                    selectedSite === site._id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted border-border"
                  }`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedSite(site._id);
                      setSelectedFloor(null);
                    }}
                  >
                    <div className="font-medium">{site.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Account: {site.accountNumber || "N/A"}
                    </div>
                    {site.address && <div className="text-xs text-muted-foreground">{site.address}</div>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => handleEditSite(site)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Floors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Areas
            </CardTitle>
            <CardDescription>
              {selectedSite ? "Manage areas" : "Select a site first"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setShowFloorDialog(true)}
              className="w-full"
              disabled={!selectedSite}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Area
            </Button>

            <div className="space-y-2">
              {floors?.map((floor) => (
                <div
                  key={floor._id}
                  className={`p-3 rounded-lg border transition-colors ${
                    selectedFloor === floor._id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted border-border"
                  }`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => setSelectedFloor(floor._id)}
                  >
                    <div className="font-medium">{floor.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {floor.width} x {floor.height}px
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => handleEditFloor(floor)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sensors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Sensors
            </CardTitle>
            <CardDescription>
              {selectedFloor ? "Manage sensors" : "Select a floor first"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setShowSensorDialog(true)}
              className="w-full"
              disabled={!selectedFloor}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Sensor
            </Button>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sensors?.map((sensor) => (
                <div
                  key={sensor._id}
                  className="p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <div className="font-medium">{sensor.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Account: {sensor.accountNumber} • Area: {floors?.find(f => f._id === selectedFloor)?.areaNumber || "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Zone: {sensor.zone || "N/A"} | Type: {sensor.type} | Position: ({sensor.positionX}, {sensor.positionY})
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditSensor(sensor)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteSensor(sensor._id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Site Dialog */}
      <Dialog open={showSiteDialog} onOpenChange={(open) => {
        setShowSiteDialog(open);
        if (!open) {
          setEditingSite(null);
          setSiteName("");
          setSiteDescription("");
          setSiteAddress("");
          setSiteAccount("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSite ? "Edit Site" : "Add New Site"}</DialogTitle>
            <DialogDescription>
              {editingSite ? "Update site information" : "Create a new location for monitoring"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name *</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g., Headquarters, Building A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteAccount">Account Number *</Label>
              <Input
                id="siteAccount"
                value={siteAccount}
                onChange={(e) => setSiteAccount(e.target.value)}
                placeholder="e.g., 3333"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteAddress">Address</Label>
              <Input
                id="siteAddress"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="123 Main St, City"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteDescription">Description</Label>
              <Textarea
                id="siteDescription"
                value={siteDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setSiteDescription(e.target.value)
                }
                placeholder="Optional description"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSiteDialog(false);
              setEditingSite(null);
              setSiteName("");
              setSiteDescription("");
              setSiteAddress("");
              setSiteAccount("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveSite} disabled={!siteName || !siteAccount}>
              {editingSite ? "Update Site" : "Create Site"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Floor Dialog */}
      <Dialog open={showFloorDialog} onOpenChange={(open) => {
        setShowFloorDialog(open);
        if (open && selectedSite && !editingFloor) {
          // Pre-fill account number from selected site
          const site = sites?.find(s => s._id === selectedSite);
          if (site) {
            setFloorAccount(site.accountNumber);
          }
        }
        if (!open) {
          setEditingFloor(null);
          setFloorName("");
          setFloorAccount("");
          setFloorArea("");
          setFloorWidth("1200");
          setFloorHeight("800");
          setFloorPlanUrl("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFloor ? "Edit Area" : "Add New Area"}</DialogTitle>
            <DialogDescription>
              {editingFloor ? "Update area information" : "Add an area to the selected site"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="floorName">Area Name *</Label>
              <Input
                id="floorName"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                placeholder="e.g., Ground Floor, Area 2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floorAccount">Account Number</Label>
                <Input
                  id="floorAccount"
                  value={floorAccount}
                  onChange={(e) => setFloorAccount(e.target.value)}
                  placeholder="e.g., 3333"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floorArea">Area Number *</Label>
                <Input
                  id="floorArea"
                  value={floorArea}
                  onChange={(e) => setFloorArea(e.target.value)}
                  placeholder="e.g., 01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floorWidth">Width (px)</Label>
                <Input
                  id="floorWidth"
                  type="number"
                  value={floorWidth}
                  onChange={(e) => setFloorWidth(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floorHeight">Height (px)</Label>
                <Input
                  id="floorHeight"
                  type="number"
                  value={floorHeight}
                  onChange={(e) => setFloorHeight(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="floorPlanUrl">Area Plan Image URL</Label>
              <Input
                id="floorPlanUrl"
                type="url"
                value={floorPlanUrl}
                onChange={(e) => setFloorPlanUrl(e.target.value)}
                placeholder="https://example.com/floorplan.png"
              />
              <p className="text-xs text-muted-foreground">
                Enter a publicly accessible image URL for the area plan background
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowFloorDialog(false);
              setEditingFloor(null);
              setFloorName("");
              setFloorAccount("");
              setFloorArea("");
              setFloorWidth("1200");
              setFloorHeight("800");
              setFloorPlanUrl("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveFloor} disabled={!floorName}>
              {editingFloor ? "Update Floor" : "Create Floor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Sensor Dialog */}
      <Dialog open={showSensorDialog} onOpenChange={(open) => {
        setShowSensorDialog(open);
        if (open && selectedFloor && !editingSensor) {
          // Pre-fill account and area numbers
          const floor = floors?.find(f => f._id === selectedFloor);
          if (floor) {
            const site = sites?.find(s => s._id === floor.siteId);
            if (site) {
              setSensorAccount(site.accountNumber);
              setSensorArea(floor.areaNumber);
            }
          }
        }
        if (!open) {
          setEditingSensor(null);
          setSensorName("");
          setSensorAccount("");
          setSensorArea("");
          setSensorType("door");
          setSensorZone("");
          setSensorX("100");
          setSensorY("100");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSensor ? "Edit Sensor" : "Add New Sensor"}</DialogTitle>
            <DialogDescription>
              {editingSensor ? "Update sensor information" : "Place a sensor on the area plan"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sensorName">Sensor Name *</Label>
              <Input
                id="sensorName"
                value={sensorName}
                onChange={(e) => setSensorName(e.target.value)}
                placeholder="e.g., Main Door, Server Room"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sensorAccount">Account Number *</Label>
                <Input
                  id="sensorAccount"
                  value={sensorAccount}
                  onChange={(e) => setSensorAccount(e.target.value)}
                  placeholder="e.g., 3333"
                  disabled={!editingSensor}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sensorArea">Area Number *</Label>
                <Input
                  id="sensorArea"
                  value={sensorArea}
                  onChange={(e) => setSensorArea(e.target.value)}
                  placeholder="e.g., 01"
                  disabled={!editingSensor}
                />
              </div>
            </div>
            {!editingSensor && (
              <p className="text-xs text-muted-foreground">Account and area numbers are pre-filled from the selected floor</p>
            )}
            {editingSensor && (
              <p className="text-xs text-muted-foreground">Account and area numbers cannot be changed</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="sensorType">Sensor Type</Label>
              <Select value={sensorType} onValueChange={setSensorType}>
                <SelectTrigger id="sensorType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="door">Door Sensor</SelectItem>
                  <SelectItem value="motion">Motion Detector</SelectItem>
                  <SelectItem value="fire">Fire Alarm</SelectItem>
                  <SelectItem value="panic">Panic Button</SelectItem>
                  <SelectItem value="camera">Camera</SelectItem>
                  <SelectItem value="smoke">Smoke Detector</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sensorZone">Zone</Label>
              <Input
                id="sensorZone"
                value={sensorZone}
                onChange={(e) => setSensorZone(e.target.value)}
                placeholder="Optional zone identifier"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sensorX">Position X (pixels) *</Label>
                <Input
                  id="sensorX"
                  type="number"
                  value={sensorX}
                  onChange={(e) => setSensorX(e.target.value)}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sensorY">Position Y (pixels) *</Label>
                <Input
                  id="sensorY"
                  type="number"
                  value={sensorY}
                  onChange={(e) => setSensorY(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSensorDialog(false);
              setEditingSensor(null);
              setSensorName("");
              setSensorAccount("");
              setSensorArea("");
              setSensorType("door");
              setSensorZone("");
              setSensorX("100");
              setSensorY("100");
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveSensor} disabled={!sensorName || !sensorAccount || !sensorArea}>
              {editingSensor ? "Update Sensor" : "Create Sensor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
