"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Badge } from "@/components/ui/badge"
import { DraggableTransportCard } from "./draggable-transport-card"
import type { DroppableColumnProps } from "@/lib/types"

export function DroppableColumn({
  day,
  transports,
  capacityLimit,
  isAtCapacity,
  onTransportClick,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toLowerCase(),
  })

  const formattedDay = day.charAt(0).toUpperCase() + day.slice(1)
  const transportIds = transports.map((t) => t.id)

  // Determine column header color based on capacity and drag over state
  const getColumnHeaderClass = () => {
    if (isOver) return "bg-blue-200" // Highlight when dragging over
    if (isAtCapacity) return "bg-red-100"
    switch (day.toLowerCase()) {
      case "monday":
        return "bg-blue-100"
      case "wednesday":
        return "bg-green-100"
      case "friday":
        return "bg-purple-100"
      default:
        return "bg-gray-100"
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className={`p-4 rounded-t-lg ${getColumnHeaderClass()}`}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">{formattedDay}</h3>
          <Badge variant={isAtCapacity ? "destructive" : "outline"}>
            {transports.length}/{capacityLimit}
          </Badge>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`bg-gray-50 p-4 rounded-b-lg flex-1 min-h-[500px] border border-gray-200 overflow-y-auto ${
          isOver ? "bg-blue-50 border-blue-300" : ""
        }`}
      >
        <SortableContext items={transportIds} strategy={verticalListSortingStrategy}>
          {transports.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">No transports scheduled</div>
          ) : (
            <div className="space-y-3">
              {transports.map((transport, index) => (
                <DraggableTransportCard
                  key={transport.id}
                  transport={transport}
                  isOverCapacity={index >= capacityLimit}
                  index={index}
                  onClick={onTransportClick ? () => onTransportClick(transport) : undefined}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  )
}
