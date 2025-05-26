"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TransportCard } from "./transport-card"
import { DroppableColumn } from "./droppable-column"
import { TransportDetailDialog } from "./transport-detail-dialog"
import type { Transport, CapacityLimits, CapacityUsage } from "@/lib/types"
import { startOfWeek, addDays } from "date-fns"

interface TransportKanbanBoardProps {
  transports: Transport[]
  capacitySettings: {
    [key: string]: CapacityLimits
  }
  onTransportsChange: (transports: Transport[]) => void
  onEmptySlotClick?: (day: string, isAddon?: boolean) => void
  selectedWeek: Date
  availableDays?: string[]
}

export function TransportKanbanBoard({
  transports,
  capacitySettings,
  onTransportsChange,
  onEmptySlotClick,
  selectedWeek,
  availableDays = ["monday", "wednesday", "friday"],
}: TransportKanbanBoardProps) {
  const [activeTransport, setActiveTransport] = useState<Transport | null>(null)
  const [dragError, setDragError] = useState<string | null>(null)
  const [activeColumn, setActiveColumn] = useState<string | null>(null)
  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Group transports by ideal delivery day
  const getTransportsByDay = (day: string) => {
    return transports.filter((t) => t.idealDeliveryDay === day)
  }

  // Calculate capacity usage for a day using actual persisted data
  const calculateCapacityUsage = (day: string): CapacityUsage => {
    const dayTransports = getTransportsByDay(day)

    // Sum up the actual weight and volume from persisted data
    const totalWeight = dayTransports.reduce((sum, transport) => {
      const weight = Number(transport.weight) || 0
      return sum + weight
    }, 0)

    const totalVolume = dayTransports.reduce((sum, transport) => {
      const volume = Number(transport.volume) || 0
      return sum + volume
    }, 0)

    return {
      weight: totalWeight,
      volume: totalVolume,
    }
  }

  // Group transports by ideal delivery day and split into regular and addon
  const getTransportsForDay = (day: string) => {
    const allDayTransports = getTransportsByDay(day)
    const capacityLimits = capacitySettings[day] || { weight: 1000, volume: 10 }
    const capacityUsage = calculateCapacityUsage(day)

    // Determine which transports are over capacity
    const regularTransports: Transport[] = []
    const addonTransports: Transport[] = []

    // Sort by creation date to ensure consistent ordering
    const sortedTransports = [...allDayTransports].sort(
      (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    )

    // Track running totals
    let runningWeight = 0
    let runningVolume = 0

    for (const transport of sortedTransports) {
      // Get actual persisted weight and volume values
      const transportWeight = Number(transport.weight) || 0
      const transportVolume = Number(transport.volume) || 0

      // Check if adding this transport would exceed any capacity
      const newWeight = runningWeight + transportWeight
      const newVolume = runningVolume + transportVolume

      if (newWeight <= capacityLimits.weight && newVolume <= capacityLimits.volume) {
        // This transport fits within capacity
        regularTransports.push(transport)
        runningWeight = newWeight
        runningVolume = newVolume
      } else {
        // This transport exceeds capacity
        addonTransports.push(transport)
      }
    }

    return {
      regularTransports,
      addonTransports,
      capacityLimits,
      capacityUsage,
    }
  }

  // Check if a day is at capacity (any limit reached)
  const isDayAtCapacity = (day: string) => {
    const capacityLimits = capacitySettings[day] || { weight: 1000, volume: 10 }
    const capacityUsage = calculateCapacityUsage(day)

    return capacityUsage.weight >= capacityLimits.weight || capacityUsage.volume >= capacityLimits.volume
  }

  // Calculate the actual dates for each day of the selected week
  // Ensure we have a valid date for selectedWeek
  const validSelectedWeek = selectedWeek && !isNaN(selectedWeek.getTime()) ? selectedWeek : new Date()
  const weekStart = startOfWeek(validSelectedWeek, { weekStartsOn: 1 }) // Start on Monday

  // Generate dates for each available day
  const getDayDate = (dayName: string) => {
    const dayMap: Record<string, number> = {
      monday: 0,
      tuesday: 1,
      wednesday: 2,
      thursday: 3,
      friday: 4,
      saturday: 5,
      sunday: 6,
    }

    const dayOffset = dayMap[dayName.toLowerCase()] ?? 0
    return addDays(new Date(weekStart), dayOffset)
  }

  // Handle transport click to open detail dialog
  const handleTransportClick = (transport: Transport) => {
    setSelectedTransport(transport)
    setDetailDialogOpen(true)
  }

  // Handle transport update from detail dialog
  const handleTransportUpdate = (updatedTransport: Transport) => {
    const updatedTransports = transports.map((t) => (t.id === updatedTransport.id ? updatedTransport : t))
    onTransportsChange(updatedTransports)
  }

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeTransportData = active.data.current?.transport as Transport
    if (activeTransportData) {
      setActiveTransport(activeTransportData)
    }
    setDragError(null)
  }

  // Handle drag over to track which column we're over
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (over) {
      const overId = String(over.id)
      if (availableDays.includes(overId)) {
        setActiveColumn(overId)
      }
    } else {
      setActiveColumn(null)
    }
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    // Reset states
    setActiveTransport(null)
    setActiveColumn(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id

    // Find the active transport
    const transportToMove = transports.find((t) => t.id === activeId)
    if (!transportToMove) return

    // Determine target column (either from over.id or from activeColumn)
    let targetColumn: string | null = null

    // If dropping directly on a column
    if (typeof overId === "string" && availableDays.includes(overId)) {
      targetColumn = overId
    }
    // If dropping on another transport, get its column
    else if (typeof overId === "string") {
      const overTransport = transports.find((t) => t.id === overId)
      if (overTransport) {
        targetColumn = overTransport.idealDeliveryDay
      }
    }

    // If we couldn't determine a target column, exit
    if (!targetColumn) return

    // If trying to move to the same column, no change needed
    if (transportToMove.idealDeliveryDay === targetColumn) return

    // Create updated transports array with the moved transport
    const updatedTransports = transports.map((t) => {
      if (t.id === transportToMove.id) {
        return {
          ...t,
          idealDeliveryDay: targetColumn,
          // Also update deliveryDay for compatibility with existing code
          deliveryDay: targetColumn,
          // Update modification metadata
          lastModifiedDate: new Date().toISOString(),
          lastModifiedBy: "Current User",
        }
      }
      return t
    })

    // Update the transports state
    onTransportsChange(updatedTransports)
  }

  return (
    <div className="space-y-4">
      {dragError && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{dragError}</AlertDescription>
        </Alert>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availableDays.map((day) => {
            const { regularTransports, addonTransports, capacityLimits, capacityUsage } = getTransportsForDay(day)
            const dayDate = getDayDate(day)

            return (
              <DroppableColumn
                key={day}
                day={day}
                date={dayDate}
                transports={regularTransports}
                addonTransports={addonTransports}
                capacityLimits={capacityLimits}
                capacityUsage={capacityUsage}
                isAtCapacity={isDayAtCapacity(day)}
                onTransportClick={handleTransportClick}
                onEmptySlotClick={onEmptySlotClick}
              />
            )
          })}
        </div>

        {/* Drag overlay to show the item being dragged */}
        <DragOverlay>
          {activeTransport ? <TransportCard transport={activeTransport} isDragging={true} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Transport detail dialog */}
      <TransportDetailDialog
        transport={selectedTransport}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onUpdate={handleTransportUpdate}
        capacitySettings={capacitySettings}
        transports={transports}
      />
    </div>
  )
}
