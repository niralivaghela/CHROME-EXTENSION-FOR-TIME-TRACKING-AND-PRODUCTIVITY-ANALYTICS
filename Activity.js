const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    required: true
  },
  url: String,
  title: String,
  timeSpent: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['highly_productive', 'productive', 'unproductive', 'neutral', 'break'],
    default: 'neutral'
  },
  subcategory: String,
  isActive: {
    type: Boolean,
    default: true
  },
  focusScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  sessionId: String,
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Activity', activitySchema);