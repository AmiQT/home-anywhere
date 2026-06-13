<?php

namespace App\Support;

/**
 * Decides whether the configured admin credentials are safe enough to put
 * in front of a real business. Open-source operators often boot the stack,
 * see it working with the shipped `change-me` default, and forget to change
 * it — leaving their dashboard wide open. The admin dashboard calls this
 * (via /api/admin/security-status) to show a warning banner until the
 * password is changed to something non-default.
 *
 * The exact same list of weak passwords is mirrored in the frontend
 * (frontend/lib/admin-security.ts) so both layers agree.
 */
class AdminSecurity
{
    /**
     * Passwords that ship as placeholders or are trivially guessable. Stored
     * lowercase; comparison is case-insensitive so `Change-Me` is caught too.
     */
    public const WEAK_PASSWORDS = [
        'change-me',
        'changeme',
        'password',
        'admin',
        'secret',
        '123456',
        'password123',
    ];

    /**
     * Minimum length below which we always warn, regardless of the value.
     */
    public const MIN_LENGTH = 8;

    /**
     * Returns true when the given password is missing, too short, or matches
     * a known placeholder/weak value.
     */
    public static function isWeakPassword(?string $password): bool
    {
        if ($password === null || trim($password) === '') {
            return true;
        }

        if (mb_strlen($password) < self::MIN_LENGTH) {
            return true;
        }

        return in_array(mb_strtolower($password), self::WEAK_PASSWORDS, true);
    }
}
