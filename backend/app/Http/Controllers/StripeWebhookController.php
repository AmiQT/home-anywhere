<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Slot;
use App\Services\GoogleCalendarService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    protected $calendarService;
    protected $notificationService;

    public function __construct(GoogleCalendarService $calendarService, NotificationService $notificationService)
    {
        $this->calendarService = $calendarService;
        $this->notificationService = $notificationService;
    }

    /**
     * Handle incoming Stripe webhook.
     */
    public function handle(Request $request)
    {
        $stripeKey = env('STRIPE_SECRET_KEY');
        if (!$stripeKey) {
            Log::warning('Stripe webhook received but Stripe client is not configured.');
            return response()->json(['message' => 'Stripe disabled'], 200);
        }

        $webhookSecret = env('STRIPE_WEBHOOK_SECRET');
        if (!$webhookSecret) {
            Log::warning('Stripe webhook secret not configured.');
            return response()->json(['message' => 'Webhook secret not configured'], 200);
        }

        $sig = $request->header('stripe-signature');
        $payload = $request->getContent();

        if (!$sig) {
            return response()->json(['error' => 'Missing signature'], 400);
        }

        try {
            $event = Webhook::constructEvent($payload, $sig, $webhookSecret);
        } catch (\UnexpectedValueException $e) {
            // Invalid payload
            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            // Invalid signature
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        if ($event->type === 'checkout.session.completed') {
            $session = $event->data->object;
            $bookingId = isset($session->metadata->bookingId) ? (int)$session->metadata->bookingId : null;

            if ($bookingId) {
                $booking = Booking::with(['service', 'slot'])->find($bookingId);

                if ($booking) {
                    // Update booking status and payment reference
                    $booking->update([
                        'status' => 'confirmed',
                        'payment_ref' => $session->id,
                    ]);

                    // Sync to Google Calendar
                    if ($booking->slot && !$booking->slot->gcal_event_id) {
                        try {
                            $eventId = $this->calendarService->createEvent(
                                "{$booking->service->name} - {$booking->customer_name}",
                                "Booking #{$booking->id}",
                                $booking->slot->start,
                                $booking->slot->end
                            );

                            if ($eventId) {
                                $booking->slot->update(['gcal_event_id' => $eventId]);
                            }
                        } catch (\Exception $err) {
                            Log::error('Failed to create calendar event from Stripe webhook: ' . $err->getMessage());
                        }
                    }

                    // Send email notification
                    try {
                        $htmlTemplate = "<p>Hi {$booking->customer_name}, tempahan anda telah disahkan. Jumpa anda nanti!</p>";
                        $this->notificationService->sendEmail(
                            $booking->id,
                            $booking->customer_email,
                            'Tempahan Disahkan',
                            $htmlTemplate
                        );
                    } catch (\Exception $err) {
                        Log::error('Failed to send confirmation email from Stripe webhook: ' . $err->getMessage());
                    }
                }
            }
        }

        return response()->json(['status' => 'ok']);
    }
}
