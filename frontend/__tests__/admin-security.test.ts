/**
 * Tests for isWeakPassword() — the frontend twin of the backend AdminSecurity
 * check. Both layers must agree on what counts as a weak admin password.
 */
import { isWeakPassword, WEAK_PASSWORDS } from '@/lib/admin-security'

describe('isWeakPassword', () => {
  test('flags the shipped change-me placeholder', () => {
    expect(isWeakPassword('change-me')).toBe(true)
  })

  test('is case-insensitive for placeholders', () => {
    expect(isWeakPassword('Change-Me')).toBe(true)
    expect(isWeakPassword('CHANGE-ME')).toBe(true)
  })

  test('flags empty, whitespace, and nullish values', () => {
    expect(isWeakPassword('')).toBe(true)
    expect(isWeakPassword('   ')).toBe(true)
    expect(isWeakPassword(null)).toBe(true)
    expect(isWeakPassword(undefined)).toBe(true)
  })

  test('flags passwords shorter than 8 characters', () => {
    expect(isWeakPassword('abc123')).toBe(true)
  })

  test('flags every value in the shared weak list', () => {
    for (const weak of WEAK_PASSWORDS) {
      expect(isWeakPassword(weak)).toBe(true)
    }
  })

  test('accepts a strong password', () => {
    expect(isWeakPassword('Tr0ub4dor&3-kx')).toBe(false)
    expect(isWeakPassword('a-perfectly-fine-passphrase')).toBe(false)
  })
})
