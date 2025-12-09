import { useEffect, useRef, useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";

interface Sensor {
  _id: Id<"sensors">;
  name: string;
  accountNumber: string;
  x: number;
  y: number;
  status: "active" | "inactive";
}

interface Guard {
  _id: Id<"users">;
  name: string;
  available?: boolean;
}

interface FloorPlanCanvasProps {
  floorPlanImage?: string;
  sensors: Sensor[];
  guards?: Guard[];
  highlightAlertId?: Id<"alerts"> | null;
  alertAccountNumbers?: string[];
  width?: number;
  height?: number;
  floorWidth?: number;  // Original floor dimensions for coordinate conversion
  floorHeight?: number;
}

export function FloorPlanCanvas({
  floorPlanImage,
  sensors,
  guards = [],
  highlightAlertId,
  alertAccountNumbers = [],
  width = 800,
  height = 600,
  floorWidth = 100,
  floorHeight = 100,
}: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((prev) => (prev + 0.1) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawBackground = () => {
      // Clear canvas
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, width, height);

      // Draw floor plan image if available
      if (floorPlanImage && imageRef.current?.complete) {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(imageRef.current, 0, 0, width, height);
        ctx.globalAlpha = 1.0;
      } else {
        // Draw default grid background
        ctx.strokeStyle = "#2d2d44";
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
      }
    };
console.log("Drawing floor plan with sensors:", alertAccountNumbers);
    const drawSensors = () => {
      if (!ctx || !sensors) return;

      sensors.forEach((sensor) => {
        const x = (sensor.x / floorWidth) * width;
        const y = (sensor.y / floorHeight) * height;

        // Check if this sensor should be highlighted
        const isHighlighted = alertAccountNumbers.includes(sensor.accountNumber);

        // Draw highlight ring if this sensor has an active alert
        if (isHighlighted) {
          // Draw pulsing circle for alerts
          const pulseSize = 20 + Math.sin(pulsePhase) * 10;
          ctx.beginPath();
          ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(239, 68, 68, ${0.3 + Math.sin(pulsePhase) * 0.2})`;
          ctx.fill();

        }
        // Draw sensor icon
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = sensor.status === "active" ? "#3b82f6" : "#6b7280";
        ctx.fill();
        ctx.strokeStyle = isHighlighted ? "#fbbf24" : "#ffffff";
        ctx.lineWidth = isHighlighted ? 3 : 2;
        ctx.stroke();

        // Draw sensor label
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(sensor.name, x, y + 25);
      });
    };

    const drawGuards = () => {
      if (!ctx || !guards || guards.length === 0) return;

      guards.forEach((guard, index) => {
        // Position guards in a list on the right side
        const x = width - 150;
        const y = 50 + index * 60;

        // Draw guard avatar
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fillStyle = guard.available ? "#10b981" : "#f59e0b";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw guard icon (person)
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("👤", x, y + 6);

        // Draw guard name
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(guard.name, x + 30, y + 5);
      });
    };

    const draw = () => {
      drawBackground();
      drawSensors();
      drawGuards();
    };

    // Load image if provided
    if (floorPlanImage && !imageRef.current) {
      const img = new Image();
      img.src = floorPlanImage;
      img.onload = () => {
        imageRef.current = img;
        draw();
      };
    } else {
      draw();
    }

    // Animation loop for pulsing effect
    const animationId = requestAnimationFrame(function animate() {
      draw();
      requestAnimationFrame(animate);
    });

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [floorPlanImage, sensors, guards, highlightAlertId, alertAccountNumbers, width, height, floorWidth, floorHeight, pulsePhase]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
    />
  );
}
