"use client"

import type React from "react"

import { Package, Truck, Box, GripVertical, Calendar, Weight, CuboidIcon as Cube } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crane } from "./icons/crane"
import type { Transport } from "@/lib/types"
import { format, parseISO, isValid } from "date-fns"

interface TransportCardProps {
  transport: Transport
  isOverCapacity?: boolean
  isDragging?: boolean
  onClick?: () => void
  onDragStart?: (transport: Transport) => void
}

export function TransportCard({
  transport,
  isOverCapacity = false,
  isDragging = false,
  onClick,
  onDragStart,
}: TransportCardProps) {
  // Determine icon based on size
  const getSizeIcon = () => {
    switch (transport.size) {
      case "S":
        return <Box className="h-5 w-5 text-blue-500" />
      case "M":
        return <Package className="h-5 w-5 text-green-500" />
      case "L":
        return <Truck className="h-5 w-5 text-purple-500" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  // Determine vehicle type badge
  const getVehicleBadge = () => {
    switch (transport.vehicleType) {
      case "LKW":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Truck className="h-3 w-3" />
            LKW
          </Badge>
        )
      case "Kran":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <Crane className="h-3 w-3" />
            Kran
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Format the latest delivery day for display
  const formatLatestDeliveryDay = () => {
    if (!transport.latestDeliveryDate) return "Not specified"

    try {
      const date = parseISO(transport.latestDeliveryDate)
      if (!isValid(date)) return "Invalid date"
      return `Until: ${format(date, "EEE, MMM d")} (${transport.latestDeliveryTimeWindow})`
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // Set the drag data to the transport ID
    e.dataTransfer.setData("text/plain", transport.id)
    e.dataTransfer.setData("application/json", JSON.stringify(transport))

    // Set the drag effect
    e.dataTransfer.effectAllowed = "move"

    // Call the onDragStart callback if provided
    if (onDragStart) {
      onDragStart(transport)
    }

    // Add a class to the body to indicate dragging
    document.body.classList.add("dragging")

    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.transform = "rotate(5deg)"
    dragImage.style.opacity = "0.8"
    dragImage.style.position = "absolute"
    dragImage.style.top = "-1000px"
    dragImage.style.pointerEvents = "none"
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)

    // Remove the drag image after a short delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage)
      }
    }, 0)
  }

  // Handle drag end
  const handleDragEnd = () => {
    // Remove the dragging class from the body
    document.body.classList.remove("dragging")
  }

  return (
    <Card
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`overflow-hidden border-l-4 transition-all duration-200 select-none ${
        isOverCapacity ? "border-red-500 bg-red-50" : "border-l-blue-500"
      } ${isDragging ? "opacity-50 scale-105" : "hover:shadow-md"} ${
        onClick ? "cursor-pointer hover:bg-gray-50" : ""
      } drag-handle`}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation()
          onClick()
        }
      }}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-5 w-5 text-gray-400 cursor-grab hover:text-gray-600" />
          <CardTitle className="text-base font-medium flex items-center gap-2">
            {transport.customerName || transport.name}
          </CardTitle>
        </div>
        {getVehicleBadge()}
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm text-gray-600">
        <div className="space-y-2">
          <p className="font-medium flex items-center gap-1">
            {getSizeIcon()}
            {transport.loadDescription || transport.description}
          </p>
          {transport.referenceNumber && <p className="text-xs text-gray-500">Ref: {transport.referenceNumber}</p>}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Weight className="h-3 w-3" />
              {Number(transport.weight) || 0} kg
            </span>
            <span className="flex items-center gap-1">
              <Cube className="h-3 w-3" />
              {Number(transport.volume) || 0} m³
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {transport.idealDeliveryTimeWindow}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>{formatLatestDeliveryDay()}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
