"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Plus, Truck, Calendar, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import type { Transport } from "@/lib/types"
import { Crane } from "./icons/crane"

interface TransportTableViewProps {
  transports: Transport[]
  capacityPerDay: Record<string, number>
  availableDays: string[]
  selectedWeek: Date
  onAddTransportClick: (day: string) => void
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

  // Group transports by day
  const transportsByDay = availableDays.reduce<Record<string, Transport[]>>((acc, day) => {
    acc[day] = transports.filter((t) => t.idealDeliveryDay === day)
    return acc
  }, {})

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
        const dayTransports = transportsByDay[day] || []
        const isExpanded = expandedDays[day]
        const isAtCapacity = dayTransports.length >= (capacityPerDay[day] || 0)
        const capacityLimit = capacityPerDay[day] || 0

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
                  <CardTitle className="text-lg capitalize">{day}</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={isAtCapacity ? "destructive" : "outline"}>
                    {dayTransports.length}/{capacityLimit}
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
                {dayTransports.length === 0 ? (
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
                        {dayTransports.map((transport, index) => (
                          <tr
                            key={transport.id}
                            className={cn(
                              "border-b hover:bg-gray-50 cursor-pointer",
                              index >= capacityLimit && "bg-red-50 hover:bg-red-100",
                            )}
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
