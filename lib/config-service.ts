import { getSupabaseClient } from "./supabase"
import type { AppConfig } from "./types"

// Default configuration values
const DEFAULT_CONFIG: AppConfig = {
  capacitySettings: {
    monday: 3,
    wednesday: 2,
    friday: 3,
  },
  availableDays: ["monday", "wednesday", "friday"],
  timeWindows: ["Morning", "Afternoon"],
}

// Check if userorgid column exists in the configurations table
let userorgIdColumnExists = false

// Fetch configurations for a specific organization
export const fetchConfigurations = async (userorgId: string): Promise<AppConfig> => {
  const supabase = getSupabaseClient()

  try {
    // First, check if the userorgid column exists if we haven't checked yet
    if (!userorgIdColumnExists) {
      const { data: columnInfo, error: columnError } = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "configurations")
        .eq("column_name", "userorgid")

      userorgIdColumnExists = !!(columnInfo && columnInfo.length > 0)

      if (columnError) {
        console.warn("Error checking for userorgid column in configurations:", columnError)
        // Continue anyway, assuming column doesn't exist
        userorgIdColumnExists = false
      }
    }

    // If the userorgid column exists, filter by it
    let capacityQuery = supabase.from("configurations").select("*").eq("key", "capacity_settings")
    let daysQuery = supabase.from("configurations").select("*").eq("key", "available_days")
    let timeWindowsQuery = supabase.from("configurations").select("*").eq("key", "time_windows")

    if (userorgIdColumnExists) {
      capacityQuery = capacityQuery.eq("userorgid", userorgId)
      daysQuery = daysQuery.eq("userorgid", userorgId)
      timeWindowsQuery = timeWindowsQuery.eq("userorgid", userorgId)
    }

    // Fetch capacity settings
    const { data: capacityData, error: capacityError } = await capacityQuery.maybeSingle()

    if (capacityError && !capacityError.message.includes("No rows found")) {
      throw capacityError
    }

    // Fetch available days
    const { data: daysData, error: daysError } = await daysQuery.maybeSingle()

    if (daysError && !daysError.message.includes("No rows found")) {
      throw daysError
    }

    // Fetch time windows
    const { data: timeWindowsData, error: timeWindowsError } = await timeWindowsQuery.maybeSingle()

    if (timeWindowsError && !timeWindowsError.message.includes("No rows found")) {
      throw timeWindowsError
    }

    // If no organization-specific settings are found, try to get default settings (without userorgid)
    if (!capacityData || !daysData || !timeWindowsData) {
      console.log("No organization-specific settings found, fetching default settings")

      const { data: defaultCapacityData } = await supabase
        .from("configurations")
        .select("*")
        .eq("key", "capacity_settings")
        .is("userorgid", null)
        .maybeSingle()

      const { data: defaultDaysData } = await supabase
        .from("configurations")
        .select("*")
        .eq("key", "available_days")
        .is("userorgid", null)
        .maybeSingle()

      const { data: defaultTimeWindowsData } = await supabase
        .from("configurations")
        .select("*")
        .eq("key", "time_windows")
        .is("userorgid", null)
        .maybeSingle()

      // Combine all configurations
      const config: AppConfig = {
        capacitySettings:
          (capacityData?.value as Record<string, number>) ||
          (defaultCapacityData?.value as Record<string, number>) ||
          DEFAULT_CONFIG.capacitySettings,
        availableDays:
          (daysData?.value as string[]) || (defaultDaysData?.value as string[]) || DEFAULT_CONFIG.availableDays,
        timeWindows:
          (timeWindowsData?.value as string[]) ||
          (defaultTimeWindowsData?.value as string[]) ||
          DEFAULT_CONFIG.timeWindows,
      }

      return config
    }

    // Combine all configurations
    return {
      capacitySettings: (capacityData?.value as Record<string, number>) || DEFAULT_CONFIG.capacitySettings,
      availableDays: (daysData?.value as string[]) || DEFAULT_CONFIG.availableDays,
      timeWindows: (timeWindowsData?.value as string[]) || DEFAULT_CONFIG.timeWindows,
    }
  } catch (error) {
    console.error("Error fetching configurations:", error)
    return DEFAULT_CONFIG
  }
}

