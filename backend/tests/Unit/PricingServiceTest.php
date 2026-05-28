<?php

namespace Tests\Unit;

use App\Models\Addon;
use App\Models\PricingSetting;
use App\Models\Service;
use App\Services\PricingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * PricingService is the single source of truth for booking math, so it gets
 * the most direct coverage: deposit %, SST, weekend surcharge, cleaning fee,
 * and add-on filtering. Money is always integer cents.
 */
class PricingServiceTest extends TestCase
{
    use RefreshDatabase;

    private PricingService $pricing;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pricing = new PricingService();
    }

    /** A service with no add-ons, priced per night in cents. */
    private function makeService(int $price = 40000, ?int $depositPct = 30, int $duration = 1): Service
    {
        return Service::create([
            'name' => 'Test Stay',
            'duration' => $duration,
            'price' => $price,
            'deposit_pct' => $depositPct,
        ]);
    }

    public function test_plain_stay_with_defaults_has_no_taxes_or_surcharges(): void
    {
        // Defaults: SST off, weekend off, cleaning off, deposit 30%.
        $service = $this->makeService(price: 40000);
        // Mon -> Wed = 2 nights.
        $checkIn = Carbon::parse('2026-06-01 14:00');   // Monday
        $checkOut = Carbon::parse('2026-06-03 12:00');  // Wednesday

        $quote = $this->pricing->calculate($service, $checkIn, $checkOut);

        // Carbon's diffInDays returns a float, so compare loosely on night counts.
        $this->assertEquals(2, $quote['nights']);
        $this->assertSame(80000, $quote['stay_subtotal']);   // 2 * 40000
        $this->assertSame(0, $quote['weekend_surcharge']);
        $this->assertSame(0, $quote['sst_amount']);
        $this->assertSame(0, $quote['cleaning_fee']);
        $this->assertSame(80000, $quote['total']);
        $this->assertSame(30, $quote['deposit_pct']);
        $this->assertSame(24000, $quote['deposit_amount']); // 30% of 80000
        $this->assertSame('myr', $quote['currency']);
    }

    public function test_deposit_uses_service_pct_over_global_default(): void
    {
        PricingSetting::setMap(['default_deposit_pct' => 50]);
        $service = $this->makeService(price: 10000, depositPct: 25, duration: 1);

        $quote = $this->pricing->calculate(
            $service,
            Carbon::parse('2026-06-01 14:00'),
            Carbon::parse('2026-06-02 12:00'),
        );

        // Service-level 25% wins over the global 50% default.
        $this->assertSame(25, $quote['deposit_pct']);
        $this->assertSame(2500, $quote['deposit_amount']);
    }

    public function test_deposit_falls_back_to_global_default_when_service_pct_is_null(): void
    {
        PricingSetting::setMap(['default_deposit_pct' => 40]);

        // The schema defaults deposit_pct to 30 and is non-nullable, so build
        // an in-memory Service with a null pct to exercise the ?? fallback in
        // PricingService directly. Add-ons relation is empty by default.
        $service = new Service([
            'name' => 'No-pct Stay',
            'duration' => 1,
            'price' => 10000,
            'deposit_pct' => null,
        ]);
        $service->setRelation('addons', collect());

        $quote = $this->pricing->calculate(
            $service,
            Carbon::parse('2026-06-01 14:00'),
            Carbon::parse('2026-06-02 12:00'),
        );

        $this->assertSame(40, $quote['deposit_pct']);
        $this->assertSame(4000, $quote['deposit_amount']);
    }

    public function test_sst_is_applied_on_subtotal_when_enabled(): void
    {
        PricingSetting::setMap([
            'sst_enabled' => true,
            'sst_rate' => 6.0,
        ]);
        $service = $this->makeService(price: 10000, depositPct: 30, duration: 1);

        $quote = $this->pricing->calculate(
            $service,
            Carbon::parse('2026-06-01 14:00'),
            Carbon::parse('2026-06-02 12:00'),
        );

        // subtotal 10000 -> SST 6% = 600 -> total 10600.
        $this->assertSame(10000, $quote['subtotal']);
        $this->assertSame(600, $quote['sst_amount']);
        $this->assertSame(10600, $quote['total']);
        // Deposit is taken on the SST-inclusive total.
        $this->assertSame(3180, $quote['deposit_amount']); // 30% of 10600
    }

    public function test_weekend_surcharge_only_applies_to_weekend_nights(): void
    {
        PricingSetting::setMap([
            'weekend_pricing_enabled' => true,
            'weekend_surcharge_pct' => 20.0,
            'weekend_days' => ['sat', 'sun'],
        ]);
        $service = $this->makeService(price: 10000, depositPct: 30, duration: 1);

        // Fri -> Mon = 3 nights: Fri (weekday), Sat (weekend), Sun (weekend).
        $checkIn = Carbon::parse('2026-06-05 14:00');   // Friday
        $checkOut = Carbon::parse('2026-06-08 12:00');  // Monday

        $quote = $this->pricing->calculate($service, $checkIn, $checkOut);

        $this->assertEquals(3, $quote['nights']);
        $this->assertSame(2, $quote['weekend_nights']);
        $this->assertEquals(1, $quote['weekday_nights']);
        // Surcharge = 2 weekend nights * 20% of 10000 = 2 * 2000 = 4000.
        $this->assertSame(4000, $quote['weekend_surcharge']);
        // stay_subtotal = base (3 * 10000) + surcharge (4000) = 34000.
        $this->assertSame(34000, $quote['stay_subtotal']);
        $this->assertSame(34000, $quote['total']);
    }

    public function test_cleaning_fee_added_once_when_enabled(): void
    {
        PricingSetting::setMap([
            'cleaning_fee_enabled' => true,
            'cleaning_fee_amount' => 5000,
        ]);
        $service = $this->makeService(price: 10000, depositPct: 30, duration: 1);

        // 2 nights so we can confirm the fee is flat, not per-night.
        $quote = $this->pricing->calculate(
            $service,
            Carbon::parse('2026-06-01 14:00'),
            Carbon::parse('2026-06-03 12:00'),
        );

        $this->assertSame(5000, $quote['cleaning_fee']);
        // subtotal = stay (20000) + cleaning (5000) = 25000.
        $this->assertSame(25000, $quote['subtotal']);
        $this->assertSame(25000, $quote['total']);
    }

    public function test_only_addons_belonging_to_the_service_are_charged(): void
    {
        $service = $this->makeService(price: 10000, depositPct: 30, duration: 1);
        $own = Addon::create(['name' => 'BBQ', 'price' => 3000, 'service_id' => $service->id]);

        // An add-on from a different service must be ignored.
        $other = $this->makeService(price: 9999, depositPct: 30, duration: 1);
        $foreign = Addon::create(['name' => 'Foreign', 'price' => 9999, 'service_id' => $other->id]);

        $service->load('addons');

        $quote = $this->pricing->calculate(
            $service,
            Carbon::parse('2026-06-01 14:00'),
            Carbon::parse('2026-06-02 12:00'),
            [$own->id, $foreign->id, 999999], // foreign + nonexistent are dropped
        );

        $this->assertSame(3000, $quote['addons_total']);
        $this->assertSame(13000, $quote['total']); // 10000 stay + 3000 addon
    }

    public function test_full_stack_stay_combines_surcharge_addon_cleaning_and_sst(): void
    {
        PricingSetting::setMap([
            'sst_enabled' => true,
            'sst_rate' => 6.0,
            'weekend_pricing_enabled' => true,
            'weekend_surcharge_pct' => 20.0,
            'weekend_days' => ['sat', 'sun'],
            'cleaning_fee_enabled' => true,
            'cleaning_fee_amount' => 5000,
        ]);
        $service = $this->makeService(price: 10000, depositPct: 30, duration: 1);
        $addon = Addon::create(['name' => 'BBQ', 'price' => 3000, 'service_id' => $service->id]);
        $service->load('addons');

        // Fri -> Sun = 2 nights: Fri (weekday), Sat (weekend).
        $quote = $this->pricing->calculate(
            $service,
            Carbon::parse('2026-06-05 14:00'),  // Friday
            Carbon::parse('2026-06-07 12:00'),  // Sunday
            [$addon->id],
        );

        // stay base 2*10000 = 20000; weekend surcharge 1*2000 = 2000 -> stay 22000
        // + addon 3000 + cleaning 5000 = subtotal 30000
        // SST 6% of 30000 = 1800 -> total 31800
        // deposit 30% of 31800 = 9540
        $this->assertSame(22000, $quote['stay_subtotal']);
        $this->assertSame(2000, $quote['weekend_surcharge']);
        $this->assertSame(3000, $quote['addons_total']);
        $this->assertSame(5000, $quote['cleaning_fee']);
        $this->assertSame(30000, $quote['subtotal']);
        $this->assertSame(1800, $quote['sst_amount']);
        $this->assertSame(31800, $quote['total']);
        $this->assertSame(9540, $quote['deposit_amount']);
    }
}
