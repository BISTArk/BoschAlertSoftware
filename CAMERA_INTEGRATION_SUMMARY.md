# Camera Integration Summary

## What Was Implemented

### 1. Database Schema Updates
- **File**: `convex/schema.ts`
- **Changes**: Added camera configuration fields to the `floors` table:
  - `cameraIp`: IP address of the ONVIF camera
  - `cameraPort`: RTSP port (default: 554)
  - `cameraUsername`: Authentication username
  - `cameraPassword`: Authentication password
  - `cameraStreamPath`: RTSP stream path

### 2. Backend Mutations
- **File**: `convex/siteMap.ts`
- **Changes**: 
  - Updated `createFloor` mutation to accept camera configuration
  - Updated `updateFloor` mutation to accept camera configuration
  - Both mutations now store camera details for each area

### 3. Area Setup UI
- **File**: `src/components/SiteMapSetup.tsx`
- **Changes**:
  - Added state variables for camera configuration
  - Added "ONVIF Camera Configuration" section in floor/area dialog
  - Form fields for IP, port, username, password, and stream path
  - Multiple areas can share the same camera IP

### 4. Camera Stream Component
- **File**: `src/components/CameraStream.tsx` (NEW)
- **Features**:
  - Displays camera stream with proper status handling
  - Shows loading, playing, error, or unavailable states
  - Includes debugging information (camera IP, port, auth status)
  - Provides helpful error messages and setup instructions
  - Ready to integrate with media servers (mediamtx, go2rtc, etc.)

### 5. Alert Detail View
- **File**: `src/components/AlertDetailView.tsx`
- **Changes**:
  - Fetches area data using `getFloorByAccountAndArea` query
  - Replaced placeholder camera feed with `CameraStream` component
  - Passes camera configuration from area data to stream component
  - Displays camera IP in the feed description

## How to Use

### Configure a Camera

1. **Login as Admin**
2. **Go to Site Map Setup** (navigation)
3. **Select a Site** (or create one)
4. **Click on an Area** to edit (or add a new area)
5. **Scroll to "ONVIF Camera Configuration"**
6. **Enter camera details**:
   - IP Address: e.g., `192.168.1.100`
   - RTSP Port: e.g., `554`
   - Username: Your camera username
   - Password: Your camera password
   - Stream Path: e.g., `/stream1` (check your camera's documentation)
7. **Save the area**

### View Camera Feed

1. **Navigate to an alert** for an area with a configured camera
2. **Open Alert Detail View**
3. **Camera feed appears** in the right column
4. **Status shows**:
   - "Camera Not Configured" if no IP is set
   - "Connecting to camera..." while loading
   - Setup instructions with configuration details (requires media server)
   - Live feed (when media server is configured)

## Next Steps to Enable Streaming

The camera integration is complete, but you need a **media server** to convert RTSP streams to web-compatible formats.

### Quick Setup with mediamtx (Recommended)

1. **Download mediamtx**:
   ```bash
   wget https://github.com/bluenviron/mediamtx/releases/download/v1.5.0/mediamtx_v1.5.0_linux_amd64.tar.gz
   tar -xzf mediamtx_v1.5.0_linux_amd64.tar.gz
   cd mediamtx_v1.5.0_linux_amd64
   ```

2. **Create configuration file** (`mediamtx.yml`):
   ```yaml
   webrtc: yes
   webrtcAddress: :8889
   
   paths:
     area01:
       source: rtsp://admin:password@192.168.1.100:554/stream1
   ```

3. **Run mediamtx**:
   ```bash
   ./mediamtx
   ```

4. **Update CameraStream.tsx** with WebRTC code (see CAMERA_STREAMING_SETUP.md)

For detailed instructions, see: **[CAMERA_STREAMING_SETUP.md](./CAMERA_STREAMING_SETUP.md)**

## Features

✅ **Per-Area Configuration**: Each area can have its own camera
✅ **Shared Cameras**: Multiple areas can use the same camera IP
✅ **Secure Credentials**: Username/password stored per camera
✅ **Flexible Paths**: Support for different RTSP path formats
✅ **Status Display**: Clear feedback on connection status
✅ **Debugging Info**: Shows camera configuration for troubleshooting
✅ **Responsive UI**: Camera feed adapts to container size
✅ **Live Badge**: Visual indicator when stream is active

## Architecture

```
Alert → Area → Camera Config → Media Server → Browser
        ↓
    Database (floors table)
        ↓
    cameraIp, cameraPort,
    cameraUsername, cameraPassword,
    cameraStreamPath
```

## Files Modified

1. `convex/schema.ts` - Added camera fields to floors table
2. `convex/siteMap.ts` - Updated mutations for camera config
3. `src/components/SiteMapSetup.tsx` - Added camera setup UI
4. `src/components/CameraStream.tsx` - NEW camera display component
5. `src/components/AlertDetailView.tsx` - Integrated camera stream

## Files Created

1. `CAMERA_STREAMING_SETUP.md` - Comprehensive setup guide
2. `CAMERA_INTEGRATION_SUMMARY.md` - This file

## Common Camera RTSP Paths

- **Hikvision**: `/Streaming/Channels/101` or `/h264/ch1/main/av_stream`
- **Dahua**: `/cam/realmonitor?channel=1&subtype=0`
- **Axis**: `/axis-media/media.amp`
- **Generic ONVIF**: `/stream1` or `/onvif1`
- **Bosch**: `/rtsp_tunnel`

Check your camera manufacturer's documentation for the exact path.