// Update capacity settings
export const updateCapacitySettings = async (
  capacitySettings: Record<string, number>,
  userorgId: string,
  user = "System",
): Promise<void> => {
  const supabase = getSupabaseClient()

  try {
    // Check if a configuration exists for this organization
    let query = supabase.from("configurations").select("*").eq("key", "capacity_settings")

    if (userorgIdColumnExists) {
      query = query.eq("userorgid", userorgId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && !error.message.includes("No rows found")) {
      throw error
    }

    if (data) {
      // Update existing configuration
      const updateData: Record<string, any> = {
        value: capacitySettings,
        lastmodifieddate: new Date().toISOString(),
        lastmodifiedby: user,
      }

      if (userorgIdColumnExists) {
        updateData.userorgid = userorgId
      }

      const { error: updateError } = await supabase.from("configurations").update(updateData).eq("id", data.id)

      if (updateError) throw updateError
    } else {
      // Insert new configuration
      const insertData: Record<string, any> = {
        key: "capacity_settings",
        value: capacitySettings,
        description: "Maximum number of transports allowed per delivery day",
        lastmodifieddate: new Date().toISOString(),
        lastmodifiedby: user,
      }

      if (userorgIdColumnExists) {
        insertData.userorgid = userorgId
      }

      const { error: insertError } = await supabase.from("configurations").insert(insertData)

      if (insertError) throw insertError
    }
  } catch (error) {
    console.error("Error updating capacity settings:", error)
    throw error
  }
}

// Update available days
export const updateAvailableDays = async (
  availableDays: string[],
  userorgId: string,
  user = "System",
): Promise<void> => {
  const supabase = getSupabaseClient()

  try {
    // Check if a configuration exists for this organization
    let query = supabase.from("configurations").select("*").eq("key", "available_days")

    if (userorgIdColumnExists) {
      query = query.eq("userorgid", userorgId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && !error.message.includes("No rows found")) {
      throw error
    }

    if (data) {
      // Update existing configuration
      const updateData: Record<string, any> = {
        value: availableDays,
        lastmodifieddate: new Date().toISOString(),
        lastmodifiedby: user,
      }

      if (userorgIdColumnExists) {
        updateData.userorgid = userorgId
      }

      const { error: updateError } = await supabase.from("configurations").update(updateData).eq("id", data.id)

      if (updateError) throw updateError
    } else {
      // Insert new configuration
      const insertData: Record<string, any> = {
        key: "available_days",
        value: availableDays,
        description: "Days available for delivery",
        lastmodifieddate: new Date().toISOString(),
        lastmodifiedby: user,
      }

      if (userorgIdColumnExists) {
        insertData.userorgid = userorgId
      }

      const { error: insertError } = await supabase.from("configurations").insert(insertData)

      if (insertError) throw insertError
    }
  } catch (error) {
    console.error("Error updating available days:", error)
    throw error
  }
}

// Update time windows
export const updateTimeWindows = async (timeWindows: string[], userorgId: string, user = "System"): Promise<void> => {
  // Use a default if not provided
  const windowsToSave = timeWindows.length > 0 ? timeWindows : ["Morning", "Afternoon"]

  const supabase = getSupabaseClient()

  try {
    // Check if a configuration exists for this organization
    let query = supabase.from("configurations").select("*").eq("key", "time_windows")

    if (userorgIdColumnExists) {
      query = query.eq("userorgid", userorgId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && !error.message.includes("No rows found")) {
      throw error
    }

    if (data) {
      // Update existing configuration
      const updateData: Record<string, any> = {
        value: windowsToSave,
        lastmodifieddate: new Date().toISOString(),
        lastmodifiedby: user,
      }

      if (userorgIdColumnExists) {
        updateData.userorgid = userorgId
      }

      const { error: updateError } = await supabase.from("configurations").update(updateData).eq("id", data.id)

      if (updateError) throw updateError
    } else {
      // Insert new configuration
      const insertData: Record<string, any> = {
        key: "time_windows",
        value: windowsToSave,
        description: "Available time windows for delivery",
        lastmodifieddate: new Date().toISOString(),
        lastmodifiedby: user,
      }

      if (userorgIdColumnExists) {
        insertData.userorgid = userorgId
      }

      const { error: insertError } = await supabase.from("configurations").insert(insertData)

      if (insertError) throw insertError
    }
  } catch (error) {
    console.error("Error updating time windows:", error)
    throw error
  }
}

// Update all configurations at once
export const updateAllConfigurations = async (config: AppConfig, userorgId: string, user = "System"): Promise<void> => {
  try {
    await Promise.all([
      updateCapacitySettings(config.capacitySettings, userorgId, user),
      updateAvailableDays(config.availableDays, userorgId, user),
      updateTimeWindows(config.timeWindows, userorgId, user),
    ])
  } catch (error) {
    console.error("Error updating configurations:", error)
    throw error
  }
}

// Run the migration to add the userorgId column to configurations
export const runConfigMigration = async (): Promise<void> => {
  const supabase = getSupabaseClient()

  try {
    // Check if the column already exists
    const { data: columnInfo, error: columnError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "configurations")
      .eq("column_name", "userorgid")

    if (columnError) {
      console.error("Error checking for userorgid column in configurations:", columnError)
      return
    }

    // If the column doesn't exist, add it
    if (!columnInfo || columnInfo.length === 0) {
      const { error } = await supabase.rpc("add_userorgid_to_configurations")

      if (error) {
        console.error("Error adding userorgid column to configurations:", error)
        return
      }

      console.log("Successfully added userorgid column to configurations")
      userorgIdColumnExists = true
    } else {
      console.log("userorgid column already exists in configurations")
      userorgIdColumnExists = true
    }
  } catch (error) {
    console.error("Error running configuration migration:", error)
  }
}
