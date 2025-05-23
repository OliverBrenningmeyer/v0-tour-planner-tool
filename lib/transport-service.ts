import { getSupabaseClient } from "./supabase"
import type { Transport } from "./types"
import { format, parseISO } from "date-fns"

// Helper function to get weekday from date
const getWeekdayFromDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString)
    return format(date, "EEEE").toLowerCase()
  } catch {
    return "monday" // fallback
  }
}

// Map our Transport type to the database schema (camelCase to snake_case)
const mapTransportToDbFormat = (transport: Transport) => {
  return {
    id: transport.id || undefined,
    name: transport.name,
    description: transport.description,
    deliveryday: getWeekdayFromDate(transport.idealDeliveryDate), // derive from date
    status: transport.status,
    vehicletype: transport.vehicleType,
    size: transport.size,
    ordererbranch: transport.ordererBranch,
    orderername: transport.ordererName,
    // Support both old and new column names for backward compatibility
    latestdeliveryday: getWeekdayFromDate(transport.latestDeliveryDate),
    latestdeliverydate: transport.latestDeliveryDate, // Now a full date
    latestdeliverytimewindow: transport.latestDeliveryTimeWindow,
    idealdeliveryday: getWeekdayFromDate(transport.idealDeliveryDate),
    idealdeliverydate: transport.idealDeliveryDate, // Now a full date
    idealdeliverytimewindow: transport.idealDeliveryTimeWindow,
    deliverydate: transport.deliveryDate,
    customername: transport.customerName,
    customeraddress: transport.customerAddress,
    customerphone: transport.customerPhone,
    loaddescription: transport.loadDescription,
    referencenumber: transport.referenceNumber,
    weight: String(transport.weight || 0), // Store as string for database consistency
    volume: String(transport.volume || 0), // Store as string for database consistency
    unloadingoptions: transport.unloadingOptions,
    documenturl: transport.documentUrl,
    documentname: transport.documentName,
    createddate: transport.createdDate,
    createdby: transport.createdBy,
    lastmodifieddate: transport.lastModifiedDate,
    lastmodifiedby: transport.lastModifiedBy,
    creationchannel: transport.creationChannel,
  }
}

// Map database format to our Transport type (snake_case to camelCase)
const mapDbToTransport = (dbTransport: any): Transport => {
  // Prioritize the new date fields, but fall back to the old day-based fields if needed
  const idealDeliveryDate =
    dbTransport.idealdeliverydate || (dbTransport.idealdeliveryday ? new Date().toISOString() : undefined)

  const latestDeliveryDate =
    dbTransport.latestdeliverydate || (dbTransport.latestdeliveryday ? new Date().toISOString() : undefined)

  return {
    id: dbTransport.id,
    name: dbTransport.name,
    description: dbTransport.description,
    deliveryDay: getWeekdayFromDate(dbTransport.idealdeliverydate || dbTransport.deliverydate), // derive from date
    status: dbTransport.status,
    vehicleType: dbTransport.vehicletype,
    size: dbTransport.size,
    ordererBranch: dbTransport.ordererbranch,
    ordererName: dbTransport.orderername,
    latestDeliveryDate: latestDeliveryDate, // Use the new date field
    latestDeliveryTimeWindow: dbTransport.latestdeliverytimewindow,
    idealDeliveryDate: idealDeliveryDate, // Use the new date field
    idealDeliveryTimeWindow: dbTransport.idealdeliverytimewindow,
    deliveryDate: dbTransport.deliverydate,
    customerName: dbTransport.customername,
    customerAddress: dbTransport.customeraddress,
    customerPhone: dbTransport.customerphone,
    loadDescription: dbTransport.loaddescription,
    referenceNumber: dbTransport.referencenumber,
    weight: Number(dbTransport.weight) || 0, // Convert string to number
    volume: Number(dbTransport.volume) || 0, // Convert string to number
    unloadingOptions: dbTransport.unloadingoptions || [],
    documentUrl: dbTransport.documenturl,
    documentName: dbTransport.documentname,
    createdDate: dbTransport.createddate,
    createdBy: dbTransport.createdby,
    lastModifiedDate: dbTransport.lastmodifieddate,
    lastModifiedBy: dbTransport.lastmodifiedby,
    creationChannel: dbTransport.creationchannel,
  }
}

// Fetch all transports
export const fetchTransports = async (): Promise<Transport[]> => {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.from("transports").select("*")

    if (error) {
      console.error("Error fetching transports:", error)
      throw new Error(`Failed to fetch transports: ${error.message}`)
    }

    return data.map(mapDbToTransport)
  } catch (error) {
    console.error("Error in fetchTransports:", error)
    throw error
  }
}

// Add a new transport
export const addTransport = async (transport: Omit<Transport, "id">): Promise<Transport> => {
  const supabase = getSupabaseClient()

  try {
    const transportData = mapTransportToDbFormat(transport as Transport)
    console.log("Adding transport with data:", transportData)

    const { data, error } = await supabase.from("transports").insert(transportData).select().single()

    if (error) {
      console.error("Error adding transport:", error)
      throw new Error(`Failed to add transport: ${error.message}`)
    }

    return mapDbToTransport(data)
  } catch (error) {
    console.error("Error in addTransport:", error)
    throw error
  }
}

// Update an existing transport
export const updateTransport = async (transport: Transport): Promise<Transport> => {
  const supabase = getSupabaseClient()

  try {
    const transportData = mapTransportToDbFormat(transport)
    console.log("Updating transport with data:", transportData)

    const { data, error } = await supabase
      .from("transports")
      .update(transportData)
      .eq("id", transport.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating transport:", error)
      throw new Error(`Failed to update transport: ${error.message}`)
    }

    return mapDbToTransport(data)
  } catch (error) {
    console.error("Error in updateTransport:", error)
    throw error
  }
}

// Delete a transport
export const deleteTransport = async (id: string): Promise<void> => {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase.from("transports").delete().eq("id", id)

    if (error) {
      console.error("Error deleting transport:", error)
      throw new Error(`Failed to delete transport: ${error.message}`)
    }
  } catch (error) {
    console.error("Error in deleteTransport:", error)
    throw error
  }
}
