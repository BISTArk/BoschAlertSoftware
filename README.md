# Bosch Alert Hub

A real-time SIA DC-09 message monitoring system built with Convex, React, Vite, and shadcn/ui.

## Features

### Core Functionality
- 🔄 **Real-time Updates**: Automatic updates when new alerts arrive via Convex
- 🌐 **TCP/UDP Support**: Receives SIA messages over both TCP and UDP protocols
- 🔍 **SIA DC-09 Parser**: Comprehensive parser for SIA protocol messages with 30+ event codes
- ✅ **ACK Support**: Automatic acknowledgment of received messages

### User Interface
- 📊 **Alert Management**: Clean, paginated table displaying all security alerts
- 📤 **CSV Export**: Export current page or all alerts to CSV format
- 🎨 **Dark/Light Theme**: Toggle between dark and light themes
- 🔍 **Advanced Filtering**: Filter by status, event code, account number, with full-text search
- 📱 **Responsive Design**: Works on desktop and mobile devices

### Authentication & Authorization
- 🔐 **Role-Based Access Control**: Three user roles (Guard, Head, Admin)
- 👤 **User Management**: Create and manage user accounts
- 🎯 **Alert Assignment**: Assign alerts to specific guards
- ✅ **Status Tracking**: Track alert lifecycle from unassigned to resolved
- 📝 **Resolution Notes**: Add notes when resolving alerts

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed documentation on the authentication system.

## Setup & Installation

```bash
# Install dependencies
npm install

# Start Convex backend (in one terminal)
npm run convex:dev

# Start the web UI (in another terminal)
npm run dev

# Start the SIA receiver server (in a third terminal)
npm run server
```

## Usage

### First Time Setup

1. **Initialize Database with Users**:
```bash
# Make sure Convex is running
npm run convex:dev

# In another terminal, seed the database with test users
npx convex run seed:default
```

This creates the following test users:
- **admin** / admin123 (Administrator)
- **head1** / head123 (Security Head)
- **guard1** / guard123 (Guard)
- **guard2** / guard123 (Guard)

### Starting the Application

You need to run three processes:

1. **Convex Backend**: `npm run convex:dev`
2. **Web UI**: `npm run dev` (defaults to http://localhost:5173)
3. **SIA Receiver**: `npm run server` (listens on TCP/UDP port 4000)

### Logging In

Navigate to http://localhost:5173 and log in with one of the test accounts above. Your experience will differ based on your role:

- **Guards**: See only alerts assigned to them, can mark as in-progress or resolved
- **Heads**: See all alerts, can assign/reassign to guards, access filtering
- **Admins**: Full access including user management (UI coming soon)

### Sending Test Messages

You can test the system by sending SIA messages to the TCP or UDP server:

#### TCP Test

```bash
# Using netcat (nc)
echo 'SIA-DCS"0002R1111[#15:35:00,12-03-25|PA923005]F0E3' | nc localhost 4000
```

#### UDP Test

```bash
# Using netcat (nc)
echo 'SIA-DCS"0002R1111[#15:35:00,12-03-25|PA923005]F0E3' | nc -u localhost 4000
```

### SIA Message Format

The application parses SIA DC-09 format messages:

```
SIA-DCS"<length><receiver>[<data>]<checksum>
```

**Example**: `SIA-DCS"0002R1111[#15:35:00,12-03-25|PA923005]F0E3`

**Parsed fields**:
- Protocol: `SIA-DCS`
- Message Length: `0002`
- Receiver: `R1111`
- Timestamp: `15:35:00,12-03-25`
- Event Code: `PA` (Panic Alarm)
- Account Number: `923005`
- Checksum: `F0E3`

### Supported Event Codes

The parser recognizes many SIA event codes including:

- **PA**: Panic Alarm
- **BA**: Burglary Alarm
- **FA**: Fire Alarm
- **MA**: Medical Alarm
- **HA**: Hold-up Alarm
- **OP**: Opening
- **CL**: Closing
- **AT**: AC Power Trouble
- And many more...

## Project Structure

```
BoschAlertHub/
├── convex/
│   ├── schema.ts          # Database schema (alerts, users)
│   ├── alerts.ts          # Alert queries and mutations
│   ├── auth.ts            # Authentication queries and mutations
│   ├── seed.ts            # Database seeding script
│   ├── migrations.ts      # Data migration scripts
│   └── _generated/        # Auto-generated Convex files
├── server/
│   └── siaReceiver.ts     # TCP/UDP server for receiving SIA messages
├── src/
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── alerts-table.tsx    # Main alerts table with filtering
│   │   ├── alerts-stats.tsx    # Statistics dashboard
│   │   ├── AlertActions.tsx    # Assign/resolve alert actions
│   │   ├── Login.tsx           # Login component
│   │   ├── theme-provider.tsx  # Theme context provider
│   │   └── theme-toggle.tsx    # Dark/light theme toggle
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication context
│   ├── lib/
│   │   ├── siaParser.ts   # SIA DC-09 message parser
│   │   └── utils.ts       # Utility functions
│   ├── App.tsx            # Main application with auth check
│   ├── main.tsx           # Entry point with providers
│   └── index.css          # Global styles (Tailwind CSS v4)
├── AUTHENTICATION.md      # Detailed auth documentation
├── package.json
└── README.md
```

## Configuration

### Ports

- **Web UI**: 5173 (Vite default)
- **Convex Backend**: 3210 (local development)
- **SIA Receiver**: 4000 (TCP and UDP)

### Environment Variables

The application uses `.env.local` (auto-generated by Convex):

- `VITE_CONVEX_URL`: Convex backend URL
- `CONVEX_DEPLOYMENT`: Convex deployment name

## Themes

The application includes both dark and light themes with a toggle in the header.

- Default theme: Dark
- Toggle button in the top-right corner
- Theme preference is saved to localStorage
