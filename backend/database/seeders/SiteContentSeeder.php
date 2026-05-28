<?php

namespace Database\Seeders;

use App\Models\SiteContent;
use Illuminate\Database\Seeder;

class SiteContentSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'hero' => [
                'badge' => 'New stays added every week',
                'title' => 'Find your stay, anywhere you go.',
                'subtitle' => 'Discover thoughtfully curated boutique homestays across Malaysia. Real-time availability, secure deposits, and instant calendar confirmation — all in one clean booking flow.',
                'cta_primary' => 'Find a stay',
                'cta_secondary' => 'Browse stays',
            ],
            'trust_stats' => [
                ['value' => '500+', 'label' => 'Listed homestays'],
                ['value' => '10k+', 'label' => 'Happy guests'],
                ['value' => '4.9★', 'label' => 'Average rating'],
                ['value' => '24/7', 'label' => 'Guest support'],
            ],
            'headings' => [
                'stays_eyebrow' => 'Available stays',
                'stays_title' => 'Live availability',
                'stays_description' => 'Real homestays loaded from the platform. Pick one, check open dates, and lock it in within minutes.',
                'destinations_eyebrow' => 'Destinations',
                'destinations_title' => 'Popular places to wander',
                'destinations_description' => 'A handpicked sample of where our guests love to stay.',
                'testimonials_eyebrow' => 'What guests say',
                'testimonials_title' => 'Trusted by travelers across Malaysia',
            ],
            'how_it_works' => [
                'eyebrow' => 'How it works',
                'title' => 'Book in four simple steps',
                'description' => 'A streamlined flow from discovery to check-in. No back-and-forth, no hidden fees.',
                'items' => [
                    ['icon' => 'search', 'n' => '01', 'title' => 'Pick a stay', 'description' => 'Browse curated boutique homestays across Malaysia.'],
                    ['icon' => 'calendar', 'n' => '02', 'title' => 'Choose your dates', 'description' => 'See real availability and pick check-in instantly.'],
                    ['icon' => 'shield', 'n' => '03', 'title' => 'Lock with deposit', 'description' => 'Secure card payment, 30% deposit to confirm.'],
                    ['icon' => 'sparkles', 'n' => '04', 'title' => 'Enjoy your stay', 'description' => 'Get the calendar invite and check in stress-free.'],
                ],
            ],
            'features' => [
                'eyebrow' => 'Why Home Anywhere',
                'title' => 'The cleanest way to book a homestay',
                'description' => 'We strip out the noise so you can focus on the trip — not the booking flow.',
                'items' => [
                    ['icon' => 'shield', 'title' => 'Secure deposits', 'description' => 'PCI-compliant Stripe checkout. Only 30% to confirm — pay the rest on check-in.'],
                    ['icon' => 'calendar', 'title' => 'Live availability', 'description' => 'Real-time slots straight from the host calendar. No double bookings, ever.'],
                    ['icon' => 'users', 'title' => 'Verified hosts', 'description' => 'Every listing reviewed by our team before going live on the platform.'],
                    ['icon' => 'map-pin', 'title' => 'Curated locations', 'description' => 'From beachfront villas to highland retreats and heritage city stays.'],
                    ['icon' => 'sparkles', 'title' => 'Instant invites', 'description' => 'Calendar invite + confirmation email the moment your deposit clears.'],
                    ['icon' => 'heart', 'title' => 'Guest-first support', 'description' => 'A real human on standby — chat, email, or phone, 24/7.'],
                ],
            ],
            'testimonials' => [
                [
                    'quote' => 'Booking was effortless. Calendar invite hit my inbox in seconds and the villa was exactly as listed.',
                    'author' => 'Aiman R.',
                    'role' => 'Family of 4',
                ],
                [
                    'quote' => 'Loved that I only paid the deposit upfront. Settled the rest at check-in, no surprise fees.',
                    'author' => 'Priya S.',
                    'role' => 'Solo traveler',
                ],
                [
                    'quote' => 'Found a heritage home in Melaka that no other platform listed. Will definitely book again.',
                    'author' => 'Daniel W.',
                    'role' => 'Couple retreat',
                ],
            ],
            'cta_banner' => [
                'title' => 'Your next stay is one click away.',
                'description' => 'Pick a homestay, choose your dates, lock it with a deposit — and get back to planning the fun parts.',
                'cta_primary' => 'Book a stay',
                'cta_secondary' => 'Browse all stays',
            ],
            'footer' => [
                'description' => 'Trusted homestay booking platform. Real availability, secure deposits, instant calendar confirmation — anywhere you stay.',
                'email' => 'hello@homeanywhere.co',
                'phone' => '+60 12-345 6789',
                'location' => 'Kuala Lumpur, Malaysia',
            ],
        ];

        SiteContent::setMap($defaults);
    }
}
