/**
 * BuilderMate - Clean Standalone Mobile Management App
 * Engineered for Contractors & Builders
 * Includes Persistent Google Drive Cloud Auto-Backup, Project Accordion Dropdowns & Multi-Day Labour Effort Tracking
 */

(function() {
  'use strict';

  // =========================================================================
  // 1. CONSTANTS & PRESETS
  // =========================================================================
  const STORAGE_KEY = 'buildermate_data_v1';
  const GAUTH_KEY = 'buildermate_gdrive_auth_v1';
  const GOOGLE_CLIENT_ID = '434441892966-203633m5fa73di5u7al48o4niilu1obh.apps.googleusercontent.com';

  const PRESET_MATERIALS = [
    { name: 'Bricks', unit: 'Numbers', icon: '🧱' },
    { name: 'Steel (TMT)', unit: 'Kg', icon: '🔩' },
    { name: 'Cement Bags', unit: 'Bags', icon: '📦' },
    { name: 'Aggregates (Gravel)', unit: 'Ton', icon: '🪨' },
    { name: 'River Sand / M-Sand', unit: 'CFT', icon: '⏳' },
    { name: 'Paint', unit: 'Tins', icon: '🎨' },
    { name: 'Floor Tiles', unit: 'Boxes', icon: '⬜' },
    { name: 'Plumbing & Pipes', unit: 'Units', icon: '🔧' },
    { name: 'Electrical Wiring', unit: 'Coils', icon: '⚡' },
    { name: 'Wood / Timber', unit: 'CFT', icon: '🪵' }
  ];

  const LABOUR_ROLES = [
    'Head Mason (Mistri)',
    'Mason',
    'Steel Fixer / Barbender',
    'Carpenter / Shuttering',
    'Painter',
    'Electrician',
    'Plumber',
    'Tile Layer',
    'Helper / Labour',
    'Site Supervisor',
    'Contractor / Sub-Contractor'
  ];

  // Clean default initial state
  const DEFAULT_STATE = {
    settings: {
      companyName: '',
      contractorName: '',
      phone: '',
      currency: '₹',
      address: '',
      isOnboarded: false,
      theme: 'light',
      gdrive: {
        isConnected: false,
        userEmail: '',
        lastSyncedAt: '',
        autoSync: true
      }
    },
    projects: [],
    inventory: [],
    directSales: [],
    labours: []
  };

  // =========================================================================
  // 2. UTILITY FUNCTIONS
  // =========================================================================
  function formatCurrency(amount, symbol = '₹') {
    const num = Number(amount) || 0;
    const formatted = num.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });
    return `${symbol} ${formatted}`;
  }

  function formatNumber(num) {
    const n = Number(num) || 0;
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatTimeAgo(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Never';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 30) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function generateId(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  }

  function cleanPhoneNumber(phone) {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
  }

  function getWhatsAppLink(phone, message = '') {
    let cleaned = cleanPhoneNumber(phone);
    if (!cleaned) return '#';
    cleaned = cleaned.replace(/^\+/, '');
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    const encodedMsg = encodeURIComponent(message);
    return `https://wa.me/${cleaned}${message ? `?text=${encodedMsg}` : ''}`;
  }

  function getTelLink(phone) {
    const cleaned = cleanPhoneNumber(phone);
    return cleaned ? `tel:${cleaned}` : '#';
  }

  function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-up`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span class="toast-msg">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // Modal Open & Close
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  function closeModal(modalId) {
    if (modalId) {
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('active');
    } else {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }

    const activeModals = document.querySelectorAll('.modal-overlay.active');
    if (activeModals.length === 0) {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    }
  }

  window.closeModal = closeModal;
  window.openModal = openModal;

  function downloadJson(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `BuilderMate_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Hard Refresh & Cache Buster
  async function executeHardRefresh(btn) {
    if (btn) btn.classList.add('spinning');
    showToast('Clearing caches & updating app to latest version...', 'info', 2000);

    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }
    } catch (err) {
      console.warn('Cache purge error:', err);
    }

    setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('v', Date.now());
      window.location.href = url.toString();
    }, 400);
  }

  // Theme Management
  function applyTheme(themeName) {
    const isDark = themeName === 'dark' || (themeName === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', '#090d16');
    } else {
      document.documentElement.removeAttribute('data-theme');
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', '#0f172a');
    }

    if (store && store.data && store.data.settings) {
      store.data.settings.theme = themeName;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store.data));
      } catch(e) {}
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(`Switched to ${nextTheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}`);
    renderCurrentTab();
  }

  // =========================================================================
  // 3. PERSISTENT GOOGLE DRIVE CONTINUOUS CLOUD BACKUP ENGINE
  // =========================================================================
  const GDrive = {
    clientId: GOOGLE_CLIENT_ID,
    fileName: 'buildermate_cloud_backup.json',
    scopes: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
    tokenClient: null,
    accessToken: null,
    tokenExpiresAt: 0,
    syncTimeout: null,
    periodicInterval: null,
    isSyncing: false,

    init() {
      // Restore persisted auth from localStorage
      try {
        const savedAuth = localStorage.getItem(GAUTH_KEY);
        if (savedAuth) {
          const parsed = JSON.parse(savedAuth);
          if (parsed.accessToken && parsed.tokenExpiresAt > Date.now()) {
            this.accessToken = parsed.accessToken;
            this.tokenExpiresAt = parsed.tokenExpiresAt;
          }
        }
      } catch(e) {}

      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        try {
          const userEmailHint = (store && store.getSettings && store.getSettings().gdrive && store.getSettings().gdrive.userEmail) || '';
          this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.clientId,
            scope: this.scopes,
            hint: userEmailHint,
            callback: async (resp) => {
              if (resp.error) {
                console.warn('Google OAuth response:', resp);
                if (resp.error !== 'immediate_failed') {
                  showToast('Google Sign-In notice: ' + (resp.error_description || resp.error), 'info');
                }
                return;
              }
              this.accessToken = resp.access_token;
              this.tokenExpiresAt = Date.now() + (Number(resp.expires_in) || 3500) * 1000;
              
              // Persist auth token
              this.saveAuthStorage();

              // Retrieve user email
              const email = await this.fetchUserEmail(this.accessToken);
              const currentGdrive = store.getSettings().gdrive || {};
              store.updateSettings({
                gdrive: {
                  ...currentGdrive,
                  isConnected: true,
                  userEmail: email || currentGdrive.userEmail || 'Connected Account',
                  autoSync: currentGdrive.autoSync !== false
                }
              });

              showToast(`Connected to Google Drive (${email || 'Google Account'})! 🎉`);
              renderSettingsModal();
              renderCurrentTab();

              // Check existing backup on Google Drive
              this.handleInitialSync();
            }
          });
        } catch (e) {
          console.warn('GIS init error:', e);
        }
      }

      // Start periodic background sync timer (every 3 minutes)
      this.startPeriodicSync();
    },

    saveAuthStorage() {
      try {
        if (this.accessToken) {
          localStorage.setItem(GAUTH_KEY, JSON.stringify({
            accessToken: this.accessToken,
            tokenExpiresAt: this.tokenExpiresAt
          }));
        } else {
          localStorage.removeItem(GAUTH_KEY);
        }
      } catch(e) {}
    },

    async fetchUserEmail(token) {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          return data.email;
        }
      } catch(e) {}
      return '';
    },

    connect(forceSelect = true) {
      if (!location.protocol.startsWith('http')) {
        showToast('Google OAuth requires running on http/https (e.g. GitHub Pages or local server)', 'warning', 4500);
      }
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        showToast('Google Identity Services is loading. Please try again.', 'info');
        return;
      }
      if (!this.tokenClient) this.init();
      if (this.tokenClient) {
        this.tokenClient.requestAccessToken({ prompt: forceSelect ? 'select_account' : '' });
      } else {
        showToast('Google Auth Client not initialized', 'error');
      }
    },

    disconnect() {
      if (this.accessToken && window.google && window.google.accounts && window.google.accounts.oauth2) {
        try {
          google.accounts.oauth2.revoke(this.accessToken, () => {});
        } catch(e) {}
      }
      this.accessToken = null;
      this.tokenExpiresAt = 0;
      this.saveAuthStorage();

      const currentGdrive = store.getSettings().gdrive || {};
      store.updateSettings({
        gdrive: {
          ...currentGdrive,
          isConnected: false,
          userEmail: '',
          lastSyncedAt: ''
        }
      });
      showToast('Disconnected from Google Drive', 'info');
      renderSettingsModal();
      renderCurrentTab();
    },

    async ensureValidToken(allowPrompt = false) {
      // Check in-memory / local token
      if (this.accessToken && Date.now() < (this.tokenExpiresAt - 45000)) {
        return this.accessToken;
      }

      // Check localStorage
      try {
        const savedAuth = localStorage.getItem(GAUTH_KEY);
        if (savedAuth) {
          const parsed = JSON.parse(savedAuth);
          if (parsed.accessToken && parsed.tokenExpiresAt > (Date.now() + 45000)) {
            this.accessToken = parsed.accessToken;
            this.tokenExpiresAt = parsed.tokenExpiresAt;
            return this.accessToken;
          }
        }
      } catch(e) {}

      // If token client is ready, request token
      return new Promise((resolve) => {
        if (!this.tokenClient) this.init();
        if (!this.tokenClient) return resolve(null);

        const timeout = setTimeout(() => resolve(null), 8000);

        this.tokenClient.callback = async (resp) => {
          clearTimeout(timeout);
          if (resp && resp.access_token) {
            this.accessToken = resp.access_token;
            this.tokenExpiresAt = Date.now() + (Number(resp.expires_in) || 3500) * 1000;
            this.saveAuthStorage();
            resolve(this.accessToken);
          } else {
            resolve(null);
          }
        };

        try {
          const userEmail = (store.getSettings().gdrive && store.getSettings().gdrive.userEmail) || '';
          this.tokenClient.requestAccessToken({
            prompt: allowPrompt ? 'select_account' : '',
            hint: userEmail
          });
        } catch(e) {
          clearTimeout(timeout);
          resolve(null);
        }
      });
    },

    async findRemoteFile(token) {
      try {
        const q = encodeURIComponent(`name = '${this.fileName}' and trashed = false`);
        const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder,drive&q=${q}&fields=files(id,name,modifiedTime,size)`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.files && data.files.length > 0) {
            return data.files[0];
          }
        }
      } catch (e) {
        console.warn('findRemoteFile error:', e);
      }
      return null;
    },

    async uploadData(showNotification = false, allowInteractivePrompt = false) {
      if (this.isSyncing) return;
      const gdriveState = store.getSettings().gdrive;
      if (!gdriveState || !gdriveState.isConnected) return;

      this.isSyncing = true;
      this.updateStatusVisuals('syncing');

      try {
        const token = await this.ensureValidToken(allowInteractivePrompt);
        if (!token) {
          this.isSyncing = false;
          this.updateStatusVisuals('connected');
          if (showNotification) {
            showToast('Google Drive session expired. Tap Connect to re-authenticate.', 'info');
          }
          return;
        }

        const existingFile = await this.findRemoteFile(token);
        const dataToSync = store.exportFullData();
        const contentBlob = new Blob([JSON.stringify(dataToSync, null, 2)], { type: 'application/json' });

        let response;
        if (existingFile) {
          // Patch existing backup file
          response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: contentBlob
          });
        } else {
          // Create new backup file in appDataFolder
          const metadata = {
            name: this.fileName,
            parents: ['appDataFolder'],
            mimeType: 'application/json'
          };

          const boundary = '-------314159265358979323846';
          const delimiter = "\r\n--" + boundary + "\r\n";
          const close_delim = "\r\n--" + boundary + "--";

          const multipartRequestBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(dataToSync, null, 2) +
            close_delim;

          response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/related; boundary=' + boundary
            },
            body: multipartRequestBody
          });
        }

        if (response && response.ok) {
          const nowIso = new Date().toISOString();
          if (store.data.settings.gdrive) {
            store.data.settings.gdrive.lastSyncedAt = nowIso;
          }
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(store.data));
          } catch(e) {}

          if (showNotification) {
            showToast('☁️ Cloud backup synced to Google Drive successfully!');
          }
        }
      } catch (err) {
        console.warn('uploadData error:', err);
      } finally {
        this.isSyncing = false;
        this.updateStatusVisuals('connected');
        renderSettingsModal();
      }
    },

    async downloadRemoteData() {
      const token = await this.ensureValidToken(true);
      if (!token) throw new Error('Google Drive authorization required');

      const file = await this.findRemoteFile(token);
      if (!file) throw new Error('No cloud backup found on your Google Drive yet.');

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Could not download cloud backup from Google Drive.');
      return await res.json();
    },

    async restoreFromCloud() {
      try {
        showToast('Fetching cloud backup from Google Drive...', 'info', 2000);
        const remoteData = await this.downloadRemoteData();
        if (!remoteData || typeof remoteData !== 'object') {
          showToast('Invalid backup data format on Google Drive', 'error');
          return;
        }

        const projCount = Array.isArray(remoteData.projects) ? remoteData.projects.length : 0;
        const invCount = Array.isArray(remoteData.inventory) ? remoteData.inventory.length : 0;

        if (confirm(`Restore ${projCount} project(s) & ${invCount} stock record(s) from Google Drive? This will update your local data.`)) {
          store.importFullData(remoteData);
          showToast('🎉 Restored data from Google Drive!');
          closeModal('settings-modal');
          renderCurrentTab();
        }
      } catch (err) {
        showToast(err.message || 'Error restoring from Google Drive', 'error');
      }
    },

    async handleInitialSync() {
      try {
        const token = await this.ensureValidToken(false);
        if (!token) return;

        const remoteFile = await this.findRemoteFile(token);
        const localProjects = store.getProjects();

        if (remoteFile && localProjects.length === 0) {
          if (confirm('Found an existing BuilderMate backup on your Google Drive. Would you like to restore it now?')) {
            this.restoreFromCloud();
            return;
          }
        }
        this.uploadData(false);
      } catch(e) {}
    },

    queueDebouncedSync() {
      const gdriveState = store.getSettings().gdrive;
      if (!gdriveState || !gdriveState.isConnected || gdriveState.autoSync === false) return;

      clearTimeout(this.syncTimeout);
      this.syncTimeout = setTimeout(() => {
        this.uploadData(false);
      }, 2500);
    },

    startPeriodicSync() {
      if (this.periodicInterval) clearInterval(this.periodicInterval);
      // Run every 3 minutes (180,000ms)
      this.periodicInterval = setInterval(() => {
        const gdriveState = store.getSettings().gdrive;
        if (gdriveState && gdriveState.isConnected && gdriveState.autoSync !== false) {
          this.uploadData(false);
        }
      }, 180000);
    },

    updateStatusVisuals(status) {
      const pills = document.querySelectorAll('.header-cloud-chip, .cloud-status-pill');
      pills.forEach(p => {
        if (status === 'syncing') {
          p.classList.remove('connected', 'disconnected');
          p.classList.add('syncing');
          p.textContent = '☁️ Syncing...';
        } else if (status === 'connected') {
          p.classList.remove('syncing', 'disconnected');
          p.classList.add('connected');
          const lastSync = store.getSettings().gdrive?.lastSyncedAt;
          p.textContent = lastSync ? `☁️ ${formatTimeAgo(lastSync)}` : '☁️ Synced';
        }
      });
    }
  };

  // =========================================================================
  // 4. REACTIVE DATA STORE
  // =========================================================================
  class Store {
    constructor() {
      this.subscribers = [];
      this.data = this.loadFromStorage();
    }

    loadFromStorage() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          
          let inv = Array.isArray(parsed.inventory) ? parsed.inventory : [];
          let lab = Array.isArray(parsed.labours) ? parsed.labours : [];
          
          if (inv.length > 0 && inv[0].id === 'inv_bricks' && (!parsed.projects || parsed.projects.length === 0)) {
            inv = [];
          }
          if (lab.length > 0 && lab[0].id === 'lab_1' && (!parsed.projects || parsed.projects.length === 0)) {
            lab = [];
          }

          return {
            settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
            projects: Array.isArray(parsed.projects) ? parsed.projects : [],
            inventory: inv,
            directSales: Array.isArray(parsed.directSales) ? parsed.directSales : [],
            labours: lab
          };
        }
      } catch (e) {
        console.error('Error loading data from localStorage', e);
      }
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }

    saveToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.notifySubscribers();
        // Trigger Google Drive debounced auto-sync
        if (typeof GDrive !== 'undefined' && GDrive.queueDebouncedSync) {
          GDrive.queueDebouncedSync();
        }
      } catch (e) {
        console.error('Error saving data to localStorage', e);
      }
    }

    subscribe(callback) {
      this.subscribers.push(callback);
      return () => {
        this.subscribers = this.subscribers.filter(cb => cb !== callback);
      };
    }

    notifySubscribers() {
      this.subscribers.forEach(callback => {
        try {
          callback(this.data);
        } catch (err) {
          console.error('Error in store subscriber:', err);
        }
      });
    }

    getSettings() {
      return this.data.settings;
    }

    updateSettings(newSettings) {
      this.data.settings = { ...this.data.settings, ...newSettings };
      this.saveToStorage();
    }

    getProjects() {
      return this.data.projects;
    }

    getProjectById(id) {
      return this.data.projects.find(p => p.id === id);
    }

    addProject(projectData) {
      const newProject = {
        id: generateId('proj'),
        name: projectData.name || 'Untitled Project',
        customerName: projectData.customerName || '',
        customerPhone: projectData.customerPhone || '',
        siteAddress: projectData.siteAddress || '',
        startDate: projectData.startDate || getTodayDateString(),
        status: projectData.status || 'in_progress',
        estimatedBudget: Number(projectData.estimatedBudget) || 0,
        notes: projectData.notes || '',
        materials: projectData.materials || [],
        payments: projectData.payments || [],
        expenses: projectData.expenses || [],
        createdAt: new Date().toISOString()
      };
      this.data.projects.unshift(newProject);
      this.saveToStorage();
      return newProject;
    }

    updateProject(id, updatedFields) {
      const index = this.data.projects.findIndex(p => p.id === id);
      if (index !== -1) {
        this.data.projects[index] = { ...this.data.projects[index], ...updatedFields };
        this.saveToStorage();
        return this.data.projects[index];
      }
      return null;
    }

    deleteProject(id) {
      this.data.projects = this.data.projects.filter(p => p.id !== id);
      this.saveToStorage();
    }

    addProjectMaterial(projectId, material) {
      const project = this.getProjectById(projectId);
      if (!project) return null;
      
      const matEntry = {
        id: generateId('pmat'),
        name: material.name,
        quantity: Number(material.quantity) || 0,
        unit: material.unit || 'Units',
        rate: Number(material.rate) || 0,
        total: (Number(material.quantity) || 0) * (Number(material.rate) || 0),
        date: material.date || getTodayDateString(),
        notes: material.notes || ''
      };

      project.materials.push(matEntry);

      const invItem = this.data.inventory.find(i => i.name.toLowerCase().trim() === material.name.toLowerCase().trim());
      if (invItem && invItem.currentStock >= matEntry.quantity) {
        invItem.currentStock -= matEntry.quantity;
      }

      this.saveToStorage();
      return matEntry;
    }

    deleteProjectMaterial(projectId, materialId) {
      const project = this.getProjectById(projectId);
      if (!project) return;
      project.materials = project.materials.filter(m => m.id !== materialId);
      this.saveToStorage();
    }

    addProjectPayment(projectId, payment) {
      const project = this.getProjectById(projectId);
      if (!project) return null;

      const paymentEntry = {
        id: generateId('pay'),
        date: payment.date || getTodayDateString(),
        amount: Number(payment.amount) || 0,
        mode: payment.mode || 'Cash',
        notes: payment.notes || '',
        createdAt: new Date().toISOString()
      };

      project.payments.push(paymentEntry);
      this.saveToStorage();
      return paymentEntry;
    }

    deleteProjectPayment(projectId, paymentId) {
      const project = this.getProjectById(projectId);
      if (!project) return;
      project.payments = project.payments.filter(p => p.id !== paymentId);
      this.saveToStorage();
    }

    getInventory() {
      return this.data.inventory;
    }

    getInventoryItemById(id) {
      return this.data.inventory.find(i => i.id === id);
    }

    addInventoryItem(itemData) {
      const newItem = {
        id: generateId('inv'),
        name: itemData.name,
        category: itemData.category || 'General',
        unit: itemData.unit || 'Units',
        currentStock: Number(itemData.initialStock) || 0,
        minStockThreshold: Number(itemData.minStockThreshold) || 10,
        avgPurchasePrice: Number(itemData.avgPurchasePrice) || 0,
        purchases: []
      };

      if (itemData.initialStock > 0 && itemData.avgPurchasePrice > 0) {
        newItem.purchases.push({
          id: generateId('pur'),
          date: getTodayDateString(),
          quantity: Number(itemData.initialStock),
          unitPrice: Number(itemData.avgPurchasePrice),
          totalCost: Number(itemData.initialStock) * Number(itemData.avgPurchasePrice),
          supplier: itemData.supplier || 'Initial Stock',
          notes: 'Initial opening stock'
        });
      }

      this.data.inventory.push(newItem);
      this.saveToStorage();
      return newItem;
    }

    recordStockPurchase(itemId, purchaseData) {
      let item = this.getInventoryItemById(itemId);
      if (!item) {
        item = this.data.inventory.find(i => i.name.toLowerCase().trim() === purchaseData.name?.toLowerCase().trim());
        if (!item) {
          item = this.addInventoryItem({
            name: purchaseData.name,
            unit: purchaseData.unit,
            category: purchaseData.category || 'General',
            initialStock: 0,
            avgPurchasePrice: Number(purchaseData.unitPrice) || 0
          });
        }
      }

      const qty = Number(purchaseData.quantity) || 0;
      const unitPrice = Number(purchaseData.unitPrice) || 0;
      const totalCost = Number(purchaseData.totalCost) || (qty * unitPrice);

      const purchase = {
        id: generateId('pur'),
        date: purchaseData.date || getTodayDateString(),
        quantity: qty,
        unitPrice: unitPrice,
        totalCost: totalCost,
        supplier: purchaseData.supplier || 'Direct Supplier',
        invoiceNo: purchaseData.invoiceNo || '',
        notes: purchaseData.notes || ''
      };

      item.purchases.push(purchase);
      item.currentStock += qty;
      
      const totalPurchasedCost = item.purchases.reduce((sum, p) => sum + p.totalCost, 0);
      const totalPurchasedQty = item.purchases.reduce((sum, p) => sum + p.quantity, 0);
      if (totalPurchasedQty > 0) {
        item.avgPurchasePrice = totalPurchasedCost / totalPurchasedQty;
      }

      this.saveToStorage();
      return purchase;
    }

    getDirectSales() {
      return this.data.directSales;
    }

    addDirectSale(saleData) {
      const items = saleData.items || [];
      const totalAmount = items.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
      const amountPaid = Number(saleData.amountPaid) !== undefined ? Number(saleData.amountPaid) : totalAmount;

      const newSale = {
        id: generateId('sale'),
        date: saleData.date || getTodayDateString(),
        customerName: saleData.customerName || 'Walk-in Customer',
        customerPhone: saleData.customerPhone || '',
        items: items,
        totalAmount: totalAmount,
        amountPaid: amountPaid,
        paymentMode: saleData.paymentMode || 'Cash',
        notes: saleData.notes || '',
        createdAt: new Date().toISOString()
      };

      items.forEach(soldItem => {
        const inv = this.data.inventory.find(i => i.name.toLowerCase().trim() === soldItem.name.toLowerCase().trim());
        if (inv && inv.currentStock >= (Number(soldItem.quantity) || 0)) {
          inv.currentStock -= Number(soldItem.quantity) || 0;
        }
      });

      this.data.directSales.unshift(newSale);
      this.saveToStorage();
      return newSale;
    }

    deleteDirectSale(id) {
      this.data.directSales = this.data.directSales.filter(s => s.id !== id);
      this.saveToStorage();
    }

    getLabours() {
      return this.data.labours;
    }

    getLabourById(id) {
      return this.data.labours.find(l => l.id === id);
    }

    addLabour(labourData) {
      const existing = this.data.labours.find(l => l.name.toLowerCase().trim() === (labourData.name || '').toLowerCase().trim());
      if (existing) {
        return existing;
      }

      const newLabour = {
        id: generateId('lab'),
        name: labourData.name,
        role: labourData.role || 'Worker',
        phone: labourData.phone || '',
        wageType: labourData.wageType || 'daily',
        wageRate: Number(labourData.wageRate) || 0,
        joinedDate: labourData.joinedDate || getTodayDateString(),
        notes: labourData.notes || '',
        attendance: [],
        payouts: []
      };

      this.data.labours.push(newLabour);
      this.saveToStorage();
      return newLabour;
    }

    deleteLabour(id) {
      this.data.labours = this.data.labours.filter(l => l.id !== id);
      this.saveToStorage();
    }

    logLabourAttendance(labourId, attendanceData) {
      const labour = this.getLabourById(labourId);
      if (!labour) return null;

      const days = attendanceData.days !== undefined ? Number(attendanceData.days) : (
        attendanceData.status === 'half_day' ? 0.5 :
        attendanceData.status === 'overtime' ? 1.5 :
        attendanceData.status === 'absent' ? 0 : 1.0
      );
      const rate = Number(attendanceData.rate) || (labour.wageRate || 0);
      const totalCost = attendanceData.totalCost !== undefined 
        ? Number(attendanceData.totalCost) 
        : Math.round(days * rate);

      const entry = {
        id: generateId('att'),
        date: attendanceData.date || getTodayDateString(),
        status: attendanceData.status || (days > 1 ? 'multi_days' : 'full_day'),
        days: days,
        rate: rate,
        totalCost: totalCost,
        projectId: attendanceData.projectId || '',
        notes: attendanceData.notes || ''
      };

      labour.attendance.unshift(entry);
      this.saveToStorage();
      return entry;
    }

    quickIncrementWorkerDays(projectId, labourId, daysToAdd = 1) {
      const labour = this.getLabourById(labourId);
      if (!labour) return null;

      const entry = {
        id: generateId('att'),
        date: getTodayDateString(),
        status: daysToAdd > 1 ? 'multi_days' : 'full_day',
        days: Number(daysToAdd),
        rate: labour.wageRate || 0,
        totalCost: Math.round(Number(daysToAdd) * (labour.wageRate || 0)),
        projectId: projectId,
        notes: `Quick added +${daysToAdd} day(s)`
      };

      labour.attendance.unshift(entry);
      this.saveToStorage();
      return entry;
    }

    deleteLabourAttendance(labourId, attendanceId) {
      const labour = this.getLabourById(labourId);
      if (!labour) return;
      labour.attendance = labour.attendance.filter(a => a.id !== attendanceId);
      this.saveToStorage();
    }

    addLabourPayout(labourId, payoutData) {
      const labour = this.getLabourById(labourId);
      if (!labour) return null;

      const payout = {
        id: generateId('pay'),
        date: payoutData.date || getTodayDateString(),
        amount: Number(payoutData.amount) || 0,
        type: payoutData.type || 'Daily Wage',
        mode: payoutData.mode || 'Cash',
        projectId: payoutData.projectId || '',
        notes: payoutData.notes || '',
        createdAt: new Date().toISOString()
      };

      labour.payouts.unshift(payout);
      this.saveToStorage();
      return payout;
    }

    deleteLabourPayout(labourId, payoutId) {
      const labour = this.getLabourById(labourId);
      if (!labour) return;
      labour.payouts = labour.payouts.filter(p => p.id !== payoutId);
      this.saveToStorage();
    }

    // --- PROJECT-LEVEL LABOUR EFFORT TRACKING & STATS ---
    getProjectLabourStats(projectId) {
      let totalLabourCost = 0;
      let totalLabourPaid = 0;
      let totalDays = 0;
      const workerStats = [];
      const projectEffortLogs = [];
      const projectPayoutLogs = [];

      this.data.labours.forEach(labour => {
        const projAttendance = (labour.attendance || []).filter(a => a.projectId === projectId);
        const projPayouts = (labour.payouts || []).filter(p => p.projectId === projectId);

        if (projAttendance.length > 0 || projPayouts.length > 0) {
          let days = 0;
          let earned = 0;

          projAttendance.forEach(att => {
            let dayUnits = att.days !== undefined ? Number(att.days) : (
              att.status === 'half_day' ? 0.5 :
              att.status === 'overtime' ? 1.5 :
              att.status === 'absent' ? 0 : 1.0
            );

            const lineCost = att.totalCost !== undefined 
              ? Number(att.totalCost) 
              : Math.round(dayUnits * (att.rate || labour.wageRate || 0));

            days += dayUnits;
            earned += lineCost;

            projectEffortLogs.push({
              id: att.id,
              labourId: labour.id,
              labourName: labour.name,
              labourRole: labour.role,
              date: att.date,
              status: att.status,
              days: dayUnits,
              rate: att.rate || labour.wageRate,
              earned: lineCost,
              notes: att.notes
            });
          });

          const paid = projPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          projPayouts.forEach(p => {
            projectPayoutLogs.push({
              id: p.id,
              labourId: labour.id,
              labourName: labour.name,
              amount: p.amount,
              date: p.date,
              mode: p.mode,
              type: p.type,
              notes: p.notes
            });
          });

          const balDue = Math.max(0, Math.round(earned - paid));
          totalLabourCost += earned;
          totalLabourPaid += paid;
          totalDays += days;

          workerStats.push({
            labour,
            daysWorked: Number(days.toFixed(1)),
            earned: Math.round(earned),
            paid: paid,
            balanceDue: balDue,
            attendanceCount: projAttendance.length,
            payoutsCount: projPayouts.length
          });
        }
      });

      projectEffortLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
      projectPayoutLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        totalLabourCost: Math.round(totalLabourCost),
        totalLabourPaid,
        totalDays: Number(totalDays.toFixed(1)),
        workerStats,
        projectEffortLogs,
        projectPayoutLogs
      };
    }

    getTotalIncome() {
      let total = 0;
      this.data.projects.forEach(p => {
        (p.payments || []).forEach(pay => {
          total += Number(pay.amount) || 0;
        });
      });
      this.data.directSales.forEach(s => {
        total += Number(s.amountPaid) || 0;
      });
      return total;
    }

    getTotalSpends() {
      let total = 0;
      this.data.inventory.forEach(inv => {
        (inv.purchases || []).forEach(pur => {
          total += Number(pur.totalCost) || 0;
        });
      });
      this.data.labours.forEach(lab => {
        (lab.payouts || []).forEach(p => {
          total += Number(p.amount) || 0;
        });
      });
      this.data.projects.forEach(p => {
        (p.expenses || []).forEach(e => {
          total += Number(e.amount) || 0;
        });
      });
      return total;
    }

    getNetProfit() {
      return this.getTotalIncome() - this.getTotalSpends();
    }

    getTotalInventoryValuation() {
      return this.data.inventory.reduce((sum, item) => {
        return sum + ((Number(item.currentStock) || 0) * (Number(item.avgPurchasePrice) || 0));
      }, 0);
    }

    getActiveProjectsCount() {
      return this.data.projects.filter(p => p.status === 'in_progress').length;
    }

    getLabourFinancials(labour) {
      let totalEarned = 0;
      const projectDaysMap = {};

      (labour.attendance || []).forEach(att => {
        let dayUnits = att.days !== undefined ? Number(att.days) : (
          att.status === 'half_day' ? 0.5 :
          att.status === 'overtime' ? 1.5 :
          att.status === 'absent' ? 0 : 1.0
        );

        const lineCost = att.totalCost !== undefined 
          ? Number(att.totalCost) 
          : Math.round(dayUnits * (att.rate || labour.wageRate || 0));

        totalEarned += lineCost;

        const pKey = att.projectId || 'outside';
        projectDaysMap[pKey] = Number(((projectDaysMap[pKey] || 0) + dayUnits).toFixed(1));
      });

      const totalPaid = (labour.payouts || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const balanceDue = Math.max(0, Math.round(totalEarned - totalPaid));

      return {
        totalEarned: Math.round(totalEarned),
        totalPaid,
        balanceDue,
        projectDaysMap
      };
    }

    getProjectFinancials(project) {
      const materialsTotal = (project.materials || []).reduce((sum, m) => sum + (Number(m.total) || 0), 0);
      const expensesTotal = (project.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const totalCollected = (project.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
      const labourStats = this.getProjectLabourStats(project.id);
      const estimatedValue = Number(project.estimatedBudget) > 0 ? Number(project.estimatedBudget) : materialsTotal;
      const pendingBalance = Math.max(0, estimatedValue - totalCollected);
      const totalProjectCost = materialsTotal + labourStats.totalLabourCost + expensesTotal;

      return {
        materialsTotal,
        labourCost: labourStats.totalLabourCost,
        labourPaid: labourStats.totalLabourPaid,
        expensesTotal,
        totalCost: totalProjectCost,
        totalCollected,
        estimatedValue,
        pendingBalance,
        estimatedProfit: totalCollected - totalProjectCost
      };
    }

    getRecentActivities(limit = 8) {
      const activities = [];

      this.data.projects.forEach(p => {
        (p.payments || []).forEach(pay => {
          activities.push({
            id: pay.id,
            type: 'income',
            category: 'Project Payment',
            title: `Payment: ${p.customerName || p.name}`,
            subtitle: `Project: ${p.name}`,
            amount: pay.amount,
            date: pay.date,
            mode: pay.mode
          });
        });
      });

      this.data.directSales.forEach(sale => {
        activities.push({
          id: sale.id,
          type: 'income',
          category: 'Direct Sale',
          title: `Direct Sale: ${sale.customerName}`,
          subtitle: `${sale.items.length} item(s) sold`,
          amount: sale.amountPaid,
          date: sale.date,
          mode: sale.paymentMode
        });
      });

      this.data.inventory.forEach(inv => {
        (inv.purchases || []).forEach(pur => {
          activities.push({
            id: pur.id,
            type: 'spend',
            category: 'Material Purchase',
            title: `Stock: ${inv.name}`,
            subtitle: `${pur.quantity} ${inv.unit} (${pur.supplier})`,
            amount: pur.totalCost,
            date: pur.date,
            mode: 'Purchase'
          });
        });
      });

      this.data.labours.forEach(lab => {
        (lab.payouts || []).forEach(pay => {
          activities.push({
            id: pay.id,
            type: 'spend',
            category: 'Labour Payout',
            title: `Paid ${lab.name}`,
            subtitle: `${pay.type} (${lab.role})`,
            amount: pay.amount,
            date: pay.date,
            mode: pay.mode
          });
        });
      });

      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      return activities.slice(0, limit);
    }

    exportFullData() {
      return JSON.parse(JSON.stringify(this.data));
    }

    importFullData(importedData) {
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Invalid JSON backup file');
      }
      this.data = {
        settings: { ...DEFAULT_STATE.settings, ...(importedData.settings || {}) },
        projects: Array.isArray(importedData.projects) ? importedData.projects : [],
        inventory: Array.isArray(importedData.inventory) ? importedData.inventory : [],
        directSales: Array.isArray(importedData.directSales) ? importedData.directSales : [],
        labours: Array.isArray(importedData.labours) ? importedData.labours : []
      };
      this.saveToStorage();
    }

    resetAllData() {
      this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
      this.data.settings.isOnboarded = false;
      this.saveToStorage();
    }
  }

  const store = new Store();

  // =========================================================================
  // 5. VIEW COMPONENTS & CONTROLLERS
  // =========================================================================
  let activeTab = 'dashboard';
  let projectFilter = 'all';
  let projectSearchQuery = '';
  let invCategory = 'all';
  let invSearchQuery = '';
  let labourWageFilter = 'all';
  let labourSearchQuery = '';
  let directSaleItemsTemp = [];
  let deferredInstallPrompt = null;

  // --- DASHBOARD VIEW ---
  function renderDashboard(container) {
    const settings = store.getSettings();
    const currency = settings.currency || '₹';
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gdrive = settings.gdrive || {};
    const totalIncome = store.getTotalIncome();
    const totalSpends = store.getTotalSpends();
    const netProfit = store.getNetProfit();
    const activeProjectsCount = store.getActiveProjectsCount();
    const inventoryValuation = store.getTotalInventoryValuation();
    const recentActivities = store.getRecentActivities(8);
    const projects = store.getProjects().slice(0, 3);

    const companyTitle = settings.companyName ? settings.companyName : 'BuilderMate';
    const greetingSubtitle = settings.contractorName 
      ? `Welcome back, ${settings.contractorName}` 
      : 'Construction Business Overview';

    container.innerHTML = `
      <div class="dashboard-header">
        <div class="company-brand-badge">
          <img src="icon.png" alt="BuilderMate" class="brand-avatar" />
          <div class="brand-text">
            <h1 class="company-name-text">${companyTitle}</h1>
            <p class="contractor-greeting-text">${greetingSubtitle}</p>
            ${gdrive.isConnected ? `
              <span class="header-cloud-chip connected" title="Connected to Google Drive: ${gdrive.userEmail}">
                ☁️ ${gdrive.lastSyncedAt ? formatTimeAgo(gdrive.lastSyncedAt) : 'Synced'}
              </span>
            ` : ''}
          </div>
        </div>
        <div class="header-actions-group">
          <button class="icon-btn" id="dash-theme-toggle-btn" title="Toggle ${isDark ? 'Light' : 'Dark'} Theme" aria-label="Toggle Theme">
            ${isDark ? `
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ` : `
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            `}
          </button>
          <button class="icon-btn" id="dash-hard-refresh-btn" title="Hard Refresh & Update Cache" aria-label="Hard Refresh">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M22 12.5a10 10 0 0 1-18.8 4.2L2.5 16"/>
            </svg>
          </button>
          <button class="icon-btn" id="dash-settings-btn" title="Settings & Backup" aria-label="Settings">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card metric-income">
          <div class="metric-header">
            <span class="metric-label">Total Income</span>
            <div class="metric-icon-wrap income-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </div>
          </div>
          <div class="metric-value income-color">${formatCurrency(totalIncome, currency)}</div>
          <div class="metric-footer">Projects & Direct Sales</div>
        </div>

        <div class="metric-card metric-spend">
          <div class="metric-header">
            <span class="metric-label">Total Spends</span>
            <div class="metric-icon-wrap spend-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            </div>
          </div>
          <div class="metric-value spend-color">${formatCurrency(totalSpends, currency)}</div>
          <div class="metric-footer">Stock Purchases & Wages</div>
        </div>

        <div class="metric-card metric-profit">
          <div class="metric-header">
            <span class="metric-label">Net Cashflow</span>
            <span class="status-pill ${netProfit >= 0 ? 'pill-green' : 'pill-red'}">
              ${netProfit >= 0 ? 'Profit' : 'Deficit'}
            </span>
          </div>
          <div class="metric-value ${netProfit >= 0 ? 'income-color' : 'spend-color'}">${formatCurrency(netProfit, currency)}</div>
          <div class="metric-footer">Income minus Spends</div>
        </div>

        <div class="metric-card metric-operations">
          <div class="metric-header">
            <span class="metric-label">Active Projects</span>
            <span class="badge-count">${activeProjectsCount}</span>
          </div>
          <div class="metric-sub-stats">
            <div class="stat-line">
              <span class="text-muted">Stock Asset Value:</span>
              <strong class="font-mono">${formatCurrency(inventoryValuation, currency)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="section-container">
        <h2 class="section-title">Quick Actions</h2>
        <div class="quick-actions-bar">
          <button class="quick-action-btn" id="qa-new-project">
            <span class="qa-icon-circle bg-blue">🏗️</span>
            <span class="qa-text">New Project</span>
          </button>
          <button class="quick-action-btn" id="qa-buy-material">
            <span class="qa-icon-circle bg-orange">📦</span>
            <span class="qa-text">Buy Stock</span>
          </button>
          <button class="quick-action-btn" id="qa-direct-sale">
            <span class="qa-icon-circle bg-emerald">🛒</span>
            <span class="qa-text">Direct Sale</span>
          </button>
          <button class="quick-action-btn" id="qa-log-labour">
            <span class="qa-icon-circle bg-purple">👷</span>
            <span class="qa-text">Log Labour</span>
          </button>
        </div>
      </div>

      <div class="section-container">
        <div class="section-header-flex">
          <h2 class="section-title">Active Projects Glance</h2>
          <button class="text-link-btn" id="view-all-projects-btn">View All →</button>
        </div>

        ${projects.length === 0 ? `
          <div class="empty-state-card">
            <div class="empty-icon">🏗️</div>
            <div class="empty-title">No Projects Created Yet</div>
            <p class="empty-desc">Create your first construction project to track materials sold, labour efforts, and customer payments.</p>
            <button class="btn btn-primary btn-sm" id="empty-add-proj-btn">+ Start New Project</button>
          </div>
        ` : `
          <div class="projects-mini-list">
            ${projects.map(project => {
              const financials = store.getProjectFinancials(project);
              return `
                <div class="project-mini-card" data-project-id="${project.id}">
                  <div class="proj-mini-top">
                    <div>
                      <h3 class="proj-mini-name">${project.name}</h3>
                      <p class="proj-mini-client">${project.customerName ? `👤 ${project.customerName}` : 'No Client Named'}</p>
                    </div>
                    <span class="status-tag status-${project.status}">
                      ${project.status === 'in_progress' ? 'In Progress' : project.status === 'completed' ? 'Completed' : 'On Hold'}
                    </span>
                  </div>
                  <div class="proj-mini-financials">
                    <div class="proj-stat">
                      <span class="stat-lbl">Collected</span>
                      <strong class="income-color">${formatCurrency(financials.totalCollected, currency)}</strong>
                    </div>
                    <div class="proj-stat">
                      <span class="stat-lbl">Est. Total</span>
                      <strong>${formatCurrency(financials.estimatedValue, currency)}</strong>
                    </div>
                    <div class="proj-stat">
                      <span class="stat-lbl">Pending</span>
                      <strong class="${financials.pendingBalance > 0 ? 'text-amber' : 'income-color'}">
                        ${formatCurrency(financials.pendingBalance, currency)}
                      </strong>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <div class="section-container">
        <h2 class="section-title">Recent Activity</h2>
        ${recentActivities.length === 0 ? `
          <div class="empty-state-card">
            <p class="empty-desc">No activities logged yet. Recent payments, purchases, and wage payouts will appear here.</p>
          </div>
        ` : `
          <div class="activity-timeline">
            ${recentActivities.map(act => `
              <div class="activity-item">
                <div class="activity-icon-badge ${act.type === 'income' ? 'act-income' : 'act-spend'}">
                  ${act.type === 'income' ? '↓' : '↑'}
                </div>
                <div class="activity-info">
                  <div class="activity-title-line">
                    <span class="activity-title">${act.title}</span>
                    <span class="activity-amount ${act.type === 'income' ? 'income-color' : 'spend-color'}">
                      ${act.type === 'income' ? '+' : '-'}${formatCurrency(act.amount, currency)}
                    </span>
                  </div>
                  <div class="activity-meta">
                    <span>${act.subtitle}</span> • <span>${formatDate(act.date)}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    // Header buttons
    container.querySelector('#dash-theme-toggle-btn')?.addEventListener('click', toggleTheme);

    container.querySelector('#dash-hard-refresh-btn')?.addEventListener('click', (e) => {
      executeHardRefresh(e.currentTarget);
    });

    container.querySelector('#dash-settings-btn')?.addEventListener('click', () => {
      renderSettingsModal();
      openModal('settings-modal');
    });

    container.querySelector('#qa-new-project')?.addEventListener('click', () => openModal('new-project-modal'));
    container.querySelector('#qa-buy-material')?.addEventListener('click', () => openBuyStockModal());
    container.querySelector('#qa-direct-sale')?.addEventListener('click', () => openNewDirectSaleModal());
    container.querySelector('#qa-log-labour')?.addEventListener('click', () => openLogAttendanceModal());
    container.querySelector('#empty-add-proj-btn')?.addEventListener('click', () => openModal('new-project-modal'));

    container.querySelector('#view-all-projects-btn')?.addEventListener('click', () => {
      switchTab('projects');
    });

    container.querySelectorAll('.project-mini-card').forEach(card => {
      card.addEventListener('click', () => {
        const projId = card.dataset.projectId;
        switchTab('projects');
        openProjectDetailsModal(projId);
      });
    });
  }

  // --- PROJECTS VIEW ---
  function renderProjects(container) {
    const settings = store.getSettings();
    const currency = settings.currency || '₹';
    const allProjects = store.getProjects();

    let filteredProjects = allProjects.filter(p => {
      if (projectFilter !== 'all' && p.status !== projectFilter) return false;
      if (projectSearchQuery) {
        const q = projectSearchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.customerName && p.customerName.toLowerCase().includes(q)) ||
          (p.siteAddress && p.siteAddress.toLowerCase().includes(q))
        );
      }
      return true;
    });

    container.innerHTML = `
      <div class="page-top-bar">
        <div>
          <h1 class="page-main-title">Projects Hub</h1>
          <p class="page-sub-title">Track sites, materials sold, labour efforts & customer income</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-create-new-project">
          <span>+ New Project</span>
        </button>
      </div>

      <div class="search-filter-row">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            id="project-search-input" 
            placeholder="Search projects, client or site..." 
            value="${projectSearchQuery}"
          />
          ${projectSearchQuery ? `<button id="clear-search-btn" class="clear-search">×</button>` : ''}
        </div>

        <div class="filter-pills-row">
          <button class="filter-pill ${projectFilter === 'all' ? 'active' : ''}" data-filter="all">All (${allProjects.length})</button>
          <button class="filter-pill ${projectFilter === 'in_progress' ? 'active' : ''}" data-filter="in_progress">In Progress (${allProjects.filter(p => p.status === 'in_progress').length})</button>
          <button class="filter-pill ${projectFilter === 'completed' ? 'active' : ''}" data-filter="completed">Completed (${allProjects.filter(p => p.status === 'completed').length})</button>
          <button class="filter-pill ${projectFilter === 'on_hold' ? 'active' : ''}" data-filter="on_hold">On Hold (${allProjects.filter(p => p.status === 'on_hold').length})</button>
        </div>
      </div>

      ${filteredProjects.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon">🏗️</div>
          <div class="empty-title">${projectSearchQuery ? 'No Matching Projects' : 'No Projects Found'}</div>
          <p class="empty-desc">Create a new customer construction project.</p>
          <button class="btn btn-primary btn-sm" id="empty-create-project-btn">+ Add New Project</button>
        </div>
      ` : `
        <div class="projects-card-grid">
          ${filteredProjects.map(project => {
            const fin = store.getProjectFinancials(project);
            const labourStats = store.getProjectLabourStats(project.id);
            const percentCollected = fin.estimatedValue > 0 
              ? Math.min(100, Math.round((fin.totalCollected / fin.estimatedValue) * 100))
              : 100;
            
            const waMsg = `Hello ${project.customerName || 'Sir/Madam'}, this is an update regarding ${project.name}. Total collected so far: ${formatCurrency(fin.totalCollected, currency)}. Remaining balance: ${formatCurrency(fin.pendingBalance, currency)}. - ${settings.companyName || 'BuilderMate'}`;

            return `
              <div class="project-card" data-id="${project.id}">
                <div class="project-card-header">
                  <div>
                    <h3 class="project-name-heading">${project.name}</h3>
                    <div class="project-client-name">
                      <span>👤 ${project.customerName || 'Direct Site / No Client'}</span>
                    </div>
                    ${project.siteAddress ? `
                      <div class="project-address-text">
                        <span>📍 ${project.siteAddress}</span>
                      </div>
                    ` : ''}
                  </div>
                  <div class="proj-header-right">
                    <span class="status-tag status-${project.status}">
                      ${project.status === 'in_progress' ? 'In Progress' : project.status === 'completed' ? 'Completed' : 'On Hold'}
                    </span>
                  </div>
                </div>

                ${project.customerPhone ? `
                  <div class="customer-contact-bar">
                    <span class="contact-phone-badge">📞 ${project.customerPhone}</span>
                    <div class="contact-actions">
                      <a 
                        href="${getWhatsAppLink(project.customerPhone, waMsg)}" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        class="btn-contact-action btn-wa" 
                        title="WhatsApp Customer"
                      >
                        WhatsApp
                      </a>
                      <a 
                        href="${getTelLink(project.customerPhone)}" 
                        class="btn-contact-action btn-call" 
                        title="Call Customer"
                      >
                        Call
                      </a>
                    </div>
                  </div>
                ` : ''}

                <div class="project-finance-box">
                  <div class="finance-grid">
                    <div class="fin-item">
                      <span class="fin-lbl">Collected</span>
                      <strong class="fin-val income-color">${formatCurrency(fin.totalCollected, currency)}</strong>
                    </div>
                    <div class="fin-item">
                      <span class="fin-lbl">Est. Total</span>
                      <strong class="fin-val">${formatCurrency(fin.estimatedValue, currency)}</strong>
                    </div>
                    <div class="fin-item">
                      <span class="fin-lbl">Balance Due</span>
                      <strong class="fin-val ${fin.pendingBalance > 0 ? 'text-amber' : 'income-color'}">
                        ${formatCurrency(fin.pendingBalance, currency)}
                      </strong>
                    </div>
                  </div>

                  <div class="project-progress-wrap">
                    <div class="progress-bar-bg">
                      <div class="progress-bar-fill" style="width: ${percentCollected}%"></div>
                    </div>
                    <span class="progress-text">${percentCollected}% Paid</span>
                  </div>
                </div>

                <div class="project-materials-snippet">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px">
                    <span class="mat-snippet-title">Products (${project.materials ? project.materials.length : 0}) & Labours (${labourStats.workerStats.length} workers, ${labourStats.totalDays}d):</span>
                  </div>
                  <div class="materials-tag-cloud">
                    ${labourStats.workerStats.slice(0, 2).map(ws => `
                      <span class="mat-tag" style="background-color:rgba(59,130,246,0.1); color:#3b82f6">
                        👷 ${ws.labour.name}: <strong>${ws.daysWorked}d</strong>
                      </span>
                    `).join('')}
                    ${(!project.materials || project.materials.length === 0) && labourStats.workerStats.length === 0 ? `
                      <span class="text-muted text-xs">No materials or labour logged yet</span>
                    ` : (project.materials || []).slice(0, 3).map(m => `
                      <span class="mat-tag">${m.name}: <strong>${formatNumber(m.quantity)} ${m.unit}</strong></span>
                    `).join('')}
                  </div>
                </div>

                <div class="project-card-footer">
                  <button class="btn btn-outline btn-sm btn-view-project" data-id="${project.id}">
                    <span>📊 Details & Labours</span>
                  </button>
                  <button class="btn btn-secondary btn-sm btn-quick-payment" data-id="${project.id}">
                    <span>+ Collect Money</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    // Event listeners
    container.querySelector('#btn-create-new-project')?.addEventListener('click', () => openModal('new-project-modal'));
    container.querySelector('#empty-create-project-btn')?.addEventListener('click', () => openModal('new-project-modal'));

    const searchInput = container.querySelector('#project-search-input');
    searchInput?.addEventListener('input', (e) => {
      projectSearchQuery = e.target.value;
      renderProjects(container);
    });

    container.querySelector('#clear-search-btn')?.addEventListener('click', () => {
      projectSearchQuery = '';
      renderProjects(container);
    });

    container.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        projectFilter = pill.dataset.filter;
        renderProjects(container);
      });
    });

    container.querySelectorAll('.btn-view-project').forEach(btn => {
      btn.addEventListener('click', () => openProjectDetailsModal(btn.dataset.id));
    });

    container.querySelectorAll('.btn-quick-payment').forEach(btn => {
      btn.addEventListener('click', () => openRecordPaymentModal(btn.dataset.id));
    });
  }

  // --- PROJECT DETAILS DRAWER WITH COLLAPSIBLE ACCORDION DROPDOWNS ---
  function openProjectDetailsModal(projectId, defaultExpanded = 'labours') {
    const project = store.getProjectById(projectId);
    if (!project) return;

    const settings = store.getSettings();
    const currency = settings.currency || '₹';
    const fin = store.getProjectFinancials(project);
    const labourStats = store.getProjectLabourStats(projectId);

    const modalContainer = document.getElementById('project-details-modal-content');
    if (!modalContainer) return;

    const waSummary = `*${settings.companyName || 'BuilderMate'} - Project Statement*\nProject: *${project.name}*\nClient: *${project.customerName || '-'}*\n\n*Materials / Work Done:*\n${(project.materials || []).map(m => `• ${m.name}: ${m.quantity} ${m.unit} @ ${currency}${m.rate} = ${currency}${m.total}`).join('\n') || 'None'}\n\n*Site Labours & Efforts:*\n• Total Site Days: *${labourStats.totalDays} days*\n• Labour Wages: *${currency} ${labourStats.totalLabourCost}*\n\n*Financials:*\n• Total Billed/Est: *${currency} ${fin.estimatedValue}*\n• Total Paid: *${currency} ${fin.totalCollected}*\n• *Remaining Balance Due: ${currency} ${fin.pendingBalance}*\n\nThank you!`;

    modalContainer.innerHTML = `
      <div class="sheet-header">
        <div>
          <span class="status-tag status-${project.status}">
            ${project.status === 'in_progress' ? 'In Progress' : project.status === 'completed' ? 'Completed' : 'On Hold'}
          </span>
          <h2 class="sheet-title">${project.name}</h2>
          <p class="text-muted text-sm">Site: ${project.siteAddress || 'Main Site'} • Started: ${formatDate(project.startDate)}</p>
        </div>
        <button class="sheet-close-btn" data-close-modal="project-details-modal" aria-label="Close">×</button>
      </div>

      <div class="sheet-body">
        <div class="client-details-card">
          <div class="client-info-row">
            <div><strong>Client:</strong> ${project.customerName || 'No Client Name'}</div>
            ${project.customerPhone ? `<div><strong>Phone:</strong> ${project.customerPhone}</div>` : ''}
          </div>
          ${project.siteAddress ? `<div class="client-address-row"><strong>Site:</strong> ${project.siteAddress}</div>` : ''}
          
          ${project.customerPhone ? `
            <div class="client-actions-grid">
              <a href="${getWhatsAppLink(project.customerPhone, waSummary)}" target="_blank" class="btn btn-wa btn-sm">
                💬 WhatsApp Summary
              </a>
              <a href="${getTelLink(project.customerPhone)}" class="btn btn-outline btn-sm">
                📞 Direct Call
              </a>
            </div>
          ` : ''}
        </div>

        <div class="proj-sheet-finance-grid">
          <div class="fin-box-sm">
            <span class="lbl">Est. Budget</span>
            <strong>${formatCurrency(fin.estimatedValue, currency)}</strong>
          </div>
          <div class="fin-box-sm">
            <span class="lbl">Collected</span>
            <strong class="income-color">${formatCurrency(fin.totalCollected, currency)}</strong>
          </div>
          <div class="fin-box-sm">
            <span class="lbl">Labour Cost</span>
            <strong class="spend-color">${formatCurrency(labourStats.totalLabourCost, currency)}</strong>
          </div>
        </div>

        <!-- COLLAPSIBLE ACCORDION DROPDOWN SECTIONS -->
        <div class="project-accordions-group">

          <!-- ACCORDION 1: LABOURS & SITE EFFORTS -->
          <div class="proj-accordion-card ${defaultExpanded === 'labours' ? 'expanded' : ''}" id="acc-card-labours">
            <button type="button" class="proj-accordion-header" data-target="acc-card-labours">
              <div class="proj-accordion-title-wrap">
                <span class="proj-accordion-icon">👷</span>
                <span class="proj-accordion-title">Labours & Site Efforts</span>
                <span class="proj-accordion-badge">${labourStats.workerStats.length} Workers • ${labourStats.totalDays}d</span>
              </div>
              <svg class="proj-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>

            <div class="proj-accordion-content">
              <div class="section-header-flex" style="margin-bottom:10px">
                <span class="text-xs text-muted">Track work days, daily wages & site salary payouts</span>
                <div style="display:flex; gap:6px">
                  <button class="btn btn-primary btn-xs" id="btn-add-proj-effort">+ Log Effort (Days)</button>
                  <button class="btn btn-secondary btn-xs" id="btn-add-proj-lab-payout">+ Pay Worker</button>
                </div>
              </div>

              <div class="inventory-overview-grid" style="grid-template-columns:1fr 1fr 1fr; margin-bottom:12px">
                <div class="inv-kpi-card" style="padding:8px 6px">
                  <span class="kpi-lbl" style="font-size:0.62rem">Wages Cost</span>
                  <strong class="kpi-val spend-color" style="font-size:0.85rem">${formatCurrency(labourStats.totalLabourCost, currency)}</strong>
                </div>
                <div class="inv-kpi-card" style="padding:8px 6px">
                  <span class="kpi-lbl" style="font-size:0.62rem">Paid on Site</span>
                  <strong class="kpi-val text-primary" style="font-size:0.85rem">${formatCurrency(labourStats.totalLabourPaid, currency)}</strong>
                </div>
                <div class="inv-kpi-card" style="padding:8px 6px">
                  <span class="kpi-lbl" style="font-size:0.62rem">Total Days</span>
                  <strong class="kpi-val" style="font-size:0.85rem">${labourStats.totalDays} Days</strong>
                </div>
              </div>

              ${labourStats.workerStats.length === 0 ? `
                <div class="empty-table-msg">
                  No workers logged on this project yet. Tap <strong>"+ Log Effort (Days)"</strong> to assign workers with single or multiple days.
                </div>
              ` : `
                <div class="proj-workers-list">
                  ${labourStats.workerStats.map(ws => {
                    const slipMsg = `*${settings.companyName || 'BuilderMate'} - Site Wage Slip*\nProject: *${project.name}*\nWorker: *${ws.labour.name}* (${ws.labour.role})\nRate: *${currency}${ws.labour.wageRate} / day*\n\n• Days Worked on Site: *${ws.daysWorked} days*\n• Wages Earned on Site: *${currency} ${ws.earned}*\n• Paid on Site: *${currency} ${ws.paid}*\n• *Remaining Balance on Site: ${currency} ${ws.balanceDue}*\n\nThank you!`;

                    return `
                      <div class="proj-labour-card">
                        <div class="proj-labour-top">
                          <div>
                            <span class="proj-labour-name">${ws.labour.name}</span>
                            <div class="proj-labour-role">${ws.labour.role} • ${currency}${ws.labour.wageRate}/day</div>
                          </div>
                          <div style="display:flex; gap:6px; align-items:center">
                            ${ws.labour.phone ? `
                              <a href="${getWhatsAppLink(ws.labour.phone, slipMsg)}" target="_blank" class="btn btn-wa btn-xs" title="Send Site Wage Slip">
                                💬 Slip
                              </a>
                            ` : ''}
                          </div>
                        </div>

                        <div class="proj-labour-metrics">
                          <div class="proj-labour-stat">
                            <span class="lbl">Days on Site</span>
                            <strong>${ws.daysWorked} Days</strong>
                          </div>
                          <div class="proj-labour-stat">
                            <span class="lbl">Earned on Site</span>
                            <strong class="spend-color">${formatCurrency(ws.earned, currency)}</strong>
                          </div>
                          <div class="proj-labour-stat">
                            <span class="lbl">Site Balance</span>
                            <strong class="${ws.balanceDue > 0 ? 'text-amber' : 'income-color'}">${formatCurrency(ws.balanceDue, currency)}</strong>
                          </div>
                        </div>

                        <!-- Quick Days Increment Strip -->
                        <div class="quick-days-strip">
                          <span class="text-xs text-muted font-bold">Quick Add:</span>
                          <button type="button" class="btn-day-increment btn-quick-add-days" data-lab-id="${ws.labour.id}" data-days="1">+1 Day</button>
                          <button type="button" class="btn-day-increment btn-quick-add-days" data-lab-id="${ws.labour.id}" data-days="5">+5 Days</button>
                          <button type="button" class="btn-day-increment btn-quick-add-days" data-lab-id="${ws.labour.id}" data-days="10">+10 Days</button>
                          <button type="button" class="btn-day-increment btn-custom-add-days" data-lab-id="${ws.labour.id}" data-name="${ws.labour.name}" data-rate="${ws.labour.wageRate}">+ Custom Days</button>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}

              <!-- Activity Log of Days -->
              ${labourStats.projectEffortLogs.length > 0 ? `
                <div style="margin-top:14px">
                  <h4 class="drawer-section-title" style="font-size:0.78rem">📋 Site Effort Activity (${labourStats.projectEffortLogs.length} logs)</h4>
                  <div class="mat-list-items">
                    ${labourStats.projectEffortLogs.slice(0, 8).map(log => `
                      <div class="att-row-item">
                        <div>
                          <strong>${log.labourName}</strong> (${log.labourRole})
                          <div class="text-muted text-xs">${formatDate(log.date)} • <strong>${log.days} day(s)</strong> (${currency}${log.earned})</div>
                          ${log.notes ? `<div class="text-muted text-xs font-italic">${log.notes}</div>` : ''}
                        </div>
                        <button class="btn-delete-item btn-del-proj-effort" data-lab-id="${log.labourId}" data-att-id="${log.id}" title="Remove Effort Log">🗑️</button>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- ACCORDION 2: MATERIALS SOLD / USED -->
          <div class="proj-accordion-card ${defaultExpanded === 'materials' ? 'expanded' : ''}" id="acc-card-materials">
            <button type="button" class="proj-accordion-header" data-target="acc-card-materials">
              <div class="proj-accordion-title-wrap">
                <span class="proj-accordion-icon">🧱</span>
                <span class="proj-accordion-title">Materials Sold / Used</span>
                <span class="proj-accordion-badge">${project.materials ? project.materials.length : 0} Items • ${formatCurrency(fin.materialsTotal, currency)}</span>
              </div>
              <svg class="proj-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>

            <div class="proj-accordion-content">
              <div class="section-header-flex" style="margin-bottom:10px">
                <span class="text-xs text-muted">Bricks, steel, cement, sand, aggregates, etc.</span>
                <button class="btn btn-primary btn-xs" id="btn-add-project-material">+ Add Material</button>
              </div>

              <div class="material-items-table-wrap">
                ${(!project.materials || project.materials.length === 0) ? `
                  <div class="empty-table-msg">No materials added yet. Tap <strong>"+ Add Material"</strong> to record materials used on this site.</div>
                ` : `
                  <div class="mat-list-items">
                    ${project.materials.map(m => `
                      <div class="mat-row-item">
                        <div class="mat-row-left">
                          <strong class="mat-name-txt">${m.name}</strong>
                          <div class="mat-rate-txt">${formatNumber(m.quantity)} ${m.unit} × ${formatCurrency(m.rate, currency)}</div>
                        </div>
                        <div class="mat-row-right">
                          <strong class="mat-total-txt">${formatCurrency(m.total, currency)}</strong>
                          <button class="btn-delete-item btn-del-material" data-mat-id="${m.id}" title="Remove Material">🗑️</button>
                        </div>
                      </div>
                    `).join('')}
                    <div class="mat-row-summary">
                      <span>Total Materials Value:</span>
                      <strong>${formatCurrency(fin.materialsTotal, currency)}</strong>
                    </div>
                  </div>
                `}
              </div>
            </div>
          </div>

          <!-- ACCORDION 3: MONEY COLLECTED (INCOME) -->
          <div class="proj-accordion-card ${defaultExpanded === 'payments' ? 'expanded' : ''}" id="acc-card-payments">
            <button type="button" class="proj-accordion-header" data-target="acc-card-payments">
              <div class="proj-accordion-title-wrap">
                <span class="proj-accordion-icon">💰</span>
                <span class="proj-accordion-title">Money Collected (Income)</span>
                <span class="proj-accordion-badge income-color">+${formatCurrency(fin.totalCollected, currency)}</span>
              </div>
              <svg class="proj-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>

            <div class="proj-accordion-content">
              <div class="section-header-flex" style="margin-bottom:10px">
                <span class="text-xs text-muted">Customer advance receipts & milestone payments</span>
                <button class="btn btn-secondary btn-xs" id="btn-record-proj-payment">+ Collect Money</button>
              </div>

              <div class="payments-items-wrap">
                ${(!project.payments || project.payments.length === 0) ? `
                  <div class="empty-table-msg">No payments collected yet. Tap <strong>"+ Collect Money"</strong> to record receipts.</div>
                ` : `
                  <div class="payment-list-items">
                    ${project.payments.map(p => `
                      <div class="payment-row-item">
                        <div class="pay-row-left">
                          <div class="pay-date-badge">${formatDate(p.date)}</div>
                          <div>
                            <strong class="income-color">+${formatCurrency(p.amount, currency)}</strong>
                            <span class="pay-mode-pill">${p.mode}</span>
                          </div>
                          ${p.notes ? `<p class="pay-notes-text">${p.notes}</p>` : ''}
                        </div>
                        <div class="pay-row-right">
                          <button class="btn-delete-item btn-del-payment" data-pay-id="${p.id}" title="Delete Payment">🗑️</button>
                        </div>
                      </div>
                    `).join('')}
                    <div class="mat-row-summary">
                      <span>Total Income from Project:</span>
                      <strong class="income-color">${formatCurrency(fin.totalCollected, currency)}</strong>
                    </div>
                  </div>
                `}
              </div>
            </div>
          </div>

          <!-- ACCORDION 4: PROJECT SETTINGS & STATUS -->
          <div class="proj-accordion-card ${defaultExpanded === 'settings' ? 'expanded' : ''}" id="acc-card-settings">
            <button type="button" class="proj-accordion-header" data-target="acc-card-settings">
              <div class="proj-accordion-title-wrap">
                <span class="proj-accordion-icon">⚙️</span>
                <span class="proj-accordion-title">Project Status & Delete</span>
              </div>
              <svg class="proj-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>

            <div class="proj-accordion-content">
              <div class="drawer-section">
                <h4 class="drawer-section-title">Change Project Status</h4>
                <div class="status-buttons-row">
                  <button class="btn btn-sm ${project.status === 'in_progress' ? 'btn-primary' : 'btn-outline'} btn-set-status" data-status="in_progress">
                    In Progress
                  </button>
                  <button class="btn btn-sm ${project.status === 'completed' ? 'btn-primary' : 'btn-outline'} btn-set-status" data-status="completed">
                    Completed
                  </button>
                  <button class="btn btn-sm ${project.status === 'on_hold' ? 'btn-primary' : 'btn-outline'} btn-set-status" data-status="on_hold">
                    On Hold
                  </button>
                </div>
              </div>

              <div class="sheet-danger-footer">
                <button class="btn btn-danger btn-sm" id="btn-delete-project">
                  Delete Project
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    // Accordion Header Click Toggle Handler
    modalContainer.querySelectorAll('.proj-accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const cardId = header.dataset.target;
        const targetCard = modalContainer.querySelector(`#${cardId}`);
        const isCurrentlyExpanded = targetCard.classList.contains('expanded');

        // Collapse all cards and expand selected
        modalContainer.querySelectorAll('.proj-accordion-card').forEach(c => c.classList.remove('expanded'));
        if (!isCurrentlyExpanded) {
          targetCard.classList.add('expanded');
        }
      });
    });

    // Quick Add Days (+1d, +5d, +10d)
    modalContainer.querySelectorAll('.btn-quick-add-days').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const labId = btn.dataset.labId;
        const days = Number(btn.dataset.days) || 1;
        store.quickIncrementWorkerDays(projectId, labId, days);
        showToast(`Added +${days} day(s) effort for worker!`);
        openProjectDetailsModal(projectId, 'labours');
      });
    });

    // Custom Days Add
    modalContainer.querySelectorAll('.btn-custom-add-days').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openProjectEffortModal(projectId, btn.dataset.labId);
      });
    });

    // Labours & Efforts Action Listeners
    modalContainer.querySelector('#btn-add-proj-effort')?.addEventListener('click', () => openProjectEffortModal(projectId));
    modalContainer.querySelector('#btn-add-proj-lab-payout')?.addEventListener('click', () => openProjectLabourPayoutModal(projectId));

    modalContainer.querySelectorAll('.btn-del-proj-effort').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this site effort entry?')) {
          store.deleteLabourAttendance(btn.dataset.labId, btn.dataset.attId);
          showToast('Effort log removed');
          openProjectDetailsModal(projectId, 'labours');
        }
      });
    });

    // Material & Payment listeners
    modalContainer.querySelector('#btn-add-project-material')?.addEventListener('click', () => openAddProjectMaterialModal(projectId));
    modalContainer.querySelector('#btn-record-proj-payment')?.addEventListener('click', () => openRecordPaymentModal(projectId));

    modalContainer.querySelectorAll('.btn-del-material').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Remove this material item from project?')) {
          store.deleteProjectMaterial(projectId, btn.dataset.matId);
          showToast('Material removed');
          openProjectDetailsModal(projectId, 'materials');
        }
      });
    });

    modalContainer.querySelectorAll('.btn-del-payment').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this payment record? This reduces total income count.')) {
          store.deleteProjectPayment(projectId, btn.dataset.payId);
          showToast('Payment deleted', 'info');
          openProjectDetailsModal(projectId, 'payments');
        }
      });
    });

    modalContainer.querySelectorAll('.btn-set-status').forEach(btn => {
      btn.addEventListener('click', () => {
        store.updateProject(projectId, { status: btn.dataset.status });
        showToast('Status updated');
        openProjectDetailsModal(projectId, 'settings');
      });
    });

    modalContainer.querySelector('#btn-delete-project')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this entire project?')) {
        store.deleteProject(projectId);
        closeModal('project-details-modal');
        showToast('Project deleted', 'info');
        renderCurrentTab();
      }
    });

    openModal('project-details-modal');
  }

  // --- LOG PROJECT LABOUR EFFORT MODAL (SUPPORTS MULTIPLE DAYS & CONTRACTS) ---
  function openProjectEffortModal(projectId, prefillLabourId = '') {
    const project = store.getProjectById(projectId);
    if (!project) return;

    const container = document.getElementById('log-labour-modal-content');
    if (!container) return;

    const labours = store.getLabours();
    const currency = store.getSettings().currency || '₹';
    const prefillWorker = prefillLabourId ? store.getLabourById(prefillLabourId) : (labours.length > 0 ? labours[0] : null);

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Log Worker Days / Effort</h3>
          <p class="text-muted text-xs">Project: ${project.name}</p>
        </div>
        <button class="modal-close-btn" data-close-modal="log-labour-modal" aria-label="Close">×</button>
      </div>

      <form id="form-log-project-effort" class="modal-form">
        <div class="form-group">
          <label class="form-label">Worker *</label>
          <select id="peffort-labour-id" class="form-select" required>
            <option value="">-- Choose Existing Worker --</option>
            ${labours.map(l => `
              <option value="${l.id}" ${(l.id === prefillLabourId || (!prefillLabourId && l === prefillWorker)) ? 'selected' : ''}>
                ${l.name} (${l.role} - ${currency}${l.wageRate}/day)
              </option>
            `).join('')}
            <option value="__new__">+ Add New Worker</option>
          </select>
        </div>

        <div id="new-worker-quick-fields" style="display:none; background:var(--bg-subtle); padding:10px; border-radius:var(--radius-md); margin-bottom:12px">
          <div class="form-group">
            <label class="form-label">New Worker Name *</label>
            <input type="text" id="peffort-new-name" class="form-input" placeholder="e.g. Anand Mistri" />
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Role</label>
              <select id="peffort-new-role" class="form-select">
                ${LABOUR_ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Daily Wage Rate (${currency}) *</label>
              <input type="number" step="any" id="peffort-new-rate" class="form-input font-bold" placeholder="e.g. 900" />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Number of Days / Shifts Worked *</label>
          <div class="quick-preset-chips" style="margin-bottom:6px">
            <button type="button" class="chip-btn chip-days-preset" data-days="1">1 Day</button>
            <button type="button" class="chip-btn chip-days-preset" data-days="7">7 Days (1 Wk)</button>
            <button type="button" class="chip-btn chip-days-preset" data-days="15">15 Days</button>
            <button type="button" class="chip-btn chip-days-preset" data-days="30">30 Days (1 Mo)</button>
          </div>
          <input 
            type="number" 
            step="any" 
            id="peffort-days" 
            class="form-input form-input-lg font-bold" 
            placeholder="e.g. 15 or 30 days" 
            value="1" 
            required 
            autofocus 
          />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Wage Rate / Day (${currency}) *</label>
            <input 
              type="number" 
              step="any" 
              id="peffort-rate" 
              class="form-input font-bold" 
              value="${prefillWorker ? prefillWorker.wageRate : 850}" 
              required 
            />
          </div>
          <div class="form-group">
            <label class="form-label">Calculated Wages Cost</label>
            <input 
              type="text" 
              id="peffort-total-preview" 
              class="form-input font-bold spend-color" 
              readonly 
            />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Date Logged</label>
            <input type="date" id="peffort-date" class="form-input" value="${getTodayDateString()}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Task / Description</label>
            <input type="text" id="peffort-notes" class="form-input" placeholder="e.g. Brick work, plastering, 2nd slab" />
          </div>
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="log-labour-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Days & Add to Site</button>
        </div>
      </form>
    `;

    const labSelect = container.querySelector('#peffort-labour-id');
    const newFields = container.querySelector('#new-worker-quick-fields');
    const daysInput = container.querySelector('#peffort-days');
    const rateInput = container.querySelector('#peffort-rate');
    const totalPreview = container.querySelector('#peffort-total-preview');

    function calculatePreview() {
      const d = Number(daysInput.value) || 0;
      const r = Number(rateInput.value) || 0;
      totalPreview.value = formatCurrency(Math.round(d * r), currency);
    }

    daysInput.addEventListener('input', calculatePreview);
    rateInput.addEventListener('input', calculatePreview);
    calculatePreview();

    container.querySelectorAll('.chip-days-preset').forEach(chip => {
      chip.addEventListener('click', () => {
        daysInput.value = chip.dataset.days;
        calculatePreview();
      });
    });

    labSelect.addEventListener('change', () => {
      if (labSelect.value === '__new__') {
        newFields.style.display = 'block';
        container.querySelector('#peffort-new-name').focus();
      } else {
        newFields.style.display = 'none';
        const chosen = store.getLabourById(labSelect.value);
        if (chosen) {
          rateInput.value = chosen.wageRate || 0;
          calculatePreview();
        }
      }
    });

    const form = container.querySelector('#form-log-project-effort');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let targetLabourId = labSelect.value;
      const days = Number(daysInput.value) || 1;
      const rate = Number(rateInput.value) || 0;
      const totalCost = Math.round(days * rate);

      if (targetLabourId === '__new__') {
        const newName = container.querySelector('#peffort-new-name').value.trim();
        const newRate = Number(container.querySelector('#peffort-new-rate').value) || rate;
        const newRole = container.querySelector('#peffort-new-role').value;

        if (!newName || newRate <= 0) {
          showToast('Please enter worker name and valid wage rate', 'error');
          return;
        }

        const created = store.addLabour({
          name: newName,
          role: newRole,
          wageType: 'daily',
          wageRate: newRate
        });
        targetLabourId = created.id;
      }

      if (!targetLabourId) {
        showToast('Please select or add a worker', 'error');
        return;
      }

      const date = container.querySelector('#peffort-date').value;
      const notes = container.querySelector('#peffort-notes').value.trim();

      store.logLabourAttendance(targetLabourId, {
        date: date,
        days: days,
        rate: rate,
        totalCost: totalCost,
        status: days > 1 ? 'multi_days' : 'full_day',
        projectId: projectId,
        notes: notes
      });

      closeModal('log-labour-modal');
      showToast(`Logged ${days} day(s) effort for worker on project!`);
      openProjectDetailsModal(projectId, 'labours');
    });

    openModal('log-labour-modal');
  }

  // --- RECORD PROJECT LABOUR PAYOUT MODAL ---
  function openProjectLabourPayoutModal(projectId) {
    const project = store.getProjectById(projectId);
    if (!project) return;

    const container = document.getElementById('log-labour-modal-content');
    if (!container) return;

    const labours = store.getLabours();
    const currency = store.getSettings().currency || '₹';

    if (labours.length === 0) {
      showToast('Please add workers first before recording wage payouts', 'error');
      openProjectEffortModal(projectId);
      return;
    }

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Pay Worker on Site (Spend)</h3>
          <p class="text-muted text-xs">Project: ${project.name}</p>
        </div>
        <button class="modal-close-btn" data-close-modal="log-labour-modal" aria-label="Close">×</button>
      </div>

      <form id="form-pay-proj-labour" class="modal-form">
        <div class="form-group">
          <label class="form-label">Worker *</label>
          <select id="ppay-labour-id" class="form-select" required>
            ${labours.map(l => `
              <option value="${l.id}">${l.name} (${l.role} - ${currency}${l.wageRate}/day)</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Payout Amount (${currency}) *</label>
          <input type="number" step="any" id="ppay-amount" class="form-input form-input-lg font-bold spend-color" placeholder="0.00" required autofocus />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Payment Mode</label>
            <select id="ppay-mode" class="form-select">
              <option value="Cash">Cash</option>
              <option value="UPI / GPay">UPI / GPay / PhonePe</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Payment Date</label>
            <input type="date" id="ppay-date" class="form-input" value="${getTodayDateString()}" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <input type="text" id="ppay-notes" class="form-input" placeholder="e.g. Weekly site wages advance" />
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="log-labour-modal">Cancel</button>
          <button type="submit" class="btn btn-danger">Record Payout & Add to Spends</button>
        </div>
      </form>
    `;

    const form = container.querySelector('#form-pay-proj-labour');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const labId = container.querySelector('#ppay-labour-id').value;
      const amount = Number(container.querySelector('#ppay-amount').value);

      if (!amount || amount <= 0) {
        showToast('Please enter a valid payout amount', 'error');
        return;
      }

      store.addLabourPayout(labId, {
        amount: amount,
        type: 'Site Wage',
        mode: container.querySelector('#ppay-mode').value,
        date: container.querySelector('#ppay-date').value,
        projectId: projectId,
        notes: container.querySelector('#ppay-notes').value.trim()
      });

      closeModal('log-labour-modal');
      showToast(`Paid ${formatCurrency(amount, currency)} on site! Added to Spends.`);
      openProjectDetailsModal(projectId, 'labours');
    });

    openModal('log-labour-modal');
  }

  // --- ADD PROJECT MATERIAL MODAL ---
  function openAddProjectMaterialModal(projectId) {
    const container = document.getElementById('add-material-modal-content');
    if (!container) return;

    const inventoryItems = store.getInventory();

    container.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Add Material Sold / Used</h3>
        <button class="modal-close-btn" data-close-modal="add-material-modal" aria-label="Close">×</button>
      </div>
      <form id="form-add-project-material" class="modal-form">
        <div class="form-group">
          <label class="form-label">Material Name *</label>
          <div class="quick-preset-chips">
            ${PRESET_MATERIALS.slice(0, 5).map(pm => `
              <button type="button" class="chip-btn chip-mat-select" data-name="${pm.name}" data-unit="${pm.unit}">
                ${pm.icon} ${pm.name}
              </button>
            `).join('')}
          </div>
          <input 
            type="text" 
            id="pmat-name" 
            list="inventory-suggestions" 
            class="form-input" 
            placeholder="e.g. Red Bricks, Steel 12mm, Cement..." 
            required 
          />
          <datalist id="inventory-suggestions">
            ${inventoryItems.map(inv => `<option value="${inv.name}">Stock: ${inv.currentStock} ${inv.unit}</option>`).join('')}
          </datalist>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Quantity *</label>
            <input type="number" step="any" id="pmat-qty" class="form-input" placeholder="e.g. 5000" required />
          </div>
          <div class="form-group">
            <label class="form-label">Unit Metric *</label>
            <select id="pmat-unit" class="form-select">
              <option value="Numbers">Numbers (Units)</option>
              <option value="Kg">Kg</option>
              <option value="Bags">Bags</option>
              <option value="Ton">Ton</option>
              <option value="CFT">CFT (Cubic Feet)</option>
              <option value="Tins">Tins</option>
              <option value="Boxes">Boxes</option>
              <option value="Coils">Coils</option>
              <option value="Liters">Liters</option>
              <option value="Loads">Loads (Tractor/Truck)</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Unit Cost / Selling Rate *</label>
            <input type="number" step="any" id="pmat-rate" class="form-input" placeholder="Rate per unit" required />
          </div>
          <div class="form-group">
            <label class="form-label">Calculated Total</label>
            <input type="text" id="pmat-total-preview" class="form-input font-bold" readonly placeholder="0.00" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" id="pmat-date" class="form-input" value="${getTodayDateString()}" />
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="add-material-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Material</button>
        </div>
      </form>
    `;

    const qtyInput = container.querySelector('#pmat-qty');
    const rateInput = container.querySelector('#pmat-rate');
    const totalPreview = container.querySelector('#pmat-total-preview');
    const nameInput = container.querySelector('#pmat-name');
    const unitSelect = container.querySelector('#pmat-unit');

    function updateTotal() {
      const q = Number(qtyInput.value) || 0;
      const r = Number(rateInput.value) || 0;
      totalPreview.value = (q * r).toFixed(2);
    }

    qtyInput.addEventListener('input', updateTotal);
    rateInput.addEventListener('input', updateTotal);

    container.querySelectorAll('.chip-mat-select').forEach(chip => {
      chip.addEventListener('click', () => {
        nameInput.value = chip.dataset.name;
        unitSelect.value = chip.dataset.unit;
        const inv = inventoryItems.find(i => i.name.toLowerCase() === chip.dataset.name.toLowerCase());
        if (inv && inv.avgPurchasePrice) {
          rateInput.value = inv.avgPurchasePrice;
          updateTotal();
        }
      });
    });

    const form = container.querySelector('#form-add-project-material');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      store.addProjectMaterial(projectId, {
        name: nameInput.value.trim(),
        quantity: qtyInput.value,
        unit: unitSelect.value,
        rate: rateInput.value,
        date: container.querySelector('#pmat-date').value
      });

      closeModal('add-material-modal');
      showToast('Material added to project!');
      openProjectDetailsModal(projectId, 'materials');
    });

    openModal('add-material-modal');
  }

  // --- RECORD PAYMENT MODAL ---
  function openRecordPaymentModal(projectId) {
    const container = document.getElementById('record-payment-modal-content');
    if (!container) return;

    const project = store.getProjectById(projectId);
    if (!project) return;

    const fin = store.getProjectFinancials(project);

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Record Payment (Income)</h3>
          <p class="text-muted text-xs">Project: ${project.name}</p>
        </div>
        <button class="modal-close-btn" data-close-modal="record-payment-modal" aria-label="Close">×</button>
      </div>
      <form id="form-record-payment" class="modal-form">
        <div class="payment-balance-hint">
          <span>Current Outstanding Balance:</span>
          <strong class="text-amber">${formatCurrency(fin.pendingBalance, store.getSettings().currency)}</strong>
        </div>

        <div class="form-group">
          <label class="form-label">Amount Collected *</label>
          <input 
            type="number" 
            step="any" 
            id="pay-amount" 
            class="form-input form-input-lg font-mono" 
            placeholder="0.00" 
            required 
            autofocus 
          />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Payment Date</label>
            <input type="date" id="pay-date" class="form-input" value="${getTodayDateString()}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Payment Mode</label>
            <select id="pay-mode" class="form-select">
              <option value="UPI / GPay">UPI / GPay / PhonePe</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes / Receipt Reference</label>
          <input type="text" id="pay-notes" class="form-input" placeholder="e.g. 2nd slab advance, Cheque #12345" />
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="record-payment-modal">Cancel</button>
          <button type="submit" class="btn btn-secondary">Save & Add to Income</button>
        </div>
      </form>
    `;

    const form = container.querySelector('#form-record-payment');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = Number(container.querySelector('#pay-amount').value);
      if (!amount || amount <= 0) {
        showToast('Please enter a valid payment amount', 'error');
        return;
      }

      store.addProjectPayment(projectId, {
        amount: amount,
        date: container.querySelector('#pay-date').value,
        mode: container.querySelector('#pay-mode').value,
        notes: container.querySelector('#pay-notes').value.trim()
      });

      closeModal('record-payment-modal');
      showToast(`Payment of ${formatCurrency(amount, store.getSettings().currency)} recorded into Income!`);
      
      const detailsModal = document.getElementById('project-details-modal');
      if (detailsModal && detailsModal.classList.contains('active')) {
        openProjectDetailsModal(projectId, 'payments');
      }
    });

    openModal('record-payment-modal');
  }

  // --- INVENTORY VIEW ---
  function renderInventory(container) {
    const settings = store.getSettings();
    const currency = settings.currency || '₹';
    const inventory = store.getInventory();

    const totalStockValuation = store.getTotalInventoryValuation();
    let totalPurchasesSpend = 0;
    inventory.forEach(item => {
      (item.purchases || []).forEach(p => {
        totalPurchasesSpend += Number(p.totalCost) || 0;
      });
    });

    const lowStockCount = inventory.filter(i => i.currentStock <= (i.minStockThreshold || 0)).length;

    let filteredItems = inventory.filter(item => {
      if (invCategory !== 'all' && item.category !== invCategory) return false;
      if (invSearchQuery) {
        const q = invSearchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.category && item.category.toLowerCase().includes(q))
        );
      }
      return true;
    });

    const categories = ['all', ...new Set(inventory.map(i => i.category).filter(Boolean))];

    container.innerHTML = `
      <div class="page-top-bar">
        <div>
          <h1 class="page-main-title">Inventory & Stock</h1>
          <p class="page-sub-title">Track materials bought, stock levels & purchase spends</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-buy-material-stock">
          <span>+ Buy Stock (Spend)</span>
        </button>
      </div>

      <div class="inventory-overview-grid">
        <div class="inv-kpi-card">
          <span class="kpi-lbl">Total Stock Valuation</span>
          <strong class="kpi-val income-color">${formatCurrency(totalStockValuation, currency)}</strong>
          <span class="kpi-sub">Current Asset Value</span>
        </div>
        <div class="inv-kpi-card">
          <span class="kpi-lbl">Material Purchases</span>
          <strong class="kpi-val spend-color">${formatCurrency(totalPurchasesSpend, currency)}</strong>
          <span class="kpi-sub">Total Spent on Stock</span>
        </div>
        <div class="inv-kpi-card">
          <span class="kpi-lbl">Stock Items</span>
          <strong class="kpi-val">${inventory.length} Items</strong>
          <span class="kpi-sub ${lowStockCount > 0 ? 'text-amber font-bold' : ''}">
            ${lowStockCount > 0 ? `⚠️ ${lowStockCount} Low` : 'All Healthy'}
          </span>
        </div>
      </div>

      <div class="search-filter-row">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            id="inv-search-input" 
            placeholder="Search materials (Bricks, Cement, Steel)..." 
            value="${invSearchQuery}"
          />
          ${invSearchQuery ? `<button id="clear-inv-search-btn" class="clear-search">×</button>` : ''}
        </div>

        <div class="filter-pills-row">
          ${categories.map(cat => `
            <button class="filter-pill ${invCategory === cat ? 'active' : ''}" data-cat="${cat}">
              ${cat === 'all' ? 'All Materials' : cat}
            </button>
          `).join('')}
        </div>
      </div>

      ${filteredItems.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon">📦</div>
          <div class="empty-title">No Stock Items Logged Yet</div>
          <p class="empty-desc">Record purchases of Bricks, Steel, Cement, Aggregates, Paint to build your inventory.</p>
          <button class="btn btn-primary btn-sm" id="empty-buy-stock-btn">+ Add First Stock Item</button>
        </div>
      ` : `
        <div class="inventory-card-grid">
          ${filteredItems.map(item => {
            const isLowStock = item.currentStock <= (item.minStockThreshold || 0);
            const totalItemValue = (item.currentStock || 0) * (item.avgPurchasePrice || 0);

            return `
              <div class="inventory-card ${isLowStock ? 'card-low-stock' : ''}" data-id="${item.id}">
                <div class="inv-card-top">
                  <div>
                    <span class="inv-cat-badge">${item.category || 'General'}</span>
                    <h3 class="inv-item-name">${item.name}</h3>
                  </div>
                  ${isLowStock ? `
                    <span class="status-tag status-low-stock">⚠️ Low Stock</span>
                  ` : `
                    <span class="status-tag status-in-stock">In Stock</span>
                  `}
                </div>

                <div class="inv-stock-highlight">
                  <div class="stock-qty-display">
                    <span class="stock-num">${formatNumber(item.currentStock)}</span>
                    <span class="stock-unit">${item.unit}</span>
                  </div>
                  <div class="stock-valuation-text">
                    Value: <strong>${formatCurrency(totalItemValue, currency)}</strong>
                  </div>
                </div>

                <div class="inv-details-row">
                  <div>
                    <span class="text-muted text-xs">Avg Buy Rate:</span>
                    <div class="font-mono text-sm">${formatCurrency(item.avgPurchasePrice, currency)} / ${item.unit}</div>
                  </div>
                  <div>
                    <span class="text-muted text-xs">Orders Logged:</span>
                    <div class="text-sm font-bold">${item.purchases ? item.purchases.length : 0} Orders</div>
                  </div>
                </div>

                <div class="inv-card-actions">
                  <button class="btn btn-primary btn-sm btn-quick-buy" data-id="${item.id}" data-name="${item.name}" data-unit="${item.unit}" data-price="${item.avgPurchasePrice}">
                    + Buy More
                  </button>
                  <button class="btn btn-outline btn-sm btn-view-inv-history" data-id="${item.id}">
                    History (${item.purchases ? item.purchases.length : 0})
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    container.querySelector('#btn-buy-material-stock')?.addEventListener('click', () => openBuyStockModal());
    container.querySelector('#empty-buy-stock-btn')?.addEventListener('click', () => openBuyStockModal());

    const searchInput = container.querySelector('#inv-search-input');
    searchInput?.addEventListener('input', (e) => {
      invSearchQuery = e.target.value;
      renderInventory(container);
    });

    container.querySelector('#clear-inv-search-btn')?.addEventListener('click', () => {
      invSearchQuery = '';
      renderInventory(container);
    });

    container.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        invCategory = pill.dataset.cat;
        renderInventory(container);
      });
    });

    container.querySelectorAll('.btn-quick-buy').forEach(btn => {
      btn.addEventListener('click', () => {
        openBuyStockModal(btn.dataset.id, btn.dataset.name, btn.dataset.unit, btn.dataset.price);
      });
    });

    container.querySelectorAll('.btn-view-inv-history').forEach(btn => {
      btn.addEventListener('click', () => {
        openInventoryHistoryModal(btn.dataset.id);
      });
    });
  }

  // --- BUY STOCK MODAL ---
  function openBuyStockModal(itemId = null, prefillName = '', prefillUnit = 'Numbers', prefillPrice = '') {
    const container = document.getElementById('buy-inventory-modal-content');
    if (!container) return;

    const inventory = store.getInventory();
    const existingItem = itemId ? store.getInventoryItemById(itemId) : null;

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Record Material Purchase (Spend)</h3>
          <p class="text-muted text-xs">Increments stock & adds purchase cost to Total Spends</p>
        </div>
        <button class="modal-close-btn" data-close-modal="buy-inventory-modal" aria-label="Close">×</button>
      </div>
      <form id="form-buy-inventory" class="modal-form">
        <div class="form-group">
          <label class="form-label">Material Name *</label>
          ${!itemId ? `
            <div class="quick-preset-chips">
              ${PRESET_MATERIALS.slice(0, 6).map(pm => `
                <button type="button" class="chip-btn chip-stock-select" data-name="${pm.name}" data-unit="${pm.unit}">
                  ${pm.icon} ${pm.name}
                </button>
              `).join('')}
            </div>
          ` : ''}
          <input 
            type="text" 
            id="buy-mat-name" 
            list="existing-inventory-list" 
            class="form-input" 
            placeholder="e.g. Red Bricks, UltraTech Cement, TMT 12mm Steel..." 
            value="${existingItem ? existingItem.name : prefillName}" 
            required 
            ${itemId ? 'readonly' : ''} 
          />
          <datalist id="existing-inventory-list">
            ${inventory.map(inv => `<option value="${inv.name}"></option>`).join('')}
          </datalist>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Quantity Bought *</label>
            <input type="number" step="any" id="buy-mat-qty" class="form-input" placeholder="e.g. 5000" required autofocus />
          </div>
          <div class="form-group">
            <label class="form-label">Unit Metric *</label>
            <select id="buy-mat-unit" class="form-select" ${itemId ? 'disabled' : ''}>
              <option value="Numbers" ${prefillUnit === 'Numbers' ? 'selected' : ''}>Numbers (Units)</option>
              <option value="Kg" ${prefillUnit === 'Kg' ? 'selected' : ''}>Kg (Kilograms)</option>
              <option value="Bags" ${prefillUnit === 'Bags' ? 'selected' : ''}>Bags</option>
              <option value="Ton" ${prefillUnit === 'Ton' ? 'selected' : ''}>Ton</option>
              <option value="CFT" ${prefillUnit === 'CFT' ? 'selected' : ''}>CFT (Cubic Feet)</option>
              <option value="Tins" ${prefillUnit === 'Tins' ? 'selected' : ''}>Tins</option>
              <option value="Boxes" ${prefillUnit === 'Boxes' ? 'selected' : ''}>Boxes</option>
              <option value="Coils" ${prefillUnit === 'Coils' ? 'selected' : ''}>Coils</option>
              <option value="Liters" ${prefillUnit === 'Liters' ? 'selected' : ''}>Liters</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Unit Purchase Price *</label>
            <input type="number" step="any" id="buy-mat-unit-price" class="form-input" placeholder="Price per unit" value="${prefillPrice || (existingItem ? existingItem.avgPurchasePrice : '')}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Total Spend Amount</label>
            <input type="text" id="buy-mat-total-preview" class="form-input font-bold spend-color" readonly placeholder="0.00" />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Supplier / Dealer Name</label>
            <input type="text" id="buy-mat-supplier" class="form-input" placeholder="e.g. Tata Steel Dealer, City Kiln" />
          </div>
          <div class="form-group">
            <label class="form-label">Purchase Date</label>
            <input type="date" id="buy-mat-date" class="form-input" value="${getTodayDateString()}" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes / Bill Number</label>
          <input type="text" id="buy-mat-notes" class="form-input" placeholder="e.g. Invoice #9842, 53 Grade Batch 4" />
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="buy-inventory-modal">Cancel</button>
          <button type="submit" class="btn btn-danger">Record Spend & Add Stock</button>
        </div>
      </form>
    `;

    const qtyInput = container.querySelector('#buy-mat-qty');
    const priceInput = container.querySelector('#buy-mat-unit-price');
    const totalPreview = container.querySelector('#buy-mat-total-preview');
    const nameInput = container.querySelector('#buy-mat-name');
    const unitSelect = container.querySelector('#buy-mat-unit');

    function calculateSpend() {
      const q = Number(qtyInput.value) || 0;
      const p = Number(priceInput.value) || 0;
      totalPreview.value = (q * p).toFixed(2);
    }

    qtyInput.addEventListener('input', calculateSpend);
    priceInput.addEventListener('input', calculateSpend);
    calculateSpend();

    container.querySelectorAll('.chip-stock-select').forEach(chip => {
      chip.addEventListener('click', () => {
        nameInput.value = chip.dataset.name;
        unitSelect.value = chip.dataset.unit;
        const inv = inventory.find(i => i.name.toLowerCase() === chip.dataset.name.toLowerCase());
        if (inv && inv.avgPurchasePrice) {
          priceInput.value = inv.avgPurchasePrice;
        }
        calculateSpend();
      });
    });

    const form = container.querySelector('#form-buy-inventory');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const matName = nameInput.value.trim();
      const qty = Number(qtyInput.value);
      const unitPrice = Number(priceInput.value);
      const totalCost = qty * unitPrice;

      if (!matName || qty <= 0 || unitPrice <= 0) {
        showToast('Please enter valid quantity and price', 'error');
        return;
      }

      store.recordStockPurchase(itemId, {
        name: matName,
        unit: unitSelect.value,
        quantity: qty,
        unitPrice: unitPrice,
        totalCost: totalCost,
        supplier: container.querySelector('#buy-mat-supplier').value.trim(),
        date: container.querySelector('#buy-mat-date').value,
        notes: container.querySelector('#buy-mat-notes').value.trim()
      });

      closeModal('buy-inventory-modal');
      showToast(`Purchased ${formatNumber(qty)} ${unitSelect.value} of ${matName}. Added to Spends!`);
      renderCurrentTab();
    });

    openModal('buy-inventory-modal');
  }

  // --- INVENTORY HISTORY MODAL ---
  function openInventoryHistoryModal(itemId) {
    const item = store.getInventoryItemById(itemId);
    if (!item) return;

    const currency = store.getSettings().currency || '₹';
    const container = document.getElementById('inventory-history-modal-content');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${item.name} - History</h3>
          <p class="text-muted text-xs">Current Stock: ${formatNumber(item.currentStock)} ${item.unit}</p>
        </div>
        <button class="modal-close-btn" data-close-modal="inventory-history-modal" aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        ${(!item.purchases || item.purchases.length === 0) ? `
          <div class="empty-state-card">
            <p class="empty-desc">No purchase orders logged yet.</p>
          </div>
        ` : `
          <div class="purchases-history-list">
            ${item.purchases.map(p => `
              <div class="purchase-history-item">
                <div class="pur-item-top">
                  <div>
                    <strong>${formatDate(p.date)}</strong>
                    <span class="pur-supplier-txt">${p.supplier ? `• ${p.supplier}` : ''}</span>
                  </div>
                  <strong class="spend-color">-${formatCurrency(p.totalCost, currency)}</strong>
                </div>
                <div class="pur-item-details">
                  <span>Quantity: <strong>${formatNumber(p.quantity)} ${item.unit}</strong> @ ${formatCurrency(p.unitPrice, currency)}/${item.unit}</span>
                  ${p.notes ? `<div class="text-muted text-xs">${p.notes}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <div class="modal-footer-btns">
        <button class="btn btn-primary btn-sm" id="modal-pur-buy-more">+ Buy More</button>
        <button class="btn btn-outline btn-sm" data-close-modal="inventory-history-modal">Close</button>
      </div>
    `;

    container.querySelector('#modal-pur-buy-more')?.addEventListener('click', () => {
      closeModal('inventory-history-modal');
      openBuyStockModal(item.id, item.name, item.unit, item.avgPurchasePrice);
    });

    openModal('inventory-history-modal');
  }

  // --- DIRECT SALES VIEW ---
  function renderDirectSales(container) {
    const settings = store.getSettings();
    const currency = settings.currency || '₹';
    const sales = store.getDirectSales();

    const totalDirectSalesIncome = sales.reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0);
    const totalItemsSold = sales.reduce((sum, s) => sum + (s.items ? s.items.length : 0), 0);

    container.innerHTML = `
      <div class="page-top-bar">
        <div>
          <h1 class="page-main-title">Direct Sales</h1>
          <p class="page-sub-title">Retail & counter sales of materials outside projects (Adds to Income)</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-new-direct-sale">
          <span>+ New Direct Sale</span>
        </button>
      </div>

      <div class="sales-overview-grid">
        <div class="sales-kpi-card">
          <span class="kpi-lbl">Direct Sales Income</span>
          <strong class="kpi-val income-color">${formatCurrency(totalDirectSalesIncome, currency)}</strong>
          <span class="kpi-sub">Added to Total Income</span>
        </div>
        <div class="sales-kpi-card">
          <span class="kpi-lbl">Total Sales Logged</span>
          <strong class="kpi-val">${sales.length} Orders</strong>
          <span class="kpi-sub">${totalItemsSold} items sold</span>
        </div>
      </div>

      ${sales.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon">🛒</div>
          <div class="empty-title">No Direct Sales Recorded</div>
          <p class="empty-desc">Sell materials directly to walk-in clients, retail customers, or contractors.</p>
          <button class="btn btn-primary btn-sm" id="empty-direct-sale-btn">+ Record First Direct Sale</button>
        </div>
      ` : `
        <div class="direct-sales-list">
          ${sales.map(sale => {
            const waReceipt = `*${settings.companyName || 'BuilderMate'} - Sales Receipt*\nDate: ${formatDate(sale.date)}\nCustomer: ${sale.customerName || 'Customer'}\n\n*Items Purchased:*\n${sale.items.map(i => `• ${i.name}: ${i.quantity} ${i.unit} @ ${currency}${i.rate} = ${currency}${i.total}`).join('\n')}\n\n*Total Amount:* ${currency} ${sale.totalAmount}\n*Amount Paid:* ${currency} ${sale.amountPaid} (${sale.paymentMode})\n\nThank you!`;

            return `
              <div class="direct-sale-card" data-sale-id="${sale.id}">
                <div class="sale-card-header">
                  <div>
                    <div class="sale-date-badge">${formatDate(sale.date)}</div>
                    <h3 class="sale-buyer-name">${sale.customerName || 'Walk-in Buyer'}</h3>
                  </div>
                  <div class="sale-header-right">
                    <span class="sale-total-amount income-color">+${formatCurrency(sale.amountPaid, currency)}</span>
                    <span class="pay-mode-pill">${sale.paymentMode}</span>
                  </div>
                </div>

                ${sale.customerPhone ? `
                  <div class="customer-contact-bar">
                    <span class="contact-phone-badge">📞 ${sale.customerPhone}</span>
                    <div class="contact-actions">
                      <a 
                        href="${getWhatsAppLink(sale.customerPhone, waReceipt)}" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        class="btn-contact-action btn-wa" 
                        title="Send WhatsApp Receipt"
                      >
                        💬 Receipt
                      </a>
                      <a 
                        href="${getTelLink(sale.customerPhone)}" 
                        class="btn-contact-action btn-call" 
                        title="Call Buyer"
                      >
                        📞 Call
                      </a>
                    </div>
                  </div>
                ` : ''}

                <div class="sale-items-table">
                  ${sale.items.map(item => `
                    <div class="sale-item-row">
                      <span class="sale-item-name">${item.name}</span>
                      <span class="sale-item-qty">${formatNumber(item.quantity)} ${item.unit}</span>
                      <span class="sale-item-price">${formatCurrency(item.total, currency)}</span>
                    </div>
                  `).join('')}
                </div>

                ${sale.notes ? `
                  <div class="sale-notes-box">
                    <span class="text-muted text-xs">Note: ${sale.notes}</span>
                  </div>
                ` : ''}

                <div class="sale-card-footer">
                  <a href="${getWhatsAppLink(sale.customerPhone || '', waReceipt)}" target="_blank" class="btn btn-outline btn-xs">
                    📤 WhatsApp Receipt
                  </a>
                  <button class="btn btn-danger btn-xs btn-delete-sale" data-id="${sale.id}">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    container.querySelector('#btn-new-direct-sale')?.addEventListener('click', () => openNewDirectSaleModal());
    container.querySelector('#empty-direct-sale-btn')?.addEventListener('click', () => openNewDirectSaleModal());

    container.querySelectorAll('.btn-delete-sale').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this direct sale record? Total income will be reduced.')) {
          store.deleteDirectSale(btn.dataset.id);
          showToast('Sale record removed', 'info');
          renderDirectSales(container);
        }
      });
    });
  }

  // --- NEW DIRECT SALE MODAL ---
  function openNewDirectSaleModal() {
    const container = document.getElementById('direct-sale-modal-content');
    if (!container) return;

    const inventory = store.getInventory();
    const currency = store.getSettings().currency || '₹';

    directSaleItemsTemp = [
      { id: '1', name: 'Cement Bags', quantity: 10, unit: 'Bags', rate: 420, total: 4200 }
    ];

    function renderModalBody() {
      const totalAmount = directSaleItemsTemp.reduce((sum, i) => sum + (Number(i.total) || 0), 0);

      container.innerHTML = `
        <div class="modal-header">
          <div>
            <h3 class="modal-title">New Direct Sale (Income)</h3>
            <p class="text-muted text-xs">Direct material counter sales outside projects</p>
          </div>
          <button class="modal-close-btn" data-close-modal="direct-sale-modal" aria-label="Close">×</button>
        </div>

        <form id="form-new-direct-sale" class="modal-form">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Buyer Name</label>
              <input type="text" id="sale-cust-name" class="form-input" placeholder="e.g. Anand Sharma (Walk-in)" />
            </div>
            <div class="form-group">
              <label class="form-label">Buyer Phone (WhatsApp)</label>
              <input type="tel" id="sale-cust-phone" class="form-input" placeholder="e.g. 9876543210" />
            </div>
          </div>

          <div class="sale-items-section">
            <div class="section-header-flex">
              <label class="form-label" style="margin-bottom:0">Items Sold *</label>
              <button type="button" class="btn btn-outline btn-xs" id="btn-add-sale-row">+ Add Item</button>
            </div>

            <div class="direct-sale-rows-container">
              ${directSaleItemsTemp.map((item, index) => `
                <div class="sale-item-input-row" data-index="${index}">
                  <div class="sale-row-top">
                    <input 
                      type="text" 
                      list="sale-inventory-list" 
                      class="form-input sale-row-name" 
                      placeholder="Material (Bricks, Steel, Cement...)" 
                      value="${item.name}" 
                      required 
                    />
                    ${directSaleItemsTemp.length > 1 ? `
                      <button type="button" class="btn-del-row" data-index="${index}" title="Remove">×</button>
                    ` : ''}
                  </div>
                  <div class="sale-row-bottom">
                    <input type="number" step="any" class="form-input sale-row-qty" placeholder="Qty" value="${item.quantity || ''}" required />
                    <select class="form-select sale-row-unit">
                      <option value="Numbers" ${item.unit === 'Numbers' ? 'selected' : ''}>Nos</option>
                      <option value="Kg" ${item.unit === 'Kg' ? 'selected' : ''}>Kg</option>
                      <option value="Bags" ${item.unit === 'Bags' ? 'selected' : ''}>Bags</option>
                      <option value="Ton" ${item.unit === 'Ton' ? 'selected' : ''}>Ton</option>
                      <option value="CFT" ${item.unit === 'CFT' ? 'selected' : ''}>CFT</option>
                      <option value="Tins" ${item.unit === 'Tins' ? 'selected' : ''}>Tins</option>
                      <option value="Boxes" ${item.unit === 'Boxes' ? 'selected' : ''}>Boxes</option>
                      <option value="Coils" ${item.unit === 'Coils' ? 'selected' : ''}>Coils</option>
                      <option value="Liters" ${item.unit === 'Liters' ? 'selected' : ''}>L</option>
                    </select>
                    <input type="number" step="any" class="form-input sale-row-rate" placeholder="Rate" value="${item.rate || ''}" required />
                    <span class="sale-row-total-lbl font-mono">${formatCurrency(item.total || 0, currency)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
            <datalist id="sale-inventory-list">
              ${inventory.map(inv => `<option value="${inv.name}">Stock: ${inv.currentStock} ${inv.unit}</option>`).join('')}
            </datalist>
          </div>

          <div class="sale-payment-section">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Total Amount</label>
                <input type="text" id="sale-grand-total" class="form-input font-bold income-color" value="${formatCurrency(totalAmount, currency)}" readonly />
              </div>
              <div class="form-group">
                <label class="form-label">Amount Collected *</label>
                <input type="number" step="any" id="sale-amount-paid" class="form-input font-bold" value="${totalAmount}" required />
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Payment Mode</label>
                <select id="sale-pay-mode" class="form-select">
                  <option value="Cash">Cash</option>
                  <option value="UPI / GPay">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Sale Date</label>
                <input type="date" id="sale-date" class="form-input" value="${getTodayDateString()}" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Notes (Optional)</label>
              <input type="text" id="sale-notes" class="form-input" placeholder="e.g. Counter retail bill" />
            </div>
          </div>

          <div class="modal-footer-btns">
            <button type="button" class="btn btn-outline" data-close-modal="direct-sale-modal">Cancel</button>
            <button type="submit" class="btn btn-primary">Complete Sale & Add Income</button>
          </div>
        </form>
      `;

      container.querySelector('#btn-add-sale-row')?.addEventListener('click', () => {
        directSaleItemsTemp.push({ name: '', quantity: 1, unit: 'Numbers', rate: 0, total: 0 });
        renderModalBody();
      });

      container.querySelectorAll('.btn-del-row').forEach(btn => {
        btn.addEventListener('click', () => {
          directSaleItemsTemp.splice(Number(btn.dataset.index), 1);
          renderModalBody();
        });
      });

      container.querySelectorAll('.sale-item-input-row').forEach(row => {
        const idx = Number(row.dataset.index);
        const nameInp = row.querySelector('.sale-row-name');
        const qtyInp = row.querySelector('.sale-row-qty');
        const unitSel = row.querySelector('.sale-row-unit');
        const rateInp = row.querySelector('.sale-row-rate');

        function updateRowData() {
          const q = Number(qtyInp.value) || 0;
          const r = Number(rateInp.value) || 0;
          const tot = q * r;
          directSaleItemsTemp[idx] = {
            name: nameInp.value.trim(),
            quantity: q,
            unit: unitSel.value,
            rate: r,
            total: tot
          };
          const grandTotal = directSaleItemsTemp.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
          const grandTotalInput = container.querySelector('#sale-grand-total');
          if (grandTotalInput) grandTotalInput.value = formatCurrency(grandTotal, currency);
          const amountPaidInput = container.querySelector('#sale-amount-paid');
          if (amountPaidInput && !amountPaidInput.dataset.manuallyEdited) {
            amountPaidInput.value = grandTotal;
          }
          const rowTotalLbl = row.querySelector('.sale-row-total-lbl');
          if (rowTotalLbl) rowTotalLbl.textContent = formatCurrency(tot, currency);
        }

        nameInp.addEventListener('input', updateRowData);
        qtyInp.addEventListener('input', updateRowData);
        unitSel.addEventListener('change', updateRowData);
        rateInp.addEventListener('input', updateRowData);

        nameInp.addEventListener('change', () => {
          const inv = inventory.find(i => i.name.toLowerCase() === nameInp.value.toLowerCase());
          if (inv) {
            unitSel.value = inv.unit;
            if (inv.avgPurchasePrice) {
              rateInp.value = Math.round(inv.avgPurchasePrice * 1.15);
              updateRowData();
            }
          }
        });
      });

      const amountPaidInput = container.querySelector('#sale-amount-paid');
      amountPaidInput?.addEventListener('input', () => {
        amountPaidInput.dataset.manuallyEdited = 'true';
      });

      const form = container.querySelector('#form-new-direct-sale');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const validItems = directSaleItemsTemp.filter(i => i.name && i.quantity > 0);
        if (validItems.length === 0) {
          showToast('Please add at least one material item', 'error');
          return;
        }

        const custName = container.querySelector('#sale-cust-name').value.trim() || 'Walk-in Customer';
        const custPhone = container.querySelector('#sale-cust-phone').value.trim();
        const amountPaid = Number(container.querySelector('#sale-amount-paid').value) || 0;
        const payMode = container.querySelector('#sale-pay-mode').value;
        const saleDate = container.querySelector('#sale-date').value;
        const notes = container.querySelector('#sale-notes').value.trim();

        store.addDirectSale({
          customerName: custName,
          customerPhone: custPhone,
          items: validItems,
          amountPaid: amountPaid,
          paymentMode: payMode,
          date: saleDate,
          notes: notes
        });

        closeModal('direct-sale-modal');
        showToast(`Sale recorded! Added ${formatCurrency(amountPaid, currency)} to Income.`);
        renderCurrentTab();
      });
    }

    renderModalBody();
    openModal('direct-sale-modal');
  }

  // --- LABOURS & PAYROLL VIEW ---
  function renderLabours(container) {
    const settings = store.getSettings();
    const currency = settings.currency || '₹';
    const labours = store.getLabours();
    const allProjects = store.getProjects();

    let totalWagesPaid = 0;
    let totalBalanceDue = 0;

    labours.forEach(l => {
      const fin = store.getLabourFinancials(l);
      totalWagesPaid += fin.totalPaid;
      totalBalanceDue += fin.balanceDue;
    });

    let filteredLabours = labours.filter(l => {
      if (labourWageFilter !== 'all' && l.wageType !== labourWageFilter) return false;
      if (labourSearchQuery) {
        const q = labourSearchQuery.toLowerCase();
        return (
          l.name.toLowerCase().includes(q) ||
          (l.role && l.role.toLowerCase().includes(q))
        );
      }
      return true;
    });

    container.innerHTML = `
      <div class="page-top-bar">
        <div>
          <h1 class="page-main-title">Labours & Payroll</h1>
          <p class="page-sub-title">Manage wages, track project efforts & record salary payouts (Spends)</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-new-labour">
          <span>+ Add Worker</span>
        </button>
      </div>

      <div class="labour-overview-grid">
        <div class="lab-kpi-card">
          <span class="kpi-lbl">Total Wages Paid</span>
          <strong class="kpi-val spend-color">${formatCurrency(totalWagesPaid, currency)}</strong>
          <span class="kpi-sub">Counted in Total Spends</span>
        </div>
        <div class="lab-kpi-card">
          <span class="kpi-lbl">Wage Balance Dues</span>
          <strong class="kpi-val ${totalBalanceDue > 0 ? 'text-amber' : 'income-color'}">${formatCurrency(totalBalanceDue, currency)}</strong>
          <span class="kpi-sub">Pending to be paid</span>
        </div>
        <div class="lab-kpi-card">
          <span class="kpi-lbl">Total Workers</span>
          <strong class="kpi-val">${labours.length} Workers</strong>
          <span class="kpi-sub">Across All Projects</span>
        </div>
      </div>

      <div class="labour-quick-action-strip">
        <button class="btn btn-outline btn-sm" id="btn-bulk-attendance">
          📅 Mark Attendance
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-quick-payout">
          💸 Pay Wage (Spend)
        </button>
      </div>

      <div class="search-filter-row">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            id="lab-search-input" 
            placeholder="Search worker by name or role..." 
            value="${labourSearchQuery}"
          />
          ${labourSearchQuery ? `<button id="clear-lab-search-btn" class="clear-search">×</button>` : ''}
        </div>

        <div class="filter-pills-row">
          <button class="filter-pill ${labourWageFilter === 'all' ? 'active' : ''}" data-wage="all">All (${labours.length})</button>
          <button class="filter-pill ${labourWageFilter === 'daily' ? 'active' : ''}" data-wage="daily">Daily Wage (${labours.filter(l => l.wageType === 'daily').length})</button>
          <button class="filter-pill ${labourWageFilter === 'weekly' ? 'active' : ''}" data-wage="weekly">Weekly (${labours.filter(l => l.wageType === 'weekly').length})</button>
          <button class="filter-pill ${labourWageFilter === 'monthly' ? 'active' : ''}" data-wage="monthly">Monthly (${labours.filter(l => l.wageType === 'monthly').length})</button>
        </div>
      </div>

      ${filteredLabours.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon">👷</div>
          <div class="empty-title">No Workers Registered Yet</div>
          <p class="empty-desc">Add masons, helpers, carpenters, and electricians to track site efforts and payouts.</p>
          <button class="btn btn-primary btn-sm" id="empty-add-labour-btn">+ Add First Worker</button>
        </div>
      ` : `
        <div class="labours-card-grid">
          ${filteredLabours.map(lab => {
            const fin = store.getLabourFinancials(lab);
            const lastAtt = lab.attendance && lab.attendance.length > 0 ? lab.attendance[0] : null;

            // Project tags for this worker
            const projectBadges = Object.entries(fin.projectDaysMap || {}).map(([pId, days]) => {
              if (pId === 'outside' || !pId) {
                return `<span class="proj-badge-pill" style="background-color:rgba(100,116,139,0.15); color:var(--text-secondary)">🛠️ Outside (${days}d)</span>`;
              }
              const p = allProjects.find(pr => pr.id === pId);
              return `<span class="proj-badge-pill">📍 ${p ? p.name : 'Site'} (${days}d)</span>`;
            }).join('');

            const waSlip = `*${settings.companyName || 'BuilderMate'} - Wage Statement*\nWorker: *${lab.name}* (${lab.role})\nRate: *${currency}${lab.wageRate} / ${lab.wageType}*\n\n• Total Earned: *${currency} ${fin.totalEarned}*\n• Total Paid: *${currency} ${fin.totalPaid}*\n• *Balance Pending: ${currency} ${fin.balanceDue}*\n\nThank you!`;

            return `
              <div class="labour-card" data-id="${lab.id}">
                <div class="labour-card-header">
                  <div>
                    <h3 class="labour-name">${lab.name}</h3>
                    <span class="labour-role-tag">${lab.role}</span>
                  </div>
                  <div class="labour-wage-badge">
                    <strong>${formatCurrency(lab.wageRate, currency)}</strong>
                    <span>/ ${lab.wageType}</span>
                  </div>
                </div>

                ${projectBadges ? `
                  <div style="margin:6px 0 8px 0; display:flex; flex-wrap:wrap">
                    ${projectBadges}
                  </div>
                ` : ''}

                ${lab.phone ? `
                  <div class="customer-contact-bar">
                    <span class="contact-phone-badge">📞 ${lab.phone}</span>
                    <div class="contact-actions">
                      <a 
                        href="${getWhatsAppLink(lab.phone, waSlip)}" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        class="btn-contact-action btn-wa" 
                        title="Send WhatsApp Wage Slip"
                      >
                        💬 Slip
                      </a>
                      <a 
                        href="${getTelLink(lab.phone)}" 
                        class="btn-contact-action btn-call" 
                        title="Call Worker"
                      >
                        📞 Call
                      </a>
                    </div>
                  </div>
                ` : ''}

                <div class="labour-stats-row">
                  <div class="lab-stat-box">
                    <span class="lbl">Total Days</span>
                    <strong>${lab.attendance ? lab.attendance.length : 0} Logs</strong>
                  </div>
                  <div class="lab-stat-box">
                    <span class="lbl">Total Paid</span>
                    <strong class="spend-color">${formatCurrency(fin.totalPaid, currency)}</strong>
                  </div>
                  <div class="lab-stat-box">
                    <span class="lbl">Balance Due</span>
                    <strong class="${fin.balanceDue > 0 ? 'text-amber' : 'income-color'}">
                      ${formatCurrency(fin.balanceDue, currency)}
                    </strong>
                  </div>
                </div>

                ${lastAtt ? `
                  <div class="last-attendance-badge">
                    <span>Last Log: <strong>${formatDate(lastAtt.date)}</strong> (${lastAtt.days || 1}d - ${lastAtt.status.replace('_', ' ')})</span>
                  </div>
                ` : ''}

                <div class="labour-card-actions">
                  <button class="btn btn-outline btn-xs btn-log-att" data-id="${lab.id}" data-name="${lab.name}">
                    📅 Attendance
                  </button>
                  <button class="btn btn-secondary btn-xs btn-pay-wage" data-id="${lab.id}">
                    💸 Pay Wage
                  </button>
                  <button class="btn btn-outline btn-xs btn-lab-details" data-id="${lab.id}">
                    📋 Statement
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    container.querySelector('#btn-add-new-labour')?.addEventListener('click', () => openAddLabourModal());
    container.querySelector('#empty-add-labour-btn')?.addEventListener('click', () => openAddLabourModal());
    container.querySelector('#btn-bulk-attendance')?.addEventListener('click', () => openLogAttendanceModal());
    container.querySelector('#btn-quick-payout')?.addEventListener('click', () => openLabourPayoutModal());

    const searchInput = container.querySelector('#lab-search-input');
    searchInput?.addEventListener('input', (e) => {
      labourSearchQuery = e.target.value;
      renderLabours(container);
    });

    container.querySelector('#clear-lab-search-btn')?.addEventListener('click', () => {
      labourSearchQuery = '';
      renderLabours(container);
    });

    container.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        labourWageFilter = pill.dataset.wage;
        renderLabours(container);
      });
    });

    container.querySelectorAll('.btn-log-att').forEach(btn => {
      btn.addEventListener('click', () => openLogAttendanceModal(btn.dataset.id));
    });

    container.querySelectorAll('.btn-pay-wage').forEach(btn => {
      btn.addEventListener('click', () => openLabourPayoutModal(btn.dataset.id));
    });

    container.querySelectorAll('.btn-lab-details').forEach(btn => {
      btn.addEventListener('click', () => openLabourDetailsModal(btn.dataset.id));
    });
  }

  // --- ADD LABOUR MODAL ---
  function openAddLabourModal() {
    const container = document.getElementById('log-labour-modal-content');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Add Worker / Contractor</h3>
          <p class="text-muted text-xs">Register labour with daily/weekly/monthly wage scheme</p>
        </div>
        <button class="modal-close-btn" data-close-modal="log-labour-modal" aria-label="Close">×</button>
      </div>

      <form id="form-add-labour" class="modal-form">
        <div class="form-group">
          <label class="form-label">Worker Name *</label>
          <input type="text" id="lab-name" class="form-input" placeholder="e.g. Ramesh Kumar, Manoj Mistri" required autofocus />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Role / Trade *</label>
            <select id="lab-role" class="form-select">
              ${LABOUR_ROLES.map(role => `<option value="${role}">${role}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Phone (WhatsApp)</label>
            <input type="tel" id="lab-phone" class="form-input" placeholder="e.g. 9876543210" />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Wage Type *</label>
            <select id="lab-wage-type" class="form-select">
              <option value="daily">Daily Wage (per day)</option>
              <option value="weekly">Weekly Salary</option>
              <option value="monthly">Monthly Salary</option>
              <option value="contract">Contract / Lump sum</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Wage Rate / Salary Amount *</label>
            <input type="number" step="any" id="lab-wage-rate" class="form-input font-bold" placeholder="e.g. 850" required />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Joining Date</label>
            <input type="date" id="lab-joined-date" class="form-input" value="${getTodayDateString()}" />
          </div>
          <div class="form-group">
            <label class="form-label">Notes / Address</label>
            <input type="text" id="lab-notes" class="form-input" placeholder="e.g. Village, ID proof..." />
          </div>
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="log-labour-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Worker</button>
        </div>
      </form>
    `;

    const form = container.querySelector('#form-add-labour');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = container.querySelector('#lab-name').value.trim();
      const wageRate = Number(container.querySelector('#lab-wage-rate').value);

      if (!name || wageRate <= 0) {
        showToast('Please enter worker name and valid wage rate', 'error');
        return;
      }

      store.addLabour({
        name: name,
        role: container.querySelector('#lab-role').value,
        phone: container.querySelector('#lab-phone').value.trim(),
        wageType: container.querySelector('#lab-wage-type').value,
        wageRate: wageRate,
        joinedDate: container.querySelector('#lab-joined-date').value,
        notes: container.querySelector('#lab-notes').value.trim()
      });

      closeModal('log-labour-modal');
      showToast(`Worker ${name} added successfully!`);
      renderCurrentTab();
    });

    openModal('log-labour-modal');
  }

  // --- LOG ATTENDANCE MODAL (GLOBAL) ---
  function openLogAttendanceModal(prefillLabourId = null) {
    const container = document.getElementById('log-labour-modal-content');
    if (!container) return;

    const labours = store.getLabours();
    const projects = store.getProjects().filter(p => p.status === 'in_progress');

    if (labours.length === 0) {
      showToast('Please add workers first before logging attendance', 'error');
      openAddLabourModal();
      return;
    }

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Mark Worker Attendance & Efforts</h3>
          <p class="text-muted text-xs">Log daily or multi-day work presence and site allocation</p>
        </div>
        <button class="modal-close-btn" data-close-modal="log-labour-modal" aria-label="Close">×</button>
      </div>

      <form id="form-log-attendance" class="modal-form">
        <div class="form-group">
          <label class="form-label">Select Worker *</label>
          <select id="att-labour-id" class="form-select" required>
            ${labours.map(l => `
              <option value="${l.id}" ${l.id === prefillLabourId ? 'selected' : ''}>
                ${l.name} (${l.role} - ${l.wageType})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Number of Days / Shifts *</label>
            <input type="number" step="any" id="att-days" class="form-input font-bold" value="1" required />
          </div>
          <div class="form-group">
            <label class="form-label">Attendance Date *</label>
            <input type="date" id="att-date" class="form-input" value="${getTodayDateString()}" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Assigned Project / Site</label>
          <select id="att-project-id" class="form-select">
            <option value="">-- Outside Projects / General Yard --</option>
            ${projects.map(p => `<option value="${p.id}">${p.name} (${p.customerName || 'Site'})</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Work Description / Notes</label>
          <input type="text" id="att-notes" class="form-input" placeholder="e.g. 1st floor brick work, column casting" />
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="log-labour-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Record Attendance</button>
        </div>
      </form>
    `;

    const form = container.querySelector('#form-log-attendance');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const labId = container.querySelector('#att-labour-id').value;
      const attDate = container.querySelector('#att-date').value;
      const days = Number(container.querySelector('#att-days').value) || 1;
      const projId = container.querySelector('#att-project-id').value;
      const notes = container.querySelector('#att-notes').value.trim();

      store.logLabourAttendance(labId, {
        date: attDate,
        days: days,
        status: days > 1 ? 'multi_days' : 'full_day',
        projectId: projId,
        notes: notes
      });

      closeModal('log-labour-modal');
      showToast('Attendance recorded!');
      renderCurrentTab();
    });

    openModal('log-labour-modal');
  }

  // --- LABOUR PAYOUT MODAL ---
  function openLabourPayoutModal(prefillLabourId = null) {
    const container = document.getElementById('log-labour-modal-content');
    if (!container) return;

    const labours = store.getLabours();
    const projects = store.getProjects();
    if (labours.length === 0) {
      showToast('Please add workers first', 'error');
      return;
    }

    const selectedLabour = prefillLabourId ? store.getLabourById(prefillLabourId) : labours[0];
    const fin = selectedLabour ? store.getLabourFinancials(selectedLabour) : { balanceDue: 0 };
    const currency = store.getSettings().currency || '₹';

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Record Labour Wage Payout (Spend)</h3>
          <p class="text-muted text-xs">Salary / Advance payments count towards Total Spends</p>
        </div>
        <button class="modal-close-btn" data-close-modal="log-labour-modal" aria-label="Close">×</button>
      </div>

      <form id="form-pay-labour" class="modal-form">
        <div class="form-group">
          <label class="form-label">Worker *</label>
          <select id="pay-labour-id" class="form-select" required>
            ${labours.map(l => `
              <option value="${l.id}" ${l.id === (selectedLabour ? selectedLabour.id : '') ? 'selected' : ''}>
                ${l.name} (${l.role} - Rate: ${currency}${l.wageRate}/${l.wageType})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="payment-balance-hint">
          <span>Current Outstanding Wage Due:</span>
          <strong id="labour-due-preview" class="text-amber">${formatCurrency(fin.balanceDue, currency)}</strong>
        </div>

        <div class="form-group">
          <label class="form-label">Payout Amount *</label>
          <input 
            type="number" 
            step="any" 
            id="payout-amount" 
            class="form-input form-input-lg font-bold spend-color" 
            placeholder="0.00" 
            value="${fin.balanceDue > 0 ? fin.balanceDue : (selectedLabour ? selectedLabour.wageRate : '')}" 
            required 
            autofocus 
          />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Payout Type</label>
            <select id="payout-type" class="form-select">
              <option value="Daily Wage">Daily Wage</option>
              <option value="Weekly Salary">Weekly Salary</option>
              <option value="Monthly Salary">Monthly Salary</option>
              <option value="Advance">Advance Payment</option>
              <option value="Bonus">Bonus / Incentive</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Payment Mode</label>
            <select id="payout-mode" class="form-select">
              <option value="Cash">Cash</option>
              <option value="UPI / GPay">UPI / GPay / PhonePe</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Linked Project (Optional)</label>
            <select id="payout-project-id" class="form-select">
              <option value="">-- General / Outside Projects --</option>
              ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" id="payout-date" class="form-input" value="${getTodayDateString()}" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <input type="text" id="payout-notes" class="form-input" placeholder="e.g. Paid in full for week" />
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="log-labour-modal">Cancel</button>
          <button type="submit" class="btn btn-danger">Record Spend & Deduct Balance</button>
        </div>
      </form>
    `;

    const labSel = container.querySelector('#pay-labour-id');
    const duePreview = container.querySelector('#labour-due-preview');
    const amountInput = container.querySelector('#payout-amount');

    labSel.addEventListener('change', () => {
      const l = store.getLabourById(labSel.value);
      if (l) {
        const f = store.getLabourFinancials(l);
        duePreview.textContent = formatCurrency(f.balanceDue, currency);
        if (f.balanceDue > 0) amountInput.value = f.balanceDue;
        else amountInput.value = l.wageRate;
      }
    });

    const form = container.querySelector('#form-pay-labour');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const labId = labSel.value;
      const amount = Number(amountInput.value);

      if (!amount || amount <= 0) {
        showToast('Please enter a valid payout amount', 'error');
        return;
      }

      store.addLabourPayout(labId, {
        amount: amount,
        type: container.querySelector('#payout-type').value,
        mode: container.querySelector('#payout-mode').value,
        date: container.querySelector('#payout-date').value,
        projectId: container.querySelector('#payout-project-id').value,
        notes: container.querySelector('#payout-notes').value.trim()
      });

      closeModal('log-labour-modal');
      showToast(`Paid ${formatCurrency(amount, currency)} to worker! Added to Spends.`);
      renderCurrentTab();
    });

    openModal('log-labour-modal');
  }

  // --- LABOUR DETAILS & STATEMENT MODAL ---
  function openLabourDetailsModal(labourId) {
    const labour = store.getLabourById(labourId);
    if (!labour) return;

    const settings = store.getSettings();
    const currency = settings.currency || '₹';
    const fin = store.getLabourFinancials(labour);
    const allProjects = store.getProjects();

    const container = document.getElementById('log-labour-modal-content');
    if (!container) return;

    const waSlip = `*${settings.companyName || 'BuilderMate'} - Wage Statement*\nWorker: *${labour.name}* (${labour.role})\nRate: *${currency}${labour.wageRate} / ${labour.wageType}*\n\n• Days Worked: *${labour.attendance ? labour.attendance.length : 0}*\n• Total Earned: *${currency} ${fin.totalEarned}*\n• Total Paid: *${currency} ${fin.totalPaid}*\n• *Remaining Balance Due: ${currency} ${fin.balanceDue}*\n\nThank you!`;

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${labour.name}</h3>
          <p class="text-muted text-xs">${labour.role} • ${currency}${labour.wageRate} / ${labour.wageType}</p>
        </div>
        <button class="modal-close-btn" data-close-modal="log-labour-modal" aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <div class="proj-sheet-finance-grid">
          <div class="fin-box-sm">
            <span class="lbl">Total Earned</span>
            <strong>${formatCurrency(fin.totalEarned, currency)}</strong>
          </div>
          <div class="fin-box-sm">
            <span class="lbl">Total Paid</span>
            <strong class="spend-color">${formatCurrency(fin.totalPaid, currency)}</strong>
          </div>
          <div class="fin-box-sm">
            <span class="lbl">Balance Due</span>
            <strong class="${fin.balanceDue > 0 ? 'text-amber' : 'income-color'}">${formatCurrency(fin.balanceDue, currency)}</strong>
          </div>
        </div>

        <div class="labour-detail-actions-row">
          <button class="btn btn-outline btn-xs" id="detail-mark-att">
            📅 Mark Attendance
          </button>
          <button class="btn btn-secondary btn-xs" id="detail-pay-wage">
            💸 Pay Wage
          </button>
          ${labour.phone ? `
            <a href="${getWhatsAppLink(labour.phone, waSlip)}" target="_blank" class="btn btn-wa btn-xs">
              💬 WhatsApp Slip
            </a>
          ` : ''}
        </div>

        <div class="drawer-section">
          <h4 class="drawer-section-title">📅 Attendance & Project Efforts (${labour.attendance ? labour.attendance.length : 0} logs)</h4>
          <div class="attendance-history-list">
            ${(!labour.attendance || labour.attendance.length === 0) ? `
              <div class="empty-table-msg">No attendance logged yet.</div>
            ` : labour.attendance.map(a => {
              const p = a.projectId ? allProjects.find(pr => pr.id === a.projectId) : null;
              return `
                <div class="att-row-item">
                  <div>
                    <strong>${formatDate(a.date)}</strong>
                    <span class="status-tag status-att-${a.status}">${a.days || 1}d (${a.status.replace('_', ' ')})</span>
                    <div class="text-muted text-xs">
                      ${p ? `📍 ${p.name}` : '🛠️ Outside Projects'}
                      ${a.notes ? ` • ${a.notes}` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="drawer-section">
          <h4 class="drawer-section-title">💸 Payouts History (${labour.payouts ? labour.payouts.length : 0} payments)</h4>
          <div class="payout-history-list">
            ${(!labour.payouts || labour.payouts.length === 0) ? `
              <div class="empty-table-msg">No payouts recorded yet.</div>
            ` : labour.payouts.map(p => {
              const proj = p.projectId ? allProjects.find(pr => pr.id === p.projectId) : null;
              return `
                <div class="payment-row-item">
                  <div class="pay-row-left">
                    <div class="pay-date-badge">${formatDate(p.date)}</div>
                    <div>
                      <strong class="spend-color">-${formatCurrency(p.amount, currency)}</strong>
                      <span class="pay-mode-pill">${p.type} (${p.mode})</span>
                      ${proj ? `<span class="proj-badge-pill" style="font-size:0.6rem">📍 ${proj.name}</span>` : ''}
                    </div>
                    ${p.notes ? `<p class="pay-notes-text">${p.notes}</p>` : ''}
                  </div>
                  <div class="pay-row-right">
                    <button class="btn-delete-item btn-del-lab-payout" data-payout-id="${p.id}" title="Delete Payout">🗑️</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="sheet-danger-footer">
          <button class="btn btn-danger btn-xs" id="btn-delete-labour">
            Delete Worker Record
          </button>
        </div>
      </div>
    `;

    container.querySelector('#detail-mark-att')?.addEventListener('click', () => openLogAttendanceModal(labour.id));
    container.querySelector('#detail-pay-wage')?.addEventListener('click', () => openLabourPayoutModal(labour.id));

    container.querySelectorAll('.btn-del-lab-payout').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this payout record? Total spends will be reduced.')) {
          store.deleteLabourPayout(labour.id, btn.dataset.payoutId);
          showToast('Payout deleted', 'info');
          openLabourDetailsModal(labour.id);
        }
      });
    });

    container.querySelector('#btn-delete-labour')?.addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete worker ${labour.name}?`)) {
        store.deleteLabour(labour.id);
        closeModal('log-labour-modal');
        showToast('Worker deleted', 'info');
        renderCurrentTab();
      }
    });

    openModal('log-labour-modal');
  }

  // --- SETTINGS & BACKUP MODAL ---
  function renderSettingsModal() {
    const container = document.getElementById('settings-modal-content');
    if (!container) return;

    const settings = store.getSettings();
    const gdrive = settings.gdrive || {};

    container.innerHTML = `
      <div class="modal-header">
        <div class="header-brand-line">
          <img src="icon.png" alt="Logo" class="modal-logo-icon" />
          <div>
            <h3 class="modal-title">Company Settings & Backup</h3>
            <p class="text-muted text-xs">Profile, themes, manual backups & Google Drive cloud sync</p>
          </div>
        </div>
        <button class="modal-close-btn" data-close-modal="settings-modal" aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <form id="form-company-settings" class="modal-form">
          <div class="settings-section-card">
            <h4 class="settings-card-title">🏢 Company Profile & Appearance</h4>
            <p class="settings-card-sub">Name will appear across dashboard, invoices, and WhatsApp slips.</p>

            <div class="form-group">
              <label class="form-label">Business / Company Name *</label>
              <input 
                type="text" 
                id="set-company-name" 
                class="form-input" 
                placeholder="e.g. Apex Builders & Developers" 
                value="${settings.companyName || ''}" 
                required 
              />
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Contractor Name</label>
                <input 
                  type="text" 
                  id="set-contractor-name" 
                  class="form-input" 
                  placeholder="e.g. Rajesh Sharma" 
                  value="${settings.contractorName || ''}" 
                />
              </div>
              <div class="form-group">
                <label class="form-label">Primary Phone</label>
                <input 
                  type="tel" 
                  id="set-phone" 
                  class="form-input" 
                  placeholder="e.g. +91 9876543210" 
                  value="${settings.phone || ''}" 
                />
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Currency Symbol *</label>
                <select id="set-currency" class="form-select">
                  <option value="₹" ${settings.currency === '₹' ? 'selected' : ''}>₹ (Indian Rupee - INR)</option>
                  <option value="$" ${settings.currency === '$' ? 'selected' : ''}>$ (US Dollar - USD)</option>
                  <option value="AED" ${settings.currency === 'AED' ? 'selected' : ''}>AED (UAE Dirham)</option>
                  <option value="SAR" ${settings.currency === 'SAR' ? 'selected' : ''}>SAR (Saudi Riyal)</option>
                  <option value="€" ${settings.currency === '€' ? 'selected' : ''}>€ (Euro - EUR)</option>
                  <option value="£" ${settings.currency === '£' ? 'selected' : ''}>£ (British Pound - GBP)</option>
                  <option value="₨" ${settings.currency === '₨' ? 'selected' : ''}>₨ (PKR / NPR / LKR)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">App Theme *</label>
                <select id="set-theme" class="form-select">
                  <option value="light" ${(settings.theme || 'light') === 'light' ? 'selected' : ''}>☀️ Light Theme</option>
                  <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>🌙 Dark Theme</option>
                  <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>⚙️ System Auto</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Office / Yard Address</label>
              <input 
                type="text" 
                id="set-address" 
                class="form-input" 
                placeholder="e.g. Ring Road Industrial Yard" 
                value="${settings.address || ''}" 
              />
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              💾 Save Profile & Theme
            </button>
          </div>
        </form>

        <!-- Google Drive Cloud Sync Section -->
        <div class="settings-section-card">
          <div class="gdrive-header-status">
            <div class="gdrive-brand-flex">
              <svg class="gdrive-icon-svg" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M12.01 1.5L4.5 14.5h4.5l7.5-13z"/>
                <path fill="#FBBC05" d="M19.5 14.5l-4.5-7.5-3 5.2 4.5 7.8h7.5z"/>
                <path fill="#34A853" d="M9 14.5H1.5L6 22.5h7.5z"/>
              </svg>
              <div>
                <h4 class="settings-card-title" style="margin-bottom:0">Google Drive Cloud Sync</h4>
                <span class="text-xs text-muted">Continuous background backup</span>
              </div>
            </div>
            <span class="cloud-status-pill ${gdrive.isConnected ? 'connected' : 'disconnected'}">
              ${gdrive.isConnected ? '● Connected' : '○ Not Linked'}
            </span>
          </div>

          ${gdrive.isConnected ? `
            <div class="gdrive-connected-panel">
              <div class="gdrive-user-info">
                <div class="gdrive-user-top">
                  <span class="gdrive-email-text">👤 ${gdrive.userEmail || 'Google Account'}</span>
                  <span class="gdrive-sync-time">Last: ${formatTimeAgo(gdrive.lastSyncedAt)}</span>
                </div>
              </div>

              <label class="gdrive-toggle-label">
                <span>🔄 Continuous Auto-Sync (on change & background)</span>
                <input type="checkbox" id="gdrive-toggle-autosync" class="gdrive-toggle-input" ${gdrive.autoSync !== false ? 'checked' : ''} />
              </label>

              <div class="gdrive-actions-row">
                <button type="button" class="btn btn-primary btn-sm" id="btn-gdrive-sync-now">
                  ☁️ Sync Now
                </button>
                <button type="button" class="btn btn-outline btn-sm" id="btn-gdrive-restore-cloud">
                  📥 Restore from Cloud
                </button>
              </div>

              <button type="button" class="btn btn-outline btn-xs" id="btn-gdrive-disconnect" style="margin-top:4px">
                Disconnect Google Drive
              </button>
            </div>
          ` : `
            <div>
              <p class="settings-card-sub" style="margin-bottom: 12px">
                Connect your personal Google Drive to automatically backup all projects, materials, expenses, and payroll to your secure private storage.
              </p>
              <button type="button" class="btn btn-gdrive-connect btn-block" id="btn-gdrive-connect">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Connect Google Drive</span>
              </button>
            </div>
          `}
        </div>

        <div class="settings-section-card">
          <h4 class="settings-card-title">💾 Manual File Backup & Restore (JSON)</h4>
          <p class="settings-card-sub">Export backup files anytime for offline safety or local storage.</p>

          <div class="backup-actions-grid">
            <button class="btn btn-outline" id="btn-export-json-backup">
              📥 Download Backup
            </button>
            
            <label class="btn btn-outline file-input-label">
              📤 Restore File
              <input type="file" id="input-import-json" accept=".json" style="display:none" />
            </label>
          </div>
        </div>

        <div class="settings-section-card">
          <h4 class="settings-card-title">📱 App Information & Quick Reset</h4>
          <div class="app-info-row">
            <span>Version: <strong>BuilderMate v1.0.6</strong></span>
            <span class="status-pill pill-green">Cloud & Offline Ready</span>
          </div>
          
          <div class="reset-actions-row">
            <button class="btn btn-outline btn-xs" id="btn-load-sample-data">
              🔄 Load Sample Demo Data
            </button>
            <button class="btn btn-danger btn-xs" id="btn-reset-all-data">
              ⚠️ Reset All Data
            </button>
          </div>
        </div>
      </div>
    `;

    // Google Drive Event Listeners
    container.querySelector('#btn-gdrive-connect')?.addEventListener('click', () => GDrive.connect(true));
    container.querySelector('#btn-gdrive-disconnect')?.addEventListener('click', () => GDrive.disconnect());
    container.querySelector('#btn-gdrive-sync-now')?.addEventListener('click', () => GDrive.uploadData(true, true));
    container.querySelector('#btn-gdrive-restore-cloud')?.addEventListener('click', () => GDrive.restoreFromCloud());
    
    container.querySelector('#gdrive-toggle-autosync')?.addEventListener('change', (e) => {
      const gdriveState = store.getSettings().gdrive || {};
      store.updateSettings({
        gdrive: { ...gdriveState, autoSync: e.target.checked }
      });
      showToast(`Google Drive Auto-Sync ${e.target.checked ? 'Enabled' : 'Disabled'}`);
    });

    const form = container.querySelector('#form-company-settings');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const selectedTheme = container.querySelector('#set-theme').value;
      applyTheme(selectedTheme);

      store.updateSettings({
        companyName: container.querySelector('#set-company-name').value.trim(),
        contractorName: container.querySelector('#set-contractor-name').value.trim(),
        phone: container.querySelector('#set-phone').value.trim(),
        currency: container.querySelector('#set-currency').value,
        theme: selectedTheme,
        address: container.querySelector('#set-address').value.trim(),
        isOnboarded: true
      });

      closeModal('settings-modal');
      showToast('Settings saved!');
      renderCurrentTab();
    });

    container.querySelector('#btn-export-json-backup')?.addEventListener('click', () => {
      const data = store.exportFullData();
      const filename = `BuilderMate_Backup_${(store.getSettings().companyName || 'App').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
      downloadJson(data, filename);
      showToast('Backup file downloaded!');
    });

    const fileInput = container.querySelector('#input-import-json');
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (confirm('Restoring this backup will replace current records. Proceed?')) {
            store.importFullData(parsed);
            if (parsed.settings && parsed.settings.theme) {
              applyTheme(parsed.settings.theme);
            }
            showToast('Backup restored successfully!');
            closeModal('settings-modal');
            renderCurrentTab();
          }
        } catch (err) {
          showToast('Invalid backup file', 'error');
        }
      };
      reader.readAsText(file);
    });

    container.querySelector('#btn-load-sample-data')?.addEventListener('click', () => {
      if (confirm('Load sample demonstration projects, inventory and workers?')) {
        // Sample Project
        const sampleProj = store.addProject({
          name: 'Sunrise Residency (Plot 14)',
          customerName: 'Kishore Reddy',
          customerPhone: '9845012345',
          siteAddress: 'Sector 4, Phase 2 Layout',
          startDate: '2026-08-01',
          status: 'in_progress',
          estimatedBudget: 850000
        });

        store.addProjectMaterial(sampleProj.id, {
          name: 'Red Bricks',
          quantity: 8000,
          unit: 'Numbers',
          rate: 9.5
        });

        store.addProjectMaterial(sampleProj.id, {
          name: 'UltraTech Cement (53 Grade)',
          quantity: 120,
          unit: 'Bags',
          rate: 420
        });

        store.addProjectPayment(sampleProj.id, {
          amount: 250000,
          mode: 'UPI / GPay',
          notes: 'Initial token advance'
        });

        // Sample Inventory
        store.recordStockPurchase(null, {
          name: 'Red Bricks',
          unit: 'Numbers',
          quantity: 15000,
          unitPrice: 8.5,
          totalCost: 127500,
          supplier: 'City Brick Kiln'
        });

        store.recordStockPurchase(null, {
          name: 'UltraTech Cement (53 Grade)',
          unit: 'Bags',
          quantity: 250,
          unitPrice: 380,
          totalCost: 95000,
          supplier: 'National Building Suppliers'
        });

        // Sample Labour
        const lab1 = store.addLabour({
          name: 'Ramesh Kumar (Mistri)',
          role: 'Head Mason (Mistri)',
          phone: '9876543210',
          wageType: 'daily',
          wageRate: 900
        });

        store.logLabourAttendance(lab1.id, { date: '2026-08-14', days: 12, rate: 900, totalCost: 10800, projectId: sampleProj.id, notes: 'Ground floor brick masonry & centering (12 days)' });
        store.addLabourPayout(lab1.id, { amount: 5000, type: 'Site Wage', mode: 'Cash', projectId: sampleProj.id });

        showToast('Sample demo data loaded!');
        closeModal('settings-modal');
        renderCurrentTab();
      }
    });

    container.querySelector('#btn-reset-all-data')?.addEventListener('click', () => {
      if (confirm('⚠️ WARNING: Erase all records?')) {
        store.resetAllData();
        showToast('Database reset to fresh state', 'info');
        closeModal('settings-modal');
        renderCurrentTab();
      }
    });
  }

  // =========================================================================
  // 6. APP CONTROLLER & NAVIGATION INITIALIZER
  // =========================================================================
  function renderCurrentTab() {
    const container = document.getElementById('main-tab-content');
    if (!container) return;

    window.scrollTo({ top: 0, behavior: 'instant' });

    switch (activeTab) {
      case 'dashboard':
        renderDashboard(container);
        break;
      case 'projects':
        renderProjects(container);
        break;
      case 'inventory':
        renderInventory(container);
        break;
      case 'direct-sales':
        renderDirectSales(container);
        break;
      case 'labours':
        renderLabours(container);
        break;
      default:
        renderDashboard(container);
    }
  }

  function switchTab(tabName) {
    activeTab = tabName;
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    renderCurrentTab();
  }

  function checkFirstRunOnboarding() {
    const settings = store.getSettings();
    if (!settings.isOnboarded && !settings.companyName) {
      setTimeout(() => {
        openModal('onboarding-modal');
      }, 300);
    }
  }

  function initPwaAndEvents() {
    // Universal Close Modal Click Delegator
    document.addEventListener('click', (e) => {
      const closeTarget = e.target.closest('[data-close-modal], .modal-close-btn, .sheet-close-btn');
      if (closeTarget) {
        const modalId = closeTarget.dataset.closeModal;
        if (modalId) {
          closeModal(modalId);
        } else {
          const parentModal = closeTarget.closest('.modal-overlay');
          if (parentModal) closeModal(parentModal.id);
        }
      }
    });

    // Nav buttons
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        if (targetTab && targetTab !== activeTab) {
          switchTab(targetTab);
        }
      });
    });

    // FAB Button
    document.getElementById('fab-quick-add')?.addEventListener('click', () => {
      openModal('quick-add-action-sheet');
    });

    // Action sheet buttons
    document.querySelectorAll('.action-sheet-item').forEach(item => {
      item.addEventListener('click', () => {
        closeModal('quick-add-action-sheet');
        const action = item.dataset.action;
        if (action === 'new-project') openModal('new-project-modal');
        else if (action === 'buy-stock') openBuyStockModal();
        else if (action === 'direct-sale') openNewDirectSaleModal();
        else if (action === 'add-labour') openLogAttendanceModal();
      });
    });

    // Onboarding Form
    document.getElementById('form-onboarding')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const compName = document.getElementById('onboard-company-name').value.trim();
      const contName = document.getElementById('onboard-contractor-name').value.trim();
      const currency = document.getElementById('onboard-currency').value;
      const phone = document.getElementById('onboard-phone').value.trim();

      if (!compName) {
        showToast('Please enter your company name', 'error');
        return;
      }

      store.updateSettings({
        companyName: compName,
        contractorName: contName,
        currency: currency,
        phone: phone,
        isOnboarded: true
      });

      closeModal('onboarding-modal');
      showToast(`Welcome to BuilderMate, ${compName}! 🎉`);
      renderCurrentTab();
    });

    // New Project Form
    document.getElementById('form-new-project')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('new-proj-name').value.trim();
      const custName = document.getElementById('new-proj-cust-name').value.trim();
      const custPhone = document.getElementById('new-proj-cust-phone').value.trim();
      const siteAddress = document.getElementById('new-proj-address').value.trim();
      const budget = Number(document.getElementById('new-proj-budget').value) || 0;
      const startDate = document.getElementById('new-proj-start-date').value || getTodayDateString();

      if (!name) {
        showToast('Please enter a project name', 'error');
        return;
      }

      const created = store.addProject({
        name: name,
        customerName: custName,
        customerPhone: custPhone,
        siteAddress: siteAddress,
        estimatedBudget: budget,
        startDate: startDate,
        status: 'in_progress'
      });

      closeModal('new-project-modal');
      document.getElementById('form-new-project').reset();
      showToast(`Project "${name}" created!`);
      
      switchTab('projects');
      openProjectDetailsModal(created.id, 'labours');
    });

    // Modal Backdrop click to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModal(overlay.id);
        }
      });
    });

    // Background auto-sync on focus and visibility change
    window.addEventListener('online', () => {
      if (GDrive && GDrive.queueDebouncedSync) {
        GDrive.queueDebouncedSync();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && GDrive && GDrive.uploadData) {
        const gdriveState = store.getSettings().gdrive;
        if (gdriveState && gdriveState.isConnected && gdriveState.autoSync !== false) {
          GDrive.uploadData(false);
        }
      }
    });

    window.addEventListener('focus', () => {
      const gdriveState = store.getSettings().gdrive;
      if (gdriveState && gdriveState.isConnected && gdriveState.autoSync !== false) {
        GDrive.uploadData(false);
      }
    });

    // System theme change listener
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const theme = store.getSettings().theme;
        if (theme === 'system') {
          applyTheme('system');
        }
      });
    }

    // Service Worker only on http/https
    if (location.protocol.startsWith('http') && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }

    // PWA Install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      document.getElementById('pwa-install-banner')?.classList.add('visible');
    });

    document.getElementById('btn-pwa-install-action')?.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('BuilderMate added to homescreen!');
        }
        deferredInstallPrompt = null;
        document.getElementById('pwa-install-banner')?.classList.remove('visible');
      }
    });

    document.getElementById('btn-pwa-dismiss')?.addEventListener('click', () => {
      document.getElementById('pwa-install-banner')?.classList.remove('visible');
    });
  }

  // --- INITIALIZE APPLICATION ---
  function init() {
    // Apply saved theme
    const savedTheme = store.getSettings().theme || 'light';
    applyTheme(savedTheme);

    initPwaAndEvents();
    renderCurrentTab();
    checkFirstRunOnboarding();

    // Initialize Google Drive GIS when SDK is loaded
    if (window.google && window.google.accounts) {
      GDrive.init();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => GDrive.init(), 500);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
