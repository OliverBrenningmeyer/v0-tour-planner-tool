"use client"

import { useDraggable } from "@dnd-kit/core"
import { TransportCard } from "./transport-card"
import type { DraggableTransportCardProps } from "@/lib/types"

export function DraggableTransportCard({ transport, isOverCapacity, onClick }: DraggableTransportCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: transport.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`transition-transform ${isDragging ? "opacity-50 z-50" : ""}`}
    >
      <TransportCard transport={transport} isOverCapacity={isOverCapacity} isDragging={isDragging} onClick={onClick} />
    </div>
  )
}
