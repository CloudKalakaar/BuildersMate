/**
 * BuilderMate - Settings, Company Profile & Data Backup Component
 */

import { store } from '../store.js';
import { downloadJson, showToast, closeModal, openModal } from '../utils.js';

export function renderSettingsModal() {
  const container = document.getElementById('settings-modal-content');
  if (!container) return;

  const settings = store.getSettings();

  container.innerHTML = `
    <div class="modal-header">
      <div class="header-brand-line">
        <img src="icon.png" alt="Logo" class="modal-logo-icon" />
        <div>
          <h3 class="modal-title">Company Settings & Backup</h3>
          <p class="text-muted text-xs">Customize branding, currency & secure your business data</p>
        </div>
      </div>
      <button class="modal-close-btn" onclick="document.getElementById('settings-modal').classList.remove('active')">×</button>
    </div>

    <div class="modal-body">
      <!-- Company Branding Form -->
      <form id="form-company-settings" class="modal-form">
        <div class="settings-section-card">
          <h4 class="settings-card-title">🏢 Company & Contractor Profile</h4>
          <p class="settings-card-sub">This name and contact will appear on your dashboard, invoices, and WhatsApp slips.</p>

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
              <label class="form-label">Contractor / Owner Name</label>
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
              <option value="C$" ${settings.currency === 'C$' ? 'selected' : ''}>C$ (Canadian Dollar)</option>
              <option value="A$" ${settings.currency === 'A$' ? 'selected' : ''}>A$ (Australian Dollar)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Office / Yard Address</label>
            <input 
              type="text" 
              id="set-address" 
              class="form-input" 
              placeholder="e.g. Ring Road Industrial Yard, Bangalore" 
              value="${settings.address || ''}" 
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block">
            💾 Save Company Profile
          </button>
        </div>
      </form>

      <!-- Data Backup & Restore -->
      <div class="settings-section-card">
        <h4 class="settings-card-title">💾 Backup & Restore (Offline Data Safety)</h4>
        <p class="settings-card-sub">All data is saved locally on your phone. Export backup files regularly to prevent data loss or to switch phones.</p>

        <div class="backup-actions-grid">
          <button class="btn btn-outline" id="btn-export-json-backup">
            📥 Download Backup (JSON)
          </button>
          
          <label class="btn btn-outline file-input-label">
            📤 Restore from Backup
            <input type="file" id="input-import-json" accept=".json" style="display:none" />
          </label>
        </div>
      </div>

      <!-- App Info & Reset -->
      <div class="settings-section-card">
        <h4 class="settings-card-title">📱 App Information & Quick Reset</h4>
        <div class="app-info-row">
          <span>Version: <strong>BuilderMate v1.0.0 (PWA)</strong></span>
          <span class="status-pill pill-green">Offline Ready</span>
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

  attachSettingsEvents(container);
}

function attachSettingsEvents(container) {
  // Save Settings Form
  const form = container.querySelector('#form-company-settings');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const companyName = container.querySelector('#set-company-name').value.trim();
      const contractorName = container.querySelector('#set-contractor-name').value.trim();
      const phone = container.querySelector('#set-phone').value.trim();
      const currency = container.querySelector('#set-currency').value;
      const address = container.querySelector('#set-address').value.trim();

      store.updateSettings({
        companyName: companyName,
        contractorName: contractorName,
        phone: phone,
        currency: currency,
        address: address,
        isOnboarded: true
      });

      closeModal('settings-modal');
      showToast('Settings saved successfully!');
      window.dispatchEvent(new CustomEvent('refresh-all-views'));
    });
  }

  // Export JSON
  const btnExport = container.querySelector('#btn-export-json-backup');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const data = store.exportFullData();
      const filename = `BuilderMate_Backup_${(store.getSettings().companyName || 'App').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
      downloadJson(data, filename);
      showToast('Backup file downloaded!');
    });
  }

  // Import JSON
  const fileInput = container.querySelector('#input-import-json');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (confirm('Restoring this backup will replace current records. Do you want to proceed?')) {
            store.importFullData(parsed);
            showToast('Backup restored successfully!');
            closeModal('settings-modal');
            window.dispatchEvent(new CustomEvent('refresh-all-views'));
          }
        } catch (err) {
          showToast('Invalid backup file. Please select a valid BuilderMate JSON file.', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // Load Sample Data
  const btnSample = container.querySelector('#btn-load-sample-data');
  if (btnSample) {
    btnSample.addEventListener('click', () => {
      if (confirm('Load sample demonstration projects, inventory and workers?')) {
        // Add sample project
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

        store.addDirectSale({
          customerName: 'Vijay Patel (Retail)',
          customerPhone: '9876054321',
          items: [
            { name: 'Asian Paints Apex Exterior', quantity: 2, unit: 'Tins', rate: 3800, total: 7600 }
          ],
          amountPaid: 7600,
          paymentMode: 'Cash',
          notes: 'Cash counter sale'
        });

        showToast('Sample demo data loaded!');
        closeModal('settings-modal');
        window.dispatchEvent(new CustomEvent('refresh-all-views'));
      }
    });
  }

  // Reset Data
  const btnReset = container.querySelector('#btn-reset-all-data');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('⚠️ WARNING: This will erase all projects, inventory, sales, and labour records! Are you sure?')) {
        store.resetAllData();
        showToast('Database reset to fresh state', 'info');
        closeModal('settings-modal');
        window.dispatchEvent(new CustomEvent('refresh-all-views'));
      }
    });
  }
}
