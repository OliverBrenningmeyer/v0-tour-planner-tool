"use client"

import { TransportCard } from "./transport-card"
import { EmptySlot } from "./empty-slot"
import { CapacityProgressBar } from "./capacity-progress-bar"
import type { TransportColumnProps } from "@/lib/types"
import { format } from "date-fns"
import { AlertTriangle, MapPin, Clock, Route } from "lucide-react"
import { formatDistance, formatDuration } from "@/lib/route-service"

export function TransportColumn({
  day,
  date,
  transports = [],
  addonTransports = [],
  capacityLimits = { weight: 1000, volume: 10 },
  capacityUsage = { weight: 0, volume: 0 },
  isAtCapacity = false,
  onTransportClick,
  onEmptySlotClick,
  routeInfo,
}: TransportColumnProps) {
  // Use the date string as the column ID
  const dateString = date ? format(date, "yyyy-MM-dd") : day
  const formattedDay = day.charAt(0).toUpperCase() + day.slice(1)
  const formattedDate = date && !isNaN(date.getTime()) ? format(date, "EEE, MMM d, yyyy") : ""

  // Check if we're at or over capacity for weight or volume
  const isWeightAtCapacity = capacityUsage.weight >= capacityLimits.weight
  const isVolumeAtCapacity = capacityUsage.volume >= capacityLimits.volume
  const isAnyCapacityReached = isWeightAtCapacity || isVolumeAtCapacity

  // Determine column header color based on capacity
  const getColumnHeaderClass = () => {
    if (isAnyCapacityReached) return "bg-red-100 border-red-300"
    switch (day.toLowerCase()) {
      case "monday":
        return "bg-blue-100 border-blue-300"
      case "wednesday":
        return "bg-green-100 border-green-300"
      case "friday":
        return "bg-purple-100 border-purple-300"
      default:
        return "bg-gray-100 border-gray-300"
    }
  }

  const totalTransports = transports.length + addonTransports.length

  return (
    <div className="flex flex-col h-full">
      <div className={`p-4 rounded-t-lg border-2 ${getColumnHeaderClass()}`}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-semibold text-lg">{formattedDay}</h3>
            {formattedDate && <p className="text-sm text-gray-600">{formattedDate}</p>}
          </div>
        </div>

        {/* Route Information */}
        {routeInfo && totalTransports > 0 && (
          <div className="mb-3 p-3 bg-white/50 rounded-md border">
            <div className="flex items-center gap-2 mb-2">
              <Route className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Tour Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-500" />
                <span>{formatDistance(routeInfo.totalDistance)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-500" />
                <span>{formatDuration(routeInfo.totalDurationWithStops)}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {routeInfo.stops.length} stops • {formatDuration(routeInfo.totalDuration)} driving
            </div>
          </div>
        )}

        {/* Capacity progress bars */}
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

      <div className="bg-gray-50 p-4 rounded-b-lg flex-1 min-h-[500px] border-2 border-t-0 border-gray-200">
        {transports.length === 0 && addonTransports.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">No transports scheduled</p>
              <p className="text-sm">Click to add a transport</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Regular capacity section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-500">Regular Slots</h4>
              {transports.map((transport) => (
                <TransportCard
                  key={transport.id}
                  transport={transport}
                  isOverCapacity={false}
                  onClick={onTransportClick ? () => onTransportClick(transport) : undefined}
                />
              ))}

              {/* Show regular empty slot if capacity is not reached */}
              {!isAnyCapacityReached && (
                <EmptySlot
                  key={`empty-${dateString}`}
                  day={dateString}
                  onClick={() => (onEmptySlotClick ? onEmptySlotClick(dateString, false) : undefined)}
                />
              )}

              {/* Show capacity reached message */}
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

            {/* Addon section */}
            {(addonTransports.length > 0 || isAnyCapacityReached) && (
              <div className="space-y-3 border-t pt-4 border-dashed border-gray-300">
                <h4 className="text-sm font-medium text-gray-500">Additional Slots (Over Capacity)</h4>
                {addonTransports.map((transport) => (
                  <TransportCard
                    key={transport.id}
                    transport={transport}
                    isOverCapacity={true}
                    onClick={onTransportClick ? () => onTransportClick(transport) : undefined}
                  />
                ))}

                <EmptySlot
                  key={`addon-empty-${dateString}`}
                  day={dateString}
                  isAddon={true}
                  onClick={() => (onEmptySlotClick ? onEmptySlotClick(dateString, true) : undefined)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
