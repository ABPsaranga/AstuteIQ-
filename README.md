# AstuteIQ — AI-Powered SOA Compliance Review Platform

AstuteIQ is a SaaS platform for Australian financial planning practices. It uses Claude AI to review Statements of Advice (SOAs) against regulatory frameworks including RG175, personalisation checks (P1–P10), and compliance controls (C1–C29).

---

## Live URLs

| Environment | URL |
|---|---|
| Frontend (Production) | https://astuteiq.io |
| Backend API | https://astuteiq.vercel.app |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | FastAPI, Python 3.11 |
| Auth & Database | Supabase |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Deployment | Vercel (frontend + backend) |
| State Management | Zustand with persist middleware |
| UI Extras | Framer Motion, Recharts, Lucide React |
| Document Export | docx, file-saver |

---

## Repository Structure

```
AstuteIQ-/
├── astuteiq/                        # React frontend
│   └── src/
│       ├── components/              # Shared UI components
│       │   ├── admin/               # Admin-only components
│       │   └── ui/                  # Generic UI primitives
│       ├── features/
│       │   ├── auth/                # Auth API, hooks, store
│       │   ├── billing/             # Billing API and hooks
│       │   └── reviews/             # Review types, API, export, components
│       ├── layout/                  # App, Admin, User layouts
│       ├── lib/                     # Axios client, Supabase client
│       ├── pages/                   # All page components
│       ├── store/                   # Zustand stores
│       └── utils/                   # Export utilities
│
└── backend/                         # FastAPI backend
    └── app/
        ├── main.py                  # App entry point, CORS, routers
        ├── core/
        │   ├── config.py            # Pydantic settings
        │   └── deps.py              # Auth dependencies
        ├── api/routes/
        │   ├── auth.py              # Login, register, /me
        │   ├── reviews.py           # Review history CRUD
        │   ├── soa.py               # SOA review + streaming endpoint
        │   ├── feedback.py          # Reviewer feedback/overrides
        │   ├── admin.py             # Admin user management
        │   └── billing.py           # Plans, subscriptions, transactions
        ├── models/                  # Data models
        └── services/                # Business logic services
```

---

## Roles

| Role | Access |
|---|---|
| `admin` | Full platform access, user management, billing, audit logs |
| `paraplanner` | SOA review, history, analytics, settings |
| `user` | Read-only dashboard access |

Roles are stored in Supabase `app_metadata` (server-set, not user-editable).

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/register` | Self-register as paraplanner |
| GET | `/api/auth/me` | Get verified role from backend |

### SOA Review
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/soa/review` | Blocking review (returns full result) |
| POST | `/api/soa/review/stream` | Streaming SSE review (progressive results) |

### Reviews
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reviews/history` | Paginated review history |
| GET | `/api/reviews/{review_id}` | Single review result |
| GET | `/api/reviews/stats` | Aggregate statistics |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/invite` | Invite admin user |
| GET | `/api/admin/permissions` | Role permissions |
| GET | `/api/admin/stats` | Platform statistics |

### Billing
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/billing/plans` | Available subscription plans |
| GET | `/api/billing/customers` | Customer list |
| GET | `/api/billing/overview` | Billing KPIs |
| GET | `/api/billing/transactions` | Transaction history |
| POST | `/api/billing/subscribe` | Assign plan to customer |
| POST | `/api/billing/cancel` | Cancel subscription |

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- A Supabase project
- An Anthropic API key

---

### Frontend Setup

```powershell
cd astuteiq
npm install
```

Create `astuteiq/.env.local`:
```dotenv
VITE_API_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Start the dev server:
```powershell
npm run dev
```

---

### Backend Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env`:
```dotenv
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

Start the backend:
```powershell
uvicorn app.main:app --reload
```

API will be available at `http://127.0.0.1:8000`.
Interactive docs at `http://127.0.0.1:8000/docs`.

---

## Deployment

Both frontend and backend are deployed on Vercel.

### Backend (Vercel — `astuteiq` project)

Set these environment variables in Vercel → Project Settings → Environment Variables:

```
ANTHROPIC_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
```

### Frontend (Vercel — `astute-iq-nsjv` project)

```
VITE_API_URL=https://astuteiq.vercel.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

After updating any environment variable, redeploy with **"Use existing build cache" unchecked**.

---

## Key Architecture Notes

- **JWT decoding:** `SUPABASE_JWT_SECRET` is base64-encoded — the backend uses `base64.b64decode()` before passing to `jwt.decode()`.
- **Role verification:** Frontend calls `GET /api/auth/me` post-login to read the verified role from `app_metadata` before navigating.
- **Streaming:** SOA review results are streamed via SSE. The frontend renders findings progressively as they arrive.
- **CORS:** All allowed origins are configured in `main.py`. Never add `Access-Control-Allow-Origin` headers manually to `StreamingResponse` — let `CORSMiddleware` handle it.
- **Route ordering:** Specific routes (e.g. `/stats`) must be defined before parameterised routes (e.g. `/{review_id}`) in FastAPI.
- **`VITE_` prefix warning:** Never use a `VITE_`-prefixed variable for `SUPABASE_SERVICE_ROLE_KEY` — it would be exposed publicly in the JavaScript bundle.

---

## Environment Variable Reference

| Variable | Where | Description |
|---|---|---|
| `VITE_API_URL` | Frontend | Backend base URL |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase anon/public key |
| `ANTHROPIC_API_KEY` | Backend | Claude API key |
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_ANON_KEY` | Backend | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend only | Supabase service role key (never expose to frontend) |
| `SUPABASE_JWT_SECRET` | Backend | JWT secret for token verification |

---

## Compliance Framework

AstuteIQ reviews SOAs against:

- **C1–C29** — 29 compliance controls covering figures, fees, disclosures, product comparisons, and regulatory warnings
- **P1–P10** — 10 personalisation checks covering client-specific rationale, goals, risk profile, and template language
- **Consistency** — Cross-document figure matching with 5% variance tolerance
- **Structure** — Section completeness against reference SOA or standard template
- **Regulatory** — 2024–25 thresholds (CC cap, NCC cap, TBC, SG rate, Div293)

---

## License

Private and confidential. All rights reserved — AstuteIQ © 2026.
