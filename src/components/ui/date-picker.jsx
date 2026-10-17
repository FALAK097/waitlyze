"use client"

import * as React from "react"
import { addDays, differenceInCalendarDays, format, isAfter, isBefore } from "date-fns"
import { CalendarIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const MAX_RANGE_DAYS = 90

export function formatDateRange(from, to) {
  if (!from) return null
  if (!to) return format(from, "LLL dd, y")
  return `${format(from, "LLL dd, y")} – ${format(to, "LLL dd, y")}`
}

export function DatePickerRange({ value, onChange, maxDays = MAX_RANGE_DAYS, placeholder = "Custom", ...props }) {
  const today = React.useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const disabled = React.useCallback((day) => {
    if (isAfter(day, today)) return true
    if (!value?.from) return false
    if (isBefore(day, value.from)) return false
    return differenceInCalendarDays(day, value.from) >= maxDays
  }, [today, value?.from, maxDays])

  return (
    <Popover {...props}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            data-empty={!value?.from}
            className="justify-start px-2.5 font-normal data-[empty=true]:text-muted-foreground"
          />
        }
      >
        <HugeiconsIcon icon={CalendarIcon} aria-hidden="true" />
        {value?.from ? (
          value.to ? (
            `${format(value.from, "LLL dd")} – ${format(value.to, "LLL dd, y")}`
          ) : (
            format(value.from, "LLL dd, y")
          )
        ) : (
          <span>{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          defaultMonth={value?.from ?? addDays(today, -6)}
          selected={value}
          onSelect={(range) => {
            if (!range?.from || !range?.to) return
            onChange?.({ from: range.from, to: range.to })
          }}
          disabled={disabled}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}
