/**
 * BuilderMate - Projects Component
 */

import { store } from '../store.js';
import { 
  formatCurrency, 
  formatNumber, 
  formatDate, 
  getTodayDateString, 
  getWhatsAppLink, 
  getTelLink, 
  openModal, 
  closeModal, 
  showToast,
  PRESET_MATERIALS 
} from '../utils.js';

let currentFilter = 'all';
let searchQuery = '';
let selectedProjectId = null;

export function renderProjects(container) {
  const settings = store.getSettings();
  const currency = settings.currency || '₹';
  const allProjects = store.getProjects();

  // Filter projects
  let filteredProjects = allProjects.filter(p => {
    if (currentFilter !== 'all' && p.status !== currentFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.customerName && p.customerName.toLowerCase().includes(q)) ||
        (p.siteAddress && p.siteAddress.toLowerCase().includes(q))
      );
    }
    return true;
  });

  container.innerHTML = `
    <!-- Top Action Bar -->
    <div class="page-top-bar">
      <div>
        <h1 class="page-main-title">Projects Hub</h1>
        <p class="page-sub-title">Track customer sites, materials sold & payments collected</p>
      </div>
      <button class="btn btn-primary" id="btn-create-new-project">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>New Project</span>
      </button>
    </div>

    <!-- Search & Filters -->
    <div class="search-filter-row">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input 
          type="text" 
          id="project-search-input" 
          placeholder="Search projects, client or site..." 
          value="${searchQuery}"
        />
        ${searchQuery ? `<button id="clear-search-btn" class="clear-search">×</button>` : ''}
      </div>

      <div class="filter-pills-row">
        <button class="filter-pill ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">All (${allProjects.length})</button>
        <button class="filter-pill ${currentFilter === 'in_progress' ? 'active' : ''}" data-filter="in_progress">In Progress (${allProjects.filter(p => p.status === 'in_progress').length})</button>
        <button class="filter-pill ${currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">Completed (${allProjects.filter(p => p.status === 'completed').length})</button>
        <button class="filter-pill ${currentFilter === 'on_hold' ? 'active' : ''}" data-filter="on_hold">On Hold (${allProjects.filter(p => p.status === 'on_hold').length})</button>
      </div>
    </div>

    <!-- Projects List -->
    ${filteredProjects.length === 0 ? `
      <div class="empty-state-card">
        <div class="empty-icon">🏗️</div>
        <div class="empty-title">${searchQuery ? 'No Matching Projects' : 'No Projects in this section'}</div>
        <p class="empty-desc">Create a new project or adjust your search filters.</p>
        <button class="btn btn-primary btn-sm" id="empty-create-project-btn">+ Add New Project</button>
      </div>
    ` : `
      <div class="projects-card-grid">
        ${filteredProjects.map(project => {
          const fin = store.getProjectFinancials(project);
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

              <!-- Customer Communication Bar -->
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
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2M12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.04 3.67C16.58 3.67 20.28 7.37 20.28 11.91C20.28 16.46 16.58 20.15 12.04 20.15M16.57 14.34C16.32 14.21 15.09 13.61 14.86 13.53C14.63 13.44 14.47 13.4 14.3 13.65C14.14 13.89 13.66 14.47 13.52 14.63C13.37 14.8 13.22 14.82 12.97 14.7C12.72 14.57 11.93 14.31 10.99 13.47C10.25 12.82 9.75 12.01 9.61 11.76C9.46 11.52 9.6 11.38 9.72 11.26C9.83 11.15 9.97 10.97 10.1 10.82C10.22 10.68 10.27 10.57 10.35 10.41C10.43 10.24 10.39 10.1 10.33 9.98C10.27 9.85 9.77 8.63 9.57 8.13C9.37 7.64 9.17 7.71 9.02 7.7C8.88 7.7 8.71 7.7 8.55 7.7C8.38 7.7 8.11 7.76 7.89 8.01C7.66 8.25 7.02 8.85 7.02 10.07C7.02 11.29 7.91 12.47 8.03 12.63C8.16 12.8 9.77 15.28 12.24 16.35C12.83 16.6 13.28 16.75 13.64 16.87C14.23 17.06 14.77 17.03 15.2 16.97C15.68 16.9 16.67 16.37 16.88 15.79C17.08 15.21 17.08 14.72 17.02 14.62C16.96 14.52 16.82 14.46 16.57 14.34Z"/></svg>
                      WhatsApp
                    </a>
                    <a 
                      href="${getTelLink(project.customerPhone)}" 
                      class="btn-contact-action btn-call" 
                      title="Call Customer"
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      Call
                    </a>
                  </div>
                </div>
              ` : ''}

              <!-- Financial Balance Bar -->
              <div class="project-finance-box">
                <div class="finance-grid">
                  <div class="fin-item">
                    <span class="fin-lbl">Collected (Income)</span>
                    <strong class="fin-val income-color">${formatCurrency(fin.totalCollected, currency)}</strong>
                  </div>
                  <div class="fin-item">
                    <span class="fin-lbl">Est. Value / Total</span>
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

              <!-- Quick Materials Summary Tags -->
              <div class="project-materials-snippet">
                <span class="mat-snippet-title">Products / Materials (${project.materials ? project.materials.length : 0}):</span>
                <div class="materials-tag-cloud">
                  ${(!project.materials || project.materials.length === 0) ? `
                    <span class="text-muted text-xs">No materials added yet</span>
                  ` : project.materials.slice(0, 4).map(m => `
                    <span class="mat-tag">${m.name}: <strong>${formatNumber(m.quantity)} ${m.unit}</strong></span>
                  `).join('')}
                  ${project.materials && project.materials.length > 4 ? `
                    <span class="mat-tag-more">+${project.materials.length - 4} more</span>
                  ` : ''}
                </div>
              </div>

              <!-- Project Card Actions -->
              <div class="project-card-footer">
                <button class="btn btn-outline btn-sm btn-view-project" data-id="${project.id}">
                  <span>📊 Details & Materials</span>
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

  attachProjectsEvents(container);
}

function attachProjectsEvents(container) {
  // New Project Button
  const btnNewProj = container.querySelector('#btn-create-new-project');
  if (btnNewProj) {
    btnNewProj.addEventListener('click', () => openModal('new-project-modal'));
  }

  const emptyCreateBtn = container.querySelector('#empty-create-project-btn');
  if (emptyCreateBtn) {
    emptyCreateBtn.addEventListener('click', () => openModal('new-project-modal'));
  }

  // Search input
  const searchInput = container.querySelector('#project-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProjects(container);
    });
  }

  const clearSearch = container.querySelector('#clear-search-btn');
  if (clearSearch) {
    clearSearch.addEventListener('click', () => {
      searchQuery = '';
      renderProjects(container);
    });
  }

  // Filter pills
  container.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      currentFilter = pill.dataset.filter;
      renderProjects(container);
    });
  });

  // View Project Details
  container.querySelectorAll('.btn-view-project').forEach(btn => {
    btn.addEventListener('click', () => {
      const projId = btn.dataset.id;
      openProjectDetailsModal(projId);
    });
  });

  // Quick Collect Money
  container.querySelectorAll('.btn-quick-payment').forEach(btn => {
    btn.addEventListener('click', () => {
      const projId = btn.dataset.id;
      openRecordPaymentModal(projId);
    });
  });
}

// Open Dedicated Project Details Full-Sheet Modal
export function openProjectDetailsModal(projectId) {
  selectedProjectId = projectId;
  const project = store.getProjectById(projectId);
  if (!project) return;

  const settings = store.getSettings();
  const currency = settings.currency || '₹';
  const fin = store.getProjectFinancials(project);

  const modalContainer = document.getElementById('project-details-modal-content');
  if (!modalContainer) return;

  const waSummary = `*${settings.companyName || 'BuilderMate'} - Project Statement*\nProject: *${project.name}*\nClient: *${project.customerName || '-'}*\n\n*Materials / Work Done:*\n${(project.materials || []).map(m => `• ${m.name}: ${m.quantity} ${m.unit} @ ${currency}${m.rate} = ${currency}${m.total}`).join('\n') || 'None'}\n\n*Financials:*\n• Total Billed/Est: *${currency} ${fin.estimatedValue}*\n• Total Paid: *${currency} ${fin.totalCollected}*\n• *Remaining Balance Due: ${currency} ${fin.pendingBalance}*\n\nThank you!`;

  modalContainer.innerHTML = `
    <div class="sheet-header">
      <div>
        <span class="status-tag status-${project.status}">
          ${project.status === 'in_progress' ? 'In Progress' : project.status === 'completed' ? 'Completed' : 'On Hold'}
        </span>
        <h2 class="sheet-title">${project.name}</h2>
        <p class="text-muted text-sm">Started: ${formatDate(project.startDate)}</p>
      </div>
      <button class="sheet-close-btn" id="close-project-details-modal">×</button>
    </div>

    <div class="sheet-body">
      <!-- Client Card -->
      <div class="client-details-card">
        <div class="client-info-row">
          <div>
            <strong>Client:</strong> ${project.customerName || 'No Client Name'}
          </div>
          ${project.customerPhone ? `<div><strong>Phone:</strong> ${project.customerPhone}</div>` : ''}
        </div>
        ${project.siteAddress ? `
          <div class="client-address-row">
            <strong>Site:</strong> ${project.siteAddress}
          </div>
        ` : ''}
        
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

      <!-- Financial Highlights -->
      <div class="proj-sheet-finance-grid">
        <div class="fin-box-sm">
          <span class="lbl">Est. Total</span>
          <strong>${formatCurrency(fin.estimatedValue, currency)}</strong>
        </div>
        <div class="fin-box-sm">
          <span class="lbl">Total Collected</span>
          <strong class="income-color">${formatCurrency(fin.totalCollected, currency)}</strong>
        </div>
        <div class="fin-box-sm">
          <span class="lbl">Balance Due</span>
          <strong class="${fin.pendingBalance > 0 ? 'text-amber' : 'income-color'}">${formatCurrency(fin.pendingBalance, currency)}</strong>
        </div>
      </div>

      <!-- Section: Products & Materials Sold for this Project -->
      <div class="drawer-section">
        <div class="section-header-flex">
          <h3 class="drawer-section-title">🧱 Materials / Products Sold</h3>
          <button class="btn btn-primary btn-xs" id="btn-add-project-material">+ Add Material</button>
        </div>

        <div class="material-items-table-wrap">
          ${(!project.materials || project.materials.length === 0) ? `
            <div class="empty-table-msg">No materials added yet. Add bricks, steel, cement, aggregates, paint, etc.</div>
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

      <!-- Section: Money Collected from Customer (Income) -->
      <div class="drawer-section">
        <div class="section-header-flex">
          <h3 class="drawer-section-title">💰 Money Collected (Income)</h3>
          <button class="btn btn-secondary btn-xs" id="btn-record-proj-payment">+ Collect Money</button>
        </div>

        <div class="payments-items-wrap">
          ${(!project.payments || project.payments.length === 0) ? `
            <div class="empty-table-msg">No payments collected yet. Record advances or milestone receipts.</div>
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

      <!-- Project Status & Settings Actions -->
      <div class="drawer-section">
        <h3 class="drawer-section-title">⚙️ Project Status</h3>
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

      <!-- Share / Delete -->
      <div class="sheet-danger-footer">
        <button class="btn btn-danger btn-sm" id="btn-delete-project">
          Delete Project
        </button>
      </div>
    </div>
  `;

  openModal('project-details-modal');
  attachProjectDetailsEvents(projectId);
}

function attachProjectDetailsEvents(projectId) {
  const modal = document.getElementById('project-details-modal');
  if (!modal) return;

  // Close
  const closeBtn = modal.querySelector('#close-project-details-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal('project-details-modal'));
  }

  // Add Material
  const addMatBtn = modal.querySelector('#btn-add-project-material');
  if (addMatBtn) {
    addMatBtn.addEventListener('click', () => {
      openAddProjectMaterialModal(projectId);
    });
  }

  // Record Payment
  const recordPayBtn = modal.querySelector('#btn-record-proj-payment');
  if (recordPayBtn) {
    recordPayBtn.addEventListener('click', () => {
      openRecordPaymentModal(projectId);
    });
  }

  // Delete Material
  modal.querySelectorAll('.btn-del-material').forEach(btn => {
    btn.addEventListener('click', () => {
      const matId = btn.dataset.matId;
      if (confirm('Remove this material item from project?')) {
        store.deleteProjectMaterial(projectId, matId);
        showToast('Material removed');
        openProjectDetailsModal(projectId);
      }
    });
  });

  // Delete Payment
  modal.querySelectorAll('.btn-del-payment').forEach(btn => {
    btn.addEventListener('click', () => {
      const payId = btn.dataset.payId;
      if (confirm('Delete this payment record? This will reduce total income count.')) {
        store.deleteProjectPayment(projectId, payId);
        showToast('Payment record deleted', 'info');
        openProjectDetailsModal(projectId);
      }
    });
  });

  // Status buttons
  modal.querySelectorAll('.btn-set-status').forEach(btn => {
    btn.addEventListener('click', () => {
      const newStatus = btn.dataset.status;
      store.updateProject(projectId, { status: newStatus });
      showToast(`Status updated to ${newStatus.replace('_', ' ')}`);
      openProjectDetailsModal(projectId);
    });
  });

  // Delete Project
  const delProjBtn = modal.querySelector('#btn-delete-project');
  if (delProjBtn) {
    delProjBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this entire project? This cannot be undone.')) {
        store.deleteProject(projectId);
        closeModal('project-details-modal');
        showToast('Project deleted', 'info');
      }
    });
  }
}

// Modal: Add Material to Project
export function openAddProjectMaterialModal(projectId) {
  const container = document.getElementById('add-material-modal-content');
  if (!container) return;

  const project = store.getProjectById(projectId);
  if (!project) return;

  const inventoryItems = store.getInventory();

  container.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">Add Material Sold / Used</h3>
      <button class="modal-close-btn" onclick="document.getElementById('add-material-modal').classList.remove('active')">×</button>
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
        <button type="button" class="btn btn-outline" onclick="document.getElementById('add-material-modal').classList.remove('active')">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Material</button>
      </div>
    </form>
  `;

  // Auto calculate total
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

  // Preset chips click
  container.querySelectorAll('.chip-mat-select').forEach(chip => {
    chip.addEventListener('click', () => {
      nameInput.value = chip.dataset.name;
      unitSelect.value = chip.dataset.unit;
      // If found in inventory, auto fill avg rate
      const inv = inventoryItems.find(i => i.name.toLowerCase() === chip.dataset.name.toLowerCase());
      if (inv && inv.avgPurchasePrice) {
        rateInput.value = inv.avgPurchasePrice;
        updateTotal();
      }
    });
  });

  // Name change auto-unit detection
  nameInput.addEventListener('change', () => {
    const inv = inventoryItems.find(i => i.name.toLowerCase() === nameInput.value.toLowerCase());
    if (inv) {
      unitSelect.value = inv.unit;
      if (inv.avgPurchasePrice) {
        rateInput.value = inv.avgPurchasePrice;
        updateTotal();
      }
    }
  });

  // Form submit
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
    openProjectDetailsModal(projectId);
  });

  openModal('add-material-modal');
}

// Modal: Record Customer Payment (Adds to Income)
export function openRecordPaymentModal(projectId) {
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
      <button class="modal-close-btn" onclick="document.getElementById('record-payment-modal').classList.remove('active')">×</button>
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
        <button type="button" class="btn btn-outline" onclick="document.getElementById('record-payment-modal').classList.remove('active')">Cancel</button>
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
    
    // If project details modal is active, refresh it
    const detailsModal = document.getElementById('project-details-modal');
    if (detailsModal && detailsModal.classList.contains('active')) {
      openProjectDetailsModal(projectId);
    }
  });

  openModal('record-payment-modal');
}
