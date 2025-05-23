"use client"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, addWeeks, subWeeks, startOfWeek } from "date-fns"

interface WeekSelectorProps {
  currentWeek: Date
  onWeekChange: (week: Date) => void
}

export function WeekSelector({ currentWeek, onWeekChange }: WeekSelectorProps) {
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Start on Monday

  const handlePreviousWeek = () => {
    onWeekChange(subWeeks(currentWeek, 1))
  }

  const handleNextWeek = () => {
    onWeekChange(addWeeks(currentWeek, 1))
  }

  const handleCurrentWeek = () => {
    onWeekChange(new Date())
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
        <Calendar className="h-4 w-4" />
        <span className="font-medium">Week of {format(weekStart, "MMM d, yyyy")}</span>
      </div>

      <Button variant="outline" size="sm" onClick={handleNextWeek}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={handleCurrentWeek}>
        Today
      </Button>
    </div>
  )
}
