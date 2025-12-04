# 🎯 Deployment Checklist - Bosch Alert Hub

## ✅ Pre-Flight Checklist

Before running the application, verify:

### Dependencies
- [ ] Node.js v18+ installed
- [ ] npm installed
- [ ] netcat (nc) installed (for testing)
- [ ] All npm packages installed (`npm install`)

### File Structure
- [ ] `convex/` directory exists with schema.ts and alerts.ts
- [ ] `server/` directory exists with siaReceiver.ts
- [ ] `src/components/` contains all UI components
- [ ] `src/lib/` contains siaParser.ts and utils.ts
- [ ] `.env.local` exists (created by Convex)

### Scripts Available
- [ ] `npm run dev` - Start Vite dev server
- [ ] `npm run convex:dev` - Start Convex backend
- [ ] `npm run server` - Start SIA receiver
- [ ] `./start-all.sh` - Launch all services
- [ ] `./test-sia-messages.sh` - Send test messages

---

## 🚀 Launch Sequence

### Step 1: Install
```bash
npm install
```
**Expected**: Dependencies installed successfully

### Step 2: Start Convex
```bash
npm run convex:dev
```
**Expected**:
- ✔ Convex backend running at http://127.0.0.1:3210
- ✔ Dashboard accessible at http://127.0.0.1:6790
- ✔ Functions deployed successfully
- ✔ Tables indexed (alerts.by_account, alerts.by_event_code, alerts.by_received_at)

### Step 3: Start Web UI
```bash
npm run dev
```
**Expected**:
- ✔ Vite server running at http://localhost:5173
- ✔ UI accessible in browser
- ✔ Theme toggle works
- ✔ No console errors

### Step 4: Start SIA Receiver
```bash
npm run server
```
**Expected**:
- ✔ TCP server listening on port 4000
- ✔ UDP server listening on port 4000
- ✔ "Waiting for SIA messages..." displayed

### Step 5: Test Messages
```bash
./test-sia-messages.sh
```
**Expected**:
- ✔ 5 messages sent successfully
- ✔ Alerts appear in web UI
- ✔ Statistics update in real-time
- ✔ ACK responses received

---

## 🧪 Testing Checklist

### Functional Tests

#### SIA Message Reception
- [ ] TCP message received and parsed correctly
- [ ] UDP message received and parsed correctly
- [ ] ACK sent back to sender
- [ ] Alert stored in database
- [ ] Alert appears in UI immediately

#### UI Components
- [ ] Alerts table displays correctly
- [ ] Statistics cards show accurate data
- [ ] Pagination works (Previous/Next buttons)
- [ ] CSV export downloads correctly
- [ ] Theme toggle switches between light/dark
- [ ] Theme preference persists on reload

#### Real-time Updates
- [ ] New alerts appear automatically (no refresh needed)
- [ ] Statistics update in real-time
- [ ] Multiple users see same data simultaneously

#### Data Integrity
- [ ] Protocol parsed correctly
- [ ] Account number extracted correctly
- [ ] Event code identified correctly
- [ ] Event description displayed correctly
- [ ] Timestamp formatted properly
- [ ] Zone information captured (if present)

---

## 🔍 Verification Steps

### 1. Check Convex Dashboard
Visit: http://127.0.0.1:6790

Verify:
- [ ] `alerts` table exists
- [ ] Data appears after sending test messages
- [ ] Indexes are active
- [ ] No function errors

### 2. Check Web UI
Visit: http://localhost:5173

Verify:
- [ ] Header displays "Bosch Alert Hub"
- [ ] Theme toggle button visible
- [ ] Statistics cards show numbers
- [ ] Alerts table renders
- [ ] Footer displays port information

### 3. Check Server Logs
In the terminal running `npm run server`:

Verify:
- [ ] "TCP server listening on port 4000"
- [ ] "UDP server listening on port 4000"
- [ ] Messages logged when received
- [ ] ACK sent confirmation
- [ ] No error messages

### 4. Check Browser Console
Open DevTools (F12):

Verify:
- [ ] No JavaScript errors
- [ ] No network errors
- [ ] Convex connection established

---

## 📊 Performance Checklist

- [ ] Page loads in < 2 seconds
- [ ] Alerts appear in < 1 second after sending
- [ ] No lag when switching themes
- [ ] Table pagination is smooth
- [ ] CSV export completes quickly

---

## 🐛 Troubleshooting Guide

### Issue: "Port 4000 already in use"
**Solution**: Change ports in `server/siaReceiver.ts`
```typescript
const TCP_PORT = 3001;
const UDP_PORT = 3001;
```

### Issue: "Cannot find module 'convex'"
**Solution**: Run `npm install`

### Issue: "Convex functions not found"
**Solution**: Run `npx convex dev --once` to regenerate

### Issue: "Theme not working"
**Solution**: 
1. Check localStorage is enabled
2. Clear browser cache
3. Hard reload (Ctrl+Shift+R)

### Issue: "No alerts appearing"
**Solution**:
1. Check all 3 services are running
2. Check Convex logs for errors
3. Verify SIA receiver shows listening
4. Try sending test message again

### Issue: "CSV export empty"
**Solution**: Send at least one alert first

---

## 🎨 Customization Checklist

### Branding
- [ ] Update title in `index.html`
- [ ] Update header text in `App.tsx`
- [ ] Add company logo (optional)

### Ports
- [ ] Configure SIA receiver port
- [ ] Document port changes

### Event Codes
- [ ] Add custom event codes to `siaParser.ts`
- [ ] Update descriptions as needed

### Theme Colors
- [ ] Customize CSS variables in `index.css`
- [ ] Test both light and dark modes

---

## 📦 Production Deployment Checklist

### Pre-Deployment
- [ ] Run `npm run build` successfully
- [ ] Test build locally (`npm run preview`)
- [ ] No TypeScript errors
- [ ] No ESLint warnings

### Convex Setup
- [ ] Create Convex account
- [ ] Run `npx convex deploy`
- [ ] Note production URL
- [ ] Update environment variables

### Frontend Deployment
- [ ] Deploy dist/ folder to hosting
- [ ] Configure environment variables
- [ ] Test production URL
- [ ] Verify real-time updates work

### Backend Deployment
- [ ] Deploy SIA receiver to server
- [ ] Ensure TCP/UDP ports are open
- [ ] Configure firewall rules
- [ ] Test connectivity from security devices

### Security
- [ ] Enable HTTPS
- [ ] Configure CORS (if needed)
- [ ] Set up monitoring
- [ ] Configure backups

---

## ✅ Final Verification

Before considering deployment complete:

- [ ] All services running without errors
- [ ] Test messages processed successfully
- [ ] Real-time updates working
- [ ] CSV export functional
- [ ] Theme toggle working
- [ ] Documentation up to date
- [ ] README.md reflects current setup
- [ ] QUICKSTART.md tested by new user
- [ ] No console errors in production

---

## 📞 Support

If you encounter issues:

1. Check terminal logs for errors
2. Review Convex dashboard
3. Check browser console
4. Refer to QUICKSTART.md
5. Review PROJECT_SUMMARY.md

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ All 3 services start without errors  
✅ Test messages create alerts in UI  
✅ Real-time updates work  
✅ CSV export downloads data  
✅ Theme toggle functions  
✅ No errors in any logs  

**Congratulations! Your Bosch Alert Hub is ready! 🚀**
