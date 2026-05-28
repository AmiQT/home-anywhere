<div align="center">

# Home Anywhere

**Open-source homestay booking platform. Real availability, secure deposits, instant confirmation — anywhere you stay.**

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Laravel](https://img.shields.io/badge/Laravel-11-red?logo=laravel)](https://laravel.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## What is this?

Home Anywhere is a self-hostable homestay booking platform you can run for any
property portfolio — boutique stays, family villas, hill retreats, city
apartments. It bundles a polished guest-facing booking flow, an admin
dashboard, and pluggable integrations for payments and calendars.

### Highlights

- **Multi-step booking flow** — pick a stay → pick a date → confirm details.
- **Real availability** — slots live-load from the backend; no double bookings.
- **Stripe deposits** — guests pay 30% to confirm, balance on check-in.
  Works in demo mode without Stripe keys.
- **Google Calendar sync** — every confirmed booking creates an event;
  cancellations remove it.
- **Admin dashboard** — CRUD for stays, slots, and guest bookings.
  Cancel a booking and the refund + calendar cleanup happens automatically.
- **GA4 events** — `view_schedule`, `start_booking`, `add_on_selected`,
  `complete_booking` track funnel conversion out of the box.
- **Email notifications** — confirmation emails via SMTP (Laravel Mail);
  WhatsApp stub ready for Twilio.
- **Built-in CMS** — edit the hero, stats, testimonials, and call-to-action
  banner from the admin dashboard. No code, no redeploy.

---

## Tech stack

| Layer    | Stack                                                   |
| -------- | ------------------------------------------------------- |
| Frontend | Next.js 14 (App Router) · React 18 · TypeScript         |
| UI       | Tailwind CSS v4 · shadcn/ui (new-york) · Lucide icons   |
| Backend  | Laravel 11 · PHP 8.3                                    |
| Database | SQLite (dev) · MySQL or PostgreSQL (prod)               |
| Payments | Stripe Checkout + Webhooks                              |
| Calendar | Google Calendar API (service account)                   |
| Email    | Laravel Mail (SMTP)                                     |
| Testing  | Jest (frontend) · PHPUnit (backend)                     |

---

## Quick start

```bash
git clone https://github.com/AmiQT/home-anywhere.git
cd home-anywhere
```

### Fastest: one command with Docker 🐳

The only thing you need installed is
[Docker Desktop](https://www.docker.com/products/docker-desktop/):

```bash
docker compose up
```

This boots the database, backend, and frontend together — and automatically
generates the app key, runs migrations, and seeds demo stays. When it's ready:

- **Guest site** → http://localhost:3000
- **Admin dashboard** → http://localhost:3000/admin (login `admin` / `change-me`)

See **[SETUP.md](SETUP.md)** for configuration and **[DEPLOY.md](DEPLOY.md)**
for putting it on the internet.

### Manual setup (no Docker)

> Requires Node 18+, PHP 8.3+, and Composer.

### 1. Backend (Laravel API)

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link    # makes uploaded images publicly accessible
php artisan serve
```

Backend runs at `http://127.0.0.1:8000`.

### 2. Frontend (Next.js)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.
All `/api/*` requests are proxied to the backend via [`next.config.mjs`](frontend/next.config.mjs).

### 3. Set the admin password ⚠️

The dashboard ships with `ADMIN_PASSWORD=change-me` as a placeholder. The
**same value must be set in both `frontend/.env` and `backend/.env`** so
the dashboard and API agree:

```env
# frontend/.env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=pick-a-strong-one

# backend/.env  (same values)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=pick-a-strong-one
```

The backend enforces this independently of the frontend, so `/api/admin/*`
returns `401` until both sides match.

### 4. Visit the app

- **Guest site** → http://localhost:3000
- **Admin dashboard** → http://localhost:3000/admin
  (uses `ADMIN_USERNAME` / `ADMIN_PASSWORD`)

---

## Configuration

The project ships with sensible defaults so it runs without any third-party
keys. Set these env vars when you're ready to enable real integrations.

### Frontend (`frontend/.env`)

| Variable              | Purpose                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | Public site URL (metadata, redirects)                            |
| `NEXT_PUBLIC_GA_ID`   | GA4 measurement ID — leave blank to disable analytics            |
| `BACKEND_URL`         | Where `/api/*` is proxied to (Laravel API base URL)              |
| `ADMIN_USERNAME`      | Basic-auth user for `/admin` (set in [`middleware.ts`](frontend/middleware.ts)) |
| `ADMIN_PASSWORD`      | Basic-auth password — **change before deploying**                |

### Backend (`backend/.env`)

| Variable                          | Purpose                                                          |
| --------------------------------- | ---------------------------------------------------------------- |
| `APP_KEY`                         | Generated by `php artisan key:generate`                          |
| `DB_CONNECTION`                   | `sqlite` (default), `mysql`, or `pgsql`                          |
| `MAIL_*`                          | SMTP for confirmation emails — `MAIL_MAILER=log` prints to log   |
| `STRIPE_SECRET_KEY`               | Stripe secret key — blank = demo mode (skip checkout)            |
| `STRIPE_WEBHOOK_SECRET`           | Verify Stripe webhook signatures                                 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`    | Service account email for Calendar API                           |
| `GOOGLE_SERVICE_ACCOUNT_KEY`      | Service account private key (PEM)                                |
| `GOOGLE_CALENDAR_ID`              | Calendar to write booking events to                              |

Read [`backend/.env.example`](backend/.env.example) for the full list.

---

## Project structure

```
home-anywhere/
├── frontend/                # Next.js 14 (App Router)
│   ├── app/
│   │   ├── page.tsx         # Homepage
│   │   ├── book/            # Multi-step booking flow
│   │   ├── success/         # Post-payment confirmation
│   │   └── admin/           # Admin dashboard (tabs: stays / slots / bookings)
│   ├── components/ui/       # shadcn/ui primitives
│   ├── lib/                 # Helpers (ga.ts, utils.ts)
│   ├── middleware.ts        # Basic auth for /admin & /api/admin/*
│   └── next.config.mjs      # Proxies /api/* → BACKEND_URL
│
├── backend/                 # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers # ApiController, BookingController, AdminController, StripeWebhookController
│   │   ├── Models           # Service, Booking, Slot, Addon, Notification
│   │   └── Services         # Stripe, Google Calendar, Notifications
│   ├── database/migrations  # Singular table naming (service, booking, ...)
│   └── routes/api.php       # Public + /admin endpoints
│
├── docker-compose.yml       # MySQL service (optional)
├── LICENSE                  # MIT
└── README.md
```

### API endpoints (proxied via `/api/*`)

| Method  | Path                       | Description                              |
| ------- | -------------------------- | ---------------------------------------- |
| GET     | `/api/services`            | List published stays                     |
| GET     | `/api/slots?serviceId=:id` | Open check-in slots for a stay           |
| GET     | `/api/site-content`        | Public site copy (hero, stats, etc.)     |
| POST    | `/api/bookings`            | Create booking → Stripe checkout URL     |
| POST    | `/api/webhooks/stripe`     | Stripe payment confirmation              |
| GET     | `/api/admin/services`      | Admin: list stays                        |
| POST    | `/api/admin/services`      | Admin: create stay                       |
| PATCH   | `/api/admin/services`      | Admin: update stay                       |
| DELETE  | `/api/admin/services?id=`  | Admin: delete stay                       |
| POST    | `/api/admin/services/:id/images` | Admin: upload a photo (multipart)   |
| DELETE  | `/api/admin/images/:id`    | Admin: delete a photo                    |
| PATCH   | `/api/admin/images/:id/primary` | Admin: set photo as primary         |
| GET/POST/DELETE | `/api/admin/slots` | Admin: manage check-in slots             |
| GET     | `/api/admin/bookings`      | Admin: list guest bookings               |
| POST    | `/api/admin/cancel`        | Admin: cancel booking + refund + remove calendar event |
| GET/PUT | `/api/admin/site-content`  | Admin: view/edit homepage copy (CMS)     |

---

## Running with Docker

A `docker-compose.yml` is included for spinning up MySQL locally:

```bash
docker compose up -d
```

Then point `backend/.env` at it:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=home_anywhere
DB_USERNAME=root
DB_PASSWORD=
```

Both `frontend/` and `backend/` ship with a `Dockerfile` if you want to
containerise the apps themselves.

---

## Testing

```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && php artisan test
```

---

## Roadmap

- [x] Image uploads for listings (multi-photo gallery + primary photo)
- [x] Built-in CMS for hero copy, stats, testimonials, and CTA banner
- [ ] Rich-text editor for stay descriptions
- [ ] Guest review & rating system
- [ ] iCal/Google Calendar export per booking
- [ ] Multi-language UI (i18n)
- [ ] Replace Basic Auth with proper admin auth (Sanctum / NextAuth)
- [x] Docker one-command setup ([SETUP.md](SETUP.md)) + cloud deploy guide ([DEPLOY.md](DEPLOY.md))

See open [issues](https://github.com/AmiQT/home-anywhere/issues) for what's
being worked on.

---

## Contributing

Contributions are very welcome — bug reports, feature requests, docs,
translations, design improvements. Start with [CONTRIBUTING.md](CONTRIBUTING.md)
and our [Code of Conduct](CODE_OF_CONDUCT.md).

Found a security issue? Please read [SECURITY.md](SECURITY.md) — don't open
a public issue.

---

## License

[MIT](LICENSE) © [AmiQT](https://github.com/AmiQT)
