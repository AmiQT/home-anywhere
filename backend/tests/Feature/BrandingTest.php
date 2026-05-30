<?php

namespace Tests\Feature;

use App\Models\SiteContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Branding is owner-editable so a handed-over site shows the business's own
 * name/logo, not "Home Anywhere". Text fields ride the generic site-content
 * endpoint; the logo has its own upload that writes logo_path onto the
 * `branding` row. These pin auth, persistence, and validation.
 */
class BrandingTest extends TestCase
{
    use RefreshDatabase;

    private function authHeaders(): array
    {
        return ['Authorization' => 'Basic ' . base64_encode('admin:secret-pass')];
    }

    /**
     * A real 1x1 PNG as raw bytes. We build the file from a fixed byte string
     * rather than UploadedFile::fake()->image(), which needs the GD extension
     * (not installed in every CI/dev environment). Laravel's `image` validation
     * rule reads the header via getimagesize(), so a valid PNG header passes.
     */
    private function fakePng(string $name): UploadedFile
    {
        // 1x1 transparent PNG.
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        );
        $path = tempnam(sys_get_temp_dir(), 'logo') . '.png';
        file_put_contents($path, $png);

        return new UploadedFile($path, $name, 'image/png', null, true);
    }

    public function test_logo_upload_requires_admin_auth(): void
    {
        $this->postJson('/api/admin/branding/logo')->assertStatus(401);
    }

    public function test_site_content_put_round_trips_a_branding_block(): void
    {
        $branding = [
            'name' => 'Homestay Pak Mat',
            'tagline' => 'Cosy stays in Penang',
            'logo_path' => null,
            'social' => [
                'facebook' => 'https://facebook.com/pakmat',
                'instagram' => '',
                'twitter' => '',
                'email' => 'pakmat@example.com',
            ],
        ];

        $this->withHeaders($this->authHeaders())
            ->putJson('/api/admin/site-content', ['branding' => $branding])
            ->assertStatus(200);

        $this->withHeaders($this->authHeaders())
            ->getJson('/api/admin/site-content')
            ->assertStatus(200)
            ->assertJsonPath('branding.name', 'Homestay Pak Mat')
            ->assertJsonPath('branding.social.facebook', 'https://facebook.com/pakmat');
    }

    public function test_logo_upload_persists_path_on_branding_row(): void
    {
        Storage::fake('public');
        SiteContent::setMap(['branding' => ['name' => 'Demo', 'logo_path' => null]]);

        $response = $this->withHeaders($this->authHeaders())
            ->post('/api/admin/branding/logo', [
                'logo' => $this->fakePng('logo.png'),
            ]);

        $response->assertStatus(201);
        $path = $response->json('logo_path');
        $this->assertNotEmpty($path);
        Storage::disk('public')->assertExists($path);

        $branding = SiteContent::where('key', 'branding')->value('value');
        $this->assertSame($path, $branding['logo_path']);
    }

    public function test_logo_upload_rejects_non_image(): void
    {
        Storage::fake('public');

        $this->withHeaders($this->authHeaders())
            ->postJson('/api/admin/branding/logo', [
                'logo' => UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf'),
            ])
            ->assertStatus(422);
    }

    public function test_logo_delete_clears_path_and_removes_file(): void
    {
        Storage::fake('public');

        $upload = $this->withHeaders($this->authHeaders())
            ->post('/api/admin/branding/logo', [
                'logo' => $this->fakePng('logo.png'),
            ]);
        $path = $upload->json('logo_path');
        Storage::disk('public')->assertExists($path);

        $this->withHeaders($this->authHeaders())
            ->deleteJson('/api/admin/branding/logo')
            ->assertStatus(200);

        Storage::disk('public')->assertMissing($path);
        $branding = SiteContent::where('key', 'branding')->value('value');
        $this->assertNull($branding['logo_path']);
    }
}
