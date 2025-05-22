"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Plus, Truck, Calendar, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, parseISO, addDays, startOfWeek } from "date-fns"
import { cn } from "@/lib/utils"
import type { Transport } from "@/lib/types"
import { Crane } from "./icons/crane"

interface TransportTableViewProps {
  transports: Transport[]
  capacityPerDay: Record<string, number>
  availableDays: string[]
  selectedWeek: Date
  onAddTransportClick: (day: string, isAddon?: boolean) => void
  onTransportClick: (transport: Transport) => void
}

export function TransportTableView({
  transports,
  capacityPerDay,
  availableDays,
  selectedWeek,
  onAddTransportClick,
  onTransportClick,
}: TransportTableViewProps) {
  // Track which days are expanded
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>(
    availableDays.reduce((acc, day) => ({ ...acc, [day]: true }), {}),
  )

  // Toggle expanded state for a day
  const toggleDayExpanded = (day: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }))
  }

  // Group transports by day and split into regular and additional slots
  const transportsByDay = availableDays.reduce<Record<string, { regular: Transport[]; additional: Transport[] }>>(
    (acc, day) => {
      const dayTransports = transports.filter((t) => t.idealDeliveryDay === day)
      const capacityLimit = capacityPerDay[day] || 0

      acc[day] = {
        regular: dayTransports.slice(0, capacityLimit),
        additional: dayTransports.slice(capacityLimit),
      }
      return acc
    },
    {},
  )

  // Calculate the actual dates for each day of the selected week
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }) // Start on Monday

  // Get date for a day name
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
    return addDays(weekStart, dayOffset)
  }

  // Get the vehicle type icon
  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case "LKW":
        return <Truck className="h-4 w-4 text-blue-500" />
      case "Kran":
        return <Crane className="h-4 w-4 text-amber-500" />
      default:
        return <Truck className="h-4 w-4" />
    }
  }

  // Get the size icon
  const getSizeIcon = (size: string) => {
    switch (size) {
      case "S":
        return <Package className="h-4 w-4 text-blue-500" />
      case "M":
        return <Package className="h-4 w-4 text-green-500" />
      case "L":
        return <Package className="h-4 w-4 text-purple-500" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return format(parseISO(dateString), "MMM d, yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <div className="space-y-4">
      {availableDays.map((day) => {
        const dayData = transportsByDay[day] || { regular: [], additional: [] }
        const regular = dayData.regular
        const additional = dayData.additional
        const isExpanded = expandedDays[day] || false
        const capacityLimit = capacityPerDay[day] || 0
        const isAtCapacity = regular.length + additional.length >= capacityLimit
        const emptySlotCount = Math.max(0, capacityLimit - regular.length)
        const dayDate = getDayDate(day)

        // Always show one empty slot in addon section if regular is at capacity
        const showAddonEmptySlot = additional.length > 0 || regular.length >= capacityLimit

        return (
          <Card key={day} className="overflow-hidden">
            <CardHeader
              className={cn(
                "py-3 cursor-pointer",
                day === "monday" && "bg-blue-50",
                day === "wednesday" && "bg-green-50",
                day === "friday" && "bg-purple-50",
                isAtCapacity && "bg-red-50",
              )}
              onClick={() => toggleDayExpanded(day)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <CardTitle className="text-lg capitalize">{day}</CardTitle>
                    {dayDate && <p className="text-sm text-gray-600">{format(dayDate, "EEE, MMM d, yyyy")}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={isAtCapacity ? "destructive" : "outline"}>
                    {regular.length + additional.length}/{capacityLimit}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddTransportClick(day)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="p-0">
                {regular.length === 0 && additional.length === 0 ? (
                  <div className="py-6 text-center text-gray-500">No transports scheduled for {day}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Customer</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Description</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Size</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Vehicle</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Time Window</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Delivery Date</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Regular slots section */}
                        <tr>
                          <td colSpan={7} className="bg-gray-100 px-4 py-1 text-xs font-medium">
                            Regular Slots
                          </td>
                        </tr>

                        {regular.map((transport) => (
                          <tr
                            key={transport.id}
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => onTransportClick(transport)}
                          >
                            <td className="px-4 py-3 font-medium">{transport.customerName || transport.name}</td>
                            <td className="px-4 py-3">{transport.loadDescription || transport.description}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {getSizeIcon(transport.size)}
                                <span>{transport.size}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {getVehicleIcon(transport.vehicleType)}
                                <span>{transport.vehicleType}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary" className="font-normal">
                                {transport.latestDeliveryTimeWindow}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {formatDate(transport.deliveryDate)}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">{transport.referenceNumber || "—"}</td>
                          </tr>
                        ))}

                        {/* Empty regular slots */}
                        {Array.from({ length: emptySlotCount }).map((_, index) => (
                          <tr
                            key={`empty-${day}-${index}`}
                            className="border-b hover:bg-gray-50 cursor-pointer border-dashed"
                            onClick={() => onAddTransportClick(day, false)}
                          >
                            <td colSpan={7} className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2 text-gray-500">
                                <Plus className="h-4 w-4" />
                                <span>Empty slot - Click to add a transport</span>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {/* Additional slots section - only show if there are additional transports or if regular slots are at capacity */}
                        {(additional.length > 0 || regular.length >= capacityLimit) && (
                          <>
                            <tr>
                              <td colSpan={7} className="bg-amber-100 px-4 py-1 text-xs font-medium">
                                Additional Slots
                              </td>
                            </tr>

                            {additional.map((transport) => (
                              <tr
                                key={transport.id}
                                className="border-b hover:bg-red-100 bg-red-50 cursor-pointer"
                                onClick={() => onTransportClick(transport)}
                              >
                                <td className="px-4 py-3 font-medium">{transport.customerName || transport.name}</td>
                                <td className="px-4 py-3">{transport.loadDescription || transport.description}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    {getSizeIcon(transport.size)}
                                    <span>{transport.size}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    {getVehicleIcon(transport.vehicleType)}
                                    <span>{transport.vehicleType}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="secondary" className="font-normal">
                                    {transport.latestDeliveryTimeWindow}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {formatDate(transport.deliveryDate)}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-500">{transport.referenceNumber || "—"}</td>
                              </tr>
                            ))}

                            {/* Empty additional slot */}
                            {showAddonEmptySlot && (
                              <tr
                                className="border-b hover:bg-amber-100 bg-amber-50 cursor-pointer border-dashed"
                                onClick={() => onAddTransportClick(day, true)}
                              >
                                <td colSpan={7} className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2 text-gray-500">
                                    <Plus className="h-4 w-4" />
                                    <span>Empty slot - Click to add a transport (additional slot)</span>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add Transport Button at the bottom */}
                <div className="p-4 border-t border-dashed flex justify-center">
                  <Button variant="outline" className="gap-1" onClick={() => onAddTransportClick(day)}>
                    <Plus className="h-4 w-4" />
                    Add Transport for {day}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
