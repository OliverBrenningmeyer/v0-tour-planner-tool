"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { DraggableTransportCard } from "./draggable-transport-card"
import { EmptySlot } from "./empty-slot"
import { CapacityProgressBar } from "./capacity-progress-bar"
import type { DroppableColumnProps } from "@/lib/types"
import { format } from "date-fns"
import { AlertTriangle } from "lucide-react"

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

  // Check if we're at or over capacity for weight or volume
  const isWeightAtCapacity = capacityUsage.weight >= capacityLimits.weight
  const isVolumeAtCapacity = capacityUsage.volume >= capacityLimits.volume
  const isAnyCapacityReached = isWeightAtCapacity || isVolumeAtCapacity

  // Format the date - ensure we have a valid date
  const formattedDate = date && !isNaN(date.getTime()) ? format(date, "EEE, MMM d, yyyy") : ""

  // Determine column header color based on capacity and drag over state
  const getColumnHeaderClass = () => {
    if (isOver) return "bg-blue-200" // Highlight when dragging over
    if (isAnyCapacityReached) return "bg-red-100"
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

                {/* Only show regular empty slot if capacity is not reached */}
                {!isAnyCapacityReached && (
                  <EmptySlot
                    key={`empty-${day}`}
                    day={day.toLowerCase()}
                    onClick={() => (onEmptySlotClick ? onEmptySlotClick(day.toLowerCase(), false) : undefined)}
                  />
                )}

                {/* Show capacity reached message instead of empty slot */}
                {isAnyCapacityReached && transports.length === 0 && (
                  <div className="border-2 border-dashed border-red-300 rounded-lg p-4 flex items-center justify-center bg-red-50">
                    <div className="text-center text-red-600">
                      <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm font-medium">Capacity Reached</p>
                      <p className="text-xs">Use additional slots below</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Addon section - always show if there are addon transports OR if capacity is reached */}
              {(addonTransports.length > 0 || isAnyCapacityReached) && (
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

                  {/* Always show one empty slot in addon section when capacity is reached */}
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
