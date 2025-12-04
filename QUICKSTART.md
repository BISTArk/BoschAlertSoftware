# 🚀 Quick Start Guide - Bosch Alert Hub

## Prerequisites

- Node.js (v18 or higher)
- npm
- netcat (for testing)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Convex Backend

Open a terminal and run:

```bash
npm run convex:dev
```

This will:
- Start the Convex local backend on `http://127.0.0.1:3210`
- Open the Convex dashboard at `http://127.0.0.1:6790`
- Create `.env.local` with your Convex URL

Keep this terminal open.

### 3. Start the Web UI

Open a **second terminal** and run:

```bash
npm run dev
```

This will start the Vite development server at `http://localhost:5173`

Open your browser and navigate to: **http://localhost:5173**

Keep this terminal open.

### 4. Start the SIA Receiver Server

Open a **third terminal** and run:

```bash
npm run server
```

This will start the TCP/UDP server listening on port 4000 for SIA messages.

You should see:
```
🚀 Starting SIA Message Receiver Servers...
✓ TCP server listening on port 4000
✓ UDP server listening on port 4000
✓ All servers started successfully
Waiting for SIA messages...
```

Keep this terminal open.

### 5. Test the System

Open a **fourth terminal** and run the test script:

```bash
./test-sia-messages.sh
```

This will send 5 sample SIA messages to the server.

**Or** send a single test message manually:

```bash
echo 'SIA-DCS"0002R1111[#15:35:00,12-03-25|PA923005]F0E3' | nc localhost 4000
```

### 6. View the Alerts

Go back to your browser at `http://localhost:5173` and you should see the alerts appearing in real-time in the table!

## Features to Try

### Theme Toggle
Click the sun/moon icon in the top-right corner to switch between light and dark themes.

### Export Alerts
Click the "Export CSV" button to download all alerts as a CSV file.

### Pagination
Use the "Previous" and "Next" buttons to navigate through pages of alerts.

## Troubleshooting

### Port Already in Use

If port 4000 is already in use, edit `server/siaReceiver.ts` and change:

```typescript
const TCP_PORT = 3001; // Change to any available port
const UDP_PORT = 3001;
```

Then restart the SIA receiver server.

### No Alerts Appearing

1. Check all three processes are running
2. Verify the SIA receiver shows "✓ All servers started successfully"
3. Try sending a test message again
4. Check the Convex dashboard for errors: http://127.0.0.1:6790

### Build Errors

Try clearing node_modules and reinstalling:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

For production deployment:

1. **Deploy Convex**:
   ```bash
   npx convex deploy
   ```

2. **Build Frontend**:
   ```bash
   npm run build
   ```
   
3. **Deploy SIA Server**: Deploy `server/siaReceiver.ts` to a Node.js hosting service that supports TCP/UDP

4. Update environment variables to point to production Convex deployment

## Next Steps

- Add authentication (next phase)
- Add filtering to the alerts table
- Configure your actual SIA-compatible devices to send to port 4000
- Customize event codes in `src/lib/siaParser.ts`
- Add more fields to the schema in `convex/schema.ts`

## Support

For issues, check the terminal outputs for error messages or open a GitHub issue.

---

**Enjoy monitoring your security alerts! 🎉**
