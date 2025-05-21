import { getSupabaseClient } from "./supabase"
import type { AppConfig, CapacitySettings } from "./types"

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

// Fetch all configurations from Supabase
export const fetchConfigurations = async (): Promise<AppConfig> => {
  const supabase = getSupabaseClient()

  try {
    // Fetch capacity settings
    const { data: capacityData, error: capacityError } = await supabase
      .from("configurations")
      .select("*")
      .eq("key", "capacity_settings")
      .single()

    if (capacityError) throw capacityError

    // Fetch available days
    const { data: daysData, error: daysError } = await supabase
      .from("configurations")
      .select("*")
      .eq("key", "available_days")
      .single()

    if (daysError) throw daysError

    // Fetch time windows
    const { data: timeWindowsData, error: timeWindowsError } = await supabase
      .from("configurations")
      .select("*")
      .eq("key", "time_windows")
      .single()

    if (timeWindowsError) throw timeWindowsError

    // Combine all configurations
    return {
      capacitySettings: capacityData.value as CapacitySettings,
      availableDays: daysData.value as string[],
      timeWindows: timeWindowsData.value as string[],
    }
  } catch (error) {
    console.error("Error fetching configurations:", error)
    return DEFAULT_CONFIG
  }
}

// Update capacity settings
export const updateCapacitySettings = async (capacitySettings: CapacitySettings): Promise<void> => {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase
      .from("configurations")
      .update({
        value: capacitySettings,
        lastmodifieddate: new Date().toISOString(),
        lastmodifiedby: "Current User",
      })
      .eq("key", "capacity_settings")

    if (error) throw error
  } catch (error) {
    console.error("Error updating capacity settings:", error)
    throw error
  }
}

// Update available days
export const updateAvailableDays = async (availableDays: string[]): Promise<void> => {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase
      .from("configurations")
      .update({
        value: availableDays,
        lastmodifieddate: new Date().toISOString(),
        lastmodifiedby: "Current User",
      })
      .eq("key", "available_days")

    if (error) throw error
  } catch (error) {
    console.error("Error updating available days:", error)
    throw error
  }
}

// Update time windows
export const updateTimeWindows = async (timeWindows: string[]): Promise<void> => {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase
      .from("configurations")
      .update({
        value: timeWindows,
        lastmodifieddate: new Date().toISOString(),
        lastmodifiedby: "Current User",
      })
      .eq("key", "time_windows")

    if (error) throw error
  } catch (error) {
    console.error("Error updating time windows:", error)
    throw error
  }
}

// Update all configurations at once
export const updateAllConfigurations = async (config: AppConfig): Promise<void> => {
  try {
    await Promise.all([
      updateCapacitySettings(config.capacitySettings),
      updateAvailableDays(config.availableDays),
      updateTimeWindows(config.timeWindows),
    ])
  } catch (error) {
    console.error("Error updating configurations:", error)
    throw error
  }
}
