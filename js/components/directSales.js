/**
 * BuilderMate - Direct Sales Component (Selling outside projects - Adds to Income)
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

let directSaleItemsTemp = [];

export function renderDirectSales(container) {
  const settings = store.getSettings();
  const currency = settings.currency || '₹';
  const sales = store.getDirectSales();

  const totalDirectSalesIncome = sales.reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0);
  const totalItemsSold = sales.reduce((sum, s) => sum + (s.items ? s.items.length : 0), 0);

  container.innerHTML = `
    <!-- Top Action Bar -->
    <div class="page-top-bar">
      <div>
        <h1 class="page-main-title">Direct Sales</h1>
        <p class="page-sub-title">Retail & counter sales of materials outside projects (Adds to Income)</p>
      </div>
      <button class="btn btn-primary" id="btn-new-direct-sale">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>+ New Direct Sale</span>
      </button>
    </div>

    <!-- Direct Sales Financial Highlights -->
    <div class="sales-overview-grid">
      <div class="sales-kpi-card">
        <span class="kpi-lbl">Direct Sales Income</span>
        <strong class="kpi-val income-color">${formatCurrency(totalDirectSalesIncome, currency)}</strong>
        <span class="kpi-sub">Added to Total Income</span>
      </div>
      <div class="sales-kpi-card">
        <span class="kpi-lbl">Total Sales Logged</span>
        <strong class="kpi-val">${sales.length} Orders</strong>
        <span class="kpi-sub">${totalItemsSold} material line items</span>
      </div>
    </div>

    <!-- Sales List -->
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
          const waReceipt = `*${settings.companyName || 'BuilderMate'} - Sales Receipt*\nDate: ${formatDate(sale.date)}\nCustomer: ${sale.customerName || 'Customer'}\n\n*Items Purchased:*\n${sale.items.map(i => `• ${i.name}: ${i.quantity} ${i.unit} @ ${currency}${i.rate} = ${currency}${i.total}`).join('\n')}\n\n*Total Amount:* ${currency} ${sale.totalAmount}\n*Amount Paid:* ${currency} ${sale.amountPaid} (${sale.paymentMode})\n\nThank you for your business!`;

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

              <!-- Items Sold Table -->
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
                  📤 Share WhatsApp Receipt
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

  attachDirectSalesEvents(container);
}

function attachDirectSalesEvents(container) {
  const btnNewSale = container.querySelector('#btn-new-direct-sale');
  if (btnNewSale) {
    btnNewSale.addEventListener('click', () => openNewDirectSaleModal());
  }

  const emptyBtn = container.querySelector('#empty-direct-sale-btn');
  if (emptyBtn) {
    emptyBtn.addEventListener('click', () => openNewDirectSaleModal());
  }

  // Delete sale
  container.querySelectorAll('.btn-delete-sale').forEach(btn => {
    btn.addEventListener('click', () => {
      const saleId = btn.dataset.id;
      if (confirm('Delete this direct sale record? Total income will be reduced.')) {
        store.deleteDirectSale(saleId);
        showToast('Sale record removed', 'info');
        renderDirectSales(container);
      }
    });
  });
}

// Open New Direct Sale Modal
export function openNewDirectSaleModal() {
  const container = document.getElementById('direct-sale-modal-content');
  if (!container) return;

  const inventory = store.getInventory();
  const currency = store.getSettings().currency || '₹';

  // Initialize with 1 empty item
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
        <button class="modal-close-btn" onclick="document.getElementById('direct-sale-modal').classList.remove('active')">×</button>
      </div>

      <form id="form-new-direct-sale" class="modal-form">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Buyer / Customer Name</label>
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

        <!-- Payment Info -->
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
            <input type="text" id="sale-notes" class="form-input" placeholder="e.g. Counter retail bill, paid in full" />
          </div>
        </div>

        <div class="modal-footer-btns">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('direct-sale-modal').classList.remove('active')">Cancel</button>
          <button type="submit" class="btn btn-primary">Complete Sale & Add Income</button>
        </div>
      </form>
    `;

    attachModalFormEvents();
  }

  function attachModalFormEvents() {
    // Add item row
    const btnAddRow = container.querySelector('#btn-add-sale-row');
    if (btnAddRow) {
      btnAddRow.addEventListener('click', () => {
        directSaleItemsTemp.push({ name: '', quantity: 1, unit: 'Numbers', rate: 0, total: 0 });
        renderModalBody();
      });
    }

    // Delete item row
    container.querySelectorAll('.btn-del-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        directSaleItemsTemp.splice(idx, 1);
        renderModalBody();
      });
    });

    // Row input changes
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
            // Suggest 15% markup over purchase price for direct sales
            rateInp.value = Math.round(inv.avgPurchasePrice * 1.15);
            updateRowData();
          }
        }
      });
    });

    // Amount paid manual edit
    const amountPaidInput = container.querySelector('#sale-amount-paid');
    if (amountPaidInput) {
      amountPaidInput.addEventListener('input', () => {
        amountPaidInput.dataset.manuallyEdited = 'true';
      });
    }

    // Form submit
    const form = container.querySelector('#form-new-direct-sale');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const validItems = directSaleItemsTemp.filter(i => i.name && i.quantity > 0);
      if (validItems.length === 0) {
        showToast('Please add at least one material item with quantity', 'error');
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

      // Re-render if direct sales tab is active
      const directSalesContainer = document.getElementById('direct-sales-view-content');
      if (directSalesContainer) renderDirectSales(directSalesContainer);
    });
  }

  renderModalBody();
  openModal('direct-sale-modal');
}
