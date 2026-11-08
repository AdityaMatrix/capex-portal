# Capex Portal

A full-stack web app that manages the full lifecycle of **capital expenditure (Capex) requests** in a multi-plant manufacturing setup: from the first request, through approvals and supplier quotations, to the purchase order, delivery, installation and commissioning.

I built it as a self-directed prototype during my internship. The problem it targets is that Capex requests were tracked across spreadsheets, emails and paper forms. Nobody could see where a request was stuck or how much was being spent per plant, department or supplier.

> **Screenshots:** add images to `docs/screenshots/` and link them here (dashboard, request detail, analytics, access control panel).

---

## Highlights

- **Multi-stage approval workflow** with six roles: User, Department Head, Process Engineering, Buyer, Capex Head and Admin. Each role only sees the actions available at the current stage.
- **Admin-configurable access control.** Admins can show or hide 31 dashboard widgets, request sections and analytics views per role, and use **"Preview as Role"** to see the app exactly as another role would.
- **Supplier quotations and comparison**, with cost-savings tracking (quoted vs. negotiated price) per supplier.
- **Spend analytics**: KPI cards and plant-, department- and supplier-wise spend, with fiscal-year (auto-detected), plant and day/month/quarter filters.
- **Project timeline**: a Gantt view of PR → PO → delivery → installation durations. Projects can be organised into named groups and compared side by side.
- **Bulk Excel upload** of historical requests, with validation, upload history and **rollback**.
- **Sample dispatch workflow** (preparation → ready for dispatch → gate pass / job-work challan → delivery).
- **AI assistant ("Capex Man")** that answers questions about requests and spend, plus an 11-step in-app tutorial for new users.
- Notifications, comments, file attachments (invoices, installation and commissioning documents), and theming.

## Request lifecycle

```
Submit ─► Dept. Head approval ─► Capex Head approval ─► Buyer assigned
   ─► Quotations ─► Comparison ─► CEA / PR / PO ─► Sample & dispatch
   ─► Delivery ─► Installation ─► Commissioning ✔
```

A request counts as **pending** only when its CEA, PR and PO numbers have all been entered and at least one of them isn't approved yet. This stops requests that haven't reached that stage from inflating the pending count.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, React Router 7 (nested + role-protected routes), Tailwind CSS, shadcn/ui (Radix primitives), react-hook-form + zod, Recharts, Framer Motion, Axios, SheetJS |
| Backend | FastAPI (Python), Motor (async MongoDB), JWT auth with bcrypt, Pydantic models |
| Database | MongoDB |
| Testing | Jest + React Testing Library (frontend), pytest API suite (`backend/tests/`) covering auth, access control, workflow stages, analytics and bulk upload |

## Frontend structure

```
frontend/src/
├── App.js                  # Routes, auth context, <ProtectedRoute allowedRoles={...}>
├── pages/                  # One file per route: Dashboard, RequestDetail, Analytics, ...
├── components/
│   ├── dashboard/          # Stats cards, pending tasks, requests table, export dialog
│   ├── analytics/          # Filters, KPI cards, plant/department/supplier spend, AI insights
│   ├── detail/             # Request detail: header, overview, CEA/PR/PO pipeline, DAP, samples
│   │   └── procurement/    # Supplier quotes, payment terms, invoices, delivery & commissioning
│   ├── timeline/           # Gantt chart, project table, groups, compare drawer
│   ├── layout/             # Dashboard shell (collapsible sidebar, notifications)
│   └── ui/                 # shadcn/ui design-system primitives
├── hooks/
│   ├── useAccessControl.js    # Resolves per-role visibility of modules/widgets
│   ├── useRequestDetail.js    # Loads a request and exposes its mutations
│   └── useSampleWorkflow.js   # Sample create → prepare → dispatch → pickup state
└── lib/
    ├── requestDetail.js    # Pure workflow rules (stage mapping, DAP order, delivery variance)
    ├── capexHelpers.js     # INR formatting, stage/status constants, timeline date math
    ├── files.js            # Upload + authenticated download helpers
    └── api.js              # API base URL
```

More detail lives in [`docs/`](docs/): [frontend architecture](docs/frontend-architecture.md), [backend architecture](docs/backend-architecture.md), [system integration](docs/system-integration.md) and the [internship report](docs/internship-report.md).

### Design decisions

- **Access control is data-driven, not hard-coded.** The backend stores a per-role visibility config, and the `useAccessControl` hook exposes `hasAccess(module, itemId)` to components. Adding a new widget only needs a config entry, not role checks scattered around the UI.
- **Routes are guarded twice.** `ProtectedRoute` redirects on the client for UX, and protected API endpoints check the JWT and role again on the server, so hiding a button isn't the only protection.
- **The dashboard auto-refreshes** every 30 seconds in the background, so approvers see new tasks without reloading. The interval is cleaned up on unmount.
- **Large screens were split into focused components.** The request detail page was a single 2,836-line component with 30+ `useState` calls. It's now a ~200-line page that wires together two hooks (data and mutations, sample workflow) and a dozen presentational cards. The dashboard went through the same treatment (about 1,900 lines down to an orchestrator plus feature components).
- **Workflow rules are plain functions.** Logic such as "PO unlocks only after PR approval", "DAP approval order is Process Eng → Dept Head → User" and "multi-item requests store CEA/PR/PO per item" lives in `lib/requestDetail.js`. It's unit-tested there instead of being buried in JSX.
- **Authenticated file downloads.** Uploaded files are served behind JWT auth, which a plain `<a href>` can't carry, so `FileLink` downloads them through axios as a blob.

## Running locally

**Prerequisites:** Node 18+, Python 3.11+, MongoDB running locally.

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                              # then edit values
uvicorn server:app --reload --port 8001

# Seed demo users (only runs on an empty database)
curl -X POST http://localhost:8001/api/seed-users
# Create an admin (admin@capex.com / admin123)
python create_admin.py
# Optional: realistic FY 2025-26 sample data
python seed_fy_data.py
```

```bash
# Frontend
cd frontend
cp .env.example .env
npm install --legacy-peer-deps   # react-day-picker@8 predates React 19 peer ranges
npm start                        # http://localhost:3000
```

Demo logins created by the seed (all fictional): `manoj@capex.com / capex123` (Capex Head), `vijay@capex.com / buyer123` (Buyer), `rajesh@capex.com / depthead123` (Dept. Head), `amit@capex.com / user123` (User).

### Running the tests

Frontend unit and component tests (no backend needed):

```bash
cd frontend
npm run test:ci
```

API tests, with the backend running and seeded:

```bash
cd backend
API_BASE_URL=http://localhost:8001 pytest tests/
```

## Roadmap

- Apply the same hook + component split to `SampleRequests.jsx` (~1,300 lines)
- Extend component tests to the procurement sections and sample dialogs
- Migrate the frontend to TypeScript, starting with `lib/` and the hooks
- Email notifications and PDF export of requests
