import { useEffect, useRef, useState } from "react";
import { Video, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface CameraStreamProps {
  cameraIp?: string;
  cameraPort?: number;
  cameraUsername?: string;
  cameraPassword?: string;
  cameraStreamPath?: string;
  accountNumber: string;
  areaNumber?: string;
  zoneNumber?: string;
  className?: string;
}

export function CameraStream({
  cameraIp,
  cameraPort = 554,
  cameraUsername,
  cameraPassword,
  cameraStreamPath = "/stream1",
  accountNumber,
  areaNumber,
  zoneNumber,
  className = "",
}: CameraStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamStatus, setStreamStatus] = useState<"loading" | "playing" | "error" | "unavailable">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!cameraIp) {
      setStreamStatus("unavailable");
      return;
    }

    setStreamStatus("loading");

    // Wait for video element to be mounted
    const setupStream = () => {
      const video = videoRef.current;
      
      if (!video) {
        // Retry after a short delay if video element not ready
        const timeout = setTimeout(setupStream, 100);
        return () => clearTimeout(timeout);
      }

      // Construct the stream URL from the camera IP and path
      // Since the stream already works in browser, we'll try multiple common formats
      const streamUrl = `http://${cameraIp}:${cameraPort}${cameraStreamPath}`;
      
      console.log("Attempting to connect to camera stream:", {
        url: streamUrl,
        ip: cameraIp,
        port: cameraPort,
        path: cameraStreamPath,
      });

      // Try to load the stream directly
      // This handles: HLS (.m3u8), MP4, WebM, or direct HTTP streams
      const tryDirectStream = async () => {
        try {
          // Double-check video element still exists
          if (!videoRef.current) {
            console.error("Video element lost during setup");
            return;
          }

          const currentVideo = videoRef.current;

          // Check if it's an HLS stream (.m3u8)
          if (cameraStreamPath.includes('.m3u8') || cameraStreamPath.includes('m3u8')) {
            // Try to use HLS.js for better browser support
            if ('Hls' in window) {
              const Hls = (window as any).Hls;
              if (Hls.isSupported()) {
                const hls = new Hls({
                  enableWorker: true,
                  lowLatencyMode: true,
                });
                
                hls.loadSource(streamUrl);
                hls.attachMedia(currentVideo);
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                  currentVideo.play().then(() => {
                    setStreamStatus("playing");
                  }).catch((err) => {
                    console.error("Play error:", err);
                    setStreamStatus("error");
                    setErrorMessage("Failed to play stream");
                  });
                });
                
                hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
                  console.error("HLS error:", data);
                  if (data.fatal) {
                    setStreamStatus("error");
                    setErrorMessage(data.details || "HLS playback error");
                  }
                });
                
                return () => hls.destroy();
              }
            }
            // Native HLS support (Safari)
            else if (currentVideo.canPlayType('application/vnd.apple.mpegurl')) {
              currentVideo.src = streamUrl;
              currentVideo.play().then(() => {
                setStreamStatus("playing");
              }).catch((err) => {
                console.error("Play error:", err);
                setStreamStatus("error");
                setErrorMessage("Failed to play HLS stream");
              });
              return;
            }
          }
          
          // For other formats (MP4, WebM, MJPEG stream, etc.)
          // Add authentication if provided
          let finalUrl = streamUrl;
          if (cameraUsername && cameraPassword) {
            // For basic auth, embed credentials in URL
            finalUrl = `http://${encodeURIComponent(cameraUsername)}:${encodeURIComponent(cameraPassword)}@${cameraIp}:${cameraPort}${cameraStreamPath}`;
          }
          
          // Try setting the source directly
          currentVideo.src = finalUrl;
          
          currentVideo.play().then(() => {
            setStreamStatus("playing");
          }).catch((err) => {
            console.error("Play error:", err);
            // If direct play fails, it might be MJPEG or needs special handling
            setStreamStatus("error");
            setErrorMessage(`Cannot play stream. Error: ${err.message}`);
          });
          
        } catch (error) {
          console.error("Stream setup error:", error);
          setStreamStatus("error");
          setErrorMessage(error instanceof Error ? error.message : "Failed to setup stream");
        }
      };

      tryDirectStream();
    };

    const cleanup = setupStream();

    return () => {
      // Cleanup
      if (cleanup) cleanup();
      if (videoRef.current) {
        videoRef.current.src = "";
        videoRef.current.load();
      }
    };
  }, [cameraIp, cameraPort, cameraUsername, cameraPassword, cameraStreamPath]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Video playback error:", e);
    setStreamStatus("error");
    setErrorMessage("Failed to play video stream");
  };

  const handleVideoPlay = () => {
    setStreamStatus("playing");
  };

  return (
    <div className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Always render video element so ref is set */}
      <video
        ref={videoRef}
        className={`w-full h-full object-cover ${streamStatus !== "playing" ? "hidden" : ""}`}
        autoPlay
        playsInline
        muted
        onError={handleVideoError}
        onPlay={handleVideoPlay}
      />

      {/* Overlay status screens */}
      {streamStatus === "unavailable" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center">
            <Video className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Camera Not Configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure camera IP in Area Setup
            </p>
            <Badge variant="outline" className="mt-2">
              Account {accountNumber}
              {areaNumber && `, Area ${areaNumber}`}
              {zoneNumber && `, Zone ${zoneNumber}`}
            </Badge>
          </div>
        </div>
      )}

      {streamStatus === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-2 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Connecting to camera...</p>
            <p className="text-xs text-muted-foreground mt-1">{cameraIp}:{cameraPort}</p>
          </div>
        </div>
      )}

      {streamStatus === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center max-w-md p-4">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
            <p className="text-sm font-semibold text-white mb-1">Camera Stream Error</p>
            <p className="text-xs text-muted-foreground mb-3">{errorMessage}</p>
            <Card className="bg-muted/10">
              <CardContent className="p-3 text-left">
                <p className="text-xs font-semibold text-white mb-2">Configuration:</p>
                <div className="space-y-1 text-xs text-muted-foreground font-mono">
                  <p>IP: {cameraIp}</p>
                  <p>Port: {cameraPort}</p>
                  <p>Path: {cameraStreamPath}</p>
                  <p>Auth: {cameraUsername ? "✓ Configured" : "✗ Not configured"}</p>
                  <p className="text-yellow-500 mt-2">Stream URL: http://{cameraIp}:{cameraPort}{cameraStreamPath}</p>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-3">
              Verify the stream URL is accessible and returns a valid video format (HLS, MP4, MJPEG, etc.)
            </p>
          </div>
        </div>
      )}

      {/* Live badge when playing */}
      {streamStatus === "playing" && (
        <div className="absolute top-2 right-2">
          <Badge variant="destructive" className="bg-red-600">
            <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
            LIVE
          </Badge>
        </div>
      )}
      
      {/* Camera info badge */}
      <div className="absolute bottom-2 left-2">
        <Badge variant="outline" className="bg-black/50 backdrop-blur-sm">
          Account {accountNumber}
          {areaNumber && `, Area ${areaNumber}`}
          {zoneNumber && `, Zone ${zoneNumber}`}
        </Badge>
      </div>
    </div>
  );
}
