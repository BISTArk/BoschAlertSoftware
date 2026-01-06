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
    if (!cameraIp || !videoRef.current) {
      setStreamStatus("unavailable");
      return;
    }
    
    // Construct RTSP URL
    // Format: rtsp://username:password@ip:port/path
    let rtspUrl = "rtsp://";
    if (cameraUsername && cameraPassword) {
      rtspUrl += `${encodeURIComponent(cameraUsername)}:${encodeURIComponent(cameraPassword)}@`;
    }
    rtspUrl += `${cameraIp}:${cameraPort}${cameraStreamPath}`;

    console.log("Attempting to connect to camera stream:", {
      ip: cameraIp,
      port: cameraPort,
      path: cameraStreamPath,
      // Don't log credentials for security
    });

    // Note: Direct RTSP streaming in browsers requires a proxy/transcoding server
    // This is a placeholder for the actual implementation
    // You'll need to either:
    // 1. Use a WebRTC gateway like mediamtx, RTSPtoWeb, or similar
    // 2. Use HLS/DASH transcoding
    // 3. Use a commercial service that handles RTSP-to-Web conversion

    // For now, we'll set up the video element and show instructions
    setStreamStatus("error");
    setErrorMessage(
      "Direct RTSP streaming requires a media server. Please set up a WebRTC/HLS gateway."
    );

    // Example with HLS (if you have a transcoding server):
    // if (Hls.isSupported()) {
    //   const hls = new Hls();
    //   const hlsUrl = `http://your-transcoding-server/stream/${cameraIp}`;
    //   hls.loadSource(hlsUrl);
    //   hls.attachMedia(videoRef.current);
    //   hls.on(Hls.Events.MANIFEST_PARSED, () => {
    //     videoRef.current?.play();
    //     setStreamStatus("playing");
    //   });
    //   hls.on(Hls.Events.ERROR, (event, data) => {
    //     console.error("HLS error:", data);
    //     setStreamStatus("error");
    //     setErrorMessage(data.details);
    //   });
    //   return () => hls.destroy();
    // }

    // Example with WebRTC (using mediamtx or similar):
    // const pc = new RTCPeerConnection();
    // pc.addTransceiver('video', { direction: 'recvonly' });
    // pc.addTransceiver('audio', { direction: 'recvonly' });
    // 
    // pc.ontrack = (event) => {
    //   if (videoRef.current) {
    //     videoRef.current.srcObject = event.streams[0];
    //     setStreamStatus("playing");
    //   }
    // };
    //
    // // Offer/Answer exchange with your WebRTC signaling server
    // const offer = await pc.createOffer();
    // await pc.setLocalDescription(offer);
    // // Send offer to server, receive answer, set remote description
    
  }, [cameraIp, cameraPort, cameraUsername, cameraPassword, cameraStreamPath]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Video playback error:", e);
    setStreamStatus("error");
    setErrorMessage("Failed to play video stream");
  };

  const handleVideoPlay = () => {
    setStreamStatus("playing");
  };

  if (streamStatus === "unavailable") {
    return (
      <div className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
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
      </div>
    );
  }

  if (streamStatus === "loading") {
    return (
      <div className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-2 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Connecting to camera...</p>
            <p className="text-xs text-muted-foreground mt-1">{cameraIp}:{cameraPort}</p>
          </div>
        </div>
      </div>
    );
  }

  if (streamStatus === "error") {
    return (
      <div className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-md p-4">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
            <p className="text-sm font-semibold text-white mb-1">Camera Stream Setup Required</p>
            <p className="text-xs text-muted-foreground mb-3">{errorMessage}</p>
            <Card className="bg-muted/10">
              <CardContent className="p-3 text-left">
                <p className="text-xs font-semibold text-white mb-2">Configuration:</p>
                <div className="space-y-1 text-xs text-muted-foreground font-mono">
                  <p>IP: {cameraIp}</p>
                  <p>Port: {cameraPort}</p>
                  <p>Path: {cameraStreamPath}</p>
                  <p>Auth: {cameraUsername ? "✓ Configured" : "✗ Not configured"}</p>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-3">
              Set up a media server like <strong>mediamtx</strong>, <strong>RTSPtoWeb</strong>, or <strong>go2rtc</strong> to stream RTSP/ONVIF cameras to the browser.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
        onError={handleVideoError}
        onPlay={handleVideoPlay}
      />
      {streamStatus === "playing" && (
        <div className="absolute top-2 right-2">
          <Badge variant="destructive" className="bg-red-600">
            <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
            LIVE
          </Badge>
        </div>
      )}
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
