<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\Slot;
use App\Models\Booking;
use App\Services\PricingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Stripe\StripeClient;

class BookingController extends Controller
{
    public function __construct(private PricingService $pricing) {}

    /**
     * Create a new booking with custom check-in / check-out dates.
     *
     * The frontend sends the guest's chosen date range. We auto-create a
     * Slot record covering that range (default times: 14:00 check-in,
     * 12:00 check-out) and attach the booking to it. Existing Slot rows
     * — whether admin-blocked or backing an active booking — act as
     * blackout ranges that this booking cannot overlap.
     */
    public function createBooking(Request $request)
    {
        $validated = $request->validate([
            'serviceId' => 'required|integer|exists:services,id',
            'checkInDate' => 'required|date',
            'checkOutDate' => 'required|date|after:checkInDate',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'addonIds' => 'nullable|array',
            'addonIds.*' => 'integer|exists:addons,id',
        ]);

        $serviceId = $validated['serviceId'];
        $checkIn = Carbon::parse($validated['checkInDate'])->setTime(14, 0, 0);
        $checkOut = Carbon::parse($validated['checkOutDate'])->setTime(12, 0, 0);

        $service = Service::with('addons')->find($serviceId);
        if (!$service) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        // Enforce minimum nights = service.duration
        $nights = $checkIn->copy()->startOfDay()->diffInDays($checkOut->copy()->startOfDay());
        if ($nights < $service->duration) {
            return response()->json([
                'error' => "Minimum stay is {$service->duration} night(s).",
            ], 422);
        }

        // Block past dates (allow same-day check-in)
        if ($checkIn->lt(Carbon::today())) {
            return response()->json([
                'error' => 'Check-in must be today or later.',
            ], 422);
        }

        // Validate add-ons belong to the service
        $validAddonIds = $service->addons->pluck('id')->toArray();
        $addonIds = array_intersect(
            $validated['addonIds'] ?? [],
            $validAddonIds,
        );

        try {
            $booking = DB::transaction(function () use (
                $serviceId,
                $checkIn,
                $checkOut,
                $addonIds,
                $validated,
            ) {
                // Check overlap with existing blocking slots for this service.
                // A slot blocks if it has no bookings (admin-blocked) OR has at
                // least one active (pending/confirmed) booking.
                $conflict = Slot::where('service_id', $serviceId)
                    ->where('start', '<', $checkOut)
                    ->where('end', '>', $checkIn)
                    ->get()
                    ->first(function ($slot) {
                        if ($slot->bookings()->count() === 0) {
                            return true; // admin-blocked
                        }
                        return $slot->bookings()
                            ->whereIn('status', ['pending', 'confirmed'])
                            ->exists();
                    });

                if ($conflict) {
                    throw new \Exception('dates_unavailable');
                }

                // Auto-create slot for this booking
                $slot = Slot::create([
                    'service_id' => $serviceId,
                    'start' => $checkIn,
                    'end' => $checkOut,
                    'capacity' => 1,
                ]);

                $booking = Booking::create([
                    'service_id' => $serviceId,
                    'slot_id' => $slot->id,
                    'customer_name' => $validated['name'],
                    'customer_email' => $validated['email'],
                    'customer_phone' => $validated['phone'] ?? null,
                    'status' => 'pending',
                ]);

                if (!empty($addonIds)) {
                    $booking->addons()->attach($addonIds);
                }

                return $booking;
            });

            // All booking math (stay, add-ons, weekend surcharge, SST,
            // cleaning fee, deposit) lives in PricingService — the same
            // path the frontend preview hits, so the charged amount
            // always matches what the guest saw.
            $quote = $this->pricing->calculate(
                $service,
                $checkIn,
                $checkOut,
                $addonIds,
            );
            $deposit = $quote['deposit_amount'];
            $appUrl = env('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

            // Stripe checkout
            $stripeKey = env('STRIPE_SECRET_KEY');
            $stripe = $stripeKey ? new StripeClient($stripeKey) : null;

            if (!$stripe) {
                // Demo mode — confirm immediately
                $booking->update(['status' => 'confirmed']);
                return response()->json([
                    'checkoutUrl' => "{$appUrl}/success?bookingId={$booking->id}",
                    'id' => $booking->id,
                ]);
            }

            $session = $stripe->checkout->sessions::create([
                'mode' => 'payment',
                'payment_method_types' => ['card'],
                'line_items' => [
                    [
                        'price_data' => [
                            'currency' => 'myr',
                            'product_data' => ['name' => 'Booking Deposit'],
                            'unit_amount' => $deposit,
                        ],
                        'quantity' => 1,
                    ],
                ],
                'success_url' => "{$appUrl}/success?bookingId={$booking->id}",
                'cancel_url' => "{$appUrl}/book",
                'metadata' => ['bookingId' => (string)$booking->id],
            ]);

            return response()->json([
                'checkoutUrl' => $session->url,
                'id' => $booking->id,
            ]);

        } catch (\Exception $e) {
            if ($e->getMessage() === 'dates_unavailable') {
                return response()->json([
                    'error' => 'Those dates are no longer available. Please pick a different range.',
                ], 409);
            }
            return response()->json([
                'error' => 'Unable to create booking: ' . $e->getMessage(),
            ], 500);
        }
    }
}
