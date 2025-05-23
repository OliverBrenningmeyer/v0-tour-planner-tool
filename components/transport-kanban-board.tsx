"use client"

import { useState } from "react"
import { TransportColumn } from "./transport-column"
import { TransportDetailDialog } from "./transport-detail-dialog"
import type { Transport, CapacityLimits, CapacityUsage, AppConfig } from "@/lib/types"
import { startOfWeek, addDays, format, parseISO, isValid } from "date-fns"
import { calculateRoute } from "@/lib/route-service"

interface TransportKanbanBoardProps {
  transports: Transport[]
  capacitySettings: {
    [key: string]: CapacityLimits
  }
  onTransportsChange: (transports: Transport[]) => void
  onEmptySlotClick?: (day: string, isAddon?: boolean) => void
  selectedWeek: Date
  availableDays?: string[]
  config: AppConfig
}

export function TransportKanbanBoard({
  transports = [],
  capacitySettings = {},
  onTransportsChange,
  onEmptySlotClick,
  selectedWeek,
  availableDays = ["monday", "wednesday", "friday"],
  config,
}: TransportKanbanBoardProps) {
  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  // Safely parse ISO date string
  const safeParseISO = (dateString: string | undefined): Date | null => {
    if (!dateString) return null
    try {
      const date = parseISO(dateString)
      return isValid(date) ? date : null
    } catch (error) {
      console.error("Error parsing date:", error)
      return null
    }
  }

  // Get the dates for the selected week based on available days
  const getWeekDates = () => {
    const dates: Date[] = []
    if (!availableDays || !availableDays.length) return dates

    const validSelectedWeek = selectedWeek && !isNaN(selectedWeek.getTime()) ? selectedWeek : new Date()
    const weekStart = startOfWeek(validSelectedWeek, { weekStartsOn: 1 })

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i)
      const dayName = format(date, "EEEE").toLowerCase()
      if (availableDays.includes(dayName)) {
        dates.push(date)
      }
    }
    return dates
  }

  // Group transports by their ideal delivery date
  const getTransportsByDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd")
    return transports.filter((t) => {
      if (!t.idealDeliveryDate) return false
      const transportDate = safeParseISO(t.idealDeliveryDate)
      return transportDate ? format(transportDate, "yyyy-MM-dd") === dateString : false
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

  const getTransportsForDate = (date: Date, capacityLimits: CapacityLimits) => {
    const allDateTransports = getTransportsByDate(date)

    // Sort by time window first, then by creation date
    const sortedTransports = [...allDateTransports].sort((a, b) => {
      const timeWindowOrder = { Morning: 0, Afternoon: 1 }
      const aTimeOrder = timeWindowOrder[a.idealDeliveryTimeWindow] ?? 0
      const bTimeOrder = timeWindowOrder[b.idealDeliveryTimeWindow] ?? 0

      if (aTimeOrder !== bTimeOrder) {
        return aTimeOrder - bTimeOrder
      }

      return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
    })

    const regularTransports: Transport[] = []
    const addonTransports: Transport[] = []

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

  const isDayAtCapacity = (date: Date) => {
    const dayName = format(date, "EEEE").toLowerCase()
    const capacityLimits = capacitySettings[dayName] || { weight: 1000, volume: 10 }
    const capacityUsage = calculateCapacityUsageForDate(date)

    return capacityUsage.weight >= capacityLimits.weight || capacityUsage.volume >= capacityLimits.volume
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

  // Get the week dates
  const weekDates = getWeekDates()
  const tourPlanning = config?.tourPlanning || { depotAddress: "Berlin Zentrale", stopTimeMinutes: 30 }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {weekDates.map((date) => {
          const dayName = format(date, "EEEE").toLowerCase()
          const capacityLimits = capacitySettings[dayName] || { weight: 1000, volume: 10 }
          const capacityUsage = calculateCapacityUsageForDate(date)
          const { regularTransports, addonTransports } = getTransportsForDate(date, capacityLimits)
          const allDayTransports = [...regularTransports, ...addonTransports]
          const routeInfo = allDayTransports.length > 0 ? calculateRoute(allDayTransports, tourPlanning) : undefined

          return (
            <TransportColumn
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
              routeInfo={routeInfo}
            />
          )
        })}
      </div>

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
