import type { Transport, RouteInfo, RouteStop, TourPlanningSettings } from "./types"

// Extract the GEOCODING_DATA to the top of the file so it can be exported
export const ADDRESS_EXAMPLES: Record<string, { lat: number; lng: number }> = {
  // Distribution centers / depots
  "Berlin Zentrale": { lat: 52.52, lng: 13.405 },
  "Berlin Lager Nord": { lat: 52.5862, lng: 13.2884 },
  "Berlin Lager Süd": { lat: 52.4472, lng: 13.3889 },
  "München Zentrale": { lat: 48.1351, lng: 11.582 },
  "Hamburg Zentrale": { lat: 53.5511, lng: 9.9937 },

  // Berlin addresses
  "Hauptstraße 15, 10115 Berlin": { lat: 52.5311, lng: 13.3849 },
  "Müllerstraße 42, 13353 Berlin": { lat: 52.543, lng: 13.35 },
  "Kantstraße 88, 10627 Berlin": { lat: 52.5057, lng: 13.3085 },
  "Friedrichstraße 123, 10117 Berlin": { lat: 52.517, lng: 13.3888 },
  "Alexanderplatz 7, 10178 Berlin": { lat: 52.5219, lng: 13.4132 },
  "Potsdamer Platz 1, 10785 Berlin": { lat: 52.5096, lng: 13.376 },
  "Unter den Linden 25, 10117 Berlin": { lat: 52.517, lng: 13.3888 },
  "Kurfürstendamm 195, 10707 Berlin": { lat: 52.5022, lng: 13.3356 },
  "Schönhauser Allee 36, 10435 Berlin": { lat: 52.5408, lng: 13.4125 },
  "Karl-Marx-Allee 33, 10178 Berlin": { lat: 52.519, lng: 13.4265 },
  "Prenzlauer Allee 85, 10405 Berlin": { lat: 52.5342, lng: 13.4211 },
  "Warschauer Straße 55, 10243 Berlin": { lat: 52.5074, lng: 13.4482 },

  // Brandenburg (surrounding Berlin)
  "Bahnhofstraße 12, 14467 Potsdam": { lat: 52.3906, lng: 13.0645 },
  "Lindenstraße 7, 15230 Frankfurt (Oder)": { lat: 52.3412, lng: 14.55 },
  "Hauptstraße 33, 16515 Oranienburg": { lat: 52.7548, lng: 13.2424 },
  "Berliner Straße 45, 14712 Rathenow": { lat: 52.6038, lng: 12.3375 },
}

// Replace the existing GEOCODING_DATA with a reference to ADDRESS_EXAMPLES
const GEOCODING_DATA = ADDRESS_EXAMPLES

// Traffic patterns by time of day (multipliers for base travel time)
const TRAFFIC_PATTERNS = {
  MORNING_RUSH: 1.5, // 7-9 AM
  MIDDAY: 1.1, // 9 AM - 4 PM
  EVENING_RUSH: 1.6, // 4-7 PM
  NIGHT: 0.9, // 7 PM - 7 AM
}

// Road types and their average speeds (km/h)
const ROAD_SPEEDS = {
  HIGHWAY: 100,
  MAIN_ROAD: 60,
  URBAN: 30,
  RURAL: 70,
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

  // Apply a winding factor to simulate real roads (direct distance * 1.2-1.4)
  const windingFactor = 1.2 + Math.random() * 0.2
  return R * c * windingFactor
}

// Determine road type based on locations
function determineRoadType(from: string, to: string): keyof typeof ROAD_SPEEDS {
  // Check if both locations are in Berlin
  const isBothBerlin = from.includes("Berlin") && to.includes("Berlin")

  // Check if one location is outside Berlin
  const isOneOutside =
    (from.includes("Berlin") && !to.includes("Berlin")) || (!from.includes("Berlin") && to.includes("Berlin"))

  // Check if both are outside Berlin
  const isBothOutside = !from.includes("Berlin") && !to.includes("Berlin")

  if (isBothBerlin) {
    return "URBAN"
  } else if (isOneOutside) {
    return Math.random() > 0.5 ? "HIGHWAY" : "MAIN_ROAD"
  } else if (isBothOutside) {
    return Math.random() > 0.7 ? "RURAL" : "HIGHWAY"
  }

  return "MAIN_ROAD" // Default
}

// Get traffic multiplier based on time window
function getTrafficMultiplier(timeWindow: "Morning" | "Afternoon"): number {
  if (timeWindow === "Morning") {
    return TRAFFIC_PATTERNS.MORNING_RUSH
  } else {
    return TRAFFIC_PATTERNS.EVENING_RUSH
  }
}

// Calculate driving time based on distance, road type, and traffic
function calculateDrivingTime(
  distanceKm: number,
  roadType: keyof typeof ROAD_SPEEDS,
  timeWindow: "Morning" | "Afternoon",
): number {
  const baseSpeed = ROAD_SPEEDS[roadType]
  const trafficMultiplier = getTrafficMultiplier(timeWindow)

  // Calculate hours, then convert to minutes
  const hours = distanceKm / (baseSpeed / trafficMultiplier)
  return Math.round(hours * 60)
}

// Get coordinates for an address
function getCoordinates(address: string): { lat: number; lng: number } {
  // Try exact match first
  if (GEOCODING_DATA[address]) {
    return GEOCODING_DATA[address]
  }

  // Try partial match for addresses
  for (const [key, coords] of Object.entries(GEOCODING_DATA)) {
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
  let currentAddress = tourSettings.depotAddress
  let totalDistance = 0
  let totalDrivingDuration = 0
  const stops: RouteStop[] = []

  // Calculate route through all delivery addresses
  for (const transport of sortedTransports) {
    const deliveryCoords = getCoordinates(transport.customerAddress)
    const roadType = determineRoadType(currentAddress, transport.customerAddress)

    const distanceFromPrevious = calculateDistance(
      currentCoords.lat,
      currentCoords.lng,
      deliveryCoords.lat,
      deliveryCoords.lng,
    )

    const durationFromPrevious = calculateDrivingTime(distanceFromPrevious, roadType, transport.idealDeliveryTimeWindow)

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
    currentAddress = transport.customerAddress
  }

  // Add return trip to depot
  const returnRoadType = determineRoadType(currentAddress, tourSettings.depotAddress)
  const returnDistance = calculateDistance(currentCoords.lat, currentCoords.lng, depotCoords.lat, depotCoords.lng)
  const returnDuration = calculateDrivingTime(
    returnDistance,
    returnRoadType,
    "Afternoon", // Assume return is in the afternoon
  )

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
