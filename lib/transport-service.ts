import { getSupabaseClient } from "./supabase"
import type { Transport } from "./types"

// Map our Transport type to the database schema (camelCase to snake_case)
const mapTransportToDbFormat = (transport: Transport) => {
  return {
    id: transport.id || undefined,
    name: transport.name,
    description: transport.description,
    deliveryday: transport.deliveryDay,
    status: transport.status,
    vehicletype: transport.vehicleType,
    size: transport.size,
    ordererbranch: transport.ordererBranch,
    orderername: transport.ordererName,
    latestdeliveryday: transport.latestDeliveryDay,
    latestdeliverytimewindow: transport.latestDeliveryTimeWindow,
    idealdeliveryday: transport.idealDeliveryDay,
    idealdeliverytimewindow: transport.idealDeliveryTimeWindow,
    deliverydate: transport.deliveryDate,
    customername: transport.customerName,
    customeraddress: transport.customerAddress,
    customerphone: transport.customerPhone,
    loaddescription: transport.loadDescription,
    referencenumber: transport.referenceNumber,
    weight: Number(transport.weight) || 0,
    volume: Number(transport.volume) || 0,
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
  return {
    id: dbTransport.id,
    name: dbTransport.name,
    description: dbTransport.description,
    deliveryDay: dbTransport.deliveryday,
    status: dbTransport.status,
    vehicleType: dbTransport.vehicletype,
    size: dbTransport.size,
    ordererBranch: dbTransport.ordererbranch,
    ordererName: dbTransport.orderername,
    latestDeliveryDay: dbTransport.latestdeliveryday,
    latestDeliveryTimeWindow: dbTransport.latestdeliverytimewindow,
    idealDeliveryDay: dbTransport.idealdeliveryday,
    idealDeliveryTimeWindow: dbTransport.idealdeliverytimewindow,
    deliveryDate: dbTransport.deliverydate,
    customerName: dbTransport.customername,
    customerAddress: dbTransport.customeraddress,
    customerPhone: dbTransport.customerphone,
    loadDescription: dbTransport.loaddescription,
    referenceNumber: dbTransport.referencenumber,
    weight: Number(dbTransport.weight) || 0,
    volume: Number(dbTransport.volume) || 0,
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
  const { data, error } = await supabase.from("transports").select("*")

  if (error) {
    console.error("Error fetching transports:", error)
    throw new Error(`Failed to fetch transports: ${error.message}`)
  }

  return data.map(mapDbToTransport)
}

// Add a new transport
export const addTransport = async (transport: Omit<Transport, "id">): Promise<Transport> => {
  const supabase = getSupabaseClient()

  // Ensure all required fields are present and properly formatted
  const transportData = {
    ...transport,
    weight: Number(transport.weight) || 0,
    volume: Number(transport.volume) || 0,
    unloadingOptions: transport.unloadingOptions || [],
    createdDate: transport.createdDate || new Date().toISOString(),
    lastModifiedDate: transport.lastModifiedDate || new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("transports")
    .insert(mapTransportToDbFormat(transportData as Transport))
    .select()
    .single()

  if (error) {
    console.error("Error adding transport:", error)
    throw new Error(`Failed to add transport: ${error.message}`)
  }

  return mapDbToTransport(data)
}

// Update an existing transport
export const updateTransport = async (transport: Transport): Promise<Transport> => {
  const supabase = getSupabaseClient()

  // Ensure all fields are properly formatted before updating
  const transportData = {
    ...transport,
    weight: Number(transport.weight) || 0,
    volume: Number(transport.volume) || 0,
    unloadingOptions: transport.unloadingOptions || [],
    lastModifiedDate: new Date().toISOString(),
    lastModifiedBy: transport.lastModifiedBy || "Current User",
  }

  const { data, error } = await supabase
    .from("transports")
    .update(mapTransportToDbFormat(transportData))
    .eq("id", transport.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating transport:", error)
    throw new Error(`Failed to update transport: ${error.message}`)
  }

  return mapDbToTransport(data)
}

// Delete a transport
export const deleteTransport = async (id: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("transports").delete().eq("id", id)

  if (error) {
    console.error("Error deleting transport:", error)
    throw new Error(`Failed to delete transport: ${error.message}`)
  }
}
