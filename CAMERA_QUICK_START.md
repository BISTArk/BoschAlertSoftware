# Quick Start: Camera Setup

## Step 1: Configure Camera in Area Setup

1. Open your application
2. Login as **Admin**
3. Navigate to **Site Map Setup**
4. Select or create a **Site**
5. Click **"Add Area"** or edit an existing area
6. Scroll to **"ONVIF Camera Configuration"** section
7. Fill in:
   - **Camera IP Address**: `192.168.1.100` (your camera's IP)
   - **RTSP Port**: `554` (default, or check your camera)
   - **Username**: Your camera username
   - **Password**: Your camera password
   - **Stream Path**: `/stream1` (or check camera docs)
8. Click **"Create Floor"** or **"Update Floor"**

## Step 2: Test Camera Configuration

1. Create a test alert for the configured area
2. Open the alert in Alert Detail View
3. You should see the camera section showing:
   - Camera IP
   - Configuration status
   - Setup instructions

## Step 3: Set Up Media Server (For Live Streaming)

### Option A: Quick Test with mediamtx

```bash
# Download mediamtx
wget https://github.com/bluenviron/mediamtx/releases/download/v1.5.0/mediamtx_v1.5.0_linux_amd64.tar.gz
tar -xzf mediamtx_v1.5.0_linux_amd64.tar.gz
cd mediamtx_v1.5.0_linux_amd64

# Create config
cat > mediamtx.yml << EOF
webrtc: yes
webrtcAddress: :8889

paths:
  area01:
    source: rtsp://USERNAME:PASSWORD@192.168.1.100:554/stream1
    sourceProtocol: tcp
EOF

# Run it
./mediamtx
```

### Option B: Docker (Recommended for Production)

```bash
docker run --name mediamtx -p 8889:8889 -p 8554:8554 \
  -v $(pwd)/mediamtx.yml:/mediamtx.yml \
  bluenviron/mediamtx:latest
```

## Step 4: Enable WebRTC Streaming (Code Update)

Update `src/components/CameraStream.tsx` around line 37:

Replace the placeholder code in the `useEffect` with:

```typescript
useEffect(() => {
  if (!cameraIp || !videoRef.current) {
    setStreamStatus("unavailable");
    return;
  }

  const streamPath = `area${areaNumber?.padStart(2, '0')}`;
  setStreamStatus("loading");

  const setupWebRTC = async () => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      pc.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
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

      // Send offer to mediamtx
      const response = await fetch(`http://localhost:8889/${streamPath}/whep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const answer = await response.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answer
      });

    } catch (error) {
      console.error("WebRTC error:", error);
      setStreamStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    }
  };

  setupWebRTC();
}, [cameraIp, areaNumber]);
```

## Step 5: Test Live Stream

1. Ensure mediamtx is running
2. Open Alert Detail View for an area with configured camera
3. Camera feed should show "LIVE" badge
4. Video should play automatically

## Troubleshooting

### "Camera Not Configured"
- Go to Site Map Setup → Edit Area → Add camera details

### "Connecting to camera..."
- Check if mediamtx is running: `ps aux | grep mediamtx`
- Check mediamtx logs for errors
- Verify camera RTSP path is correct

### "Camera Stream Setup Required"
- Media server (mediamtx) not running or not configured
- Check if you can reach: `http://localhost:8889`

### Camera credentials wrong
- Test RTSP stream directly:
  ```bash
  ffplay rtsp://USERNAME:PASSWORD@192.168.1.100:554/stream1
  ```
- If this fails, credentials or path are wrong

### Network issues
- Ensure camera and server are on same network or properly routed
- Check firewall settings
- Ping camera IP: `ping 192.168.1.100`

## Production Deployment

1. **Run mediamtx as a service** (see CAMERA_STREAMING_SETUP.md)
2. **Use HTTPS** for the web app
3. **Configure proper STUN/TURN servers** for WebRTC
4. **Use environment variables** for sensitive data
5. **Set up monitoring** for camera connectivity

## Multiple Cameras

To configure multiple cameras:

1. **Add each area** with its camera IP
2. **In mediamtx.yml**, add paths:
   ```yaml
   paths:
     area01:
       source: rtsp://user:pass@192.168.1.100:554/stream1
     area02:
       source: rtsp://user:pass@192.168.1.101:554/stream1
     area03:
       source: rtsp://user:pass@192.168.1.102:554/stream1
   ```

## Shared Camera

If multiple areas share one camera:

1. All areas use the same **Camera IP**
2. Only configure one path in mediamtx
3. Update code to use IP-based path instead of area number

## Need Help?

- See **CAMERA_STREAMING_SETUP.md** for detailed setup
- See **CAMERA_INTEGRATION_SUMMARY.md** for implementation details
- mediamtx docs: https://github.com/bluenviron/mediamtx
