class OptionsManager {
  constructor() {
    this.settings = {
      focusMode: false,
      blockDistractions: false,
      deepWorkMode: false,
      breakReminders: true,
      pomodoroTimer: false,
      trackMouseMovement: true,
      trackKeystrokes: true
    };
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['settings']);
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  setupEventListeners() {
    // Toggle switches
    Object.keys(this.settings).forEach(key => {
      const toggle = document.getElementById(key);
      if (toggle) {
        toggle.addEventListener('click', () => {
          this.toggleSetting(key);
        });
      }
    });

    // Buttons
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetSettings();
    });
  }

  toggleSetting(key) {
    this.settings[key] = !this.settings[key];
    this.updateToggle(key);
  }

  updateUI() {
    Object.keys(this.settings).forEach(key => {
      this.updateToggle(key);
    });
  }

  updateToggle(key) {
    const toggle = document.getElementById(key);
    if (toggle) {
      if (this.settings[key]) {
        toggle.classList.add('active');
      } else {
        toggle.classList.remove('active');
      }
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({ settings: this.settings });
      
      // Notify background script
      chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: this.settings
      });

      this.showStatus('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showStatus('Failed to save settings', true);
    }
  }

  resetSettings() {
    this.settings = {
      focusMode: false,
      blockDistractions: false,
      deepWorkMode: false,
      breakReminders: true,
      pomodoroTimer: false,
      trackMouseMovement: true,
      trackKeystrokes: true
    };
    this.updateUI();
    this.saveSettings();
  }

  showStatus(message, isError = false) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.style.display = 'block';
    
    if (isError) {
      status.className = 'status error';
    } else {
      status.className = 'status success';
    }

    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});