// Simple content script for activity tracking
let activityData = {
  keystrokes: 0,
  mouseMovements: 0,
  scrolls: 0,
  clicks: 0,
  activeTime: 0,
  lastActivity: Date.now()
};

// Track user activity
document.addEventListener('keydown', () => {
  activityData.keystrokes++;
  updateActivity();
});

document.addEventListener('mousemove', () => {
  activityData.mouseMovements++;
  updateActivity();
});

document.addEventListener('scroll', () => {
  activityData.scrolls++;
  updateActivity();
});

document.addEventListener('click', () => {
  activityData.clicks++;
  updateActivity();
});

function updateActivity() {
  const now = Date.now();
  activityData.activeTime += now - activityData.lastActivity;
  activityData.lastActivity = now;
  
  // Send activity data to background script every 10 seconds
  if (activityData.keystrokes % 10 === 0 || activityData.mouseMovements % 50 === 0) {
    try {
      chrome.runtime.sendMessage({
        action: 'activityUpdate',
        data: { ...activityData }
      });
    } catch (error) {
      // Ignore errors if extension context is invalid
    }
  }
}