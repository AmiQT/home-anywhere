/**
 * Site content (CMS) types, defaults, and fetch helper.
 *
 * The backend stores rows keyed by `key`, each row's value is JSON.
 * If the API returns nothing for a key, we fall back to the defaults
 * here — so the public site always renders something sensible even
 * before the seeder has run.
 */

export type Hero = {
  badge: string
  title: string
  subtitle: string
  cta_primary: string
  cta_secondary: string
}

export type TrustStat = {
  value: string
  label: string
}

export type Headings = {
  stays_eyebrow: string
  stays_title: string
  stays_description: string
  destinations_eyebrow: string
  destinations_title: string
  destinations_description: string
  testimonials_eyebrow: string
  testimonials_title: string
}

export type StepItem = {
  icon: string
  n: string
  title: string
  description: string
}

export type HowItWorks = {
  eyebrow: string
  title: string
  description: string
  items: StepItem[]
}

export type FeatureItem = {
  icon: string
  title: string
  description: string
}

export type Features = {
  eyebrow: string
  title: string
  description: string
  items: FeatureItem[]
}

export type Testimonial = {
  quote: string
  author: string
  role: string
}

export type CtaBanner = {
  title: string
  description: string
  cta_primary: string
  cta_secondary: string
}

export type Footer = {
  description: string
  email: string
  phone: string
  location: string
}

export type BrandingSocial = {
  facebook: string
  instagram: string
  twitter: string
  email: string
}

export type Branding = {
  /** Business name shown in the header, footer, copyright, and tab title. */
  name: string
  /** Short tagline appended to the tab title and used as the SEO description. */
  tagline: string
  /** Uploaded logo path (served via /storage/...). null = default house icon. */
  logo_path: string | null
  social: BrandingSocial
}

export type SiteContent = {
  branding: Branding
  hero: Hero
  trust_stats: TrustStat[]
  headings: Headings
  how_it_works: HowItWorks
  features: Features
  testimonials: Testimonial[]
  cta_banner: CtaBanner
  footer: Footer
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  branding: {
    name: 'Home Anywhere',
    tagline: 'Find your stay, anywhere',
    logo_path: null,
    social: {
      facebook: '',
      instagram: '',
      twitter: '',
      email: 'hello@homeanywhere.co',
    },
  },
  hero: {
    badge: 'New stays added every week',
    title: 'Find your stay, anywhere you go.',
    subtitle:
      'Discover thoughtfully curated boutique homestays across Malaysia. Real-time availability, secure deposits, and instant calendar confirmation — all in one clean booking flow.',
    cta_primary: 'Find a stay',
    cta_secondary: 'Browse stays',
  },
  trust_stats: [
    { value: '500+', label: 'Listed homestays' },
    { value: '10k+', label: 'Happy guests' },
    { value: '4.9★', label: 'Average rating' },
    { value: '24/7', label: 'Guest support' },
  ],
  headings: {
    stays_eyebrow: 'Available stays',
    stays_title: 'Live availability',
    stays_description:
      'Real homestays loaded from the platform. Pick one, check open dates, and lock it in within minutes.',
    destinations_eyebrow: 'Destinations',
    destinations_title: 'Popular places to wander',
    destinations_description:
      'A handpicked sample of where our guests love to stay.',
    testimonials_eyebrow: 'What guests say',
    testimonials_title: 'Trusted by travelers across Malaysia',
  },
  how_it_works: {
    eyebrow: 'How it works',
    title: 'Book in four simple steps',
    description:
      'A streamlined flow from discovery to check-in. No back-and-forth, no hidden fees.',
    items: [
      { icon: 'search', n: '01', title: 'Pick a stay', description: 'Browse curated boutique homestays across Malaysia.' },
      { icon: 'calendar', n: '02', title: 'Choose your dates', description: 'See real availability and pick check-in instantly.' },
      { icon: 'shield', n: '03', title: 'Lock with deposit', description: 'Secure card payment, 30% deposit to confirm.' },
      { icon: 'sparkles', n: '04', title: 'Enjoy your stay', description: 'Get the calendar invite and check in stress-free.' },
    ],
  },
  features: {
    eyebrow: 'Why Home Anywhere',
    title: 'The cleanest way to book a homestay',
    description:
      'We strip out the noise so you can focus on the trip — not the booking flow.',
    items: [
      { icon: 'shield', title: 'Secure deposits', description: 'PCI-compliant Stripe checkout. Only 30% to confirm — pay the rest on check-in.' },
      { icon: 'calendar', title: 'Live availability', description: 'Real-time slots straight from the host calendar. No double bookings, ever.' },
      { icon: 'users', title: 'Verified hosts', description: 'Every listing reviewed by our team before going live on the platform.' },
      { icon: 'map-pin', title: 'Curated locations', description: 'From beachfront villas to highland retreats and heritage city stays.' },
      { icon: 'sparkles', title: 'Instant invites', description: 'Calendar invite + confirmation email the moment your deposit clears.' },
      { icon: 'heart', title: 'Guest-first support', description: 'A real human on standby — chat, email, or phone, 24/7.' },
    ],
  },
  testimonials: [
    {
      quote:
        'Booking was effortless. Calendar invite hit my inbox in seconds and the villa was exactly as listed.',
      author: 'Aiman R.',
      role: 'Family of 4',
    },
    {
      quote:
        'Loved that I only paid the deposit upfront. Settled the rest at check-in, no surprise fees.',
      author: 'Priya S.',
      role: 'Solo traveler',
    },
    {
      quote:
        'Found a heritage home in Melaka that no other platform listed. Will definitely book again.',
      author: 'Daniel W.',
      role: 'Couple retreat',
    },
  ],
  cta_banner: {
    title: 'Your next stay is one click away.',
    description:
      'Pick a homestay, choose your dates, lock it with a deposit — and get back to planning the fun parts.',
    cta_primary: 'Book a stay',
    cta_secondary: 'Browse all stays',
  },
  footer: {
    description:
      'Trusted homestay booking platform. Real availability, secure deposits, instant calendar confirmation — anywhere you stay.',
    email: 'hello@homeanywhere.co',
    phone: '+60 12-345 6789',
    location: 'Kuala Lumpur, Malaysia',
  },
}

