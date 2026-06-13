"use client"

import * as React from "react"
import Link from "next/link"
import {
  House,
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from "lucide-react"
import {
  DEFAULT_SITE_CONTENT,
  fetchSiteContent,
  type Branding,
  type Footer as FooterCopy,
} from "@/lib/site-content"
import { BrandName } from "@/components/site/BrandName"

export function SiteFooter() {
  const [copy, setCopy] = React.useState<FooterCopy>(DEFAULT_SITE_CONTENT.footer)
  const [branding, setBranding] = React.useState<Branding>(
    DEFAULT_SITE_CONTENT.branding,
  )

  React.useEffect(() => {
    fetchSiteContent().then((data) => {
      setCopy(data.footer)
      setBranding(data.branding)
    })
  }, [])

  return (
    <footer className="mt-24 border-t border-border bg-muted/40">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
                {branding.logo_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/storage/${branding.logo_path}`}
                    alt={branding.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <House className="h-5 w-5" />
                )}
              </span>
              <span className="font-display text-lg font-bold tracking-tight">
                <BrandName name={branding.name} />
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              {copy.description}
            </p>
            <div className="flex items-center gap-2 pt-2">
              {branding.social.facebook && (
                <SocialIcon href={branding.social.facebook} label="Facebook">
                  <Facebook className="h-4 w-4" />
                </SocialIcon>
              )}
              {branding.social.instagram && (
                <SocialIcon href={branding.social.instagram} label="Instagram">
                  <Instagram className="h-4 w-4" />
                </SocialIcon>
              )}
              {branding.social.twitter && (
                <SocialIcon href={branding.social.twitter} label="Twitter">
                  <Twitter className="h-4 w-4" />
                </SocialIcon>
              )}
              {branding.social.email && (
                <SocialIcon href={`mailto:${branding.social.email}`} label="Email">
                  <Mail className="h-4 w-4" />
                </SocialIcon>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Browse stays
                </Link>
              </li>
              <li>
                <Link
                  href="/book"
                  className="hover:text-foreground transition-colors"
                >
                  Book a stay
                </Link>
              </li>
              <li>
                <Link
                  href="/#destinations"
                  className="hover:text-foreground transition-colors"
                >
                  Destinations
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="hover:text-foreground transition-colors"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-primary shrink-0" />
                <a
                  href={`mailto:${copy.email}`}
                  className="hover:text-foreground transition-colors break-all"
                >
                  {copy.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-primary shrink-0" />
                <a
                  href={`tel:${copy.phone.replace(/\s+/g, '')}`}
                  className="hover:text-foreground transition-colors"
                >
                  {copy.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-primary shrink-0" />
                {copy.location}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {branding.name}. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
    >
      {children}
    </a>
  )
}
