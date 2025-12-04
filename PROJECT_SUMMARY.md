# 🎉 Bosch Alert Hub - Complete!

## What We Built

A complete **SIA DC-09 Message Monitoring System** with:

### ✅ Core Features
- **Real-time alert monitoring** using Convex real-time subscriptions
- **TCP/UDP server** to receive SIA messages on port 4000
- **SIA DC-09 parser** with support for 30+ event codes
- **Dark/Light theme toggle** with persistent preference
- **Alerts table** with pagination and real-time updates
- **CSV export** functionality
- **Statistics dashboard** showing total alerts, last hour activity, and unique accounts
- **Automatic ACK responses** for received SIA messages

### 🛠️ Technology Stack
- **Frontend**: React 19 + Vite + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Convex (real-time database)
- **Server**: Node.js (TCP/UDP receiver)

## 📁 Project Structure

```
BoschAlertHub/
├── convex/
│   ├── schema.ts              # Database schema
│   ├── alerts.ts              # Queries & mutations
│   └── _generated/            # Auto-generated types
├── server/
│   └── siaReceiver.ts         # TCP/UDP server
├── src/
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── table.tsx
│   │   │   ├── card.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── input.tsx
│   │   │   └── dropdown-menu.tsx
│   │   ├── alerts-table.tsx   # Main alerts table
│   │   ├── alerts-stats.tsx   # Statistics cards
│   │   ├── theme-provider.tsx # Theme context
│   │   └── theme-toggle.tsx   # Toggle button
│   ├── lib/
│   │   ├── siaParser.ts       # SIA message parser
│   │   └── utils.ts           # Utilities
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── test-sia-messages.sh       # Test script
├── start-all.sh               # Launch all services
├── QUICKSTART.md              # Getting started guide
├── README.md                  # Full documentation
└── package.json
```

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Method 1: Start all services automatically (if supported terminal)
./start-all.sh

# Method 2: Start each service manually in separate terminals

# Terminal 1: Start Convex backend
npm run convex:dev

# Terminal 2: Start web UI
npm run dev

# Terminal 3: Start SIA receiver
npm run server

# Terminal 4: Send test messages
./test-sia-messages.sh
```

## 🌐 Access Points

Once running:
- **Web UI**: http://localhost:5173
- **Convex Dashboard**: http://127.0.0.1:6790
- **SIA Receiver**: TCP/UDP port 4000

## 📊 Features Breakdown

### 1. SIA Message Parser (`src/lib/siaParser.ts`)
- Parses SIA DC-09 format messages
- Extracts: protocol, receiver, timestamp, event code, account, zone, checksum
- Supports 30+ event codes (PA, BA, FA, MA, OP, CL, etc.)
- Validates message format
- Generates ACK responses

### 2. TCP/UDP Server (`server/siaReceiver.ts`)
- Listens on port 4000 for both TCP and UDP
- Parses incoming SIA messages
- Stores alerts in Convex database via HTTP API
- Sends automatic ACK responses
- Error handling with NAK responses

### 3. Convex Backend (`convex/`)
- **Schema**: Structured alert storage with indexes
- **Mutations**: `createAlert` for storing new alerts
- **Queries**: 
  - `getAlerts` - paginated alert retrieval
  - `getAlertsCount` - total count
- **Real-time**: Automatic UI updates when new alerts arrive

### 4. React Frontend (`src/`)
- **AlertsTable**: Paginated table with real-time updates
- **AlertsStats**: Live statistics cards
- **ThemeToggle**: Dark/light mode switcher
- **CSV Export**: Download alerts as CSV

## 🧪 Testing

### Send Test Messages

```bash
# Single message via TCP
echo 'SIA-DCS"0002R1111[#15:35:00,12-03-25|PA923005]F0E3' | nc localhost 4000

# Multiple test messages
./test-sia-messages.sh

# Single message via UDP
echo 'SIA-DCS"0002R1111[#15:35:00,12-03-25|BA823456]A1B2' | nc -u localhost 4000
```

### Example SIA Messages

```
SIA-DCS"0002R1111[#15:35:00,12-03-25|PA923005]F0E3  # Panic Alarm
SIA-DCS"0002R2222[#16:45:12,12-03-25|BA001823456]A1B2  # Burglary Alarm
SIA-DCS"0002R3333[#17:20:30,12-03-25|FA002934567]C3D4  # Fire Alarm
SIA-DCS"0002R4444[#18:10:45,12-03-25|MA003045678]E5F6  # Medical Alarm
SIA-DCS"0002R5555[#19:55:00,12-03-25|OP100156789]G7H8  # Opening
```

## 🎨 Themes

- Default: **Dark theme**
- Toggle in header (top-right)
- Preference saved to localStorage
- Smooth transitions between themes

## 📤 CSV Export

Export includes:
- Received At (timestamp)
- Protocol (SIA-DCS)
- Account Number
- Event Code (PA, BA, etc.)
- Event Description (Panic Alarm, etc.)
- Zone
- Message Timestamp
- Receiver
- Checksum
- Raw Message

## 🔮 Next Steps (Future Enhancements)

### Phase 2 - Authentication
- [ ] Add user authentication
- [ ] Role-based access control
- [ ] Multi-tenant support

### Phase 3 - Advanced Features
- [ ] Alert filtering by event type, account, date
- [ ] Alert search functionality
- [ ] Alert details modal
- [ ] Alert acknowledgment tracking
- [ ] Alert notes/comments

### Phase 4 - Analytics
- [ ] Event type distribution charts
- [ ] Timeline visualization
- [ ] Account activity graphs
- [ ] Custom dashboards

### Phase 5 - Integrations
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Webhook support
- [ ] REST API

## 📝 Configuration

### Changing Ports

Edit `server/siaReceiver.ts`:
```typescript
const TCP_PORT = 4000;  // Change this
const UDP_PORT = 4000;  // And this
```

### Adding Event Codes

Edit `src/lib/siaParser.ts`:
```typescript
const EVENT_CODES: Record<string, string> = {
  // Add your codes
  YourCode: "Your Description",
}
```

### Customizing Theme

Edit `src/index.css` for CSS variables and colors.

## 🐛 Troubleshooting

See `QUICKSTART.md` for common issues and solutions.

## 📚 Documentation

- **QUICKSTART.md**: Step-by-step setup guide
- **README.md**: Complete documentation
- **This file**: Project summary

## ✅ Completion Checklist

- [x] Vite + React + TypeScript setup
- [x] Convex backend with schema
- [x] SIA DC-09 parser with 30+ event codes
- [x] TCP/UDP server for receiving messages
- [x] Real-time alerts table with pagination
- [x] CSV export functionality
- [x] Dark/Light theme toggle
- [x] Statistics dashboard
- [x] ACK response support
- [x] Test scripts
- [x] Documentation
- [x] Quick start guide

## 🎯 Success Metrics

The application is **production-ready** for:
- Receiving SIA messages via TCP/UDP
- Real-time display of security alerts
- Exporting alert data
- Multi-theme support

Ready for:
- Connection to actual SIA-compatible security devices
- Production deployment (with auth in next phase)
- Scaling to handle multiple receivers

---

## 🙏 Thank You!

Your **Bosch Alert Hub** is now complete and ready to use!

**Start the application**: `./start-all.sh`  
**Send test messages**: `./test-sia-messages.sh`  
**View alerts**: http://localhost:5173

Enjoy monitoring your security alerts! 🚨✨
