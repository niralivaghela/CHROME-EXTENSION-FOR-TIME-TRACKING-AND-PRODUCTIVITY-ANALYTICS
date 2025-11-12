class EnterprisePopupManager {
  constructor() {
    this.userId = null;
    this.currentSession = null;
    this.settings = {};
    this.updateInterval = null;
    this.realTimeData = {
      score: 0,
      todayTime: 0,
      sessions: 0,
      streak: 0,
      efficiency: 0
    };
    this.init();
  }

  async init() {
    try {
      await this.loadUserData();
      this.setupEventListeners();
      await this.loadInitialData();
      this.startRealTimeUpdates();
    } catch (error) {
      this.showError('Failed to initialize. Please refresh.');
      console.error('Popup initialization error:', error);
    }
  }

  async loadUserData() {
    // Get user ID and settings
    const [userResult, settingsResult] = await Promise.all([
      chrome.storage.local.get(['userId']),
      chrome.runtime.sendMessage({ action: 'getSettings' })
    ]);
    
    this.userId = userResult.userId || 'default_user';
    this.settings = settingsResult || {};
  }

  setupEventListeners() {
    // Control buttons
    document.getElementById('focusModeBtn').addEventListener('click', () => {
      this.toggleFocusMode();
    });

    document.getElementById('breakBtn').addEventListener('click', () => {
      this.toggleBreakReminders();
    });

    document.getElementById('pomodoroBtn').addEventListener('click', () => {
      this.startPomodoro();
    });

    document.getElementById('deepWorkBtn').addEventListener('click', () => {
      this.toggleDeepWork();
    });

    // Quick actions
    document.getElementById('dashboardBtn').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:3001' });
    });

    document.getElementById('settingsBtn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    document.getElementById('reportsBtn').addEventListener('click', () => {
      this.openReports();
    });
  }

  async loadInitialData() {
    try {
      // Load current session
      this.currentSession = await chrome.runtime.sendMessage({ action: 'getCurrentSession' });
      
      // Load daily stats
      const dailyStats = await chrome.runtime.sendMessage({ action: 'getDailyStats' });
      
      // Load productivity score
      await this.loadProductivityScore();
      
      // Update UI
      this.updateSessionDisplay();
      this.updateMetricsDisplay(dailyStats);
      this.updateControlStates();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showOfflineMode();
    }
  }

  async loadProductivityScore() {
    try {
      const response = await fetch(`http://localhost:3000/api/analytics/score/${this.userId}`);
      if (response.ok) {
        const scoreData = await response.json();
        this.updateScoreDisplay(scoreData);
        this.updateInsights(scoreData);
      } else {
        throw new Error('Backend unavailable');
      }
    } catch (error) {
      this.showOfflineScore();
    }
  }

  updateScoreDisplay(scoreData) {
    const scoreCircle = document.getElementById('scoreCircle');
    const scoreValue = document.getElementById('scoreValue');
    const scoreGrade = document.getElementById('scoreGrade');
    const scoreTitle = document.getElementById('scoreTitle');
    const scoreBreakdown = document.getElementById('scoreBreakdown');

    const score = scoreData.score || 0;
    const grade = scoreData.grade || { grade: 'N/A', description: 'No data' };

    // Update circular progress
    const scoreDeg = (score / 100) * 360;
    scoreCircle.style.setProperty('--score', `${scoreDeg}deg`);
    
    // Update score display
    scoreValue.textContent = score;
    scoreGrade.textContent = grade.grade;
    scoreTitle.textContent = `${grade.description}`;
    
    // Update breakdown
    if (scoreData.breakdown) {
      const breakdown = Object.entries(scoreData.breakdown)
        .map(([key, value]) => `${this.formatScoreKey(key)}: ${Math.round(value)}%`)
        .join(' • ');
      scoreBreakdown.textContent = breakdown;
    } else {
      scoreBreakdown.textContent = 'Start browsing to see detailed metrics';
    }

    // Update score color based on performance
    const color = this.getScoreColor(score);
    scoreValue.style.color = color;
  }

  updateSessionDisplay() {
    const sessionStatus = document.getElementById('sessionStatus');
    const sessionDomain = document.getElementById('sessionDomain');
    const sessionDuration = document.getElementById('sessionDuration');
    const sessionFocus = document.getElementById('sessionFocus');
    const sessionActivity = document.getElementById('sessionActivity');
    const sessionProgress = document.getElementById('sessionProgress');

    if (this.currentSession) {
      const duration = Date.now() - this.currentSession.startTime;
      const minutes = Math.floor(duration / 60000);
      
      // Update session info
      sessionDomain.textContent = this.currentSession.domain || 'Unknown';
      sessionDuration.textContent = this.formatDuration(duration);
      sessionFocus.textContent = `${this.currentSession.focusScore || 100}%`;
      sessionActivity.textContent = `${this.currentSession.activityScore || 100}%`;
      
      // Update status indicator
      sessionStatus.className = 'session-status status-active';
      
      // Update progress bar (25 minutes = 100%)
      const progress = Math.min(100, (minutes / 25) * 100);
      sessionProgress.style.width = `${progress}%`;
      
      // Change progress color based on category
      const colors = {
        'highly_productive': '#00C851',
        'productive': '#4CAF50',
        'neutral': '#FF9800',
        'unproductive': '#F44336',
        'break': '#2196F3'
      };
      sessionProgress.style.background = colors[this.currentSession.category] || '#ec4899';
      
    } else {
      sessionDomain.textContent = 'No active session';
      sessionDuration.textContent = '0m';
      sessionFocus.textContent = '100%';
      sessionActivity.textContent = '--';
      sessionStatus.className = 'session-status status-inactive';
      sessionProgress.style.width = '0%';
    }
  }

  updateMetricsDisplay(dailyStats) {
    if (!dailyStats) {
      // Show default values
      document.getElementById('todayTime').textContent = '0h 0m';
      document.getElementById('sessionsCount').textContent = '0';
      document.getElementById('streakCount').textContent = '0';
      document.getElementById('efficiencyScore').textContent = '0%';
      return;
    }

    document.getElementById('todayTime').textContent = this.formatDuration(dailyStats.totalTime || 0);
    document.getElementById('sessionsCount').textContent = dailyStats.sessions || 0;
    document.getElementById('streakCount').textContent = dailyStats.streak || 0;
    document.getElementById('efficiencyScore').textContent = `${Math.round(dailyStats.efficiency || 0)}%`;
  }

  updateControlStates() {
    // Update button states based on current settings
    const focusBtn = document.getElementById('focusModeBtn');
    const breakBtn = document.getElementById('breakBtn');
    const pomodoroBtn = document.getElementById('pomodoroBtn');
    const deepWorkBtn = document.getElementById('deepWorkBtn');

    // Focus mode
    if (this.settings.focusMode) {
      focusBtn.classList.add('active');
      focusBtn.textContent = '🎯 Focus: ON';
    }

    // Break reminders
    if (this.settings.breakReminders) {
      breakBtn.classList.add('active');
      breakBtn.textContent = '⏰ Breaks: ON';
    }

    // Pomodoro timer
    if (this.settings.pomodoroTimer) {
      pomodoroBtn.classList.add('active');
      pomodoroBtn.textContent = '🍅 Active';
    }

    // Deep work mode
    if (this.settings.deepWorkMode) {
      deepWorkBtn.classList.add('active');
      deepWorkBtn.textContent = '🧠 Deep: ON';
    }
  }

  updateInsights(scoreData) {
    const insightsList = document.getElementById('insightsList');
    insightsList.innerHTML = '';

    const insights = [
      ...(scoreData.insights || []),
      ...(scoreData.recommendations || []).map(rec => ({ 
        type: 'recommendation', 
        message: rec 
      }))
    ];

    if (insights.length === 0) {
      insightsList.innerHTML = `
        <div class="insight-item">
          <span class="insight-icon">🚀</span>
          <span>Start browsing to generate AI-powered insights!</span>
        </div>
      `;
      return;
    }

    insights.slice(0, 3).forEach(insight => {
      const insightDiv = document.createElement('div');
      insightDiv.className = 'insight-item';
      
      const icon = this.getInsightIcon(insight.type);
      insightDiv.innerHTML = `
        <span class="insight-icon">${icon}</span>
        <span>${insight.message}</span>
      `;
      
      insightsList.appendChild(insightDiv);
    });
  }

  async toggleFocusMode() {
    try {
      const isActive = await chrome.runtime.sendMessage({ action: 'toggleFocusMode' });
      const btn = document.getElementById('focusModeBtn');
      
      if (isActive) {
        btn.classList.add('active');
        btn.textContent = '🎯 Focus: ON';
        this.showNotification('Focus mode activated', 'Distracting sites will be blocked');
      } else {
        btn.classList.remove('active');
        btn.textContent = '🎯 Focus Mode';
        this.showNotification('Focus mode deactivated', 'All sites are now accessible');
      }
      
      this.settings.focusMode = isActive;
    } catch (error) {
      this.showError('Failed to toggle focus mode');
    }
  }

  async toggleBreakReminders() {
    try {
      const isActive = !this.settings.breakReminders;
      await chrome.runtime.sendMessage({ 
        action: 'updateSettings', 
        settings: { breakReminders: isActive }
      });
      
      const btn = document.getElementById('breakBtn');
      
      if (isActive) {
        btn.classList.add('active');
        btn.textContent = '⏰ Breaks: ON';
      } else {
        btn.classList.remove('active');
        btn.textContent = '⏰ Breaks';
      }
      
      this.settings.breakReminders = isActive;
    } catch (error) {
      this.showError('Failed to toggle break reminders');
    }
  }

  async startPomodoro() {
    try {
      await chrome.runtime.sendMessage({ action: 'startPomodoro' });
      
      const btn = document.getElementById('pomodoroBtn');
      btn.classList.add('active');
      btn.textContent = '🍅 25:00';
      
      this.showNotification('Pomodoro started', '25 minutes of focused work time');
      
      // Start countdown
      this.startPomodoroCountdown(25 * 60); // 25 minutes
      
    } catch (error) {
      this.showError('Failed to start Pomodoro timer');
    }
  }

  startPomodoroCountdown(seconds) {
    const btn = document.getElementById('pomodoroBtn');
    
    const countdown = setInterval(() => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      btn.textContent = `🍅 ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      
      seconds--;
      
      if (seconds < 0) {
        clearInterval(countdown);
        btn.classList.remove('active');
        btn.textContent = '🍅 Pomodoro';
        this.showNotification('Pomodoro complete!', 'Time for a 5-minute break');
      }
    }, 1000);
  }

  async toggleDeepWork() {
    try {
      const isActive = !this.settings.deepWorkMode;
      await chrome.runtime.sendMessage({ 
        action: 'updateSettings', 
        settings: { deepWorkMode: isActive }
      });
      
      const btn = document.getElementById('deepWorkBtn');
      
      if (isActive) {
        btn.classList.add('active');
        btn.textContent = '🧠 Deep: ON';
        this.showNotification('Deep work mode activated', 'Notifications minimized for maximum focus');
      } else {
        btn.classList.remove('active');
        btn.textContent = '🧠 Deep Work';
      }
      
      this.settings.deepWorkMode = isActive;
    } catch (error) {
      this.showError('Failed to toggle deep work mode');
    }
  }

  openReports() {
    const reportUrl = `http://localhost:3001/reports?userId=${this.userId}`;
    chrome.tabs.create({ url: reportUrl });
  }

  startRealTimeUpdates() {
    this.updateInterval = setInterval(async () => {
      try {
        // Update current session
        this.currentSession = await chrome.runtime.sendMessage({ action: 'getCurrentSession' });
        this.updateSessionDisplay();
        
        // Reload score every 30 seconds
        if (Date.now() % 30000 < 1000) {
          await this.loadProductivityScore();
        }
        
      } catch (error) {
        console.error('Real-time update error:', error);
      }
    }, 1000);
  }

  showOfflineMode() {
    document.getElementById('insightsList').innerHTML = `
      <div class="insight-item">
        <span class="insight-icon">⚠️</span>
        <span>Offline mode - Install Chrome extension and start backend</span>
      </div>
    `;
  }

  showOfflineScore() {
    document.getElementById('scoreValue').textContent = '--';
    document.getElementById('scoreGrade').textContent = 'N/A';
    document.getElementById('scoreBreakdown').textContent = 'Backend offline - showing cached data';
  }

  showNotification(title, message) {
    // Create temporary notification in popup
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #10b981;
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    notification.innerHTML = `<strong>${title}</strong><br>${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    document.body.insertBefore(errorDiv, document.body.firstChild);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  // Utility methods
  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  formatScoreKey(key) {
    return key.replace(/([A-Z])/g, ' $1')
             .replace(/^./, str => str.toUpperCase())
             .replace('Score', '');
  }

  getScoreColor(score) {
    if (score >= 90) return '#00C851';
    if (score >= 80) return '#4CAF50';
    if (score >= 70) return '#FF9800';
    if (score >= 60) return '#FF5722';
    return '#F44336';
  }

  getInsightIcon(type) {
    const icons = {
      'warning': '⚠️',
      'success': '✅',
      'info': 'ℹ️',
      'recommendation': '💡',
      'alert': '🚨',
      'tip': '💭'
    };
    return icons[type] || '💡';
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new EnterprisePopupManager();
});