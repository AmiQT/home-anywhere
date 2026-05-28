<?php

namespace App\Services;

use App\Models\Notification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send an email notification.
     */
    public function sendEmail($bookingId, $to, $subject, $html)
    {
        $host = env('SMTP_HOST');
        $user = env('SMTP_USER');
        $pass = env('SMTP_PASS');

        if (!$host || !$user || !$pass) {
            Log::warning('SMTP environment variables are incomplete. Log only.');
            
            // Console log fallback
            Log::info("Email notification to {$to} [Subject: {$subject}]: {$html}");

            Notification::create([
                'booking_id' => $bookingId,
                'channel' => 'email',
                'template' => $subject,
                'status' => 'sent', // Mark as sent since it was handled by fallback log
                'meta' => ['note' => 'SMTP variables missing, output sent to log'],
            ]);
            return;
        }

        try {
            $fromName = config('app.name', 'Home Anywhere');
            Mail::html($html, function ($message) use ($to, $subject, $user, $fromName) {
                $message->from($user, $fromName)
                    ->to($to)
                    ->subject($subject);
            });

            Notification::create([
                'booking_id' => $bookingId,
                'channel' => 'email',
                'template' => $subject,
                'status' => 'sent',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send email: ' . $e->getMessage());
            Notification::create([
                'booking_id' => $bookingId,
                'channel' => 'email',
                'template' => $subject,
                'status' => 'failed',
                'meta' => ['error' => $e->getMessage()],
            ]);
        }
    }

    /**
     * Send a WhatsApp notification (Stub).
     */
    public function sendWhatsApp($bookingId, $phone, $message)
    {
        Log::info("WhatsApp to {$phone}: {$message}");
        
        Notification::create([
            'booking_id' => $bookingId,
            'channel' => 'whatsapp',
            'template' => substr($message, 0, 50) . '...',
            'status' => 'sent',
            'meta' => ['phone' => $phone],
        ]);
    }
}
