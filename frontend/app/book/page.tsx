'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import type { DateRange } from 'react-day-picker'
import { track } from '@/lib/ga'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  House,
  CalendarCheck,
  User,
  Check,
  ArrowLeft,
  CalendarDays,
  Mail,
  Phone,
  CreditCard,
  Lock,
  Info,
  Sparkles,
  AlertCircle,
  Loader2,
  Waves,
  Trees,
  Building2,
} from 'lucide-react'

type ServiceImage = {
  id: number
  url: string
  alt: string | null
  is_primary: boolean
}
type Service = {
  id: number
  name: string
  description: string | null
  duration: number
  price: number
  deposit_pct: number | null
  addons: { id: number; name: string; price: number }[]
  images?: ServiceImage[]
}
/** A blocked date range — either admin-blocked or backing an active booking. */
type BlockedRange = { id: number; start: string; end: string }

/** Server-calculated price breakdown from /api/pricing/preview. */
type PriceQuote = {
  nights: number
  weekend_nights: number
  weekday_nights: number
  stay_subtotal: number
  weekend_surcharge: number
  addons_total: number
  cleaning_fee: number
  subtotal: number
  sst_amount: number
  total: number
  deposit_pct: number
  deposit_amount: number
  settings: {
    sst_enabled: boolean
    sst_rate: number
    weekend_pricing_enabled: boolean
    weekend_surcharge_pct: number
    cleaning_fee_enabled: boolean
  }
}

const STEPS = [
  { n: 1, label: 'Choose stay', icon: House },
  { n: 2, label: 'Pick dates', icon: CalendarDays },
  { n: 3, label: 'Your details', icon: User },
]

export default function BookPageWrapper() {
  return (
    <Suspense fallback={null}>
      <BookPage />
    </Suspense>
  )
}

