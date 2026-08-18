/**
 * BuilderMate - Labours & Payroll Component (Spends Tracker)
 */

import { store } from '../store.js';
import { 
  formatCurrency, 
  formatDate, 
  getTodayDateString, 
  getWhatsAppLink, 
  getTelLink, 
  openModal, 
  closeModal, 
  showToast,
  LABOUR_ROLES 
} from '../utils.js';

let selectedWageFilter = 'all';
let searchLabourQuery = '';

export function renderLabours(container) {
  const settings = store.getSettings();
  const currency = settings.currency || '₹';
  const labours = store.getLabours();

  // Financial aggregates
  let totalWagesPaid = 0;
  let totalBalanceDue = 0;

  labours.forEach(l => {
    const fin = store.getLabourFinancials(l);
    totalWagesPaid += fin.totalPaid;
    totalBalanceDue += fin.balanceDue;
  });

  // Filter labours
  let filteredLabours = labours.filter(l => {
    if (selectedWageFilter !== 'all' && l.wageType !== selectedWageFilter) return false;
    if (searchLabourQuery) {
      const q = searchLabourQuery.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        (l.role && l.role.toLowerCase().includes(q))
      );
    }
    return true;
  });

  container.innerHTML = `
    <!-- Top Action Bar -->
    <div class="page-top-bar">
      <div>
        <h1 class="page-main-title">Labours & Payroll</h1>
        <p class="page-sub-title">Manage daily/weekly/monthly wages, attendance & wage payouts (Spends)</p>
      </div>
      <button class="btn btn-primary" id="btn-add-new-labour">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>+ Add Worker</span>
      </button>
    </div>

    <!-- Labour KPI Metrics -->
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
        <span class="kpi-sub">On Roll & Contract</span>
      </div>
    </div>

    <!-- Quick Action Shortcut Buttons -->
    <div class="labour-quick-action-strip">
      <button class="btn btn-outline btn-sm" id="btn-bulk-attendance">
        📅 Quick Mark Attendance
      </button>
      <button class="btn btn-secondary btn-sm" id="btn-quick-payout">
        💸 Record Wage Payout
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
          id="lab-search-input" 
          placeholder="Search worker by name or role..." 
          value="${searchLabourQuery}"
        />
        ${searchLabourQuery ? `<button id="clear-lab-search-btn" class="clear-search">×</button>` : ''}
      </div>

      <div class="filter-pills-row">
        <button class="filter-pill ${selectedWageFilter === 'all' ? 'active' : ''}" data-wage="all">All (${labours.length})</button>
        <button class="filter-pill ${selectedWageFilter === 'daily' ? 'active' : ''}" data-wage="daily">Daily Wage (${labours.filter(l => l.wageType === 'daily').length})</button>
        <button class="filter-pill ${selectedWageFilter === 'weekly' ? 'active' : ''}" data-wage="weekly">Weekly (${labours.filter(l => l.wageType === 'weekly').length})</button>
        <button class="filter-pill ${selectedWageFilter === 'monthly' ? 'active' : ''}" data-wage="monthly">Monthly (${labours.filter(l => l.wageType === 'monthly').length})</button>
      </div>
    </div>

    <!-- Workers Cards List -->
    ${filteredLabours.length === 0 ? `
      <div class="empty-state-card">
        <div class="empty-icon">👷</div>
        <div class="empty-title">No Workers Found</div>
        <p class="empty-desc">Add masons, helpers, carpenters, and electricians to track daily attendance and payouts.</p>
        <button class="btn btn-primary btn-sm" id="empty-add-labour-btn">+ Add First Worker</button>
      </div>
    ` : `
      <div class="labours-card-grid">
        ${filteredLabours.map(lab => {
          const fin = store.getLabourFinancials(lab);
          const lastAtt = lab.attendance && lab.attendance.length > 0 ? lab.attendance[0] : null;

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

              <!-- Balance & Attendance Summary -->
              <div class="labour-stats-row">
                <div class="lab-stat-box">
                  <span class="lbl">Days Logged</span>
                  <strong>${lab.attendance ? lab.attendance.length : 0} Days</strong>
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
                  <span>Last Log: <strong>${formatDate(lastAtt.date)}</strong> (${lastAtt.status.replace('_', ' ')})</span>
                </div>
              ` : ''}

              <div class="labour-card-actions">
                <button class="btn btn-outline btn-xs btn-log-att" data-id="${lab.id}" data-name="${lab.name}">
                  📅 Attendance
                </button>
                <button class="btn btn-secondary btn-xs btn-pay-wage" data-id="${lab.id}" data-name="${lab.name}" data-rate="${lab.wageRate}" data-type="${lab.wageType}">
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

  attachLaboursEvents(container);
}

function attachLaboursEvents(container) {
  // Add new labour
  const btnAdd = container.querySelector('#btn-add-new-labour');
  if (btnAdd) btnAdd.addEventListener('click', () => openAddLabourModal());

  const emptyBtn = container.querySelector('#empty-add-labour-btn');
  if (emptyBtn) emptyBtn.addEventListener('click', () => openAddLabourModal());

  // Bulk attendance
  const bulkAttBtn = container.querySelector('#btn-bulk-attendance');
  if (bulkAttBtn) bulkAttBtn.addEventListener('click', () => openLogAttendanceModal());

  // Quick payout
  const quickPayBtn = container.querySelector('#btn-quick-payout');
  if (quickPayBtn) quickPayBtn.addEventListener('click', () => openLabourPayoutModal());

  // Search input
  const searchInput = container.querySelector('#lab-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchLabourQuery = e.target.value;
      renderLabours(container);
    });
  }

  const clearSearch = container.querySelector('#clear-lab-search-btn');
  if (clearSearch) {
    clearSearch.addEventListener('click', () => {
      searchLabourQuery = '';
      renderLabours(container);
    });
  }

  // Filter pills
  container.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      selectedWageFilter = pill.dataset.wage;
      renderLabours(container);
    });
  });

  // Action buttons
  container.querySelectorAll('.btn-log-att').forEach(btn => {
    btn.addEventListener('click', () => {
      openLogAttendanceModal(btn.dataset.id);
    });
  });

  container.querySelectorAll('.btn-pay-wage').forEach(btn => {
    btn.addEventListener('click', () => {
      openLabourPayoutModal(btn.dataset.id);
    });
  });

  container.querySelectorAll('.btn-lab-details').forEach(btn => {
    btn.addEventListener('click', () => {
      openLabourDetailsModal(btn.dataset.id);
    });
  });
}

// Open Add Labour Modal
export function openAddLabourModal() {
  const container = document.getElementById('log-labour-modal-content');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-header">
      <div>
        <h3 class="modal-title">Add Worker / Contractor</h3>
        <p class="text-muted text-xs">Register labour with daily/weekly/monthly wage scheme</p>
      </div>
      <button class="modal-close-btn" onclick="document.getElementById('log-labour-modal').classList.remove('active')">×</button>
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
        <button type="button" class="btn btn-outline" onclick="document.getElementById('log-labour-modal').classList.remove('active')">Cancel</button>
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

    const labContainer = document.getElementById('labours-view-content');
    if (labContainer) renderLabours(labContainer);
  });

  openModal('log-labour-modal');
}

// Open Attendance Logger Modal
export function openLogAttendanceModal(prefillLabourId = null) {
  const container = document.getElementById('log-labour-modal-content');
  if (!container) return;

  const labours = store.getLabours();
  const projects = store.getProjects().filter(p => p.status === 'in_progress');

  if (labours.length === 0) {
    showToast('Please add workers first before marking attendance', 'error');
    openAddLabourModal();
    return;
  }

  container.innerHTML = `
    <div class="modal-header">
      <div>
        <h3 class="modal-title">Mark Worker Attendance</h3>
        <p class="text-muted text-xs">Log daily work presence and site allocation</p>
      </div>
      <button class="modal-close-btn" onclick="document.getElementById('log-labour-modal').classList.remove('active')">×</button>
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
          <label class="form-label">Attendance Date *</label>
          <input type="date" id="att-date" class="form-input" value="${getTodayDateString()}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Day Status *</label>
          <select id="att-status" class="form-select">
            <option value="full_day">Full Day (1.0 day)</option>
            <option value="half_day">Half Day (0.5 day)</option>
            <option value="overtime">Overtime (1.5 day)</option>
            <option value="absent">Absent (0.0 day)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Assigned Project / Site (Optional)</label>
        <select id="att-project-id" class="form-select">
          <option value="">-- General Site / Not Assigned --</option>
          ${projects.map(p => `<option value="${p.id}">${p.name} (${p.customerName || 'Site'})</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Work Description / Notes</label>
        <input type="text" id="att-notes" class="form-input" placeholder="e.g. 1st floor brick work, column casting" />
      </div>

      <div class="modal-footer-btns">
        <button type="button" class="btn btn-outline" onclick="document.getElementById('log-labour-modal').classList.remove('active')">Cancel</button>
        <button type="submit" class="btn btn-primary">Record Attendance</button>
      </div>
    </form>
  `;

  const form = container.querySelector('#form-log-attendance');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const labId = container.querySelector('#att-labour-id').value;
    const attDate = container.querySelector('#att-date').value;
    const status = container.querySelector('#att-status').value;
    const projId = container.querySelector('#att-project-id').value;
    const notes = container.querySelector('#att-notes').value.trim();

    store.logLabourAttendance(labId, {
      date: attDate,
      status: status,
      projectId: projId,
      notes: notes
    });

    closeModal('log-labour-modal');
    showToast('Attendance recorded!');

    const labContainer = document.getElementById('labours-view-content');
    if (labContainer) renderLabours(labContainer);
  });

  openModal('log-labour-modal');
}

// Open Labour Wage Payout Modal (Adds to Spends)
export function openLabourPayoutModal(prefillLabourId = null) {
  const container = document.getElementById('log-labour-modal-content');
  if (!container) return;

  const labours = store.getLabours();
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
      <button class="modal-close-btn" onclick="document.getElementById('log-labour-modal').classList.remove('active')">×</button>
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
          <label class="form-label">Date</label>
          <input type="date" id="payout-date" class="form-input" value="${getTodayDateString()}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <input type="text" id="payout-notes" class="form-input" placeholder="e.g. Paid in full for week #3" />
        </div>
      </div>

      <div class="modal-footer-btns">
        <button type="button" class="btn btn-outline" onclick="document.getElementById('log-labour-modal').classList.remove('active')">Cancel</button>
        <button type="submit" class="btn btn-danger">Record Spend & Deduct Balance</button>
      </div>
    </form>
  `;

  // Labour selector change updates balance preview
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
      notes: container.querySelector('#payout-notes').value.trim()
    });

    closeModal('log-labour-modal');
    showToast(`Paid ${formatCurrency(amount, currency)} to worker! Added to Spends.`);

    const labContainer = document.getElementById('labours-view-content');
    if (labContainer) renderLabours(labContainer);
  });

  openModal('log-labour-modal');
}

// Open Labour Details & Statement Drawer
export function openLabourDetailsModal(labourId) {
  const labour = store.getLabourById(labourId);
  if (!labour) return;

  const settings = store.getSettings();
  const currency = settings.currency || '₹';
  const fin = store.getLabourFinancials(labour);

  const container = document.getElementById('log-labour-modal-content');
  if (!container) return;

  const waSlip = `*${settings.companyName || 'BuilderMate'} - Wage Statement*\nWorker: *${labour.name}* (${labour.role})\nRate: *${currency}${labour.wageRate} / ${labour.wageType}*\n\n• Days Worked: *${labour.attendance ? labour.attendance.length : 0}*\n• Total Earned: *${currency} ${fin.totalEarned}*\n• Total Paid: *${currency} ${fin.totalPaid}*\n• *Remaining Balance Due: ${currency} ${fin.balanceDue}*\n\nThank you!`;

  container.innerHTML = `
    <div class="modal-header">
      <div>
        <h3 class="modal-title">${labour.name}</h3>
        <p class="text-muted text-xs">${labour.role} • ${currency}${labour.wageRate} / ${labour.wageType}</p>
      </div>
      <button class="modal-close-btn" onclick="document.getElementById('log-labour-modal').classList.remove('active')">×</button>
    </div>

    <div class="modal-body">
      <!-- Financial Highlights -->
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

      <!-- Quick Actions -->
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

      <!-- Attendance History -->
      <div class="drawer-section">
        <h4 class="drawer-section-title">📅 Attendance History (${labour.attendance ? labour.attendance.length : 0} logs)</h4>
        <div class="attendance-history-list">
          ${(!labour.attendance || labour.attendance.length === 0) ? `
            <div class="empty-table-msg">No attendance logged yet.</div>
          ` : labour.attendance.map(a => `
            <div class="att-row-item">
              <div>
                <strong>${formatDate(a.date)}</strong>
                <span class="status-tag status-att-${a.status}">${a.status.replace('_', ' ')}</span>
              </div>
              ${a.notes ? `<div class="text-muted text-xs">${a.notes}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Payouts History -->
      <div class="drawer-section">
        <h4 class="drawer-section-title">💸 Payouts History (${labour.payouts ? labour.payouts.length : 0} payments)</h4>
        <div class="payout-history-list">
          ${(!labour.payouts || labour.payouts.length === 0) ? `
            <div class="empty-table-msg">No payouts recorded yet.</div>
          ` : labour.payouts.map(p => `
            <div class="payment-row-item">
              <div class="pay-row-left">
                <div class="pay-date-badge">${formatDate(p.date)}</div>
                <div>
                  <strong class="spend-color">-${formatCurrency(p.amount, currency)}</strong>
                  <span class="pay-mode-pill">${p.type} (${p.mode})</span>
                </div>
                ${p.notes ? `<p class="pay-notes-text">${p.notes}</p>` : ''}
              </div>
              <div class="pay-row-right">
                <button class="btn-delete-item btn-del-lab-payout" data-payout-id="${p.id}" title="Delete Payout">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Delete Labour -->
      <div class="sheet-danger-footer">
        <button class="btn btn-danger btn-xs" id="btn-delete-labour">
          Delete Worker Record
        </button>
      </div>
    </div>
  `;

  // Attach modal events
  container.querySelector('#detail-mark-att')?.addEventListener('click', () => {
    openLogAttendanceModal(labour.id);
  });

  container.querySelector('#detail-pay-wage')?.addEventListener('click', () => {
    openLabourPayoutModal(labour.id);
  });

  container.querySelectorAll('.btn-del-lab-payout').forEach(btn => {
    btn.addEventListener('click', () => {
      const payoutId = btn.dataset.payoutId;
      if (confirm('Delete this payout record? Total spends will be reduced.')) {
        store.deleteLabourPayout(labour.id, payoutId);
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
      const labContainer = document.getElementById('labours-view-content');
      if (labContainer) renderLabours(labContainer);
    }
  });

  openModal('log-labour-modal');
}
