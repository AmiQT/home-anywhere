<?php

namespace Database\Seeders;

use App\Models\PricingSetting;
use Illuminate\Database\Seeder;

class PricingSettingSeeder extends Seeder
{
    public function run(): void
    {
        PricingSetting::setMap(PricingSetting::DEFAULTS);
    }
}
