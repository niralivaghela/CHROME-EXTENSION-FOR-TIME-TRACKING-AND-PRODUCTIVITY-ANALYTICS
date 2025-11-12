# Time Tracker Productivity System

A complete productivity tracking system with Chrome extension, backend API, and dashboard.

## 🚀 Quick Start

1. **Run Setup**: Double-click `FINAL-SETUP.bat`
2. **Install Extension**: Load `chrome-extension` folder in Chrome
3. **Start Tracking**: Visit websites to see data

## 📁 Project Structure

```
time-tracker-productivity/
├── backend/                 # Node.js API server
│   ├── config/db.js        # MongoDB connection
│   ├── models/Activity.js  # Activity data model
│   ├── routes/             # API endpoints
│   └── server.js           # Main server file
├── chrome-extension/       # Browser extension
│   ├── manifest.json       # Extension config
│   ├── background.js       # Background tracking
│   ├── popup.html          # Extension popup
│   └── content.js          # Page interaction
├── dashboard/              # Web dashboard
│   └── dashboard.html      # Analytics dashboard
├── debug-test.html         # Testing interface
└── FINAL-SETUP.bat        # One-click setup
```

## 🔧 Manual Setup

### Backend
```bash
cd backend
npm install
npm start
```

### Database
- Install MongoDB
- Start MongoDB service
- Database `time_tracker` will be created automatically

### Chrome Extension
1. Open Chrome → Extensions → Developer mode
2. Click "Load unpacked"
3. Select `chrome-extension` folder

## 🧪 Testing

Open `debug-test.html` and run:
1. **Check Database** → Should show user ID
2. **Insert Test Data** → Should add sample data  
3. **Check Recent Activity** → Should show the inserted data

## 📊 Features

- **Real-time Tracking**: Automatic website activity monitoring
- **Smart Categorization**: AI-powered productivity scoring
- **Focus Mode**: Block distracting websites
- **Analytics Dashboard**: Visual productivity insights
- **Break Reminders**: Maintain healthy work habits

## 🌐 Endpoints

- `GET /` - API status
- `GET /api/activity/user` - Get user info
- `POST /api/activity/advanced` - Log activity
- `GET /api/activity/recent/:userId` - Get recent activities
- `GET /api/analytics/score/:userId` - Get productivity score

## 🎯 Usage

1. Install and enable the Chrome extension
2. Browse normally - tracking is automatic
3. Check dashboard for productivity insights
4. Use focus mode for distraction-free work

## 📈 Productivity Categories

- **Highly Productive**: GitHub, Stack Overflow, Documentation
- **Productive**: Google Search, Learning platforms
- **Neutral**: Email, File storage
- **Unproductive**: Social media, Entertainment
- **Break**: Music, Relaxation sites

## 🔍 Troubleshooting

- **No data showing**: Check if backend is running on port 3000
- **Extension not working**: Reload extension in Chrome
- **Database errors**: Ensure MongoDB is running
- **CORS issues**: Backend includes CORS headers

## 📝 Requirements

- Node.js 14+
- MongoDB 4.4+
- Chrome Browser
- Windows (for .bat files)

## 🎉 Success Criteria

✅ Backend API running on port 3000  
✅ MongoDB connection established  
✅ Chrome extension tracking activity  
✅ Dashboard showing real-time data  
✅ Debug tests passing  

Ready for submission! 🚀