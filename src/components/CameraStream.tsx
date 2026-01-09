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
  const [isSnapshot, setIsSnapshot] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string>("");

  // Construct stream URL with authentication
  const getStreamUrl = (includeTimestamp = false) => {
    if (!cameraIp) return "";
    
    // Detect if it's HTTPS (common ports: 443, or if path starts with https)
    const protocol = cameraPort === 443 || cameraStreamPath.toLowerCase().includes('https') ? 'https' : 'http';
    
    // Build base URL
    let baseUrl = `${protocol}://${cameraIp}`;
    
    // Only add port if it's not the default for the protocol
    if ((protocol === 'https' && cameraPort !== 443) || (protocol === 'http' && cameraPort !== 80)) {
      baseUrl += `:${cameraPort}`;
    }
    
    // Add path
    let fullUrl = baseUrl + cameraStreamPath;
    
    // Add timestamp for snapshot refreshing
    if (includeTimestamp) {
      const separator = cameraStreamPath.includes('?') ? '&' : '?';
      fullUrl += `${separator}rnd=${Date.now()}`;
    }
    
    // Add authentication if provided (only for HTTP Basic Auth)
    if (cameraUsername && cameraPassword && !fullUrl.includes('@')) {
      const urlParts = fullUrl.split('://');
      fullUrl = `${urlParts[0]}://${encodeURIComponent(cameraUsername)}:${encodeURIComponent(cameraPassword)}@${urlParts[1]}`;
    }
    
    return fullUrl;
  };

  const streamUrl = getStreamUrl();

  useEffect(() => {
    if (!cameraIp) {
      setStreamStatus("unavailable");
      return;
    }

    setStreamStatus("loading");

    // Detect if it's likely an MJPEG stream or snapshot
    const pathLower = cameraStreamPath.toLowerCase();
    const isSnapshotUrl = pathLower.includes('snap.jpg') || 
                          pathLower.includes('snapshot') ||
                          pathLower.includes('image.jpg') ||
                          (pathLower.includes('.jpg') && !pathLower.includes('mjpeg'));
    
    const isMJPEGStream = pathLower.includes('mjpeg') || 
                           pathLower.includes('mjpg') ||
                           pathLower.includes('video.cgi') ||
                           (!isSnapshotUrl && pathLower.includes('.jpeg'));

    // If it's a snapshot URL, use fetch with blob URL to bypass img src restrictions
    if (isSnapshotUrl) {
      console.log("Detected snapshot URL, using proxy server");
      setIsMJPEG(true);
      setIsSnapshot(true);
      setStreamStatus("loading");
      
      const fetchSnapshot = async () => {
        try {
          // Use local proxy server to bypass CORS
          const proxyUrl = new URL('http://localhost:3001/camera-snapshot');
          proxyUrl.searchParams.set('ip', cameraIp);
          proxyUrl.searchParams.set('port', cameraPort.toString());
          proxyUrl.searchParams.set('path', cameraStreamPath);
          if (cameraUsername) proxyUrl.searchParams.set('username', cameraUsername);
          if (cameraPassword) proxyUrl.searchParams.set('password', cameraPassword);
          
          console.log("Fetching via proxy:", proxyUrl.toString());
          
          const response = await fetch(proxyUrl.toString(), {
            method: 'GET',
            cache: 'no-store',
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }
          
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          // Revoke previous blob URL to prevent memory leaks
          if (snapshotUrl && snapshotUrl.startsWith('blob:')) {
            URL.revokeObjectURL(snapshotUrl);
          }
          
          setSnapshotUrl(blobUrl);
          setStreamStatus("playing");
        } catch (error) {
          console.error("Snapshot fetch error:", error);
          setStreamStatus("error");
          setErrorMessage(error instanceof Error ? error.message : "Failed to fetch snapshot");
        }
      };
      
      // Initial fetch
      fetchSnapshot();
      
      // Set up periodic refresh for snapshots
      const refreshInterval = setInterval(fetchSnapshot, 100);
      
      return () => {
        clearInterval(refreshInterval);
        if (snapshotUrl && snapshotUrl.startsWith('blob:')) {
          URL.revokeObjectURL(snapshotUrl);
        }
      };
    }
    
    // If it's MJPEG continuous stream, use img tag
    if (isMJPEGStream) {
      console.log("Detected MJPEG stream, using <img> tag");
      setIsMJPEG(true);
      setIsSnapshot(false);
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

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("MJPEG stream load error");
    console.error("Failed URL:", isSnapshot ? snapshotUrl : streamUrl);
    console.error("Error event:", e);
    setStreamStatus("error");
    setErrorMessage("Failed to load camera image. Check browser console for details.");
  };

  return (
    <div className={`relative w-full aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video element for HLS, MP4, WebM, etc. */}
      {!isMJPEG && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${streamStatus !== "playing" ? "hidden" : ""}`}
          autoPlay
          playsInline
          muted
          onError={handleVideoError}
          onPlay={handleVideoPlay}
        />
      )}

      {/* Image element for MJPEG streams and snapshots */}
      {isMJPEG && (isSnapshot ? snapshotUrl : streamUrl) && (
        <img
          ref={imgRef}
          src={isSnapshot ? snapshotUrl : streamUrl}
          alt="Camera Stream"
          className={`absolute inset-0 w-full h-full object-cover ${streamStatus !== "playing" ? "hidden" : ""}`}
          onLoad={handleImgLoad}
          onError={handleImgError}
          referrerPolicy="no-referrer"
        />
      )}

      {/* Overlay status screens */}
      {streamStatus === "unavailable" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 border border-gray-700">
              <Video className="h-8 w-8 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">No Camera Configured</p>
              <p className="text-xs text-gray-500 mt-1">
                Add camera in Area Setup
              </p>
            </div>
          </div>
        </div>
      )}

      {streamStatus === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
          <div className="text-center space-y-3">
            <Loader2 className="h-10 w-10 mx-auto text-blue-500 animate-spin" />
            <div>
              <p className="text-sm font-medium text-gray-300">Connecting...</p>
              <p className="text-xs text-gray-500 mt-1">{cameraIp}</p>
            </div>
          </div>
        </div>
      )}

      {streamStatus === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 p-4">
          <div className="text-center space-y-3 max-w-xs">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">Camera Unavailable</p>
              <p className="text-xs text-gray-500 mt-1">{errorMessage}</p>
            </div>
            {cameraIp && (
              <div className="text-xs text-gray-600 font-mono">
                {cameraIp}:{cameraPort}
              </div>
            )}
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
      {/* <div className="absolute bottom-2 left-2">
        <Badge variant="outline" className="bg-black/50 backdrop-blur-sm">
          Account {accountNumber}
          {areaNumber && `, Area ${areaNumber}`}
          {zoneNumber && `, Zone ${zoneNumber}`}
        </Badge>
      </div> */}
    </div>
  );
}
