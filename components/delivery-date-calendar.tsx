"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

interface DeliveryDateCalendarProps {
  value: string // ISO date string
  onChange: (value: string) => void
  label: string
  availableDays?: string[] // e.g., ["monday", "wednesday", "friday"]
  placeholder?: string
}

export function DeliveryDateCalendar({
  value,
  onChange,
  label,
  availableDays = ["monday", "tuesday", "wednesday", "thursday", "friday"],
  placeholder = "Select date",
}: DeliveryDateCalendarProps) {
  const [open, setOpen] = useState(false)

  // Parse the current value
  const selectedDate = value ? parseISO(value) : undefined

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date.toISOString())
      setOpen(false)
    }
  }

  // Disable dates that are not in availableDays
  const isDateDisabled = (date: Date) => {
    const dayName = format(date, "EEEE").toLowerCase()
    return !availableDays.includes(dayName)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={isDateDisabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
