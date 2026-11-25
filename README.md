# StockFlow - Minimal Multi-Tenant SaaS Inventory App (MVP)

A simple multi-tenant inventory management application built for internal usage, demos, and small sellers.

## Tech Stack
- **Backend:** Python FastAPI, SQLAlchemy ORM, Pydantic, Passlib (Bcrypt), Python-JOSE (JWT)
- **Frontend:** React (Vite), React Router, Axios, Lucide Icons
- **Database:** PostgreSQL (Neon, Supabase, RDS, or local PostgreSQL)

---

## Features
- **Multi-Tenant Scoping:** Automatic organization creation upon sign-up. Each product, stock item, and setting is strictly isolated per organization.
- **Authentication:** JWT-based signup and login with hashed passwords.
- **Product Management:**
  - Create / View / Edit / Delete products.
  - SKU uniqueness enforced per tenant organization.
  - Low-stock threshold per product with fallback to organization default.
- **Quick Stock Adjustments:**
  - Inline adjustment modal (+/- units with optional note).
  - Last updated by user tracker.
- **Dashboard Overview:**
  - Summary metrics: Total products, Total units on hand, Low stock count.
  - Dedicated Low Stock list with indicator badges.
- **Organization Settings:**
  - Global Default Low Stock Threshold configuration.

---

## Environment Variables

### Backend (`backend/.env`)
```ini
PROJECT_NAME="StockFlow Minimal SaaS"
API_V1_STR="/api/v1"

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stockflow_db

# Security & JWT Token
SECRET_KEY=supersecretjwtkey_stockflow_minimum_change_me_in_prod
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Frontend origins allowed for CORS
BACKEND_CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173", "https://your-frontend-domain.vercel.app"]
```

### Frontend (`frontend/.env`)
```ini
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

> **Note:** `.env` files are ignored by git (`.gitignore` configured). Update credentials in your local `.env` files.

---

## Local Development (Without Docker)

### 1. Database Setup
Create a PostgreSQL database named `stockflow_db` locally or via a free managed cloud PostgreSQL provider (e.g., [Neon.tech](https://neon.tech), [Supabase](https://supabase.com)).

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux/macOS
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- On startup, the backend adds the stock-adjustment note column to existing product tables when needed.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Frontend UI: `http://localhost:5173`

---

## Production Deployment (Without Docker)

### Option A: Free Cloud Services (Render / Railway + Vercel / Netlify)
1. **Database:** Create a free database on **Neon** (`neon.tech`) or **Supabase** and copy the PostgreSQL connection URL.
2. **Backend (Render / Railway):**
   - Connect your GitHub repo to **Render** as a "Web Service".
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Set Environment Variables: `DATABASE_URL`, `SECRET_KEY`, `BACKEND_CORS_ORIGINS`.
3. **Frontend (Vercel / Netlify):**
   - Connect your GitHub repo to **Vercel**.
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Set Environment Variable: `VITE_API_BASE_URL` pointing to your deployed backend URL (e.g. `https://stockflow-backend.onrender.com/api/v1`).

### Option B: Traditional Linux VPS (Ubuntu / Debian / EC2 / DigitalOcean)
See complete step-by-step guide in the project documentation.
