/**
 * Mirror of backend/app/Support/AdminSecurity.php. Both layers must agree on
 * what counts as a weak admin password so the warning banner and any future
 * server-side gating stay consistent. Keep the two lists in sync.
 */

/**
 * Placeholder / trivially guessable passwords. Lowercase; comparison is
 * case-insensitive.
 */
export const WEAK_PASSWORDS = [
  'change-me',
  'changeme',
  'password',
  'admin',
  'secret',
  '123456',
  'password123',
]

/** Minimum length below which a password always counts as weak. */
export const MIN_PASSWORD_LENGTH = 8

/** True when the password is missing, too short, or a known weak value. */
export function isWeakPassword(password: string | null | undefined): boolean {
  if (!password || password.trim() === '') {
    return true
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return true
  }

  return WEAK_PASSWORDS.includes(password.toLowerCase())
}
