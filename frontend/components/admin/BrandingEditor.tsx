"use client"

import * as React from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DEFAULT_SITE_CONTENT,
  mergeWithDefaults,
  type Branding,
} from "@/lib/site-content"
import {
  House,
  Palette,
  Save,
  Loader2,
  Upload,
  Trash2,
  Facebook,
  Instagram,
  Twitter,
  Mail,
} from "lucide-react"

/**
 * Admin form for site branding: business name, tagline, social links, and a
 * logo upload. Text fields persist through the generic site-content endpoint
 * (PUT /api/admin/site-content, branding key); the logo uses its own upload
 * endpoint that writes the path back onto the branding row. Mirrors the
 * conventions in SiteContentEditor.tsx.
 */
export function BrandingEditor() {
  const [branding, setBranding] = React.useState<Branding>(
    DEFAULT_SITE_CONTENT.branding,
  )
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const logoInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    fetch("/api/admin/site-content")
      .then((r) => r.json())
      .then((data) => {
        setBranding(mergeWithDefaults(data).branding)
        setLoading(false)
      })
      .catch(() => {
        toast.error("Could not load branding")
        setLoading(false)
      })
  }, [])

  function setField<K extends keyof Branding>(key: K, value: Branding[K]) {
    setBranding((b) => ({ ...b, [key]: value }))
  }

  function setSocial(key: keyof Branding["social"], value: string) {
    setBranding((b) => ({ ...b, social: { ...b.social, [key]: value } }))
  }

  async function save() {
    if (!branding.name.trim()) {
      toast.error("Business name is required")
      return
    }
    setSaving(true)
    try {
      // Send only the branding key — setMap upserts it without touching the
      // other site-content rows.
      const res = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branding }),
      })
      if (!res.ok) throw new Error()
      toast.success("Branding saved", {
        description: "Reload the site to see your name and links live.",
      })
    } catch {
      toast.error("Could not save branding")
    } finally {
      setSaving(false)
    }
  }

  async function uploadLogo(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Logo must be an image (PNG, JPG, WebP, or SVG)")
      return
    }
    if (file.size > 1024 * 1024) {
      toast.error("Logo is over 1MB — pick a smaller file")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("logo", file)
      const res = await fetch("/api/admin/branding/logo", {
        method: "POST",
        body: fd,
      })
      if (!res.ok) throw new Error()
      const { logo_path } = await res.json()
      setField("logo_path", logo_path)
      toast.success("Logo uploaded")
    } catch {
      toast.error("Could not upload logo", {
        description: "Check the file format and that it's under 1MB.",
      })
    } finally {
      setUploading(false)
    }
  }

  async function removeLogo() {
    try {
      const res = await fetch("/api/admin/branding/logo", { method: "DELETE" })
      if (!res.ok) throw new Error()
      setField("logo_path", null)
      toast.success("Logo removed — using the default icon")
    } catch {
      toast.error("Could not remove logo")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          <p className="text-sm mt-3">Loading branding...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Branding
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your business name, logo, and social links — shown across the site,
            the footer, and the browser tab.
          </p>
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex items-center gap-4">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden shrink-0">
              {branding.logo_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/storage/${branding.logo_path}`}
                  alt="Current logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <House className="h-7 w-7" />
              )}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => logoInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload logo
                  </>
                )}
              </Button>
              {branding.logo_path && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={removeLogo}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                uploadLogo(e.target.files?.[0])
                e.target.value = ""
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Square works best. PNG, JPG, WebP, or SVG · up to 1MB. Leave empty to
            use the default house icon.
          </p>
        </div>

        {/* Name + tagline */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Business name</Label>
            <Input
              id="brand-name"
              placeholder="Homestay Pak Mat"
              value={branding.name}
              onChange={(e) => setField("name", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Shown in the header, footer, copyright, and browser tab.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-tagline">Tagline</Label>
            <Input
              id="brand-tagline"
              placeholder="Cosy stays in the heart of Penang"
              value={branding.tagline}
              onChange={(e) => setField("tagline", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Appears after your name in the browser tab and search results.
            </p>
          </div>
        </div>

        {/* Social links */}
        <div className="space-y-3">
          <Label>Social links</Label>
          <p className="text-xs text-muted-foreground -mt-1">
            Leave any blank to hide its icon in the footer.
          </p>
          <SocialField
            icon={<Facebook className="h-4 w-4" />}
            placeholder="https://facebook.com/yourpage"
            value={branding.social.facebook}
            onChange={(v) => setSocial("facebook", v)}
          />
          <SocialField
            icon={<Instagram className="h-4 w-4" />}
            placeholder="https://instagram.com/yourhandle"
            value={branding.social.instagram}
            onChange={(v) => setSocial("instagram", v)}
          />
          <SocialField
            icon={<Twitter className="h-4 w-4" />}
            placeholder="https://twitter.com/yourhandle"
            value={branding.social.twitter}
            onChange={(v) => setSocial("twitter", v)}
          />
          <SocialField
            icon={<Mail className="h-4 w-4" />}
            placeholder="hello@yourbusiness.com"
            value={branding.social.email}
            onChange={(v) => setSocial("email", v)}
          />
        </div>

        <div className="pt-2">
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save branding
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SocialField({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground shrink-0">
        {icon}
      </span>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
