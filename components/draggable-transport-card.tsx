"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TransportCard } from "./transport-card"
import type { DraggableTransportCardProps } from "@/lib/types"

export function DraggableTransportCard({ transport, isOverCapacity, index, onClick }: DraggableTransportCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: transport.id,
    data: {
      transport,
      index,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-manipulation">
      <TransportCard transport={transport} isOverCapacity={isOverCapacity} isDragging={isDragging} onClick={onClick} />
    </div>
  )
}
