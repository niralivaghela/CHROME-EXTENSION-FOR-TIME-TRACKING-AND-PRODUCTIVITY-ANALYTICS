# 🚀 TIME TRACKER INSTALLATION GUIDE

## PREREQUISITES

### 1. Install MongoDB
```bash
1. Download: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will auto-start on port 27017
```

### 2. Install Node.js
```bash
1. Download: https://nodejs.org/
2. Install LTS version
```

## AUTOMATIC SETUP (RECOMMENDED)

### Run the Final Setup Script
```bash
1. Navigate to project folder
2. Double-click: FINAL-SETUP.bat
3. Wait for everything to start
4. Install Chrome extension (see below)
```

## MANUAL SETUP

### 1. Start MongoDB
```bash
# Windows
mongod --dbpath="C:\data\db"

# Or use MongoDB Compass GUI
```

### 2. Start Backend
```bash
cd backend
npm install
npm start
```

### 3. Open Dashboard
```bash
# Open in browser
dashboard/dashboard.html
```

## CHROME EXTENSION SETUP

### Install Extension
```bash
1. Open Chrome
2. Go to: chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select: chrome-extension folder
6. Extension appears in toolbar
```

## TESTING

### 1. Test Backend
```bash
1. Open: debug-test.html
2. Click "Test Backend" → Should be GREEN ✅
3. Click "Insert Test Data" → Adds sample data
4. Click "Check Recent Activity" → Shows data
```

### 2. Test Extension
```bash
1. Click extension icon in Chrome
2. Visit: github.com (wait 30 seconds)
3. Visit: youtube.com (wait 30 seconds)
4. Check extension popup → Shows activity
5. Check dashboard → Shows updated data
```

## VERIFICATION

### Everything Working If:
- ✅ Backend: http://localhost:3001 shows "OK"
- ✅ Dashboard: Shows pink interface with data
- ✅ Extension: Popup displays metrics
- ✅ MongoDB: Connected and storing data
- ✅ Debug page: All tests green

## TROUBLESHOOTING

### Backend Won't Start
```bash
1. Check MongoDB is running
2. Run: cd backend && npm install
3. Check port 3001 is free
```

### Extension Not Working
```bash
1. Reload extension in chrome://extensions/
2. Check all permissions granted
3. Visit websites and wait 30+ seconds
```

### No Data in Dashboard
```bash
1. Visit websites with extension enabled
2. Wait 30 seconds on each site
3. Click "Refresh Data" in dashboard
4. Use "Test Data" button for sample data
```

## PROJECT STRUCTURE

```
time-tracker-productivity/
├── backend/                 # Node.js + MongoDB
├── chrome-extension/        # Chrome extension
├── dashboard/              # Web dashboard
├── debug-test.html         # Testing tool
├── FINAL-SETUP.bat         # Auto setup
└── README.md              # Documentation
```

## READY FOR SUBMISSION! 🎉

Your complete productivity tracking system with:
- ✅ Chrome extension with real-time tracking
- ✅ MongoDB database with activity storage
- ✅ Node.js backend with REST API
- ✅ Responsive dashboard with analytics
- ✅ Debug tools for testing
- ✅ Complete documentation