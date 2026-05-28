<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'slot_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'status',
        'payment_ref',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function slot()
    {
        return $this->belongsTo(Slot::class);
    }

    public function addons()
    {
        return $this->belongsToMany(Addon::class, 'booking_addon');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
