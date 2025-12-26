import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Move } from "lucide-react";

export function FloorPlanEditor() {
  const { user } = useAuth();
  const [selectedSite, setSelectedSite] = useState<Id<"sites"> | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<Id<"floors"> | null>(null);
  const [draggedSensor, setDraggedSensor] = useState<Id<"sensors"> | null>(null);
  const [sensorPositions, setSensorPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [floorPlanImage, setFloorPlanImage] = useState<HTMLImageElement | null>(null);

  const sites = useQuery(api.siteMap.getSites);
  const floors = useQuery(
    api.siteMap.getFloorsBySite,
    selectedSite ? { siteId: selectedSite } : "skip"
  );
  const currentFloor = useQuery(
    api.siteMap.getFloor,
    selectedFloor ? { floorId: selectedFloor } : "skip"
  );
  const sensors = useQuery(
    api.siteMap.getSensorsByFloor,
    selectedFloor ? { floorId: selectedFloor } : "skip"
  );

  const updateSensor = useMutation(api.siteMap.updateSensor);

  // Load floor plan image
  useEffect(() => {
    if (!currentFloor?.floorPlanUrl) {
      setFloorPlanImage(null);
      return;
    }

    const img = new Image();
    // Don't set crossOrigin to avoid CORS issues with external images
    img.onload = () => {
      console.log("Floor plan image loaded successfully");
      setFloorPlanImage(img);
    };
    img.onerror = (e) => {
      console.error("Failed to load floor plan image:", e);
      setFloorPlanImage(null);
    };
    console.log("Loading floor plan image from URL:", currentFloor.floorPlanUrl);
    img.src = currentFloor.floorPlanUrl;
  }, [currentFloor?.floorPlanUrl]);

  // Initialize sensor positions from database
  useEffect(() => {
    if (!sensors) return;
    
    const positions: Record<string, { x: number; y: number }> = {};
    sensors.forEach((sensor) => {
      positions[sensor._id] = { x: sensor.positionX, y: sensor.positionY };
    });
    setSensorPositions(positions);
    setHasChanges(false);
  }, [sensors]);

  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current || !currentFloor) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = currentFloor.width;
    canvas.height = currentFloor.height;

    const draw = () => {
      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw floor plan background
      if (floorPlanImage && floorPlanImage.complete && floorPlanImage.naturalWidth > 0) {
        console.log("Drawing floor plan image", floorPlanImage.width, floorPlanImage.height);
        ctx.globalAlpha = 0.3;
        ctx.drawImage(floorPlanImage, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
      } else if (currentFloor.floorPlanUrl) {
        console.log("Floor plan image not ready yet");
        // Draw loading indicator
        ctx.fillStyle = "#4a4a4a";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Loading floor plan...", canvas.width / 2, canvas.height / 2);
      } else {
        // Draw grid if no background
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
      }

      // Draw sensors
      if (sensors) {
        sensors.forEach((sensor) => {
          const pos = sensorPositions[sensor._id];
          if (!pos) return;

          const x = pos.x;
          const y = pos.y;
          const isBeingDragged = draggedSensor === sensor._id;

          // Draw sensor shadow
          ctx.beginPath();
          ctx.arc(x, y, 14, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
          ctx.fill();

          // Draw sensor
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fillStyle = getSensorColor(sensor.type);
          ctx.fill();
          ctx.strokeStyle = isBeingDragged ? "#fbbf24" : "#ffffff";
          ctx.lineWidth = isBeingDragged ? 4 : 3;
          ctx.stroke();

          // Draw sensor label
          ctx.fillStyle = "#ffffff";
          ctx.font = "12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(sensor.name, x, y + 30);
        });
      }
    };

    draw();
  }, [currentFloor, sensors, sensorPositions, draggedSensor, floorPlanImage]);

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

  const getSensorAtPosition = (x: number, y: number): Id<"sensors"> | null => {
    if (!sensors) return null;

    for (const sensor of sensors) {
      const pos = sensorPositions[sensor._id];
      if (!pos) continue;

      const dx = x - pos.x;
      const dy = y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= 12) {
        return sensor._id;
      }
    }

    return null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !currentFloor) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    const sensorId = getSensorAtPosition(x, y);
    if (sensorId) {
      setDraggedSensor(sensorId);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedSensor || !canvasRef.current || !currentFloor) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    // Constrain to canvas bounds
    const constrainedX = Math.max(15, Math.min(currentFloor.width - 15, x));
    const constrainedY = Math.max(15, Math.min(currentFloor.height - 15, y));

    setSensorPositions((prev) => ({
      ...prev,
      [draggedSensor]: { x: constrainedX, y: constrainedY },
    }));
    setHasChanges(true);
  };

  const handleCanvasMouseUp = () => {
    setDraggedSensor(null);
  };

  const handleSavePositions = async () => {
    if (!sensors) return;

    try {
      // Update all sensors with new positions
      const updates = sensors
        .filter((sensor) => {
          const pos = sensorPositions[sensor._id];
          return pos && (pos.x !== sensor.positionX || pos.y !== sensor.positionY);
        })
        .map((sensor) => {
          const pos = sensorPositions[sensor._id];
          return updateSensor({
            sensorId: sensor._id,
            name: sensor.name,
            type: sensor.type,
            zone: sensor.zone || undefined,
            positionX: pos.x,
            positionY: pos.y,
          });
        });

      await Promise.all(updates);
      setHasChanges(false);
      alert(`Updated ${updates.length} sensor position(s)`);
    } catch (error) {
      console.error("Failed to save positions:", error);
      alert("Failed to save positions. Please try again.");
    }
  };

  const handleReset = () => {
    if (!sensors) return;
    
    const positions: Record<string, { x: number; y: number }> = {};
    sensors.forEach((sensor) => {
      positions[sensor._id] = { x: sensor.positionX, y: sensor.positionY };
    });
    setSensorPositions(positions);
    setHasChanges(false);
  };

  if (user?.role !== "admin" && user?.role !== "head") {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          You don't have permission to access this page. Admin or Head access required.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Area Plan Editor</h1>
          <p className="text-muted-foreground">Drag sensors to update their positions on the area plan</p>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={handleSavePositions}>
              <Save className="h-4 w-4 mr-2" />
              Save Positions
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Select Location</CardTitle>
            <CardDescription>Choose a site and floor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Select
                value={selectedSite || undefined}
                onValueChange={(value) => {
                  setSelectedSite(value as Id<"sites">);
                  setSelectedFloor(null);
                }}
              >
                <SelectTrigger id="site">
                  <SelectValue placeholder="Select a site" />
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

            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Select
                value={selectedFloor || undefined}
                onValueChange={(value) => setSelectedFloor(value as Id<"floors">)}
                disabled={!selectedSite}
              >
                <SelectTrigger id="floor">
                  <SelectValue placeholder="Select a floor" />
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

            {selectedFloor && sensors && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Sensors: {sensors.length}</p>
                <div className="space-y-2">
                  {sensors.map((sensor) => (
                    <div
                      key={sensor._id}
                      className="flex items-center gap-2 text-xs p-2 rounded bg-muted"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getSensorColor(sensor.type) }}
                      />
                      <span>{sensor.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Move className="h-5 w-5" />
              Area Plan
            </CardTitle>
            <CardDescription>
              {selectedFloor
                ? "Click and drag sensors to reposition them. Click Save to update."
                : "Select an area to begin editing"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedFloor && currentFloor ? (
              <div className="relative w-full border rounded-lg bg-background overflow-auto">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto cursor-move"
                  style={{ maxHeight: "70vh" }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Select a floor to view the plan</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
