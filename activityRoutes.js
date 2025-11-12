const express = require('express');
const Activity = require('../models/Activity');
const router = express.Router();

// Enhanced activity logging
router.post('/advanced', async (req, res) => {
  try {
    const activity = new Activity(req.body);
    await activity.save();
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user activities with filters
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, days = 7 } = req.query;
    
    const filter = { userId };
    if (category) filter.category = category;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    filter.createdAt = { $gte: startDate };
    
    const activities = await Activity.find(filter);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent activities for dashboard
router.get('/recent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user info endpoint
router.get('/user', async (req, res) => {
  try {
    res.json({ userId: 'default_user' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy endpoint for basic logging
router.post('/log', async (req, res) => {
  try {
    const { domain, duration } = req.body;
    const userId = 'default_user';
    
    const activity = new Activity({
      userId,
      domain,
      timeSpent: duration * 1000, // Convert to milliseconds
      category: 'neutral'
    });
    
    await activity.save();
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;