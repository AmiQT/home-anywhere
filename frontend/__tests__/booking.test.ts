/**
 * Tests for the GA4 tracking helper. These import the REAL track() function
 * from lib/ga rather than re-implementing it inline, so the no-op guards
 * (no window / no gtag) are genuinely covered.
 */
import { track } from '@/lib/ga'

describe('track (GA4 helper)', () => {
  const originalWindow = (global as any).window

  afterEach(() => {
    ;(global as any).window = originalWindow
    jest.restoreAllMocks()
  })

  test('does nothing and does not throw when window is undefined (SSR)', () => {
    delete (global as any).window
    expect(() => track('view_schedule')).not.toThrow()
  })

  test('does nothing when gtag is not present on window', () => {
    ;(global as any).window = {} // no gtag
    expect(() => track('start_booking', { foo: 'bar' })).not.toThrow()
  })

  test('forwards the event and params to gtag when available', () => {
    const gtag = jest.fn()
    ;(global as any).window = { gtag }

    track('complete_booking', { value: 42 })

    expect(gtag).toHaveBeenCalledWith('event', 'complete_booking', { value: 42 })
  })

  test('passes an empty object when params are omitted', () => {
    const gtag = jest.fn()
    ;(global as any).window = { gtag }

    track('add_on_selected')

    expect(gtag).toHaveBeenCalledWith('event', 'add_on_selected', {})
  })
})
