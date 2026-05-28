# Deploy guide (for operators)

Running locally with [`docker compose up`](SETUP.md) is great for testing, but
a real business needs the site reachable on the internet with a domain and
HTTPS. This guide covers getting there.

Pick the path that matches how much you want to manage:

| Path                       | Effort | Cost      | Best for                                  |
| -------------------------- | ------ | --------- | ----------------------------------------- |
| **A. VPS + Docker**        | Medium | ~$5–10/mo | Full control, cheapest, reuses our Docker |
| **B. Managed (split)**     | Low    | Free tier | Fastest start, scales automatically       |

---

## Path A — VPS + Docker (recommended)

You already have a working Docker stack. A VPS just runs the same
`docker compose up` on a server with a public IP.

Providers: [DigitalOcean](https://www.digitalocean.com/),
[Hetzner](https://www.hetzner.com/cloud), [Linode](https://www.linode.com/),
[Vultr](https://www.vultr.com/). A 1 GB / 1 vCPU droplet is enough to start.

### 1. Create the server

- Spin up an **Ubuntu 22.04+** droplet.
- SSH in and [install Docker Engine + Compose](https://docs.docker.com/engine/install/ubuntu/).

### 2. Get the code on the server

```bash
git clone https://github.com/AmiQT/home-anywhere.git
cd home-anywhere
```

### 3. Set production values

```bash
cp .env.docker.example .env
nano .env   # set a strong ADMIN_PASSWORD, add Stripe keys if going live
```

Also set the public URL the frontend should advertise. In `docker-compose.yml`
(or as env in `.env`), change:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4. Run it

```bash
docker compose up -d
```

The site is now live on the server's IP at ports `3000` (site) and `8000`
(API). Don't expose those raw to the public — put a reverse proxy in front.

### 5. Domain + HTTPS (reverse proxy)

Use [Caddy](https://caddyserver.com/) — it gets you automatic HTTPS in a few
lines. On the server:

```bash
# /etc/caddy/Caddyfile
yourdomain.com {
    reverse_proxy localhost:3000
}
```

Point your domain's `A` record at the server IP, reload Caddy, and you have
`https://yourdomain.com` with a real certificate. Caddy renews it for you.

> The frontend already proxies `/api/*` and `/storage/*` to the backend
> internally, so you only need to expose the frontend (`:3000`) publicly.

### 6. Backups

Your data lives in the `mysql_data` Docker volume and uploaded photos in
`backend_storage`. Back them up on a schedule:

```bash
docker exec home-anywhere-db mysqldump -u root home_anywhere > backup-$(date +%F).sql
```

---

## Path B — Managed platforms (split deploy)

Run the frontend and backend on separate managed services. No server to
maintain, generous free tiers, but two dashboards to wire together.

### Frontend → [Vercel](https://vercel.com/)

1. Import the GitHub repo, set the **root directory** to `frontend`.
2. Add environment variables:
   - `BACKEND_URL` → your deployed backend URL (from below)
   - `NEXT_PUBLIC_APP_URL` → your Vercel domain
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD`
3. Deploy. Vercel auto-builds on every push to `main`.

### Backend → [Railway](https://railway.app/) or [Render](https://render.com/)

1. New project from the GitHub repo, root directory `backend`.
2. Add a **MySQL** (or PostgreSQL) plugin/database in the same project.
3. Set environment variables to match the database the platform provisions:
   - `APP_KEY` → generate locally with `php artisan key:generate --show`
   - `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`,
     `DB_PASSWORD` → from the platform's database
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` → **same values as Vercel**
   - `NEXT_PUBLIC_APP_URL` → your Vercel domain
   - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` → if going live
4. Set the start command to run migrations then serve, e.g.
   `php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=$PORT`
   (drop the seed after the first deploy so you don't reset the catalogue).

Then set Vercel's `BACKEND_URL` to the Railway/Render backend URL and redeploy
the frontend.

---

## Going live with payments

Demo mode (no Stripe key) confirms bookings instantly without charging. To take
real deposits:

1. Add `STRIPE_SECRET_KEY` (and `STRIPE_WEBHOOK_SECRET`) to the backend env.
2. In the Stripe dashboard, add a webhook pointing at
   `https://yourdomain.com/api/webhooks/stripe`.
3. Test with Stripe's test cards before switching to live keys.

---

## Pre-launch checklist

- [ ] Strong `ADMIN_PASSWORD` set (not `change-me`)
- [ ] `APP_DEBUG=false` in production
- [ ] HTTPS working on the real domain
- [ ] `NEXT_PUBLIC_APP_URL` points at the public domain
- [ ] Stripe webhook configured (if taking payments)
- [ ] Database backups scheduled
- [ ] Logged into `/admin` and confirmed the dashboard loads
