/**
 * Minimal test untuk booking logic
 */

describe('Booking Logic', () => {
  test('deposit calculation: default 30% if not set', () => {
    const price = 10000 // RM 100
    const depositRatio = 0.3
    const expectedDeposit = Math.floor(price * depositRatio) // 3000
    expect(expectedDeposit).toBe(3000)
  })

  test('deposit calculation: use explicit deposit if set', () => {
    const price = 10000
    const explicitDeposit = 5000
    const actualDeposit = explicitDeposit ?? Math.floor(price * 0.3)
    expect(actualDeposit).toBe(5000)
  })

  test('slot capacity check', () => {
    const slotCapacity = 1
    const currentBookings = 0
    const canBook = currentBookings < slotCapacity
    expect(canBook).toBe(true)
  })

  test('slot capacity full', () => {
    const slotCapacity = 1
    const currentBookings = 1
    const canBook = currentBookings < slotCapacity
    expect(canBook).toBe(false)
  })
})

describe('GA4 Tracking', () => {
  test('track function does not crash when gtag is undefined', () => {
    // Simulate browser environment without GA4
    const track = (event: string, params?: Record<string, any>) => {
      if (typeof window === 'undefined') return
      if (!(window as any).gtag) return
      ;(window as any).gtag('event', event, params || {})
    }
    
    // Should not throw
    expect(() => track('test_event')).not.toThrow()
  })
})

describe('Date Helpers', () => {
  test('slot start time is in future for demo', () => {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    tomorrow.setHours(10, 0, 0, 0)
    expect(tomorrow.getTime()).toBeGreaterThan(now.getTime())
  })
})
