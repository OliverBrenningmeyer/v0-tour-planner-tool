"use client"

import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface EmptySlotProps {
  day: string
  onClick: (day: string) => void
}

export function EmptySlot({ day, onClick }: EmptySlotProps) {
  return (
    <Card
      className="border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
      onClick={() => onClick(day)}
    >
      <CardContent className="p-4 flex flex-col items-center justify-center text-gray-500 hover:text-blue-600">
        <Plus className="h-8 w-8 mb-2" />
        <p className="text-sm font-medium">Add Transport</p>
        <p className="text-xs">Click to schedule for {day}</p>
      </CardContent>
    </Card>
  )
}
