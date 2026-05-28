<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Service;
use App\Models\Slot;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * End-to-end coverage for POST /api/bookings. Stripe is left unconfigured so
 * the controller runs in demo mode (no network calls) — every booking is
 * confirmed immediately and returns a local /success URL.
 */
class BookingFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Demo mode: no Stripe key means no checkout session is created.
        putenv('STRIPE_SECRET_KEY=');
        $_ENV['STRIPE_SECRET_KEY'] = '';
        putenv('NEXT_PUBLIC_APP_URL=http://localhost:3000');
        $_ENV['NEXT_PUBLIC_APP_URL'] = 'http://localhost:3000';
    }

    private function makeService(int $duration = 1): Service
    {
        return Service::create([
            'name' => 'Test Villa',
            'duration' => $duration,
            'price' => 40000,
            'deposit_pct' => 30,
        ]);
    }

    private function payload(Service $service, string $in, string $out): array
    {
        return [
            'serviceId' => $service->id,
            'checkInDate' => $in,
            'checkOutDate' => $out,
            'name' => 'Guest Tester',
            'email' => 'guest@example.com',
        ];
    }

    public function test_demo_mode_confirms_booking_and_returns_success_url(): void
    {
        $service = $this->makeService();
        $in = Carbon::today()->addDays(5)->toDateString();
        $out = Carbon::today()->addDays(6)->toDateString();

        $res = $this->postJson('/api/bookings', $this->payload($service, $in, $out));

        $res->assertStatus(200)
            ->assertJsonStructure(['checkoutUrl', 'id']);

        $bookingId = $res->json('id');
        $this->assertStringContainsString("/success?bookingId={$bookingId}", $res->json('checkoutUrl'));
        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'status' => 'confirmed',
        ]);
    }

    public function test_overlapping_dates_are_rejected_with_409(): void
    {
        $service = $this->makeService();
        $in = Carbon::today()->addDays(5)->toDateString();
        $out = Carbon::today()->addDays(7)->toDateString();

        // First booking succeeds.
        $this->postJson('/api/bookings', $this->payload($service, $in, $out))
            ->assertStatus(200);

        // Second booking overlapping the same range must conflict.
        $overlapIn = Carbon::today()->addDays(6)->toDateString();
        $overlapOut = Carbon::today()->addDays(8)->toDateString();

        $res = $this->postJson('/api/bookings', $this->payload($service, $overlapIn, $overlapOut));

        $res->assertStatus(409);
        // Only the first booking should exist.
        $this->assertSame(1, Booking::count());
    }

    public function test_non_overlapping_back_to_back_booking_is_allowed(): void
    {
        $service = $this->makeService();

        $this->postJson('/api/bookings', $this->payload(
            $service,
            Carbon::today()->addDays(5)->toDateString(),
            Carbon::today()->addDays(6)->toDateString(),
        ))->assertStatus(200);

        // Checks in exactly when the previous checks out — 14:00 > 12:00, no overlap.
        $this->postJson('/api/bookings', $this->payload(
            $service,
            Carbon::today()->addDays(6)->toDateString(),
            Carbon::today()->addDays(7)->toDateString(),
        ))->assertStatus(200);

        $this->assertSame(2, Booking::count());
    }

    public function test_admin_blocked_slot_blocks_booking(): void
    {
        $service = $this->makeService();
        $in = Carbon::today()->addDays(5);
        $out = Carbon::today()->addDays(7);

        // Admin-blocked slot has no bookings attached.
        Slot::create([
            'service_id' => $service->id,
            'start' => $in->copy()->setTime(14, 0),
            'end' => $out->copy()->setTime(12, 0),
            'capacity' => 1,
        ]);

        $res = $this->postJson('/api/bookings', $this->payload(
            $service,
            $in->toDateString(),
            $out->toDateString(),
        ));

        $res->assertStatus(409);
        $this->assertSame(0, Booking::count());
    }

    public function test_stay_shorter_than_minimum_nights_is_rejected(): void
    {
        $service = $this->makeService(duration: 3); // minimum 3 nights

        $res = $this->postJson('/api/bookings', $this->payload(
            $service,
            Carbon::today()->addDays(5)->toDateString(),
            Carbon::today()->addDays(6)->toDateString(), // only 1 night
        ));

        $res->assertStatus(422);
    }

    public function test_checkout_before_checkin_fails_validation(): void
    {
        $service = $this->makeService();

        $res = $this->postJson('/api/bookings', $this->payload(
            $service,
            Carbon::today()->addDays(6)->toDateString(),
            Carbon::today()->addDays(5)->toDateString(), // out before in
        ));

        $res->assertStatus(422);
    }

    public function test_unknown_service_fails_validation(): void
    {
        $res = $this->postJson('/api/bookings', [
            'serviceId' => 999999,
            'checkInDate' => Carbon::today()->addDays(5)->toDateString(),
            'checkOutDate' => Carbon::today()->addDays(6)->toDateString(),
            'name' => 'Guest',
            'email' => 'guest@example.com',
        ]);

        $res->assertStatus(422); // exists:services,id rule fails
    }
}
