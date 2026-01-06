# ONVIF Camera Streaming Setup Guide

## Overview

The BoschAlertHub system now supports ONVIF camera streaming. Cameras are configured per area, and multiple areas can share the same camera. The system displays live camera feeds in the Alert Detail View when incidents occur.

## Architecture

### Components

1. **Schema** (`convex/schema.ts`)
   - Extended `floors` table with camera configuration fields:
     - `cameraIp`: IP address of the camera
     - `cameraPort`: RTSP port (default: 554)
     - `cameraUsername`: Authentication username
     - `cameraPassword`: Authentication password
     - `cameraStreamPath`: RTSP stream path

2. **Area Setup UI** (`src/components/SiteMapSetup.tsx`)
   - Added camera configuration section in the floor/area setup dialog
   - Supports entering IP, port, credentials, and stream path
   - Multiple areas can use the same camera IP

3. **Camera Stream Component** (`src/components/CameraStream.tsx`)
   - Reusable component that handles camera stream display
   - Shows appropriate status: loading, playing, error, or unavailable
   - Displays camera configuration for debugging

4. **Alert Detail View** (`src/components/AlertDetailView.tsx`)
   - Fetches area data to get camera configuration
   - Displays live camera feed using the CameraStream component

## Camera Configuration

### In the Application

1. **Navigate to Site Map Setup** (Admin only)
2. **Select a Site** and **Add/Edit an Area**
3. **Scroll to "ONVIF Camera Configuration"** section
4. **Enter camera details:**
   - **Camera IP Address**: e.g., `192.168.1.100`
   - **RTSP Port**: e.g., `554` (default)
   - **Username**: Camera authentication username
   - **Password**: Camera authentication password
   - **Stream Path**: RTSP path, e.g., `/stream1`, `/h264/ch1/main/av_stream`

### Common RTSP Stream Paths by Manufacturer

- **Hikvision**: `/Streaming/Channels/101` or `/h264/ch1/main/av_stream`
- **Dahua**: `/cam/realmonitor?channel=1&subtype=0`
- **Axis**: `/axis-media/media.amp`
- **Generic ONVIF**: `/stream1` or `/onvif1`
- **Bosch**: `/rtsp_tunnel`

## Browser Streaming Requirements

**Important**: Browsers cannot directly play RTSP streams. You need a media server to transcode RTSP to a web-compatible format.

### Recommended Solutions

#### Option 1: mediamtx (Recommended - Free & Open Source)

**mediamtx** is a modern, lightweight RTSP server with built-in WebRTC support.

**Installation:**

```powershell
# Download latest release (PowerShell)
Invoke-WebRequest -Uri "https://github.com/bluenviron/mediamtx/releases/download/v1.5.0/mediamtx_v1.5.0_windows_amd64.zip" -OutFile "mediamtx.zip"

# Extract
Expand-Archive -Path mediamtx.zip -DestinationPath mediamtx

# Navigate to folder
cd mediamtx

# Run
.\mediamtx.exe
```

**Alternative: Manual Download**
1. Download from: https://github.com/bluenviron/mediamtx/releases/latest
2. Choose `mediamtx_vX.X.X_windows_amd64.zip`
3. Extract to `C:\mediamtx\`
4. Run `mediamtx.exe`

**Configuration** (`mediamtx.yml`):

```yaml
# Enable WebRTC
webrtc: yes
webrtcAddress: :8889

# Add RTSP proxy for your cameras
paths:
  camera1:
    source: rtsp://admin:password@192.168.1.100:554/stream1
  camera2:
    source: rtsp://admin:password@192.168.1.101:554/stream1
```

**Update CameraStream.tsx to use mediamtx WebRTC:**

```typescript
// In CameraStream.tsx, replace the placeholder code with:
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

pc.addTransceiver('video', { direction: 'recvonly' });
pc.addTransceiver('audio', { direction: 'recvonly' });

pc.ontrack = (event) => {
  video.srcObject = event.streams[0];
  setStreamStatus("playing");
};

