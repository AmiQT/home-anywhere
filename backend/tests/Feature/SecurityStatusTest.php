<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * /api/admin/security-status backs the dashboard's weak-password banner. It
 * sits behind admin auth and reports whether ADMIN_PASSWORD is still a weak
 * placeholder. The test env (phpunit.xml) sets a strong 'secret-pass', so the
 * endpoint should report not-weak here; auth enforcement is also pinned.
 */
class SecurityStatusTest extends TestCase
{
    use RefreshDatabase;

    private function authHeaders(): array
    {
        return [
            'Authorization' => 'Basic ' . base64_encode('admin:secret-pass'),
        ];
    }

    public function test_requires_admin_auth(): void
    {
        $this->getJson('/api/admin/security-status')->assertStatus(401);
    }

    public function test_reports_not_weak_for_strong_configured_password(): void
    {
        $this->withHeaders($this->authHeaders())
            ->getJson('/api/admin/security-status')
            ->assertStatus(200)
            ->assertJson(['password' => ['weak' => false]]);
    }

    public function test_reports_weak_when_password_is_placeholder(): void
    {
        config(['app.env' => 'testing']);
        putenv('ADMIN_PASSWORD=change-me');
        $_ENV['ADMIN_PASSWORD'] = 'change-me';

        try {
            $this->withHeaders([
                'Authorization' => 'Basic ' . base64_encode('admin:change-me'),
            ])
                ->getJson('/api/admin/security-status')
                ->assertStatus(200)
                ->assertJson(['password' => ['weak' => true]]);
        } finally {
            putenv('ADMIN_PASSWORD=secret-pass');
            $_ENV['ADMIN_PASSWORD'] = 'secret-pass';
        }
    }
}
