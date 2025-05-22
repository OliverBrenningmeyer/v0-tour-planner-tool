import { getSupabaseClient } from "./supabase"
import type { Transport } from "./types"

// Flag to track if userorgid column exists
let userorgIdColumnExists = false

// Map our Transport type to the database schema (camelCase to snake_case)
const mapTransportToDbFormat = (transport: Transport) => {
  // Create the base object with all fields
  const dbTransport: any = {
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
    weight: transport.weight,
    unloadingoptions: transport.unloadingOptions,
    documenturl: transport.documentUrl,
    documentname: transport.documentName,
    createddate: transport.createdDate,
    createdby: transport.createdBy,
    lastmodifieddate: transport.lastModifiedDate,
    lastmodifiedby: transport.lastModifiedBy,
    creationchannel: transport.creationChannel,
  }

  // Only add userorgid if the column exists and we have a value
  if (userorgIdColumnExists && transport.userorgId) {
    dbTransport.userorgid = transport.userorgId
  }

  return dbTransport
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
    weight: dbTransport.weight,
    unloadingOptions: dbTransport.unloadingoptions,
    documentUrl: dbTransport.documenturl,
    documentName: dbTransport.documentname,
    userorgId: dbTransport.userorgid || "", // Provide default value if not present
    createdDate: dbTransport.createddate,
    createdBy: dbTransport.createdby,
    lastModifiedDate: dbTransport.lastmodifieddate,
    lastModifiedBy: dbTransport.lastmodifiedby,
    creationChannel: dbTransport.creationchannel,
  }
}

// Fetch all transports
export const fetchTransports = async (userorgId?: string): Promise<Transport[]> => {
  const supabase = getSupabaseClient()

  try {
    // Start with a simple query without filtering by userorgId
    const { data, error } = await supabase.from("transports").select("*")

    if (error) {
      console.error("Error fetching transports:", error)
      throw new Error(`Failed to fetch transports: ${error.message}`)
    }

    // If we have userorgId and the column exists, filter the results in memory
    if (userorgId && userorgIdColumnExists) {
      return data.filter((transport) => transport.userorgid === userorgId).map(mapDbToTransport)
    }

    // If we have userorgId but the column doesn't exist yet,
    // we'll just return all transports for now
    return data.map(mapDbToTransport)
  } catch (error: any) {
    console.error("Error in fetchTransports:", error)
    throw error
  }
}

// Add a new transport
export const addTransport = async (transport: Omit<Transport, "id">): Promise<Transport> => {
  const supabase = getSupabaseClient()

  try {
    // If we don't know if the column exists yet, try with it first
    if (!userorgIdColumnExists && transport.userorgId) {
      try {
        const { data, error } = await supabase
          .from("transports")
          .insert(mapTransportToDbFormat({ ...transport, userorgId: transport.userorgId } as Transport))
          .select()
          .single()

        if (!error) {
          // If this succeeds, the column exists
          userorgIdColumnExists = true
          return mapDbToTransport(data)
        }

        // If we get here, there was an error but not about the column
        if (!error.message.includes('column "userorgid" does not exist')) {
          throw error
        }

        // If we get here, the column doesn't exist
        userorgIdColumnExists = false
      } catch (err: any) {
        // If the error is about the missing column, continue to the next try
        if (err.message && err.message.includes('column "userorgid" does not exist')) {
          userorgIdColumnExists = false
        } else {
          // For other errors, rethrow
          throw err
        }
      }
    }

    // If the column doesn't exist or the first try failed, try without userorgId
    const transportData = { ...transport } as any
    delete transportData.userorgId // Remove the userorgId field

    const { data, error } = await supabase
      .from("transports")
      .insert(mapTransportToDbFormat(transportData as Transport))
      .select()
      .single()

    if (error) {
      console.error("Error adding transport:", error)
      throw new Error(`Failed to add transport: ${error.message}`)
    }

    // Add the userorgId back to the returned object for the client
    return {
      ...mapDbToTransport(data),
      userorgId: transport.userorgId || "",
    }
  } catch (error: any) {
    console.error("Error in addTransport:", error)
    throw error
  }
}

// Update an existing transport
export const updateTransport = async (transport: Transport): Promise<Transport> => {
  const supabase = getSupabaseClient()

  try {
    // If we don't know if the column exists yet, try with it first
    if (!userorgIdColumnExists && transport.userorgId) {
      try {
        const { data, error } = await supabase
          .from("transports")
          .update(mapTransportToDbFormat({ ...transport, userorgId: transport.userorgId }))
          .eq("id", transport.id)
          .select()
          .single()

        if (!error) {
          // If this succeeds, the column exists
          userorgIdColumnExists = true
          return mapDbToTransport(data)
        }

        // If we get here, there was an error but not about the column
        if (!error.message.includes('column "userorgid" does not exist')) {
          throw error
        }

        // If we get here, the column doesn't exist
        userorgIdColumnExists = false
      } catch (err: any) {
        // If the error is about the missing column, continue to the next try
        if (err.message && err.message.includes('column "userorgid" does not exist')) {
          userorgIdColumnExists = false
        } else {
          // For other errors, rethrow
          throw err
        }
      }
    }

    // If the column doesn't exist or the first try failed, try without userorgId
    const transportData = { ...transport } as any
    delete transportData.userorgId // Remove the userorgId field

    const { data, error } = await supabase
      .from("transports")
      .update(mapTransportToDbFormat(transportData as Transport))
      .eq("id", transport.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating transport:", error)
      throw new Error(`Failed to update transport: ${error.message}`)
    }

    // Add the userorgId back to the returned object for the client
    return {
      ...mapDbToTransport(data),
      userorgId: transport.userorgId || "",
    }
  } catch (error: any) {
    console.error("Error in updateTransport:", error)
    throw error
  }
}

// Delete a transport
export const deleteTransport = async (id: string, userorgId?: string): Promise<void> => {
  const supabase = getSupabaseClient()

  try {
    // Just delete by ID, don't try to filter by userorgId
    const { error } = await supabase.from("transports").delete().eq("id", id)

    if (error) {
      console.error("Error deleting transport:", error)
      throw new Error(`Failed to delete transport: ${error.message}`)
    }
  } catch (error: any) {
    console.error("Error in deleteTransport:", error)
    throw error
  }
}

// Simple function to add the userorgid column - not called automatically
export const addUserorgIdColumn = async (): Promise<void> => {
  const supabase = getSupabaseClient()

  try {
    // Try to add the column with a simple query
    const { error } = await supabase.rpc("run_sql", {
      sql: "ALTER TABLE transports ADD COLUMN IF NOT EXISTS userorgid TEXT",
    })

    if (error) {
      console.error("Error adding userorgid column:", error)
      return
    }

    console.log("Successfully added userorgid column")
    userorgIdColumnExists = true
  } catch (error) {
    console.error("Error adding userorgid column:", error)
  }
}