function BookPage() {
  const searchParams = useSearchParams()
  const initialServiceId = searchParams.get('serviceId')
    ? Number(searchParams.get('serviceId'))
    : null

  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState<number | null>(initialServiceId)
  const [blocked, setBlocked] = useState<BlockedRange[]>([])
  const [range, setRange] = useState<DateRange | undefined>(undefined)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [addonIds, setAddonIds] = useState<number[]>([])
  const [step, setStep] = useState(initialServiceId ? 2 : 1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((d) => setServices(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!serviceId) return
    track('view_schedule', { service_id: serviceId })
    fetch(`/api/slots?serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((d) => setBlocked(Array.isArray(d) ? d : []))
      .catch(() => setBlocked([]))
  }, [serviceId])

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) || null,
    [services, serviceId],
  )

  const nights = useMemo(() => {
    if (!range?.from || !range?.to) return 0
    return Math.max(
      0,
      Math.round(
        (startOfDay(range.to).getTime() - startOfDay(range.from).getTime()) /
          86_400_000,
      ),
    )
  }, [range])

  // Pricing comes from the backend so the displayed total always matches
  // what the booking endpoint charges. Recalculated whenever the
  // service, date range, or selected add-ons change.
  const [quote, setQuote] = useState<PriceQuote | null>(null)

  useEffect(() => {
    if (!serviceId || !range?.from || !range?.to || nights <= 0) {
      setQuote(null)
      return
    }
    const controller = new AbortController()
    fetch('/api/pricing/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId,
        checkInDate: toIsoDate(range.from),
        checkOutDate: toIsoDate(range.to),
        addonIds,
      }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setQuote(d))
      .catch(() => {})
    return () => controller.abort()
  }, [serviceId, range, addonIds, nights])

  function toggleAddon(id: number) {
    setAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
    track('add_on_selected', { addon_id: id })
  }

  async function submit() {
    if (!range?.from || !range?.to) {
      toast.error('Please pick check-in and check-out dates.')
      return
    }
    setLoading(true)
    try {
      track('start_booking', { service_id: serviceId })
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          checkInDate: toIsoDate(range.from),
          checkOutDate: toIsoDate(range.to),
          name,
          email,
          phone,
          addonIds,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error('Could not create booking', {
          description: err.error ?? 'Please try different dates.',
        })
        setLoading(false)
        return
      }
      const data = await res.json()
      window.location.href = data.checkoutUrl ?? `/success?bookingId=${data.id}`
    } catch (err) {
      console.error('Failed to submit booking', err)
      toast.error('Network error — please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-muted/40 min-h-[calc(100vh-4rem)]">
      <div className="container py-12 lg:py-16 max-w-5xl">
        <header className="text-center space-y-3 mb-10">
          <Badge
            variant="secondary"
            className="rounded-full bg-accent text-accent-foreground border border-primary/15"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Secure booking
          </Badge>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Book your <span className="text-primary">homestay</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Three short steps. We&apos;ll send you a calendar invite the moment your
            deposit clears.
          </p>
        </header>

        <Stepper step={step} />

        <div className="mt-10 animate-fade-in">
          {step === 1 && (
            <StepChooseService
              services={services}
              serviceId={serviceId}
              onPick={(id) => {
                setServiceId(id)
                setRange(undefined)
                setStep(2)
              }}
            />
          )}
          {step === 2 && selectedService && (
            <StepPickDates
              service={selectedService}
              blocked={blocked}
              range={range}
              nights={nights}
              onRangeChange={setRange}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && selectedService && (
            <StepDetails
              service={selectedService}
              range={range}
              nights={nights}
              name={name}
              email={email}
              phone={phone}
              addonIds={addonIds}
              quote={quote}
              loading={loading}
              onName={setName}
              onEmail={setEmail}
              onPhone={setPhone}
              onToggleAddon={toggleAddon}
              onBack={() => setStep(2)}
              onSubmit={submit}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ Stepper ----------------------------- */

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between max-w-xl mx-auto">
      {STEPS.map((s, i) => {
        const done = step > s.n
        const current = step === s.n
        return (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={[
                  'inline-flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  done
                    ? 'bg-primary border-primary text-primary-foreground'
                    : current
                      ? 'bg-background border-primary text-primary'
                      : 'bg-background border-border text-muted-foreground',
                ].join(' ')}
              >
                {done ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <span
                className={[
                  'text-xs font-medium',
                  current || done ? 'text-foreground' : 'text-muted-foreground',
                ].join(' ')}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={[
                  'flex-1 h-px mx-3 mb-6 transition-colors',
                  done ? 'bg-primary' : 'bg-border',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------- Step 1: Service ------------------------ */

function StepChooseService({
  services,
  serviceId,
  onPick,
}: {
  services: Service[]
  serviceId: number | null
  onPick: (id: number) => void
}) {
  return (
    <div className="space-y-6">
      <SectionTitle title="Choose a homestay" subtitle="Pick the property you'd like to stay in." />
      {services.length === 0 ? (
        <EmptyState message="Loading homestays..." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const selected = serviceId === s.id
            const icon = serviceIcon(s.name)
            const name = s.name.replace(/[\p{Emoji}‍]+/gu, '').trim()
            const primary =
              s.images?.find((i) => i.is_primary) ?? s.images?.[0] ?? null
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onPick(s.id)}
                className={[
                  'group text-left rounded-xl border bg-card overflow-hidden transition-all',
                  selected
                    ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:shadow-md',
                ].join(' ')}
              >
                <div className="relative aspect-[5/3] bg-gradient-to-br from-secondary via-muted to-accent flex items-center justify-center border-b border-border overflow-hidden">
                  {primary ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primary.url}
                      alt={primary.alt ?? name}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    icon
                  )}
                  {selected && (
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                      <Check className="h-3 w-3 mr-1" />
                      Selected
                    </Badge>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{name}</h3>
                    <Badge variant="secondary" className="shrink-0">
                      {s.duration}n min
                    </Badge>
                  </div>
                  {s.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {s.description}
                    </p>
                  )}
                  <div className="flex items-end justify-between pt-2 border-t border-border">
                    <div>
                      <div className="text-xs text-muted-foreground">From</div>
                      <div className="font-bold">
                        RM {(s.price / 100).toLocaleString()}
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                          / night
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Min stay</div>
                      <div className="font-semibold text-sm">
                        {s.duration} night{s.duration > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ------------------------ Step 2: Pick dates ----------------------- */

function StepPickDates({
  service,
  blocked,
  range,
  nights,
  onRangeChange,
  onBack,
  onNext,
}: {
  service: Service
  blocked: BlockedRange[]
  range: DateRange | undefined
  nights: number
  onRangeChange: (r: DateRange | undefined) => void
  onBack: () => void
  onNext: () => void
}) {
  // Pre-compute blocked date intervals once
  const blockedIntervals = useMemo(
    () =>
      blocked.map((b) => ({
        from: startOfDay(new Date(b.start)),
        to: startOfDay(new Date(b.end)),
      })),
    [blocked],
  )

  const today = startOfDay(new Date())

  function isDateBlocked(date: Date) {
    const d = startOfDay(date)
    return blockedIntervals.some(({ from, to }) => d >= from && d < to)
  }

  function isDateDisabled(date: Date) {
    if (date < today) return true
    if (isDateBlocked(date)) return true
    return false
  }

  // If a user starts a range that crosses a blocked date, react-day-picker still allows it.
  // Detect and clear so they're forced to pick a clean range.
  const rangeCrossesBlocked = useMemo(() => {
    if (!range?.from || !range?.to) return false
    const start = startOfDay(range.from)
    const end = startOfDay(range.to)
    for (
      let d = new Date(start);
      d < end;
      d = new Date(d.getTime() + 86_400_000)
    ) {
      if (isDateBlocked(d)) return true
    }
    return false
  }, [range, blockedIntervals])

  const tooShort = !!range?.from && !!range?.to && nights < service.duration
  const canContinue =
    !!range?.from &&
    !!range?.to &&
    nights >= service.duration &&
    !rangeCrossesBlocked

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Pick your dates"
        subtitle={`Minimum ${service.duration} night${
          service.duration > 1 ? 's' : ''
        }. Grey-out dates are not available.`}
      />

      <Card>
        <CardContent className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6 items-start">
          <div className="mx-auto lg:mx-0">
            <Calendar
              mode="range"
              selected={range}
              onSelect={onRangeChange}
              disabled={isDateDisabled}
              numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 1024 ? 2 : 1}
              defaultMonth={range?.from ?? today}
            />
          </div>

          <div className="flex-1 w-full space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <DateDisplay label="Check-in" date={range?.from} />
              <DateDisplay label="Check-out" date={range?.to} />
            </div>

            <div className="rounded-lg bg-muted/60 px-4 py-3 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Duration</span>
              </div>
              <div className="font-semibold">
                {nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : '—'}
              </div>
            </div>

            {tooShort && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  Minimum stay is <strong>{service.duration} nights</strong>.
                  Please pick a longer range.
                </div>
              </div>
            )}

            {rangeCrossesBlocked && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  Your selection crosses unavailable dates. Try a different
                  range.
                </div>
              </div>
            )}

            {!range?.from && (
              <p className="text-xs text-muted-foreground">
                Click a date to set check-in, then click again to set check-out.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Change homestay
        </Button>
        <Button disabled={!canContinue} onClick={onNext}>
          Continue
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function DateDisplay({ label, date }: { label: string; date?: Date }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </div>
      <div className="font-semibold mt-1 text-sm">
        {date
          ? date.toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : '—'}
      </div>
    </div>
  )
}

/* ------------------------- Step 3: Details ------------------------ */

function StepDetails({
  service,
  range,
  nights,
  name,
  email,
  phone,
  addonIds,
  quote,
  loading,
  onName,
  onEmail,
  onPhone,
  onToggleAddon,
  onBack,
  onSubmit,
}: {
  service: Service
  range: DateRange | undefined
  nights: number
  name: string
  email: string
  phone: string
  addonIds: number[]
  quote: PriceQuote | null
  loading: boolean
  onName: (v: string) => void
  onEmail: (v: string) => void
  onPhone: (v: string) => void
  onToggleAddon: (id: number) => void
  onBack: () => void
  onSubmit: () => void
}) {
  const cleanName = service.name.replace(/[\p{Emoji}‍]+/gu, '').trim()
  const totalPrice = quote?.total ?? 0
  const depositAmount = quote?.deposit_amount ?? 0
  const depositPct = quote?.deposit_pct ?? (service.deposit_pct ?? 30)

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 space-y-6">
        <SectionTitle title="Your details" subtitle="We'll send the confirmation here." />
        <Card>
          <CardContent className="p-6">
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                onSubmit()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => onName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => onEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  Calendar invite + receipt will be sent here.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+60 12-345 6789"
                  value={phone}
                  onChange={(e) => onPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  Required for WhatsApp updates.
                </p>
              </div>

              {service.addons && service.addons.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <Label>Add-ons</Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {service.addons.map((a) => {
                      const checked = addonIds.includes(a.id)
                      return (
                        <label
                          key={a.id}
                          className={[
                            'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                            checked
                              ? 'border-primary bg-accent'
                              : 'border-border hover:border-primary/40',
                          ].join(' ')}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleAddon(a.id)}
                            className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary/40"
                          />
                          <div className="flex-1 text-sm">
                            <div className="font-medium">{a.name}</div>
                            <div className="text-primary font-semibold text-xs mt-0.5">
                              + RM {(a.price / 100).toLocaleString()}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={!name || !email || !range?.from || !range?.to || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Pay deposit RM {(depositAmount / 100).toLocaleString()}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-5 lg:sticky lg:top-24">
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Booking summary
                </p>
                <p className="font-semibold">{cleanName}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <SummaryRow
                label="Check-in"
                value={
                  range?.from
                    ? range.from.toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })
                    : '—'
                }
              />
              <SummaryRow
                label="Check-out"
                value={
                  range?.to
                    ? range.to.toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })
                    : '—'
                }
              />
              <SummaryRow
                label="Duration"
                value={`${nights} night${nights === 1 ? '' : 's'}`}
              />
            </div>

            {addonIds.length > 0 && (
              <div className="pt-3 border-t border-border space-y-2 text-sm">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Add-ons
                </div>
                {service.addons
                  ?.filter((a) => addonIds.includes(a.id))
                  .map((a) => (
                    <div key={a.id} className="flex justify-between">
                      <span className="text-muted-foreground">{a.name}</span>
                      <span>+ RM {(a.price / 100).toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            )}

            <div className="pt-3 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  RM {(service.price / 100).toLocaleString()} × {nights} night
                  {nights === 1 ? '' : 's'}
                </span>
                <span>
                  RM {(((quote?.stay_subtotal ?? service.price * nights) - (quote?.weekend_surcharge ?? 0)) / 100).toLocaleString()}
                </span>
              </div>
              {quote && quote.weekend_surcharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Weekend surcharge ({quote.settings.weekend_surcharge_pct}% × {quote.weekend_nights} night
                    {quote.weekend_nights === 1 ? '' : 's'})
                  </span>
                  <span>+ RM {(quote.weekend_surcharge / 100).toLocaleString()}</span>
                </div>
              )}
              {quote && quote.addons_total > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Add-ons</span>
                  <span>RM {(quote.addons_total / 100).toLocaleString()}</span>
                </div>
              )}
              {quote && quote.cleaning_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cleaning fee</span>
                  <span>RM {(quote.cleaning_fee / 100).toLocaleString()}</span>
                </div>
              )}
              {quote && quote.sst_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    SST ({quote.settings.sst_rate}%)
                  </span>
                  <span>RM {(quote.sst_amount / 100).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-dashed border-border">
                <span>Total</span>
                <span>RM {(totalPrice / 100).toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/15 p-4 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Lock className="h-4 w-4" />
                  Deposit ({depositPct}%)
                </div>
                <div className="text-xl font-bold text-primary">
                  RM {(depositAmount / 100).toLocaleString()}
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Info className="h-3 w-3" />
                Balance RM {((totalPrice - depositAmount) / 100).toLocaleString()} due on check-in.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* --------------------------- Helpers ---------------------------- */

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function toIsoDate(d: Date): string {
  // YYYY-MM-DD in local time (avoids UTC off-by-one)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  )
}

function EmptyState({
  icon,
  title,
  message,
}: {
  icon?: React.ReactNode
  title?: string
  message: string
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center space-y-3">
        {icon && (
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mx-auto">
            {icon}
          </div>
        )}
        {title && <h3 className="font-semibold">{title}</h3>}
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/">Back to home</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function serviceIcon(name: string) {
  if (/Langkawi|Seaview|🌊/i.test(name)) {
    return <Waves className="h-12 w-12 text-sky-500" strokeWidth={1.25} />
  }
  if (/Cameron|Highland|🌄/i.test(name)) {
    return <Trees className="h-12 w-12 text-emerald-500" strokeWidth={1.25} />
  }
  if (/KL|City|Apartment|🏙/i.test(name)) {
    return <Building2 className="h-12 w-12 text-amber-500" strokeWidth={1.25} />
  }
  return <House className="h-12 w-12 text-primary" strokeWidth={1.25} />
}
