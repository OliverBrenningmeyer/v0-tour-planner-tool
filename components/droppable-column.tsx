"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { DraggableTransportCard } from "./draggable-transport-card"
import { EmptySlot } from "./empty-slot"
import { CapacityProgressBar } from "./capacity-progress-bar"
import type { DroppableColumnProps } from "@/lib/types"
import { format } from "date-fns"

export function DroppableColumn({
  day,
  date,
  transports,
  addonTransports,
  capacityLimits,
  capacityUsage,
  isAtCapacity,
  onTransportClick,
  onEmptySlotClick,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toLowerCase(),
  })

  const formattedDay = day.charAt(0).toUpperCase() + day.slice(1)
  const transportIds = [...transports, ...addonTransports].map((t) => t.id)

  // Always show one empty slot for adding transports
  const showAddonEmptySlot = addonTransports.length > 0 || isAtCapacity

  // Format the date - ensure we have a valid date
  const formattedDate = date && !isNaN(date.getTime()) ? format(date, "EEE, MMM d, yyyy") : ""

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
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-semibold text-lg">{formattedDay}</h3>
            {formattedDate && <p className="text-sm text-gray-600">{formattedDate}</p>}
          </div>
        </div>

        {/* Capacity progress bars - only showing weight and volume */}
        <div className="space-y-2">
          <CapacityProgressBar
            current={Number(capacityUsage.weight) || 0}
            max={Number(capacityLimits.weight) || 1000}
            label="Weight"
            unit=" kg"
          />
          <CapacityProgressBar
            current={Number(capacityUsage.volume) || 0}
            max={Number(capacityLimits.volume) || 10}
            label="Volume"
            unit=" m³"
          />
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`bg-gray-50 p-4 rounded-b-lg flex-1 min-h-[500px] border border-gray-200 overflow-y-auto ${
          isOver ? "bg-blue-50 border-blue-300" : ""
        }`}
      >
        <SortableContext items={transportIds} strategy={verticalListSortingStrategy}>
          {transports.length === 0 && addonTransports.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">No transports scheduled</div>
          ) : (
            <div className="space-y-6">
              {/* Main capacity section */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-500">Regular Slots</h4>
                {transports.map((transport, index) => (
                  <DraggableTransportCard
                    key={transport.id}
                    transport={transport}
                    isOverCapacity={false}
                    index={index}
                    onClick={onTransportClick ? () => onTransportClick(transport) : undefined}
                  />
                ))}

                {/* Always show one empty slot for adding transports */}
                <EmptySlot
                  key={`empty-${day}`}
                  day={day.toLowerCase()}
                  onClick={() => (onEmptySlotClick ? onEmptySlotClick(day.toLowerCase(), false) : undefined)}
                />
              </div>

              {/* Addon section - only show if there are addon transports or if any capacity is reached */}
              {showAddonEmptySlot && (
                <div className="space-y-3 border-t pt-4 border-dashed border-gray-300">
                  <h4 className="text-sm font-medium text-gray-500">Additional Slots (Over Capacity)</h4>
                  {addonTransports.map((transport, index) => (
                    <DraggableTransportCard
                      key={transport.id}
                      transport={transport}
                      isOverCapacity={true}
                      index={transports.length + index}
                      onClick={onTransportClick ? () => onTransportClick(transport) : undefined}
                    />
                  ))}

                  {/* Always show one empty slot in addon section */}
                  <EmptySlot
                    key={`addon-empty-${day}`}
                    day={day.toLowerCase()}
                    isAddon={true}
                    onClick={() => (onEmptySlotClick ? onEmptySlotClick(day.toLowerCase(), true) : undefined)}
                  />
                </div>
              )}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  )
}
