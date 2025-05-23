import type { Transport } from "./types"

export type ColumnId = "monday" | "wednesday" | "friday"

export interface DragEndResult {
  source: {
    droppableId: ColumnId
    index: number
  }
  destination?: {
    droppableId: ColumnId
    index: number
  } | null
}

export function reorderTransports(
  transports: Transport[],
  source: { droppableId: ColumnId; index: number },
  destination: { droppableId: ColumnId; index: number },
): Transport[] {
  const result = [...transports]
  const sourceDay = source.droppableId
  const destinationDay = destination.droppableId

  // Find the transport being dragged
  const draggedTransport = result.find(
    (t, idx) => t.deliveryDay === sourceDay && getTransportIndexInDay(result, t.id, sourceDay) === source.index,
  )

  if (!draggedTransport) return result

  // Create a new transport with the updated delivery day
  const updatedTransport: Transport = {
    ...draggedTransport,
    deliveryDay: destinationDay,
  }

  // Remove the transport from its original position
  const filteredResult = result.filter((t) => t.id !== draggedTransport.id)

  // Insert the transport at the new position
  const dayTransports = filteredResult.filter((t) => t.deliveryDay === destinationDay)
  const otherTransports = filteredResult.filter((t) => t.deliveryDay !== destinationDay)

  // Insert at the correct position in the day
  dayTransports.splice(destination.index, 0, updatedTransport)

  // Combine all transports
  return [...otherTransports, ...dayTransports]
}

export function getTransportsByDay(transports: Transport[], day?: ColumnId): Record<string, Transport[]> | Transport[] {
  if (day) {
    return transports
      .filter((t) => t.deliveryDay === day || t.idealDeliveryDay === day)
      .sort((a, b) => Number(a.id) - Number(b.id))
  }

  // Return grouped by day
  const grouped: Record<string, Transport[]> = {}
  transports.forEach((transport) => {
    const deliveryDay = transport.idealDeliveryDay || transport.deliveryDay
    if (!grouped[deliveryDay]) {
      grouped[deliveryDay] = []
    }
    grouped[deliveryDay].push(transport)
  })

  return grouped
}

export function getTransportIndexInDay(transports: Transport[], id: string, day: ColumnId): number {
  const dayTransports = getTransportsByDay(transports, day) as Transport[]
  return dayTransports.findIndex((t) => t.id === id)
}

export function findContainer(transportId: string, transports: Transport[]): string | null {
  const transport = transports.find((t) => t.id === transportId)
  return transport ? transport.idealDeliveryDay || transport.deliveryDay : null
}
