<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PricingSetting extends Model
{
    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'array',
    ];

    /**
     * Default values used when a row is missing. Keeps the calculation
     * engine deterministic even on a fresh install before seeding runs.
     */
    public const DEFAULTS = [
        'sst_enabled' => false,
        'sst_rate' => 6.0,
        'weekend_pricing_enabled' => false,
        'weekend_surcharge_pct' => 20.0,
        'weekend_days' => ['sat', 'sun'],
        'default_deposit_pct' => 30,
        'cleaning_fee_enabled' => false,
        'cleaning_fee_amount' => 0,
    ];

    /**
     * Fetch all rows merged with defaults so callers always get a full
     * config array.
     */
    public static function asMap(): array
    {
        $stored = static::query()->pluck('value', 'key')->toArray();
        $merged = self::DEFAULTS;
        foreach ($stored as $key => $value) {
            if (array_key_exists($key, $merged)) {
                $merged[$key] = $value;
            }
        }
        return $merged;
    }

    /**
     * Bulk upsert rows from a keyed associative array. Only keys present
     * in DEFAULTS are persisted to avoid junk config bloat.
     */
    public static function setMap(array $map): void
    {
        foreach ($map as $key => $value) {
            if (!array_key_exists($key, self::DEFAULTS)) {
                continue;
            }
            static::updateOrCreate(
                ['key' => $key],
                ['value' => $value],
            );
        }
    }
}
