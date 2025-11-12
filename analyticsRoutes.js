const express = require('express');
const Activity = require('../models/Activity');
const router = express.Router();

// Simplified productivity analytics
router.get('/productivity/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '1d' } = req.query;
    
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const activities = await Activity.find({
      userId,
      createdAt: { $gte: startDate }
    });
    
    const totalTime = activities.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    const productiveTime = activities.filter(a => 
      a.category === 'productive' || a.category === 'highly_productive'
    ).reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    
    const productivityScore = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;
    
    const metrics = {
      totalTime,
      productiveTime,
      unproductiveTime: activities.filter(a => a.category === 'unproductive').reduce((sum, a) => sum + (a.timeSpent || 0), 0),
      sessionsCount: activities.length,
      productivityScore
    };
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Real-time productivity score
router.get('/score/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const activities = await Activity.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    const totalTime = activities.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    const productiveTime = activities.filter(a => 
      a.category === 'productive' || a.category === 'highly_productive'
    ).reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    
    const score = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;
    
    res.json({
      score,
      grade: getPerformanceGrade(score),
      insights: generateSimpleInsights(activities, score)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getPerformanceGrade(score) {
  if (score >= 90) return { grade: 'A+', description: 'Exceptional Performance', color: '#00C851' };
  if (score >= 80) return { grade: 'A', description: 'Excellent Performance', color: '#2E7D32' };
  if (score >= 70) return { grade: 'B', description: 'Good Performance', color: '#FFA000' };
  if (score >= 60) return { grade: 'C', description: 'Average Performance', color: '#FF6F00' };
  if (score >= 50) return { grade: 'D', description: 'Below Average', color: '#E65100' };
  return { grade: 'F', description: 'Needs Improvement', color: '#D32F2F' };
}

function generateSimpleInsights(activities, score) {
  const insights = [];
  
  if (activities.length === 0) {
    insights.push({
      type: 'info',
      message: 'Start browsing to generate insights!'
    });
    return insights;
  }
  
  if (score > 80) {
    insights.push({
      type: 'success',
      message: 'Excellent productivity today!'
    });
  } else if (score < 40) {
    insights.push({
      type: 'warning',
      message: 'Try visiting more productive sites to improve your score'
    });
  }
  
  const recentActivity = activities[activities.length - 1];
  if (recentActivity) {
    insights.push({
      type: 'info',
      message: `Recent activity: ${recentActivity.domain} (${recentActivity.category})`
    });
  }
  
  return insights;
}

module.exports = router;