# Bhatura & Co (Chhole Bhature & More) — Project Overview

Dedicated multi-tenant/single-restaurant platform setup for **Bhatura & Co** located in Edison, New Jersey.

---

## 🏢 Brand & Restaurant Details
- **Restaurant Name:** Bhatura & Co
- **Tagline:** Chhole Bhature & More
- **Location:** 100 Route 27, Edison, NJ 08820
- **Coordinates:** `[-74.3807, 40.5401]`
- **Slug / Restaurant ID:** `bhatura-and-co`
- **Brand Colors:**
  - Royal Maroon: `#5C0612` (Base brand)
  - Vintage Gold: `#D4AF37` (Emblem & Accents)
  - Warm Ivory Cream: `#FDFBF7` (Surfaces & Backgrounds)
  - Charcoal: `#1C1917` (Typography)

---

## 📁 Directory Structure
```
E:\Projects\bhatura-and-co\
├── assets\
│   └── logos\
│       ├── Bhatura & Co Logo.png
│       └── Bhatura & Co Restaurant Emblem.png
├── backend\
│   ├── .env                       # Dedicated DB URI & Port 5002
│   ├── scripts\
│   │   └── seed_bhatura.js        # Seed script for initial DB setup
│   ├── server.new.js              # Express + Socket.IO server
│   └── package.json
└── frontend\
    ├── .env.local                 # Port 3002, Backend URL: http://localhost:5002
    ├── next.config.js             # API Proxy rewrite to :5002
    ├── public\
    │   └── assets\images\branded\bhatura-and-co\
    │       ├── logo-full.png
    │       └── logo-emblem.png
    ├── src\
    │   ├── app\layout.js         # Configured with data-brand="bhatura-and-co"
    │   ├── app\page.js           # Brand landing / setup showcase page
    │   ├── app\globals.css       # Tailwind + Design Tokens
    │   └── styles\brand\bhatura-and-co.css
    └── package.json
```

---

## ⚙️ Ports & Configuration

| Service | Local Port | Database Name | Status |
| :--- | :--- | :--- | :--- |
| **Backend API** | `5002` | `daas_poc_bhatura_and_co` | Configured & Seeded |
| **Frontend Web** | `3002` | N/A (Consumes :5002) | Built & Verified |

### Default Admin Login (Seeded in `daas_poc_bhatura_and_co`)
- **Email:** `admin@bhaturaco.com`
- **Password:** `Bhatura@12345`
- **Role:** `superadmin` / `admin`

---

## 🚀 How to Run Locally

### 1. Run Backend
```bash
cd E:\Projects\bhatura-and-co\backend
npm run dev
# Starts on http://localhost:5002
```

### 2. Run Frontend
```bash
cd E:\Projects\bhatura-and-co\frontend
npm run dev
# Starts on http://localhost:3002
```
