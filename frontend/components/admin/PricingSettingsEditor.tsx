"use client"

import * as React from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PriceInput } from "@/components/admin/PriceInput"
import {
  Loader2,
  Save,
  RotateCcw,
  Percent,
  Receipt,
  CalendarRange,
  Sparkles,
  Info,
  Lock,
} from "lucide-react"

const WEEKDAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const

type DayKey = (typeof WEEKDAYS)[number]["key"]

type PricingSettings = {
  sst_enabled: boolean
  sst_rate: number
  weekend_pricing_enabled: boolean
  weekend_surcharge_pct: number
  weekend_days: DayKey[]
  default_deposit_pct: number
  cleaning_fee_enabled: boolean
  cleaning_fee_amount: number
}

const DEFAULTS: PricingSettings = {
  sst_enabled: false,
  sst_rate: 6,
  weekend_pricing_enabled: false,
  weekend_surcharge_pct: 20,
  weekend_days: ["sat", "sun"],
  default_deposit_pct: 30,
  cleaning_fee_enabled: false,
  cleaning_fee_amount: 0,
}

export function PricingSettingsEditor() {
  const [settings, setSettings] = React.useState<PricingSettings>(DEFAULTS)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/admin/pricing-settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({ ...DEFAULTS, ...data })
        setLoading(false)
      })
      .catch(() => {
        toast.error("Could not load pricing settings")
        setLoading(false)
      })
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/pricing-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      toast.success("Pricing rules saved", {
        description: "New rules apply to bookings created from now on.",
      })
    } catch {
      toast.error("Could not save pricing settings")
    } finally {
      setSaving(false)
    }
  }

  function resetToDefaults() {
    setSettings(DEFAULTS)
    toast.info("Reverted to defaults — click Save to persist.")
  }

  function update<K extends keyof PricingSettings>(key: K, value: PricingSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  function toggleWeekendDay(day: DayKey) {
    setSettings((s) => ({
      ...s,
      weekend_days: s.weekend_days.includes(day)
        ? s.weekend_days.filter((d) => d !== day)
        : [...s.weekend_days, day],
    }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          <p className="text-sm mt-3">Loading pricing settings...</p>
        </CardContent>
      </Card>
    )
  }

  const samplePreview = previewSample(settings)

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold">Pricing rules</h2>
            <p className="text-sm text-muted-foreground">
              Toggle taxes, weekend surcharge, and cleaning fees. Changes apply
              instantly to new bookings.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefaults} disabled={saving}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SST */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <SectionHead
            icon={<Receipt className="h-4 w-4" />}
            title="SST (Sales & Service Tax)"
            description="Adds Malaysian SST on top of the booking total. Disable if your business is below the SST threshold."
          />
          <Toggle
            label="Enable SST"
            checked={settings.sst_enabled}
            onChange={(v) => update("sst_enabled", v)}
          />
          {settings.sst_enabled && (
            <div className="grid sm:grid-cols-2 gap-4">
              <PercentField
                label="SST rate (%)"
                value={settings.sst_rate}
                onChange={(v) => update("sst_rate", v)}
                hint="Malaysia's current rate is 6%."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* WEEKEND PRICING */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <SectionHead
            icon={<CalendarRange className="h-4 w-4" />}
            title="Weekend surcharge"
            description="Charge a higher rate on selected weekend nights."
          />
          <Toggle
            label="Enable weekend pricing"
            checked={settings.weekend_pricing_enabled}
            onChange={(v) => update("weekend_pricing_enabled", v)}
          />
          {settings.weekend_pricing_enabled && (
            <div className="space-y-4">
              <PercentField
                label="Surcharge (%)"
                value={settings.weekend_surcharge_pct}
                onChange={(v) => update("weekend_surcharge_pct", v)}
                hint="Added to each weekend night's rate. E.g. 20% on a RM 200 night = RM 240."
              />
              <div className="space-y-2">
                <Label>Weekend days</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((d) => {
                    const active = settings.weekend_days.includes(d.key)
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => toggleWeekendDay(d.key)}
                        className={[
                          "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40",
                        ].join(" ")}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CLEANING FEE */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <SectionHead
            icon={<Sparkles className="h-4 w-4" />}
            title="Cleaning fee"
            description="One-off flat fee charged per booking. Useful for short stays."
          />
          <Toggle
            label="Enable cleaning fee"
            checked={settings.cleaning_fee_enabled}
            onChange={(v) => update("cleaning_fee_enabled", v)}
          />
          {settings.cleaning_fee_enabled && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount per booking</Label>
                <PriceInput
                  value={settings.cleaning_fee_amount}
                  onValueChange={(cents) => update("cleaning_fee_amount", cents)}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="h-3 w-3" />
                  Charged once per booking regardless of nights.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DEFAULT DEPOSIT */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <SectionHead
            icon={<Lock className="h-4 w-4" />}
            title="Default deposit"
            description="Used when a homestay doesn't have its own deposit % set."
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <PercentField
              label="Default deposit (%)"
              value={settings.default_deposit_pct}
              onChange={(v) => update("default_deposit_pct", Math.round(v))}
              hint="Per-homestay override on the Homestays tab takes priority."
            />
          </div>
        </CardContent>
      </Card>

      {/* LIVE PREVIEW */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6 space-y-3">
          <SectionHead
            icon={<Percent className="h-4 w-4" />}
            title="Sample calculation"
            description="3-night stay at RM 200/night with 1 weekend night, no add-ons."
          />
          <div className="space-y-1.5 text-sm font-mono">
            <PreviewRow label="Stay (3 × RM 200)" value={samplePreview.stay} />
            {samplePreview.weekendSurcharge > 0 && (
              <PreviewRow
                label={`Weekend surcharge (${settings.weekend_surcharge_pct}% × 1 night)`}
                value={samplePreview.weekendSurcharge}
              />
            )}
            {samplePreview.cleaning > 0 && (
              <PreviewRow label="Cleaning fee" value={samplePreview.cleaning} />
            )}
            {samplePreview.sst > 0 && (
              <PreviewRow
                label={`SST (${settings.sst_rate}%)`}
                value={samplePreview.sst}
              />
            )}
            <div className="border-t border-primary/20 pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>RM {(samplePreview.total / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-primary font-semibold">
              <span>Deposit ({settings.default_deposit_pct}%)</span>
              <span>RM {(samplePreview.deposit / 100).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ----------------------------- Sub-components ---------------------------- */

function SectionHead({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full rounded-lg border border-border bg-background p-3 hover:border-primary/40 transition-colors"
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={[
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  )
}

function PercentField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  hint?: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min={0}
          max={500}
          step={0.5}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="pr-8"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          %
        </span>
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Info className="h-3 w-3" />
          {hint}
        </p>
      )}
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>RM {(value / 100).toFixed(2)}</span>
    </div>
  )
}

/**
 * Compute the same breakdown the backend would for a fixed sample
 * scenario (3 nights @ RM 200, 1 weekend night). Lets the admin see
 * how their settings affect the guest-facing total without leaving the page.
 */
function previewSample(s: PricingSettings) {
  const nightRate = 20_000
  const stay = nightRate * 3
  const weekendSurcharge = s.weekend_pricing_enabled
    ? Math.floor((nightRate * s.weekend_surcharge_pct) / 100)
    : 0
  const cleaning = s.cleaning_fee_enabled ? s.cleaning_fee_amount : 0
  const subtotal = stay + weekendSurcharge + cleaning
  const sst = s.sst_enabled ? Math.floor((subtotal * s.sst_rate) / 100) : 0
  const total = subtotal + sst
  const deposit = Math.floor((total * s.default_deposit_pct) / 100)
  return { stay, weekendSurcharge, cleaning, sst, total, deposit }
}