/**
 * Fetch site content, merging server values over defaults.
 * Always resolves with a usable SiteContent — never throws.
 */
export async function fetchSiteContent(): Promise<SiteContent> {
  try {
    const res = await fetch('/api/site-content')
    if (!res.ok) return DEFAULT_SITE_CONTENT
    const data = await res.json()
    return mergeWithDefaults(data)
  } catch {
    return DEFAULT_SITE_CONTENT
  }
}

/** Shallow-merge top-level keys with defaults so missing keys still render. */
export function mergeWithDefaults(partial: Partial<SiteContent>): SiteContent {
  return {
    branding: {
      ...DEFAULT_SITE_CONTENT.branding,
      ...(partial.branding ?? {}),
      social: {
        ...DEFAULT_SITE_CONTENT.branding.social,
        ...(partial.branding?.social ?? {}),
      },
    },
    hero: { ...DEFAULT_SITE_CONTENT.hero, ...(partial.hero ?? {}) },
    trust_stats: partial.trust_stats ?? DEFAULT_SITE_CONTENT.trust_stats,
    headings: { ...DEFAULT_SITE_CONTENT.headings, ...(partial.headings ?? {}) },
    how_it_works: {
      ...DEFAULT_SITE_CONTENT.how_it_works,
      ...(partial.how_it_works ?? {}),
      items:
        partial.how_it_works?.items ?? DEFAULT_SITE_CONTENT.how_it_works.items,
    },
    features: {
      ...DEFAULT_SITE_CONTENT.features,
      ...(partial.features ?? {}),
      items: partial.features?.items ?? DEFAULT_SITE_CONTENT.features.items,
    },
    testimonials: partial.testimonials ?? DEFAULT_SITE_CONTENT.testimonials,
    cta_banner: {
      ...DEFAULT_SITE_CONTENT.cta_banner,
      ...(partial.cta_banner ?? {}),
    },
    footer: { ...DEFAULT_SITE_CONTENT.footer, ...(partial.footer ?? {}) },
  }
}
