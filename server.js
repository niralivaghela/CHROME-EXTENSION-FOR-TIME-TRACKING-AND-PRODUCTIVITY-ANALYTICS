const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require('./config/db');
const activityRoutes = require("./routes/activityRoutes");
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/activity", activityRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Time Tracker API is running!', status: 'OK' });
});

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});