const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

// Send offer to mediamtx WebRTC endpoint
const response = await fetch(`http://localhost:8889/camera1/whep`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/sdp',
  },
  body: offer.sdp,
});

const answer = await response.text();
await pc.setRemoteDescription({
  type: 'answer',
  sdp: answer
});
```

#### Option 2: go2rtc (Alternative)

**go2rtc** is another excellent option with WebRTC support.

**Installation:**

```powershell
# Using Docker Desktop for Windows
docker run -p 1984:1984 -p 8554:8554 `
  -v ${PWD}/go2rtc.yaml:/config/go2rtc.yaml `
  alexxit/go2rtc
```

**Or download Windows binary:**
```powershell
# Download
Invoke-WebRequest -Uri "https://github.com/AlexxIT/go2rtc/releases/latest/download/go2rtc_win64.zip" -OutFile "go2rtc.zip"

# Extract and run
Expand-Archive -Path go2rtc.zip -DestinationPath go2rtc
cd go2rtc
.\go2rtc.exe
```

**Configuration** (`go2rtc.yaml`):

```yaml
streams:
  camera1:
    - rtsp://admin:password@192.168.1.100:554/stream1
  cpowershell
# Using Docker Desktop for Windows
docker run --name rtsptoweb -p 8083:8083 `
  -e RTSP_PORT=8554 `
webrtc:
  listen: ":8555"
```

#### Option 3: RTSPtoWeb

**RTSPtoWeb** provides an easy web interface.

```bash
docker run --name rtsptoweb -p 8083:8083 \
  -e RTSP_PORT=8554 \
  ghcr.io/deepch/rtsptoweb:latest
```

Configure cameras through the web UI at `http://localhost:8083`

#### Option 4: HLS Transcoding (nginx-rtmp)

For lower latency requirements, use HLS transcoding with nginx.
for Windows:**

1. Download nginx for Windows: http://nginx.org/en/download.html
2. Extract to `C:\nginx\`
3. Download nginx-rtmp-module (pre-compiled for Windows):
   - https://github.com/illuspas/nginx-rtmp-win32

**Configure nginx** (`C:\nginx\conf\nginx.conf`):

```nginx
rtmp {
    server {
        listen 1935;
        
        application live {
            live on;
            hls on;
            hls_path C:/nginx/temp/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            
            # Pull from RTSP (requires ffmpeg in PATH)
            exec_pull ffmpeg -i rtsp://admin:password@192.168.1.100:554/stream1 
                             -c:v libx264 -preset veryfast -tune zerolatency 
                             -c:a aac -f flv rtmp://localhost/live/camera1;
        }
    }
}

http {
    server {
        listen 8080;
        
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root C:/nginx/temp;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
        }
    }
}
```

**Create temp directory:**
```powershell
New-Item -ItemType Directory -Path "C:\nginx\temp\hls"
```

**Start nginx:**
```powershell
cd C:\nginx
.\nginx.exe   }
}
```

**Update CameraStream.tsx for HLS:**

```typescript
import Hls from 'hls.js';

// In useEffect:
if (Hls.isSupported()) {
  const hls = new Hls();
  const hlsUrl = `http://localhost:8080/hls/camera1.m3u8`;
  hls.loadSource(hlsUrl);
  hls.attachMedia(video);
  
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    video.play();
    setStreamStatus("playing");
  });
  
  hls.on(Hls.Events.ERROR, (event, data) => {
    console.error("HLS error:", data);
    setStreamStatus("error");
  });
  
  rpowershell
# Create directory
New-Item -ItemType Directory -Path "C:\mediamtx" -Force
cd C:\mediamtx

# Download latest release
Invoke-WebRequest -Uri "https://github.com/bluenviron/mediamtx/releases/download/v1.5.0/mediamtx_v1.5.0_windows_amd64.zip" -OutFile "mediamtx.zip"

# Extract
Expand-Archive -Path mediamtx.zip -DestinationPath . -Force
Install HLS.js:
```bash
npm install hls.js
```

