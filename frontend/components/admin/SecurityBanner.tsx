'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert, X } from 'lucide-react'

/**
 * Warns the operator when the admin password is still a shipped placeholder
 * (e.g. `change-me`) or otherwise weak. We don't block access — the operator
 * can dismiss it for the session — but the warning stays loud so a real
 * business never ends up behind a guessable password.
 *
 * The check runs on the backend (/api/admin/security-status), which compares
 * the configured ADMIN_PASSWORD against a known weak list without ever
 * exposing the password itself.
 */
export function SecurityBanner() {
  const [weak, setWeak] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/admin/security-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.password?.weak) setWeak(true)
      })
      .catch(() => {
        // Network/backend issues are surfaced elsewhere; the banner just
        // stays hidden rather than throwing a false alarm.
      })
    return () => {
      active = false
    }
  }, [])

  if (!weak || dismissed) return null

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800"
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">Your admin password is weak or still the default.</p>
        <p className="mt-1 text-rose-700">
          Anyone who guesses it can manage your homestays and bookings. Set a
          strong <code className="rounded bg-rose-100 px-1 py-0.5 font-mono text-xs">ADMIN_PASSWORD</code>{' '}
          (8+ characters, not <code className="rounded bg-rose-100 px-1 py-0.5 font-mono text-xs">change-me</code>) in
          your <code className="rounded bg-rose-100 px-1 py-0.5 font-mono text-xs">.env</code>, then restart the app.
          See{' '}
          <a
            href="https://github.com/AmiQT/home-anywhere/blob/main/SETUP.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            SETUP.md
          </a>{' '}
          for the steps.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss security warning"
        className="rounded p-1 text-rose-500 transition-colors hover:bg-rose-100 hover:text-rose-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
