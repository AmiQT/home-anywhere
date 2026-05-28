<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The original `deposit` column stored a fixed cents amount, which didn't
 * scale with variable-length bookings (1 night vs 10 nights paid the same
 * deposit). Replace it with a percentage so the deposit is always
 * proportional to the booking total.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->unsignedTinyInteger('deposit_pct')->default(30)->after('price');
        });

        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('deposit');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->integer('deposit')->nullable()->after('price');
        });

        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('deposit_pct');
        });
    }
};
