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

export interface TransportColumnProps {
  day: string
  date?: Date
  transports: Transport[]
  addonTransports: Transport[]
  capacityLimits: CapacityLimits
  capacityUsage: CapacityUsage
  isAtCapacity: boolean
  onTransportClick?: (transport: Transport) => void
  onEmptySlotClick?: (day: string, isAddonSlot?: boolean) => void
  routeInfo?: RouteInfo
  onDrop?: (transportId: string, targetDate: string) => void
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

// New interfaces for tour planning
export interface TourPlanningSettings {
  depotAddress: string
  stopTimeMinutes: number
}

export interface RouteInfo {
  totalDistance: number // in kilometers
  totalDuration: number // in minutes (driving time only)
  totalDurationWithStops: number // in minutes (driving time + stop times)
  stops: RouteStop[]
}

export interface RouteStop {
  address: string
  customerName: string
  distanceFromPrevious: number // in kilometers
  durationFromPrevious: number // in minutes
  stopDuration: number // in minutes
  timeWindow: "Morning" | "Afternoon"
  transportId: string
}

export interface AppConfig {
  capacitySettings: {
    [key: string]: CapacityLimits
  }
  availableDays: string[]
  timeWindows: string[]
  tourPlanning: TourPlanningSettings
}
