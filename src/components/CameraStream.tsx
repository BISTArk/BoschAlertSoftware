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
  const imgRef = useRef<HTMLImageElement>(null);
  const [streamStatus, setStreamStatus] = useState<"loading" | "playing" | "error" | "unavailable">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isMJPEG, setIsMJPEG] = useState(false);

  // Construct stream URL with authentication
  const getStreamUrl = () => {
    if (!cameraIp) return "";
    
    if (cameraUsername && cameraPassword) {
      return `http://${encodeURIComponent(cameraUsername)}:${encodeURIComponent(cameraPassword)}@${cameraIp}:${cameraPort}${cameraStreamPath}`;
    }
    return `http://${cameraIp}:${cameraPort}${cameraStreamPath}`;
  };

  const streamUrl = getStreamUrl();

  useEffect(() => {
    if (!cameraIp) {
      setStreamStatus("unavailable");
      return;
    }

    setStreamStatus("loading");

    // Detect if it's likely an MJPEG stream
    const pathLower = cameraStreamPath.toLowerCase();
    const isMJPEGStream = pathLower.includes('mjpeg') || 
                           pathLower.includes('mjpg') ||
                           pathLower.includes('video') ||
                           pathLower.includes('.jpg') ||
                           pathLower.includes('.jpeg');

    // If it's MJPEG, use img tag
    if (isMJPEGStream) {
      console.log("Detected MJPEG stream, using <img> tag");
      setIsMJPEG(true);
      setStreamStatus("playing");
      return;
    }

    // For video streams, wait for video element to be mounted
    const setupStream = () => {
      const video = videoRef.current;
      
      if (!video) {
        // Retry after a short delay if video element not ready
        const timeout = setTimeout(setupStream, 100);
        return () => clearTimeout(timeout);
      }

      console.log("Attempting to connect to camera stream:", {
        url: streamUrl,
        ip: cameraIp,
        port: cameraPort,
        path: cameraStreamPath,
      });

      // Try to load the stream directly
      const tryDirectStream = async () => {
        try {
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
                hls.attachMedia(video);
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                  video.play().then(() => {
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
            else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = streamUrl;
              video.play().then(() => {
                setStreamStatus("playing");
              }).catch((err) => {
                console.error("Play error:", err);
                setStreamStatus("error");
                setErrorMessage("Failed to play HLS stream");
              });
              return;
            }
          }
          
          // For other formats (MP4, WebM, etc.)
          video.src = streamUrl;
          
          video.play().then(() => {
            setStreamStatus("playing");
          }).catch((err) => {
            console.error("Play error:", err);
            // Try MJPEG as fallback
            console.log("Video playback failed, trying MJPEG fallback...");
            setIsMJPEG(true);
            setStreamStatus("playing");
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
      if (cleanup) cleanup();
      if (videoRef.current) {
        videoRef.current.src = "";
        videoRef.current.load();
      }
    };
  }, [cameraIp, cameraPort, cameraUsername, cameraPassword, cameraStreamPath, streamUrl]);

  const handleVideoError = () => {
    console.log("Video error, switching to MJPEG mode...");
    setIsMJPEG(true);
    setStreamStatus("playing");
  };

  const handleVideoPlay = () => {
    setStreamStatus("playing");
  };

  const handleImgLoad = () => {
    console.log("MJPEG stream loaded successfully");
    setStreamStatus("playing");
  };

  const handleImgError = () => {
    console.error("MJPEG stream load error");
    setStreamStatus("error");
    setErrorMessage("Failed to load MJPEG stream. Check URL and credentials.");
  };

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {/* Video element for HLS, MP4, WebM, etc. */}
      {!isMJPEG && (
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${streamStatus !== "playing" ? "hidden" : ""}`}
          autoPlay
          playsInline
          muted
          onError={handleVideoError}
          onPlay={handleVideoPlay}
        />
      )}

      {/* Image element for MJPEG streams */}
      {isMJPEG && streamUrl && (
        <img
          ref={imgRef}
          src={streamUrl}
          alt="Camera MJPEG Stream"
          className={`w-full h-full object-cover ${streamStatus !== "playing" ? "hidden" : ""}`}
          onLoad={handleImgLoad}
          onError={handleImgError}
        />
      )}

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
                  <p className="text-yellow-500 mt-2">Stream URL: {streamUrl}</p>
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
