"use client"

import * as React from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DEFAULT_SITE_CONTENT,
  mergeWithDefaults,
  type FeatureItem,
  type SiteContent,
  type StepItem,
  type Testimonial,
} from "@/lib/site-content"
import { ICON_KEYS, ICON_LABELS, getIcon } from "@/lib/icons"
import {
  Sparkles,
  TrendingUp,
  Quote,
  Megaphone,
  Plus,
  Trash2,
  Save,
  Loader2,
  RotateCcw,
  Layers,
  ListChecks,
  Wand2,
  PanelBottom,
} from "lucide-react"

export function SiteContentEditor() {
  const [content, setContent] = React.useState<SiteContent>(DEFAULT_SITE_CONTENT)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/admin/site-content")
      .then((r) => r.json())
      .then((data) => {
        setContent(mergeWithDefaults(data))
        setLoading(false)
      })
      .catch(() => {
        toast.error("Could not load site content")
        setLoading(false)
      })
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      })
      if (!res.ok) throw new Error()
      toast.success("Site content saved", {
        description: "Visit the homepage to see your changes live.",
      })
    } catch {
      toast.error("Could not save site content")
    } finally {
      setSaving(false)
    }
  }

  function resetToDefaults() {
    setContent(DEFAULT_SITE_CONTENT)
    toast.info("Reverted to defaults — click Save to persist.")
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          <p className="text-sm mt-3">Loading site content...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold">Edit homepage content</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Changes go live on the public site as soon as you save.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              disabled={saving}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* HERO */}
      <SectionCard
        icon={Sparkles}
        title="Hero"
        description="The big intro at the top of the homepage."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hero-badge">Badge label</Label>
            <Input
              id="hero-badge"
              value={content.hero.badge}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  hero: { ...c.hero, badge: e.target.value },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-title">Headline</Label>
            <Textarea
              id="hero-title"
              rows={2}
              value={content.hero.title}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  hero: { ...c.hero, title: e.target.value },
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Tip: press Enter for line breaks.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-subtitle">Subtitle</Label>
            <Textarea
              id="hero-subtitle"
              rows={3}
              value={content.hero.subtitle}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  hero: { ...c.hero, subtitle: e.target.value },
                }))
              }
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hero-cta1">Primary button</Label>
              <Input
                id="hero-cta1"
                value={content.hero.cta_primary}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    hero: { ...c.hero, cta_primary: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-cta2">Secondary button</Label>
              <Input
                id="hero-cta2"
                value={content.hero.cta_secondary}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    hero: { ...c.hero, cta_secondary: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* TRUST STATS */}
      <SectionCard
        icon={TrendingUp}
        title="Trust stats"
        description="The four numbers shown below the hero (e.g. '500+ stays')."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          {content.trust_stats.map((stat, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border p-3 space-y-3"
            >
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Stat #{idx + 1}
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Value</Label>
                <Input
                  value={stat.value}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      trust_stats: updateAt(c.trust_stats, idx, {
                        ...stat,
                        value: e.target.value,
                      }),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Label</Label>
                <Input
                  value={stat.label}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      trust_stats: updateAt(c.trust_stats, idx, {
                        ...stat,
                        label: e.target.value,
                      }),
                    }))
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* SECTION HEADINGS */}
      <SectionCard
        icon={Layers}
        title="Section headings"
        description="The eyebrow / title / description shown above the Stays, Destinations, and Testimonials sections."
      >
        <div className="space-y-5">
          {(
            [
              { prefix: 'stays', label: 'Stays section', noDescription: false },
              { prefix: 'destinations', label: 'Destinations section', noDescription: false },
              { prefix: 'testimonials', label: 'Testimonials section', noDescription: true },
            ] as Array<{
              prefix: 'stays' | 'destinations' | 'testimonials'
              label: string
              noDescription: boolean
            }>
          ).map(({ prefix, label, noDescription }) => (
            <div
              key={prefix}
              className="rounded-lg border border-border p-4 space-y-3"
            >
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {label}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Eyebrow</Label>
                  <Input
                    value={content.headings[`${prefix}_eyebrow` as const]}
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        headings: {
                          ...c.headings,
                          [`${prefix}_eyebrow`]: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={content.headings[`${prefix}_title` as const]}
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        headings: {
                          ...c.headings,
                          [`${prefix}_title`]: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
              {!noDescription && (
                <div className="space-y-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    rows={2}
                    value={
                      content.headings[
                        `${prefix}_description` as 'stays_description' | 'destinations_description'
                      ]
                    }
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        headings: {
                          ...c.headings,
                          [`${prefix}_description`]: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* HOW IT WORKS */}
      <SectionCard
        icon={ListChecks}
        title="How it works"
        description="The 4-step explainer block."
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Eyebrow</Label>
              <Input
                value={content.how_it_works.eyebrow}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    how_it_works: {
                      ...c.how_it_works,
                      eyebrow: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Title</Label>
              <Input
                value={content.how_it_works.title}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    how_it_works: { ...c.how_it_works, title: e.target.value },
                  }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Description</Label>
            <Textarea
              rows={2}
              value={content.how_it_works.description}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  how_it_works: {
                    ...c.how_it_works,
                    description: e.target.value,
                  },
                }))
              }
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <Label className="text-xs">Steps</Label>
            {content.how_it_works.items.map((step, idx) => (
              <StepItemRow
                key={idx}
                index={idx}
                item={step}
                onChange={(next) =>
                  setContent((c) => ({
                    ...c,
                    how_it_works: {
                      ...c.how_it_works,
                      items: updateAt<StepItem>(c.how_it_works.items, idx, next),
                    },
                  }))
                }
                onRemove={() =>
                  setContent((c) => ({
                    ...c,
                    how_it_works: {
                      ...c.how_it_works,
                      items: removeAt(c.how_it_works.items, idx),
                    },
                  }))
                }
                disabled={content.how_it_works.items.length <= 1}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  how_it_works: {
                    ...c.how_it_works,
                    items: [
                      ...c.how_it_works.items,
                      {
                        icon: 'sparkles',
                        n: String(c.how_it_works.items.length + 1).padStart(2, '0'),
                        title: '',
                        description: '',
                      },
                    ],
                  },
                }))
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add step
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* FEATURES */}
      <SectionCard
        icon={Wand2}
        title="Why Home Anywhere"
        description="The feature grid that explains your value props."
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Eyebrow</Label>
              <Input
                value={content.features.eyebrow}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    features: { ...c.features, eyebrow: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Title</Label>
              <Input
                value={content.features.title}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    features: { ...c.features, title: e.target.value },
                  }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Description</Label>
            <Textarea
              rows={2}
              value={content.features.description}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  features: { ...c.features, description: e.target.value },
                }))
              }
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <Label className="text-xs">Features</Label>
            {content.features.items.map((feat, idx) => (
              <FeatureItemRow
                key={idx}
                index={idx}
                item={feat}
                onChange={(next) =>
                  setContent((c) => ({
                    ...c,
                    features: {
                      ...c.features,
                      items: updateAt<FeatureItem>(c.features.items, idx, next),
                    },
                  }))
                }
                onRemove={() =>
                  setContent((c) => ({
                    ...c,
                    features: {
                      ...c.features,
                      items: removeAt(c.features.items, idx),
                    },
                  }))
                }
                disabled={content.features.items.length <= 1}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  features: {
                    ...c.features,
                    items: [
                      ...c.features.items,
                      { icon: 'sparkles', title: '', description: '' },
                    ],
                  },
                }))
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add feature
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* TESTIMONIALS */}
      <SectionCard
        icon={Quote}
        title="Testimonials"
        description="Guest quotes shown near the bottom of the homepage."
      >
        <div className="space-y-3">
          {content.testimonials.map((t, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Testimonial #{idx + 1}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
                  onClick={() =>
                    setContent((c) => ({
                      ...c,
                      testimonials: removeAt(c.testimonials, idx),
                    }))
                  }
                  disabled={content.testimonials.length <= 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Quote</Label>
                <Textarea
                  rows={2}
                  value={t.quote}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      testimonials: updateAt<Testimonial>(c.testimonials, idx, {
                        ...t,
                        quote: e.target.value,
                      }),
                    }))
                  }
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Author</Label>
                  <Input
                    value={t.author}
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        testimonials: updateAt<Testimonial>(
                          c.testimonials,
                          idx,
                          { ...t, author: e.target.value },
                        ),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Role / context</Label>
                  <Input
                    placeholder="e.g. Family of 4"
                    value={t.role}
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        testimonials: updateAt<Testimonial>(
                          c.testimonials,
                          idx,
                          { ...t, role: e.target.value },
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setContent((c) => ({
                ...c,
                testimonials: [
                  ...c.testimonials,
                  { quote: '', author: '', role: '' },
                ],
              }))
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add testimonial
          </Button>
        </div>
      </SectionCard>

      {/* CTA BANNER */}
      <SectionCard
        icon={Megaphone}
        title="Closing CTA banner"
        description="The dark banner at the bottom of the homepage."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cta-title">Headline</Label>
            <Textarea
              id="cta-title"
              rows={2}
              value={content.cta_banner.title}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  cta_banner: { ...c.cta_banner, title: e.target.value },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cta-desc">Description</Label>
            <Textarea
              id="cta-desc"
              rows={2}
              value={content.cta_banner.description}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  cta_banner: {
                    ...c.cta_banner,
                    description: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Primary button</Label>
              <Input
                value={content.cta_banner.cta_primary}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    cta_banner: {
                      ...c.cta_banner,
                      cta_primary: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Secondary button</Label>
              <Input
                value={content.cta_banner.cta_secondary}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    cta_banner: {
                      ...c.cta_banner,
                      cta_secondary: e.target.value,
                    },
                  }))
                }
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* FOOTER */}
      <SectionCard
        icon={PanelBottom}
        title="Footer"
        description="Brand pitch + contact details shown at the very bottom of every page."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Brand description</Label>
            <Textarea
              rows={3}
              value={content.footer.description}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  footer: { ...c.footer, description: e.target.value },
                }))
              }
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={content.footer.email}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    footer: { ...c.footer, email: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Phone</Label>
              <Input
                value={content.footer.phone}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    footer: { ...c.footer, phone: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Location</Label>
              <Input
                value={content.footer.location}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    footer: { ...c.footer, location: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end pt-2">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save all changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

/* ---------- helpers & sub-components ---------- */

function StepItemRow({
  index,
  item,
  onChange,
  onRemove,
  disabled,
}: {
  index: number
  item: StepItem
  onChange: (item: StepItem) => void
  onRemove: () => void
  disabled: boolean
}) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Step #{index + 1}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
          onClick={onRemove}
          disabled={disabled}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <IconPickerField
          value={item.icon}
          onChange={(icon) => onChange({ ...item, icon })}
        />
        <div className="space-y-2">
          <Label className="text-xs">Number</Label>
          <Input
            value={item.n}
            onChange={(e) => onChange({ ...item, n: e.target.value })}
            placeholder="01"
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label className="text-xs">Title</Label>
          <Input
            value={item.title}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Description</Label>
        <Textarea
          rows={2}
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
        />
      </div>
    </div>
  )
}

function FeatureItemRow({
  index,
  item,
  onChange,
  onRemove,
  disabled,
}: {
  index: number
  item: FeatureItem
  onChange: (item: FeatureItem) => void
  onRemove: () => void
  disabled: boolean
}) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Feature #{index + 1}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
          onClick={onRemove}
          disabled={disabled}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <IconPickerField
          value={item.icon}
          onChange={(icon) => onChange({ ...item, icon })}
        />
        <div className="space-y-2">
          <Label className="text-xs">Title</Label>
          <Input
            value={item.title}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Description</Label>
        <Textarea
          rows={2}
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
        />
      </div>
    </div>
  )
}

function IconPickerField({
  value,
  onChange,
}: {
  value: string
  onChange: (key: string) => void
}) {
  const Preview = getIcon(value)
  return (
    <div className="space-y-2">
      <Label className="text-xs">Icon</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue>
            <span className="flex items-center gap-2">
              <Preview className="h-4 w-4 text-primary" />
              {ICON_LABELS[value as keyof typeof ICON_LABELS] ?? value}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ICON_KEYS.map((key) => {
            const Icon = getIcon(key)
            return (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {ICON_LABELS[key]}
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <div className="pt-2">{children}</div>
      </CardContent>
    </Card>
  )
}

function updateAt<T>(arr: T[], idx: number, value: T): T[] {
  return arr.map((item, i) => (i === idx ? value : item))
}

function removeAt<T>(arr: T[], idx: number): T[] {
  return arr.filter((_, i) => i !== idx)
}
