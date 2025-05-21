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
import { getTransportsByDay } from "@/lib/dnd-utils"

interface TransportKanbanBoardProps {
  transports: Transport[]
  capacityPerDay: Record<string, number>
  onTransportsChange: (transports: Transport[]) => void
}

export function TransportKanbanBoard({ transports, capacityPerDay, onTransportsChange }: TransportKanbanBoardProps) {
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

  // Group transports by delivery day
  const mondayTransports = getTransportsByDay(transports, "monday")
  const wednesdayTransports = getTransportsByDay(transports, "wednesday")
  const fridayTransports = getTransportsByDay(transports, "friday")

  // Check if a day is at capacity
  const isDayAtCapacity = (day: string) => {
    const dayTransports = transports.filter((t) => t.deliveryDay === day)
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
        targetColumn = overTransport.deliveryDay
      }
    }

    // If we couldn't determine a target column, exit
    if (!targetColumn) return

    // If trying to move to the same column, no change needed
    if (transportToMove.deliveryDay === targetColumn) return

    // Check if destination day is at capacity
    const dayTransports = transports.filter((t) => t.deliveryDay === targetColumn)
    if (dayTransports.length >= capacityPerDay[targetColumn]) {
      setDragError(`Cannot move transport to ${targetColumn}. The day is at capacity.`)
      return
    }

    // Create updated transports array with the moved transport
    const updatedTransports = transports.map((t) => {
      if (t.id === transportToMove.id) {
        return { ...t, deliveryDay: targetColumn }
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
            transports={mondayTransports}
            capacityLimit={capacityPerDay.monday}
            isAtCapacity={isDayAtCapacity("monday")}
            onTransportClick={handleTransportClick}
          />

          <DroppableColumn
            day="Wednesday"
            transports={wednesdayTransports}
            capacityLimit={capacityPerDay.wednesday}
            isAtCapacity={isDayAtCapacity("wednesday")}
            onTransportClick={handleTransportClick}
          />

          <DroppableColumn
            day="Friday"
            transports={fridayTransports}
            capacityLimit={capacityPerDay.friday}
            isAtCapacity={isDayAtCapacity("friday")}
            onTransportClick={handleTransportClick}
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
