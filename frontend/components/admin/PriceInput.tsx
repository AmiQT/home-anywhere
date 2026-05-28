"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PriceInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  /** Value in cents (integer). RM 1.00 = 100 */
  value: number | string
  /** Called with the new value in cents (integer) */
  onValueChange: (cents: number) => void
}

/**
 * Price input that displays RM values but stores cents internally.
 * Non-technical admins type "500" or "500.50" — we save 50000 / 50050.
 */
export const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  ({ value, onValueChange, className, placeholder, ...props }, ref) => {
    const [text, setText] = React.useState(() => centsToText(value))

    React.useEffect(() => {
      const next = centsToText(value)
      setText((current) => (parseText(current) === parseText(next) ? current : next))
    }, [value])

    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
          RM
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          className={cn("pl-11 font-medium", className)}
          placeholder={placeholder ?? "0.00"}
          value={text}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.]/g, "")
            const parts = raw.split(".")
            // Allow only one decimal point, max 2 decimal digits
            const cleaned =
              parts.length > 1
                ? `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`
                : parts[0]
            setText(cleaned)
            const cents = parseText(cleaned)
            onValueChange(cents)
          }}
          onBlur={(e) => {
            // Normalise display on blur: "5" → "5.00", "5.5" → "5.50"
            const cents = parseText(text)
            setText(centsToText(cents))
            props.onBlur?.(e)
          }}
          {...props}
        />
      </div>
    )
  },
)
PriceInput.displayName = "PriceInput"

function parseText(text: string): number {
  if (!text || text === ".") return 0
  const num = Number(text)
  if (Number.isNaN(num)) return 0
  return Math.round(num * 100)
}

function centsToText(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value
  if (!n || Number.isNaN(n)) return ""
  return (n / 100).toFixed(2)
}
