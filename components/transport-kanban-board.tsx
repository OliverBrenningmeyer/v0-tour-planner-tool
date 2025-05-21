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
import type { Transport } from "@/lib/types"
import { startOfWeek, addDays } from "date-fns"

interface TransportKanbanBoardProps {
  transports: Transport[]
  capacityPerDay: Record<string, number>
  onTransportsChange: (transports: Transport[]) => void
  onEmptySlotClick?: (day: string, isAddon?: boolean) => void
  selectedWeek: Date
}

export function TransportKanbanBoard({
  transports,
  capacityPerDay,
  onTransportsChange,
  onEmptySlotClick,
  selectedWeek,
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

  // Group transports by ideal delivery day and split into regular and addon
  const getTransportsForDay = (day: string) => {
    const allDayTransports = getTransportsByDay(day)
    const capacityLimit = capacityPerDay[day] || 0

    // Split into regular and addon transports
    const regularTransports = allDayTransports.slice(0, capacityLimit)
    const addonTransports = allDayTransports.slice(capacityLimit)

    return { regularTransports, addonTransports }
  }

  // Get transports for each day
  const mondayTransports = getTransportsForDay("monday")
  const wednesdayTransports = getTransportsForDay("wednesday")
  const fridayTransports = getTransportsForDay("friday")

  // Calculate the actual dates for Monday, Wednesday, and Friday of the selected week
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }) // Start on Monday
  const mondayDate = weekStart // Monday is the start of the week
  const wednesdayDate = addDays(weekStart, 2) // Wednesday is 2 days after Monday
  const fridayDate = addDays(weekStart, 4) // Friday is 4 days after Monday

  // Check if a day is at capacity
  const isDayAtCapacity = (day: string) => {
    const dayTransports = getTransportsByDay(day)
    return dayTransports.length >= (capacityPerDay[day] || 0)
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
      if (["monday", "wednesday", "friday"].includes(overId)) {
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
    if (typeof overId === "string" && ["monday", "wednesday", "friday"].includes(overId)) {
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
          <DroppableColumn
            day="Monday"
            date={mondayDate}
            transports={mondayTransports.regularTransports}
            addonTransports={mondayTransports.addonTransports}
            capacityLimit={capacityPerDay.monday}
            isAtCapacity={isDayAtCapacity("monday")}
            onTransportClick={handleTransportClick}
            onEmptySlotClick={onEmptySlotClick}
          />

          <DroppableColumn
            day="Wednesday"
            date={wednesdayDate}
            transports={wednesdayTransports.regularTransports}
            addonTransports={wednesdayTransports.addonTransports}
            capacityLimit={capacityPerDay.wednesday}
            isAtCapacity={isDayAtCapacity("wednesday")}
            onTransportClick={handleTransportClick}
            onEmptySlotClick={onEmptySlotClick}
          />

          <DroppableColumn
            day="Friday"
            date={fridayDate}
            transports={fridayTransports.regularTransports}
            addonTransports={fridayTransports.addonTransports}
            capacityLimit={capacityPerDay.friday}
            isAtCapacity={isDayAtCapacity("friday")}
            onTransportClick={handleTransportClick}
            onEmptySlotClick={onEmptySlotClick}
          />
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
        capacityPerDay={capacityPerDay}
        transports={transports}
      />
    </div>
  )
}
