import { useState, useMemo } from "react";
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
  
  // Dynamically discover available floor plans using Vite's import.meta.glob
  const availableFloorPlans = useMemo(() => {
    const floorPlanModules = import.meta.glob('/public/floor-plans/*.{png,jpg,jpeg,svg}', { 
      eager: true,
      as: 'url' 
    });
    
    return Object.keys(floorPlanModules).map(path => {
      // Convert /public/floor-plans/image.png -> /floor-plans/image.png
      const publicPath = path.replace('/public', '');
      const filename = path.split('/').pop() || '';
      return { path: publicPath, filename };
    }).sort((a, b) => a.filename.localeCompare(b.filename));
  }, []);
  
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
  const deleteSite = useMutation(api.siteMap.deleteSite);
  const createFloor = useMutation(api.siteMap.createFloor);
  const updateFloor = useMutation(api.siteMap.updateFloor);
  const deleteFloor = useMutation(api.siteMap.deleteFloor);
  const createSensor = useMutation(api.siteMap.createSensor);
  const updateSensor = useMutation(api.siteMap.updateSensor);
  const deleteSensor = useMutation(api.siteMap.deleteSensor);

  // Form states
  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [siteAccount, setSiteAccount] = useState("");
  const [siteLatitude, setSiteLatitude] = useState("");
  const [siteLongitude, setSiteLongitude] = useState("");
  const [siteCity, setSiteCity] = useState("");
  const [siteState, setSiteState] = useState("");
  const [siteCountry, setSiteCountry] = useState("");

  const [floorName, setFloorName] = useState("");
  const [floorAccount, setFloorAccount] = useState("");
  const [floorArea, setFloorArea] = useState("");
  const [floorWidth, setFloorWidth] = useState("1200");
  const [floorHeight, setFloorHeight] = useState("800");
  const [floorPlanUrl, setFloorPlanUrl] = useState("");
  const [cameraIp, setCameraIp] = useState("");
  const [cameraPort, setCameraPort] = useState("554");
  const [cameraUsername, setCameraUsername] = useState("");
  const [cameraPassword, setCameraPassword] = useState("");
  const [cameraStreamPath, setCameraStreamPath] = useState("/stream1");
  const [fallbackVideoUrl, setFallbackVideoUrl] = useState("");

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
        latitude: siteLatitude ? parseFloat(siteLatitude) : undefined,
        longitude: siteLongitude ? parseFloat(siteLongitude) : undefined,
        city: siteCity || undefined,
        state: siteState || undefined,
        country: siteCountry || undefined,
      });
    } else {
      if (!user) return;
      await createSite({
        accountNumber: siteAccount,
        name: siteName,
        description: siteDescription || undefined,
        address: siteAddress || undefined,
        latitude: siteLatitude ? parseFloat(siteLatitude) : undefined,
        longitude: siteLongitude ? parseFloat(siteLongitude) : undefined,
        city: siteCity || undefined,
        state: siteState || undefined,
        country: siteCountry || undefined,
        createdBy: user._id,
      });
    }

    setSiteName("");
    setSiteDescription("");
    setSiteAddress("");
    setSiteAccount("");
    setSiteLatitude("");
    setSiteLongitude("");
    setSiteCity("");
    setSiteState("");
    setSiteCountry("");
    setEditingSite(null);
    setShowSiteDialog(false);
  };

  const handleEditSite = (site: any) => {
    setEditingSite(site._id);
    setSiteName(site.name);
    setSiteDescription(site.description || "");
    setSiteAddress(site.address || "");
    setSiteAccount(site.accountNumber || "");
    setSiteLatitude(site.latitude ? site.latitude.toString() : "");
    setSiteLongitude(site.longitude ? site.longitude.toString() : "");
    setSiteCity(site.city || "");
    setSiteState(site.state || "");
    setSiteCountry(site.country || "");
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
        cameraIp: cameraIp || undefined,
        cameraPort: cameraPort ? parseInt(cameraPort) : undefined,
        cameraUsername: cameraUsername || undefined,
        cameraPassword: cameraPassword || undefined,
        cameraStreamPath: cameraStreamPath || undefined,
        fallbackVideoUrl: fallbackVideoUrl || undefined,
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
        cameraIp: cameraIp || undefined,
        cameraPort: cameraPort ? parseInt(cameraPort) : undefined,
        cameraUsername: cameraUsername || undefined,
        cameraPassword: cameraPassword || undefined,
        cameraStreamPath: cameraStreamPath || undefined,
        fallbackVideoUrl: fallbackVideoUrl || undefined,
      });
    }

    setFloorName("");
    setFloorAccount("");
    setFloorArea("");
    setFloorPlanUrl("");
    setCameraIp("");
    setCameraPort("554");
    setCameraUsername("");
    setCameraPassword("");
    setCameraStreamPath("/stream1");
    setFallbackVideoUrl("");
    setEditingFloor(null);
    setShowFloorDialog(false);
  };

  const handleEditFloor = (floor: any) => {
    setEditingFloor(floor._id);
    setFloorName(floor.name);
    setFloorArea(floor.areaNumber || "");
    setFloorWidth(floor.width.toString());
    setFloorHeight(floor.height.toString());
    setFloorPlanUrl(floor.floorPlanUrl || "");
    setCameraIp(floor.cameraIp || "");
    setCameraPort(floor.cameraPort?.toString() || "554");
    setCameraUsername(floor.cameraUsername || "");
    setCameraPassword(floor.cameraPassword || "");
    setCameraStreamPath(floor.cameraStreamPath || "/stream1");
    setFallbackVideoUrl(floor.fallbackVideoUrl || "");
    
    // Pre-fill account number from the site
    if (sites) {
      const site = sites.find(s => s._id === floor.siteId);
      if (site) {
        setFloorAccount(site.accountNumber);
      }
    }
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

  const handleDeleteSite = async (siteId: Id<"sites">) => {
    if (confirm("Are you sure you want to delete this site? This will also affect all associated areas and sensors.")) {
      await deleteSite({ siteId });
      if (selectedSite === siteId) {
        setSelectedSite(null);
        setSelectedFloor(null);
      }
    }
  };

  const handleDeleteFloor = async (floorId: Id<"floors">) => {
    if (confirm("Are you sure you want to delete this area? This will also affect all associated sensors.")) {
      await deleteFloor({ floorId });
      if (selectedFloor === floorId) {
        setSelectedFloor(null);
      }
    }
  };

  const handleAddFloor = () => {
    // Pre-fill account number from selected site
    if (selectedSite && sites) {
      const site = sites.find(s => s._id === selectedSite);
      if (site) {
        setFloorAccount(site.accountNumber);
      }
    }
    setShowFloorDialog(true);
  };

  const handleAddSensor = () => {
    // Pre-fill account and area numbers from selected floor
    if (selectedFloor && floors) {
      const floor = floors.find(f => f._id === selectedFloor);
      if (floor && sites) {
        const site = sites.find(s => s._id === floor.siteId);
        if (site) {
          setSensorAccount(site.accountNumber);
          setSensorArea(floor.areaNumber);
        }
      }
    }
    setShowSensorDialog(true);
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
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditSite(site)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSite(site._id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
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
              onClick={handleAddFloor}
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
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditFloor(floor)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFloor(floor._id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
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
              onClick={handleAddSensor}
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
          setSiteLatitude("");
          setSiteLongitude("");
          setSiteCity("");
          setSiteState("");
          setSiteCountry("");
        }
      }}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingSite ? "Edit Site" : "Add New Site"}</DialogTitle>
            <DialogDescription>
              {editingSite ? "Update site information" : "Create a new location for monitoring"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
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

            {/* Geographic Location Section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-3">Geographic Location (Optional)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteLatitude">Latitude</Label>
                  <Input
                    id="siteLatitude"
                    type="number"
                    step="any"
                    value={siteLatitude}
                    onChange={(e) => setSiteLatitude(e.target.value)}
                    placeholder="e.g., 24.7136"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteLongitude">Longitude</Label>
                  <Input
                    id="siteLongitude"
                    type="number"
                    step="any"
                    value={siteLongitude}
                    onChange={(e) => setSiteLongitude(e.target.value)}
                    placeholder="e.g., 46.6753"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="siteCity">City</Label>
                <Input
                  id="siteCity"
                  value={siteCity}
                  onChange={(e) => setSiteCity(e.target.value)}
                  placeholder="e.g., Riyadh"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="siteState">State/Province</Label>
                  <Input
                    id="siteState"
                    value={siteState}
                    onChange={(e) => setSiteState(e.target.value)}
                    placeholder="e.g., Riyadh Province"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteCountry">Country</Label>
                  <Input
                    id="siteCountry"
                    value={siteCountry}
                    onChange={(e) => setSiteCountry(e.target.value)}
                    placeholder="e.g., Saudi Arabia"
                  />
                </div>
              </div>
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
              setSiteLatitude("");
              setSiteLongitude("");
              setSiteCity("");
              setSiteState("");
              setSiteCountry("");
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
        if (!open) {
          setEditingFloor(null);
          setFloorName("");
          setFloorAccount("");
          setFloorArea("");
          setFloorWidth("1200");
          setFloorHeight("800");
          setFloorPlanUrl("");
          setCameraIp("");
          setCameraPort("554");
          setCameraUsername("");
          setCameraPassword("");
          setCameraStreamPath("/stream1");
          setFallbackVideoUrl("");
        }
      }}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingFloor ? "Edit Area" : "Add New Area"}</DialogTitle>
            <DialogDescription>
              {editingFloor ? "Update area information" : "Add an area to the selected site"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
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
              <Label htmlFor="floorPlanUrl">Area Plan Image</Label>
              
              {/* Quick select from local floor plans */}
              <Select 
                value={floorPlanUrl.startsWith('/floor-plans/') ? floorPlanUrl : 'custom'}
                onValueChange={(value) => {
                  if (value !== 'custom') {
                    setFloorPlanUrl(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    availableFloorPlans.length > 0 
                      ? "Select a local floor plan or enter URL below" 
                      : "No local floor plans found - enter URL below or run npm run sync-floor-plans"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom URL (enter below)</SelectItem>
                  {availableFloorPlans.length === 0 && (
                    <SelectItem value="none" disabled>
                      No local floor plans - run: npm run sync-floor-plans
                    </SelectItem>
                  )}
                  {availableFloorPlans.map((plan) => (
                    <SelectItem key={plan.path} value={plan.path}>
                      {plan.filename} (Local)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Manual URL input */}
              <Input
                id="floorPlanUrl"
                type="text"
                value={floorPlanUrl}
                onChange={(e) => setFloorPlanUrl(e.target.value)}
                placeholder="/floor-plans/your-image.png or https://example.com/floorplan.png"
              />
              <p className="text-xs text-muted-foreground">
                💡 Local images work offline! {availableFloorPlans.length > 0 ? `Found ${availableFloorPlans.length} local floor plan${availableFloorPlans.length > 1 ? 's' : ''}.` : 'Run npm run sync-floor-plans to download images.'} Add custom images to <code className="bg-muted px-1 rounded">public/floor-plans/</code>
              </p>
            </div>

            {/* Camera Configuration Section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-3">ONVIF Camera Configuration (Optional)</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Configure the ONVIF camera for this area. Multiple areas can share the same camera.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cameraIp">Camera IP Address</Label>
                  <Input
                    id="cameraIp"
                    value={cameraIp}
                    onChange={(e) => setCameraIp(e.target.value)}
                    placeholder="e.g., 192.168.1.100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cameraPort">RTSP Port</Label>
                  <Input
                    id="cameraPort"
                    type="number"
                    value={cameraPort}
                    onChange={(e) => setCameraPort(e.target.value)}
                    placeholder="554"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="cameraUsername">Username</Label>
                  <Input
                    id="cameraUsername"
                    value={cameraUsername}
                    onChange={(e) => setCameraUsername(e.target.value)}
                    placeholder="admin"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cameraPassword">Password</Label>
                  <Input
                    id="cameraPassword"
                    type="password"
                    value={cameraPassword}
                    onChange={(e) => setCameraPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="cameraStreamPath">Stream Path</Label>
                <Input
                  id="cameraStreamPath"
                  value={cameraStreamPath}
                  onChange={(e) => setCameraStreamPath(e.target.value)}
                  placeholder="/stream1 or /h264/ch1/main/av_stream"
                />
                <p className="text-xs text-muted-foreground">
                  Common paths: /stream1, /cam/realmonitor, /h264/ch1/main/av_stream
                </p>
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t">
                <Label htmlFor="fallbackVideoUrl">Fallback Video URL (Optional)</Label>
                <Input
                  id="fallbackVideoUrl"
                  type="url"
                  value={fallbackVideoUrl}
                  onChange={(e) => setFallbackVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                />
                <p className="text-xs text-muted-foreground">
                  Video to display when camera IP is not configured. Supports MP4, WebM formats.
                </p>
              </div>
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
              setCameraIp("");
              setCameraPort("554");
              setCameraUsername("");
              setCameraPassword("");
              setCameraStreamPath("/stream1");
              setFallbackVideoUrl("");
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
        console.log("Sensor dialog open:", open, selectedFloor, editingSensor, floors);
        if (open && selectedFloor && !editingSensor) {
          // Pre-fill account and area numbers
          const floor = floors?.find(f => f._id === selectedFloor);
          console.log("Selected floor for pre-fill:", floor);
          if (floor) {
            const site = sites?.find(s => s._id === floor.siteId);
            console.log("Pre-filling sensor account/area:", site, floor);
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
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingSensor ? "Edit Sensor" : "Add New Sensor"}</DialogTitle>
            <DialogDescription>
              {editingSensor ? "Update sensor information" : "Place a sensor on the area plan"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
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
                <Label htmlFor="sensorAccount">Account Number</Label>
                <Input
                  id="sensorAccount"
                  value={sensorAccount}
                  onChange={(e) => setSensorAccount(e.target.value)}
                  placeholder="e.g., 3333"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sensorArea">Area Number</Label>
                <Input
                  id="sensorArea"
                  value={sensorArea}
                  onChange={(e) => setSensorArea(e.target.value)}
                  placeholder="e.g., 01"
                  disabled
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Account and area numbers are pre-filled from the selected floor and cannot be edited</p>

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
            <Button onClick={handleSaveSensor} disabled={!sensorName}>
              {editingSensor ? "Update Sensor" : "Create Sensor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
