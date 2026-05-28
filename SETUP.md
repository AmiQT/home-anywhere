# Setup guide (for operators)

This guide is for **whoever deploys Home Anywhere for a business** — likely
you, not the business owner. The owner only ever touches the admin dashboard
(see [USER_GUIDE.md](USER_GUIDE.md)); everything below is one-time setup.

There are two ways to run the stack:

1. **Docker (recommended)** — one command, identical every time.
2. **Manual** — install Node + PHP + Composer yourself (see the
   [README Quick start](README.md#quick-start)).

---

## Option 1 — Docker (recommended)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
  and running. That's the **only** thing you need to install — no Node, PHP,
  Composer, or MySQL on your machine.

### Run it

From the project root:

```bash
docker compose up
```

The first run builds the images and downloads MySQL/PHP/Node — give it a few
minutes. On later runs it boots in seconds. When you see
`Backend ready on :8000`, open:

- **Guest site** → http://localhost:3000
- **Admin dashboard** → http://localhost:3000/admin

The backend automatically generates its app key, waits for the database,
runs migrations, seeds demo stays (only on an empty database), and links the
image storage. You don't run any `artisan` commands by hand.

To stop:

```bash
docker compose down          # keep data
docker compose down -v       # also wipe the database + uploaded photos
```

### Default login

| Field    | Value       |
| -------- | ----------- |
| Username | `admin`     |
| Password | `change-me` |

> ⚠️ **Change this before handing the site to a real business.** See below.

### Configure (optional)

Copy the example and edit the values you care about:

```bash
cp .env.docker.example .env
```

| Variable                | What it does                                          |
| ----------------------- | ----------------------------------------------------- |
| `ADMIN_USERNAME`        | Dashboard login user                                  |
| `ADMIN_PASSWORD`        | Dashboard login password — **set a strong one**       |
| `STRIPE_SECRET_KEY`     | Enable real deposits. Blank = demo mode (no charge)   |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhook signatures                      |
| `NEXT_PUBLIC_GA_ID`     | Google Analytics 4 ID. Blank = analytics off          |

Then `docker compose up` again to apply. The `.env` here is for the **Docker
stack only** — the per-app `backend/.env` / `frontend/.env` are ignored when
running through Docker.

---

## Option 2 — Manual (no Docker)

Follow the [Quick start in the README](README.md#quick-start). You'll install
Node 18+, PHP 8.3+, and Composer, then run the backend and frontend in two
separate terminals. Use this only if you can't run Docker.

---

## Handing it over to the business owner

Once the site is running and reachable, the owner manages everything from the
dashboard — adding stays, setting prices, managing bookings — without touching
any code. Point them to **[USER_GUIDE.md](USER_GUIDE.md)**.

Things only you (the operator) handle:

- Hosting / domain / HTTPS
- The admin password
- Stripe + Google Calendar keys
- Backups of the database volume (`mysql_data`)
