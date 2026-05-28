<?php

use App\Http\Controllers\ApiController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Rate limiters guard public endpoints from abuse. Admin routes additionally
| require HTTP Basic auth (admin.basic) so direct hits to /api/admin/*
| cannot bypass the Next.js dashboard auth.
|
*/

// Public read endpoints — generous limit since these are cacheable.
Route::middleware('throttle:120,1')->group(function () {
    Route::get('/services', [ApiController::class, 'getServices']);
    Route::get('/slots', [ApiController::class, 'getSlots']);
    Route::get('/site-content', [ApiController::class, 'getSiteContent']);
    Route::get('/pricing-settings', [ApiController::class, 'getPricingSettings']);
});

// Booking + preview — tighter limit to deter scraping/spam.
Route::middleware('throttle:30,1')->group(function () {
    Route::post('/pricing/preview', [ApiController::class, 'previewPricing']);
    Route::post('/bookings', [BookingController::class, 'createBooking']);
});

// Stripe webhook — looser limit to accommodate legitimate retries.
// Stripe authenticates via signature inside StripeWebhookController.
Route::middleware('throttle:300,1')->post(
    '/webhooks/stripe',
    [StripeWebhookController::class, 'handle'],
);

// Admin Dashboard Endpoints — Basic auth + throttle.
Route::middleware(['admin.basic', 'throttle:300,1'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/services', [AdminController::class, 'getServices']);
        Route::post('/services', [AdminController::class, 'createService']);
        Route::patch('/services', [AdminController::class, 'updateService']);
        Route::delete('/services', [AdminController::class, 'deleteService']);

        // Service images
        Route::post('/services/{serviceId}/images', [AdminController::class, 'uploadServiceImage']);
        Route::delete('/images/{id}', [AdminController::class, 'deleteServiceImage']);
        Route::patch('/images/{id}/primary', [AdminController::class, 'setPrimaryServiceImage']);

        Route::get('/slots', [AdminController::class, 'getSlots']);
        Route::post('/slots', [AdminController::class, 'createSlot']);
        Route::delete('/slots', [AdminController::class, 'deleteSlot']);

        Route::get('/bookings', [AdminController::class, 'getBookings']);
        Route::post('/cancel', [AdminController::class, 'cancelBooking']);

        // Site content (CMS)
        Route::get('/site-content', [AdminController::class, 'getSiteContent']);
        Route::put('/site-content', [AdminController::class, 'updateSiteContent']);

        // Pricing settings (SST, weekend surcharge, cleaning fee, default deposit %)
        Route::get('/pricing-settings', [AdminController::class, 'getPricingSettings']);
        Route::put('/pricing-settings', [AdminController::class, 'updatePricingSettings']);
    });
