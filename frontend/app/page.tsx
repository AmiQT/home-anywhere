'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DEFAULT_SITE_CONTENT,
  fetchSiteContent,
  type CtaBanner as CtaBannerCopy,
  type Features as FeaturesCopy,
  type Headings as HeadingsCopy,
  type Hero as HeroCopy,
  type HowItWorks as HowItWorksCopy,
  type SiteContent,
  type Testimonial,
  type TrustStat,
} from '@/lib/site-content'
import { getIcon } from '@/lib/icons'
import {
  Search,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
  MapPin,
  Star,
  Building2,
  Waves,
  Trees,
  House,
  ArrowRight,
  Users,
  Heart,
  Clock,
} from 'lucide-react'

type StayImage = {
  id: number
  url: string
  alt: string | null
  is_primary: boolean
}

type Homestay = {
  id: number
  name: string
  description?: string | null
  duration: number
  price: number
  deposit?: number | null
  images?: StayImage[]
}

export default function HomePage() {
  const [homestays, setHomestays] = useState<Homestay[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT)

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        setHomestays(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetchSiteContent().then(setContent)
  }, [])

  const featured =
    homestays.find((h) => (h.images?.length ?? 0) > 0) ?? homestays[0] ?? null

  return (
    <>
      <Hero copy={content.hero} featured={featured} />
      <TrustStrip stats={content.trust_stats} />
      <FeaturedStays
        homestays={homestays}
        loading={loading}
        headings={content.headings}
      />
      <HowItWorks copy={content.how_it_works} />
      <Features copy={content.features} />
      <Destinations homestays={homestays} headings={content.headings} />
      <Testimonials items={content.testimonials} headings={content.headings} />
      <CtaBanner copy={content.cta_banner} />
    </>
  )
}

/* ----------------------------- Hero ----------------------------- */

