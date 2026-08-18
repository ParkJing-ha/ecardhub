# eCardHub — Digital Event Card Platform

eCardHub is a full-stack web application for creating, distributing, and verifying digital invitation and contribution cards. This repository contains a Django backend and a Next.js frontend using the App Router.

**Goals:** quick local developer setup, clear frontend ↔ backend connection, and pragmatic instructions for running both services together.

**Tech stack**

- Backend: Python 3.10+ (Django, Django REST Framework), SQLite (default development DB)
- Frontend: Node 18+, Next.js (App Router)

## Quick summary of functionality

- Create events, manage guest lists, generate invitation cards with embedded QR codes
- Send invitations via SMS/WhatsApp/email (integration points)
- Real-time RSVP and check-in verification (QR scan flow)
- Role-based access: admin, event host, sub-users (ushers)

## Repository layout

- `backend/` — Django project (manage.py, apps: users, cards, invitations, config)
- `frontend/` — Next.js app using the App Router (`app/` directory)
- `db.sqlite3` — development database (backend)

## Local development — Backend (Django)

Prerequisites

- Python 3.10+ installed
- (Optional) `virtualenv` or `venv`

Setup

```bash
# from repo root
cd backend
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
# install requirements (create requirements.txt if missing)
pip install django djangorestframework django-cors-headers
```

Database & migrations

```bash
python manage.py makemigrations
python manage.py migrate
# create a superuser for admin access
python manage.py createsuperuser
```

Configuration notes

- The project uses `db.sqlite3` by default for development. If you switch to PostgreSQL or another DB, update `backend/config/settings.py` accordingly.
- To allow the Next.js frontend to call the API during local development, enable CORS. Install `django-cors-headers` and add it to `INSTALLED_APPS` and middleware, then configure `CORS_ALLOW_ALL_ORIGINS = True` (or a restricted list) in `settings.py`.

Run the backend dev server

```bash
python manage.py runserver 0.0.0.0:8000
```

The API will be available at `http://localhost:8000/`.

## Local development — Frontend (Next.js App Router)

Prerequisites

- Node.js 18+ and npm or pnpm installed

Setup

```bash
cd frontend
npm install
```

Environment variables

- Frontend needs to know the backend API base URL. Create a `.env.local` in `frontend/` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the frontend dev server

```bash
npm run dev
```

By default, Next.js runs at `http://localhost:3000`.

## Connecting frontend and backend

- The frontend should call the backend API using `process.env.NEXT_PUBLIC_API_URL` (set above). Example fetch:

```js
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/`);
```

- Make sure the backend allows the frontend origin (e.g., `http://localhost:3000`) via CORS.
- If you prefer not to enable wide-open CORS, set `CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]` in Django settings.

## Helpful development tips

- Static/media files: for local dev Django serves static files; production requires proper storage config.
- If you change models, run `makemigrations` and `migrate` before interacting with the API.
- Use the Django admin (`/admin/`) to inspect data and create initial test events/guests.

## Useful commands (from repo root)

```bash
# Backend
cd backend && source .venv/bin/activate && python manage.py runserver

# Frontend
cd frontend && npm run dev
```

## Troubleshooting

- 500 errors from the frontend API calls: check backend `ALLOWED_HOSTS`, CORS settings, and that the backend server is running.
- `sqlite` locked errors: ensure no concurrent process holds the DB (delete `db.sqlite3` only if safe).

## Next steps / recommended improvements

- Add a `requirements.txt` or `pyproject.toml` for backend reproducible installs.
- Add a `Procfile` / Dockerfile for containerized development.
- Provide example environment files for production and staging.

---

If you want, I can also:

- add a `requirements.txt` and a minimal `.env.example` files, or
- add a short script to run both services concurrently for local development.

Tell me which of those you'd like next.
