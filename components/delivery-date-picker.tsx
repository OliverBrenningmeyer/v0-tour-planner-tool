"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DeliveryDatePickerProps {
  value: string
  onChange: (day: string) => void
  label?: string
  disabled?: boolean
  availableDays?: string[]
}

export function DeliveryDatePicker({
  value,
  onChange,
  label,
  disabled = false,
  availableDays = ["monday", "wednesday", "friday"],
}: DeliveryDatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [open, setOpen] = useState(false)

  // Convert day string to date when value changes
  useEffect(() => {
    if (value) {
      const today = new Date()
      const targetDate = new Date(today)

      // Find the next occurrence of the selected day
      let daysChecked = 0
      while (daysChecked < 14) {
        // Prevent infinite loop
        const dayName = format(targetDate, "EEEE").toLowerCase()
        if (dayName === value) break

        targetDate.setDate(targetDate.getDate() + 1)
        daysChecked++
      }

      setDate(targetDate)
    } else {
      setDate(undefined)
    }
  }, [value])

  // Filter available dates based on configured available days
  const isDateAvailable = (date: Date) => {
    const dayName = format(date, "EEEE").toLowerCase()
    return availableDays.includes(dayName)
  }

  // Convert selected date to day string
  const handleDateChange = (selectedDate: Date | undefined) => {
    if (!selectedDate) return

    const dayName = format(selectedDate, "EEEE").toLowerCase()

    if (availableDays.includes(dayName)) {
      onChange(dayName)
      setDate(selectedDate)
      setOpen(false)
    }
  }

  return (
    <Popover open={open && !disabled} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            <>
              {format(date, "EEEE, MMMM d, yyyy")}
              {label && <span className="ml-1 text-muted-foreground">({label})</span>}
            </>
          ) : (
            <span>Select date{label ? ` ${label}` : ""}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateChange}
          disabled={(date) => !isDateAvailable(date) || date < new Date()}
          initialFocus
        />
        <div className="p-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Only {availableDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")} are available for
            delivery.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
