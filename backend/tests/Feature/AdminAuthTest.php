<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The BasicAdminAuth middleware guards every /api/admin/* route. It reads
 * ADMIN_USERNAME / ADMIN_PASSWORD from env (seeded by phpunit.xml as
 * admin / secret-pass) and compares with hash_equals, so these tests pin the
 * outcomes: no creds, wrong creds, and correct creds.
 */
class AdminAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_request_without_credentials_is_unauthorized(): void
    {
        $this->getJson('/api/admin/services')
            ->assertStatus(401)
            ->assertJson(['error' => 'Unauthorized'])
            ->assertHeader('WWW-Authenticate', 'Basic realm="Admin API"');
    }

    public function test_request_with_wrong_password_is_unauthorized(): void
    {
        $this->withHeaders([
            'Authorization' => 'Basic ' . base64_encode('admin:wrong'),
        ])->getJson('/api/admin/services')
            ->assertStatus(401);
    }

    public function test_request_with_correct_credentials_passes(): void
    {
        $this->withHeaders([
            'Authorization' => 'Basic ' . base64_encode('admin:secret-pass'),
        ])->getJson('/api/admin/services')
            ->assertStatus(200);
    }

    public function test_wrong_username_is_unauthorized(): void
    {
        $this->withHeaders([
            'Authorization' => 'Basic ' . base64_encode('not-admin:secret-pass'),
        ])->getJson('/api/admin/services')
            ->assertStatus(401);
    }

    public function test_public_endpoints_need_no_credentials(): void
    {
        // Sanity check that the guard only applies to /api/admin/*.
        $this->getJson('/api/services')->assertStatus(200);
    }
}
