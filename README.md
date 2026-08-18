# 🏗️ BuilderMate - Construction & Contractor Management PWA

**BuilderMate** is a modern, mobile-first Progressive Web Application (PWA) designed for civil contractors, builders, and material suppliers to track **Inventory, Spends, Income, Labours, Projects, and Direct Counter Sales** directly on their mobile phones and desktops.

---

## 🌟 Key Features

- **📱 Offline-First PWA**: Installable to Home Screen ("Add to Home Screen") on Android and iOS with Service Worker caching.
- **🏗️ Projects Hub**: Track site locations, customer contact numbers with direct 1-tap **WhatsApp** and **Phone Calls**, material logs, and payment milestones.
- **📦 Stock & Inventory (Spends)**: Track material stock levels (Bricks, Steel, Cement, Aggregates, Sand, Paint, etc.), supplier bills, and purchase spend metrics.
- **🛒 Direct Sales (Income)**: Counter & retail sales of construction materials with instant WhatsApp receipt generation.
- **👷 Labour Attendance & Payroll (Spends)**: Daily, weekly, and monthly wage management, daily attendance logging, wage payout statements, and balance due tracking.
- **📊 Real-Time Financial Dashboard**: Instant calculation of Total Income, Total Spends, Net Profit / Cashflow, and Stock Asset Valuation.
- **🌙 Architectural Dark Theme**: Clean toggle between deep slate dark theme and light theme.
- **☁️ Google Drive Continuous Cloud Backup**: Automatic, silent background sync to each user's private Google Drive storage for multi-device restore.
- **💾 Manual JSON Backup**: 1-click download and restore of entire business database.

---

## 🚀 Hosting on GitHub Pages

1. In your GitHub repository, go to **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, select **Deploy from a branch**.
3. Choose branch **`main`** and folder **`/ (root)`**, then click **Save**.
4. Your PWA will be live at: `https://<your-username>.github.io/BuildersMate/`

---

## ☁️ Enabling Google Drive Cloud Sync

BuilderMate uses Google Identity Services (GIS) and Google Drive API.
In [Google Cloud Console](https://console.cloud.google.com/):
1. Enable the **Google Drive API**.
2. In **OAuth Consent Screen**, set user type to **External** and add test users.
3. In **Credentials**, under your OAuth 2.0 Client ID, add your GitHub Pages URL to **Authorized JavaScript origins**:
   - `https://cloudkalakaar.github.io`
4. Connect Google Drive in **Settings (⚙️)** inside BuilderMate!

---

## 🛠️ Tech Stack

- **HTML5 / CSS3 / Vanilla JavaScript** (Zero external runtime dependencies, 100% client-side)
- **Service Worker & Web App Manifest** for PWA functionality
- **Google Identity Services (GIS) & Google Drive REST API v3** for cloud auto-sync
- **Design System**: Plus Jakarta Sans & JetBrains Mono typography with custom CSS tokens

---

## 📄 License
MIT License
