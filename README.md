# 🚀 AstuteIQ – AI-Powered Compliance Review System

AstuteIQ is a modern full-stack web application designed to automate and streamline compliance review workflows. It enables users to upload and analyze financial advice documents (SOAs), generate risk insights, and track review history — all powered by AI.

---

## ✨ Features

### 🔐 Authentication

* Email/password login & registration
* Google OAuth (via Supabase)
* Secure token-based authentication
* Role-based access control (Admin / User)

### 📊 Dashboard

* Real-time KPI metrics
* Review statistics (pass rate, failures, etc.)
* Role-based dashboards:

  * **User** → personal activity
  * **Admin** → system-wide analytics

### 🧠 AI Review Engine

* Upload SOA documents
* Automated compliance checks
* Risk scoring (LOW / MEDIUM / HIGH)
* Actionable insights & summaries

### 📁 Review Management

* Review history tracking
* Detailed results page
* Download / analyze past reports

### 🎨 Modern UI

* Built with TailwindCSS + Framer Motion
* Smooth animations & transitions
* Responsive and clean dark UI

---

## 🏗️ Tech Stack

### Frontend

* React + TypeScript
* Vite
* TailwindCSS
* Framer Motion
* Zustand (state management)
* Axios

### Backend

* FastAPI (Python)
* PostgreSQL
* SQLAlchemy ORM
* JWT Authentication

### Auth & Services

* Supabase (OAuth + user handling)

---

## 📁 Project Structure

```
src/
│
├── api/              # API calls
├── components/       # UI components
├── hooks/            # Zustand stores
├── layout/           # App layout
├── pages/            # Screens
├── services/         # Business logic
├── lib/              # API config
└── types/            # Type definitions
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/astuteiq.git
cd astuteiq
```

---

### 2. Install frontend dependencies

```bash
npm install
```

---

### 3. Setup environment variables

Create `.env` file:

```
VITE_API_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_key
```

---

### 4. Run frontend

```bash
npm run dev
```

---

### 5. Run backend (FastAPI)

```bash
cd backend
uvicorn app.main:app --reload
```

---

## 🔐 Role-Based Access

| Role  | Access                         |
| ----- | ------------------------------ |
| User  | Dashboard, Run Review, History |
| Admin | Admin Dashboard, All Reviews   |

---

## 🔄 API Endpoints

### Auth

* `POST /auth/register`
* `POST /auth/login`

### Reviews

* `POST /reviews/run`
* `GET /reviews/history`

### Dashboard

* `GET /dashboard/stats`

---

## 🎯 Roadmap

* [ ] JWT refresh tokens
* [ ] Email verification
* [ ] Real-time dashboard (WebSockets)
* [ ] Advanced analytics charts
* [ ] File storage (S3 / Supabase Storage)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a new branch
3. Commit changes
4. Submit a PR

---

## 📄 License

MIT License

---

## 💡 Author

Built with ❤️ by **AstuteIQ IT Team**

---