## Complete Implementation Example (mediamtx + WebRTC)

### 1. Install mediamtx

```bash
cd ~/mediamtx
wget https://github.com/bluenviron/mediamtx/releases/download/v1.5.0/mediamtx_v1.5.0_linux_amd64.tar.gz
tar -xzf mediamtx_v1.5.0_linux_amd64.tar.gz
```

### 2. Configure mediamtx

Create `mediamtx.yml`:

```yaml
logLevel: info
logDestinations: [stdout]

# HTTP server for API
api: yes
apiAddress: :9997

# WebRTC server
webrtc: yes
webrtcAddress: :8889
webrtcICEServers2: [{urls: ["stun:stun.l.google.com:19302"]}]

# RTSP server
rtspAddress: :8554

# Paths - Configure your cameras here
paths:
  # Example: Bosch camera in Area 01
  area01:
    source: rtsp://admin:bosch123@192.168.1.100:554/stream1
    sourceProtocol: tcp
   powershell
# Run directly
.\mediamtx.exe mediamtx.yml
```

**Or install as a Windows Service:**

Create a batch file `start-mediamtx.bat`:
```batch
@echo off
cd /d C:\mediamtx
mediamtx.exe mediamtx.yml
```

**Install using NSSM (Non-Sucking Service Manager):**

```powershell
# Download NSSM from https://nssm.cc/download
# Or using chocolatey:
choco install nssm

# Install service
nssm install mediamtx "C:\mediamtx\mediamtx.exe" "C:\mediamtx\mediamtx.yml"
nssm set mediamtx AppDirectory "C:\mediamtx"
nssm set mediamtx DisplayName "MediaMTX RTSP Server"
nssm set mediamtx Description "RTSP to WebRTC streaming server"
nssm set mediamtx Start SERVICE_AUTO_START

# Start service
nssm start mediamtx
```

**Or use Windows Task Scheduler:**
1. Open Task Scheduler
2. Create Task → "MediaMTX Server"
3. Trigger: At system startup
4. Action: Start program → `C:\mediamtx\mediamtx.exe`
5. Arguments: `mediamtx.yml`
6. Start in: `C:\mediamtx`
7. Run whether user is logged on or not
8. Configure for: Windows 10/11it]
Description=mediamtx RTSP server
After=network.target

