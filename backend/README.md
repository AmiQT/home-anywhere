# Home Anywhere — Backend API

Laravel 11 API that powers the [Home Anywhere](../README.md) homestay booking
platform. Handles services, slots, bookings, payments (Stripe), calendar sync
(Google Calendar), and email notifications.

> Looking for setup instructions? See the [root README](../README.md).

## Stack

- Laravel 11 · PHP 8.3
- Database: SQLite (dev) / MySQL or PostgreSQL (prod)
- Stripe PHP SDK
- Google API PHP Client
- PHPUnit

## Quick start

```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

API runs at `http://127.0.0.1:8000`.

## Project structure

```
app/
├── Http/
│   └── Controllers/
│       ├── ApiController.php           # Public read endpoints (services, slots)
│       ├── BookingController.php       # POST /bookings + Stripe checkout
│       ├── StripeWebhookController.php # Stripe payment confirmation
│       └── AdminController.php         # CRUD + cancel/refund
├── Models/
│   ├── Service.php
│   ├── Slot.php
│   ├── Booking.php
│   ├── Addon.php
│   └── Notification.php
└── Services/                           # External integrations
    ├── StripeService.php
    ├── GoogleCalendarService.php
    └── NotificationService.php

database/
├── migrations/                         # Singular table naming convention
└── seeders/                            # Demo stays + slots
```

## Conventions

- **Singular table names**: `service`, `booking`, `addon`, `slot`, `notification`.
- **Money in cents (integer)**: `price` and `deposit` are stored as integer
  cents — RM 100 = `10000`.
- **Graceful degradation**: Stripe / Calendar / Mail integrations all fall
  back to log-only behaviour if env vars are blank, so the app stays
  bookable in demo mode.

## API endpoints

See [API endpoints table](../README.md#api-endpoints-proxied-via-api) in the
root README.

## Testing

```bash
php artisan test
```

## License

[MIT](../LICENSE) © [AmiQT](https://github.com/AmiQT)
