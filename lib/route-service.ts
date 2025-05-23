import type { Transport, RouteInfo, RouteStop, TourPlanningSettings } from "./types"

// Mock geocoding data for common German cities/addresses
const MOCK_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Berlin Zentrale": { lat: 52.52, lng: 13.405 },
  "Hauptstraße 15, 10115 Berlin": { lat: 52.5311, lng: 13.3849 },
  "Müllerstraße 42, 13353 Berlin": { lat: 52.543, lng: 13.35 },
  "Kantstraße 88, 10627 Berlin": { lat: 52.5057, lng: 13.3085 },
  "Friedrichstraße 123, 10117 Berlin": { lat: 52.517, lng: 13.3888 },
  "Alexanderplatz 7, 10178 Berlin": { lat: 52.5219, lng: 13.4132 },
  "Potsdamer Platz 1, 10785 Berlin": { lat: 52.5096, lng: 13.376 },
  "Unter den Linden 25, 10117 Berlin": { lat: 52.517, lng: 13.3888 },
  "Kurfürstendamm 195, 10707 Berlin": { lat: 52.5022, lng: 13.3356 },
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Estimate driving duration based on distance (assuming average speed of 40 km/h in city)
function estimateDrivingDuration(distanceKm: number): number {
  const averageSpeedKmh = 40
  return Math.round((distanceKm / averageSpeedKmh) * 60) // Convert to minutes
}

// Get coordinates for an address (mock implementation)
function getCoordinates(address: string): { lat: number; lng: number } {
  // Try exact match first
  if (MOCK_COORDINATES[address]) {
    return MOCK_COORDINATES[address]
  }

  // Try partial match for addresses
  for (const [key, coords] of Object.entries(MOCK_COORDINATES)) {
    if (address.includes(key) || key.includes(address)) {
      return coords
    }
  }

  // Generate random coordinates around Berlin if no match found
  const berlinLat = 52.52
  const berlinLng = 13.405
  const randomOffset = 0.05 // ~5km radius

  return {
    lat: berlinLat + (Math.random() - 0.5) * randomOffset,
    lng: berlinLng + (Math.random() - 0.5) * randomOffset,
  }
}

// Calculate route for a list of transports
export function calculateRoute(transports: Transport[], tourSettings: TourPlanningSettings): RouteInfo {
  if (transports.length === 0) {
    return {
      totalDistance: 0,
      totalDuration: 0,
      totalDurationWithStops: 0,
      stops: [],
    }
  }

  // Sort transports by time window (Morning first, then Afternoon)
  const sortedTransports = [...transports].sort((a, b) => {
    const timeWindowOrder = { Morning: 0, Afternoon: 1 }
    const aOrder = timeWindowOrder[a.idealDeliveryTimeWindow] ?? 0
    const bOrder = timeWindowOrder[b.idealDeliveryTimeWindow] ?? 0
    return aOrder - bOrder
  })

  const depotCoords = getCoordinates(tourSettings.depotAddress)
  let currentCoords = depotCoords
  let totalDistance = 0
  let totalDrivingDuration = 0
  const stops: RouteStop[] = []

  // Calculate route through all delivery addresses
  for (const transport of sortedTransports) {
    const deliveryCoords = getCoordinates(transport.customerAddress)
    const distanceFromPrevious = calculateDistance(
      currentCoords.lat,
      currentCoords.lng,
      deliveryCoords.lat,
      deliveryCoords.lng,
    )
    const durationFromPrevious = estimateDrivingDuration(distanceFromPrevious)

    stops.push({
      address: transport.customerAddress,
      customerName: transport.customerName,
      distanceFromPrevious: Math.round(distanceFromPrevious * 10) / 10, // Round to 1 decimal
      durationFromPrevious,
      stopDuration: tourSettings.stopTimeMinutes,
      timeWindow: transport.idealDeliveryTimeWindow,
      transportId: transport.id,
    })

    totalDistance += distanceFromPrevious
    totalDrivingDuration += durationFromPrevious
    currentCoords = deliveryCoords
  }

  // Add return trip to depot
  const returnDistance = calculateDistance(currentCoords.lat, currentCoords.lng, depotCoords.lat, depotCoords.lng)
  const returnDuration = estimateDrivingDuration(returnDistance)

  totalDistance += returnDistance
  totalDrivingDuration += returnDuration

  // Calculate total duration including stops
  const totalStopTime = sortedTransports.length * tourSettings.stopTimeMinutes
  const totalDurationWithStops = totalDrivingDuration + totalStopTime

  return {
    totalDistance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal
    totalDuration: totalDrivingDuration,
    totalDurationWithStops,
    stops,
  }
}

// Format duration in hours and minutes
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins}min`
  } else if (mins === 0) {
    return `${hours}h`
  } else {
    return `${hours}h ${mins}min`
  }
}

// Format distance
export function formatDistance(kilometers: number): string {
  return `${kilometers}km`
}
