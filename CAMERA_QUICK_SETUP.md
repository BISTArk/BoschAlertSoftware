# Quick Camera Setup Guide

## Your Camera is Already Streaming!

Since your camera is already accessible via a web browser, you just need to configure it in the application.

## Step-by-Step Setup

### 1. Find Your Camera's Stream URL

Open your camera stream in a browser and check the URL format. Common formats:

**HLS Stream (ends with .m3u8):**
```
http://192.168.1.100:8080/stream.m3u8
http://192.168.1.100/hls/stream.m3u8
```

**MJPEG Stream:**
```
http://192.168.1.100:8080/video
http://192.168.1.100/mjpeg
```

**Direct MP4/WebM:**
```
http://192.168.1.100:8080/stream.mp4
http://192.168.1.100/stream
```

### 2. Break Down the URL

From your camera URL, identify these parts:

**Example URL:** `http://192.168.1.100:8080/hls/stream.m3u8`

- **IP Address:** `192.168.1.100`
- **Port:** `8080`
- **Stream Path:** `/hls/stream.m3u8`

### 3. Configure in BoschAlertHub

1. **Login as Admin**
2. **Go to:** Site Map Setup
3. **Select your site**
4. **Click on the area** you want to add the camera to
5. **Scroll to:** "ONVIF Camera Configuration"
6. **Enter the details:**

   ```
   Camera IP Address: 192.168.1.100
   RTSP Port: 8080                    (your actual port)
   Username: [if required]
   Password: [if required]
   Stream Path: /hls/stream.m3u8      (your actual path)
   ```

7. **Click Save**

### 4. View the Camera Feed

1. **Navigate to Alerts** or **Create a test alert** for that area
2. **Open Alert Detail View**
3. **Camera feed should appear** in the right column

## Supported Stream Formats

The updated CameraStream component now supports:

✅ **HLS (.m3u8)** - HTTP Live Streaming
✅ **MP4** - Direct MP4 video files
✅ **WebM** - WebM video format
✅ **MJPEG** - Motion JPEG streams
✅ **Direct HTTP streams** - Any browser-compatible video stream

## Example Configurations

### Example 1: HLS Stream
```
IP: 192.168.1.100
Port: 8080
Path: /stream.m3u8
```

### Example 2: MJPEG Stream
```
IP: 192.168.1.100
Port: 8081
Path: /video
```

### Example 3: With Authentication
```
IP: 192.168.1.100
Port: 80
Username: admin
Password: camera123
Path: /live/stream.m3u8
```

### Example 4: Custom Port and Path
```
IP: 10.0.0.50
Port: 9000
Path: /camera/hls/main.m3u8
```

## Testing Your Stream

### Test in Browser
Before configuring in the app, test your stream URL in a browser:

```
http://192.168.1.100:8080/stream.m3u8
```

If it plays in Chrome/Edge/Safari, it will work in the application!

### Verify Stream is Accessible
1. Open browser
2. Navigate to: `http://[YOUR_CAMERA_IP]:[PORT][PATH]`
3. You should see video playing or download starting
4. If it works → Use these exact values in the configuration

## Common Issues & Solutions

### Issue: "Camera Stream Setup Required" Error

**Solution:** Check the stream URL
```
1. Open browser console (F12)
2. Look for the actual URL being used
3. Copy that URL and test it directly in browser
4. Adjust IP/Port/Path accordingly
```

### Issue: Authentication Required

**Solution:** Add credentials
```
1. Enter Username in the configuration
2. Enter Password in the configuration
3. Save and test again
```

### Issue: CORS Error

**Solution:** Your camera/server needs CORS headers
```
Add these headers to your streaming server:
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

### Issue: Stream Loads but Doesn't Play

**Solution:** Check video format
```
1. Ensure the stream is in a browser-supported format
2. HLS (.m3u8) requires hls.js library (will be auto-loaded)
3. Try changing the stream format on your camera
```

## Optional: Install HLS.js for Better HLS Support

If you're using HLS streams (.m3u8), you can optionally install hls.js for better browser support:

```bash
npm install hls.js
```

Then add to your HTML head or import in main.tsx:

```html
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
```

The component will automatically detect and use it if available!

## Multiple Cameras on Same Area

If you want to display multiple camera views:
- Currently: One camera per area
- Workaround: Create multiple areas pointing to different cameras
- Future: Multi-camera view support coming soon

## Sharing Cameras Across Areas

Multiple areas CAN share the same camera:

**Area 01:**
```
IP: 192.168.1.100
Port: 8080
Path: /stream.m3u8
```

**Area 02:**
```
IP: 192.168.1.100    ← Same camera
Port: 8080
Path: /stream.m3u8
```

Both areas will show the same camera feed!

## Need Help?

**Quick Checklist:**
- ✅ Stream URL works in browser
- ✅ IP, Port, and Path are correct
- ✅ Authentication credentials (if needed)
- ✅ Camera is on same network or accessible
- ✅ No firewall blocking the connection
- ✅ CORS headers enabled (if needed)

**Still not working?**
1. Check browser console (F12) for errors
2. Verify the stream URL in browser first
3. Test without authentication first
4. Check network connectivity to camera IP
