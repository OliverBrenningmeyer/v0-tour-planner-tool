"use client"

import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptySlotProps {
  day?: string
  isAddon?: boolean
  onClick?: () => void
  className?: string
}

export function EmptySlot({ day, isAddon = false, onClick, className }: EmptySlotProps) {
  return (
    <div
      className={cn(
        "border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors",
        isAddon && "border-amber-300 hover:border-amber-400 hover:bg-amber-50",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 text-gray-500">
        <Plus className="h-4 w-4" />
        <span className="text-sm">{isAddon ? "Add Additional" : "Add Transport"}</span>
      </div>
    </div>
  )
}
