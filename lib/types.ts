export interface Transport {
  id: string
  // Orderer information
  ordererBranch: string
  ordererName: string

  // Delivery date details - these should be actual dates, not weekdays
  latestDeliveryDate: string // ISO date string
  latestDeliveryTimeWindow: "Morning" | "Afternoon"
  idealDeliveryDate: string // ISO date string
  idealDeliveryTimeWindow: "Morning" | "Afternoon"
  deliveryDate?: string // ISO string of the actual delivery date

  // Customer information
  customerName: string
  customerAddress: string
  customerPhone: string

  // Load details
  loadDescription: string
  referenceNumber: string
  weight: number
  volume: number
  size: "S" | "M" | "L" | string

  // Unloading options
  unloadingOptions: string[]

  // Document
  documentUrl?: string
  documentName?: string

  // Hidden fields
  createdDate: string
  createdBy: string
  lastModifiedDate: string
  lastModifiedBy: string
  creationChannel: string

  // Legacy fields (keeping for compatibility) - these will be derived from dates
  name: string
  description: string
  deliveryDay: string // derived from idealDeliveryDate
  vehicleType: "LKW" | "Kran"
  status: "pending" | "confirmed" | "completed" | "cancelled"
}

export interface DraggableTransportCardProps {
  transport: Transport
  isOverCapacity?: boolean
  index: number
  onClick?: () => void
}

export interface DroppableColumnProps {
  day: string
  date?: Date
  transports: Transport[]
  addonTransports: Transport[]
  capacityLimits: CapacityLimits
  capacityUsage: CapacityUsage
  isAtCapacity: boolean
  onTransportClick?: (transport: Transport) => void
  onEmptySlotClick?: (day: string, isAddonSlot?: boolean) => void
}

// Updated interface for capacity limits - removed count
export interface CapacityLimits {
  weight: number
  volume: number
}

// Updated interface for capacity usage - removed count
export interface CapacityUsage {
  weight: number
  volume: number
}

export interface AppConfig {
  capacitySettings: {
    [key: string]: CapacityLimits
  }
  availableDays: string[]
  timeWindows: string[]
}
