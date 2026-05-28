<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Service;
use App\Models\Addon;
use App\Models\Slot;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 0. Disable foreign key constraints and truncate tables for idempotency
        Schema::disableForeignKeyConstraints();
        User::truncate();
        Service::truncate();
        Addon::truncate();
        Slot::truncate();
        Schema::enableForeignKeyConstraints();

        // 1. Default User — local dev only. Override via env in production.
        // Use SEED_ADMIN_PASSWORD if set; otherwise generate a random one and
        // print it to the console so no weak default ever ships or persists.
        $adminPassword = env('SEED_ADMIN_PASSWORD');
        $generatedPassword = $adminPassword === null;
        if ($generatedPassword) {
            $adminPassword = \Illuminate\Support\Str::password(16);
        }

        $adminEmail = env('SEED_ADMIN_EMAIL', 'admin@home-anywhere.local');

        User::factory()->create([
            'name' => env('SEED_ADMIN_NAME', 'Admin'),
            'email' => $adminEmail,
            'password' => bcrypt($adminPassword),
        ]);

        if ($generatedPassword) {
            $this->command->warn('No SEED_ADMIN_PASSWORD set — generated a random admin password:');
            $this->command->line("  email:    {$adminEmail}");
            $this->command->line("  password: {$adminPassword}");
            $this->command->warn('Save it now. Set SEED_ADMIN_PASSWORD in .env to choose your own.');
        }

        // 2. Homestay 1: Villa Langkawi Seaview
        $villa1 = Service::create([
            'id' => 1,
            'name' => 'Villa Langkawi Seaview 🌊',
            'duration' => 2,        // minimum 2 nights
            'price' => 40000,       // RM 400 / night
            'deposit_pct' => 30,    // 30% of total
        ]);

        // 3. Homestay 2: Cameron Highland Retreat
        $villa2 = Service::create([
            'id' => 2,
            'name' => 'Cameron Highland Retreat 🌄',
            'duration' => 3,        // minimum 3 nights
            'price' => 20000,       // RM 200 / night
            'deposit_pct' => 30,
        ]);

        // 4. Homestay 3: KL City Apartment
        $villa3 = Service::create([
            'id' => 3,
            'name' => 'KL City Apartment 🏙️',
            'duration' => 1,        // minimum 1 night
            'price' => 35000,       // RM 350 / night
            'deposit_pct' => 30,
        ]);

        // Add-ons untuk Villa Langkawi
        Addon::create(['name' => 'BBQ Set & Grill 🍖', 'price' => 5000, 'service_id' => $villa1->id]);
        Addon::create(['name' => 'Extra Breakfast 🍳', 'price' => 3000, 'service_id' => $villa1->id]);
        Addon::create(['name' => 'Airport Pickup 🚗', 'price' => 8000, 'service_id' => $villa1->id]);

        // Add-ons untuk Cameron Highland
        Addon::create(['name' => 'Tea Plantation Tour 🍵', 'price' => 4000, 'service_id' => $villa2->id]);
        Addon::create(['name' => 'Strawberry Farm Visit 🍓', 'price' => 3500, 'service_id' => $villa2->id]);

        // Add-ons untuk KL Apartment
        Addon::create(['name' => 'Late Checkout (2PM) ⏰', 'price' => 2000, 'service_id' => $villa3->id]);
        Addon::create(['name' => 'Parking Pass 🅿️', 'price' => 1500, 'service_id' => $villa3->id]);

        // Generate Available Slots
        $now = Carbon::now();

        // Slot 1: Tomorrow 2PM check-in
        $slot1Start = $now->copy()->addDay()->setTime(14, 0, 0);
        $slot1End = $slot1Start->copy()->addDays(2)->setTime(12, 0, 0); // checkout 12PM
        Slot::create([
            'service_id' => $villa1->id,
            'start' => $slot1Start,
            'end' => $slot1End,
            'capacity' => 1,
        ]);

        // Slot 2: 3 days later
        $slot2Start = $now->copy()->addDays(3)->setTime(15, 0, 0);
        $slot2End = $slot2Start->copy()->addDays(3)->setTime(11, 0, 0);
        Slot::create([
            'service_id' => $villa2->id,
            'start' => $slot2Start,
            'end' => $slot2End,
            'capacity' => 1,
        ]);

        // Slot 3: Weekend slot
        $slot3Start = $now->copy()->addDays(5)->setTime(15, 0, 0);
        $slot3End = $slot3Start->copy()->addDay()->setTime(12, 0, 0);
        Slot::create([
            'service_id' => $villa3->id,
            'start' => $slot3Start,
            'end' => $slot3End,
            'capacity' => 1,
        ]);

        // Seed default site content (CMS)
        $this->call(SiteContentSeeder::class);

        // Seed default pricing rules (SST, weekend surcharge, deposit %)
        $this->call(PricingSettingSeeder::class);
    }
}
