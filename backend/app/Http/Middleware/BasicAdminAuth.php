<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Validates HTTP Basic credentials on admin API requests. Mirrors the
 * frontend Next.js middleware so direct hits to /api/admin/* cannot
 * bypass the dashboard auth by skipping the Next proxy.
 *
 * Credentials are read from env (ADMIN_USERNAME / ADMIN_PASSWORD) so
 * each open-source deployment supplies its own values — no shared
 * defaults shipped in source.
 */
class BasicAdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $expectedUser = env('ADMIN_USERNAME');
        $expectedPass = env('ADMIN_PASSWORD');

        if (!$expectedUser || !$expectedPass) {
            return response()->json(
                ['error' => 'Admin authentication is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in .env.'],
                500,
            );
        }

        $providedUser = $request->getUser();
        $providedPass = $request->getPassword();

        $userOk = $providedUser !== null
            && hash_equals((string) $expectedUser, (string) $providedUser);
        $passOk = $providedPass !== null
            && hash_equals((string) $expectedPass, (string) $providedPass);

        if (!$userOk || !$passOk) {
            return response()
                ->json(['error' => 'Unauthorized'], 401)
                ->header('WWW-Authenticate', 'Basic realm="Admin API"');
        }

        return $next($request);
    }
}
