/**
 * BuilderMate - Dashboard View Component
 */

import { store } from '../store.js';
import { formatCurrency, formatDate, openModal } from '../utils.js';

export function renderDashboard(container) {
  const settings = store.getSettings();
  const currency = settings.currency || '₹';
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
    <!-- Top Greeting Header -->
    <div class="dashboard-header">
      <div class="company-brand-badge">
        <img src="icon.png" alt="BuilderMate Logo" class="brand-avatar" />
        <div class="brand-text">
          <h1 class="company-name-text">${companyTitle}</h1>
          <p class="contractor-greeting-text">${greetingSubtitle}</p>
        </div>
      </div>
      <button class="icon-btn" id="dash-settings-btn" title="Settings & Backup" aria-label="Settings">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </div>

    <!-- Main Financial Summary Cards -->
    <div class="metrics-grid">
      <!-- Income Card -->
      <div class="metric-card metric-income">
        <div class="metric-header">
          <span class="metric-label">Total Income</span>
          <div class="metric-icon-wrap income-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </div>
        </div>
        <div class="metric-value income-color">${formatCurrency(totalIncome, currency)}</div>
        <div class="metric-footer">Projects & Direct Sales</div>
      </div>

      <!-- Spends Card -->
      <div class="metric-card metric-spend">
        <div class="metric-header">
          <span class="metric-label">Total Spends</span>
          <div class="metric-icon-wrap spend-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </div>
        </div>
        <div class="metric-value spend-color">${formatCurrency(totalSpends, currency)}</div>
        <div class="metric-footer">Materials & Labour Payroll</div>
      </div>

      <!-- Net Profit Card -->
      <div class="metric-card metric-profit ${netProfit >= 0 ? 'profit-positive' : 'profit-negative'}">
        <div class="metric-header">
          <span class="metric-label">Net Cashflow</span>
          <span class="status-pill ${netProfit >= 0 ? 'pill-green' : 'pill-red'}">
            ${netProfit >= 0 ? 'Profit' : 'Deficit'}
          </span>
        </div>
        <div class="metric-value">${formatCurrency(netProfit, currency)}</div>
        <div class="metric-footer">Income minus Expenses</div>
      </div>

      <!-- Operations Snapshot -->
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

    <!-- Quick Action Bar -->
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

    <!-- Active Projects Quick Glance -->
    <div class="section-container">
      <div class="section-header-flex">
        <h2 class="section-title">Active Projects</h2>
        <button class="text-link-btn" id="view-all-projects-btn">View All →</button>
      </div>

      ${projects.length === 0 ? `
        <div class="empty-state-card">
          <div class="empty-icon">🏗️</div>
          <div class="empty-title">No Active Projects Yet</div>
          <p class="empty-desc">Create your first construction project to track materials sold and payments.</p>
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
                    <span class="stat-lbl">Est. Value</span>
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

    <!-- Recent Transactions & Operations Feed -->
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

  // Attach Dashboard Event Listeners
  attachDashboardEvents(container);
}

function attachDashboardEvents(container) {
  // Settings Button
  const settingsBtn = container.querySelector('#dash-settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      openModal('settings-modal');
    });
  }

  // Quick Actions
  const qaNewProj = container.querySelector('#qa-new-project');
  if (qaNewProj) {
    qaNewProj.addEventListener('click', () => {
      openModal('new-project-modal');
    });
  }

  const qaBuyMat = container.querySelector('#qa-buy-material');
  if (qaBuyMat) {
    qaBuyMat.addEventListener('click', () => {
      openModal('buy-inventory-modal');
    });
  }

  const qaDirectSale = container.querySelector('#qa-direct-sale');
  if (qaDirectSale) {
    qaDirectSale.addEventListener('click', () => {
      openModal('direct-sale-modal');
    });
  }

  const qaLogLabour = container.querySelector('#qa-log-labour');
  if (qaLogLabour) {
    qaLogLabour.addEventListener('click', () => {
      openModal('log-labour-modal');
    });
  }

  const emptyAddProjBtn = container.querySelector('#empty-add-proj-btn');
  if (emptyAddProjBtn) {
    emptyAddProjBtn.addEventListener('click', () => {
      openModal('new-project-modal');
    });
  }

  const viewAllProjectsBtn = container.querySelector('#view-all-projects-btn');
  if (viewAllProjectsBtn) {
    viewAllProjectsBtn.addEventListener('click', () => {
      const projectsTab = document.querySelector('[data-tab="projects"]');
      if (projectsTab) projectsTab.click();
    });
  }

  // Project mini card click
  container.querySelectorAll('.project-mini-card').forEach(card => {
    card.addEventListener('click', () => {
      const projId = card.dataset.projectId;
      window.dispatchEvent(new CustomEvent('view-project-details', { detail: { projectId: projId } }));
    });
  });
}
