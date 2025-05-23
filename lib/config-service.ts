import { getSupabaseClient } from "./supabase"
import type { AppConfig, CapacityLimits, TourPlanningSettings } from "@/lib/types"

// Default configuration values
const DEFAULT_CONFIG: AppConfig = {
  capacitySettings: {
    monday: {
      weight: 1000,
      volume: 10,
    },
    wednesday: {
      weight: 800,
      volume: 8,
    },
    friday: {
      weight: 1000,
      volume: 10,
    },
  },
  availableDays: ["monday", "wednesday", "friday"],
  timeWindows: ["Morning", "Afternoon"],
  tourPlanning: {
    depotAddress: "Berlin Zentrale",
    stopTimeMinutes: 30,
  },
}

// Fetch all configurations from Supabase
export const fetchConfigurations = async (): Promise<AppConfig> => {
  const supabase = getSupabaseClient()

  try {
    // Fetch all configurations at once
    const { data: allConfigs, error } = await supabase
      .from("configurations")
      .select("*")
      .in("key", ["capacity_settings", "available_days", "time_windows", "tour_planning"])

    if (error) throw error

    // Create a map for easy lookup
    const configMap = new Map(allConfigs?.map((config) => [config.key, config.value]) || [])

    // Build the configuration object with defaults for missing values
    return {
      capacitySettings: configMap.get("capacity_settings") || DEFAULT_CONFIG.capacitySettings,
      availableDays: configMap.get("available_days") || DEFAULT_CONFIG.availableDays,
      timeWindows: configMap.get("time_windows") || DEFAULT_CONFIG.timeWindows,
      tourPlanning: configMap.get("tour_planning") || DEFAULT_CONFIG.tourPlanning,
    }
  } catch (error) {
    console.error("Error fetching configurations:", error)
    return DEFAULT_CONFIG
  }
}

// Update capacity settings
export const updateCapacitySettings = async (capacitySettings: { [key: string]: CapacityLimits }): Promise<void> => {
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

// Update tour planning settings
export const updateTourPlanningSettings = async (tourPlanning: TourPlanningSettings): Promise<void> => {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase
      .from("configurations")
      .update({
        value: tourPlanning,
        lastmodifieddate: new Date().toISOString(),
        lastmodifiedby: "Current User",
      })
      .eq("key", "tour_planning")

    if (error) throw error
  } catch (error) {
    console.error("Error updating tour planning settings:", error)
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
      updateTourPlanningSettings(config.tourPlanning),
    ])
  } catch (error) {
    console.error("Error updating configurations:", error)
    throw error
  }
}
