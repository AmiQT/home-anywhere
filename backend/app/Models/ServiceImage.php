<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'path',
        'alt',
        'is_primary',
        'sort_order',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = ['url'];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Path-only URL for the stored image. We deliberately avoid
     * Storage::disk('public')->url() because that returns an absolute URL
     * built from APP_URL — which embeds the backend's port and breaks
     * when the frontend proxies /storage/* on a different origin.
     *
     * Returning "/storage/..." keeps the request same-origin from the
     * browser's perspective. The Next.js rewrite in next.config.mjs
     * forwards it to Laravel's storage:link.
     */
    public function getUrlAttribute(): string
    {
        return '/storage/' . ltrim($this->path, '/');
    }
}
