<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteContent extends Model
{
    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'array',
    ];

    /**
     * Fetch all rows as a keyed associative array:
     *   ['hero' => [...], 'testimonials' => [...]]
     */
    public static function asMap(): array
    {
        return static::query()
            ->pluck('value', 'key')
            ->toArray();
    }

    /**
     * Bulk upsert rows from a keyed associative array.
     */
    public static function setMap(array $map): void
    {
        foreach ($map as $key => $value) {
            static::updateOrCreate(
                ['key' => $key],
                ['value' => $value],
            );
        }
    }
}
