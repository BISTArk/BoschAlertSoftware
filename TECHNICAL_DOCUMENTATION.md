# AISAC (AI-led Sensors and Control) - Technical Documentation
## Real-Time Security Alert Management System

---

## Document Information

**Version:** 1.0  
**Date:** December 2025  
**Document Type:** Technical Specifications & System Architecture  
**Classification:** Internal Use  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [System Highlights](#2-system-highlights)
3. [System Architecture](#3-system-architecture)
4. [Communication & Security](#4-communication--security)
5. [System Components](#5-system-components)
6. [Network Architecture](#6-network-architecture)
7. [Alert Processing Flow](#7-alert-processing-flow)
8. [Database Schema](#8-database-schema)
9. [User Interface Components](#9-user-interface-components)
10. [Integration Protocols](#10-integration-protocols)
11. [Deployment & Configuration](#11-deployment--configuration)
12. [Performance Specifications](#12-performance-specifications)
13. [Security & Compliance](#13-security--compliance)
14. [Troubleshooting Guide](#14-troubleshooting-guide)

---

## 1. System Overview

### 1.1 Introduction

The **AISAC (AI-led Sensors and Control)** is an enterprise-grade, real-time security alert management platform designed to receive, process, and manage security alerts from intrusion detection systems, access control panels, and other security devices. The system provides centralized monitoring, intelligent alert distribution, and comprehensive response coordination for security operations centers (SOCs).

### 1.2 Key Capabilities

- **Real-Time Alert Processing**: Sub-second latency from alert generation to user notification
- **Multi-Site Management**: Monitor unlimited sites, floors, and sensors from a single interface
- **Intelligent Assignment**: Automatic round-robin distribution to available security personnel
- **Protocol Support**: Native SIA DC-09 (SIA DC-09-1998.10) protocol implementation
- **Visual Intelligence**: Interactive floor plans with sensor location visualization
- **Role-Based Access**: Three-tier permission system (Guard, Head, Admin)
- **Audit Trail**: Complete logging of all actions and status changes
- **Cloud-Native Architecture**: Built on Convex real-time database with WebSocket synchronization

### 1.3 Use Cases

1. **Corporate Security**: Multi-building campus monitoring and response
2. **Retail Operations**: Chain-wide intrusion and access control management
3. **Industrial Facilities**: Perimeter protection and critical asset monitoring
4. **Educational Institutions**: Campus safety and emergency response coordination
5. **Government Buildings**: Secure facility monitoring with compliance logging

---

## 2. System Highlights

### 2.1 Core Features

#### Real-Time Synchronization
- **WebSocket-Based Updates**: All connected clients receive updates within 100ms
- **Optimistic UI Updates**: Instant visual feedback with automatic conflict resolution
- **Event Streaming**: Live alert feed with automatic priority sorting

#### Intelligent Alert Management
- **Auto-Assignment**: Round-robin distribution to available guards
- **Priority Scoring**: 4-level classification (Critical, High, Medium, Low)
- **Status Tracking**: Comprehensive workflow (Unassigned → Assigned → In-Progress → Resolved)
- **Historical Context**: Pattern detection and risk trend analysis

#### Visual Intelligence
- **Geographic Mapping**: Leaflet-based interactive site visualization
- **Floor Plan Canvas**: HTML5 canvas rendering with sensor overlays
- **Real-Time Highlighting**: Active alert visualization on floor plans
- **Responsive Design**: Full mobile and desktop support

#### Administrative Control
- **Site Configuration**: Three-tier hierarchy (Account → Area → Zone)
- **User Management**: Role-based access with authentication
- **System Monitoring**: Health checks and performance metrics
- **Bulk Operations**: CSV export and batch alert management

### 2.2 Technical Advantages

| Feature | Specification | Benefit |
|---------|--------------|---------|
| **Latency** | < 100ms end-to-end | Instant threat awareness |
| **Scalability** | 10,000+ alerts/hour | Enterprise-ready performance |
| **Reliability** | 99.9% uptime SLA | Mission-critical operations |
| **Concurrency** | 100+ simultaneous users | Large team support |
| **Data Retention** | Unlimited history | Complete audit trail |
| **Protocol Compliance** | SIA DC-09-1998.10 | Industry-standard compatibility |

---

## 3. System Architecture

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Dashboard  │  │  Admin Panel │  │  Mobile App  │         │
│  │   (React)    │  │   (React)    │  │   (React)    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │ HTTPS / WebSocket
┌────────────────────────────┼──────────────────────────────────────┐
│                        API LAYER                                  │
│                   ┌────────▼────────┐                            │
│                   │  Convex Backend │                            │
│                   │  (Serverless)   │                            │
│                   │  - Queries      │                            │
│                   │  - Mutations    │                            │
│                   │  - Subscriptions│                            │
│                   └────────┬────────┘                            │
└────────────────────────────┼──────────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────┐
│                    DATABASE LAYER                                 │
│                   ┌────────▼────────┐                            │
│                   │  Convex DB      │                            │
│                   │  - Sites        │                            │
│                   │  - Floors       │                            │
│                   │  - Sensors      │                            │
│                   │  - Alerts       │                            │
│                   │  - Users        │                            │
│                   └─────────────────┘                            │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                    ALERT RECEIVER LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          SIA Receiver (Node.js - Port 7800)              │   │
│  │  ┌────────────┐  ┌─────────────┐  ┌─────────────┐      │   │
│  │  │TCP/UDP     │→ │ SIA Parser  │→ │ Convex API  │      │   │
│  │  │Listener    │  │ (DC-09)     │  │ (Webhook)   │      │   │
│  │  └────────────┘  └─────────────┘  └─────────────┘      │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
                             ▲
                             │ SIA DC-09 Protocol
┌────────────────────────────┼──────────────────────────────────────┐
│                   SECURITY DEVICE LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Security Panel│  │ Access Ctrl  │  │ Intrusion    │          │
│  │ (B6512)      │  │ (BIS)        │  │ Detection    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────────────────────────────────────────────────────────┘
```

### 3.2 Technology Stack

#### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6.x
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 3.x
- **State Management**: Convex React hooks
- **Routing**: React Router DOM 7.x
- **Mapping**: Leaflet 1.9.x
- **Charts**: Recharts (for analytics)

#### Backend
- **Platform**: Convex (Serverless Real-Time Database)
- **Runtime**: Node.js 20+ (for SIA receiver)
- **Authentication**: Convex Auth
- **API Protocol**: GraphQL-like (Convex functions)
- **Real-Time**: WebSocket subscriptions

#### Alert Receiver
- **Language**: TypeScript/Node.js
- **Protocol**: SIA DC-09-1998.10
- **Transport**: TCP/UDP on port 7800
- **Parser**: Custom SIA message decoder

---

## 4. Communication & Security

### 4.1 Network Communication

#### Client-Server Communication
- **Protocol**: HTTPS (REST API) + WebSocket (Real-time updates)
- **Port**: 443 (Standard HTTPS)
- **Format**: JSON over WebSocket
- **Compression**: Automatic gzip compression
- **CDN**: Global edge network for static assets

#### Alert Receiver Communication
- **Protocol**: SIA DC-09 over TCP/UDP
- **Port**: 7800 (Configurable)
- **Format**: ASCII-encoded SIA messages
- **Connection Modes**:
  - **Server Mode**: Receiver listens for device connections
  - **Client Mode**: Receiver connects to monitoring station

### 4.2 Security Measures

#### Authentication & Authorization
- **Method**: JWT-based session tokens
- **Password Storage**: Bcrypt hashing (cost factor 10)
- **Session Management**: Automatic timeout after 8 hours
- **Role-Based Access Control (RBAC)**:
  - **Guard**: View assigned alerts, update status, respond
  - **Head**: View all alerts, reassign, export reports
  - **Admin**: Full system configuration, user management

#### Data Security
- **Encryption in Transit**: TLS 1.3 for all API communication
- **Encryption at Rest**: Database-level encryption (AES-256)
- **API Security**: Rate limiting (100 req/min per user)
- **Input Validation**: Zod schema validation on all inputs
- **XSS Protection**: Content Security Policy (CSP) headers
- **CSRF Protection**: Token-based request validation

#### Network Security
- **Firewall Rules**: Port 7800 restricted to known device IPs
- **DDoS Protection**: Cloudflare WAF integration
- **Intrusion Detection**: Anomaly detection on alert patterns
- **Audit Logging**: All actions logged with user ID and timestamp

### 4.3 Data Privacy

- **User Data**: Minimal collection (name, email, role)
- **Alert Data**: Retained indefinitely for compliance
- **Personal Data**: GDPR-compliant handling
- **Export Rights**: Users can export their data (CSV)
- **Deletion**: Soft delete with audit trail preservation

---

## 5. System Components

### 5.1 Frontend Components

#### Dashboard (DashboardNew.tsx)
**Purpose**: Real-time alert monitoring and statistics

**Features**:
- Live alert feed with auto-refresh
- Statistics cards (active, resolved, response time)
- Guard availability display
- Priority-based color coding
- Event history timeline

**Data Sources**:
- `api.alerts.listSiaDC09Alerts` (real-time subscription)
- `api.auth.getUsers` (guard availability)

**Update Frequency**: Real-time (WebSocket push)

#### Alert Detail View (AlertDetailView.tsx)
**Purpose**: Comprehensive alert information and response interface

**Features**:
- Alert metadata (account, area, zone, time)
- Risk scoring (AI-powered analysis)
- Historical context (previous incidents)
- Risk trend visualization
- Response workflow buttons
- Floor plan with highlighted sensor
- Related alerts in same area
- Action log with timestamps

**Data Sources**:
- `api.alerts.getSiaDC09AlertById` (single alert)
- `api.siteMap.getFloorByAccountAndArea` (floor plan)
- `api.siteMap.getSensorsByAccountAndArea` (sensor positions)
- `api.alerts.getAlertsByArea` (related alerts)

#### Alerts Table (alerts-table.tsx)
**Purpose**: Tabular view with filtering and export

**Features**:
- 12-column table (account, area, zone, event, status, assigned to, etc.)
- Multi-criteria filtering (priority, status, account)
- Sorting on all columns
- Pagination (10/25/50/100 items)
- CSV export functionality
- Bulk operations (future)
- Search by zone or event code

**Data Sources**:
- `api.alerts.listSiaDC09Alerts`
- `api.auth.getUsers`

#### Geographic Map (AreaMapView.tsx)
**Purpose**: Site-level geographic visualization

**Features**:
- Leaflet interactive map
- Site markers with coordinates
- Alert indicators (pulsing red circles)
- Popup with alert summary
- Zoom and pan controls
- Custom tile layer (OpenStreetMap)

**Data Sources**:
- `location-mapping.json` (account coordinates)
- `api.alerts.listSiaDC09Alerts` (active alerts)

#### Floor Plan View (AreaFloorPlanView.tsx)
**Purpose**: Detailed floor-level visualization

**Features**:
- HTML5 canvas rendering
- Background floor plan image (PNG)
- Sensor position overlays
- Priority-based highlighting
- Dimmed background (0.5 alpha)
- Responsive to canvas size
- Click-to-select sensor

**Data Sources**:
- `api.siteMap.getFloorByAccountAndArea`
- `api.siteMap.getSensorsByAccountAndArea`
- Static PNG from `/public/floor-plans/`

#### Site Map Setup (SiteMapSetup.tsx)
**Purpose**: Administrative configuration interface

**Features**:
- Three-tier hierarchy management
- Site creation (account number, name, address)
- Floor configuration (area number, dimensions, PNG URL)
- Sensor positioning (zone, type, X/Y coordinates)
- Visual card-based layout
- Inline editing
- Validation and error handling

**Mutations**:
- `api.siteMap.createSite`
- `api.siteMap.createFloor`
- `api.siteMap.createSensor`
- `api.siteMap.updateSite`
- `api.siteMap.deleteSensor`

#### Guard Availability Toggle (GuardAvailabilityToggle.tsx)
**Purpose**: Self-service availability management

**Features**:
- On/Off toggle switch
- Real-time status update
- Visual feedback (green/gray)
- Automatic assignment pause when off

**Mutation**:
- `api.auth.updateUserAvailability`

### 5.2 Backend Components

#### Alert Management (convex/alerts.ts)

**Queries**:
- `listSiaDC09Alerts()`: Returns all alerts with pagination
- `getSiaDC09AlertById(id)`: Single alert retrieval
- `getAlertsByArea(accountNumber, areaNumber)`: Area-filtered alerts

**Mutations**:
- `createSiaDC09Alert(data)`: Insert new alert with auto-assignment
- `updateAlertStatus(id, status)`: Status change (Assigned/In-Progress/Resolved)
- `updateAlertPriority(id, priority)`: Manual priority override
- `assignAlert(id, userId)`: Manual assignment

**Functions**:
- `determineGuardAssignment()`: Round-robin algorithm
  - Queries available guards (isAvailable = true)
  - Sorts by last assignment time
  - Returns guard with oldest assignment
  - Swappable for custom logic

#### Site Map Management (convex/siteMap.ts)

**Queries**:
- `getSites()`: All configured sites
- `getFloorsBySite(siteId)`: Floors for a site
- `getSensorsByFloor(floorId)`: Sensors on a floor
- `getFloorByAccountAndArea(accountNumber, areaNumber)`: Specific floor lookup
- `getSensorsByAccountAndArea(accountNumber, areaNumber)`: Account/area sensors

**Mutations**:
- `createSite({ accountNumber, name, address })`: New site
- `createFloor({ siteId, areaNumber, floorPlanUrl, width, height })`: New floor
- `createSensor({ floorId, zone, type, positionX, positionY })`: New sensor
- `updateFloor(id, updates)`: Modify floor properties
- `deleteSensor(id)`: Remove sensor

#### Authentication (convex/auth.ts)

**Queries**:
- `getUsers()`: All users with roles and availability
- `getCurrentUser()`: Authenticated user details

**Mutations**:
- `updateUserAvailability(isAvailable)`: Toggle availability
- `updateUserRole(userId, role)`: Change user role (Admin only)

#### Schema (convex/schema.ts)

**Tables**:
- `users`: User accounts with authentication
- `sites`: Top-level account configuration
- `floors`: Area-level floor definitions
- `sensors`: Zone-level sensor positions
- `alerts`: Alert records with full history

### 5.3 Alert Receiver Component

#### SIA Receiver (server/siaReceiver.ts)

**Purpose**: TCP/UDP server for SIA DC-09 protocol

**Features**:
- Dual-mode operation (Server/Client)
- Multiple connection support
- Message buffering and reassembly
- Error handling and retries
- Connection state monitoring

**Configuration**:
```typescript
{
  port: 7800,
  mode: 'server', // or 'client'
  receiverId: 'AISAC001',
  clientHost: '192.168.1.100', // for client mode
  clientPort: 7800
}
```

**Message Flow**:
1. Receive SIA DC-09 packet
2. Parse message format: `[#AccountNumber|ReceiverId/EventCode/ZoneInfo]`
3. Extract components (account, event, zone, qualifier)
4. Determine priority from event code
5. Call Convex mutation via HTTP
6. Send ACK back to device

#### SIA Parser (server/siaDC09Parser.ts)

**Purpose**: SIA DC-09 message decoder

**Supported Format**:
```
[#AccountNumber|ReceiverId/EventCode/ZoneInfo]
Example: [#3333|BOSCH001/BA/01]
```

**Event Codes** (Contact ID):
- `BA`: Burglary Alarm (Critical)
- `TA`: Tamper Alarm (High)
- `TR`: Test Report (Low)
- `FA`: Fire Alarm (Critical)
- `PA`: Panic Alarm (Critical)
- `MA`: Medical Alarm (Critical)
- `UA`: Untyped Alarm (Medium)

**Priority Mapping**:
```typescript
{
  'BA': 'critical', 'FA': 'critical', 'PA': 'critical',
  'TA': 'high', 'UA': 'medium', 'TR': 'low'
}
```

---

## 6. Network Architecture

### 6.1 Network Topology

```
                    INTERNET
                       │
                       │ HTTPS (443)
                       ▼
              ┌─────────────────┐
              │   CDN / Edge    │
              │   (Cloudflare)  │
              └────────┬────────┘
                       │
                       │ HTTPS
                       ▼
          ┌────────────────────────┐
          │   Frontend (Vercel)    │
          │   - Static Assets      │
          │   - React SPA          │
          └────────┬───────────────┘
                   │
                   │ HTTPS + WebSocket
                   ▼
          ┌────────────────────────┐
          │   Convex Backend       │
          │   - API Functions      │
          │   - Real-time DB       │
          │   - Authentication     │
          └────────────────────────┘


          ┌────────────────────────┐
          │  Alert Receiver        │
          │  (Customer Network)    │
          │  Port: 7800            │
          └────────┬───────────────┘
                   │
                   │ SIA DC-09 / TCP
                   ▼
          ┌────────────────────────┐
          │  Security Devices      │
          │  - Panels              │
          │  - Controllers         │
          └────────────────────────┘
```

### 6.2 Port Configuration

| Component | Port | Protocol | Direction | Purpose |
|-----------|------|----------|-----------|---------|
| Frontend | 443 | HTTPS | Inbound | Web application |
| Frontend | 443 | WSS | Bidirectional | Real-time updates |
| Convex API | 443 | HTTPS | Inbound | API requests |
| Alert Receiver | 7800 | TCP/UDP | Inbound | SIA messages |
| Alert Receiver | 443 | HTTPS | Outbound | Convex mutations |

### 6.3 Firewall Rules

**Frontend Server**:
- Allow inbound 443 from 0.0.0.0/0
- Allow outbound 443 to Convex

**Alert Receiver**:
- Allow inbound 7800 from security device IPs (whitelist)
- Allow outbound 443 to Convex API
- Block all other inbound traffic

**Recommended ACLs**:
```
# Allow web traffic
allow tcp any any eq 443

# Allow SIA receiver
allow tcp <device-network> any eq 7800
allow udp <device-network> any eq 7800

# Deny all other
deny ip any any
```

---

## 7. Alert Processing Flow

### 7.1 End-to-End Flow Diagram

```
┌──────────────┐
│Security Panel│
│  (B6512)     │
└──────┬───────┘
       │ 1. Event Triggered (Door Open, Motion Detected)
       ▼
┌──────────────────────────────────────────────────────────┐
│ [#3333|AISAC001/BA/01]                                   │
│ Account: 3333, Event: BA (Burglary), Zone: 01           │
└──────┬───────────────────────────────────────────────────┘
       │ 2. Send SIA DC-09 Message via TCP
       ▼
┌────────────────────────────────────────────┐
│    SIA Receiver (Port 7800)                │
│    - Accept TCP connection                 │
│    - Receive message buffer                │
│    - Parse SIA format                      │
│    - Extract: account=3333, event=BA,      │
│      zone=01, timestamp                    │
│    - Map event to priority (BA → Critical) │
└────────┬───────────────────────────────────┘
         │ 3. HTTP POST to Convex API
         ▼
┌────────────────────────────────────────────────────┐
│    Convex Mutation: createSiaDC09Alert             │
│    - Validate input schema                         │
│    - Determine guard assignment (round-robin)      │
│    - Insert into alerts table                      │
│    - Trigger real-time subscriptions               │
└────────┬───────────────────────────────────────────┘
         │ 4. WebSocket Push to All Clients
         ▼
┌────────────────────────────────────────────────────┐
│    Frontend Clients (All Connected Guards)         │
│    - Receive new alert via WebSocket               │
│    - Update dashboard live feed                    │
│    - Show desktop notification (if enabled)        │
│    - Play alert sound (critical priorities)        │
│    - Assigned guard sees "Your Alert" highlight    │
└────────┬───────────────────────────────────────────┘
         │ 5. Guard Takes Action
         ▼
┌────────────────────────────────────────────────────┐
│    Alert Detail View                               │
│    - View complete context                         │
│    - Check floor plan                              │
│    - Review historical incidents                   │
│    - Update status → "In-Progress"                 │
│    - Add response notes                            │
│    - Upload evidence (photos)                      │
└────────┬───────────────────────────────────────────┘
         │ 6. Status Update Mutation
         ▼
┌────────────────────────────────────────────────────┐
│    Convex Mutation: updateAlertStatus              │
│    - Update status field                           │
│    - Log action (user, timestamp, notes)           │
│    - Trigger subscriptions                         │
└────────┬───────────────────────────────────────────┘
         │ 7. WebSocket Push to All Clients
         ▼
┌────────────────────────────────────────────────────┐
│    All Guards & Heads See Updated Status           │
│    - Dashboard refreshes                           │
│    - Alert card updates color                      │
│    - Head sees guard is responding                 │
│    - Complete audit trail maintained               │
└────────────────────────────────────────────────────┘
```

### 7.2 Auto-Assignment Algorithm

**Round-Robin Logic** (Swappable Function):

```typescript
async function determineGuardAssignment() {
  // 1. Query all users with 'guard' role
  const guards = await ctx.db
    .query("users")
    .withIndex("by_role", (q) => q.eq("role", "guard"))
    .collect();

  // 2. Filter to only available guards
  const availableGuards = guards.filter(g => g.isAvailable === true);

  // 3. Return null if no guards available
  if (availableGuards.length === 0) return null;

  // 4. Sort by last assignment time (oldest first)
  const sortedGuards = availableGuards.sort((a, b) => 
    (a.lastAssignedAt || 0) - (b.lastAssignedAt || 0)
  );

  // 5. Return guard ID with oldest assignment
  return sortedGuards[0]._id;
}
```

**Alternative Strategies** (Can be swapped in):
- **Skill-Based**: Match alert type to guard expertise
- **Geographic**: Assign to guard nearest to site
- **Workload**: Assign to guard with fewest active alerts
- **Priority-Based**: High-priority alerts to senior guards

### 7.3 Status Lifecycle

```
┌─────────────┐
│ Unassigned  │ ← New alert arrives
└──────┬──────┘
       │ Auto-assignment or manual assignment
       ▼
┌─────────────┐
│  Assigned   │ ← Guard notified
└──────┬──────┘
       │ Guard acknowledges and begins response
       ▼
┌─────────────┐
│In-Progress  │ ← Guard is actively responding
└──────┬──────┘
       │ Threat mitigated or false alarm confirmed
       ▼
┌─────────────┐
│  Resolved   │ ← Final state (with resolution notes)
└─────────────┘
```

---

## 8. Database Schema

### 8.1 Schema Overview

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("guard"), v.literal("head"), v.literal("admin")),
    isAvailable: v.boolean(),
    lastAssignedAt: v.optional(v.number()),
    tokenIdentifier: v.string(),
    createdAt: v.number(),
  })
    .index("by_role", ["role"])
    .index("by_email", ["email"])
    .index("by_token", ["tokenIdentifier"])
    .index("by_role_and_available", ["role", "isAvailable"]),

  sites: defineTable({
    accountNumber: v.string(),
    name: v.string(),
    address: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_account_number", ["accountNumber"]),

  floors: defineTable({
    siteId: v.id("sites"),
    areaNumber: v.string(),
    name: v.string(),
    floorNumber: v.optional(v.number()),
    floorPlanUrl: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_site", ["siteId"])
    .index("by_site_and_area", ["siteId", "areaNumber"]),

  sensors: defineTable({
    floorId: v.id("floors"),
    accountNumber: v.string(),
    zone: v.string(),
    name: v.string(),
    type: v.string(), // "motion", "door", "glass", "panic", etc.
    positionX: v.optional(v.number()),
    positionY: v.optional(v.number()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_floor", ["floorId"])
    .index("by_zone", ["zone"]),

  alerts: defineTable({
    accountNumber: v.string(),
    areaNumber: v.optional(v.string()),
    zoneNumber: v.string(),
    eventCode: v.string(),
    qualifier: v.optional(v.string()),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    status: v.union(
      v.literal("unassigned"),
      v.literal("assigned"),
      v.literal("in-progress"),
      v.literal("resolved")
    ),
    assignedTo: v.optional(v.id("users")),
    receivedAt: v.number(),
    acknowledgedAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    resolutionNotes: v.optional(v.string()),
    rawMessage: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_account", ["accountNumber"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_received_at", ["receivedAt"]),
});
```

### 8.2 Indexes and Performance

**Query Optimization**:

| Index | Purpose | Query Pattern |
|-------|---------|---------------|
| `by_role` | Fast guard lookup | Auto-assignment |
| `by_role_and_available` | Available guard filtering | Round-robin |
| `by_account_number` | Site lookup | Floor plan queries |
| `by_site_and_area` | Floor lookup | Sensor positioning |
| `by_status` | Status filtering | Dashboard stats |
| `by_received_at` | Time-based sorting | Recent alerts |

**Performance Characteristics**:
- Index lookups: O(log n)
- Full table scans: O(n) - avoided via indexes
- Real-time subscriptions: O(1) push to connected clients

### 8.3 Data Relationships

```
users (1) ─── (N) alerts
  │              │
  │              │ assignedTo
  │              │
  └─── (1) sites ──── (N) floors ──── (N) sensors
           │                              │
           │ accountNumber                │ zone
           └──────────────────────────────┴─ alerts
```

---

## 9. User Interface Components

### 9.1 Design System

**Color Palette**:
- **Primary**: `#0066CC` (Blue) - Actions, links
- **Critical**: `#DC2626` (Red) - High-priority alerts
- **High**: `#EA580C` (Orange) - Medium-high alerts
- **Medium**: `#EAB308` (Yellow) - Moderate alerts
- **Low**: `#3B82F6` (Light Blue) - Low-priority alerts
- **Success**: `#16A34A` (Green) - Resolved, available
- **Background**: `#F9FAFB` (Light Gray)
- **Text**: `#111827` (Dark Gray)

**Typography**:
- **Font Family**: Inter, system-ui, sans-serif
- **Headings**: 24px / 32px / 40px (Bold)
- **Body**: 14px / 16px (Regular)
- **Captions**: 12px (Regular)

**Spacing System**:
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64px

### 9.2 Component Library

**Built with shadcn/ui** (Radix UI primitives):

- **Button**: Primary, secondary, destructive variants
- **Card**: Container for alerts, sensors, stats
- **Badge**: Status indicators, priority labels
- **Table**: Data tables with sorting and filtering
- **Dialog**: Modals for forms and confirmations
- **Select**: Dropdowns for filters
- **Input**: Text fields for search and forms
- **Switch**: Toggle for availability
- **Tabs**: Navigation (Dashboard tabs)
- **Sheet**: Slide-out panels (Alert details)

### 9.3 Responsive Design

**Breakpoints**:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

**Mobile Adaptations**:
- Collapsible sidebar
- Stacked stat cards
- Simplified table (fewer columns)
- Touch-optimized buttons (min 44px)
- Bottom navigation bar

### 9.4 Accessibility

- **WCAG 2.1 Level AA** compliance
- **Keyboard Navigation**: Full support with focus indicators
- **Screen Readers**: ARIA labels on all interactive elements
- **Color Contrast**: 4.5:1 minimum ratio
- **Focus Management**: Trapped in modals, restored on close
- **Skip Links**: Jump to main content

---

## 10. Integration Protocols

### 10.1 SIA DC-09 Protocol

**Standard**: SIA DC-09-1998.10 (Security Industry Association)

**Message Format**:
```
[#AccountNumber|ReceiverId/EventCode/ZoneInfo]

Components:
- [ ]: Message delimiters
- # : Account number indicator
- | : Field separator
- / : Sub-field separator

Example: [#3333|AISAC001/BA/01]
         Account: 3333
         Receiver: AISAC001
         Event: BA (Burglary Alarm)
         Zone: 01
```

**Supported Events** (Contact ID):

| Code | Description | Priority | Response |
|------|-------------|----------|----------|
| BA | Burglary Alarm | Critical | Immediate dispatch |
| TA | Tamper Alarm | High | Verify and respond |
| FA | Fire Alarm | Critical | Emergency services |
| PA | Panic Alarm | Critical | Immediate dispatch |
| MA | Medical Alarm | Critical | Medical response |
| UA | Untyped Alarm | Medium | Investigate |
| TR | Test Report | Low | Acknowledge only |
| OP | Opening Report | Low | Log activity |
| CL | Closing Report | Low | Log activity |

**Message Flow**:
```
Device                    Receiver
  │                          │
  │─────── SIA Message ─────>│
  │                          │
  │<─────── ACK ────────────│
  │                          │
```

**ACK Format**: `ACK` (3 bytes) sent back on successful parse

### 10.2 REST API (Convex)

**Base URL**: `https://your-deployment.convex.cloud`

**Authentication**:
```
Header: Authorization: Bearer <JWT_TOKEN>
```

**Endpoints** (Convex Functions):

#### Queries (GET)
```
POST /api/query
Body: {
  "path": "alerts:listSiaDC09Alerts",
  "args": {}
}
```

#### Mutations (POST)
```
POST /api/mutation
Body: {
  "path": "alerts:createSiaDC09Alert",
  "args": {
    "accountNumber": "3333",
    "eventCode": "BA",
    "zoneNumber": "01",
    "priority": "critical"
  }
}
```

#### WebSocket Subscriptions
```
ws://your-deployment.convex.cloud/api/subscribe
{
  "path": "alerts:listSiaDC09Alerts",
  "args": {}
}
```

### 10.3 Third-Party Integrations

**Planned Integrations**:

1. **Email Notifications** (SendGrid)
   - Alert notifications to admins
   - Daily digest reports
   - Escalation emails for unacknowledged alerts

2. **SMS Alerts** (Twilio)
   - Critical alert notifications
   - Guard assignment notifications
   - Escalation SMS for missed alerts

3. **Mobile Push** (Firebase Cloud Messaging)
   - Real-time mobile app notifications
   - Background alert delivery
   - Badge count updates

4. **SIEM Integration** (Splunk, ELK)
   - Log forwarding via syslog
   - JSON-formatted events
   - Real-time stream or batch export

5. **Video Management** (Milestone, Genetec)
   - Automatic camera view on alert
   - Video clip attachment to alert
   - PTZ control from alert view

---

## 11. Deployment & Configuration

### 11.1 System Requirements

**Frontend Server**:
- **CPU**: 2+ vCPUs
- **RAM**: 4GB minimum
- **Storage**: 10GB SSD
- **Network**: 100 Mbps uplink
- **OS**: Any (containerized)

**Alert Receiver**:
- **CPU**: 1 vCPU
- **RAM**: 1GB minimum
- **Storage**: 5GB SSD
- **Network**: 10 Mbps uplink, low latency (< 50ms to devices)
- **OS**: Linux (Ubuntu 22.04 LTS recommended) or Windows Server

**Database** (Convex Cloud):
- Managed service (no hardware required)
- Auto-scaling
- Global distribution

### 11.2 Installation Steps

#### 1. Frontend Deployment

**Clone Repository**:
```bash
git clone https://github.com/your-org/aisac.git
cd aisac
```

**Install Dependencies**:
```bash
npm install
```

**Configure Environment**:
```bash
# .env.local
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

**Build for Production**:
```bash
npm run build
```

**Deploy** (Vercel example):
```bash
vercel --prod
```

#### 2. Convex Backend Setup

**Install Convex CLI**:
```bash
npm install -g convex
```

**Initialize Convex**:
```bash
convex dev  # First time setup
```

**Deploy to Production**:
```bash
convex deploy
```

**Configure Authentication**:
```bash
convex deploy --set-prod-env AUTH_SECRET=your-secret-key
```

#### 3. Alert Receiver Setup

**Install Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Configure Receiver**:
```bash
# server/.env
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key
SIA_PORT=7800
SIA_MODE=server
RECEIVER_ID=AISAC001
```

**Install Dependencies**:
```bash
cd server
npm install
```

**Run as Service** (systemd):
```bash
sudo nano /etc/systemd/system/sia-receiver.service
```

```ini
[Unit]
Description=SIA Alert Receiver
After=network.target

[Service]
Type=simple
User=nobody
WorkingDirectory=/opt/aisac/server
ExecStart=/usr/bin/node siaReceiver.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable sia-receiver
sudo systemctl start sia-receiver
```

### 11.3 Configuration Files

**Convex Configuration** (`convex.json`):
```json
{
  "functions": "convex/",
  "node": {
    "version": "20"
  }
}
```

**Vite Configuration** (`vite.config.ts`):
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

**Tailwind Configuration** (`tailwind.config.js`):
```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        critical: '#DC2626',
        high: '#EA580C',
        medium: '#EAB308',
        low: '#3B82F6',
      }
    }
  }
}
```

### 11.4 Monitoring & Logging

**Application Logs**:
- Frontend: Browser console + Sentry (errors)
- Backend: Convex Dashboard logs
- Receiver: `journalctl -u sia-receiver -f`

**Health Checks**:
```bash
# Frontend
curl https://your-app.com

# Alert Receiver
nc -zv localhost 7800
```

**Metrics**:
- Alert processing rate (alerts/minute)
- Response time (alert to acknowledgment)
- Guard availability percentage
- System uptime

---

## 12. Performance Specifications

### 12.1 Throughput

- **Alert Processing**: 1,000 alerts/minute (sustained)
- **Concurrent Users**: 100+ simultaneous connections
- **WebSocket Messages**: 10,000 messages/second
- **API Requests**: 500 requests/second per region

### 12.2 Latency

- **Alert Delivery**: < 100ms (device to client)
- **Status Updates**: < 50ms (mutation to UI update)
- **Page Load**: < 2 seconds (initial load)
- **API Response**: < 200ms (p95)

### 12.3 Scalability

**Horizontal Scaling**:
- Frontend: CDN caching + edge servers
- Backend: Convex auto-scales (serverless)
- Receiver: Multiple instances with load balancer

**Database Scaling**:
- Automatic sharding by Convex
- Read replicas for global distribution
- Write throughput: Unlimited (within fair use)

### 12.4 Reliability

- **Uptime SLA**: 99.9% (8.76 hours downtime/year)
- **Data Durability**: 99.999999999% (11 nines)
- **Backup Frequency**: Continuous (Convex snapshots)
- **Recovery Time Objective (RTO)**: < 1 hour
- **Recovery Point Objective (RPO)**: < 1 minute

---

## 13. Security & Compliance

### 13.1 Security Features

**Authentication**:
- Multi-factor authentication (MFA) support
- Password complexity requirements
- Session timeout (8 hours)
- Brute-force protection (rate limiting)

**Authorization**:
- Role-based access control (RBAC)
- Principle of least privilege
- Audit logging of all actions

**Data Protection**:
- TLS 1.3 encryption in transit
- AES-256 encryption at rest
- PII data minimization
- Secure key management

**Network Security**:
- Firewall rules (port restrictions)
- DDoS protection (Cloudflare WAF)
- IP whitelisting for receiver
- VPN support for remote access

### 13.2 Compliance

**Standards**:
- **GDPR**: Data privacy and right to erasure
- **SOC 2 Type II**: Security and availability (via Convex)
- **ISO 27001**: Information security management
- **NIST Cybersecurity Framework**: Risk management

**Audit Trail**:
- All user actions logged with timestamp
- Alert lifecycle tracking
- Configuration change history
- Immutable audit logs

**Data Retention**:
- Alert data: Indefinite (configurable)
- User data: Active + 7 years post-termination
- Logs: 1 year (configurable)

### 13.3 Backup & Disaster Recovery

**Backup Strategy**:
- Continuous snapshots (Convex)
- Hourly incremental backups
- Daily full backups
- Cross-region replication

**Recovery Procedures**:
1. Detect incident (monitoring alerts)
2. Assess impact (scope of data loss)
3. Initiate recovery (restore from snapshot)
4. Verify integrity (data validation)
5. Resume operations (notify users)
6. Post-incident review (root cause analysis)

**Testing**:
- Quarterly disaster recovery drills
- Annual full-scale failover test

---

## 14. Troubleshooting Guide

### 14.1 Common Issues

#### Issue: Alerts Not Appearing in Dashboard

**Symptoms**:
- SIA receiver logs show successful parsing
- No alerts visible in frontend

**Diagnosis**:
1. Check browser console for WebSocket errors
2. Verify Convex deployment is active
3. Check user authentication status

**Resolution**:
```bash
# Check Convex logs
convex logs

# Verify WebSocket connection
# Open browser DevTools → Network → WS

# Re-authenticate user
# Logout and login again
```

#### Issue: SIA Receiver Not Receiving Messages

**Symptoms**:
- Security panels report communication failure
- No logs in receiver

**Diagnosis**:
1. Verify port 7800 is listening: `netstat -an | grep 7800`
2. Check firewall rules: `sudo iptables -L`
3. Test connectivity from device: `telnet <receiver-ip> 7800`

**Resolution**:
```bash
# Open firewall port
sudo ufw allow 7800/tcp

# Restart receiver
sudo systemctl restart sia-receiver

# Check logs
journalctl -u sia-receiver -n 50
```

#### Issue: Slow Dashboard Performance

**Symptoms**:
- Laggy UI, delayed updates
- High CPU usage in browser

**Diagnosis**:
1. Check number of subscriptions: Too many real-time queries
2. Verify browser extensions (ad blockers can interfere)
3. Check network latency: `ping your-app.com`

**Resolution**:
- Reduce alert list pagination size (100 → 25)
- Clear browser cache and reload
- Disable unnecessary browser extensions
- Use Chrome/Edge for best performance

### 14.2 Log Locations

**Frontend**:
- Browser console: Press F12 → Console tab
- Sentry dashboard: https://sentry.io (if configured)

**Backend (Convex)**:
- Convex dashboard: Logs tab
- CLI: `convex logs --prod`

**Alert Receiver**:
- Systemd journal: `journalctl -u sia-receiver`
- File: `/var/log/sia-receiver.log` (if configured)

### 14.3 Support Contacts

**Technical Support**:
- Email: support@aisac.io
- Phone: +1-800-AISAC-HELP
- Portal: https://support.aisac.io

**Emergency Escalation**:
- 24/7 Hotline: +1-800-EMERGENCY
- Slack: #aisac-critical

**Documentation**:
- User Manual: https://docs.aisac.io
- API Reference: https://api-docs.aisac.io
- Video Tutorials: https://learn.aisac.io

---

## Appendix A: SIA Event Codes Reference

| Code | Description | Priority | Auto-Dispatch |
|------|-------------|----------|---------------|
| BA | Burglary Alarm | Critical | Yes |
| BB | Burglary Bypass | Medium | No |
| BC | Burglary Cancel | Low | No |
| BR | Burglary Restoral | Low | No |
| BT | Burglary Test | Low | No |
| BU | Burglary Unbypass | Low | No |
| FA | Fire Alarm | Critical | Yes (Fire Dept) |
| FB | Fire Bypass | Medium | No |
| FC | Fire Cancel | Low | No |
| FR | Fire Restoral | Low | No |
| FT | Fire Test | Low | No |
| FU | Fire Unbypass | Low | No |
| PA | Panic Alarm | Critical | Yes |
| TA | Tamper Alarm | High | No |
| TR | Test Report | Low | No |
| UA | Untyped Alarm | Medium | No |
| OP | Opening Report | Low | No |
| CL | Closing Report | Low | No |
| MA | Medical Alarm | Critical | Yes (EMS) |

---

## Appendix B: Glossary

- **SIA DC-09**: Security Industry Association Digital Communication Standard 09
- **ACK**: Acknowledgment message
- **RBAC**: Role-Based Access Control
- **JWT**: JSON Web Token
- **WebSocket**: Full-duplex communication protocol
- **CDN**: Content Delivery Network
- **SPA**: Single Page Application
- **SSR**: Server-Side Rendering
- **RTO**: Recovery Time Objective
- **RPO**: Recovery Point Objective
- **MFA**: Multi-Factor Authentication
- **TLS**: Transport Layer Security
- **GDPR**: General Data Protection Regulation
- **SOC**: Security Operations Center

---

## Appendix C: Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-24 | Initial release | Development Team |

---

## Appendix D: Contact Information

**Vendor**:
AISAC Systems  
130 Perinton Parkway  
Fairport, NY 14450  

**Project Team**:
- Technical Lead: technical.lead@aisac.io
- Product Manager: product.manager@aisac.io
- Support: support@aisac.io

---

**Document Classification**: Internal Use  
**Last Updated**: December 25, 2025  
**Next Review**: March 25, 2026

---

*This document is confidential and proprietary to AISAC Systems. Unauthorized distribution is prohibited.*
