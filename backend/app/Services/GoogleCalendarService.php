<?php

namespace App\Services;

use Google\Client;
use Google\Service\Calendar;
use Google\Service\Calendar\Event;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService
{
    protected $client;
    protected $calendarId;

    public function __construct()
    {
        $clientEmail = env('GOOGLE_SERVICE_ACCOUNT_EMAIL');
        $privateKeyRaw = env('GOOGLE_SERVICE_ACCOUNT_KEY');
        $this->calendarId = env('GOOGLE_CALENDAR_ID');

        if (!$clientEmail || !$privateKeyRaw || !$this->calendarId) {
            Log::warning('Google Calendar environment variables are incomplete.');
            return;
        }

        $privateKey = str_replace('\n', "\n", $privateKeyRaw);

        $this->client = new Client();
        $this->client->setAuthConfig([
            'type' => 'service_account',
            'client_email' => $clientEmail,
            'private_key' => $privateKey,
        ]);
        $this->client->addScope(Calendar::CALENDAR);
    }

    /**
     * Create an event in Google Calendar.
     */
    public function createEvent($summary, $description, $start, $end)
    {
        if (!$this->client) {
            return null;
        }

        try {
            $service = new Calendar($this->client);
            $event = new Event([
                'summary' => $summary,
                'description' => $description,
                'start' => [
                    'dateTime' => $start->toIso8601String(),
                ],
                'end' => [
                    'dateTime' => $end->toIso8601String(),
                ],
            ]);

            $createdEvent = $service->events->insert($this->calendarId, $event);
            return $createdEvent->getId();
        } catch (\Exception $e) {
            Log::error('Failed to create Google Calendar event: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete an event in Google Calendar.
     */
    public function deleteEvent($eventId)
    {
        if (!$this->client || !$eventId) {
            return;
        }

        try {
            $service = new Calendar($this->client);
            $service->events->delete($this->calendarId, $eventId);
        } catch (\Exception $e) {
            Log::error('Failed to delete Google Calendar event: ' . $e->getMessage());
        }
    }
}
