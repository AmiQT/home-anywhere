'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { track } from '@/lib/ga'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Mail,
  CalendarCheck,
  CreditCard,
  Home,
  CalendarPlus,
  Sparkles,
} from 'lucide-react'

export default function SuccessPage() {
  useEffect(() => {
    track('complete_booking')
  }, [])

  return (
    <div className="bg-muted/40 min-h-[calc(100vh-4rem)]">
      <div className="container py-20 max-w-2xl">
        <Card className="border-border/80 shadow-sm animate-fade-in overflow-hidden">
          <div className="bg-gradient-to-br from-accent via-background to-background border-b border-border px-8 py-10 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <Badge
              variant="secondary"
              className="mt-5 rounded-full bg-background border border-primary/15 text-primary"
            >
              <Sparkles className="h-3 w-3 mr-1.5" />
              Booking confirmed
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-4">
              You&apos;re all set!
            </h1>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Your homestay is locked in. We&apos;ve emailed you a receipt and a
              calendar invite — check your inbox.
            </p>
          </div>

          <CardContent className="p-8 space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <Highlight
                icon={CheckCircle2}
                label="Status"
                value="Confirmed"
              />
              <Highlight icon={Mail} label="Receipt" value="Sent via email" />
              <Highlight
                icon={CreditCard}
                label="Balance"
                value="On check-in"
              />
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-5">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                What happens next
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  Confirmation email with check-in instructions arrives in a few minutes.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  A Google Calendar invite is added automatically.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  Pay the remaining balance directly to the host on arrival.
                </li>
              </ul>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Back to home
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/book">
                  <CalendarPlus className="h-4 w-4" />
                  Book another stay
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Highlight({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <Icon className="h-5 w-5 text-primary mx-auto" />
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-2">
        {label}
      </div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  )
}
