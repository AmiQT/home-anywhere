/**
 * Branding merge logic — both the client-side mergeWithDefaults (now carrying a
 * branding block) and the server-side getBranding()/mergeBranding fallback used
 * by the SSR header + tab title. Brand identity must always resolve to
 * something sensible even before the owner has customised it.
 */
import { mergeWithDefaults, DEFAULT_SITE_CONTENT } from '@/lib/site-content'
import { getBranding, mergeBranding } from '@/lib/site-content-server'

describe('mergeWithDefaults (branding)', () => {
  test('fills branding from defaults when absent', () => {
    const merged = mergeWithDefaults({})
    expect(merged.branding).toEqual(DEFAULT_SITE_CONTENT.branding)
  })

  test('keeps provided branding fields and back-fills social', () => {
    const merged = mergeWithDefaults({
      branding: {
        name: 'Homestay Pak Mat',
        tagline: 'Cosy stays',
        logo_path: 'branding/x.png',
        social: { facebook: 'https://fb.com/pakmat' } as any,
      },
    })
    expect(merged.branding.name).toBe('Homestay Pak Mat')
    expect(merged.branding.social.facebook).toBe('https://fb.com/pakmat')
    // Missing social keys fall back to defaults.
    expect(merged.branding.social.email).toBe(
      DEFAULT_SITE_CONTENT.branding.social.email,
    )
  })
})

describe('mergeBranding', () => {
  test('returns defaults for null/undefined', () => {
    expect(mergeBranding(null)).toEqual(DEFAULT_SITE_CONTENT.branding)
    expect(mergeBranding(undefined)).toEqual(DEFAULT_SITE_CONTENT.branding)
  })

  test('deep-merges social over defaults', () => {
    const result = mergeBranding({ name: 'X', social: { twitter: 't' } as any })
    expect(result.name).toBe('X')
    expect(result.social.twitter).toBe('t')
    expect(result.social.email).toBe(DEFAULT_SITE_CONTENT.branding.social.email)
  })
})

describe('getBranding', () => {
  const realFetch = global.fetch

  afterEach(() => {
    global.fetch = realFetch
  })

  test('falls back to defaults when the backend fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as any
    const branding = await getBranding()
    expect(branding).toEqual(DEFAULT_SITE_CONTENT.branding)
  })

  test('merges branding from a successful response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ branding: { name: 'Villa Co' } }),
    }) as any
    const branding = await getBranding()
    expect(branding.name).toBe('Villa Co')
    expect(branding.tagline).toBe(DEFAULT_SITE_CONTENT.branding.tagline)
  })
})
