<?php

namespace App\Http\Controllers;

use App\Models\PricingSetting;
use App\Models\Service;
use App\Models\ServiceImage;
use App\Models\SiteContent;
use App\Models\Slot;
use App\Models\Booking;
use App\Services\GoogleCalendarService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Stripe\StripeClient;

class AdminController extends Controller
{
    protected $calendarService;
    protected $notificationService;

    public function __construct(GoogleCalendarService $calendarService, NotificationService $notificationService)
    {
        $this->calendarService = $calendarService;
        $this->notificationService = $notificationService;
    }

    // ==========================================
    // SERVICES CRUD
    // ==========================================

    public function getServices()
    {
        $services = Service::with('images')->get();
        return response()->json($services);
    }

    public function createService(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'duration' => 'required|integer|min:1',
            'price' => 'required|integer|min:0',
            'deposit_pct' => 'nullable|integer|min:0|max:100',
        ]);

        $service = Service::create($validated);
        return response()->json($service, 201);
    }

    public function updateService(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|integer|exists:services,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'duration' => 'required|integer|min:1',
            'price' => 'required|integer|min:0',
            'deposit_pct' => 'nullable|integer|min:0|max:100',
        ]);

        $service = Service::find($validated['id']);
        $service->update($validated);
        return response()->json($service);
    }

    public function deleteService(Request $request)
    {
        $id = $request->query('id');
        if (!$id) {
            return response()->json(['error' => 'id required'], 400);
        }

        $service = Service::find($id);
        if (!$service) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        $service->delete();
        return response()->json(['ok' => true]);
    }

    // ==========================================
    // SERVICE IMAGES
    // ==========================================

    /**
     * Upload an image for a service. Multipart/form-data with `image` field.
     */
    public function uploadServiceImage(Request $request, $serviceId)
    {
        $service = Service::find($serviceId);
        if (!$service) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        $validated = $request->validate([
            'image' => 'required|file|image|mimes:jpeg,jpg,png,webp|max:3072', // 3MB
            'alt' => 'nullable|string|max:255',
        ]);

        $path = $request->file('image')->store('services', 'public');

        $existingCount = $service->images()->count();

        $image = ServiceImage::create([
            'service_id' => $service->id,
            'path' => $path,
            'alt' => $validated['alt'] ?? null,
            'is_primary' => $existingCount === 0, // first image becomes primary
            'sort_order' => $existingCount,
        ]);

        return response()->json($image, 201);
    }

    /**
     * Delete a service image (file + DB row).
     */
    public function deleteServiceImage($id)
    {
        $image = ServiceImage::find($id);
        if (!$image) {
            return response()->json(['error' => 'Image not found'], 404);
        }

        $serviceId = $image->service_id;
        $wasPrimary = $image->is_primary;

        Storage::disk('public')->delete($image->path);
        $image->delete();

        // If we deleted the primary, promote the next available image
        if ($wasPrimary) {
            $next = ServiceImage::where('service_id', $serviceId)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->first();
            if ($next) {
                $next->update(['is_primary' => true]);
            }
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Mark an image as the primary one for its service.
     */
    public function setPrimaryServiceImage($id)
    {
        $image = ServiceImage::find($id);
        if (!$image) {
            return response()->json(['error' => 'Image not found'], 404);
        }

        ServiceImage::where('service_id', $image->service_id)
            ->update(['is_primary' => false]);

        $image->update(['is_primary' => true]);

        return response()->json($image->fresh());
    }

    // ==========================================
    // SITE CONTENT (CMS)
    // ==========================================

    public function getSiteContent()
    {
        return response()->json(SiteContent::asMap());
    }

    /**
     * Bulk upsert site content. Expects a flat JSON object where each
     * top-level key maps to its full value (object or array).
     */
    public function updateSiteContent(Request $request)
    {
        $payload = $request->all();

        if (!is_array($payload) || empty($payload)) {
            return response()->json(['error' => 'Empty payload'], 400);
        }

        SiteContent::setMap($payload);

        return response()->json(SiteContent::asMap());
    }

    // ==========================================
    // PRICING SETTINGS (CMS)
    // ==========================================

    public function getPricingSettings()
    {
        return response()->json(PricingSetting::asMap());
    }

    /**
     * Bulk upsert pricing rules. Validates the incoming shape so admins
     * cannot brick the calculator by saving the wrong types.
     */
    public function updatePricingSettings(Request $request)
    {
        $validated = $request->validate([
            'sst_enabled' => 'sometimes|boolean',
            'sst_rate' => 'sometimes|numeric|min:0|max:100',
            'weekend_pricing_enabled' => 'sometimes|boolean',
            'weekend_surcharge_pct' => 'sometimes|numeric|min:0|max:500',
            'weekend_days' => 'sometimes|array',
            'weekend_days.*' => 'string|in:sun,mon,tue,wed,thu,fri,sat',
            'default_deposit_pct' => 'sometimes|integer|min:0|max:100',
            'cleaning_fee_enabled' => 'sometimes|boolean',
            'cleaning_fee_amount' => 'sometimes|integer|min:0',
        ]);

        if (empty($validated)) {
            return response()->json(['error' => 'Empty payload'], 400);
        }

        PricingSetting::setMap($validated);

        return response()->json(PricingSetting::asMap());
    }

    // ==========================================
    // SLOTS CRUD
    // ==========================================

    public function getSlots()
    {
        $slots = Slot::with(['service', 'bookings'])->get();
        return response()->json($slots);
    }

    public function createSlot(Request $request)
    {
        $validated = $request->validate([
            'serviceId' => 'required|integer|exists:services,id',
            'start' => 'required|date',
            'end' => 'required|date|after:start',
            'capacity' => 'required|integer|min:1',
        ]);

        $slot = Slot::create([
            'service_id' => $validated['serviceId'],
            'start' => $validated['start'],
            'end' => $validated['end'],
            'capacity' => $validated['capacity'],
        ]);

        return response()->json($slot, 201);
    }

    public function deleteSlot(Request $request)
    {
        $id = $request->query('id');
        if (!$id) {
            return response()->json(['error' => 'id required'], 400);
        }

        $slot = Slot::find($id);
        if (!$slot) {
            return response()->json(['error' => 'Slot not found'], 404);
        }

        $slot->delete();
        return response()->json(['ok' => true]);
    }

    // ==========================================
    // BOOKINGS & CANCELLATION
    // ==========================================

    public function getBookings()
    {
        $bookings = Booking::with(['service', 'slot', 'addons'])->get();
        return response()->json($bookings);
    }

    public function cancelBooking(Request $request)
    {
        $validated = $request->validate([
            'bookingId' => 'required|integer|exists:bookings,id',
        ]);

        $booking = Booking::with('slot')->find($validated['bookingId']);

        if ($booking->status === 'cancelled') {
            return response()->json(['error' => 'Already cancelled'], 400);
        }

        // 1. Delete Google Calendar Event if exists
        if ($booking->slot && $booking->slot->gcal_event_id) {
            try {
                $this->calendarService->deleteEvent($booking->slot->gcal_event_id);
                $booking->slot->update(['gcal_event_id' => null]);
            } catch (\Exception $err) {
                Log::error('Failed to delete Google Calendar event during cancel: ' . $err->getMessage());
            }
        }

        // 2. Refund via Stripe if payment reference exists
        $stripeKey = env('STRIPE_SECRET_KEY');
        if ($stripeKey && $booking->payment_ref) {
            try {
                $stripe = new StripeClient($stripeKey);
                $session = $stripe->checkout->sessions->retrieve($booking->payment_ref);

                if ($session->payment_intent && is_string($session->payment_intent)) {
                    $stripe->refunds->create([
                        'payment_intent' => $session->payment_intent,
                    ]);
                }
            } catch (\Exception $err) {
                Log::error('Failed to issue Stripe refund during cancel: ' . $err->getMessage());
            }
        }

        // 3. Update status to cancelled
        $booking->update(['status' => 'cancelled']);

        // 4. Free up the slot if no other active bookings reference it.
        // (Slots are auto-created per booking now, so most cancellations
        // should result in the slot being removed.)
        if ($booking->slot) {
            $otherActive = Booking::where('slot_id', $booking->slot_id)
                ->whereIn('status', ['pending', 'confirmed'])
                ->where('id', '!=', $booking->id)
                ->exists();

            if (!$otherActive) {
                $booking->slot->delete();
            }
        }

        return response()->json([
            'ok' => true,
            'booking' => $booking->fresh()
        ]);
    }
}
