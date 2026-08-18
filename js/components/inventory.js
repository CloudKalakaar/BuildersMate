/**
 * BuilderMate - Inventory & Materials Spends Component
 */

import { store } from '../store.js';
import { 
  formatCurrency, 
  formatNumber, 
  formatDate, 
  getTodayDateString, 
  openModal, 
  closeModal, 
  showToast,
  PRESET_MATERIALS 
} from '../utils.js';

let selectedCategory = 'all';
let searchInvQuery = '';

export function renderInventory(container) {
  const settings = store.getSettings();
  const currency = settings.currency || '₹';
  const inventory = store.getInventory();

  // Calculate totals
  const totalStockValuation = store.getTotalInventoryValuation();
  let totalPurchasesSpend = 0;
  inventory.forEach(item => {
    (item.purchases || []).forEach(p => {
      totalPurchasesSpend += Number(p.totalCost) || 0;
    });
  });

  const lowStockCount = inventory.filter(i => i.currentStock <= (i.minStockThreshold || 0)).length;

  // Filter inventory items
  let filteredItems = inventory.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchInvQuery) {
      const q = searchInvQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const categories = ['all', ...new Set(inventory.map(i => i.category).filter(Boolean))];

  container.innerHTML = `
    <!-- Top Action Bar -->
    <div class="page-top-bar">
      <div>
        <h1 class="page-main-title">Inventory & Stock</h1>
        <p class="page-sub-title">Track materials bought, stock levels & purchase spends</p>
      </div>
      <button class="btn btn-primary" id="btn-buy-material-stock">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Buy Stock (Spend)</span>
      </button>
    </div>

    <!-- Inventory Overview Cards -->
    <div class="inventory-overview-grid">
      <div class="inv-kpi-card">
        <span class="kpi-lbl">Total Stock Valuation</span>
        <strong class="kpi-val income-color">${formatCurrency(totalStockValuation, currency)}</strong>
        <span class="kpi-sub">Current Asset Value</span>
      </div>
      <div class="inv-kpi-card">
        <span class="kpi-lbl">Material Purchases (Spend)</span>
        <strong class="kpi-val spend-color">${formatCurrency(totalPurchasesSpend, currency)}</strong>
        <span class="kpi-sub">Total Spent on Materials</span>
      </div>
      <div class="inv-kpi-card">
        <span class="kpi-lbl">Stock Items</span>
        <strong class="kpi-val">${inventory.length} Items</strong>
        <span class="kpi-sub ${lowStockCount > 0 ? 'text-amber font-bold' : ''}">
          ${lowStockCount > 0 ? `⚠️ ${lowStockCount} Low on Stock` : 'All Stock Healthy'}
        </span>
      </div>
    </div>

    <!-- Search & Category Filters -->
    <div class="search-filter-row">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input 
          type="text" 
          id="inv-search-input" 
          placeholder="Search materials (e.g. Bricks, Cement, Steel)..." 
          value="${searchInvQuery}"
        />
        ${searchInvQuery ? `<button id="clear-inv-search-btn" class="clear-search">×</button>` : ''}
      </div>

      <div class="filter-pills-row">
        ${categories.map(cat => `
          <button class="filter-pill ${selectedCategory === cat ? 'active' : ''}" data-cat="${cat}">
            ${cat === 'all' ? 'All Materials' : cat}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Inventory Cards Grid -->
    ${filteredItems.length === 0 ? `
      <div class="empty-state-card">
        <div class="empty-icon">📦</div>
        <div class="empty-title">No Materials Found</div>
        <p class="empty-desc">Record purchases of Bricks, Steel, Cement, Aggregates, Paint to build your stock.</p>
        <button class="btn btn-primary btn-sm" id="empty-buy-stock-btn">+ Add Stock Item</button>
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
                  <span class="text-muted text-xs">Purchases Logged:</span>
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

  attachInventoryEvents(container);
}

function attachInventoryEvents(container) {
  // Buy Stock Button
  const btnBuy = container.querySelector('#btn-buy-material-stock');
  if (btnBuy) {
    btnBuy.addEventListener('click', () => openBuyStockModal());
  }

  const emptyBuyBtn = container.querySelector('#empty-buy-stock-btn');
  if (emptyBuyBtn) {
    emptyBuyBtn.addEventListener('click', () => openBuyStockModal());
  }

  // Search input
  const searchInput = container.querySelector('#inv-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchInvQuery = e.target.value;
      renderInventory(container);
    });
  }

  const clearSearch = container.querySelector('#clear-inv-search-btn');
  if (clearSearch) {
    clearSearch.addEventListener('click', () => {
      searchInvQuery = '';
      renderInventory(container);
    });
  }

  // Category filter pills
  container.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      selectedCategory = pill.dataset.cat;
      renderInventory(container);
    });
  });

  // Quick Buy on item card
  container.querySelectorAll('.btn-quick-buy').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.id;
      const itemName = btn.dataset.name;
      const itemUnit = btn.dataset.unit;
      const itemPrice = btn.dataset.price;
      openBuyStockModal(itemId, itemName, itemUnit, itemPrice);
    });
  });

  // View purchase history
  container.querySelectorAll('.btn-view-inv-history').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.id;
      openInventoryHistoryModal(itemId);
    });
  });
}

// Open Buy Stock Modal (Records Purchase Spend)
export function openBuyStockModal(itemId = null, prefillName = '', prefillUnit = 'Numbers', prefillPrice = '') {
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
      <button class="modal-close-btn" onclick="document.getElementById('buy-inventory-modal').classList.remove('active')">×</button>
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
        <button type="button" class="btn btn-outline" onclick="document.getElementById('buy-inventory-modal').classList.remove('active')">Cancel</button>
        <button type="submit" class="btn btn-danger">Record Spend & Add Stock</button>
      </div>
    </form>
  `;

  // Auto calculate total cost
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

  // Chips click
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

  // Form submit
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
    showToast(`Purchased ${formatNumber(qty)} ${unitSelect.value} of ${matName}. Added ${formatCurrency(totalCost, store.getSettings().currency)} to Spends!`);
    
    // Re-render inventory page if currently active
    const invContainer = document.getElementById('inventory-view-content');
    if (invContainer) renderInventory(invContainer);
  });

  openModal('buy-inventory-modal');
}

// Open Purchase History Modal for a material
export function openInventoryHistoryModal(itemId) {
  const item = store.getInventoryItemById(itemId);
  if (!item) return;

  const currency = store.getSettings().currency || '₹';
  const container = document.getElementById('inventory-history-modal-content');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-header">
      <div>
        <h3 class="modal-title">${item.name} - Purchases History</h3>
        <p class="text-muted text-xs">Current Stock: ${formatNumber(item.currentStock)} ${item.unit}</p>
      </div>
      <button class="modal-close-btn" onclick="document.getElementById('inventory-history-modal').classList.remove('active')">×</button>
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
      <button class="btn btn-primary btn-sm" id="modal-pur-buy-more">+ Record New Purchase</button>
      <button class="btn btn-outline btn-sm" onclick="document.getElementById('inventory-history-modal').classList.remove('active')">Close</button>
    </div>
  `;

  const buyMoreBtn = container.querySelector('#modal-pur-buy-more');
  if (buyMoreBtn) {
    buyMoreBtn.addEventListener('click', () => {
      closeModal('inventory-history-modal');
      openBuyStockModal(item.id, item.name, item.unit, item.avgPurchasePrice);
    });
  }

  openModal('inventory-history-modal');
}
