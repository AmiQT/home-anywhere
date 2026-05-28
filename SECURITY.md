# Security Policy

Thanks for helping keep Home Anywhere and its users safe.

## Reporting a vulnerability

**Please don't open public GitHub issues for security vulnerabilities.**

Instead, report them privately using one of these options:

1. **GitHub Security Advisory** — preferred.
   Go to the [Security tab](https://github.com/AmiQT/home-anywhere/security/advisories/new)
   and open a private advisory.
2. **Email** — `security@home-anywhere.dev`

Please include:

- A description of the issue and its potential impact
- Steps to reproduce (proof-of-concept code is welcome)
- Affected version / commit SHA
- Any suggested mitigations

We'll acknowledge your report within **3 business days** and aim to provide
a fix or mitigation timeline within **14 days** for confirmed issues.

## Scope

In scope:

- The `frontend/` Next.js app
- The `backend/` Laravel API
- Configuration defaults and example files

Out of scope:

- Third-party services we integrate with (Stripe, Google Calendar) — report
  those to the respective vendors
- Issues in dependencies — please report upstream first, then ping us if a
  patch needs to land here

## Supported versions

Only the `main` branch receives security updates. We don't yet ship tagged
releases — once we do, this policy will list the supported version range.

## Security model

### Admin authentication

`/admin` (Next.js dashboard) and `/api/admin/*` (Laravel API) both enforce
HTTP Basic auth against the same `ADMIN_USERNAME` / `ADMIN_PASSWORD` env
values. The backend check (`BasicAdminAuth` middleware) runs independently
of the frontend, so direct hits to the Laravel API can't bypass the
dashboard by skipping the Next.js proxy.

**Operators must change the default password** before exposing the app to
the network. The shipped `.env.example` uses `change-me` as a placeholder
to force this step.

### Anti-CSRF stance

The Laravel API is stateless — every admin request carries credentials in
the `Authorization` header rather than a session cookie. CSRF tokens are
intentionally not used because:

- The dashboard sends `Content-Type: application/json`, which forces a CORS
  preflight on cross-origin requests. Without a matching CORS policy, no
  attacker site can submit JSON to the API on behalf of an authenticated
  admin.
- The Stripe webhook validates the `Stripe-Signature` header against
  `STRIPE_WEBHOOK_SECRET`, so it does not rely on cookies or CSRF tokens.

If you reverse-proxy the app and add permissive CORS for legitimate
reasons, also enable a custom CSRF strategy (e.g., double-submit tokens).

### Rate limiting

API endpoints use Laravel's `throttle` middleware:

- Public reads (`/services`, `/slots`, `/site-content`, `/pricing-settings`):
  **120 req/min/IP**
- Booking + pricing preview (`/bookings`, `/pricing/preview`):
  **30 req/min/IP**
- Stripe webhook: **300 req/min/IP** (loose, since Stripe legitimately retries)
- Admin API (`/api/admin/*`): **300 req/min/IP** (also Basic-auth gated)

Adjust the values in `backend/routes/api.php` to suit your traffic.

### Secrets

`.env` files are gitignored at both the repo root and `backend/`. Generate
a fresh `APP_KEY` (`php artisan key:generate`) on every install — never
reuse the example. Production deployments should also rotate
`ADMIN_PASSWORD` away from the default.

## Recognition

We're happy to credit reporters in release notes (with your permission).
Thanks for making the project safer.
