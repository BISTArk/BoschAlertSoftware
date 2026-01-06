# Camera Streaming Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ONVIF Camera System                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐                  ┌──────────────────┐
│  ONVIF Camera 1  │                  │  ONVIF Camera 2  │
│  192.168.1.100   │                  │  192.168.1.101   │
│                  │                  │                  │
│  RTSP Port: 554  │                  │  RTSP Port: 554  │
│  Path: /stream1  │                  │  Path: /stream1  │
└────────┬─────────┘                  └────────┬─────────┘
         │                                     │
         │ RTSP Stream                         │ RTSP Stream
         │                                     │
         └─────────────┬───────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │   Media Server (mediamtx)   │
         │   - Receives RTSP streams   │
         │   - Converts to WebRTC      │
         │   - Port: 8889 (WebRTC)     │
         │   - Port: 8554 (RTSP)       │
         └──────────────┬──────────────┘
                        │
                        │ WebRTC (WHEP)
                        │
                        ▼
         ┌──────────────────────────────┐
         │   BoschAlertHub Backend      │
         │   (Convex)                   │
         │                              │
         │   Database Schema:           │
         │   ┌────────────────────┐     │
         │   │  floors (areas)    │     │
         │   ├────────────────────┤     │
         │   │ - cameraIp         │     │
         │   │ - cameraPort       │     │
         │   │ - cameraUsername   │     │
         │   │ - cameraPassword   │     │
         │   │ - cameraStreamPath │     │
         │   └────────────────────┘     │
         └──────────────┬───────────────┘
                        │
                        │ Query camera config
                        │
                        ▼
         ┌──────────────────────────────┐
         │   React Frontend             │
         │                              │
         │   Components:                │
         │   ┌────────────────────┐     │
         │   │ SiteMapSetup       │     │
         │   │ (configure camera) │     │
         │   └────────────────────┘     │
         │   ┌────────────────────┐     │
         │   │ CameraStream       │     │
         │   │ (display stream)   │     │
         │   └────────────────────┘     │
         │   ┌────────────────────┐     │
         │   │ AlertDetailView    │     │
         │   │ (shows camera)     │     │
         │   └────────────────────┘     │
         └──────────────┬───────────────┘
                        │
                        │ WebRTC Connection
                        │
                        ▼
              ┌──────────────────┐
              │  User's Browser  │
              │  (Video Display) │
              └──────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                          Data Flow                                  │
└─────────────────────────────────────────────────────────────────────┘

1. Configuration Flow:
   Admin → SiteMapSetup → Convex DB (floors table)
   
2. Streaming Setup:
   ONVIF Camera → RTSP → mediamtx → WebRTC
   
3. View Flow:
   Alert → AlertDetailView → Query floors → CameraStream → WebRTC → Browser


┌─────────────────────────────────────────────────────────────────────┐
│                      Camera Configuration                           │
└─────────────────────────────────────────────────────────────────────┘

Database Record (floors table):
{
  _id: "floor123",
  siteId: "site456",
  areaNumber: "01",
  name: "Ground Floor - Main Entrance",
  cameraIp: "192.168.1.100",          ← Camera IP
  cameraPort: 554,                     ← RTSP Port
  cameraUsername: "admin",             ← Auth Username
  cameraPassword: "secure123",         ← Auth Password
  cameraStreamPath: "/stream1",        ← RTSP Path
  ...
}

Media Server Config (mediamtx.yml):
paths:
  area01:
    source: rtsp://admin:secure123@192.168.1.100:554/stream1
    sourceProtocol: tcp

Frontend Usage:
<CameraStream 
  cameraIp="192.168.1.100"
  cameraPort={554}
  cameraUsername="admin"
  cameraPassword="secure123"
  cameraStreamPath="/stream1"
  accountNumber="3333"
  areaNumber="01"
/>


┌─────────────────────────────────────────────────────────────────────┐
│                    Multi-Camera Scenario                            │
└─────────────────────────────────────────────────────────────────────┘

Scenario 1: One Camera Per Area
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Area 01  │────▶│Camera 1  │     │          │
│          │     │.100      │     │          │
└──────────┘     └──────────┘     │          │
                                  │ mediamtx │
┌──────────┐     ┌──────────┐     │          │
│ Area 02  │────▶│Camera 2  │────▶│          │
│          │     │.101      │     │          │
└──────────┘     └──────────┘     │          │
                                  │          │
┌──────────┐     ┌──────────┐     │          │
│ Area 03  │────▶│Camera 3  │────▶│          │
│          │     │.102      │     └──────────┘
└──────────┘     └──────────┘

Scenario 2: Shared Camera
┌──────────┐
│ Area 01  │─┐
│          │ │
└──────────┘ │   ┌──────────┐     ┌──────────┐
             ├──▶│Camera 1  │────▶│ mediamtx │
┌──────────┐ │   │.100      │     └──────────┘
│ Area 02  │─┤   └──────────┘
│          │ │
└──────────┘ │
             │
┌──────────┐ │
│ Area 03  │─┘
│          │
└──────────┘

All three areas use the same camera IP (192.168.1.100)


┌─────────────────────────────────────────────────────────────────────┐
│                      Network Topology                               │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Local Network (192.168.1.0/24)                            │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │Camera 1  │  │Camera 2  │  │Camera 3  │                 │
│  │.100      │  │.101      │  │.102      │                 │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                 │
│       │             │             │                        │
│       └─────────────┴─────────────┘                        │
│                     │                                      │
│              ┌──────┴──────┐                               │
│              │   Switch    │                               │
│              └──────┬──────┘                               │
│                     │                                      │
│              ┌──────┴──────────┐                           │
│              │ Application     │                           │
│              │ Server (.50)    │                           │
│              │ - mediamtx      │                           │
│              │ - BoschAlertHub │                           │
│              └──────┬──────────┘                           │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        │ Internet
                        │
                ┌───────┴────────┐
                │  User Browsers │
                │  (via HTTPS)   │
                └────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    Technology Stack                                 │
└─────────────────────────────────────────────────────────────────────┘

Camera Layer:
  - ONVIF Cameras
  - RTSP Protocol
  - H.264/H.265 Video Codec

Media Server:
  - mediamtx (recommended)
  - go2rtc (alternative)
  - RTSPtoWeb (alternative)
  - Protocol: WebRTC (WHEP)

Backend:
  - Convex Database
  - TypeScript
  - React Query Integration

Frontend:
  - React Components
  - TypeScript
  - WebRTC API
  - HTML5 Video Element

Communication:
  - RTSP (Camera → Media Server)
  - WebRTC (Media Server → Browser)
  - HTTP/HTTPS (API calls)


┌─────────────────────────────────────────────────────────────────────┐
│                    Security Considerations                          │
└─────────────────────────────────────────────────────────────────────┘

✓ Store camera credentials in encrypted database
✓ Use HTTPS for web application
✓ Configure strong camera passwords
✓ Implement authentication for media server
✓ Use private network for cameras (VLAN)
✓ Firewall rules to restrict camera access
✓ Regular security updates
✓ Audit logs for camera access
✓ VPN for remote camera access
