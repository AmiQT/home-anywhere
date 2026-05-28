/**
 * Tests for the site-content CMS helpers. These exercise the REAL exported
 * functions from lib/site-content so a regression in the merge/fetch logic
 * is actually caught (the old test only checked arithmetic written inline).
 */
import {
  DEFAULT_SITE_CONTENT,
  mergeWithDefaults,
  fetchSiteContent,
} from '@/lib/site-content'

describe('mergeWithDefaults', () => {
  test('empty partial returns the full defaults', () => {
    const merged = mergeWithDefaults({})
    expect(merged).toEqual(DEFAULT_SITE_CONTENT)
  })

  test('partial hero keys merge over defaults, untouched keys preserved', () => {
    const merged = mergeWithDefaults({
      hero: { title: 'Custom title' } as any,
    })
    expect(merged.hero.title).toBe('Custom title')
    // Other hero fields fall back to defaults.
    expect(merged.hero.badge).toBe(DEFAULT_SITE_CONTENT.hero.badge)
    expect(merged.hero.cta_primary).toBe(DEFAULT_SITE_CONTENT.hero.cta_primary)
  })

  test('provided arrays replace defaults wholesale (not concatenated)', () => {
    const merged = mergeWithDefaults({
      trust_stats: [{ value: '1', label: 'Only one' }],
    })
    expect(merged.trust_stats).toHaveLength(1)
    expect(merged.trust_stats[0].label).toBe('Only one')
  })

  test('nested how_it_works items fall back to defaults when omitted', () => {
    const merged = mergeWithDefaults({
      how_it_works: { title: 'New flow' } as any,
    })
    expect(merged.how_it_works.title).toBe('New flow')
    expect(merged.how_it_works.items).toEqual(
      DEFAULT_SITE_CONTENT.how_it_works.items,
    )
  })
})

describe('fetchSiteContent', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  test('returns defaults when the request throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as any
    const content = await fetchSiteContent()
    expect(content).toEqual(DEFAULT_SITE_CONTENT)
  })

  test('returns defaults on a non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any
    const content = await fetchSiteContent()
    expect(content).toEqual(DEFAULT_SITE_CONTENT)
  })

  test('merges server values over defaults on a successful response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hero: { title: 'From API' } }),
    }) as any

    const content = await fetchSiteContent()
    expect(content.hero.title).toBe('From API')
    // Unspecified keys still resolve to defaults.
    expect(content.footer).toEqual(DEFAULT_SITE_CONTENT.footer)
  })
})