function Hero({ copy, featured }: { copy: HeroCopy; featured: Homestay | null }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-accent/50 via-background to-background">
      <div
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="container py-20 lg:py-28">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-7">
            <Badge
              variant="secondary"
              className="rounded-full bg-accent text-accent-foreground border border-primary/15 px-3 py-1"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {copy.badge}
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-foreground whitespace-pre-line">
              {copy.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed whitespace-pre-line">
              {copy.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href="/book">
                  <Search className="h-4 w-4" />
                  {copy.cta_primary}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-6 text-base"
              >
                <Link href="#stays">{copy.cta_secondary}</Link>
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Secure deposits
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4 text-primary" />
                Instant confirmation
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-primary" />
                10k+ happy guests
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HeroCard featured={featured} />
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroCard({ featured }: { featured: Homestay | null }) {
  // Fallback display when no stays exist yet
  if (!featured) {
    return (
      <div className="relative">
        <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl -z-10" />
        <Card className="border-border/80 shadow-xl">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Featured stay
                </p>
                <h3 className="text-lg font-semibold mt-1">Your first stay</h3>
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-sky-100 via-cyan-50 to-amber-50 border border-border flex items-center justify-center">
              <House className="h-24 w-24 text-primary/60" strokeWidth={1.25} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Add a homestay from the admin dashboard to feature it here.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin">Go to admin</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cleanName = featured.name.replace(/[\p{Emoji}‍]+/gu, '').trim()
  const primary =
    featured.images?.find((i) => i.is_primary) ?? featured.images?.[0] ?? null
  const rate = featured.price ? featured.price / 100 : 0

  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl -z-10" />
      <Card className="border-border/80 shadow-xl">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Featured stay
              </p>
              <h3 className="text-lg font-semibold mt-1">{cleanName}</h3>
            </div>
            <Badge className="bg-primary/10 text-primary border-transparent hover:bg-primary/10">
              <Star className="h-3 w-3 mr-1 fill-current" />
              4.9
            </Badge>
          </div>

          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-sky-100 via-cyan-50 to-amber-50 border border-border">
            {primary ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primary.url}
                alt={primary.alt ?? cleanName}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <House className="h-24 w-24 text-primary/50" strokeWidth={1.25} />
              </div>
            )}
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-medium text-foreground shadow-sm">
              <MapPin className="h-3 w-3 text-primary" />
              Malaysia
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <Stat
              label="Min nights"
              value={String(featured.duration)}
            />
            <Stat
              label="Per night"
              value={`RM ${rate.toLocaleString()}`}
            />
            <Stat
              label="Rating"
              value="4.9★"
            />
          </div>

          <Button asChild className="w-full">
            <Link href={`/book?serviceId=${featured.id}`}>
              Reserve this stay
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
      <div className="text-sm font-semibold text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  )
}

/* -------------------------- Trust Strip -------------------------- */

function TrustStrip({ stats }: { stats: TrustStat[] }) {
  return (
    <section className="border-b border-border bg-background">
      <div className="container py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((item, i) => (
            <div key={`${item.label}-${i}`} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                {item.value}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------- Featured Stays ------------------------ */

function FeaturedStays({
  homestays,
  loading,
  headings,
}: {
  homestays: Homestay[]
  loading: boolean
  headings: HeadingsCopy
}) {
  return (
    <section id="stays" className="py-20 lg:py-24">
      <div className="container">
        <SectionHeading
          eyebrow={headings.stays_eyebrow}
          title={headings.stays_title}
          description={headings.stays_description}
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonStay key={i} />)
          ) : homestays.length === 0 ? (
            <EmptyStays />
          ) : (
            homestays.map((h) => <StayCard key={h.id} home={h} />)
          )}
        </div>
      </div>
    </section>
  )
}

function StayCard({ home }: { home: Homestay }) {
  const cleanName = home.name.replace(/[\p{Emoji}‍]+/gu, '').trim()
  const rate = home.price ? home.price / 100 : 0
  const primary =
    home.images?.find((i) => i.is_primary) ?? home.images?.[0] ?? null

  const icon = home.name.match(/Langkawi|Seaview|🌊/i) ? (
    <Waves className="h-14 w-14 text-sky-400" strokeWidth={1.25} />
  ) : home.name.match(/Cameron|Highland|🌄/i) ? (
    <Trees className="h-14 w-14 text-emerald-500" strokeWidth={1.25} />
  ) : home.name.match(/KL|City|Apartment|🏙/i) ? (
    <Building2 className="h-14 w-14 text-amber-500" strokeWidth={1.25} />
  ) : (
    <House className="h-14 w-14 text-primary" strokeWidth={1.25} />
  )

  return (
    <Card className="overflow-hidden border-border/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="relative aspect-[5/3] bg-gradient-to-br from-secondary via-muted to-accent flex items-center justify-center border-b border-border overflow-hidden">
        {primary ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primary.url}
            alt={primary.alt ?? cleanName}
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          icon
        )}
        <Badge className="absolute top-3 left-3 bg-background/95 text-foreground border-border hover:bg-background/95">
          <Clock className="h-3 w-3 mr-1" />
          {home.duration} night{home.duration > 1 ? 's' : ''} min
        </Badge>
      </div>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1.5">
          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
            {cleanName}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {home.description ||
              'A thoughtfully designed boutique homestay with everything you need for a comfortable stay.'}
          </p>
        </div>

        <div className="flex items-end justify-between pt-3 border-t border-border">
          <div>
            <div className="text-xs text-muted-foreground">From</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">
                RM {rate.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">/ night</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Min {home.duration} night{home.duration > 1 ? 's' : ''}
            </div>
          </div>
          <Button asChild size="sm">
            <Link href={`/book?serviceId=${home.id}`}>
              Reserve
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonStay() {
  return (
    <Card className="overflow-hidden border-border/80">
      <div className="aspect-[5/3] bg-muted animate-pulse" />
      <CardContent className="p-5 space-y-3">
        <div className="h-5 w-2/3 bg-muted rounded animate-pulse" />
        <div className="h-3 w-full bg-muted rounded animate-pulse" />
        <div className="h-3 w-4/5 bg-muted rounded animate-pulse" />
        <div className="flex justify-between pt-3 border-t border-border">
          <div className="h-8 w-20 bg-muted rounded animate-pulse" />
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyStays() {
  return (
    <div className="col-span-full">
      <Card className="border-dashed">
        <CardContent className="py-16 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mx-auto">
            <House className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold">No stays available yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first homestay from the admin panel to see it here.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin">Go to admin</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

/* -------------------------- How it works ------------------------ */

function HowItWorks({ copy }: { copy: HowItWorksCopy }) {
  return (
    <section id="how-it-works" className="py-20 lg:py-24 bg-muted/40 border-y border-border">
      <div className="container">
        <SectionHeading
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {copy.items.map((s, i) => {
            const Icon = getIcon(s.icon)
            return (
              <Card key={`${s.title}-${i}`} className="border-border/80">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-bold text-muted-foreground tracking-wider">
                      {s.n}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ----------------------------- Features ---------------------------- */

function Features({ copy }: { copy: FeaturesCopy }) {
  return (
    <section className="py-20 lg:py-24">
      <div className="container">
        <SectionHeading
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {copy.items.map((f, i) => {
            const Icon = getIcon(f.icon)
            return (
              <div
                key={`${f.title}-${i}`}
                className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-base">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {f.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* -------------------------- Destinations ------------------------- */

function Destinations({
  homestays,
  headings,
}: {
  homestays: Homestay[]
  headings: HeadingsCopy
}) {
  // Show up to 3 stays — prioritise ones with photos so this section
  // looks alive once the admin uploads images.
  const withImages = homestays.filter((h) => (h.images?.length ?? 0) > 0)
  const rest = homestays.filter((h) => (h.images?.length ?? 0) === 0)
  const picks = [...withImages, ...rest].slice(0, 3)

  if (picks.length === 0) return null

  return (
    <section id="destinations" className="py-20 lg:py-24 bg-muted/40 border-y border-border">
      <div className="container">
        <SectionHeading
          eyebrow={headings.destinations_eyebrow}
          title={headings.destinations_title}
          description={headings.destinations_description}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((h) => (
            <DestinationCard key={h.id} home={h} />
          ))}
        </div>
      </div>
    </section>
  )
}

function DestinationCard({ home }: { home: Homestay }) {
  const cleanName = home.name.replace(/[\p{Emoji}‍]+/gu, '').trim()
  const primary =
    home.images?.find((i) => i.is_primary) ?? home.images?.[0] ?? null
  const theme = destinationTheme(home.name)

  return (
    <Link
      href={`/book?serviceId=${home.id}`}
      className="block overflow-hidden rounded-xl border border-border/80 bg-card hover:shadow-lg transition-all group"
    >
      <div
        className={`relative aspect-[4/3] flex items-center justify-center overflow-hidden ${
          primary ? '' : `bg-gradient-to-br ${theme.gradient}`
        }`}
      >
        {primary ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primary.url}
            alt={primary.alt ?? cleanName}
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <theme.icon
            className={`h-20 w-20 ${theme.iconColor} group-hover:scale-110 transition-transform`}
            strokeWidth={1.25}
          />
        )}
        <Badge className="absolute top-3 left-3 bg-background/95 text-foreground border-border hover:bg-background/95">
          {theme.tag}
        </Badge>
      </div>
      <div className="p-5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
            {cleanName}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            From RM {(home.price / 100).toLocaleString()} · {home.duration} night
            {home.duration > 1 ? 's' : ''}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  )
}

function destinationTheme(name: string) {
  if (/Langkawi|Seaview|Beach|🌊/i.test(name)) {
    return {
      tag: 'Beach retreat',
      icon: Waves,
      gradient: 'from-sky-100 via-cyan-50 to-blue-50',
      iconColor: 'text-sky-500',
    }
  }
  if (/Cameron|Highland|Hill|🌄/i.test(name)) {
    return {
      tag: 'Hill escape',
      icon: Trees,
      gradient: 'from-emerald-50 via-green-50 to-lime-50',
      iconColor: 'text-emerald-500',
    }
  }
  if (/KL|City|Apartment|Heritage|Melaka|🏙/i.test(name)) {
    return {
      tag: 'City & heritage',
      icon: Building2,
      gradient: 'from-amber-50 via-orange-50 to-rose-50',
      iconColor: 'text-amber-500',
    }
  }
  return {
    tag: 'Featured stay',
    icon: House,
    gradient: 'from-secondary via-muted to-accent',
    iconColor: 'text-primary',
  }
}

/* -------------------------- Testimonials ------------------------- */

function Testimonials({
  items,
  headings,
}: {
  items: Testimonial[]
  headings: HeadingsCopy
}) {
  return (
    <section className="py-20 lg:py-24">
      <div className="container">
        <SectionHeading
          eyebrow={headings.testimonials_eyebrow}
          title={headings.testimonials_title}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <Card key={`${t.author}-${i}`} className="border-border/80">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {t.author.trim().charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.author}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------- CTA Banner --------------------------- */

function CtaBanner({ copy }: { copy: CtaBannerCopy }) {
  return (
    <section className="py-20 lg:py-24">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-foreground text-background px-8 py-14 lg:px-16 lg:py-20">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative max-w-2xl">
            <Badge className="bg-background/15 text-background border border-background/20 backdrop-blur hover:bg-background/15">
              Ready when you are
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-5 leading-tight whitespace-pre-line">
              {copy.title}
            </h2>
            <p className="text-base sm:text-lg text-background/70 mt-4 max-w-xl leading-relaxed whitespace-pre-line">
              {copy.description}
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href="/book">
                  {copy.cta_primary}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-6 text-base bg-transparent border-background/30 text-background hover:bg-background/10 hover:text-background"
              >
                <Link href="#stays">{copy.cta_secondary}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------- Section Heading ------------------------ */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}
