"use client"

import { useState, useEffect } from "react"
import { format, isMonday, isWednesday, isFriday } from "date-fns"
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
  placeholder?: string
}

export function DeliveryDatePicker({
  value,
  onChange,
  label,
  disabled = false,
  placeholder = "Select date",
}: DeliveryDatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [open, setOpen] = useState(false)

  // Convert day string to date when value changes
  useEffect(() => {
    if (value) {
      const today = new Date()
      const targetDate = new Date(today)

      // Find the next occurrence of the selected day
      while (
        (value === "monday" && !isMonday(targetDate)) ||
        (value === "wednesday" && !isWednesday(targetDate)) ||
        (value === "friday" && !isFriday(targetDate))
      ) {
        targetDate.setDate(targetDate.getDate() + 1)
      }

      setDate(targetDate)
    } else {
      setDate(undefined)
    }
  }, [value])

  // Filter available dates to only Monday, Wednesday, Friday
  const isDateAvailable = (date: Date) => {
    const day = date.getDay()
    return day === 1 || day === 3 || day === 5 // Monday, Wednesday, Friday
  }

  // Convert selected date to day string
  const handleDateChange = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange("")
      setDate(undefined)
      setOpen(false)
      return
    }

    const day = selectedDate.getDay()
    let dayString = ""

    if (day === 1) dayString = "monday"
    else if (day === 3) dayString = "wednesday"
    else if (day === 5) dayString = "friday"

    if (dayString) {
      onChange(dayString)
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
            <span>
              {placeholder}
              {label ? ` ${label}` : ""}
            </span>
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
            Only Monday, Wednesday, and Friday are available for delivery.
          </p>
          {value && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => handleDateChange(undefined)}>
              Clear selection
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
