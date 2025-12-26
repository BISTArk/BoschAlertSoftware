# AISAC (AI led Sensor and Controls) - Demo Script

## Introduction (30 seconds)
"Welcome to AISAC (AI-led Sensors and Control) - a real-time security alert management system designed for modern security operations. This platform transforms how security teams monitor, respond to, and manage security alerts across multiple sites."

---

## 1. Dashboard Overview (45 seconds)
**What you see:**
- Real-time statistics: active alerts, response times, guard availability
- Live alerts feed showing incoming events with priority indicators
- Color-coded alerts: Red (critical), Orange (high), Yellow (medium), Blue (low)
- Each alert shows: Account, Area, Zone, Event type, and Time elapsed

**What's happening in the back:**
- SIA DC-09 protocol receiver listening on port 7800
- Incoming alert packets are parsed in real-time
- Auto-assignment system distributes alerts to available guards using round-robin
- Convex database syncs updates across all connected clients instantly

**Security operations benefit:**
- Instant visibility into all active threats
- No alerts fall through the cracks with automatic assignment
- Guards see their assigned alerts immediately

---

## 2. Alert Details & Response (60 seconds)
**What you see:**
- Click any alert to see comprehensive details
- AI-powered risk scoring (e.g., 87/100 risk score)
- Pattern detection: "3 previous incidents this month at this location"
- Risk trend graph showing escalation
- Step-by-step response workflow
- Floor plan view with highlighted sensor location
- Quick action buttons: Lockdown, Dispatch, Investigate

**What's happening in the back:**
- Alert data enriched with historical patterns
- Sensor positions queried from site map database
- Floor plan canvas renders with real-time sensor overlay
- Status updates propagate to all users instantly

**Security operations benefit:**
- Guards make informed decisions with complete context
- Visual floor plans eliminate location confusion
- Coordinated response across the team
- Complete audit trail of all actions taken

---

## 3. Alerts Table & Management (30 seconds)
**What you see:**
- Comprehensive table of all alerts with filters
- Status tracking: Unassigned → Assigned → In-Progress → Resolved
- Quick filters by priority, status, account
- "Assigned To" column shows responsible guard
- CSV export for reporting and compliance

**What's happening in the back:**
- Convex queries with indexed lookups for fast filtering
- Real-time subscriptions keep data fresh
- Status changes logged with timestamps and user IDs

**Security operations benefit:**
- Heads monitor team workload at a glance
- Historical data for performance analysis
- Compliance reporting made easy

---

## 4. Interactive Maps (45 seconds)
**What you see:**
- **Geographic Map View**: All customer locations on an interactive map
- Pulsing circles indicate active alerts at each site
- Click location to see alert summary popup
- **Floor Plan View**: Detailed site layout with sensor positions
- Highlighted sensors show exact alert location
- Canvas-based rendering with image overlay

**What's happening in the back:**
- Location coordinates and floor plans stored in database
- Leaflet library for geographic mapping
- HTML5 Canvas for floor plan rendering
- Sensor positions mapped to zone numbers from SIA protocol

**Security operations benefit:**
- Rapid situational awareness across all sites
- Guards dispatched to precise locations
- Efficient resource allocation based on geography

---

## 5. Site Map Setup (Admin) (30 seconds)
**What you see:**
- Three-tier configuration: Sites → Floors → Sensors
- Add account numbers and area codes
- Upload floor plan images
- Position sensors with pixel coordinates
- All visual, no code required

**What's happening in the back:**
- Sites table stores account-level data
- Floors table links to sites with area numbers
- Sensors table maps zones to floor positions
- Joins use indexed queries for performance

**Security operations benefit:**
- Admins configure new sites in minutes
- No developer needed for site updates
- Self-service management

---

## 6. Guard Availability & Assignment (30 seconds)
**What you see:**
- Guard toggle: Available/Away status
- Available guards receive auto-assignments
- Heads can manually reassign alerts
- Assignment history visible on each alert

**What's happening in the back:**
- Round-robin algorithm distributes alerts fairly
- Only guards marked "available" receive assignments
- Assignment logic in swappable function for easy customization

**Security operations benefit:**
- Balanced workload across team
- Guards control their availability
- Transparent assignment process

---

## 7. Analytics Dashboard (20 seconds)
**What you see:**
- Response time trends
- Alert distribution by priority
- Guard performance metrics
- Peak activity hours

**What's happening in the back:**
- Aggregated queries on alert history
- Calculated metrics: average response time, resolution rate
- Real-time updates as new data comes in

**Security operations benefit:**
- Data-driven staffing decisions
- Identify training needs
- Measure SLA compliance

---

## 8. Role-Based Access (20 seconds)
**What you see:**
- **Guards**: See assigned alerts, update status, take actions
- **Heads**: Assign alerts, view all activity, manage team
- **Admins**: Full system configuration, user management, site setup

**What's happening in the back:**
- Authentication with role-based permissions
- Convex auth context enforces access control
- UI dynamically hides unauthorized features

**Security operations benefit:**
- Proper separation of duties
- Audit-ready permission system
- Secure by default

---

## 9. SIA DC-09 Protocol Integration (30 seconds)
**What you see:**
- Alerts appear within seconds of sensor trigger
- Rich event descriptions (e.g., "Burglary Alarm - Silent", "Fire Alarm - Verified")
- Account, Area, and Zone information parsed automatically

**What's happening in the back:**
- TCP/UDP server on port 7800 receives SIA DC-09 messages
- Format: `[#AccountNumber|ReceiverId/EventCode/ZoneInfo]`
- Parser extracts account, area (from receiver ID), event code, zone
- Event codes mapped to descriptions and priority levels
- Supports both server and client connection modes

**Security operations benefit:**
- Direct integration with existing alarm panels
- No manual data entry
- Industry-standard protocol ensures compatibility

---

## 10. Real-Time Collaboration (20 seconds)
**What you see:**
- Multiple users logged in simultaneously
- Status changes appear instantly for everyone
- Live feed updates without page refresh

**What's happening in the back:**
- Convex WebSocket connections maintain sync
- Optimistic updates for snappy UX
- Conflict resolution handled automatically

**Security operations benefit:**
- Team always on the same page
- No duplicate responses
- Smooth shift handoffs

---

## Closing (20 seconds)
"Bosch Alert Software brings enterprise-grade security operations to any organization. With intelligent auto-assignment, real-time collaboration, interactive mapping, and deep analytics, your security team can respond faster and more effectively to every threat. The system is built on modern technology - React, TypeScript, Convex real-time database, and SIA DC-09 protocol - ensuring reliability, scalability, and easy integration with your existing security infrastructure."

---

## Quick Features Summary
✅ Real-time alert monitoring with SIA DC-09 protocol  
✅ Automatic alert assignment to available guards  
✅ Interactive geographic and floor plan maps  
✅ AI-powered risk scoring and pattern detection  
✅ Complete workflow: Detect → Assign → Respond → Resolve  
✅ Role-based access control (Guard/Head/Admin)  
✅ Visual site configuration - no coding required  
✅ Analytics dashboard for performance insights  
✅ Multi-user real-time collaboration  
✅ Mobile-responsive design  
✅ Complete audit trail and compliance reporting  
✅ Built-in comprehensive documentation  

---

**Total Demo Time: ~6-7 minutes**