[Service]
Type=simple
User=www-data
ExecStart=/home/user/mediamtx/mediamtx /home/user/mediamtx/mediamtx.yml
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable mediamtx
sudo systemctl start mediamtx
```

### 4. Update CameraStream Component

Replace the placeholder code in `src/components/CameraStream.tsx`:

```typescript
useEffect(() => {
  if (!cameraIp || !videoRef.current) {
    setStreamStatus("unavailable");
    return;
  }

  const video = videoRef.current;
  setStreamStatus("loading");

  // Create path name from camera IP (you can customize this)
  const streamPath = `area${areaNumber?.padStart(2, '0')}`;
  
  // Use mediamtx WebRTC endpoint
  const setupWebRTC = async () => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      pc.ontrack = (event) => {
        if (video) {
          video.srcObject = event.streams[0];
          setStreamStatus("playing");
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          setStreamStatus("error");
          setErrorMessage("Connection failed");
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to mediamtx - adjust URL to your mediamtx server
      const response = await fetch(`http://localhost:8889/${streamPath}/whep`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const answer = await response.text();:
   ```powershell
   Test-NetConnection -ComputerName 192.168.1.100 -Port 554
   ```
3. **Test RTSP stream** manually:
   ```powershell
   # Using VLC Media Player
   # Open VLC → Media → Open Network Stream
   # Enter: rtsp://admin:password@192.168.1.100:554/stream1
   
   # Or using ffplay (if ffmpeg is installed)pe: 'answer',
        sdp: answer
      });

    } catch (error) {
      console.error("WebRTC setup error:", error);
      setStreamStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    }
  };

  setupowershell
   # If running in console, check the console output
   # If running as service with NSSM:
   Get-Content "C:\mediamtx\nssm.log" -Wait
   
   # Or check Windows Event Viewer
   # Event Viewer → Windows Logs → Application
   ```
2. **Verify WebRTC endpoint**:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:8889/area01/whep" -Method GET
   ```
3. **Check browser console** for errors
IIS reverse proxy (with ARR module):**

1. Install IIS URL Rewrite and Application Request Routing (ARR)
2. Configure in `web.config`:

```xml
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyMediaMTX" stopProcessing="true">
          <match url="^rtc/(.*)" />
          <action type="Rewrite" url="http://localhost:8889/{R:1}" />
        </rule>
      </rules>
      <outboundRules>
        <rule name="AddCORS">
          <match serverVariable="RESPONSE_Access-Control-Allow-Origin" pattern=".*" />
          <action type="Rewrite" value="*" />
        </rule>
      </outboundRules>
    </rewrite>
  </system.webServer>
</configuration>
```

**Or use nginx for Windows:**4. **Check Windows Firewall**:
   ```powershell
   # Allow mediamtx through firewall
   New-NetFirewallRule -DisplayName "MediaMTX WebRTC" -Direction Inbound -Protocol TCP -LocalPort 8889 -Action Allow
   New-NetFirewallRule -DisplayName "MediaMTX RTSP" -Direction Inbound -Protocol TCP -LocalPort 8554 -Action Allow
   New-NetFirewallRule -DisplayName "MediaMTX API" -Direction Inbound -Protocol TCP -LocalPort 9997 -Action Allow
   ```a
3. **Open the Alert Detail View**
4. **Verify** the camera stream appears

## Troubleshooting

### Camera Not Showing

1. **Check camera configuration** in Area Setup
2. **Verify camera IP** is reachable from the server
3. **Test RTSP stream** manually:
   ```bash
   ffplay rtsp://admin:password@192.168.1.100:554/stream1
   ```

### Stream Not Playing

1. **Check mediamtx logs**:
   ```bash
   journalctl -u mediamtx -f
   ```
2. **Verify WebRTC endpoint**:
   ```bash
   curl http://localhost:8889/area01/whep
   ```
3. **Check browser console** for errors

### CORS Issues

Add CORS headers to mediamtx or use a reverse proxy:

**Nginx reverse proxy:**

```nginx
location /rtc/ {
    proxy_pass http://localhost:8889/;
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
}
```

## Network Configuration

### Port Forwarding

If cameras are on a different network:

1. **Forward RTSP port** (554) from camera network to mediamtx server
2. **Update mediamtx paths** with correct IPs
3. **Configure firewall** to allow RTSP traffic

### VPN Access

For remote cameras:

1. **Set up VPN** (WireGuard, OpenVPN)
2. **Connect mediamtx server** to camera VPN
3. **Use VPN IPs** in camera configuration

## Security Considerations

1. **Never expose RTSP ports** directly to the internet
2. **Use strong passwords** for camera authentication
3. **Store passwords securely** (consider using environment variables or secrets management)
4. **Use HTTPS** for the web application
5. **Implement authentication** for the media server

## Performance Optimization

1. **Use H.264 encoding** (most efficient for web)
2. **Adjust stream resolution** based on network bandwidth
3. **Enable on-demand streaming** in mediamtx to save resources
4. **Use local caching** for multiple viewers
5. **Consider edge servers** for multi-location deployments

## Future Enhancements

- [ ] PTZ (Pan-Tilt-Zoom) camera controls
- [ ] Video recording and playback
- [ ] Motion detection integration
- [ ] Multi-camera view
- [ ] Picture-in-picture for multiple zones
- [ ] AI-powered video analytics
- [ ] Thumbnail generation for alerts
- [ ] Bandwidth adaptive streaming

## Support

For issues or questions:
- Check mediamtx documentation: https://github.com/bluenviron/mediamtx
- Review ONVIF specifications: https://www.onvif.org/
- Camera manufacturer documentation for RTSP paths
