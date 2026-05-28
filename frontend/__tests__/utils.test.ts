/**
 * Tests for the cn() class-name merge helper (clsx + tailwind-merge).
 */
import { cn } from '@/lib/utils'

describe('cn', () => {
  test('joins plain class strings', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  test('drops falsy values', () => {
    expect(cn('px-2', false, null, undefined, 'py-1')).toBe('px-2 py-1')
  })

  test('applies conditional object syntax', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active')
  })

  test('later tailwind utilities win on conflict (twMerge)', () => {
    // tailwind-merge resolves px-2 vs px-4 to the last one.
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})
