"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  /** ISO-ish string like "2026-06-01T14:00" (or empty) */
  value: string
  onChange: (value: string) => void
  /** Disable dates before this Date (e.g. today) */
  disablePast?: boolean
  placeholder?: string
  id?: string
}

/**
 * Visual date + time picker that emits the same `datetime-local` format
 * the backend expects ("YYYY-MM-DDTHH:mm").
 */
export function DateTimePicker({
  value,
  onChange,
  disablePast = true,
  placeholder = "Pick a date",
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const date = value ? parseLocal(value) : undefined
  const timeStr = value ? value.slice(11, 16) : "14:00"

  function handleDateSelect(d?: Date) {
    if (!d) return
    const next = formatLocal(d, timeStr)
    onChange(next)
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newTime = e.target.value || "00:00"
    const base = date ?? new Date()
    onChange(formatLocal(base, newTime))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {value ? formatHuman(date!, timeStr) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={
            disablePast
              ? (d) => d < new Date(new Date().setHours(0, 0, 0, 0))
              : undefined
          }
          autoFocus
        />
        <div className="border-t border-border p-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Input
            type="time"
            value={timeStr}
            onChange={handleTimeChange}
            className="h-8"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function parseLocal(value: string): Date {
  // Format from input: "YYYY-MM-DDTHH:mm"
  const [datePart, timePart = "00:00"] = value.split("T")
  const [y, m, d] = datePart.split("-").map(Number)
  const [hh, mm] = timePart.split(":").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0)
}

function formatLocal(date: Date, time: string): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}T${time}`
}

function formatHuman(date: Date, time: string): string {
  return `${date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })} · ${time}`
}
