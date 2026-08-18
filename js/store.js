/**
 * BuilderMate - Central Reactive State Management & LocalStorage Persistence
 */

import { generateId, getTodayDateString } from './utils.js';

const STORAGE_KEY = 'buildermate_data_v1';

// Default initial state
const DEFAULT_STATE = {
  settings: {
    companyName: '',
    contractorName: '',
    phone: '',
    currency: '₹',
    address: '',
    isOnboarded: false,
    theme: 'light'
  },
  projects: [],
  inventory: [
    {
      id: 'inv_bricks',
      name: 'Red Bricks',
      category: 'Masonry',
      unit: 'Numbers',
      currentStock: 12500,
      minStockThreshold: 2000,
      avgPurchasePrice: 8.5,
      purchases: [
        {
          id: 'pur_1',
          date: '2026-08-01',
          quantity: 15000,
          unitPrice: 8.5,
          totalCost: 127500,
          supplier: 'City Brick Kiln',
          notes: 'Standard red clay bricks'
        }
      ]
    },
    {
      id: 'inv_cement',
      name: 'UltraTech Cement (53 Grade)',
      category: 'Cement',
      unit: 'Bags',
      currentStock: 180,
      minStockThreshold: 50,
      avgPurchasePrice: 380,
      purchases: [
        {
          id: 'pur_2',
          date: '2026-08-05',
          quantity: 250,
          unitPrice: 380,
          totalCost: 95000,
          supplier: 'National Building Suppliers',
          notes: 'Fresh OPC 53 grade stock'
        }
      ]
    },
    {
      id: 'inv_steel',
      name: 'TMT Steel Rebars (12mm & 16mm)',
      category: 'Steel',
      unit: 'Kg',
      currentStock: 4200,
      minStockThreshold: 1000,
      avgPurchasePrice: 68,
      purchases: [
        {
          id: 'pur_3',
          date: '2026-08-08',
          quantity: 5000,
          unitPrice: 68,
          totalCost: 340000,
          supplier: 'Tata Tiscon Dealer',
          notes: 'Fe550D grade steel'
        }
      ]
    },
    {
      id: 'inv_aggregates',
      name: 'Blue Metal Aggregates (20mm)',
      category: 'Aggregates',
      unit: 'Ton',
      currentStock: 35,
      minStockThreshold: 10,
      avgPurchasePrice: 1200,
      purchases: [
        {
          id: 'pur_4',
          date: '2026-08-10',
          quantity: 45,
          unitPrice: 1200,
          totalCost: 54000,
          supplier: 'Hilltop Stone Crushers',
          notes: 'Washed 20mm aggregates'
        }
      ]
    },
    {
      id: 'inv_paint',
      name: 'Asian Paints Apex Exterior',
      category: 'Paint',
      unit: 'Tins',
      currentStock: 18,
      minStockThreshold: 5,
      avgPurchasePrice: 3400,
      purchases: [
        {
          id: 'pur_5',
          date: '2026-08-12',
          quantity: 20,
          unitPrice: 3400,
          totalCost: 68000,
          supplier: 'Rainbow Color Center',
          notes: '20 Litre Tins'
        }
      ]
    }
  ],
  directSales: [],
  labours: [
    {
      id: 'lab_1',
      name: 'Ramesh Kumar (Mistri)',
      role: 'Head Mason (Mistri)',
      phone: '+919876543210',
      wageType: 'daily',
      wageRate: 900,
      attendance: [
        { id: 'att_1', date: '2026-08-14', status: 'full_day', notes: 'Foundation work' },
        { id: 'att_2', date: '2026-08-15', status: 'full_day', notes: 'Brick laying' },
        { id: 'att_3', date: '2026-08-16', status: 'full_day', notes: 'Pillar casting' }
      ],
      payouts: [
        { id: 'pay_1', date: '2026-08-16', amount: 2000, type: 'Advance', mode: 'Cash', notes: 'Weekly advance' }
      ]
    },
    {
      id: 'lab_2',
      name: 'Sunil Paswan',
      role: 'Helper / Labour',
      phone: '+919876543211',
      wageType: 'daily',
      wageRate: 550,
      attendance: [
        { id: 'att_4', date: '2026-08-14', status: 'full_day', notes: 'Material shifting' },
        { id: 'att_5', date: '2026-08-15', status: 'full_day', notes: 'Cement mixing' }
      ],
      payouts: [
        { id: 'pay_2', date: '2026-08-15', amount: 1000, type: 'Daily Wage', mode: 'UPI / GPay', notes: 'Direct UPI' }
      ]
    }
  ]
};

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
        return {
          settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          inventory: Array.isArray(parsed.inventory) ? parsed.inventory : DEFAULT_STATE.inventory,
          directSales: Array.isArray(parsed.directSales) ? parsed.directSales : [],
          labours: Array.isArray(parsed.labours) ? parsed.labours : DEFAULT_STATE.labours
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

  // --- Settings ---
  getSettings() {
    return this.data.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.saveToStorage();
  }

  // --- Projects ---
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
      status: projectData.status || 'in_progress', // 'in_progress', 'completed', 'on_hold'
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

  // Project Materials
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

    // If matching item in inventory exists, reduce inventory stock
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

  // Project Payments (Income)
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

  // --- Inventory & Purchases (Spends) ---
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
      // Find by name or create new
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
    
    // Recalculate average purchase price
    const totalPurchasedCost = item.purchases.reduce((sum, p) => sum + p.totalCost, 0);
    const totalPurchasedQty = item.purchases.reduce((sum, p) => sum + p.quantity, 0);
    if (totalPurchasedQty > 0) {
      item.avgPurchasePrice = totalPurchasedCost / totalPurchasedQty;
    }

    this.saveToStorage();
    return purchase;
  }

  updateInventoryItem(id, fields) {
    const item = this.getInventoryItemById(id);
    if (item) {
      Object.assign(item, fields);
      this.saveToStorage();
    }
  }

  deleteInventoryItem(id) {
    this.data.inventory = this.data.inventory.filter(i => i.id !== id);
    this.saveToStorage();
  }

  // --- Direct Sales (Outside Projects - Adds to Income) ---
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

    // Deduct items from inventory if available
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

  // --- Labours & Workers (Adds to Spends) ---
  getLabours() {
    return this.data.labours;
  }

  getLabourById(id) {
    return this.data.labours.find(l => l.id === id);
  }

  addLabour(labourData) {
    const newLabour = {
      id: generateId('lab'),
      name: labourData.name,
      role: labourData.role || 'Worker',
      phone: labourData.phone || '',
      wageType: labourData.wageType || 'daily', // 'daily', 'weekly', 'monthly', 'contract'
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

  updateLabour(id, fields) {
    const labour = this.getLabourById(id);
    if (labour) {
      Object.assign(labour, fields);
      this.saveToStorage();
    }
  }

  deleteLabour(id) {
    this.data.labours = this.data.labours.filter(l => l.id !== id);
    this.saveToStorage();
  }

  // Labour Attendance
  logLabourAttendance(labourId, attendanceData) {
    const labour = this.getLabourById(labourId);
    if (!labour) return null;

    const entry = {
      id: generateId('att'),
      date: attendanceData.date || getTodayDateString(),
      status: attendanceData.status || 'full_day', // 'full_day', 'half_day', 'overtime', 'absent'
      projectId: attendanceData.projectId || '',
      notes: attendanceData.notes || ''
    };

    // Remove any existing attendance for same date to prevent duplicates
    labour.attendance = labour.attendance.filter(a => a.date !== entry.date);
    labour.attendance.unshift(entry);
    this.saveToStorage();
    return entry;
  }

  // Labour Payouts (Spends)
  addLabourPayout(labourId, payoutData) {
    const labour = this.getLabourById(labourId);
    if (!labour) return null;

    const payout = {
      id: generateId('pay'),
      date: payoutData.date || getTodayDateString(),
      amount: Number(payoutData.amount) || 0,
      type: payoutData.type || 'Daily Wage', // 'Daily Wage', 'Weekly Salary', 'Monthly Salary', 'Advance', 'Bonus'
      mode: payoutData.mode || 'Cash',
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

  // --- Financial & Analytics Aggregations ---
  
  // Total Income = All Project Payments Collected + All Direct Sales Paid
  getTotalIncome() {
    let total = 0;
    // From projects
    this.data.projects.forEach(p => {
      (p.payments || []).forEach(pay => {
        total += Number(pay.amount) || 0;
      });
    });
    // From direct sales
    this.data.directSales.forEach(s => {
      total += Number(s.amountPaid) || 0;
    });
    return total;
  }

  // Total Spends = All Inventory Purchases + Labour Payouts + Project Misc Expenses
  getTotalSpends() {
    let total = 0;
    // From inventory purchases
    this.data.inventory.forEach(inv => {
      (inv.purchases || []).forEach(pur => {
        total += Number(pur.totalCost) || 0;
      });
    });
    // From labour payouts
    this.data.labours.forEach(lab => {
      (lab.payouts || []).forEach(p => {
        total += Number(p.amount) || 0;
      });
    });
    // From project misc expenses
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

  // Labour dues calculation
  getLabourFinancials(labour) {
    let totalEarned = 0;
    
    if (labour.wageType === 'daily') {
      labour.attendance.forEach(att => {
        if (att.status === 'full_day') totalEarned += labour.wageRate;
        else if (att.status === 'half_day') totalEarned += (labour.wageRate * 0.5);
        else if (att.status === 'overtime') totalEarned += (labour.wageRate * 1.5);
      });
    } else if (labour.wageType === 'weekly' || labour.wageType === 'monthly') {
      // Base estimated or recorded calculation
      totalEarned = labour.attendance.reduce((sum, att) => {
        if (att.status === 'full_day') return sum + (labour.wageRate / (labour.wageType === 'weekly' ? 6 : 26));
        if (att.status === 'half_day') return sum + ((labour.wageRate / (labour.wageType === 'weekly' ? 6 : 26)) * 0.5);
        return sum;
      }, 0);
    } else {
      totalEarned = labour.wageRate || 0;
    }

    const totalPaid = (labour.payouts || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const balanceDue = Math.max(0, Math.round(totalEarned - totalPaid));

    return {
      totalEarned: Math.round(totalEarned),
      totalPaid,
      balanceDue
    };
  }

  // Project Financials
  getProjectFinancials(project) {
    const materialsTotal = (project.materials || []).reduce((sum, m) => sum + (Number(m.total) || 0), 0);
    const expensesTotal = (project.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalCollected = (project.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    // Project Value is either the higher of estimated budget or materials+expenses total
    const estimatedValue = Number(project.estimatedBudget) > 0 ? Number(project.estimatedBudget) : materialsTotal;
    const pendingBalance = Math.max(0, estimatedValue - totalCollected);

    return {
      materialsTotal,
      expensesTotal,
      totalCost: materialsTotal + expensesTotal,
      totalCollected,
      estimatedValue,
      pendingBalance
    };
  }

  // Unified recent activities timeline
  getRecentActivities(limit = 10) {
    const activities = [];

    // Project Payments (Income)
    this.data.projects.forEach(p => {
      (p.payments || []).forEach(pay => {
        activities.push({
          id: pay.id,
          type: 'income',
          category: 'Project Payment',
          title: `Payment from ${p.customerName || p.name}`,
          subtitle: `Project: ${p.name}`,
          amount: pay.amount,
          date: pay.date,
          mode: pay.mode
        });
      });
    });

    // Direct Sales (Income)
    this.data.directSales.forEach(sale => {
      activities.push({
        id: sale.id,
        type: 'income',
        category: 'Direct Sale',
        title: `Direct Sale - ${sale.customerName}`,
        subtitle: `${sale.items.length} item(s) sold`,
        amount: sale.amountPaid,
        date: sale.date,
        mode: sale.paymentMode
      });
    });

    // Inventory Purchases (Spend)
    this.data.inventory.forEach(inv => {
      (inv.purchases || []).forEach(pur => {
        activities.push({
          id: pur.id,
          type: 'spend',
          category: 'Material Purchase',
          title: `Bought ${inv.name}`,
          subtitle: `${pur.quantity} ${inv.unit} from ${pur.supplier}`,
          amount: pur.totalCost,
          date: pur.date,
          mode: 'Purchase'
        });
      });
    });

    // Labour Payouts (Spend)
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

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    return activities.slice(0, limit);
  }

  // Full Database Export & Import
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

export const store = new Store();
