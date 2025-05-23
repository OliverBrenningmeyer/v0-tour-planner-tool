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
import { startOfWeek, addDays, format, parseISO } from "date-fns"

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

  // Group transports by their ideal delivery date
  const getTransportsByDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd")
    return transports.filter((t) => {
      if (!t.idealDeliveryDate) return false
      try {
        const transportDate = parseISO(t.idealDeliveryDate)
        return format(transportDate, "yyyy-MM-dd") === dateString
      } catch {
        return false
      }
    })
  }

  // Calculate capacity usage for a specific date
  const calculateCapacityUsageForDate = (date: Date): CapacityUsage => {
    const dateTransports = getTransportsByDate(date)

    const totalWeight = dateTransports.reduce((sum, t) => sum + (Number(t.weight) || 0), 0)
    const totalVolume = dateTransports.reduce((sum, t) => sum + (Number(t.volume) || 0), 0)

    return {
      weight: totalWeight,
      volume: totalVolume,
    }
  }

  // Get the dates for the selected week based on available days
  const getWeekDates = () => {
    const dates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i)
      const dayName = format(date, "EEEE").toLowerCase()
      if (availableDays.includes(dayName)) {
        dates.push(date)
      }
    }
    return dates
  }

  const getTransportsForDate = (date: Date, capacityLimits: CapacityLimits) => {
    const allDateTransports = getTransportsByDate(date)

    const regularTransports: Transport[] = []
    const addonTransports: Transport[] = []

    // Sort by creation date to ensure consistent ordering
    const sortedTransports = [...allDateTransports].sort(
      (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    )

    // Track running totals
    let runningWeight = 0
    let runningVolume = 0

    for (const transport of sortedTransports) {
      const transportWeight = Number(transport.weight) || 0
      const transportVolume = Number(transport.volume) || 0

      const newWeight = runningWeight + transportWeight
      const newVolume = runningVolume + transportVolume

      if (newWeight <= capacityLimits.weight && newVolume <= capacityLimits.volume) {
        regularTransports.push(transport)
        runningWeight = newWeight
        runningVolume = newVolume
      } else {
        addonTransports.push(transport)
      }
    }

    return { regularTransports, addonTransports }
  }

  // Check if a day is at capacity (any limit reached)
  const isDayAtCapacityForDay = (day: string) => {
    const capacityLimits = capacitySettings[day] || { weight: 1000, volume: 10 }
    const capacityUsage = calculateCapacityUsageForDate(getDayDate(day))

    return capacityUsage.weight >= capacityLimits.weight || capacityUsage.volume >= capacityLimits.volume
  }

  const isDayAtCapacity = (date: Date) => {
    const dayName = format(date, "EEEE").toLowerCase()
    const capacityLimits = capacitySettings[dayName] || { weight: 1000, volume: 10 }
    const capacityUsage = calculateCapacityUsageForDate(date)

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

    setActiveTransport(null)
    setActiveColumn(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id

    const transportToMove = transports.find((t) => t.id === activeId)
    if (!transportToMove) return

    // Determine target date from overId (which should be a date string like '2024-01-15')
    let targetDate: Date | null = null

    if (typeof overId === "string") {
      try {
        // If overId is a date string
        if (overId.includes("-")) {
          targetDate = parseISO(overId)
        } else {
          // If dropping on another transport, get its date
          const overTransport = transports.find((t) => t.id === overId)
          if (overTransport && overTransport.idealDeliveryDate) {
            targetDate = parseISO(overTransport.idealDeliveryDate)
          }
        }
      } catch {
        return
      }
    }

    if (!targetDate) return

    // If trying to move to the same date, no change needed
    const currentDate = transportToMove.idealDeliveryDate ? parseISO(transportToMove.idealDeliveryDate) : null
    if (currentDate && format(currentDate, "yyyy-MM-dd") === format(targetDate, "yyyy-MM-dd")) return

    // Create updated transports array with the moved transport
    const updatedTransports = transports.map((t) => {
      if (t.id === transportToMove.id) {
        return {
          ...t,
          idealDeliveryDate: targetDate.toISOString(),
          deliveryDate: targetDate.toISOString(), // Also update the main delivery date
          deliveryDay: format(targetDate, "EEEE").toLowerCase(), // Update legacy field
        }
      }
      return t
    })

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
          {getWeekDates().map((date) => {
            const dayName = format(date, "EEEE").toLowerCase()
            const dateTransports = getTransportsByDate(date)
            const capacityLimits = capacitySettings[dayName] || { weight: 1000, volume: 10 }
            const capacityUsage = calculateCapacityUsageForDate(date)

            // Determine which transports are over capacity
            const { regularTransports, addonTransports } = getTransportsForDate(date, capacityLimits)

            return (
              <DroppableColumn
                key={format(date, "yyyy-MM-dd")}
                day={dayName}
                date={date}
                transports={regularTransports}
                addonTransports={addonTransports}
                capacityLimits={capacityLimits}
                capacityUsage={capacityUsage}
                isAtCapacity={isDayAtCapacity(date)}
                onTransportClick={handleTransportClick}
                onEmptySlotClick={(day, isAddon) => onEmptySlotClick?.(format(date, "yyyy-MM-dd"), isAddon)}
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
