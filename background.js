class EnterpriseTimeTracker {
  constructor() {
    this.currentSession = null;
    this.settings = {
      focusMode: false,
      breakReminders: true,
      deepWorkMode: false,
      pomodoroTimer: false,
      blockDistractions: false,
      trackMouseMovement: true,
      trackKeystrokes: true,
      idleThreshold: 300000, // 5 minutes
      breakInterval: 3000000, // 50 minutes
      pomodoroLength: 1500000 // 25 minutes
    };
    this.analytics = {
      dailyGoal: 8 * 60 * 60 * 1000, // 8 hours
      weeklyGoal: 40 * 60 * 60 * 1000, // 40 hours
      focusThreshold: 70,
      productivityTarget: 80
    };
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.setupAlarms();
    this.startPerformanceMonitoring();
    console.log('🚀 ProTracker Enterprise initialized');
  }

  setupEventListeners() {
    // Tab management
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabChange(activeInfo.tabId);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        this.handleTabChange(tabId);
      }
    });

    chrome.webNavigation.onCompleted.addListener((details) => {
      if (details.frameId === 0) {
        this.trackNavigation(details);
      }
    });

    // Window focus management
    chrome.windows.onFocusChanged.addListener((windowId) => {
      this.handleWindowFocus(windowId);
    });

    // Idle detection
    chrome.idle.onStateChanged.addListener((state) => {
      this.handleIdleState(state);
    });

    // Alarm handling
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });

    // Message handling
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
  }

  setupAlarms() {
    // Break reminder alarm
    chrome.alarms.create('breakReminder', {
      delayInMinutes: 50,
      periodInMinutes: 50
    });

    // Daily summary alarm
    chrome.alarms.create('dailySummary', {
      when: Date.now() + (24 * 60 * 60 * 1000),
      periodInMinutes: 24 * 60
    });

    // Performance check alarm
    chrome.alarms.create('performanceCheck', {
      delayInMinutes: 15,
      periodInMinutes: 15
    });
  }

  async handleTabChange(tabId) {
    await this.endCurrentSession();
    
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab && tab.url && !this.isSystemUrl(tab.url)) {
        await this.startNewSession(tab);
      }
    } catch (error) {
      console.log('Tab access error:', error);
    }
  }

  async startNewSession(tab) {
    const sessionData = {
      sessionId: this.generateSessionId(),
      tabId: tab.id,
      url: tab.url,
      domain: this.extractDomain(tab.url),
      title: tab.title || 'Unknown',
      startTime: Date.now(),
      category: await this.categorizeWebsite(tab.url),
      focusScore: 100,
      activityScore: 100,
      distractions: 0,
      keystrokes: 0,
      mouseMovements: 0,
      scrolls: 0,
      clicks: 0,
      timeSpentActive: 0,
      timeSpentIdle: 0
    };

    this.currentSession = sessionData;
    
    // Apply focus mode restrictions
    if (this.settings.focusMode) {
      await this.applyFocusMode(sessionData);
    }

    // Start activity monitoring
    this.startActivityMonitoring(tab.id);
    
    // Update badge
    this.updateBadge(sessionData.category);
    
    console.log('📊 New session started:', sessionData.domain);
  }

  async endCurrentSession() {
    if (!this.currentSession) return;

    const session = this.currentSession;
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    
    // Calculate final scores
    session.finalFocusScore = this.calculateFinalFocusScore(session);
    session.productivityScore = this.calculateProductivityScore(session);
    
    // Save session data
    await this.saveSessionData(session);
    
    // Send to backend
    await this.syncWithBackend(session);
    
    this.currentSession = null;
    console.log('💾 Session ended:', session.domain, this.formatDuration(session.duration));
  }

  async categorizeWebsite(url) {
    const domain = this.extractDomain(url);
    
    // Advanced categorization with AI-like logic
    const categories = await this.getCategories();
    
    // Check custom user categories first
    const customCategory = await this.getCustomCategory(domain);
    if (customCategory) return customCategory;
    
    // Machine learning-like categorization
    for (const [category, patterns] of Object.entries(categories)) {
      for (const pattern of patterns) {
        if (this.matchesPattern(domain, url, pattern)) {
          return category;
        }
      }
    }
    
    // Fallback to content analysis
    return await this.analyzePageContent(url);
  }

  async getCategories() {
    return {
      'highly_productive': [
        { domains: ['github.com', 'gitlab.com', 'bitbucket.org'], weight: 1.0 },
        { domains: ['stackoverflow.com', 'stackexchange.com'], weight: 0.95 },
        { domains: ['developer.mozilla.org', 'w3schools.com'], weight: 0.9 },
        { keywords: ['documentation', 'api', 'tutorial', 'learn'], weight: 0.85 }
      ],
      'productive': [
        { domains: ['google.com/search', 'bing.com', 'duckduckgo.com'], weight: 0.8 },
        { domains: ['medium.com', 'dev.to', 'hashnode.com'], weight: 0.75 },
        { domains: ['coursera.org', 'udemy.com', 'edx.org'], weight: 0.9 },
        { keywords: ['work', 'project', 'task', 'productivity'], weight: 0.7 }
      ],
      'neutral': [
        { domains: ['gmail.com', 'outlook.com', 'slack.com'], weight: 0.6 },
        { domains: ['drive.google.com', 'dropbox.com', 'onedrive.com'], weight: 0.65 },
        { keywords: ['news', 'weather', 'maps'], weight: 0.5 }
      ],
      'unproductive': [
        { domains: ['facebook.com', 'twitter.com', 'instagram.com'], weight: 0.2 },
        { domains: ['youtube.com', 'netflix.com', 'twitch.tv'], weight: 0.1 },
        { domains: ['reddit.com', 'pinterest.com', 'tiktok.com'], weight: 0.15 },
        { keywords: ['game', 'entertainment', 'meme', 'funny'], weight: 0.25 }
      ],
      'break': [
        { domains: ['spotify.com', 'music.apple.com', 'soundcloud.com'], weight: 0.4 },
        { keywords: ['meditation', 'relaxation', 'break'], weight: 0.6 }
      ]
    };
  }

  matchesPattern(domain, url, pattern) {
    if (pattern.domains) {
      return pattern.domains.some(d => domain.includes(d));
    }
    if (pattern.keywords) {
      const text = (domain + ' ' + url).toLowerCase();
      return pattern.keywords.some(k => text.includes(k));
    }
    return false;
  }

  async analyzePageContent(url) {
    // Simplified content analysis based on URL structure
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('learn') || urlLower.includes('tutorial') || urlLower.includes('doc')) {
      return 'productive';
    }
    if (urlLower.includes('game') || urlLower.includes('fun') || urlLower.includes('entertainment')) {
      return 'unproductive';
    }
    
    return 'neutral';
  }

  startActivityMonitoring(tabId) {
    if (!this.settings.trackMouseMovement && !this.settings.trackKeystrokes) return;
    
    // Inject activity monitoring script
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }).catch(() => {
      // Ignore injection errors for system pages
    });
  }

  async applyFocusMode(session) {
    if (session.category === 'unproductive' && this.settings.blockDistractions) {
      // Block unproductive sites in focus mode
      await this.showFocusAlert(session);
      return;
    }
    
    if (session.category === 'highly_productive') {
      // Enhance productive sessions
      await this.enableDeepWorkMode(session);
    }
  }

  async showFocusAlert(session) {
    chrome.notifications.create(`focus_alert_${session.sessionId}`, {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '🎯 Focus Mode Active',
      message: `You're visiting ${session.domain} during focus time. Stay on track!`,
      buttons: [
        { title: 'Block Site' },
        { title: 'Allow Once' }
      ]
    });
  }

  async enableDeepWorkMode(session) {
    if (this.settings.deepWorkMode) {
      // Disable notifications for other apps
      chrome.notifications.create(`deep_work_${session.sessionId}`, {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '🧠 Deep Work Mode',
        message: `Entering deep work on ${session.domain}. Notifications minimized.`
      });
    }
  }

  handleWindowFocus(windowId) {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      // Browser lost focus
      if (this.currentSession) {
        this.currentSession.lastBlurTime = Date.now();
      }
    } else {
      // Browser gained focus
      if (this.currentSession && this.currentSession.lastBlurTime) {
        const blurDuration = Date.now() - this.currentSession.lastBlurTime;
        this.currentSession.timeSpentIdle += blurDuration;
        delete this.currentSession.lastBlurTime;
      }
    }
  }

  handleIdleState(state) {
    if (!this.currentSession) return;
    
    const now = Date.now();
    
    if (state === 'idle' || state === 'locked') {
      this.currentSession.idleStartTime = now;
      this.currentSession.focusScore = Math.max(0, this.currentSession.focusScore - 10);
    } else if (state === 'active' && this.currentSession.idleStartTime) {
      const idleDuration = now - this.currentSession.idleStartTime;
      this.currentSession.timeSpentIdle += idleDuration;
      delete this.currentSession.idleStartTime;
    }
  }

  handleAlarm(alarm) {
    switch (alarm.name) {
      case 'breakReminder':
        this.showBreakReminder();
        break;
      case 'dailySummary':
        this.generateDailySummary();
        break;
      case 'performanceCheck':
        this.performanceCheck();
        break;
    }
  }

  async showBreakReminder() {
    if (!this.settings.breakReminders || !this.currentSession) return;
    
    const sessionDuration = Date.now() - this.currentSession.startTime;
    if (sessionDuration > this.settings.breakInterval) {
      chrome.notifications.create('break_reminder', {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '⏰ Time for a Break!',
        message: 'You\'ve been working for 50 minutes. Take a 10-15 minute break to maintain productivity.',
        buttons: [
          { title: 'Take Break' },
          { title: 'Remind Later' }
        ]
      });
    }
  }

  async generateDailySummary() {
    const today = new Date().toDateString();
    const sessions = await this.getSessionsForDate(today);
    
    const summary = this.calculateDailySummary(sessions);
    
    chrome.notifications.create('daily_summary', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '📊 Daily Productivity Summary',
      message: `Productive: ${this.formatDuration(summary.productiveTime)} | Score: ${summary.averageScore}% | Sessions: ${summary.sessionCount}`
    });
  }

  performanceCheck() {
    if (!this.currentSession) return;
    
    const sessionDuration = Date.now() - this.currentSession.startTime;
    const focusScore = this.currentSession.focusScore;
    
    // Adaptive focus scoring
    if (sessionDuration > 1800000 && focusScore > 80) { // 30 minutes of high focus
      this.currentSession.focusScore = Math.min(100, focusScore + 5);
    }
    
    // Update real-time analytics
    this.updateRealTimeAnalytics();
  }

  calculateFinalFocusScore(session) {
    let score = session.focusScore;
    
    // Adjust based on activity metrics
    const activityRatio = session.timeSpentActive / (session.timeSpentActive + session.timeSpentIdle);
    score *= activityRatio;
    
    // Adjust based on session length
    const optimalLength = 25 * 60 * 1000; // 25 minutes
    const lengthFactor = Math.min(1, session.duration / optimalLength);
    score *= (0.5 + 0.5 * lengthFactor);
    
    // Adjust based on distractions
    score -= (session.distractions * 5);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  calculateProductivityScore(session) {
    const categoryScores = {
      'highly_productive': 100,
      'productive': 80,
      'neutral': 50,
      'unproductive': 20,
      'break': 40
    };
    
    const baseScore = categoryScores[session.category] || 50;
    const focusMultiplier = session.finalFocusScore / 100;
    
    return Math.round(baseScore * focusMultiplier);
  }

  async saveSessionData(session) {
    const storageKey = `session_${session.startTime}`;
    await chrome.storage.local.set({
      [storageKey]: session,
      lastSession: session
    });
    
    // Update daily aggregates
    await this.updateDailyAggregates(session);
  }

  async updateDailyAggregates(session) {
    const today = new Date().toDateString();
    const dailyKey = `daily_${today}`;
    
    const existing = await chrome.storage.local.get([dailyKey]);
    const dailyData = existing[dailyKey] || {
      date: today,
      totalTime: 0,
      productiveTime: 0,
      sessions: 0,
      averageFocus: 0,
      categories: {}
    };
    
    dailyData.totalTime += session.duration;
    dailyData.sessions += 1;
    
    if (session.category === 'productive' || session.category === 'highly_productive') {
      dailyData.productiveTime += session.duration;
    }
    
    dailyData.averageFocus = ((dailyData.averageFocus * (dailyData.sessions - 1)) + session.finalFocusScore) / dailyData.sessions;
    
    dailyData.categories[session.category] = (dailyData.categories[session.category] || 0) + session.duration;
    
    await chrome.storage.local.set({ [dailyKey]: dailyData });
  }

  async syncWithBackend(session) {
    try {
      const userId = await this.getUserId();
      
      const payload = {
        userId,
        sessionId: session.sessionId,
        domain: session.domain,
        url: session.url,
        title: session.title,
        timeSpent: session.duration,
        category: session.category,
        focusScore: session.finalFocusScore,
        productivityScore: session.productivityScore,
        metadata: {
          distractions: session.distractions,
          keystrokes: session.keystrokes,
          mouseMovements: session.mouseMovements,
          scrolls: session.scrolls,
          clicks: session.clicks,
          timeSpentActive: session.timeSpentActive,
          timeSpentIdle: session.timeSpentIdle,
          startTime: session.startTime,
          endTime: session.endTime
        }
      };
      
      await fetch('http://localhost:3000/api/activity/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
    } catch (error) {
      console.log('Backend sync failed:', error);
      // Queue for retry
      await this.queueForRetry(session);
    }
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'getSettings':
        sendResponse(this.settings);
        break;
        
      case 'updateSettings':
        await this.updateSettings(request.settings);
        sendResponse({ success: true });
        break;
        
      case 'getCurrentSession':
        sendResponse(this.currentSession);
        break;
        
      case 'getDailyStats':
        const stats = await this.getDailyStats();
        sendResponse(stats);
        break;
        
      case 'activityUpdate':
        if (this.currentSession && sender.tab.id === this.currentSession.tabId) {
          this.updateSessionActivity(request.data);
        }
        break;
        
      case 'toggleFocusMode':
        this.settings.focusMode = !this.settings.focusMode;
        await this.saveSettings();
        sendResponse(this.settings.focusMode);
        break;
        
      case 'startPomodoro':
        await this.startPomodoroTimer();
        sendResponse({ success: true });
        break;
    }
  }

  updateSessionActivity(data) {
    if (!this.currentSession) return;
    
    this.currentSession.keystrokes += data.keystrokes || 0;
    this.currentSession.mouseMovements += data.mouseMovements || 0;
    this.currentSession.scrolls += data.scrolls || 0;
    this.currentSession.clicks += data.clicks || 0;
    this.currentSession.timeSpentActive += data.activeTime || 0;
    
    // Update activity score
    this.currentSession.activityScore = this.calculateActivityScore(this.currentSession);
  }

  calculateActivityScore(session) {
    const duration = Date.now() - session.startTime;
    if (duration < 60000) return 100; // Less than 1 minute
    
    const activityRate = (session.keystrokes + session.mouseMovements + session.scrolls) / (duration / 60000);
    
    // Optimal activity rate is around 30-60 actions per minute
    if (activityRate >= 30 && activityRate <= 60) return 100;
    if (activityRate >= 15 && activityRate <= 90) return 80;
    if (activityRate >= 5 && activityRate <= 120) return 60;
    return 40;
  }

  updateBadge(category) {
    const colors = {
      'highly_productive': '#00C851',
      'productive': '#4CAF50',
      'neutral': '#FF9800',
      'unproductive': '#F44336',
      'break': '#2196F3'
    };
    
    const text = category === 'highly_productive' ? '++' : 
                 category === 'productive' ? '+' :
                 category === 'unproductive' ? '-' : '';
    
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: colors[category] || '#666' });
  }

  // Utility methods
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  isSystemUrl(url) {
    return url.startsWith('chrome://') || 
           url.startsWith('chrome-extension://') || 
           url.startsWith('moz-extension://') ||
           url.startsWith('about:');
  }

  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  async getUserId() {
    const result = await chrome.storage.local.get(['userId']);
    if (!result.userId) {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await chrome.storage.local.set({ userId });
      return userId;
    }
    return result.userId;
  }

  async loadSettings() {
    const result = await chrome.storage.local.get(['settings']);
    if (result.settings) {
      this.settings = { ...this.settings, ...result.settings };
    }
  }

  async saveSettings() {
    await chrome.storage.local.set({ settings: this.settings });
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  startPerformanceMonitoring() {
    // Monitor extension performance
    setInterval(() => {
      const memoryInfo = performance.memory;
      if (memoryInfo && memoryInfo.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
        console.warn('High memory usage detected');
        this.optimizeMemoryUsage();
      }
    }, 300000); // Check every 5 minutes
  }

  optimizeMemoryUsage() {
    // Clean up old session data
    this.cleanupOldData();
  }

  async cleanupOldData() {
    const cutoffDate = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
    const allData = await chrome.storage.local.get();
    
    const keysToRemove = Object.keys(allData).filter(key => {
      if (key.startsWith('session_')) {
        const timestamp = parseInt(key.split('_')[1]);
        return timestamp < cutoffDate;
      }
      return false;
    });
    
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
      console.log(`Cleaned up ${keysToRemove.length} old sessions`);
    }
  }
}

// Initialize the enterprise time tracker
const enterpriseTracker = new EnterpriseTimeTracker();