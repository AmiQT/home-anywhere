<?php

namespace App\Http\Controllers;

use App\Models\PricingSetting;
use App\Models\Service;
use App\Models\SiteContent;
use App\Models\Slot;
use App\Services\PricingService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ApiController extends Controller
{
    /**
     * Get all services with their addons.
     */
    public function getServices()
    {
        $services = Service::with(['addons', 'images'])->get();
        return response()->json($services);
    }

    /**
     * Get available slots for a given service.
     */
    /**
     * Return blocking date ranges for a service. The frontend uses these to
     * grey out unavailable dates on the calendar picker.
     *
     * A slot blocks if either:
     *  - It has no bookings (admin-created blackout range), OR
     *  - It has at least one active booking (pending / confirmed)
     *
     * Slots whose bookings are all cancelled are considered free.
     */
    public function getSlots(Request $request)
    {
        $serviceId = $request->query('serviceId');

        if (!$serviceId) {
            return response()->json(['error' => 'serviceId required'], 400);
        }

        $slots = Slot::with('bookings:id,slot_id,status')
            ->where('service_id', $serviceId)
            ->orderBy('start', 'asc')
            ->get()
            ->filter(function ($slot) {
                if ($slot->bookings->isEmpty()) {
                    return true; // admin-blocked
                }
                return $slot->bookings
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->isNotEmpty();
            })
            ->values()
            ->map(fn ($slot) => [
                'id' => $slot->id,
                'start' => $slot->start,
                'end' => $slot->end,
            ]);

        return response()->json($slots);
    }

    /**
     * Public site content (hero text, stats, testimonials, CTA).
     * Returns a keyed map; frontend falls back to defaults if a key is missing.
     */
    public function getSiteContent()
    {
        return response()->json(SiteContent::asMap());
    }

    /**
     * Read-only view of the active pricing rules. Used by the frontend
     * to render disclaimer copy ("Prices include 6% SST") without
     * needing a full preview call.
     */
    public function getPricingSettings()
    {
        return response()->json(PricingSetting::asMap());
    }

    /**
     * Calculate the full price breakdown for a tentative booking.
     * Frontend calls this on every input change so the displayed total
     * always matches what the booking endpoint will charge.
     */
    public function previewPricing(Request $request, PricingService $pricing)
    {
        $validated = $request->validate([
            'serviceId' => 'required|integer|exists:services,id',
            'checkInDate' => 'required|date',
            'checkOutDate' => 'required|date|after:checkInDate',
            'addonIds' => 'nullable|array',
            'addonIds.*' => 'integer|exists:addons,id',
        ]);

        $service = Service::with('addons')->find($validated['serviceId']);
        $checkIn = Carbon::parse($validated['checkInDate'])->setTime(14, 0, 0);
        $checkOut = Carbon::parse($validated['checkOutDate'])->setTime(12, 0, 0);

        return response()->json(
            $pricing->calculate(
                $service,
                $checkIn,
                $checkOut,
                $validated['addonIds'] ?? [],
            ),
        );
    }
}
