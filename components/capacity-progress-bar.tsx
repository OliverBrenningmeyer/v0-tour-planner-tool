"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface CapacityProgressBarProps {
  current: number
  max: number
  label: string
  unit?: string
  className?: string
}

export function CapacityProgressBar({ current, max, label, unit = "", className }: CapacityProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, (current / max) * 100) : 0
  const isAtCapacity = percentage >= 100
  const isNearCapacity = percentage >= 80

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium", isAtCapacity && "text-red-600", isNearCapacity && "text-amber-600")}>
          {current}/{max}
          {unit} ({Math.round(percentage)}%)
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-2"
        indicatorClassName={cn(
          isAtCapacity ? "bg-red-500" : "",
          isNearCapacity && !isAtCapacity ? "bg-amber-500" : "",
          !isNearCapacity ? "bg-green-500" : "",
        )}
      />
    </div>
  )
}
