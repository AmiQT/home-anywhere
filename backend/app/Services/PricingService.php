<?php

namespace App\Services;

use App\Models\PricingSetting;
use App\Models\Service;
use Carbon\Carbon;

/**
 * Single source of truth for booking math. Both the booking flow and
 * the frontend preview endpoint go through this class so the totals
 * shown to the guest always match what gets charged.
 *
 * All money values are integer cents to match how Stripe and the
 * services.price column already store amounts.
 */
class PricingService
{
    private const DAY_KEYS = [
        Carbon::SUNDAY => 'sun',
        Carbon::MONDAY => 'mon',
        Carbon::TUESDAY => 'tue',
        Carbon::WEDNESDAY => 'wed',
        Carbon::THURSDAY => 'thu',
        Carbon::FRIDAY => 'fri',
        Carbon::SATURDAY => 'sat',
    ];

    /**
     * Calculate full pricing breakdown for a stay.
     *
     * @param  Service  $service  loaded with addons relation
     * @param  Carbon   $checkIn
     * @param  Carbon   $checkOut
     * @param  int[]    $addonIds  ids must belong to $service->addons
     * @return array{
     *   nights:int,
     *   weekend_nights:int,
     *   weekday_nights:int,
     *   stay_subtotal:int,
     *   weekend_surcharge:int,
     *   addons_total:int,
     *   cleaning_fee:int,
     *   subtotal:int,
     *   sst_amount:int,
     *   total:int,
     *   deposit_pct:int,
     *   deposit_amount:int,
     *   currency:string,
     *   breakdown:array<int,array{date:string,is_weekend:bool,amount:int}>,
     *   settings:array<string,mixed>
     * }
     */
    public function calculate(
        Service $service,
        Carbon $checkIn,
        Carbon $checkOut,
        array $addonIds = []
    ): array {
        $settings = PricingSetting::asMap();
        $nights = $checkIn->copy()->startOfDay()
            ->diffInDays($checkOut->copy()->startOfDay());

        $weekendDays = array_map('strtolower', $settings['weekend_days']);
        $weekendEnabled = (bool) $settings['weekend_pricing_enabled'];
        $surchargePct = (float) $settings['weekend_surcharge_pct'];

        $breakdown = [];
        $stayBase = 0;
        $weekendSurcharge = 0;
        $weekendNightCount = 0;
        $cursor = $checkIn->copy()->startOfDay();

        for ($i = 0; $i < $nights; $i++) {
            $dayKey = self::DAY_KEYS[$cursor->dayOfWeek];
            $isWeekend = $weekendEnabled && in_array($dayKey, $weekendDays, true);
            $nightAmount = $service->price;
            $nightSurcharge = 0;

            if ($isWeekend) {
                $nightSurcharge = (int) floor($service->price * $surchargePct / 100);
                $nightAmount += $nightSurcharge;
                $weekendNightCount++;
            }

            $stayBase += $service->price;
            $weekendSurcharge += $nightSurcharge;

            $breakdown[] = [
                'date' => $cursor->toDateString(),
                'is_weekend' => $isWeekend,
                'amount' => $nightAmount,
            ];

            $cursor->addDay();
        }

        $stayTotal = $stayBase + $weekendSurcharge;

        $validAddonIds = $service->addons->pluck('id')->toArray();
        $appliedAddonIds = array_values(array_intersect($addonIds, $validAddonIds));
        $addonsTotal = (int) $service->addons
            ->whereIn('id', $appliedAddonIds)
            ->sum('price');

        $cleaningFee = $settings['cleaning_fee_enabled']
            ? (int) $settings['cleaning_fee_amount']
            : 0;

        $subtotal = $stayTotal + $addonsTotal + $cleaningFee;

        $sstAmount = 0;
        if ($settings['sst_enabled']) {
            $sstAmount = (int) floor($subtotal * (float) $settings['sst_rate'] / 100);
        }

        $total = $subtotal + $sstAmount;

        $depositPct = $service->deposit_pct ?? (int) $settings['default_deposit_pct'];
        $depositAmount = (int) floor($total * $depositPct / 100);

        return [
            'nights' => $nights,
            'weekend_nights' => $weekendNightCount,
            'weekday_nights' => $nights - $weekendNightCount,
            'stay_subtotal' => $stayTotal,
            'weekend_surcharge' => $weekendSurcharge,
            'addons_total' => $addonsTotal,
            'cleaning_fee' => $cleaningFee,
            'subtotal' => $subtotal,
            'sst_amount' => $sstAmount,
            'total' => $total,
            'deposit_pct' => $depositPct,
            'deposit_amount' => $depositAmount,
            'currency' => 'myr',
            'breakdown' => $breakdown,
            'settings' => $settings,
        ];
    }
}
