/**
 * Server-side branding fetch.
 *
 * The header logo text and the page <title>/SEO description are rendered by
 * server components (app/layout.tsx), so they can't use the client-only
 * fetchSiteContent() helper or the /api/* rewrite (which only works in the
 * browser). This talks to the Laravel backend directly via BACKEND_URL and
 * returns branding with defaults merged in — so the brand name appears in the
 * server HTML with no client flash and correct SEO crawling.
 *
 * Like fetchSiteContent(), this never throws: if the backend is unreachable
 * the site still renders with default branding.
 */

import { DEFAULT_SITE_CONTENT, type Branding } from './site-content'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

export async function getBranding(): Promise<Branding> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/site-content`, {
      // Cache briefly so every request doesn't hit the backend, but pick up
      // owner edits within a minute.
      next: { revalidate: 60 },
    })
    if (!res.ok) return DEFAULT_SITE_CONTENT.branding

    const data = await res.json()
    return mergeBranding(data?.branding)
  } catch {
    return DEFAULT_SITE_CONTENT.branding
  }
}

/** Merge a partial branding object over defaults (social merged deeply). */
export function mergeBranding(partial: Partial<Branding> | undefined | null): Branding {
  const base = DEFAULT_SITE_CONTENT.branding
  if (!partial) return base
  return {
    ...base,
    ...partial,
    social: { ...base.social, ...(partial.social ?? {}) },
  }
}
