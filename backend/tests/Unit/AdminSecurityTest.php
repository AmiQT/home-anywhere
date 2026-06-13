<?php

namespace Tests\Unit;

use App\Support\AdminSecurity;
use PHPUnit\Framework\TestCase;

/**
 * AdminSecurity decides whether the configured admin password is safe enough
 * to show to a real business. These pin the rules: placeholders, empties, and
 * short strings are weak; a real strong password is not.
 */
class AdminSecurityTest extends TestCase
{
    public function test_shipped_placeholder_is_weak(): void
    {
        $this->assertTrue(AdminSecurity::isWeakPassword('change-me'));
    }

    public function test_placeholder_is_case_insensitive(): void
    {
        $this->assertTrue(AdminSecurity::isWeakPassword('Change-Me'));
        $this->assertTrue(AdminSecurity::isWeakPassword('CHANGE-ME'));
    }

    public function test_empty_or_null_is_weak(): void
    {
        $this->assertTrue(AdminSecurity::isWeakPassword(null));
        $this->assertTrue(AdminSecurity::isWeakPassword(''));
        $this->assertTrue(AdminSecurity::isWeakPassword('   '));
    }

    public function test_short_password_is_weak(): void
    {
        $this->assertTrue(AdminSecurity::isWeakPassword('abc123')); // 6 chars
    }

    public function test_other_common_weak_values_are_weak(): void
    {
        foreach (['password', 'admin', 'secret', '123456', 'password123'] as $weak) {
            $this->assertTrue(
                AdminSecurity::isWeakPassword($weak),
                "Expected '{$weak}' to be flagged weak",
            );
        }
    }

    public function test_strong_password_is_not_weak(): void
    {
        $this->assertFalse(AdminSecurity::isWeakPassword('Tr0ub4dor&3-kx'));
        $this->assertFalse(AdminSecurity::isWeakPassword('a-perfectly-fine-passphrase'));
    }
}
