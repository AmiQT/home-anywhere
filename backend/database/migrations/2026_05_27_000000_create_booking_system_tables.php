<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Services table
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('duration'); // in minutes
            $table->integer('price');    // in cents
            $table->integer('deposit')->nullable(); // in cents
            $table->timestamps();
        });

        // 2. Addons table
        Schema::create('addons', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('price'); // in cents
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade');
            $table->timestamps();
        });

        // 3. Slots table
        Schema::create('slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade');
            $table->dateTime('start');
            $table->dateTime('end');
            $table->integer('capacity')->default(1);
            $table->string('gcal_event_id')->nullable();
            $table->timestamps();
        });

        // 4. Bookings table
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade');
            $table->foreignId('slot_id')->nullable()->constrained('slots')->onDelete('set null');
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();
            $table->string('status')->default('pending'); // pending|confirmed|cancelled|refunded
            $table->string('payment_ref')->nullable();
            $table->timestamps();
        });

        // 5. Booking Addons (Pivot table)
        Schema::create('booking_addon', function (Blueprint $table) {
            $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->foreignId('addon_id')->constrained('addons')->onDelete('cascade');
            $table->primary(['booking_id', 'addon_id']);
        });

        // 6. Notifications table
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->onDelete('cascade');
            $table->string('channel'); // email|sms|whatsapp
            $table->string('template');
            $table->string('status');  // sent|failed
            $table->text('meta')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('booking_addon');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('slots');
        Schema::dropIfExists('addons');
        Schema::dropIfExists('services');
    }
};
