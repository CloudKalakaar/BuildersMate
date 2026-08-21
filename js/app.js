/**
 * BuilderMate - Construction Management Application
 * Includes Phase-wise Site Photos, Vehicles & Machinery Hub, and Head Mason Gang Management
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

  const CONSTRUCTION_PHASES = [
    'Excavation / Foundation',
    'Plinth Beam / Basement',
    'Column & Pillar Casting',
    'Brick / Block Masonry',
    'Slab / Roof Casting',
    'Plastering (Internal / External)',
    'Electrical & Plumbing',
    'Flooring & Tiling',
    'Painting & Finishing',
    'General Site Progress'
  ];

  const VEHICLE_TYPES = [
    'JCB / Excavator',
    'Tipper / Dumper',
    'Tractor (with Trolley)',
    'Transit Concrete Mixer',
    'Hydra / Crane / Lift',
    'Road Roller / Compactor',
    'Other Machinery'
  ];

  const DEFAULT_STATE = {
    settings: {
      companyName: '',
      contractorName: '',
      phone: '',
      currency: '₹',
      address: '',
      isOnboarded: false,
      theme: 'light',
      gdrive: { isConnected: false, userEmail: '', lastSyncedAt: '', autoSync: true }
    },
    projects: [],
    inventory: [],
    directSales: [],
    labours: [],
    vehicles: []
  };

  // =========================================================================
  // 2. UTILITY FUNCTIONS & HELPERS
  // =========================================================================
  function formatCurrency(amount, symbol = '₹') {
    const num = Number(amount) || 0;
    return `${symbol} ${num.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;
  }

  function formatNumber(num) {
    return (Number(num) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  function generateId(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  }

  function cleanPhoneNumber(phone) {
    return (phone || '').replace(/[^\d+]/g, '');
  }

  function getWhatsAppLink(phone, message = '') {
    let cleaned = cleanPhoneNumber(phone).replace(/^\+/, '');
    if (!cleaned) return '#';
    if (cleaned.length === 10) cleaned = '91' + cleaned;
    return `https://wa.me/${cleaned}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  }

  function getTelLink(phone) {
    const cleaned = cleanPhoneNumber(phone);
    return cleaned ? `tel:${cleaned}` : '#';
  }

  // Image compressor using HTML5 canvas
  function compressImageFile(file, maxWidth = 1000, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-up`;
    toast.innerHTML = `<span class="toast-msg">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('modal-open');
    }
  }

  function closeModal(modalId) {
    if (modalId) {
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('active');
    } else {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
    if (document.querySelectorAll('.modal-overlay.active').length === 0) {
      document.body.classList.remove('modal-open');
    }
  }

  window.closeModal = closeModal;
  window.openModal = openModal;

  function downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `BuilderMate_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function executeHardRefresh(btn) {
    if (btn) btn.classList.add('spinning');
    showToast('Purging caches and updating to latest version...', 'info', 2000);
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.update();
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    } catch (e) {}
    setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('v', Date.now());
      window.location.href = url.toString();
    }, 400);
  }

  function applyTheme(themeName) {
    const isDark = themeName === 'dark' || (themeName === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    if (store && store.data && store.data.settings) {
      store.data.settings.theme = themeName;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store.data)); } catch (e) {}
    }
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    showToast(`Switched to ${next === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}`);
    renderCurrentTab();
  }

  // =========================================================================
  // 3. PERSISTENT GOOGLE DRIVE CONTINUOUS CLOUD BACKUP
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
      try {
        const savedAuth = localStorage.getItem(GAUTH_KEY);
        if (savedAuth) {
          const parsed = JSON.parse(savedAuth);
          if (parsed.accessToken && parsed.tokenExpiresAt > Date.now()) {
            this.accessToken = parsed.accessToken;
            this.tokenExpiresAt = parsed.tokenExpiresAt;
          }
        }
      } catch (e) {}

      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        try {
          const userEmailHint = (store && store.getSettings && store.getSettings().gdrive && store.getSettings().gdrive.userEmail) || '';
          this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.clientId,
            scope: this.scopes,
            hint: userEmailHint,
            callback: async (resp) => {
              if (resp.error) return;
              this.accessToken = resp.access_token;
              this.tokenExpiresAt = Date.now() + (Number(resp.expires_in) || 3500) * 1000;
              this.saveAuthStorage();

              const email = await this.fetchUserEmail(this.accessToken);
              const cur = store.getSettings().gdrive || {};
              store.updateSettings({
                gdrive: { ...cur, isConnected: true, userEmail: email || cur.userEmail || 'Connected Account', autoSync: cur.autoSync !== false }
              });

              showToast(`Connected to Google Drive (${email || 'Google Account'})! 🎉`);
              renderSettingsModal();
              renderCurrentTab();
              this.handleInitialSync();
            }
          });
        } catch (e) {}
      }
      this.startPeriodicSync();
    },

    saveAuthStorage() {
      try {
        if (this.accessToken) {
          localStorage.setItem(GAUTH_KEY, JSON.stringify({ accessToken: this.accessToken, tokenExpiresAt: this.tokenExpiresAt }));
        } else {
          localStorage.removeItem(GAUTH_KEY);
        }
      } catch (e) {}
    },

    async fetchUserEmail(token) {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          return data.email;
        }
      } catch (e) {}
      return '';
    },

    connect(forceSelect = true) {
      if (!window.google || !window.google.accounts) {
        showToast('Google Identity Services is loading. Please try again.', 'info');
        return;
      }
      if (!this.tokenClient) this.init();
      if (this.tokenClient) {
        this.tokenClient.requestAccessToken({ prompt: forceSelect ? 'select_account' : '' });
      }
    },

    disconnect() {
      if (this.accessToken && window.google && window.google.accounts) {
        try { google.accounts.oauth2.revoke(this.accessToken, () => {}); } catch (e) {}
      }
      this.accessToken = null;
      this.tokenExpiresAt = 0;
      this.saveAuthStorage();
      const cur = store.getSettings().gdrive || {};
      store.updateSettings({ gdrive: { ...cur, isConnected: false, userEmail: '', lastSyncedAt: '' } });
      showToast('Disconnected from Google Drive', 'info');
      renderSettingsModal();
      renderCurrentTab();
    },

    async ensureValidToken(allowPrompt = false) {
      if (this.accessToken && Date.now() < (this.tokenExpiresAt - 45000)) return this.accessToken;
      return new Promise((resolve) => {
        if (!this.tokenClient) this.init();
        if (!this.tokenClient) return resolve(null);
        const timeout = setTimeout(() => resolve(null), 8000);
        this.tokenClient.callback = (resp) => {
          clearTimeout(timeout);
          if (resp && resp.access_token) {
            this.accessToken = resp.access_token;
            this.tokenExpiresAt = Date.now() + (Number(resp.expires_in) || 3500) * 1000;
            this.saveAuthStorage();
            resolve(this.accessToken);
          } else resolve(null);
        };
        try {
          const email = (store.getSettings().gdrive && store.getSettings().gdrive.userEmail) || '';
          this.tokenClient.requestAccessToken({ prompt: allowPrompt ? 'select_account' : '', hint: email });
        } catch (e) {
          clearTimeout(timeout);
          resolve(null);
        }
      });
    },

    async findRemoteFile(token) {
      try {
        const q = encodeURIComponent(`name = '${this.fileName}' and trashed = false`);
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder,drive&q=${q}&fields=files(id,name)`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.files && data.files.length > 0) return data.files[0];
        }
      } catch (e) {}
      return null;
    },

    async uploadData(showNotification = false, allowPrompt = false) {
      if (this.isSyncing) return;
      const gdrive = store.getSettings().gdrive;
      if (!gdrive || !gdrive.isConnected) return;

      this.isSyncing = true;
      this.updateStatusVisuals('syncing');

      try {
        const token = await this.ensureValidToken(allowPrompt);
        if (!token) {
          this.isSyncing = false;
          this.updateStatusVisuals('connected');
          return;
        }

        const existing = await this.findRemoteFile(token);
        const dataToSync = store.exportFullData();
        const contentBlob = new Blob([JSON.stringify(dataToSync, null, 2)], { type: 'application/json' });

        let response;
        if (existing) {
          response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: contentBlob
          });
        } else {
          const metadata = { name: this.fileName, parents: ['appDataFolder'], mimeType: 'application/json' };
          const boundary = '-------314159265358979323846';
          const delimiter = "\r\n--" + boundary + "\r\n";
          const close_delim = "\r\n--" + boundary + "--";
          const body = delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) + delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(dataToSync, null, 2) + close_delim;

          response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/related; boundary=' + boundary },
            body: body
          });
        }

        if (response && response.ok) {
          const nowIso = new Date().toISOString();
          if (store.data.settings.gdrive) store.data.settings.gdrive.lastSyncedAt = nowIso;
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store.data)); } catch (e) {}
          if (showNotification) showToast('☁️ Cloud backup synced to Google Drive successfully!');
        }
      } catch (e) {
      } finally {
        this.isSyncing = false;
        this.updateStatusVisuals('connected');
        renderSettingsModal();
      }
    },

    async downloadRemoteData() {
      const token = await this.ensureValidToken(true);
      if (!token) throw new Error('Google Drive login required');
      const file = await this.findRemoteFile(token);
      if (!file) throw new Error('No cloud backup found on your Google Drive yet.');
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
      return await res.json();
    },

    async restoreFromCloud() {
      try {
        showToast('Fetching backup from Google Drive...', 'info', 2000);
        const remoteData = await this.downloadRemoteData();
        if (confirm(`Restore ${remoteData.projects?.length || 0} projects and ${remoteData.inventory?.length || 0} stock items from Google Drive?`)) {
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
        if (remoteFile && store.getProjects().length === 0) {
          if (confirm('Found existing backup on your Google Drive. Restore now?')) {
            this.restoreFromCloud();
            return;
          }
        }
        this.uploadData(false);
      } catch (e) {}
    },

    queueDebouncedSync() {
      const gdrive = store.getSettings().gdrive;
      if (!gdrive || !gdrive.isConnected || gdrive.autoSync === false) return;
      clearTimeout(this.syncTimeout);
      this.syncTimeout = setTimeout(() => this.uploadData(false), 2500);
    },

    startPeriodicSync() {
      if (this.periodicInterval) clearInterval(this.periodicInterval);
      this.periodicInterval = setInterval(() => {
        const gdrive = store.getSettings().gdrive;
        if (gdrive && gdrive.isConnected && gdrive.autoSync !== false) this.uploadData(false);
      }, 180000);
    },

    updateStatusVisuals(status) {
      document.querySelectorAll('.header-cloud-chip, .cloud-status-pill').forEach(p => {
        if (status === 'syncing') {
          p.classList.remove('connected');
          p.textContent = '☁️ Syncing...';
        } else if (status === 'connected') {
          p.classList.add('connected');
          const lastSync = store.getSettings().gdrive?.lastSyncedAt;
          p.textContent = lastSync ? `☁️ ${formatTimeAgo(lastSync)}` : '☁️ Synced';
        }
      });
    }
  };

  // =========================================================================
  // 4. REACTIVE DATA STORE (PROJECTS, PHOTOS, LABOURS, VEHICLES, STOCK, SALES)
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
          const projects = (Array.isArray(parsed.projects) ? parsed.projects : []).map(p => ({
            ...p,
            photos: Array.isArray(p.photos) ? p.photos : []
          }));
          return {
            settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
            projects: projects,
            inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
            directSales: Array.isArray(parsed.directSales) ? parsed.directSales : [],
            labours: Array.isArray(parsed.labours) ? parsed.labours : [],
            vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : []
          };
        }
      } catch (e) {}
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }

    saveToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.notifySubscribers();
        if (typeof GDrive !== 'undefined' && GDrive.queueDebouncedSync) GDrive.queueDebouncedSync();
      } catch (e) {}
    }

    subscribe(callback) {
      this.subscribers.push(callback);
      return () => { this.subscribers = this.subscribers.filter(cb => cb !== callback); };
    }

    notifySubscribers() {
      this.subscribers.forEach(cb => { try { cb(this.data); } catch (e) {} });
    }

    getSettings() { return this.data.settings; }
    updateSettings(newSettings) {
      this.data.settings = { ...this.data.settings, ...newSettings };
      this.saveToStorage();
    }

    // Projects
    getProjects() { return this.data.projects; }
    getProjectById(id) { return this.data.projects.find(p => p.id === id); }

    addProject(projectData) {
      const newProj = {
        id: generateId('proj'),
        name: projectData.name || 'Untitled Project',
        customerName: projectData.customerName || '',
        customerPhone: projectData.customerPhone || '',
        siteAddress: projectData.siteAddress || '',
        startDate: projectData.startDate || getTodayDateString(),
        status: projectData.status || 'in_progress',
        estimatedBudget: Number(projectData.estimatedBudget) || 0,
        materials: [],
        payments: [],
        expenses: [],
        photos: [],
        createdAt: new Date().toISOString()
      };
      this.data.projects.unshift(newProj);
      this.saveToStorage();
      return newProj;
    }

    updateProject(id, updatedFields) {
      const idx = this.data.projects.findIndex(p => p.id === id);
      if (idx !== -1) {
        this.data.projects[idx] = { ...this.data.projects[idx], ...updatedFields };
        this.saveToStorage();
        return this.data.projects[idx];
      }
      return null;
    }

    deleteProject(id) {
      this.data.projects = this.data.projects.filter(p => p.id !== id);
      this.saveToStorage();
    }

    // Project Photos (Phase-wise)
    addProjectPhoto(projectId, photoData) {
      const project = this.getProjectById(projectId);
      if (!project) return null;
      if (!Array.isArray(project.photos)) project.photos = [];
      const photo = {
        id: generateId('img'),
        projectId: projectId,
        phase: photoData.phase || 'General Site Progress',
        caption: photoData.caption || '',
        date: photoData.date || getTodayDateString(),
        dataUrl: photoData.dataUrl,
        createdAt: new Date().toISOString()
      };
      project.photos.unshift(photo);
      this.saveToStorage();
      return photo;
    }

    deleteProjectPhoto(projectId, photoId) {
      const project = this.getProjectById(projectId);
      if (!project || !project.photos) return;
      project.photos = project.photos.filter(p => p.id !== photoId);
      this.saveToStorage();
    }

    // Materials in project
    addProjectMaterial(projectId, material) {
      const project = this.getProjectById(projectId);
      if (!project) return null;
      const mat = {
        id: generateId('pmat'),
        name: material.name,
        quantity: Number(material.quantity) || 0,
        unit: material.unit || 'Units',
        rate: Number(material.rate) || 0,
        total: (Number(material.quantity) || 0) * (Number(material.rate) || 0),
        date: material.date || getTodayDateString()
      };
      project.materials.push(mat);
      const invItem = this.data.inventory.find(i => i.name.toLowerCase().trim() === material.name.toLowerCase().trim());
      if (invItem && invItem.currentStock >= mat.quantity) invItem.currentStock -= mat.quantity;
      this.saveToStorage();
      return mat;
    }

    deleteProjectMaterial(projectId, materialId) {
      const project = this.getProjectById(projectId);
      if (!project) return;
      project.materials = project.materials.filter(m => m.id !== materialId);
      this.saveToStorage();
    }

    // Project Payments (Income)
    addProjectPayment(projectId, payment) {
      const project = this.getProjectById(projectId);
      if (!project) return null;
      const pay = {
        id: generateId('pay'),
        date: payment.date || getTodayDateString(),
        amount: Number(payment.amount) || 0,
        mode: payment.mode || 'Cash',
        notes: payment.notes || '',
        createdAt: new Date().toISOString()
      };
      project.payments.push(pay);
      this.saveToStorage();
      return pay;
    }

    deleteProjectPayment(projectId, paymentId) {
      const project = this.getProjectById(projectId);
      if (!project) return;
      project.payments = project.payments.filter(p => p.id !== paymentId);
      this.saveToStorage();
    }

    // Inventory
    getInventory() { return this.data.inventory; }
    getInventoryItemById(id) { return this.data.inventory.find(i => i.id === id); }

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
          supplier: itemData.supplier || 'Initial Stock'
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
        supplier: purchaseData.supplier || 'Supplier',
        notes: purchaseData.notes || ''
      };
      item.purchases.push(purchase);
      item.currentStock += qty;

      const totalPurchasedCost = item.purchases.reduce((s, p) => s + p.totalCost, 0);
      const totalPurchasedQty = item.purchases.reduce((s, p) => s + p.quantity, 0);
      if (totalPurchasedQty > 0) item.avgPurchasePrice = totalPurchasedCost / totalPurchasedQty;

      this.saveToStorage();
      return purchase;
    }

    // Direct Sales
    getDirectSales() { return this.data.directSales; }
    addDirectSale(saleData) {
      const items = saleData.items || [];
      const totalAmount = items.reduce((s, i) => s + (Number(i.total) || 0), 0);
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

      items.forEach(sold => {
        const inv = this.data.inventory.find(i => i.name.toLowerCase().trim() === sold.name.toLowerCase().trim());
        if (inv && inv.currentStock >= (Number(sold.quantity) || 0)) inv.currentStock -= Number(sold.quantity) || 0;
      });

      this.data.directSales.unshift(newSale);
      this.saveToStorage();
      return newSale;
    }
    deleteDirectSale(id) {
      this.data.directSales = this.data.directSales.filter(s => s.id !== id);
      this.saveToStorage();
    }

    // =======================================================================
    // VEHICLES & MACHINERY MANAGEMENT
    // =======================================================================
    getVehicles() { return this.data.vehicles || []; }
    getVehicleById(id) { return (this.data.vehicles || []).find(v => v.id === id); }

    addVehicle(vehData) {
      if (!Array.isArray(this.data.vehicles)) this.data.vehicles = [];
      const newVeh = {
        id: generateId('veh'),
        name: vehData.name || 'JCB 3DX',
        type: vehData.type || 'JCB / Excavator',
        regNumber: vehData.regNumber || '',
        driverName: vehData.driverName || '',
        driverPhone: vehData.driverPhone || '',
        defaultRateType: vehData.defaultRateType || 'hour',
        defaultRate: Number(vehData.defaultRate) || 1200,
        rentals: []
      };
      this.data.vehicles.push(newVeh);
      this.saveToStorage();
      return newVeh;
    }

    deleteVehicle(id) {
      this.data.vehicles = (this.data.vehicles || []).filter(v => v.id !== id);
      this.saveToStorage();
    }

    logVehicleRental(vehicleId, rentalData) {
      const vehicle = this.getVehicleById(vehicleId);
      if (!vehicle) return null;
      if (!Array.isArray(vehicle.rentals)) vehicle.rentals = [];

      const duration = Number(rentalData.durationUnits) || 1;
      const rate = Number(rentalData.rate) || vehicle.defaultRate || 0;
      const totalAmount = rentalData.totalAmount !== undefined ? Number(rentalData.totalAmount) : Math.round(duration * rate);
      const amountPaid = Number(rentalData.amountPaid) !== undefined ? Number(rentalData.amountPaid) : totalAmount;

      const rental = {
        id: generateId('vrnt'),
        date: rentalData.date || getTodayDateString(),
        projectId: rentalData.projectId || '',
        clientName: rentalData.clientName || '',
        clientPhone: rentalData.clientPhone || '',
        durationUnits: duration,
        rateType: rentalData.rateType || vehicle.defaultRateType || 'hour',
        rate: rate,
        totalAmount: totalAmount,
        amountPaid: amountPaid,
        paymentMode: rentalData.paymentMode || 'Cash',
        notes: rentalData.notes || '',
        createdAt: new Date().toISOString()
      };

      vehicle.rentals.unshift(rental);
      this.saveToStorage();
      return rental;
    }

    deleteVehicleRental(vehicleId, rentalId) {
      const vehicle = this.getVehicleById(vehicleId);
      if (!vehicle || !vehicle.rentals) return;
      vehicle.rentals = vehicle.rentals.filter(r => r.id !== rentalId);
      this.saveToStorage();
    }

    getVehicleFinancials(vehicle) {
      let totalHours = 0;
      let totalDays = 0;
      let totalBilled = 0;
      let totalCollected = 0;

      (vehicle.rentals || []).forEach(r => {
        if (r.rateType === 'hour') totalHours += Number(r.durationUnits) || 0;
        else if (r.rateType === 'day') totalDays += Number(r.durationUnits) || 0;
        totalBilled += Number(r.totalAmount) || 0;
        totalCollected += Number(r.amountPaid) || 0;
      });

      return {
        totalHours: Number(totalHours.toFixed(1)),
        totalDays: Number(totalDays.toFixed(1)),
        totalBilled: Math.round(totalBilled),
        totalCollected: Math.round(totalCollected),
        balanceDue: Math.max(0, Math.round(totalBilled - totalCollected)),
        totalRentals: (vehicle.rentals || []).length
      };
    }

    getProjectVehicleStats(projectId) {
      let totalVehicleCost = 0;
      let totalVehiclePaid = 0;
      const projectVehicleLogs = [];

      (this.data.vehicles || []).forEach(veh => {
        (veh.rentals || []).filter(r => r.projectId === projectId).forEach(r => {
          totalVehicleCost += Number(r.totalAmount) || 0;
          totalVehiclePaid += Number(r.amountPaid) || 0;
          projectVehicleLogs.push({
            id: r.id,
            vehicleId: veh.id,
            vehicleName: veh.name,
            vehicleType: veh.type,
            regNumber: veh.regNumber,
            date: r.date,
            durationUnits: r.durationUnits,
            rateType: r.rateType,
            rate: r.rate,
            totalAmount: r.totalAmount,
            amountPaid: r.amountPaid,
            balanceDue: Math.max(0, r.totalAmount - r.amountPaid),
            notes: r.notes
          });
        });
      });

      projectVehicleLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
      return {
        totalVehicleCost: Math.round(totalVehicleCost),
        totalVehiclePaid: Math.round(totalVehiclePaid),
        projectVehicleLogs
      };
    }

    // =======================================================================
    // LABOURS & HEAD MASON / GANG MANAGEMENT
    // =======================================================================
    getLabours() { return this.data.labours; }
    getLabourById(id) { return this.data.labours.find(l => l.id === id); }

    addLabour(labourData) {
      const existing = this.data.labours.find(l => l.name.toLowerCase().trim() === (labourData.name || '').toLowerCase().trim());
      if (existing) return existing;

      const newLabour = {
        id: generateId('lab'),
        name: labourData.name,
        role: labourData.role || 'Mason',
        isHeadMason: Boolean(labourData.isHeadMason || labourData.role?.includes('Head Mason')),
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

    updateLabour(id, updatedFields) {
      const idx = this.data.labours.findIndex(l => l.id === id);
      if (idx !== -1) {
        this.data.labours[idx] = { ...this.data.labours[idx], ...updatedFields };
        this.saveToStorage();
        return this.data.labours[idx];
      }
      return null;
    }

    // Supports individual and Head Mason / Gang multi-worker effort logging
    logLabourAttendance(labourId, attData) {
      const labour = this.getLabourById(labourId);
      if (!labour) return null;
      if (!Array.isArray(labour.attendance)) labour.attendance = [];

      const isGroup = Boolean(attData.isGroupEntry || labour.isHeadMason);
      const men = Number(attData.menCount) || 0;
      const women = Number(attData.womenCount) || 0;
      const workerCount = isGroup ? ((men + women > 0) ? (men + women) : (Number(attData.workerCount) || 1)) : 1;
      const days = Number(attData.days) || 1;
      const manDays = Number((workerCount * days).toFixed(1));
      const rate = Number(attData.rate) || (labour.wageRate || 0);

      // Direct totalCost entered by user, or fallback to manDays * rate
      const totalCost = (attData.totalCost !== undefined && attData.totalCost !== '') 
        ? Number(attData.totalCost) 
        : Math.round(manDays * rate);

      const entry = {
        id: generateId('att'),
        date: attData.date || getTodayDateString(),
        status: isGroup ? 'gang_effort' : (days > 1 ? 'multi_days' : (attData.status || 'full_day')),
        isGroupEntry: isGroup,
        menCount: men,
        womenCount: women,
        workerCount: workerCount,
        days: days,
        manDays: manDays,
        rate: rate,
        totalCost: totalCost,
        projectId: attData.projectId || '',
        notes: attData.notes || ''
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
        isGroupEntry: false,
        workerCount: 1,
        days: Number(daysToAdd),
        manDays: Number(daysToAdd),
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
      if (!labour || !labour.attendance) return;
      labour.attendance = labour.attendance.filter(a => a.id !== attendanceId);
      this.saveToStorage();
    }

    addLabourPayout(labourId, payoutData) {
      const labour = this.getLabourById(labourId);
      if (!labour) return null;
      if (!Array.isArray(labour.payouts)) labour.payouts = [];

      const payout = {
        id: generateId('pay'),
        date: payoutData.date || getTodayDateString(),
        amount: Number(payoutData.amount) || 0,
        type: payoutData.type || (labour.isHeadMason ? 'Gang Wage Payout' : 'Daily Wage'),
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
      if (!labour || !labour.payouts) return;
      labour.payouts = labour.payouts.filter(p => p.id !== payoutId);
      this.saveToStorage();
    }

    getLabourFinancials(labour) {
      let totalEarned = 0;
      let totalManDays = 0;
      const projectDaysMap = {};

      (labour.attendance || []).forEach(att => {
        const mDays = att.manDays !== undefined ? Number(att.manDays) : (Number(att.days) || 1);
        const lineCost = att.totalCost !== undefined ? Number(att.totalCost) : Math.round(mDays * (att.rate || labour.wageRate || 0));

        totalEarned += lineCost;
        totalManDays += mDays;

        const pKey = att.projectId || 'outside';
        projectDaysMap[pKey] = Number(((projectDaysMap[pKey] || 0) + mDays).toFixed(1));
      });

      const totalPaid = (labour.payouts || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
      return {
        totalEarned: Math.round(totalEarned),
        totalPaid: Math.round(totalPaid),
        totalManDays: Number(totalManDays.toFixed(1)),
        balanceDue: Math.max(0, Math.round(totalEarned - totalPaid)),
        projectDaysMap
      };
    }

    getProjectLabourStats(projectId) {
      let totalLabourCost = 0;
      let totalLabourPaid = 0;
      let totalDays = 0;
      const workerStats = [];
      const projectEffortLogs = [];

      this.data.labours.forEach(labour => {
        const projAtt = (labour.attendance || []).filter(a => a.projectId === projectId);
        const projPay = (labour.payouts || []).filter(p => p.projectId === projectId);

        if (projAtt.length > 0 || projPay.length > 0) {
          let labourSiteCost = 0;
          let labourSiteDays = 0;

          projAtt.forEach(att => {
            const mDays = att.manDays !== undefined ? Number(att.manDays) : (Number(att.days) || 1);
            const lineCost = att.totalCost !== undefined ? Number(att.totalCost) : Math.round(mDays * (att.rate || labour.wageRate || 0));

            labourSiteCost += lineCost;
            labourSiteDays += mDays;

            projectEffortLogs.push({
              id: att.id,
              labourId: labour.id,
              labourName: labour.name,
              labourRole: labour.role,
              isHeadMason: labour.isHeadMason,
              isGroupEntry: att.isGroupEntry,
              menCount: att.menCount || 0,
              womenCount: att.womenCount || 0,
              workerCount: att.workerCount || 1,
              date: att.date,
              days: att.days || 1,
              manDays: mDays,
              rate: att.rate || labour.wageRate,
              earned: lineCost,
              notes: att.notes
            });
          });

          const paid = projPay.reduce((s, p) => s + (Number(p.amount) || 0), 0);
          totalLabourCost += labourSiteCost;
          totalLabourPaid += paid;
          totalDays += labourSiteDays;

          workerStats.push({
            labour,
            daysWorked: Number(labourSiteDays.toFixed(1)),
            earned: Math.round(labourSiteCost),
            paid: paid,
            balanceDue: Math.max(0, Math.round(labourSiteCost - paid))
          });
        }
      });

      projectEffortLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
      return {
        totalLabourCost: Math.round(totalLabourCost),
        totalLabourPaid,
        totalDays: Number(totalDays.toFixed(1)),
        workerStats,
        projectEffortLogs
      };
    }

    // Financial aggregates across entire business
    getTotalIncome() {
      let total = 0;
      this.data.projects.forEach(p => (p.payments || []).forEach(pay => { total += Number(pay.amount) || 0; }));
      this.data.directSales.forEach(s => { total += Number(s.amountPaid) || 0; });
      (this.data.vehicles || []).forEach(v => (v.rentals || []).forEach(r => { total += Number(r.amountPaid) || 0; }));
      return total;
    }

    getTotalSpends() {
      let total = 0;
      this.data.inventory.forEach(inv => (inv.purchases || []).forEach(p => { total += Number(p.totalCost) || 0; }));
      this.data.labours.forEach(lab => (lab.payouts || []).forEach(p => { total += Number(p.amount) || 0; }));
      this.data.projects.forEach(p => (p.expenses || []).forEach(e => { total += Number(e.amount) || 0; }));
      return total;
    }

    getNetProfit() { return this.getTotalIncome() - this.getTotalSpends(); }
    getTotalInventoryValuation() {
      return this.data.inventory.reduce((sum, item) => sum + ((Number(item.currentStock) || 0) * (Number(item.avgPurchasePrice) || 0)), 0);
    }
    getActiveProjectsCount() { return this.data.projects.filter(p => p.status === 'in_progress').length; }

    getProjectFinancials(project) {
      const materialsTotal = (project.materials || []).reduce((s, m) => s + (Number(m.total) || 0), 0);
      const expensesTotal = (project.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const totalCollected = (project.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);

      const labourStats = this.getProjectLabourStats(project.id);
      const vehicleStats = this.getProjectVehicleStats(project.id);

      const estimatedValue = Number(project.estimatedBudget) > 0 ? Number(project.estimatedBudget) : (materialsTotal + vehicleStats.totalVehicleCost);
      const totalProjectCost = materialsTotal + labourStats.totalLabourCost + vehicleStats.totalVehicleCost + expensesTotal;

      return {
        materialsTotal,
        labourCost: labourStats.totalLabourCost,
        vehicleCost: vehicleStats.totalVehicleCost,
        totalCost: totalProjectCost,
        totalCollected,
        estimatedValue,
        pendingBalance: Math.max(0, estimatedValue - totalCollected),
        estimatedProfit: totalCollected - totalProjectCost
      };
    }

    getRecentActivities(limit = 8) {
      const list = [];
      this.data.projects.forEach(p => {
        (p.payments || []).forEach(pay => {
          list.push({ id: pay.id, type: 'income', title: `Project: ${p.customerName || p.name}`, subtitle: `Payment received`, amount: pay.amount, date: pay.date });
        });
      });
      this.data.directSales.forEach(s => {
        list.push({ id: s.id, type: 'income', title: `Direct Sale: ${s.customerName}`, subtitle: `${s.items.length} items sold`, amount: s.amountPaid, date: s.date });
      });
      (this.data.vehicles || []).forEach(v => {
        (v.rentals || []).forEach(r => {
          list.push({ id: r.id, type: 'income', title: `Vehicle: ${v.name}`, subtitle: `${r.clientName || 'Site Dispatch'} (${r.durationUnits} ${r.rateType}s)`, amount: r.amountPaid, date: r.date });
        });
      });
      this.data.inventory.forEach(inv => {
        (inv.purchases || []).forEach(pur => {
          list.push({ id: pur.id, type: 'spend', title: `Stock: ${inv.name}`, subtitle: `${pur.quantity} ${inv.unit} (${pur.supplier})`, amount: pur.totalCost, date: pur.date });
        });
      });
      this.data.labours.forEach(lab => {
        (lab.payouts || []).forEach(pay => {
          list.push({ id: pay.id, type: 'spend', title: `Paid ${lab.name}`, subtitle: `${pay.type} (${lab.role})`, amount: pay.amount, date: pay.date });
        });
      });
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      return list.slice(0, limit);
    }

    exportFullData() { return JSON.parse(JSON.stringify(this.data)); }
    importFullData(importedData) {
      if (!importedData || typeof importedData !== 'object') throw new Error('Invalid JSON');
      this.data = {
        settings: { ...DEFAULT_STATE.settings, ...(importedData.settings || {}) },
        projects: Array.isArray(importedData.projects) ? importedData.projects : [],
        inventory: Array.isArray(importedData.inventory) ? importedData.inventory : [],
        directSales: Array.isArray(importedData.directSales) ? importedData.directSales : [],
        labours: Array.isArray(importedData.labours) ? importedData.labours : [],
        vehicles: Array.isArray(importedData.vehicles) ? importedData.vehicles : []
      };
      this.saveToStorage();
    }
    resetAllData() {
      this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
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
  let vehicleSearchQuery = '';
  let directSaleItemsTemp = [];
  let deferredInstallPrompt = null;

  // --- 5.1 DASHBOARD VIEW ---
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
    const vehiclesCount = store.getVehicles().length;
    const recentActivities = store.getRecentActivities(8);
    const projects = store.getProjects().slice(0, 3);

    const companyTitle = settings.companyName || 'BuilderMate';
    const greetingSubtitle = settings.contractorName ? `Welcome back, ${settings.contractorName}` : 'Construction Business Overview';

    container.innerHTML = `
      <div class="dashboard-header">
        <div class="company-brand-badge">
          <img src="icon.png" alt="BuilderMate" class="brand-avatar" />
          <div class="brand-text">
            <h1 class="company-name-text">${companyTitle}</h1>
            <p class="contractor-greeting-text">${greetingSubtitle}</p>
            ${gdrive.isConnected ? `
              <span class="header-cloud-chip connected" id="header-cloud-sync-chip" style="cursor:pointer" title="Connected to Google Drive: ${gdrive.userEmail}. Tap to sync now!">
                ☁️ ${gdrive.lastSyncedAt ? formatTimeAgo(gdrive.lastSyncedAt) : 'Synced'}
              </span>
            ` : ''}
          </div>
        </div>
        <div class="header-actions-group">
          <button class="icon-btn" id="dash-theme-toggle-btn" title="Toggle Theme" aria-label="Theme">
            ${isDark ? '☀️' : '🌙'}
          </button>
          <button class="icon-btn" id="dash-hard-refresh-btn" title="Hard Refresh" aria-label="Refresh">🔄</button>
          <button class="icon-btn" id="dash-settings-btn" title="Settings" aria-label="Settings">⚙️</button>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card metric-income">
          <div class="metric-header">
            <span class="metric-label">Total Income</span>
            <div class="metric-icon-wrap income-icon">↓</div>
          </div>
          <div class="metric-value income-color">${formatCurrency(totalIncome, currency)}</div>
          <div class="metric-footer">Projects, Vehicles & Sales</div>
        </div>

        <div class="metric-card metric-spend">
          <div class="metric-header">
            <span class="metric-label">Total Spends</span>
            <div class="metric-icon-wrap spend-icon">↑</div>
          </div>
          <div class="metric-value spend-color">${formatCurrency(totalSpends, currency)}</div>
          <div class="metric-footer">Stock Purchases & Wages</div>
        </div>

        <div class="metric-card metric-profit">
          <div class="metric-header">
            <span class="metric-label">Net Cashflow</span>
            <span class="status-pill ${netProfit >= 0 ? 'pill-green' : 'pill-red'}">${netProfit >= 0 ? 'Profit' : 'Deficit'}</span>
          </div>
          <div class="metric-value ${netProfit >= 0 ? 'income-color' : 'spend-color'}">${formatCurrency(netProfit, currency)}</div>
          <div class="metric-footer">Total Net Margin</div>
        </div>

        <div class="metric-card metric-operations">
          <div class="metric-header">
            <span class="metric-label">Assets & Fleet</span>
            <span class="badge-count">${activeProjectsCount} Sites</span>
          </div>
          <div class="metric-sub-stats">
            <div class="stat-line">
              <span class="text-muted">Stock Assets:</span>
              <strong class="font-mono">${formatCurrency(inventoryValuation, currency)}</strong>
            </div>
            <div class="stat-line">
              <span class="text-muted">Vehicles:</span>
              <strong class="font-mono">${vehiclesCount} Machines</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="section-container">
        <h2 class="section-title">Quick Actions</h2>
        <div class="quick-actions-bar">
          <button class="quick-action-btn" id="qa-new-project">
            <span class="qa-icon-circle bg-blue">🏗️</span>
            <span class="qa-text">Project</span>
          </button>
          <button class="quick-action-btn" id="qa-buy-material">
            <span class="qa-icon-circle bg-orange">📦</span>
            <span class="qa-text">Buy Stock</span>
          </button>
          <button class="quick-action-btn" id="qa-log-vehicle">
            <span class="qa-icon-circle bg-blue">🚜</span>
            <span class="qa-text">Machine</span>
          </button>
          <button class="quick-action-btn" id="qa-log-labour">
            <span class="qa-icon-circle bg-purple">👷</span>
            <span class="qa-text">Labour</span>
          </button>
        </div>
      </div>

      <div class="section-container">
        <div class="section-header-flex">
          <h2 class="section-title">Active Projects</h2>
          <button class="text-link-btn" id="view-all-projects-btn">View All →</button>
        </div>
        ${projects.length === 0 ? `
          <div class="empty-state-card">
            <p class="empty-desc">Create your first construction project to track site photos, machinery, materials and wages.</p>
            <button class="btn btn-primary btn-sm" id="empty-add-proj-btn">+ Start Project</button>
          </div>
        ` : `
          <div class="projects-mini-list">
            ${projects.map(p => {
              const fin = store.getProjectFinancials(p);
              return `
                <div class="project-mini-card" data-project-id="${p.id}">
                  <div class="proj-mini-top">
                    <div>
                      <h3 class="proj-mini-name">${p.name}</h3>
                      <p class="proj-mini-client">👤 ${p.customerName || 'Direct Site'}</p>
                    </div>
                    <span class="status-tag status-${p.status}">${p.status.replace('_', ' ')}</span>
                  </div>
                  <div class="proj-mini-financials">
                    <div class="proj-stat"><span class="stat-lbl">Collected</span><strong class="income-color">${formatCurrency(fin.totalCollected, currency)}</strong></div>
                    <div class="proj-stat"><span class="stat-lbl">Est. Total</span><strong>${formatCurrency(fin.estimatedValue, currency)}</strong></div>
                    <div class="proj-stat"><span class="stat-lbl">Photos</span><strong>📸 ${p.photos?.length || 0}</strong></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <div class="section-container">
        <h2 class="section-title">Recent Activity</h2>
        <div class="activity-timeline">
          ${recentActivities.length === 0 ? `<p class="text-muted text-xs">No transactions logged yet.</p>` : recentActivities.map(act => `
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
                <div class="activity-meta"><span>${act.subtitle}</span> • <span>${formatDate(act.date)}</span></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelector('#header-cloud-sync-chip')?.addEventListener('click', () => GDrive.uploadData(true, true));
    container.querySelector('#dash-theme-toggle-btn')?.addEventListener('click', toggleTheme);
    container.querySelector('#dash-hard-refresh-btn')?.addEventListener('click', (e) => executeHardRefresh(e.currentTarget));
    container.querySelector('#dash-settings-btn')?.addEventListener('click', () => { renderSettingsModal(); openModal('settings-modal'); });

    container.querySelector('#qa-new-project')?.addEventListener('click', () => openModal('new-project-modal'));
    container.querySelector('#qa-buy-material')?.addEventListener('click', () => openBuyStockModal());
    container.querySelector('#qa-log-vehicle')?.addEventListener('click', () => openLogVehicleRentalModal());
    container.querySelector('#qa-log-labour')?.addEventListener('click', () => openLogAttendanceModal());
    container.querySelector('#empty-add-proj-btn')?.addEventListener('click', () => openModal('new-project-modal'));
    container.querySelector('#view-all-projects-btn')?.addEventListener('click', () => switchTab('projects'));

    container.querySelectorAll('.project-mini-card').forEach(card => {
      card.addEventListener('click', () => {
        switchTab('projects');
        openProjectDetailsModal(card.dataset.projectId);
      });
    });
  }

  // --- 5.2 PROJECTS VIEW ---
  function renderProjects(container) {
    const settings = store.getSettings();
    const currency = settings.currency || '₹';
    const allProjects = store.getProjects();

    const filtered = allProjects.filter(p => {
      if (projectFilter !== 'all' && p.status !== projectFilter) return false;
      if (projectSearchQuery) {
        const q = projectSearchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.customerName && p.customerName.toLowerCase().includes(q));
      }
      return true;
    });

    container.innerHTML = `
      <div class="page-top-bar">
        <div>
          <h1 class="page-main-title">Projects Hub</h1>
          <p class="page-sub-title">Track sites, photos, machinery, materials & labour efforts</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-create-new-project">+ New Project</button>
      </div>

      <div class="search-filter-row">
        <div class="search-box">
          <input type="text" id="project-search-input" placeholder="Search projects or client..." value="${projectSearchQuery}" />
        </div>
        <div class="filter-pills-row">
          <button class="filter-pill ${projectFilter === 'all' ? 'active' : ''}" data-filter="all">All (${allProjects.length})</button>
          <button class="filter-pill ${projectFilter === 'in_progress' ? 'active' : ''}" data-filter="in_progress">In Progress</button>
          <button class="filter-pill ${projectFilter === 'completed' ? 'active' : ''}" data-filter="completed">Completed</button>
        </div>
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon">🏗️</div>
          <div class="empty-title">No Projects Found</div>
          <button class="btn btn-primary btn-sm" id="empty-create-project-btn">+ Add New Project</button>
        </div>
      ` : `
        <div class="projects-card-grid">
          ${filtered.map(p => {
            const fin = store.getProjectFinancials(p);
            const labourStats = store.getProjectLabourStats(p.id);
            const photoCount = p.photos ? p.photos.length : 0;
            const waMsg = `Hello ${p.customerName || 'Sir/Madam'}, project update for ${p.name}. Collected: ${formatCurrency(fin.totalCollected, currency)}. Remaining balance: ${formatCurrency(fin.pendingBalance, currency)}. - ${settings.companyName || 'BuilderMate'}`;

            return `
              <div class="project-card" data-id="${p.id}">
                <div class="project-card-header">
                  <div>
                    <h3 class="project-name-heading">${p.name}</h3>
                    <div class="project-client-name">👤 ${p.customerName || 'Direct Site'} ${p.siteAddress ? `• 📍 ${p.siteAddress}` : ''}</div>
                  </div>
                  <span class="status-tag status-${p.status}">${p.status.replace('_', ' ')}</span>
                </div>

                ${p.customerPhone ? `
                  <div class="customer-contact-bar">
                    <span class="contact-phone-badge">📞 ${p.customerPhone}</span>
                    <div class="contact-actions">
                      <a href="${getWhatsAppLink(p.customerPhone, waMsg)}" target="_blank" class="btn-contact-action btn-wa">WhatsApp</a>
                      <a href="${getTelLink(p.customerPhone)}" class="btn-contact-action btn-call">Call</a>
                    </div>
                  </div>
                ` : ''}

                <div class="project-finance-box">
                  <div class="finance-grid">
                    <div class="fin-item"><span class="fin-lbl">Collected</span><strong class="fin-val income-color">${formatCurrency(fin.totalCollected, currency)}</strong></div>
                    <div class="fin-item"><span class="fin-lbl">Est. Total</span><strong class="fin-val">${formatCurrency(fin.estimatedValue, currency)}</strong></div>
                    <div class="fin-item"><span class="fin-lbl">Balance</span><strong class="fin-val ${fin.pendingBalance > 0 ? 'text-amber' : 'income-color'}">${formatCurrency(fin.pendingBalance, currency)}</strong></div>
                  </div>
                </div>

                <div class="project-materials-snippet">
                  <div class="materials-tag-cloud">
                    <span class="mat-tag">📸 <strong>${photoCount} Photos</strong></span>
                    <span class="mat-tag">👷 <strong>${labourStats.totalDays}d Labour</strong></span>
                    <span class="mat-tag">🧱 <strong>${p.materials?.length || 0} Materials</strong></span>
                  </div>
                </div>

                <div class="project-card-footer">
                  <button class="btn btn-outline btn-sm btn-view-project" data-id="${p.id}">📊 Details & Photos</button>
                  <button class="btn btn-secondary btn-sm btn-quick-payment" data-id="${p.id}">+ Collect Money</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    container.querySelector('#btn-create-new-project')?.addEventListener('click', () => openModal('new-project-modal'));
    container.querySelector('#empty-create-project-btn')?.addEventListener('click', () => openModal('new-project-modal'));

    const searchInput = container.querySelector('#project-search-input');
    searchInput?.addEventListener('input', (e) => {
      projectSearchQuery = e.target.value;
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

  // --- 5.3 PROJECT DETAILS WITH PHASE-WISE PHOTOS, GANG LABOURS & MACHINERY ---
  function openProjectDetailsModal(projectId, defaultExpanded = 'photos') {
    const project = store.getProjectById(projectId);
    if (!project) return;

    const settings = store.getSettings();
    const currency = settings.currency || '₹';
    const fin = store.getProjectFinancials(project);
    const labourStats = store.getProjectLabourStats(projectId);
    const vehicleStats = store.getProjectVehicleStats(projectId);
    const photos = project.photos || [];

    const modalContainer = document.getElementById('project-details-modal-content');
    if (!modalContainer) return;

    const waSummary = `*${settings.companyName || 'BuilderMate'} - Project Statement*\nProject: *${project.name}*\nClient: *${project.customerName || '-'}*\n\n*Summary:*\n• Site Photos: ${photos.length}\n• Materials: ${currency} ${fin.materialsTotal}\n• Machinery & Vehicles: ${currency} ${vehicleStats.totalVehicleCost}\n• Labour Wages: ${currency} ${labourStats.totalLabourCost} (${labourStats.totalDays} man-days)\n\n*Financials:*\n• Total Billed/Est: *${currency} ${fin.estimatedValue}*\n• Total Paid: *${currency} ${fin.totalCollected}*\n• *Balance Due: ${currency} ${fin.pendingBalance}*\n\nThank you!`;

    modalContainer.innerHTML = `
      <div class="sheet-header">
        <div>
          <span class="status-tag status-${project.status}">${project.status.replace('_', ' ')}</span>
          <h2 class="sheet-title">${project.name}</h2>
          <p class="text-muted text-sm">Site: ${project.siteAddress || 'Main Site'} • Started: ${formatDate(project.startDate)}</p>
        </div>
        <button class="sheet-close-btn" data-close-modal="project-details-modal" aria-label="Close">×</button>
      </div>

      <div class="sheet-body">
        <div class="client-details-card">
          <div class="client-info-row">
            <div><strong>Client:</strong> ${project.customerName || 'Direct Site'}</div>
            ${project.customerPhone ? `<div><strong>Phone:</strong> ${project.customerPhone}</div>` : ''}
          </div>
          ${project.customerPhone ? `
            <div class="client-actions-grid" style="margin-top:6px">
              <a href="${getWhatsAppLink(project.customerPhone, waSummary)}" target="_blank" class="btn btn-wa btn-sm">💬 WhatsApp Summary</a>
              <a href="${getTelLink(project.customerPhone)}" class="btn btn-outline btn-sm">📞 Call Client</a>
            </div>
          ` : ''}
        </div>

        <div class="proj-sheet-finance-grid">
          <div class="fin-box-sm"><span class="lbl">Est. Total</span><strong>${formatCurrency(fin.estimatedValue, currency)}</strong></div>
          <div class="fin-box-sm"><span class="lbl">Collected</span><strong class="income-color">${formatCurrency(fin.totalCollected, currency)}</strong></div>
          <div class="fin-box-sm"><span class="lbl">Balance Due</span><strong class="${fin.pendingBalance > 0 ? 'text-amber' : 'income-color'}">${formatCurrency(fin.pendingBalance, currency)}</strong></div>
        </div>

        <!-- COLLAPSIBLE ACCORDION SECTIONS -->
        <div class="project-accordions-group">

          <!-- ACCORDION 1: PHASE-WISE SITE PHOTOS -->
          <div class="proj-accordion-card ${defaultExpanded === 'photos' ? 'expanded' : ''}" id="acc-card-photos">
            <button type="button" class="proj-accordion-header" data-target="acc-card-photos">
              <div class="proj-accordion-title-wrap">
                <span class="proj-accordion-icon">📸</span>
                <span class="proj-accordion-title">Site Photos & Progress</span>
                <span class="proj-accordion-badge">${photos.length} Photos</span>
              </div>
              <svg class="proj-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="proj-accordion-content">
              <div class="section-header-flex" style="margin-bottom:10px">
                <span class="text-xs text-muted">Take or upload phase-wise site photos</span>
                <button class="btn btn-primary btn-xs" id="btn-take-site-photo">📸 + Take / Upload Photo</button>
              </div>

              ${photos.length === 0 ? `
                <div class="empty-table-msg">No site photos taken yet. Tap <strong>"+ Take / Upload Photo"</strong> to capture foundation, slab, masonry, or finishing progress.</div>
              ` : `
                <div class="site-photos-grid">
                  ${photos.map(p => `
                    <div class="site-photo-card">
                      <div class="site-photo-thumb-wrap btn-open-lightbox" data-photo-id="${p.id}" data-url="${p.dataUrl}" data-caption="${p.caption || ''}" data-phase="${p.phase}" data-date="${formatDate(p.date)}">
                        <img src="${p.dataUrl}" alt="${p.phase}" class="site-photo-thumb" loading="lazy" />
                        <span class="site-photo-phase-badge">${p.phase.split(' ')[0]}</span>
                      </div>
                      <div class="site-photo-info">
                        <div class="site-photo-caption" title="${p.caption || p.phase}">${p.caption || p.phase}</div>
                        <div class="site-photo-date">${formatDate(p.date)}</div>
                        <div class="site-photo-actions">
                          <button class="site-photo-action-btn btn-open-lightbox" data-photo-id="${p.id}" data-url="${p.dataUrl}" data-caption="${p.caption || ''}" data-phase="${p.phase}" data-date="${formatDate(p.date)}">🔍 View</button>
                          <button class="site-photo-action-btn btn-delete-photo" data-photo-id="${p.id}" title="Delete Photo">🗑️</button>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

          <!-- ACCORDION 2: LABOURS & HEAD MASON GANGS -->
          <div class="proj-accordion-card ${defaultExpanded === 'labours' ? 'expanded' : ''}" id="acc-card-labours">
            <button type="button" class="proj-accordion-header" data-target="acc-card-labours">
              <div class="proj-accordion-title-wrap">
                <span class="proj-accordion-icon">👷</span>
                <span class="proj-accordion-title">Labours & Gang Efforts</span>
                <span class="proj-accordion-badge">${labourStats.workerStats.length} Workers • ${labourStats.totalDays}d</span>
              </div>
              <svg class="proj-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="proj-accordion-content">
              <div class="section-header-flex" style="margin-bottom:10px">
                <span class="text-xs text-muted">Track Head Mason teams, daily workers & wages</span>
                <div style="display:flex; gap:6px">
                  <button class="btn btn-primary btn-xs" id="btn-add-proj-effort">+ Log Effort (Days/Gang)</button>
                  <button class="btn btn-secondary btn-xs" id="btn-add-proj-lab-payout">+ Pay Worker/Gang</button>
                </div>
              </div>

              <div class="inventory-overview-grid" style="grid-template-columns:1fr 1fr 1fr; margin-bottom:12px">
                <div class="inv-kpi-card" style="padding:8px 6px"><span class="kpi-lbl" style="font-size:0.62rem">Wages Cost</span><strong class="kpi-val spend-color" style="font-size:0.85rem">${formatCurrency(labourStats.totalLabourCost, currency)}</strong></div>
                <div class="inv-kpi-card" style="padding:8px 6px"><span class="kpi-lbl" style="font-size:0.62rem">Paid on Site</span><strong class="kpi-val" style="font-size:0.85rem">${formatCurrency(labourStats.totalLabourPaid, currency)}</strong></div>
                <div class="inv-kpi-card" style="padding:8px 6px"><span class="kpi-lbl" style="font-size:0.62rem">Total Days</span><strong class="kpi-val" style="font-size:0.85rem">${labourStats.totalDays} Days</strong></div>
              </div>

              ${labourStats.workerStats.length === 0 ? `
                <div class="empty-table-msg">No workers assigned to this site yet. Tap <strong>"+ Log Effort"</strong> to assign individual workers or a Head Mason's gang.</div>
              ` : `
                <div class="proj-workers-list">
                  ${labourStats.workerStats.map(ws => {
                    const slipMsg = `*${settings.companyName || 'BuilderMate'} - Site Wage Slip*\nProject: *${project.name}*\nWorker: *${ws.labour.name}* ${ws.labour.isHeadMason ? '(Head Mason / Gang)' : ''}\nDays: *${ws.daysWorked} man-days*\nTotal Earned: *${currency} ${ws.earned}*\nPaid: *${currency} ${ws.paid}*\n*Balance Due: ${currency} ${ws.balanceDue}*`;
                    return `
                      <div class="proj-labour-card">
                        <div class="proj-labour-top">
                          <div>
                            <span class="proj-labour-name">${ws.labour.name}</span>
                            ${ws.labour.isHeadMason ? `<span class="head-mason-badge">👑 Head Mason</span>` : ''}
                            <div class="proj-labour-role">${ws.labour.role} • ${currency}${ws.labour.wageRate}/day</div>
                          </div>
                          ${ws.labour.phone ? `<a href="${getWhatsAppLink(ws.labour.phone, slipMsg)}" target="_blank" class="btn btn-wa btn-xs">💬 Slip</a>` : ''}
                        </div>
                        <div class="proj-labour-metrics">
                          <div class="proj-labour-stat"><span class="lbl">Man-Days</span><strong>${ws.daysWorked}d</strong></div>
                          <div class="proj-labour-stat"><span class="lbl">Earned</span><strong class="spend-color">${formatCurrency(ws.earned, currency)}</strong></div>
                          <div class="proj-labour-stat"><span class="lbl">Balance</span><strong class="${ws.balanceDue > 0 ? 'text-amber' : 'income-color'}">${formatCurrency(ws.balanceDue, currency)}</strong></div>
                        </div>
                        <div class="quick-days-strip">
                          <span class="text-xs text-muted font-bold">Quick Add:</span>
                          <button type="button" class="btn-day-increment btn-quick-add-days" data-lab-id="${ws.labour.id}" data-days="1">+1 Day</button>
                          <button type="button" class="btn-day-increment btn-quick-add-days" data-lab-id="${ws.labour.id}" data-days="5">+5 Days</button>
                          <button type="button" class="btn-day-increment btn-custom-add-days" data-lab-id="${ws.labour.id}">+ Custom Days</button>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
          </div>

          <!-- ACCORDION 3: VEHICLES & MACHINERY (JCB, TIPPER, TRACTOR) -->
          <div class="proj-accordion-card ${defaultExpanded === 'vehicles' ? 'expanded' : ''}" id="acc-card-vehicles">
            <button type="button" class="proj-accordion-header" data-target="acc-card-vehicles">
              <div class="proj-accordion-title-wrap">
                <span class="proj-accordion-icon">🚜</span>
                <span class="proj-accordion-title">Vehicles & Machinery Hired</span>
                <span class="proj-accordion-badge">${vehicleStats.projectVehicleLogs.length} Trips • ${formatCurrency(vehicleStats.totalVehicleCost, currency)}</span>
              </div>
              <svg class="proj-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="proj-accordion-content">
              <div class="section-header-flex" style="margin-bottom:10px">
                <span class="text-xs text-muted">JCB excavation, Tipper loads, Tractor trips</span>
                <button class="btn btn-primary btn-xs" id="btn-dispatch-proj-vehicle">🚜 + Dispatch Machine</button>
              </div>

              ${vehicleStats.projectVehicleLogs.length === 0 ? `
                <div class="empty-table-msg">No heavy machines dispatched to this project yet. Tap <strong>"+ Dispatch Machine"</strong> to log JCB hours, Tipper trips, or Tractor days.</div>
              ` : `
                <div class="vehicle-trips-list">
                  ${vehicleStats.projectVehicleLogs.map(r => `
                    <div class="vehicle-trip-row">
                      <div>
                        <strong>${r.vehicleName}</strong> <span class="text-muted text-xs">(${r.vehicleType})</span>
                        <div class="text-muted text-xs">${formatDate(r.date)} • <strong>${r.durationUnits} ${r.rateType}(s)</strong> @ ${currency}${r.rate}</div>
                        ${r.notes ? `<div class="text-muted text-xs font-italic">${r.notes}</div>` : ''}
                      </div>
                      <div style="text-align:right">
                        <strong class="spend-color">${formatCurrency(r.totalAmount, currency)}</strong>
                        <button class="btn-delete-item btn-del-veh-rental" data-veh-id="${r.vehicleId}" data-rent-id="${r.id}" title="Remove Trip">🗑️</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

          <!-- ACCORDION 4: MATERIALS SOLD / USED -->
          <div class="proj-accordion-card ${defaultExpanded === 'materials' ? 'expanded' : ''}" id="acc-card-materials">
            <button type="button" class="proj-accordion-header" data-target="acc-card-materials">
              <div class="proj-accordion-title-wrap">
                <span class="proj-accordion-icon">🧱</span>
                <span class="proj-accordion-title">Materials Sold / Used</span>
                <span class="proj-accordion-badge">${project.materials ? project.materials.length : 0} Items</span>
              </div>
              <svg class="proj-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="proj-accordion-content">
              <div class="section-header-flex" style="margin-bottom:10px">
                <span class="text-xs text-muted">Bricks, steel, cement, sand, aggregates</span>
                <button class="btn btn-primary btn-xs" id="btn-add-project-material">+ Add Material</button>
              </div>
              ${(!project.materials || project.materials.length === 0) ? `
                <div class="empty-table-msg">No materials logged on this site yet.</div>
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
                        <button class="btn-delete-item btn-del-material" data-mat-id="${m.id}">🗑️</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

          <!-- ACCORDION 5: MONEY COLLECTED (INCOME) -->
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
                <span class="text-xs text-muted">Customer receipts and advance payments</span>
                <button class="btn btn-secondary btn-xs" id="btn-record-proj-payment">+ Collect Money</button>
              </div>
              ${(!project.payments || project.payments.length === 0) ? `
                <div class="empty-table-msg">No payments collected yet.</div>
              ` : `
                <div class="payment-list-items">
                  ${project.payments.map(p => `
                    <div class="payment-row-item">
                      <div class="pay-row-left">
                        <div class="pay-date-badge">${formatDate(p.date)}</div>
                        <div><strong class="income-color">+${formatCurrency(p.amount, currency)}</strong> <span class="pay-mode-pill">${p.mode}</span></div>
                      </div>
                      <button class="btn-delete-item btn-del-payment" data-pay-id="${p.id}">🗑️</button>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

          <!-- ACCORDION 6: STATUS & DELETE -->
          <div class="proj-accordion-card ${defaultExpanded === 'settings' ? 'expanded' : ''}" id="acc-card-settings">
            <button type="button" class="proj-accordion-header" data-target="acc-card-settings">
              <div class="proj-accordion-title-wrap">
                <span class="proj-accordion-icon">⚙️</span>
                <span class="proj-accordion-title">Project Status & Delete</span>
              </div>
              <svg class="proj-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="proj-accordion-content">
              <div class="status-buttons-row">
                <button class="btn btn-sm ${project.status === 'in_progress' ? 'btn-primary' : 'btn-outline'} btn-set-status" data-status="in_progress">In Progress</button>
                <button class="btn btn-sm ${project.status === 'completed' ? 'btn-primary' : 'btn-outline'} btn-set-status" data-status="completed">Completed</button>
                <button class="btn btn-sm ${project.status === 'on_hold' ? 'btn-primary' : 'btn-outline'} btn-set-status" data-status="on_hold">On Hold</button>
              </div>
              <div class="sheet-danger-footer" style="margin-top:12px">
                <button class="btn btn-danger btn-sm" id="btn-delete-project">Delete Project</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    // Accordion Toggle
    modalContainer.querySelectorAll('.proj-accordion-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const target = modalContainer.querySelector(`#${hdr.dataset.target}`);
        const isExp = target.classList.contains('expanded');
        modalContainer.querySelectorAll('.proj-accordion-card').forEach(c => c.classList.remove('expanded'));
        if (!isExp) target.classList.add('expanded');
      });
    });

    // Site Photos Actions
    modalContainer.querySelector('#btn-take-site-photo')?.addEventListener('click', () => openCapturePhotoModal(projectId));

    modalContainer.querySelectorAll('.btn-open-lightbox').forEach(el => {
      el.addEventListener('click', () => {
        openPhotoLightboxModal(el.dataset.url, el.dataset.caption, el.dataset.phase, el.dataset.date, el.dataset.photoId, projectId);
      });
    });

    modalContainer.querySelectorAll('.btn-delete-photo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this site photo?')) {
          store.deleteProjectPhoto(projectId, btn.dataset.photoId);
          showToast('Photo removed');
          openProjectDetailsModal(projectId, 'photos');
        }
      });
    });

    // Labour / Head Mason actions
    modalContainer.querySelector('#btn-add-proj-effort')?.addEventListener('click', () => openProjectEffortModal(projectId));
    modalContainer.querySelector('#btn-add-proj-lab-payout')?.addEventListener('click', () => openProjectLabourPayoutModal(projectId));

    modalContainer.querySelectorAll('.btn-quick-add-days').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const labId = btn.dataset.labId;
        const days = Number(btn.dataset.days) || 1;
        store.quickIncrementWorkerDays(projectId, labId, days);
        showToast(`Added +${days} day(s) effort!`);
        openProjectDetailsModal(projectId, 'labours');
      });
    });

    modalContainer.querySelectorAll('.btn-custom-add-days').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openProjectEffortModal(projectId, btn.dataset.labId);
      });
    });

    // Vehicle Machinery actions
    modalContainer.querySelector('#btn-dispatch-proj-vehicle')?.addEventListener('click', () => openLogVehicleRentalModal(null, projectId));
    modalContainer.querySelectorAll('.btn-del-veh-rental').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this vehicle dispatch log?')) {
          store.deleteVehicleRental(btn.dataset.vehId, btn.dataset.rentId);
          showToast('Machine dispatch log removed');
          openProjectDetailsModal(projectId, 'vehicles');
        }
      });
    });

    // Material & Payment actions
    modalContainer.querySelector('#btn-add-project-material')?.addEventListener('click', () => openAddProjectMaterialModal(projectId));
    modalContainer.querySelector('#btn-record-proj-payment')?.addEventListener('click', () => openRecordPaymentModal(projectId));

    modalContainer.querySelectorAll('.btn-del-material').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Remove material item?')) {
          store.deleteProjectMaterial(projectId, btn.dataset.matId);
          openProjectDetailsModal(projectId, 'materials');
        }
      });
    });

    modalContainer.querySelectorAll('.btn-del-payment').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete payment record?')) {
          store.deleteProjectPayment(projectId, btn.dataset.payId);
          openProjectDetailsModal(projectId, 'payments');
        }
      });
    });

    modalContainer.querySelectorAll('.btn-set-status').forEach(btn => {
      btn.addEventListener('click', () => {
        store.updateProject(projectId, { status: btn.dataset.status });
        openProjectDetailsModal(projectId, 'settings');
      });
    });

    modalContainer.querySelector('#btn-delete-project')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this entire project?')) {
        store.deleteProject(projectId);
        closeModal('project-details-modal');
        showToast('Project deleted');
        renderCurrentTab();
      }
    });

    openModal('project-details-modal');
  }

  // --- 5.4 CAPTURE / UPLOAD SITE PHOTO MODAL ---
  function openCapturePhotoModal(projectId) {
    const project = store.getProjectById(projectId);
    if (!project) return;

    const container = document.getElementById('project-photo-modal-content');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">📸 Take / Upload Site Photo</h3>
          <p class="text-muted text-xs">Project: ${project.name}</p>
        </div>
        <button class="modal-close-btn" data-close-modal="project-photo-modal" aria-label="Close">×</button>
      </div>

      <form id="form-upload-site-photo" class="modal-form">
        <div class="form-group">
          <label class="form-label">Construction Phase / Stage *</label>
          <select id="photo-phase" class="form-select" required>
            ${CONSTRUCTION_PHASES.map(ph => `<option value="${ph}">${ph}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Select or Take Photo *</label>
          <div style="display:flex; gap:8px; margin-bottom:8px">
            <label class="btn btn-primary btn-block file-input-label" style="cursor:pointer">
              📷 Open Camera / Gallery
              <input type="file" id="photo-file-input" accept="image/*" capture="environment" style="display:none" required />
            </label>
          </div>
          <div id="photo-preview-wrap" style="display:none; text-align:center; margin-top:8px">
            <img id="photo-preview-img" src="" alt="Preview" style="max-height:180px; max-width:100%; border-radius:var(--radius-md); border:1px solid var(--border-subtle);" />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Date Taken</label>
            <input type="date" id="photo-date" class="form-input" value="${getTodayDateString()}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Caption / Description</label>
            <input type="text" id="photo-caption" class="form-input" placeholder="e.g. Ground slab curing day 3" />
          </div>
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="project-photo-modal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-save-photo" disabled>Save Photo</button>
        </div>
      </form>
    `;

    let compressedDataUrl = '';
    const fileInput = container.querySelector('#photo-file-input');
    const previewWrap = container.querySelector('#photo-preview-wrap');
    const previewImg = container.querySelector('#photo-preview-img');
    const saveBtn = container.querySelector('#btn-save-photo');

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      showToast('Compressing photo for fast cloud storage...', 'info', 1500);
      try {
        compressedDataUrl = await compressImageFile(file, 1000, 0.72);
        previewImg.src = compressedDataUrl;
        previewWrap.style.display = 'block';
        saveBtn.disabled = false;
      } catch (err) {
        showToast('Error processing image', 'error');
      }
    });

    const form = container.querySelector('#form-upload-site-photo');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!compressedDataUrl) {
        showToast('Please take or choose a photo', 'error');
        return;
      }

      store.addProjectPhoto(projectId, {
        phase: container.querySelector('#photo-phase').value,
        caption: container.querySelector('#photo-caption').value.trim(),
        date: container.querySelector('#photo-date').value,
        dataUrl: compressedDataUrl
      });

      closeModal('project-photo-modal');
      showToast('Site photo saved to project! 📸');
      openProjectDetailsModal(projectId, 'photos');
    });

    openModal('project-photo-modal');
  }

  // --- 5.5 FULL-SCREEN PHOTO LIGHTBOX ---
  function openPhotoLightboxModal(dataUrl, caption, phase, date, photoId, projectId) {
    const container = document.getElementById('photo-lightbox-modal-content');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-header" style="background:#090d16; border-color:rgba(255,255,255,0.1)">
        <div>
          <h3 class="modal-title" style="color:#ffffff">${phase}</h3>
          <p class="text-muted text-xs" style="color:#94a3b8">${date}</p>
        </div>
        <button class="modal-close-btn" data-close-modal="photo-lightbox-modal" style="color:#ffffff; background:rgba(255,255,255,0.1)">×</button>
      </div>

      <div class="modal-body" style="padding:10px; text-align:center">
        <img src="${dataUrl}" alt="${phase}" class="lightbox-img-full" />
        ${caption ? `<p style="color:#ffffff; margin-top:8px; font-weight:600; font-size:0.85rem">${caption}</p>` : ''}
      </div>

      <div class="modal-footer-btns" style="padding:10px 16px 16px; background:#090d16">
        <a href="${dataUrl}" download="SitePhoto_${date}.jpg" class="btn btn-outline btn-sm" style="color:#ffffff; border-color:rgba(255,255,255,0.2)">📥 Download</a>
        <button type="button" class="btn btn-danger btn-sm" id="btn-lightbox-delete">🗑️ Delete</button>
      </div>
    `;

    container.querySelector('#btn-lightbox-delete')?.addEventListener('click', () => {
      if (confirm('Delete this photo?')) {
        store.deleteProjectPhoto(projectId, photoId);
        closeModal('photo-lightbox-modal');
        showToast('Photo deleted');
        openProjectDetailsModal(projectId, 'photos');
      }
    });

    openModal('photo-lightbox-modal');
  }

  // --- 5.6 VEHICLES & HEAVY MACHINERY VIEW (GLOBAL) ---
  function renderVehicles(container) {
    const settings = store.getSettings();
    const currency = settings.currency || '₹';
    const vehicles = store.getVehicles();

    let totalEarned = 0;
    let totalDues = 0;
    let totalDispatches = 0;

    vehicles.forEach(v => {
      const f = store.getVehicleFinancials(v);
      totalEarned += f.totalCollected;
      totalDues += f.balanceDue;
      totalDispatches += f.totalRentals;
    });

    const filtered = vehicles.filter(v => {
      if (vehicleSearchQuery) {
        const q = vehicleSearchQuery.toLowerCase();
        return v.name.toLowerCase().includes(q) || (v.regNumber && v.regNumber.toLowerCase().includes(q)) || (v.driverName && v.driverName.toLowerCase().includes(q));
      }
      return true;
    });

    container.innerHTML = `
      <div class="page-top-bar">
        <div>
          <h1 class="page-main-title">Vehicles & Machinery</h1>
          <p class="page-sub-title">Track JCB, Tipper, Tractor dispatches & hiring income</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-new-vehicle">+ Add Machine</button>
      </div>

      <div class="vehicles-overview-grid">
        <div class="vehicle-kpi-card"><span class="kpi-lbl">Hiring Income</span><strong class="kpi-val income-color">${formatCurrency(totalEarned, currency)}</strong></div>
        <div class="vehicle-kpi-card"><span class="kpi-lbl">Pending Dues</span><strong class="kpi-val ${totalDues > 0 ? 'text-amber' : 'income-color'}">${formatCurrency(totalDues, currency)}</strong></div>
        <div class="vehicle-kpi-card"><span class="kpi-lbl">Fleet Size</span><strong class="kpi-val">${vehicles.length} Machines</strong></div>
      </div>

      <div class="labour-quick-action-strip">
        <button class="btn btn-primary btn-sm btn-block" id="btn-quick-dispatch-machine">
          🚜 Dispatch Machine (Hours / Days / Trips)
        </button>
      </div>

      <div class="search-filter-row">
        <div class="search-box">
          <input type="text" id="veh-search-input" placeholder="Search JCB, Tipper, Reg No, Driver..." value="${vehicleSearchQuery}" />
        </div>
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon">🚜</div>
          <div class="empty-title">No Vehicles Registered Yet</div>
          <p class="empty-desc">Add your JCBs, Tippers, Tractors to track hourly and daily hiring income.</p>
          <button class="btn btn-primary btn-sm" id="empty-add-vehicle-btn">+ Add First Vehicle</button>
        </div>
      ` : `
        <div class="vehicles-card-grid">
          ${filtered.map(veh => {
            const f = store.getVehicleFinancials(veh);
            return `
              <div class="vehicle-card" data-id="${veh.id}">
                <div class="vehicle-card-top">
                  <div>
                    <div class="vehicle-name-heading">🚜 ${veh.name}</div>
                    ${veh.regNumber ? `<span class="vehicle-reg-pill">${veh.regNumber}</span>` : ''}
                    <div class="text-muted text-xs" style="margin-top:2px">${veh.type}</div>
                  </div>
                  <div class="vehicle-rate-badge">
                    ${formatCurrency(veh.defaultRate, currency)} / ${veh.defaultRateType}
                  </div>
                </div>

                ${veh.driverName ? `
                  <div class="vehicle-driver-row">
                    <span>👤 Driver: <strong>${veh.driverName}</strong></span>
                    ${veh.driverPhone ? `<a href="${getTelLink(veh.driverPhone)}" class="text-link-btn">📞 ${veh.driverPhone}</a>` : ''}
                  </div>
                ` : ''}

                <div class="vehicle-stats-strip">
                  <div class="vehicle-stat-box"><span class="lbl">Dispatches</span><strong>${f.totalRentals} Trips</strong></div>
                  <div class="vehicle-stat-box"><span class="lbl">Total Earned</span><strong class="income-color">${formatCurrency(f.totalCollected, currency)}</strong></div>
                  <div class="vehicle-stat-box"><span class="lbl">Due Balance</span><strong class="${f.balanceDue > 0 ? 'text-amber' : 'income-color'}">${formatCurrency(f.balanceDue, currency)}</strong></div>
                </div>

                <div class="labour-card-actions">
                  <button class="btn btn-primary btn-xs btn-dispatch-this-veh" data-id="${veh.id}">+ Dispatch</button>
                  <button class="btn btn-outline btn-xs btn-view-veh-history" data-id="${veh.id}">History (${f.totalRentals})</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    container.querySelector('#btn-add-new-vehicle')?.addEventListener('click', () => openAddVehicleModal());
    container.querySelector('#empty-add-vehicle-btn')?.addEventListener('click', () => openAddVehicleModal());
    container.querySelector('#btn-quick-dispatch-machine')?.addEventListener('click', () => openLogVehicleRentalModal());

    const searchInp = container.querySelector('#veh-search-input');
    searchInp?.addEventListener('input', (e) => {
      vehicleSearchQuery = e.target.value;
      renderVehicles(container);
    });

    container.querySelectorAll('.btn-dispatch-this-veh').forEach(btn => {
      btn.addEventListener('click', () => openLogVehicleRentalModal(btn.dataset.id));
    });

    container.querySelectorAll('.btn-view-veh-history').forEach(btn => {
      btn.addEventListener('click', () => openVehicleHistoryModal(btn.dataset.id));
    });
  }

  // --- 5.7 ADD VEHICLE MODAL ---
  function openAddVehicleModal() {
    const container = document.getElementById('vehicle-modal-content');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">🚜 Add Vehicle / Heavy Machine</h3>
          <p class="text-muted text-xs">Register JCB, Tipper, Tractor, Concrete Mixer</p>
        </div>
        <button class="modal-close-btn" data-close-modal="vehicle-modal" aria-label="Close">×</button>
      </div>

      <form id="form-add-vehicle" class="modal-form">
        <div class="form-group">
          <label class="form-label">Vehicle / Machine Name *</label>
          <input type="text" id="veh-name" class="form-input" placeholder="e.g. JCB 3DX Super, Tata Tipper 1618, Mahindra Tractor" required autofocus />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Machinery Type *</label>
            <select id="veh-type" class="form-select">
              ${VEHICLE_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Registration / Number</label>
            <input type="text" id="veh-reg" class="form-input font-mono" placeholder="e.g. KA-01-AB-1234" />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Default Hiring Rate *</label>
            <input type="number" step="any" id="veh-rate" class="form-input font-bold" placeholder="e.g. 1200" required />
          </div>
          <div class="form-group">
            <label class="form-label">Rate Unit *</label>
            <select id="veh-rate-type" class="form-select">
              <option value="hour">Per Hour (₹/hr)</option>
              <option value="day">Per Day (₹/day)</option>
              <option value="trip">Per Trip / Load (₹/trip)</option>
              <option value="week">Per Week</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Driver Name</label>
            <input type="text" id="veh-driver" class="form-input" placeholder="e.g. Ramesh Driver" />
          </div>
          <div class="form-group">
            <label class="form-label">Driver Phone</label>
            <input type="tel" id="veh-driver-phone" class="form-input" placeholder="e.g. 9876543210" />
          </div>
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="vehicle-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Machine</button>
        </div>
      </form>
    `;

    const form = container.querySelector('#form-add-vehicle');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = container.querySelector('#veh-name').value.trim();
      const rate = Number(container.querySelector('#veh-rate').value);

      if (!name || rate <= 0) {
        showToast('Please enter vehicle name and hiring rate', 'error');
        return;
      }

      store.addVehicle({
        name: name,
        type: container.querySelector('#veh-type').value,
        regNumber: container.querySelector('#veh-reg').value.trim(),
        defaultRate: rate,
        defaultRateType: container.querySelector('#veh-rate-type').value,
        driverName: container.querySelector('#veh-driver').value.trim(),
        driverPhone: container.querySelector('#veh-driver-phone').value.trim()
      });

      closeModal('vehicle-modal');
      showToast(`Vehicle ${name} added!`);
      renderCurrentTab();
    });

    openModal('vehicle-modal');
  }

  // --- 5.8 LOG VEHICLE DISPATCH / RENTAL MODAL ---
  function openLogVehicleRentalModal(prefillVehicleId = null, prefillProjectId = null) {
    const container = document.getElementById('vehicle-modal-content');
    if (!container) return;

    const vehicles = store.getVehicles();
    const projects = store.getProjects();
    const currency = store.getSettings().currency || '₹';

    if (vehicles.length === 0) {
      showToast('Please register your JCB / Tipper / Tractor first', 'info');
      openAddVehicleModal();
      return;
    }

    const selectedVeh = prefillVehicleId ? store.getVehicleById(prefillVehicleId) : vehicles[0];

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">🚜 Dispatch Vehicle / Machine</h3>
          <p class="text-muted text-xs">Record hours/days sent to a project or outside client</p>
        </div>
        <button class="modal-close-btn" data-close-modal="vehicle-modal" aria-label="Close">×</button>
      </div>

      <form id="form-log-rental" class="modal-form">
        <div class="form-group">
          <label class="form-label">Select Machine *</label>
          <select id="vrnt-veh-id" class="form-select" required>
            ${vehicles.map(v => `
              <option value="${v.id}" ${v.id === (selectedVeh ? selectedVeh.id : '') ? 'selected' : ''}>
                ${v.name} (${v.type} - ${currency}${v.defaultRate}/${v.defaultRateType})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Duration / Units *</label>
            <input type="number" step="any" id="vrnt-duration" class="form-input form-input-lg font-bold" placeholder="e.g. 6.5 or 3" value="1" required autofocus />
          </div>
          <div class="form-group">
            <label class="form-label">Unit Type *</label>
            <select id="vrnt-rate-type" class="form-select">
              <option value="hour" ${(selectedVeh?.defaultRateType === 'hour') ? 'selected' : ''}>Hours</option>
              <option value="day" ${(selectedVeh?.defaultRateType === 'day') ? 'selected' : ''}>Days</option>
              <option value="trip" ${(selectedVeh?.defaultRateType === 'trip') ? 'selected' : ''}>Trips / Loads</option>
              <option value="week">Weeks</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Hiring Rate (${currency}) *</label>
            <input type="number" step="any" id="vrnt-rate" class="form-input font-bold" value="${selectedVeh ? selectedVeh.defaultRate : 1200}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Total Amount (${currency})</label>
            <input type="text" id="vrnt-total-preview" class="form-input font-bold income-color" readonly />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Assign to Project (Optional)</label>
          <select id="vrnt-project-id" class="form-select">
            <option value="">-- Outside Hiring / Private Client --</option>
            ${projects.map(p => `
              <option value="${p.id}" ${p.id === prefillProjectId ? 'selected' : ''}>
                📍 Project: ${p.name} (${p.customerName || 'Site'})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Hirer / Client Name</label>
            <input type="text" id="vrnt-client-name" class="form-input" placeholder="e.g. Nagaraj Contractor" />
          </div>
          <div class="form-group">
            <label class="form-label">Hirer Phone (WhatsApp)</label>
            <input type="tel" id="vrnt-client-phone" class="form-input" placeholder="e.g. 9876543210" />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Amount Collected Now (${currency})</label>
            <input type="number" step="any" id="vrnt-amount-paid" class="form-input font-bold" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label class="form-label">Payment Mode</label>
            <select id="vrnt-pay-mode" class="form-select">
              <option value="Cash">Cash</option>
              <option value="UPI / GPay">UPI / GPay / PhonePe</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" id="vrnt-date" class="form-input" value="${getTodayDateString()}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Work Description / Site Notes</label>
            <input type="text" id="vrnt-notes" class="form-input" placeholder="e.g. Basement digging, 4 loads sand shifted" />
          </div>
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="vehicle-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Dispatch & Add Income</button>
        </div>
      </form>
    `;

    const vehSel = container.querySelector('#vrnt-veh-id');
    const durInp = container.querySelector('#vrnt-duration');
    const rateInp = container.querySelector('#vrnt-rate');
    const totalPrev = container.querySelector('#vrnt-total-preview');
    const paidInp = container.querySelector('#vrnt-amount-paid');

    function calcTotal() {
      const d = Number(durInp.value) || 0;
      const r = Number(rateInp.value) || 0;
      const tot = Math.round(d * r);
      totalPrev.value = formatCurrency(tot, currency);
      if (!paidInp.dataset.manual) paidInp.value = tot;
    }

    durInp.addEventListener('input', calcTotal);
    rateInp.addEventListener('input', calcTotal);
    paidInp.addEventListener('input', () => { paidInp.dataset.manual = 'true'; });
    calcTotal();

    vehSel.addEventListener('change', () => {
      const v = store.getVehicleById(vehSel.value);
      if (v) {
        rateInp.value = v.defaultRate;
        container.querySelector('#vrnt-rate-type').value = v.defaultRateType;
        calcTotal();
      }
    });

    const form = container.querySelector('#form-log-rental');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const vehId = vehSel.value;
      const dur = Number(durInp.value);
      const rate = Number(rateInp.value);
      const totalAmount = Math.round(dur * rate);
      const amountPaid = Number(paidInp.value) || 0;

      if (!vehId || dur <= 0 || rate <= 0) {
        showToast('Please enter valid duration and rate', 'error');
        return;
      }

      store.logVehicleRental(vehId, {
        durationUnits: dur,
        rateType: container.querySelector('#vrnt-rate-type').value,
        rate: rate,
        totalAmount: totalAmount,
        amountPaid: amountPaid,
        projectId: container.querySelector('#vrnt-project-id').value,
        clientName: container.querySelector('#vrnt-client-name').value.trim(),
        clientPhone: container.querySelector('#vrnt-client-phone').value.trim(),
        paymentMode: container.querySelector('#vrnt-pay-mode').value,
        date: container.querySelector('#vrnt-date').value,
        notes: container.querySelector('#vrnt-notes').value.trim()
      });

      closeModal('vehicle-modal');
      showToast(`Machine dispatch recorded! +${formatCurrency(amountPaid, currency)} added to Income.`);

      if (prefillProjectId) {
        openProjectDetailsModal(prefillProjectId, 'vehicles');
      } else {
        renderCurrentTab();
      }
    });

    openModal('vehicle-modal');
  }

  // --- 5.9 VEHICLE HISTORY MODAL ---
  function openVehicleHistoryModal(vehicleId) {
    const vehicle = store.getVehicleById(vehicleId);
    if (!vehicle) return;

    const currency = store.getSettings().currency || '₹';
    const container = document.getElementById('vehicle-modal-content');
    if (!container) return;

    const f = store.getVehicleFinancials(vehicle);

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${vehicle.name} - Dispatches</h3>
          <p class="text-muted text-xs">${vehicle.type} • Reg: ${vehicle.regNumber || 'No Reg'}</p>
        </div>
        <button class="modal-close-btn" data-close-modal="vehicle-modal" aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <div class="proj-sheet-finance-grid">
          <div class="fin-box-sm"><span class="lbl">Total Earned</span><strong class="income-color">${formatCurrency(f.totalCollected, currency)}</strong></div>
          <div class="fin-box-sm"><span class="lbl">Pending Dues</span><strong class="${f.balanceDue > 0 ? 'text-amber' : 'income-color'}">${formatCurrency(f.balanceDue, currency)}</strong></div>
          <div class="fin-box-sm"><span class="lbl">Dispatches</span><strong>${f.totalRentals} Trips</strong></div>
        </div>

        <div style="margin-top:12px">
          ${(!vehicle.rentals || vehicle.rentals.length === 0) ? `
            <div class="empty-table-msg">No dispatches logged yet for this vehicle.</div>
          ` : `
            <div class="vehicle-trips-list">
              ${vehicle.rentals.map(r => `
                <div class="vehicle-trip-row">
                  <div>
                    <strong>${formatDate(r.date)}</strong> • ${r.clientName || 'Site Dispatch'}
                    <div class="text-muted text-xs">${r.durationUnits} ${r.rateType}(s) @ ${currency}${r.rate} (${r.paymentMode})</div>
                    ${r.notes ? `<div class="text-muted text-xs font-italic">${r.notes}</div>` : ''}
                  </div>
                  <div style="text-align:right">
                    <strong class="income-color">+${formatCurrency(r.amountPaid, currency)}</strong>
                    <button class="btn-delete-item btn-del-veh-trip" data-rent-id="${r.id}">🗑️</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="sheet-danger-footer" style="margin-top:16px">
          <button class="btn btn-danger btn-xs" id="btn-del-entire-vehicle">Delete Vehicle Record</button>
        </div>
      </div>
    `;

    container.querySelectorAll('.btn-del-veh-trip').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this dispatch log?')) {
          store.deleteVehicleRental(vehicle.id, btn.dataset.rentId);
          showToast('Dispatch removed');
          openVehicleHistoryModal(vehicle.id);
        }
      });
    });

    container.querySelector('#btn-del-entire-vehicle')?.addEventListener('click', () => {
      if (confirm(`Delete ${vehicle.name} from your fleet?`)) {
        store.deleteVehicle(vehicle.id);
        closeModal('vehicle-modal');
        showToast('Vehicle deleted');
        renderCurrentTab();
      }
    });

    openModal('vehicle-modal');
  }

  // --- 5.10 HEAD MASON / GANG & INDIVIDUAL LABOUR EFFORT MODAL ---
  function openProjectEffortModal(projectId, prefillLabourId = '') {
    const project = projectId ? store.getProjectById(projectId) : null;
    const container = document.getElementById('log-labour-modal-content');
    if (!container) return;

    const labours = store.getLabours();
    const currency = store.getSettings().currency || '₹';
    const prefillWorker = prefillLabourId ? store.getLabourById(prefillLabourId) : (labours.length > 0 ? labours[0] : null);

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">👷 Log Worker / Gang Effort</h3>
          <p class="text-muted text-xs">${project ? `Project: ${project.name}` : 'General / Outside Site'}</p>
        </div>
        <button class="modal-close-btn" data-close-modal="log-labour-modal" aria-label="Close">×</button>
      </div>

      <form id="form-log-effort" class="modal-form">
        <div class="form-group">
          <label class="form-label">Select Worker / Head Mason *</label>
          <select id="peffort-labour-id" class="form-select" required>
            <option value="">-- Choose Worker / Head Mason --</option>
            ${labours.map(l => `
              <option value="${l.id}" ${(l.id === prefillLabourId || (!prefillLabourId && l === prefillWorker)) ? 'selected' : ''}>
                ${l.isHeadMason ? '👑 ' : ''}${l.name} (${l.role} - ${currency}${l.wageRate}/day)
              </option>
            `).join('')}
            <option value="__new__">+ Register New Worker / Head Mason</option>
          </select>
        </div>

        <div id="new-worker-quick-fields" style="display:none; background:var(--bg-subtle); padding:10px; border-radius:var(--radius-md); margin-bottom:12px">
          <div class="form-group">
            <label class="form-label">Name *</label>
            <input type="text" id="peffort-new-name" class="form-input" placeholder="e.g. Manoj Mistri (Mason Gang)" />
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Role</label>
              <select id="peffort-new-role" class="form-select">
                ${LABOUR_ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Daily Wage Rate (${currency})</label>
              <input type="number" step="any" id="peffort-new-rate" class="form-input font-bold" placeholder="e.g. 850" />
            </div>
          </div>
          <label class="gdrive-toggle-label" style="margin-top:6px">
            <span>👑 This is a Head Mason (brings multiple workers)</span>
            <input type="checkbox" id="peffort-new-is-head" />
          </label>
        </div>

        <!-- Gang Worker Count: Men & Women Breakdown -->
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">👨 Men Workers</label>
            <input type="number" id="peffort-men-count" class="form-input font-bold" value="${prefillWorker?.isHeadMason ? 4 : 1}" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">👩 Women Workers</label>
            <input type="number" id="peffort-women-count" class="form-input font-bold" value="${prefillWorker?.isHeadMason ? 4 : 0}" min="0" />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Days / Shifts Worked *</label>
            <input type="number" step="any" id="peffort-days" class="form-input font-bold" value="1" min="0.5" required />
          </div>
          <div class="form-group">
            <label class="form-label">Total Gang Workers</label>
            <div id="peffort-gang-summary-badge" class="font-bold" style="padding:10px; background:var(--bg-subtle); border-radius:var(--radius-sm); font-size:0.85rem">
              ${(prefillWorker?.isHeadMason ? 8 : 1)} Total Workers
            </div>
          </div>
        </div>

        <!-- Direct Total Money Input (Editable by User) -->
        <div class="form-group">
          <label class="form-label" style="display:flex; justify-content:space-between; align-items:center">
            <span>💰 Total Wages / Amount Payable (${currency}) *</span>
            <span class="text-xs text-muted">(Enter agreed amount)</span>
          </label>
          <input 
            type="number" 
            step="any" 
            id="peffort-total-cost" 
            class="form-input form-input-lg font-bold spend-color" 
            placeholder="e.g. 7500" 
            required 
          />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" id="peffort-date" class="form-input" value="${getTodayDateString()}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Task / Work Details</label>
            <input type="text" id="peffort-notes" class="form-input" placeholder="e.g. Ground floor brick work & centering" />
          </div>
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="log-labour-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Effort</button>
        </div>
      </form>
    `;

    const labSelect = container.querySelector('#peffort-labour-id');
    const newFields = container.querySelector('#new-worker-quick-fields');
    const menInp = container.querySelector('#peffort-men-count');
    const womenInp = container.querySelector('#peffort-women-count');
    const daysInp = container.querySelector('#peffort-days');
    const totalCostInp = container.querySelector('#peffort-total-cost');
    const summaryBadge = container.querySelector('#peffort-gang-summary-badge');

    function updateGangSummary(autoSuggestCost = false) {
      const m = Number(menInp.value) || 0;
      const w = Number(womenInp.value) || 0;
      const totWorkers = Math.max(1, m + w);
      const d = Number(daysInp.value) || 1;

      summaryBadge.innerHTML = `👥 <strong>${totWorkers} Worker(s)</strong> <span class="text-muted text-xs">(${m} Men + ${w} Women)</span>`;

      if (autoSuggestCost && !totalCostInp.dataset.manualEdited) {
        const l = store.getLabourById(labSelect.value);
        const rate = l ? (l.wageRate || 850) : 850;
        totalCostInp.value = Math.round(totWorkers * d * rate);
      }
    }

    menInp.addEventListener('input', () => updateGangSummary(true));
    womenInp.addEventListener('input', () => updateGangSummary(true));
    daysInp.addEventListener('input', () => updateGangSummary(true));
    totalCostInp.addEventListener('input', () => { totalCostInp.dataset.manualEdited = 'true'; });

    // Initial cost fill
    updateGangSummary(true);

    labSelect.addEventListener('change', () => {
      if (labSelect.value === '__new__') {
        newFields.style.display = 'block';
      } else {
        newFields.style.display = 'none';
        const l = store.getLabourById(labSelect.value);
        if (l) {
          if (l.isHeadMason) {
            menInp.value = 4;
            womenInp.value = 4;
          } else {
            menInp.value = 1;
            womenInp.value = 0;
          }
          totalCostInp.dataset.manualEdited = '';
          updateGangSummary(true);
        }
      }
    });

    const form = container.querySelector('#form-log-effort');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let targetLabId = labSelect.value;
      const m = Number(menInp.value) || 0;
      const w = Number(womenInp.value) || 0;
      const totWorkers = Math.max(1, m + w);
      const d = Number(daysInp.value) || 1;
      const totalCost = Number(totalCostInp.value);

      if (targetLabId === '__new__') {
        const newName = container.querySelector('#peffort-new-name').value.trim();
        const newRate = Number(container.querySelector('#peffort-new-rate').value) || 850;
        const newRole = container.querySelector('#peffort-new-role').value;
        const isHead = container.querySelector('#peffort-new-is-head').checked;

        if (!newName) {
          showToast('Please enter worker name', 'error');
          return;
        }

        const created = store.addLabour({
          name: newName,
          role: newRole,
          isHeadMason: isHead,
          wageType: 'daily',
          wageRate: newRate
        });
        targetLabId = created.id;
      }

      if (!targetLabId) {
        showToast('Please choose a worker', 'error');
        return;
      }

      store.logLabourAttendance(targetLabId, {
        date: container.querySelector('#peffort-date').value,
        menCount: m,
        womenCount: w,
        workerCount: totWorkers,
        days: d,
        totalCost: totalCost,
        isGroupEntry: totWorkers > 1,
        projectId: projectId || '',
        notes: container.querySelector('#peffort-notes').value.trim()
      });

      closeModal('log-labour-modal');
      showToast(`Saved effort for ${totWorkers} worker(s) (${formatCurrency(totalCost, currency)})!`);

      if (projectId) {
        openProjectDetailsModal(projectId, 'labours');
      } else {
        renderCurrentTab();
      }
    });

    openModal('log-labour-modal');
  }

  // --- 5.11 LABOUR PAYOUT MODAL ---
  function openProjectLabourPayoutModal(projectId) {
    openLabourPayoutModal(null, projectId);
  }

  function openLabourPayoutModal(prefillLabourId = null, prefillProjectId = null) {
    const container = document.getElementById('log-labour-modal-content');
    if (!container) return;

    const labours = store.getLabours();
    const projects = store.getProjects();
    const currency = store.getSettings().currency || '₹';

    if (labours.length === 0) {
      showToast('Please add workers first', 'info');
      openAddLabourModal();
      return;
    }

    const selectedLab = prefillLabourId ? store.getLabourById(prefillLabourId) : labours[0];
    const f = selectedLab ? store.getLabourFinancials(selectedLab) : { balanceDue: 0 };

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">💸 Pay Wage / Gang Advance (Spend)</h3>
          <p class="text-muted text-xs">Salary & wage payouts are added to Total Spends</p>
        </div>
        <button class="modal-close-btn" data-close-modal="log-labour-modal" aria-label="Close">×</button>
      </div>

      <form id="form-pay-labour" class="modal-form">
        <div class="form-group">
          <label class="form-label">Worker / Head Mason *</label>
          <select id="ppay-labour-id" class="form-select" required>
            ${labours.map(l => `
              <option value="${l.id}" ${l.id === (selectedLab ? selectedLab.id : '') ? 'selected' : ''}>
                ${l.isHeadMason ? '👑 ' : ''}${l.name} (${l.role} - Rate: ${currency}${l.wageRate}/day)
              </option>
            `).join('')}
          </select>
        </div>

        <div class="payment-balance-hint">
          <span>Current Outstanding Wage Due:</span>
          <strong id="ppay-due-preview" class="text-amber">${formatCurrency(f.balanceDue, currency)}</strong>
        </div>

        <div class="form-group">
          <label class="form-label">Payout Amount (${currency}) *</label>
          <input type="number" step="any" id="ppay-amount" class="form-input form-input-lg font-bold spend-color" placeholder="0.00" value="${f.balanceDue > 0 ? f.balanceDue : (selectedLab ? selectedLab.wageRate : '')}" required autofocus />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Payout Type</label>
            <select id="ppay-type" class="form-select">
              <option value="Daily Wage">Daily Wage</option>
              <option value="Weekly Salary">Weekly Salary</option>
              <option value="Gang Advance">Gang Advance</option>
              <option value="Monthly Salary">Monthly Salary</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Payment Mode</label>
            <select id="ppay-mode" class="form-select">
              <option value="Cash">Cash</option>
              <option value="UPI / GPay">UPI / GPay / PhonePe</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Linked Project</label>
            <select id="ppay-project-id" class="form-select">
              <option value="">-- Outside Projects / Yard --</option>
              ${projects.map(p => `<option value="${p.id}" ${p.id === prefillProjectId ? 'selected' : ''}>📍 ${p.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" id="ppay-date" class="form-input" value="${getTodayDateString()}" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <input type="text" id="ppay-notes" class="form-input" placeholder="e.g. Paid weekly gang wages in full" />
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="log-labour-modal">Cancel</button>
          <button type="submit" class="btn btn-danger">Record Spend & Deduct Balance</button>
        </div>
      </form>
    `;

    const labSel = container.querySelector('#ppay-labour-id');
    const duePrev = container.querySelector('#ppay-due-preview');
    const amtInp = container.querySelector('#ppay-amount');

    labSel.addEventListener('change', () => {
      const l = store.getLabourById(labSel.value);
      if (l) {
        const fin = store.getLabourFinancials(l);
        duePrev.textContent = formatCurrency(fin.balanceDue, currency);
        if (fin.balanceDue > 0) amtInp.value = fin.balanceDue;
        else amtInp.value = l.wageRate;
      }
    });

    const form = container.querySelector('#form-pay-labour');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const labId = labSel.value;
      const amount = Number(amtInp.value);

      if (!amount || amount <= 0) {
        showToast('Please enter valid payout amount', 'error');
        return;
      }

      store.addLabourPayout(labId, {
        amount: amount,
        type: container.querySelector('#ppay-type').value,
        mode: container.querySelector('#ppay-mode').value,
        date: container.querySelector('#ppay-date').value,
        projectId: container.querySelector('#ppay-project-id').value,
        notes: container.querySelector('#ppay-notes').value.trim()
      });

      closeModal('log-labour-modal');
      showToast(`Paid ${formatCurrency(amount, currency)}! Added to Spends.`);

      if (prefillProjectId) {
        openProjectDetailsModal(prefillProjectId, 'labours');
      } else {
        renderCurrentTab();
      }
    });

    openModal('log-labour-modal');
  }

  // --- 5.12 LABOURS & PAYROLL HUB (GLOBAL) ---
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

    const filtered = labours.filter(l => {
      if (labourWageFilter !== 'all' && l.wageType !== labourWageFilter) return false;
      if (labourSearchQuery) {
        const q = labourSearchQuery.toLowerCase();
        return l.name.toLowerCase().includes(q) || (l.role && l.role.toLowerCase().includes(q));
      }
      return true;
    });

    container.innerHTML = `
      <div class="page-top-bar">
        <div>
          <h1 class="page-main-title">Labours & Payroll</h1>
          <p class="page-sub-title">Manage workers, Head Mason gangs, attendance & wage payouts</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-new-labour">+ Add Worker</button>
      </div>

      <div class="labour-overview-grid">
        <div class="lab-kpi-card"><span class="kpi-lbl">Total Paid</span><strong class="kpi-val spend-color">${formatCurrency(totalWagesPaid, currency)}</strong></div>
        <div class="lab-kpi-card"><span class="kpi-lbl">Pending Dues</span><strong class="kpi-val ${totalBalanceDue > 0 ? 'text-amber' : 'income-color'}">${formatCurrency(totalBalanceDue, currency)}</strong></div>
        <div class="lab-kpi-card"><span class="kpi-lbl">Total Workforce</span><strong class="kpi-val">${labours.length} Names</strong></div>
      </div>

      <div class="labour-quick-action-strip">
        <button class="btn btn-outline btn-sm" id="btn-bulk-attendance">📅 Mark Attendance / Gang</button>
        <button class="btn btn-secondary btn-sm" id="btn-quick-payout">💸 Pay Wage (Spend)</button>
      </div>

      <div class="search-filter-row">
        <div class="search-box">
          <input type="text" id="lab-search-input" placeholder="Search worker or Head Mason..." value="${labourSearchQuery}" />
        </div>
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon">👷</div>
          <div class="empty-title">No Workers Registered Yet</div>
          <button class="btn btn-primary btn-sm" id="empty-add-labour-btn">+ Add First Worker</button>
        </div>
      ` : `
        <div class="labours-card-grid">
          ${filtered.map(lab => {
            const fin = store.getLabourFinancials(lab);
            const projectBadges = Object.entries(fin.projectDaysMap || {}).map(([pId, days]) => {
              if (pId === 'outside' || !pId) return `<span class="proj-badge-pill" style="background-color:rgba(100,116,139,0.15); color:var(--text-secondary)">🛠️ Outside (${days}d)</span>`;
              const p = allProjects.find(pr => pr.id === pId);
              return `<span class="proj-badge-pill">📍 ${p ? p.name : 'Site'} (${days}d)</span>`;
            }).join('');

            const waSlip = `*${settings.companyName || 'BuilderMate'} - Wage Statement*\nWorker: *${lab.name}* ${lab.isHeadMason ? '(Head Mason)' : ''}\nRate: *${currency}${lab.wageRate}/day*\n• Total Man-Days: *${fin.totalManDays}*\n• Total Earned: *${currency} ${fin.totalEarned}*\n• Total Paid: *${currency} ${fin.totalPaid}*\n• *Balance Due: ${currency} ${fin.balanceDue}*`;

            return `
              <div class="labour-card" data-id="${lab.id}">
                <div class="labour-card-header">
                  <div>
                    <h3 class="labour-name">${lab.name}</h3>
                    ${lab.isHeadMason ? `<span class="head-mason-badge">👑 Head Mason</span>` : ''}
                    <span class="labour-role-tag">${lab.role}</span>
                  </div>
                  <div class="labour-wage-badge">
                    <strong>${formatCurrency(lab.wageRate, currency)}</strong>
                    <span>/ day</span>
                  </div>
                </div>

                ${projectBadges ? `<div style="margin:6px 0 8px; display:flex; flex-wrap:wrap">${projectBadges}</div>` : ''}

                ${lab.phone ? `
                  <div class="customer-contact-bar">
                    <span class="contact-phone-badge">📞 ${lab.phone}</span>
                    <div class="contact-actions">
                      <a href="${getWhatsAppLink(lab.phone, waSlip)}" target="_blank" class="btn-contact-action btn-wa">💬 Slip</a>
                      <a href="${getTelLink(lab.phone)}" class="btn-contact-action btn-call">Call</a>
                    </div>
                  </div>
                ` : ''}

                <div class="labour-stats-row">
                  <div class="lab-stat-box"><span class="lbl">Man-Days</span><strong>${fin.totalManDays}d</strong></div>
                  <div class="lab-stat-box"><span class="lbl">Total Paid</span><strong class="spend-color">${formatCurrency(fin.totalPaid, currency)}</strong></div>
                  <div class="lab-stat-box"><span class="lbl">Balance</span><strong class="${fin.balanceDue > 0 ? 'text-amber' : 'income-color'}">${formatCurrency(fin.balanceDue, currency)}</strong></div>
                </div>

                <div class="labour-card-actions">
                  <button class="btn btn-outline btn-xs btn-log-att" data-id="${lab.id}">📅 Attendance</button>
                  <button class="btn btn-secondary btn-xs btn-pay-wage" data-id="${lab.id}">💸 Pay Wage</button>
                  <button class="btn btn-outline btn-xs btn-edit-labour" data-id="${lab.id}">✏️ Edit</button>
                  <button class="btn btn-outline btn-xs btn-lab-details" data-id="${lab.id}">📋 Statement</button>
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

    container.querySelectorAll('.btn-log-att').forEach(btn => {
      btn.addEventListener('click', () => openLogAttendanceModal(btn.dataset.id));
    });

    container.querySelectorAll('.btn-pay-wage').forEach(btn => {
      btn.addEventListener('click', () => openLabourPayoutModal(btn.dataset.id));
    });

    container.querySelectorAll('.btn-edit-labour').forEach(btn => {
      btn.addEventListener('click', () => openEditLabourModal(btn.dataset.id));
    });

    container.querySelectorAll('.btn-lab-details').forEach(btn => {
      btn.addEventListener('click', () => openLabourDetailsModal(btn.dataset.id));
    });
  }

  // --- 5.13 ADD LABOUR MODAL ---
  function openAddLabourModal() {
    const container = document.getElementById('log-labour-modal-content');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">👷 Add Worker / Head Mason</h3>
          <p class="text-muted text-xs">Register labour or Head Mason (Gang Leader)</p>
        </div>
        <button class="modal-close-btn" data-close-modal="log-labour-modal" aria-label="Close">×</button>
      </div>

      <form id="form-add-labour" class="modal-form">
        <div class="form-group">
          <label class="form-label">Worker / Head Mason Name *</label>
          <input type="text" id="lab-name" class="form-input" placeholder="e.g. Ramesh Kumar, Manoj Mistri (Mason Gang)" required autofocus />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Role / Trade *</label>
            <select id="lab-role" class="form-select">
              ${LABOUR_ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
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
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Daily Wage Rate *</label>
            <input type="number" step="any" id="lab-wage-rate" class="form-input font-bold" placeholder="e.g. 850" required />
          </div>
        </div>

        <label class="gdrive-toggle-label" style="margin-top:8px">
          <span>👑 Mark as Head Mason (Brings multiple workers / Gang)</span>
          <input type="checkbox" id="lab-is-head" />
        </label>

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
        isHeadMason: container.querySelector('#lab-is-head').checked
      });

      closeModal('log-labour-modal');
      showToast(`Worker ${name} registered!`);
      renderCurrentTab();
    });

    openModal('log-labour-modal');
  }

  // --- 5.14 LOG ATTENDANCE (GLOBAL) ---
  function openLogAttendanceModal(prefillLabourId = null) {
    openProjectEffortModal(null, prefillLabourId);
  }

  // --- 5.15 LABOUR DETAILS & STATEMENT MODAL ---
  function openLabourDetailsModal(labourId) {
    const labour = store.getLabourById(labourId);
    if (!labour) return;

    const settings = store.getSettings();
    const currency = settings.currency || '₹';
    const fin = store.getLabourFinancials(labour);
    const allProjects = store.getProjects();
    const container = document.getElementById('log-labour-modal-content');
    if (!container) return;

    const waSlip = `*${settings.companyName || 'BuilderMate'} - Wage Statement*\nWorker: *${labour.name}* ${labour.isHeadMason ? '(Head Mason)' : ''}\n• Man-Days: *${fin.totalManDays}*\n• Total Earned: *${currency} ${fin.totalEarned}*\n• Total Paid: *${currency} ${fin.totalPaid}*\n• *Remaining Balance Due: ${currency} ${fin.balanceDue}*`;

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${labour.name}</h3>
          <p class="text-muted text-xs">${labour.isHeadMason ? '👑 Head Mason • ' : ''}${labour.role} • ${currency}${labour.wageRate}/day</p>
        </div>
        <button class="modal-close-btn" data-close-modal="log-labour-modal" aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <div class="proj-sheet-finance-grid">
          <div class="fin-box-sm"><span class="lbl">Total Earned</span><strong>${formatCurrency(fin.totalEarned, currency)}</strong></div>
          <div class="fin-box-sm"><span class="lbl">Total Paid</span><strong class="spend-color">${formatCurrency(fin.totalPaid, currency)}</strong></div>
          <div class="fin-box-sm"><span class="lbl">Balance Due</span><strong class="${fin.balanceDue > 0 ? 'text-amber' : 'income-color'}">${formatCurrency(fin.balanceDue, currency)}</strong></div>
        </div>

        <div class="labour-detail-actions-row" style="margin:10px 0; display:flex; gap:6px; flex-wrap:wrap">
          <button class="btn btn-primary btn-xs" id="detail-mark-att">📅 Attendance</button>
          <button class="btn btn-secondary btn-xs" id="detail-pay-wage">💸 Pay Wage</button>
          <button class="btn btn-outline btn-xs" id="detail-edit-profile">✏️ Edit Worker</button>
          ${labour.phone ? `<a href="${getWhatsAppLink(labour.phone, waSlip)}" target="_blank" class="btn btn-wa btn-xs">💬 Slip</a>` : ''}
        </div>

        <div class="drawer-section">
          <h4 class="drawer-section-title">📅 Work & Gang Efforts (${labour.attendance?.length || 0} entries)</h4>
          <div class="attendance-history-list">
            ${(!labour.attendance || labour.attendance.length === 0) ? `
              <div class="empty-table-msg">No effort logged yet.</div>
            ` : labour.attendance.map(a => {
              const p = a.projectId ? allProjects.find(pr => pr.id === a.projectId) : null;
              const gangBreakdown = (a.menCount || a.womenCount) ? `(${a.menCount || 0} Men + ${a.womenCount || 0} Women)` : '';
              return `
                <div class="att-row-item">
                  <div>
                    <strong>${formatDate(a.date)}</strong>
                    <span class="man-days-pill">${a.workerCount || 1} workers • ${a.days || 1}d</span>
                    <div class="text-muted text-xs">
                      ${p ? `📍 ${p.name}` : '🛠️ Outside Site'} ${gangBreakdown}
                    </div>
                    ${a.notes ? `<div class="text-muted text-xs font-italic">${a.notes}</div>` : ''}
                  </div>
                  <strong class="spend-color">${formatCurrency(a.totalCost || 0, currency)}</strong>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="drawer-section" style="margin-top:12px">
          <h4 class="drawer-section-title">💸 Payouts (${labour.payouts?.length || 0})</h4>
          <div class="payout-history-list">
            ${(!labour.payouts || labour.payouts.length === 0) ? `
              <div class="empty-table-msg">No wage payouts recorded.</div>
            ` : labour.payouts.map(p => `
              <div class="payment-row-item">
                <div class="pay-row-left">
                  <div class="pay-date-badge">${formatDate(p.date)}</div>
                  <div><strong class="spend-color">-${formatCurrency(p.amount, currency)}</strong> <span class="pay-mode-pill">${p.type}</span></div>
                </div>
                <button class="btn-delete-item btn-del-payout" data-payout-id="${p.id}">🗑️</button>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="sheet-danger-footer" style="margin-top:16px">
          <button class="btn btn-danger btn-xs" id="btn-delete-labour">Delete Worker</button>
        </div>
      </div>
    `;

    container.querySelector('#detail-mark-att')?.addEventListener('click', () => openProjectEffortModal(null, labour.id));
    container.querySelector('#detail-pay-wage')?.addEventListener('click', () => openLabourPayoutModal(labour.id));
    container.querySelector('#detail-edit-profile')?.addEventListener('click', () => openEditLabourModal(labour.id));

    container.querySelectorAll('.btn-del-payout').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete payout?')) {
          store.deleteLabourPayout(labour.id, btn.dataset.payoutId);
          openLabourDetailsModal(labour.id);
        }
      });
    });

    container.querySelector('#btn-delete-labour')?.addEventListener('click', () => {
      if (confirm(`Delete worker ${labour.name}?`)) {
        store.deleteLabour(labour.id);
        closeModal('log-labour-modal');
        showToast('Worker deleted');
        renderCurrentTab();
      }
    });

    openModal('log-labour-modal');
  }

  // --- 5.16 EDIT LABOUR / HEAD MASON MODAL ---
  function openEditLabourModal(labourId) {
    const labour = store.getLabourById(labourId);
    if (!labour) return;

    const container = document.getElementById('log-labour-modal-content');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">✏️ Edit Worker / Head Mason</h3>
          <p class="text-muted text-xs">Update profile or mark as Head Mason</p>
        </div>
        <button class="modal-close-btn" data-close-modal="log-labour-modal" aria-label="Close">×</button>
      </div>

      <form id="form-edit-labour" class="modal-form">
        <div class="form-group">
          <label class="form-label">Worker / Head Mason Name *</label>
          <input type="text" id="edlab-name" class="form-input" value="${labour.name}" required />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Role / Trade</label>
            <select id="edlab-role" class="form-select">
              ${LABOUR_ROLES.map(r => `<option value="${r}" ${labour.role === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Phone (WhatsApp)</label>
            <input type="tel" id="edlab-phone" class="form-input" value="${labour.phone || ''}" placeholder="e.g. 9876543210" />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Wage Type</label>
            <select id="edlab-wage-type" class="form-select">
              <option value="daily" ${labour.wageType === 'daily' ? 'selected' : ''}>Daily Wage</option>
              <option value="weekly" ${labour.wageType === 'weekly' ? 'selected' : ''}>Weekly</option>
              <option value="monthly" ${labour.wageType === 'monthly' ? 'selected' : ''}>Monthly</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Wage Rate (₹)</label>
            <input type="number" step="any" id="edlab-wage-rate" class="form-input font-bold" value="${labour.wageRate}" required />
          </div>
        </div>

        <label class="gdrive-toggle-label" style="margin-top:8px">
          <span>👑 Mark as Head Mason (Brings group/gang of men & women)</span>
          <input type="checkbox" id="edlab-is-head" ${labour.isHeadMason ? 'checked' : ''} />
        </label>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="log-labour-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    const form = container.querySelector('#form-edit-labour');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = container.querySelector('#edlab-name').value.trim();
      const rate = Number(container.querySelector('#edlab-wage-rate').value);

      if (!name) {
        showToast('Please enter worker name', 'error');
        return;
      }

      store.updateLabour(labourId, {
        name: name,
        role: container.querySelector('#edlab-role').value,
        phone: container.querySelector('#edlab-phone').value.trim(),
        wageType: container.querySelector('#edlab-wage-type').value,
        wageRate: rate,
        isHeadMason: container.querySelector('#edlab-is-head').checked
      });

      closeModal('log-labour-modal');
      showToast('Worker profile updated!');
      renderCurrentTab();
    });

    openModal('log-labour-modal');
  }

  // --- 5.16 INVENTORY & STOCK VIEW ---
  function renderInventory(container) {
    const settings = store.getSettings();
    const currency = settings.currency || '₹';
    const inventory = store.getInventory();

    const totalStockValuation = store.getTotalInventoryValuation();
    let totalPurchasesSpend = 0;
    inventory.forEach(i => (i.purchases || []).forEach(p => { totalPurchasesSpend += Number(p.totalCost) || 0; }));

    const filtered = inventory.filter(i => {
      if (invCategory !== 'all' && i.category !== invCategory) return false;
      if (invSearchQuery) {
        const q = invSearchQuery.toLowerCase();
        return i.name.toLowerCase().includes(q) || (i.category && i.category.toLowerCase().includes(q));
      }
      return true;
    });

    const categories = ['all', ...new Set(inventory.map(i => i.category).filter(Boolean))];

    container.innerHTML = `
      <div class="page-top-bar">
        <div>
          <h1 class="page-main-title">Inventory & Stock</h1>
          <p class="page-sub-title">Track materials, stock valuations & purchase spends</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-buy-material-stock">+ Buy Stock (Spend)</button>
      </div>

      <div class="inventory-overview-grid">
        <div class="inv-kpi-card"><span class="kpi-lbl">Stock Asset Value</span><strong class="kpi-val income-color">${formatCurrency(totalStockValuation, currency)}</strong></div>
        <div class="inv-kpi-card"><span class="kpi-lbl">Total Purchases</span><strong class="kpi-val spend-color">${formatCurrency(totalPurchasesSpend, currency)}</strong></div>
        <div class="inv-kpi-card"><span class="kpi-lbl">Stock Items</span><strong class="kpi-val">${inventory.length} Items</strong></div>
      </div>

      <div class="search-filter-row">
        <div class="search-box">
          <input type="text" id="inv-search-input" placeholder="Search materials (Bricks, Steel, Cement)..." value="${invSearchQuery}" />
        </div>
        <div class="filter-pills-row">
          ${categories.map(c => `<button class="filter-pill ${invCategory === c ? 'active' : ''}" data-cat="${c}">${c === 'all' ? 'All' : c}</button>`).join('')}
        </div>
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon">📦</div>
          <div class="empty-title">No Stock Items Found</div>
          <button class="btn btn-primary btn-sm" id="empty-buy-stock-btn">+ Add Stock Item</button>
        </div>
      ` : `
        <div class="inventory-card-grid">
          ${filtered.map(i => {
            const val = (i.currentStock || 0) * (i.avgPurchasePrice || 0);
            return `
              <div class="inventory-card" data-id="${i.id}">
                <div class="inv-card-top">
                  <div>
                    <span class="inv-cat-badge">${i.category || 'General'}</span>
                    <h3 class="inv-item-name">${i.name}</h3>
                  </div>
                  <span class="status-tag status-in-stock">In Stock</span>
                </div>
                <div class="inv-stock-highlight">
                  <div class="stock-qty-display">
                    <span class="stock-num">${formatNumber(i.currentStock)}</span>
                    <span class="stock-unit">${i.unit}</span>
                  </div>
                  <div class="stock-valuation-text">Value: <strong>${formatCurrency(val, currency)}</strong></div>
                </div>
                <div class="inv-card-actions">
                  <button class="btn btn-primary btn-sm btn-quick-buy" data-id="${i.id}" data-name="${i.name}" data-unit="${i.unit}" data-price="${i.avgPurchasePrice}">+ Buy Stock</button>
                  <button class="btn btn-outline btn-sm btn-view-inv-history" data-id="${i.id}">History (${i.purchases?.length || 0})</button>
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

    container.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        invCategory = pill.dataset.cat;
        renderInventory(container);
      });
    });

    container.querySelectorAll('.btn-quick-buy').forEach(btn => {
      btn.addEventListener('click', () => openBuyStockModal(btn.dataset.id, btn.dataset.name, btn.dataset.unit, btn.dataset.price));
    });

    container.querySelectorAll('.btn-view-inv-history').forEach(btn => {
      btn.addEventListener('click', () => openInventoryHistoryModal(btn.dataset.id));
    });
  }

  // --- 5.17 BUY STOCK MODAL ---
  function openBuyStockModal(itemId = null, prefillName = '', prefillUnit = 'Numbers', prefillPrice = '') {
    const container = document.getElementById('buy-inventory-modal-content');
    if (!container) return;

    const inventory = store.getInventory();
    const existing = itemId ? store.getInventoryItemById(itemId) : null;

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Record Stock Purchase (Spend)</h3>
          <p class="text-muted text-xs">Increments stock & logs purchase cost in Total Spends</p>
        </div>
        <button class="modal-close-btn" data-close-modal="buy-inventory-modal" aria-label="Close">×</button>
      </div>

      <form id="form-buy-inventory" class="modal-form">
        <div class="form-group">
          <label class="form-label">Material Name *</label>
          <input type="text" id="buy-mat-name" list="stock-inv-list" class="form-input" placeholder="e.g. Red Bricks, UltraTech Cement, Steel" value="${existing ? existing.name : prefillName}" required ${itemId ? 'readonly' : ''} />
          <datalist id="stock-inv-list">
            ${inventory.map(i => `<option value="${i.name}"></option>`).join('')}
          </datalist>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Quantity Bought *</label>
            <input type="number" step="any" id="buy-mat-qty" class="form-input font-bold" placeholder="e.g. 5000" required autofocus />
          </div>
          <div class="form-group">
            <label class="form-label">Unit Metric *</label>
            <select id="buy-mat-unit" class="form-select" ${itemId ? 'disabled' : ''}>
              <option value="Numbers" ${prefillUnit === 'Numbers' ? 'selected' : ''}>Numbers</option>
              <option value="Kg" ${prefillUnit === 'Kg' ? 'selected' : ''}>Kg</option>
              <option value="Bags" ${prefillUnit === 'Bags' ? 'selected' : ''}>Bags</option>
              <option value="Ton" ${prefillUnit === 'Ton' ? 'selected' : ''}>Ton</option>
              <option value="CFT" ${prefillUnit === 'CFT' ? 'selected' : ''}>CFT</option>
              <option value="Tins" ${prefillUnit === 'Tins' ? 'selected' : ''}>Tins</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Unit Purchase Price *</label>
            <input type="number" step="any" id="buy-mat-unit-price" class="form-input font-bold" value="${prefillPrice || (existing ? existing.avgPurchasePrice : '')}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Total Spend Amount</label>
            <input type="text" id="buy-mat-total-preview" class="form-input font-bold spend-color" readonly />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Supplier Name</label>
            <input type="text" id="buy-mat-supplier" class="form-input" placeholder="e.g. City Kiln, Steel Dealer" />
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" id="buy-mat-date" class="form-input" value="${getTodayDateString()}" required />
          </div>
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="buy-inventory-modal">Cancel</button>
          <button type="submit" class="btn btn-danger">Record Spend & Add Stock</button>
        </div>
      </form>
    `;

    const qtyInp = container.querySelector('#buy-mat-qty');
    const priceInp = container.querySelector('#buy-mat-unit-price');
    const totPrev = container.querySelector('#buy-mat-total-preview');

    function calc() {
      const q = Number(qtyInp.value) || 0;
      const p = Number(priceInp.value) || 0;
      totPrev.value = (q * p).toFixed(2);
    }
    qtyInp.addEventListener('input', calc);
    priceInp.addEventListener('input', calc);
    calc();

    const form = container.querySelector('#form-buy-inventory');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = container.querySelector('#buy-mat-name').value.trim();
      const qty = Number(qtyInp.value);
      const unitPrice = Number(priceInp.value);

      if (!name || qty <= 0 || unitPrice <= 0) {
        showToast('Please enter valid quantity and price', 'error');
        return;
      }

      store.recordStockPurchase(itemId, {
        name: name,
        unit: container.querySelector('#buy-mat-unit').value,
        quantity: qty,
        unitPrice: unitPrice,
        totalCost: qty * unitPrice,
        supplier: container.querySelector('#buy-mat-supplier').value.trim(),
        date: container.querySelector('#buy-mat-date').value
      });

      closeModal('buy-inventory-modal');
      showToast(`Added ${qty} of ${name} to stock!`);
      renderCurrentTab();
    });

    openModal('buy-inventory-modal');
  }

  // --- 5.18 INVENTORY HISTORY MODAL ---
  function openInventoryHistoryModal(itemId) {
    const item = store.getInventoryItemById(itemId);
    if (!item) return;

    const currency = store.getSettings().currency || '₹';
    const container = document.getElementById('inventory-history-modal-content');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${item.name} - Orders</h3>
          <p class="text-muted text-xs">Stock: ${formatNumber(item.currentStock)} ${item.unit}</p>
        </div>
        <button class="modal-close-btn" data-close-modal="inventory-history-modal" aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <div class="purchases-history-list">
          ${(!item.purchases || item.purchases.length === 0) ? `
            <div class="empty-table-msg">No purchase orders logged.</div>
          ` : item.purchases.map(p => `
            <div class="purchase-history-item">
              <div class="pur-item-top">
                <div><strong>${formatDate(p.date)}</strong> <span class="text-muted text-xs">${p.supplier ? `• ${p.supplier}` : ''}</span></div>
                <strong class="spend-color">-${formatCurrency(p.totalCost, currency)}</strong>
              </div>
              <div class="pur-item-details">${formatNumber(p.quantity)} ${item.unit} @ ${formatCurrency(p.unitPrice, currency)}/${item.unit}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    openModal('inventory-history-modal');
  }

  // --- 5.19 DIRECT SALES VIEW ---
  function renderDirectSales(container) {
    const settings = store.getSettings();
    const currency = settings.currency || '₹';
    const sales = store.getDirectSales();
    const totalSales = sales.reduce((s, sl) => s + (Number(sl.amountPaid) || 0), 0);

    container.innerHTML = `
      <div class="page-top-bar">
        <div>
          <h1 class="page-main-title">Direct Sales</h1>
          <p class="page-sub-title">Retail material sales outside projects (Adds to Income)</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-new-direct-sale">+ New Direct Sale</button>
      </div>

      <div class="sales-overview-grid">
        <div class="sales-kpi-card"><span class="kpi-lbl">Direct Sales Income</span><strong class="kpi-val income-color">${formatCurrency(totalSales, currency)}</strong></div>
        <div class="sales-kpi-card"><span class="kpi-lbl">Total Sales</span><strong class="kpi-val">${sales.length} Orders</strong></div>
      </div>

      ${sales.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon">🛒</div>
          <div class="empty-title">No Direct Sales Recorded</div>
          <button class="btn btn-primary btn-sm" id="empty-direct-sale-btn">+ Record First Direct Sale</button>
        </div>
      ` : `
        <div class="direct-sales-list">
          ${sales.map(s => {
            const waReceipt = `*${settings.companyName || 'BuilderMate'} - Sales Receipt*\nBuyer: *${s.customerName}*\nTotal: *${currency} ${s.totalAmount}*\nAmount Paid: *${currency} ${s.amountPaid} (${s.paymentMode})*\n\nThank you!`;
            return `
              <div class="direct-sale-card" data-id="${s.id}">
                <div class="sale-card-header">
                  <div>
                    <div class="sale-date-badge">${formatDate(s.date)}</div>
                    <h3 class="sale-buyer-name">${s.customerName}</h3>
                  </div>
                  <span class="sale-total-amount income-color">+${formatCurrency(s.amountPaid, currency)}</span>
                </div>
                <div class="sale-items-table">
                  ${s.items.map(i => `<div class="sale-item-row"><span>${i.name}</span><span>${formatNumber(i.quantity)} ${i.unit}</span><span>${formatCurrency(i.total, currency)}</span></div>`).join('')}
                </div>
                <div class="sale-card-footer">
                  <a href="${getWhatsAppLink(s.customerPhone || '', waReceipt)}" target="_blank" class="btn btn-outline btn-xs">💬 WhatsApp Receipt</a>
                  <button class="btn btn-danger btn-xs btn-del-sale" data-id="${s.id}">🗑️ Delete</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    container.querySelector('#btn-new-direct-sale')?.addEventListener('click', () => openNewDirectSaleModal());
    container.querySelector('#empty-direct-sale-btn')?.addEventListener('click', () => openNewDirectSaleModal());

    container.querySelectorAll('.btn-del-sale').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete direct sale record?')) {
          store.deleteDirectSale(btn.dataset.id);
          renderDirectSales(container);
        }
      });
    });
  }

  // --- 5.20 NEW DIRECT SALE MODAL ---
  function openNewDirectSaleModal() {
    const container = document.getElementById('direct-sale-modal-content');
    if (!container) return;

    const inventory = store.getInventory();
    const currency = store.getSettings().currency || '₹';
    directSaleItemsTemp = [{ name: 'Cement Bags', quantity: 10, unit: 'Bags', rate: 420, total: 4200 }];

    function renderModal() {
      const grandTotal = directSaleItemsTemp.reduce((s, i) => s + (Number(i.total) || 0), 0);
      container.innerHTML = `
        <div class="modal-header">
          <div><h3 class="modal-title">🛒 New Direct Material Sale</h3></div>
          <button class="modal-close-btn" data-close-modal="direct-sale-modal" aria-label="Close">×</button>
        </div>
        <form id="form-new-direct-sale" class="modal-form">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Buyer Name</label>
              <input type="text" id="sale-cust-name" class="form-input" placeholder="e.g. Anand Kumar (Walk-in)" />
            </div>
            <div class="form-group">
              <label class="form-label">Buyer Phone</label>
              <input type="tel" id="sale-cust-phone" class="form-input" placeholder="e.g. 9876543210" />
            </div>
          </div>

          <div class="sale-items-section">
            <div class="section-header-flex">
              <label class="form-label">Items Sold *</label>
              <button type="button" class="btn btn-outline btn-xs" id="btn-add-sale-row">+ Add Item</button>
            </div>
            <div class="direct-sale-rows-container">
              ${directSaleItemsTemp.map((item, idx) => `
                <div class="sale-item-input-row" data-idx="${idx}">
                  <input type="text" class="form-input sale-name" placeholder="Material" value="${item.name}" list="sale-inv-dl" required />
                  <div class="sale-row-bottom" style="margin-top:4px">
                    <input type="number" step="any" class="form-input sale-qty" placeholder="Qty" value="${item.quantity}" required />
                    <select class="form-select sale-unit">
                      <option value="Numbers" ${item.unit === 'Numbers' ? 'selected' : ''}>Nos</option>
                      <option value="Bags" ${item.unit === 'Bags' ? 'selected' : ''}>Bags</option>
                      <option value="Kg" ${item.unit === 'Kg' ? 'selected' : ''}>Kg</option>
                      <option value="Ton" ${item.unit === 'Ton' ? 'selected' : ''}>Ton</option>
                      <option value="CFT" ${item.unit === 'CFT' ? 'selected' : ''}>CFT</option>
                    </select>
                    <input type="number" step="any" class="form-input sale-rate" placeholder="Rate" value="${item.rate}" required />
                    <span class="font-mono text-xs">${formatCurrency(item.total, currency)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
            <datalist id="sale-inv-dl">${inventory.map(i => `<option value="${i.name}"></option>`).join('')}</datalist>
          </div>

          <div class="form-row-2" style="margin-top:12px">
            <div class="form-group">
              <label class="form-label">Total Amount</label>
              <input type="text" class="form-input font-bold income-color" value="${formatCurrency(grandTotal, currency)}" readonly />
            </div>
            <div class="form-group">
              <label class="form-label">Amount Collected</label>
              <input type="number" step="any" id="sale-paid" class="form-input font-bold" value="${grandTotal}" required />
            </div>
          </div>

          <div class="modal-footer-btns">
            <button type="button" class="btn btn-outline" data-close-modal="direct-sale-modal">Cancel</button>
            <button type="submit" class="btn btn-primary">Complete Sale</button>
          </div>
        </form>
      `;

      container.querySelector('#btn-add-sale-row')?.addEventListener('click', () => {
        directSaleItemsTemp.push({ name: '', quantity: 1, unit: 'Numbers', rate: 0, total: 0 });
        renderModal();
      });

      container.querySelectorAll('.sale-item-input-row').forEach(row => {
        const i = Number(row.dataset.idx);
        const nameInp = row.querySelector('.sale-name');
        const qtyInp = row.querySelector('.sale-qty');
        const unitSel = row.querySelector('.sale-unit');
        const rateInp = row.querySelector('.sale-rate');

        function upd() {
          const q = Number(qtyInp.value) || 0;
          const r = Number(rateInp.value) || 0;
          directSaleItemsTemp[i] = { name: nameInp.value.trim(), quantity: q, unit: unitSel.value, rate: r, total: q * r };
        }
        qtyInp.addEventListener('input', upd);
        rateInp.addEventListener('input', upd);
      });

      const form = container.querySelector('#form-new-direct-sale');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const valid = directSaleItemsTemp.filter(i => i.name && i.quantity > 0);
        if (valid.length === 0) {
          showToast('Please add items', 'error');
          return;
        }
        const paid = Number(container.querySelector('#sale-paid').value) || 0;
        store.addDirectSale({
          customerName: container.querySelector('#sale-cust-name').value.trim() || 'Walk-in Customer',
          customerPhone: container.querySelector('#sale-cust-phone').value.trim(),
          items: valid,
          amountPaid: paid
        });
        closeModal('direct-sale-modal');
        showToast(`Sale recorded! Added ${formatCurrency(paid, currency)} to Income.`);
        renderCurrentTab();
      });
    }

    renderModal();
    openModal('direct-sale-modal');
  }

  // --- 5.21 ADD PROJECT MATERIAL MODAL ---
  function openAddProjectMaterialModal(projectId) {
    const container = document.getElementById('add-material-modal-content');
    if (!container) return;
    const inventory = store.getInventory();

    container.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Add Material Sold / Used</h3>
        <button class="modal-close-btn" data-close-modal="add-material-modal" aria-label="Close">×</button>
      </div>
      <form id="form-add-proj-mat" class="modal-form">
        <div class="form-group">
          <label class="form-label">Material Name *</label>
          <input type="text" id="pmat-name" list="pmat-inv-dl" class="form-input" placeholder="e.g. Red Bricks, Steel, Cement" required />
          <datalist id="pmat-inv-dl">${inventory.map(i => `<option value="${i.name}"></option>`).join('')}</datalist>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Quantity *</label>
            <input type="number" step="any" id="pmat-qty" class="form-input" placeholder="5000" required />
          </div>
          <div class="form-group">
            <label class="form-label">Unit *</label>
            <select id="pmat-unit" class="form-select">
              <option value="Numbers">Numbers</option>
              <option value="Kg">Kg</option>
              <option value="Bags">Bags</option>
              <option value="Ton">Ton</option>
              <option value="CFT">CFT</option>
            </select>
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Rate per Unit *</label>
            <input type="number" step="any" id="pmat-rate" class="form-input" placeholder="Rate" required />
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" id="pmat-date" class="form-input" value="${getTodayDateString()}" required />
          </div>
        </div>
        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="add-material-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Add to Project</button>
        </div>
      </form>
    `;

    const form = container.querySelector('#form-add-proj-mat');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      store.addProjectMaterial(projectId, {
        name: container.querySelector('#pmat-name').value.trim(),
        quantity: container.querySelector('#pmat-qty').value,
        unit: container.querySelector('#pmat-unit').value,
        rate: container.querySelector('#pmat-rate').value,
        date: container.querySelector('#pmat-date').value
      });
      closeModal('add-material-modal');
      showToast('Material added to project!');
      openProjectDetailsModal(projectId, 'materials');
    });

    openModal('add-material-modal');
  }

  // --- 5.22 RECORD PAYMENT MODAL ---
  function openRecordPaymentModal(projectId) {
    const project = store.getProjectById(projectId);
    if (!project) return;
    const container = document.getElementById('record-payment-modal-content');
    if (!container) return;
    const fin = store.getProjectFinancials(project);

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Record Payment (Income)</h3>
          <p class="text-muted text-xs">Project: ${project.name}</p>
        </div>
        <button class="modal-close-btn" data-close-modal="record-payment-modal" aria-label="Close">×</button>
      </div>
      <form id="form-record-pay" class="modal-form">
        <div class="payment-balance-hint">
          <span>Outstanding Due:</span>
          <strong class="text-amber">${formatCurrency(fin.pendingBalance, store.getSettings().currency)}</strong>
        </div>
        <div class="form-group">
          <label class="form-label">Amount Collected *</label>
          <input type="number" step="any" id="pay-amt" class="form-input form-input-lg font-bold income-color" placeholder="0.00" required autofocus />
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Payment Mode</label>
            <select id="pay-mode" class="form-select">
              <option value="UPI / GPay">UPI / GPay / PhonePe</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" id="pay-date" class="form-input" value="${getTodayDateString()}" required />
          </div>
        </div>
        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" data-close-modal="record-payment-modal">Cancel</button>
          <button type="submit" class="btn btn-secondary">Save & Add to Income</button>
        </div>
      </form>
    `;

    const form = container.querySelector('#form-record-pay');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const amt = Number(container.querySelector('#pay-amt').value);
      if (!amt || amt <= 0) {
        showToast('Please enter valid amount', 'error');
        return;
      }
      store.addProjectPayment(projectId, {
        amount: amt,
        mode: container.querySelector('#pay-mode').value,
        date: container.querySelector('#pay-date').value
      });
      closeModal('record-payment-modal');
      showToast(`Payment of ${formatCurrency(amt, store.getSettings().currency)} added to Income!`);
      const detModal = document.getElementById('project-details-modal');
      if (detModal && detModal.classList.contains('active')) openProjectDetailsModal(projectId, 'payments');
    });

    openModal('record-payment-modal');
  }

  // --- 5.23 SETTINGS & GOOGLE DRIVE MODAL ---
  function renderSettingsModal() {
    const container = document.getElementById('settings-modal-content');
    if (!container) return;
    const settings = store.getSettings();
    const gdrive = settings.gdrive || {};

    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Company Settings & Backup</h3>
          <p class="text-muted text-xs">Profile, themes & persistent Google Drive backup</p>
        </div>
        <button class="modal-close-btn" data-close-modal="settings-modal" aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <form id="form-company-settings" class="modal-form" style="padding:0">
          <div class="settings-section-card">
            <h4 class="settings-card-title">🏢 Company Profile & Appearance</h4>
            <div class="form-group">
              <label class="form-label">Business / Company Name *</label>
              <input type="text" id="set-company-name" class="form-input" value="${settings.companyName || ''}" required />
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Contractor Name</label>
                <input type="text" id="set-contractor-name" class="form-input" value="${settings.contractorName || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Currency Symbol *</label>
                <select id="set-currency" class="form-select">
                  <option value="₹" ${settings.currency === '₹' ? 'selected' : ''}>₹ (INR)</option>
                  <option value="$" ${settings.currency === '$' ? 'selected' : ''}>$ (USD)</option>
                  <option value="AED" ${settings.currency === 'AED' ? 'selected' : ''}>AED (Dirham)</option>
                  <option value="SAR" ${settings.currency === 'SAR' ? 'selected' : ''}>SAR (Riyal)</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Theme</label>
              <select id="set-theme" class="form-select">
                <option value="light" ${(settings.theme || 'light') === 'light' ? 'selected' : ''}>☀️ Light Theme</option>
                <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>🌙 Dark Theme</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary btn-block">💾 Save Settings</button>
          </div>
        </form>

        <!-- Google Drive Section -->
        <div class="settings-section-card" style="margin-top:12px">
          <div class="gdrive-header-status">
            <h4 class="settings-card-title" style="margin:0">☁️ Google Drive Cloud Sync</h4>
            <span class="cloud-status-pill ${gdrive.isConnected ? 'connected' : 'disconnected'}">
              ${gdrive.isConnected ? '● Connected' : '○ Not Linked'}
            </span>
          </div>
          ${gdrive.isConnected ? `
            <div class="gdrive-connected-panel" style="margin-top:8px">
              <div class="text-xs text-muted" style="margin-bottom:8px">👤 ${gdrive.userEmail} • Last synced: ${formatTimeAgo(gdrive.lastSyncedAt)}</div>
              <div class="gdrive-actions-row">
                <button type="button" class="btn btn-primary btn-sm" id="btn-gdrive-sync-now">☁️ Sync Now</button>
                <button type="button" class="btn btn-outline btn-sm" id="btn-gdrive-restore-cloud">📥 Restore Cloud</button>
              </div>
              <button type="button" class="btn btn-outline btn-xs" id="btn-gdrive-disconnect" style="margin-top:6px">Disconnect</button>
            </div>
          ` : `
            <p class="settings-card-sub" style="margin:8px 0">Connect your Google account to automatically backup all projects, machinery, photos and payroll to private Google Drive storage.</p>
            <button type="button" class="btn btn-gdrive-connect btn-block" id="btn-gdrive-connect">Connect Google Drive</button>
          `}
        </div>

        <div class="settings-section-card" style="margin-top:12px">
          <h4 class="settings-card-title">💾 Manual JSON File Backup</h4>
          <div class="backup-actions-grid">
            <button class="btn btn-outline" id="btn-export-json-backup">📥 Download JSON</button>
            <label class="btn btn-outline file-input-label">
              📤 Restore File
              <input type="file" id="input-import-json" accept=".json" style="display:none" />
            </label>
          </div>
        </div>

        <div class="settings-section-card" style="margin-top:12px">
          <button class="btn btn-danger btn-xs btn-block" id="btn-reset-all-data">⚠️ Reset All Data</button>
        </div>
      </div>
    `;

    container.querySelector('#btn-gdrive-connect')?.addEventListener('click', () => GDrive.connect(true));
    container.querySelector('#btn-gdrive-disconnect')?.addEventListener('click', () => GDrive.disconnect());
    container.querySelector('#btn-gdrive-sync-now')?.addEventListener('click', () => GDrive.uploadData(true, true));
    container.querySelector('#btn-gdrive-restore-cloud')?.addEventListener('click', () => GDrive.restoreFromCloud());

    const form = container.querySelector('#form-company-settings');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const theme = container.querySelector('#set-theme').value;
      applyTheme(theme);
      store.updateSettings({
        companyName: container.querySelector('#set-company-name').value.trim(),
        contractorName: container.querySelector('#set-contractor-name').value.trim(),
        currency: container.querySelector('#set-currency').value,
        theme: theme,
        isOnboarded: true
      });
      closeModal('settings-modal');
      showToast('Settings saved!');
      renderCurrentTab();
    });

    container.querySelector('#btn-export-json-backup')?.addEventListener('click', () => {
      downloadJson(store.exportFullData());
      showToast('Backup downloaded!');
    });

    container.querySelector('#input-import-json')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (confirm('Restore this backup file?')) {
            store.importFullData(parsed);
            showToast('Data restored!');
            closeModal('settings-modal');
            renderCurrentTab();
          }
        } catch (err) {
          showToast('Invalid backup file', 'error');
        }
      };
      reader.readAsText(file);
    });

    container.querySelector('#btn-reset-all-data')?.addEventListener('click', () => {
      if (confirm('⚠️ WARNING: Erase all data?')) {
        store.resetAllData();
        showToast('Database reset');
        closeModal('settings-modal');
        renderCurrentTab();
      }
    });
  }

  // =========================================================================
  // 6. NAVIGATION & APP INITIALIZER
  // =========================================================================
  function renderCurrentTab() {
    const container = document.getElementById('main-tab-content');
    if (!container) return;
    window.scrollTo({ top: 0, behavior: 'instant' });

    switch (activeTab) {
      case 'dashboard': renderDashboard(container); break;
      case 'projects': renderProjects(container); break;
      case 'inventory': renderInventory(container); break;
      case 'vehicles': renderVehicles(container); break;
      case 'direct-sales': renderDirectSales(container); break;
      case 'labours': renderLabours(container); break;
      default: renderDashboard(container);
    }
  }

  function switchTab(tabName) {
    activeTab = tabName;
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    renderCurrentTab();
  }

  function checkFirstRunOnboarding() {
    const s = store.getSettings();
    if (!s.isOnboarded && !s.companyName) {
      setTimeout(() => openModal('onboarding-modal'), 300);
    }
  }

  function initPwaAndEvents() {
    document.addEventListener('click', (e) => {
      const closeTarget = e.target.closest('[data-close-modal], .modal-close-btn, .sheet-close-btn');
      if (closeTarget) {
        const id = closeTarget.dataset.closeModal;
        if (id) closeModal(id);
        else {
          const parent = closeTarget.closest('.modal-overlay');
          if (parent) closeModal(parent.id);
        }
      }
    });

    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.tab;
        if (t && t !== activeTab) switchTab(t);
      });
    });

    document.getElementById('fab-quick-add')?.addEventListener('click', () => openModal('quick-add-action-sheet'));

    document.querySelectorAll('.action-sheet-item').forEach(item => {
      item.addEventListener('click', () => {
        closeModal('quick-add-action-sheet');
        const act = item.dataset.action;
        if (act === 'new-project') openModal('new-project-modal');
        else if (act === 'buy-stock') openBuyStockModal();
        else if (act === 'log-vehicle') openLogVehicleRentalModal();
        else if (act === 'direct-sale') openNewDirectSaleModal();
        else if (act === 'add-labour') openLogAttendanceModal();
      });
    });

    document.getElementById('form-onboarding')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const compName = document.getElementById('onboard-company-name').value.trim();
      if (!compName) return;
      store.updateSettings({
        companyName: compName,
        contractorName: document.getElementById('onboard-contractor-name').value.trim(),
        currency: document.getElementById('onboard-currency').value,
        phone: document.getElementById('onboard-phone').value.trim(),
        isOnboarded: true
      });
      closeModal('onboarding-modal');
      showToast(`Welcome to BuilderMate, ${compName}! 🎉`);
      renderCurrentTab();
    });

    document.getElementById('form-new-project')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('new-proj-name').value.trim();
      if (!name) return;
      const created = store.addProject({
        name: name,
        customerName: document.getElementById('new-proj-cust-name').value.trim(),
        customerPhone: document.getElementById('new-proj-cust-phone').value.trim(),
        siteAddress: document.getElementById('new-proj-address').value.trim(),
        estimatedBudget: Number(document.getElementById('new-proj-budget').value) || 0,
        startDate: document.getElementById('new-proj-start-date').value || getTodayDateString(),
        status: 'in_progress'
      });
      closeModal('new-project-modal');
      document.getElementById('form-new-project').reset();
      showToast(`Project "${name}" created!`);
      switchTab('projects');
      openProjectDetailsModal(created.id, 'photos');
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay.id);
      });
    });

    window.addEventListener('online', () => GDrive?.queueDebouncedSync?.());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && GDrive?.uploadData) {
        if (store.getSettings().gdrive?.isConnected) GDrive.uploadData(false);
      }
    });

    if (location.protocol.startsWith('http') && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      document.getElementById('pwa-install-banner')?.classList.add('visible');
    });

    document.getElementById('btn-pwa-install-action')?.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') showToast('BuilderMate added to homescreen!');
        deferredInstallPrompt = null;
        document.getElementById('pwa-install-banner')?.classList.remove('visible');
      }
    });

    document.getElementById('btn-pwa-dismiss')?.addEventListener('click', () => {
      document.getElementById('pwa-install-banner')?.classList.remove('visible');
    });
  }

  function init() {
    applyTheme(store.getSettings().theme || 'light');
    initPwaAndEvents();
    renderCurrentTab();
    checkFirstRunOnboarding();

    if (window.google && window.google.accounts) GDrive.init();
    else window.addEventListener('load', () => setTimeout(() => GDrive.init(), 500));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
