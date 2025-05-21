"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, addWeeks, startOfWeek, endOfWeek, isToday } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface WeekSelectorProps {
  currentWeek: Date
  onWeekChange: (date: Date) => void
}

export function WeekSelector({ currentWeek, onWeekChange }: WeekSelectorProps) {
  const [open, setOpen] = useState(false)

  // Calculate the start and end of the current week
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Start on Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }) // End on Sunday

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const previousWeek = addWeeks(currentWeek, -1)
    onWeekChange(previousWeek)
  }

  // Navigate to next week
  const goToNextWeek = () => {
    const nextWeek = addWeeks(currentWeek, 1)
    onWeekChange(nextWeek)
  }

  // Go to today's week
  const goToCurrentWeek = () => {
    onWeekChange(new Date())
  }

  // Handle date selection from calendar
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onWeekChange(date)
      setOpen(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="icon" onClick={goToPreviousWeek} aria-label="Previous Week">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              isToday(weekStart) && "border-blue-500 text-blue-600",
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            <span>
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent mode="single" selected={currentWeek} onSelect={handleSelect} initialFocus />
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="icon" onClick={goToNextWeek} aria-label="Next Week">
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={goToCurrentWeek} className="ml-2">
        Current Week
      </Button>
    </div>
  )
}
