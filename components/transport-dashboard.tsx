"use client"

import { useState, useEffect } from "react"
import { TransportKanbanBoard } from "./transport-kanban-board"
import { WeekSelector } from "./week-selector"
import type { Transport, AppConfig } from "@/lib/types"
import { SettingsDialog } from "./settings-dialog"
import { HistoryControls } from "./history-controls"
import { useHistory } from "@/hooks/use-history"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useToast } from "@/hooks/use-toast"
import { startOfWeek, endOfWeek, parseISO, isWithinInterval, addDays, format } from "date-fns"
import { fetchTransports, addTransport, updateTransport } from "@/lib/transport-service"
import { fetchConfigurations } from "@/lib/config-service"
import { Loader2, Plus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { TransportRegistrationDialog } from "./transport-registration-dialog"
import { ensureRealAddresses } from "@/lib/address-helper"
import { getCustomerAddresses } from "@/lib/address-helper"

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

// Generate sample transport data
const generateSampleTransportData = (selectedWeek: Date): Omit<Transport, "id">[] => {
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })
  const sampleTransports: Omit<Transport, "id">[] = []

  const availableDays = ["monday", "wednesday", "friday"]
  const timeWindows = ["Morning", "Afternoon"]

  const germanCustomers = [
    "Müller Bau GmbH",
    "Schmidt Renovierung",
    "Weber Handwerk",
    "Fischer Bauunternehmen",
    "Becker Sanierung",
    "Hoffmann Bau",
    "Schulz Renovierungen",
    "Koch Bauservice",
    "Richter Handwerk",
    "Klein Baustoffe",
  ]

  const germanMaterials = [
    {
      description: "Zement Portland 25kg Säcke, Kies 0-16mm, Sand gewaschen",
      weight: 850,
      volume: 2.5,
      size: "L",
      reference: "BAU-2024-001",
    },
    {
      description: "Sanitär-Komplettset: WC, Waschbecken, Armaturen, Rohrleitungen",
      weight: 320,
      volume: 1.8,
      size: "M",
      reference: "SAN-2024-015",
    },
    {
      description: "Elektrische Leitungen NYM-J 3x1,5mm², Verteilerdosen, Schalter",
      weight: 180,
      volume: 0.8,
      size: "S",
      reference: "ELE-2024-089",
    },
    {
      description: "Gartenbaustoffe: Pflastersteine, Randsteine, Splitt, Erde",
      weight: 1200,
      volume: 4.2,
      size: "L",
      reference: "GAR-2024-034",
    },
    {
      description: "Holzbalken 10x10cm, OSB-Platten, Dachlatten, Schrauben",
      weight: 680,
      volume: 3.1,
      size: "L",
      reference: "HOL-2024-067",
    },
    {
      description: "Fliesen 60x60cm Feinsteinzeug, Fliesenkleber, Fugenmasse",
      weight: 420,
      volume: 1.2,
      size: "M",
      reference: "FLI-2024-023",
    },
    {
      description: "Farben und Lacke: Wandfarbe weiß 20L, Grundierung, Pinsel",
      weight: 95,
      volume: 0.4,
      size: "S",
      reference: "FAR-2024-156",
    },
    {
      description: "Dämmstoffe: Mineralwolle, Dampfsperre, Klebeband",
      weight: 240,
      volume: 8.5,
      size: "L",
      reference: "DAM-2024-078",
    },
    {
      description: "Werkzeuge: Bohrmaschine, Sägen, Schraubendreher-Set, Wasserwaage",
      weight: 45,
      volume: 0.3,
      size: "S",
      reference: "WER-2024-112",
    },
    {
      description: "Türen und Fenster: Innentüren Buche, Türzargen, Beschläge",
      weight: 380,
      volume: 2.8,
      size: "L",
      reference: "TUE-2024-045",
    },
  ]

  const addresses = getCustomerAddresses()

  const phones = [
    "+49 30 12345678",
    "+49 30 87654321",
    "+49 30 11223344",
    "+49 30 55667788",
    "+49 30 99887766",
    "+49 30 33445566",
    "+49 30 77889900",
    "+49 30 22334455",
  ]

  availableDays.forEach((day, dayIndex) => {
    const dayDate = addDays(weekStart, dayIndex * 2) // Monday=0, Wednesday=2, Friday=4
    const transportsForDay = Math.floor(Math.random() * 5) + 1 // 1-5 transports per day

    for (let i = 0; i < transportsForDay; i++) {
      const material = germanMaterials[Math.floor(Math.random() * germanMaterials.length)]
      const customer = germanCustomers[Math.floor(Math.random() * germanCustomers.length)]
      const address = addresses[Math.floor(Math.random() * addresses.length)]
      const phone = phones[Math.floor(Math.random() * phones.length)]
      const timeWindow = timeWindows[Math.floor(Math.random() * timeWindows.length)] as "Morning" | "Afternoon"

      const now = new Date().toISOString()
      const deliveryDate = dayDate.toISOString()

      const transport: Omit<Transport, "id"> = {
        // Orderer information
        ordererBranch: "Berlin Zentrale",
        ordererName: "Max Mustermann",

        // Delivery date details
        deliveryDate: deliveryDate,
        latestDeliveryDate: deliveryDate,
        latestDeliveryTimeWindow: timeWindow,
        idealDeliveryDate: deliveryDate,
        idealDeliveryTimeWindow: timeWindow,

        // Customer information
        customerName: customer,
        customerAddress: address,
        customerPhone: phone,

        // Load details
        loadDescription: material.description,
        referenceNumber: material.reference,
        weight: material.weight,
        volume: material.volume,
        size: material.size,

        // Unloading options
        unloadingOptions: Math.random() > 0.7 ? ["Boardsteinkarte", "with crane"] : ["Boardsteinkarte"],

        // Document
        documentUrl: undefined,
        documentName: undefined,

        // Hidden fields
        createdDate: now,
        createdBy: "System",
        lastModifiedDate: now,
        lastModifiedBy: "System",
        creationChannel: "Sample Data",

        // Legacy fields
        name: customer,
        description: material.description,
        deliveryDay: day,
        status: "pending",
        vehicleType: material.size === "L" || Math.random() > 0.8 ? "Kran" : "LKW",
      }

      sampleTransports.push(transport)
    }
  })

  return sampleTransports
}

// Function to seed the database with sample data
const seedDatabaseWithSampleData = async (selectedWeek: Date): Promise<Transport[]> => {
  const sampleData = generateSampleTransportData(selectedWeek)
  const addedTransports: Transport[] = []

  // Add each sample transport to the database
  for (const transport of sampleData) {
    try {
      const addedTransport = await addTransport(transport)
      addedTransports.push(addedTransport)
    } catch (error) {
      console.error("Failed to add sample transport:", error)
    }
  }

  return addedTransports
}

export default function TransportDashboard() {
  // State for transports
  const [transports, setTransports] = useState<Transport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)

  // Use history hook for undo/redo
  const {
    state: historyState,
    updateState: updateHistoryState,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength,
    currentPosition,
  } = useHistory<Transport[]>([])

  // Week selection state
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())

  // Configuration state
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)

  // Registration dialog state
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [isAddonSlot, setIsAddonSlot] = useState<boolean>(false)

  // Toast for notifications
  const { toast } = useToast()

  // Fetch transports and configurations from Supabase on component mount
  useEffect(() => {
    // Find the initialize function and modify it to ensure real addresses
    const initialize = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch configurations first
        const configData = await fetchConfigurations()
        setConfig({
          ...configData,
          // Ensure tourPlanning exists with default values if not present
          tourPlanning: configData.tourPlanning || {
            depotAddress: "Berlin Zentrale",
            stopTimeMinutes: 30,
          },
        })

        // Fetch transports from Supabase
        let fetchedTransports = await fetchTransports()

        // Ensure all transports have real addresses
        fetchedTransports = ensureRealAddresses(fetchedTransports)

        // Update all transports with real addresses in the database
        for (const transport of fetchedTransports) {
          await updateTransport(transport)
        }

        // Rest of the initialize function remains the same...

        // Check if we have any transports for the current week
        const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 })

        const transportsForWeek = fetchedTransports.filter((transport) => {
          if (!transport.deliveryDate) return false
          try {
            const deliveryDate = parseISO(transport.deliveryDate)
            return isWithinInterval(deliveryDate, { start: weekStart, end: weekEnd })
          } catch {
            return false
          }
        })

        // If no transports for the current week, seed with sample data
        if (transportsForWeek.length === 0) {
          setIsSeeding(true)
          toast({
            title: "Generating sample data",
            description: "Creating sample transports for this week...",
            duration: 3000,
          })

          const sampleTransports = await seedDatabaseWithSampleData(selectedWeek)
          setTransports([...fetchedTransports, ...sampleTransports])
          updateHistoryState([...fetchedTransports, ...sampleTransports])

          toast({
            title: "Sample data created",
            description: `Created ${sampleTransports.length} sample transports for this week`,
            duration: 3000,
          })
          setIsSeeding(false)
        } else {
          // Use existing data
          setTransports(fetchedTransports)
          updateHistoryState(fetchedTransports)
        }
      } catch (err) {
        console.error("Failed to initialize:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to load data. Please try again."
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [toast, updateHistoryState, selectedWeek])

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: () => {
      if (canUndo) {
        const success = undo()
        if (success) {
          // Update the actual transports state when undoing
          setTransports(historyState)
          toast({
            title: "Action undone",
            description: "Previous transport arrangement restored",
            duration: 2000,
          })
        }
      }
    },
    onRedo: () => {
      if (canRedo) {
        const success = redo()
        if (success) {
          // Update the actual transports state when redoing
          setTransports(historyState)
          toast({
            title: "Action redone",
            description: "Transport arrangement restored",
            duration: 2000,
          })
        }
      }
    },
    enabled: true,
  })

  // Handle empty slot click - open registration dialog with selected day
  const handleEmptySlotClick = (day: string, isAddon = false) => {
    setSelectedDay(day)
    setIsAddonSlot(isAddon)
    setRegistrationDialogOpen(true)
  }

  // Handle "Add Transport" button click
  const handleAddTransportClick = () => {
    setSelectedDay(null)
    setIsAddonSlot(false)
    setRegistrationDialogOpen(true)
  }

  // Handle configuration update
  const handleConfigUpdate = (newConfig: AppConfig) => {
    setConfig(newConfig)
    toast({
      title: "Settings updated",
      description: "System settings have been updated successfully.",
      duration: 3000,
    })
  }

  // Filter transports by selected week
  const getTransportsForSelectedWeek = () => {
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }) // Start on Monday
    const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 }) // End on Sunday

    return transports.filter((transport) => {
      if (!transport.deliveryDate) return false

      try {
        const deliveryDate = parseISO(transport.deliveryDate)
        return isWithinInterval(deliveryDate, { start: weekStart, end: weekEnd })
      } catch (error) {
        // If date parsing fails, include the transport in the current week
        return true
      }
    })
  }

  // Update the handleAddTransport function to ensure weight and volume are numbers
  const handleAddTransport = async (newTransport: Omit<Transport, "id">) => {
    try {
      // Add metadata
      const now = new Date().toISOString()
      const currentUser = "Current User" // In a real app, this would come from authentication

      // Make sure idealDeliveryDay and deliveryDay are in sync
      // Safely handle date parsing with fallbacks
      let deliveryDay = "monday" // Default day
      try {
        if (newTransport.idealDeliveryDate) {
          deliveryDay = format(parseISO(newTransport.idealDeliveryDate), "EEEE").toLowerCase()
        }
      } catch (err) {
        console.warn("Could not parse idealDeliveryDate, using default day:", err)
      }

      const transportWithMetadata = {
        ...newTransport,
        id: "", // Will be set by Supabase
        deliveryDay: deliveryDay, // Set deliveryDay to match idealDeliveryDay
        weight: Number(newTransport.weight) || 0, // Ensure weight is a number
        volume: Number(newTransport.volume) || 0, // Ensure volume is a number
        createdDate: now,
        createdBy: currentUser,
        lastModifiedDate: now,
        lastModifiedBy: currentUser,
        creationChannel: "bexOS form",
      }

      // Add to Supabase
      const addedTransport = await addTransport(transportWithMetadata as Transport)

      // Update local state
      const updatedTransports = [...transports, addedTransport]
      setTransports(updatedTransports)
      updateHistoryState(updatedTransports)

      // Show success toast
      toast({
        title: "Transport added",
        description: `${newTransport.customerName} has been scheduled for delivery`,
        duration: 2000,
      })
    } catch (err) {
      console.error("Failed to add transport:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to add transport. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Update the handleTransportsChange function to ensure weight and volume are persisted
  const handleTransportsChange = async (updatedTransports: Transport[]) => {
    try {
      // Find the transport that changed
      const changedTransport = updatedTransports.find((newT) => {
        const oldT = transports.find((t) => t.id === newT.id)
        return (
          oldT &&
          (oldT.idealDeliveryDay !== newT.idealDeliveryDay ||
            oldT.weight !== newT.weight ||
            oldT.volume !== newT.volume)
        )
      })

      if (changedTransport) {
        // Ensure weight and volume are numbers
        const transportToUpdate = {
          ...changedTransport,
          weight: Number(changedTransport.weight) || 0,
          volume: Number(changedTransport.volume) || 0,
          lastModifiedDate: new Date().toISOString(),
          lastModifiedBy: "Current User",
        }

        // Update in Supabase
        await updateTransport(transportToUpdate)

        // Update local state
        setTransports(updatedTransports)
        updateHistoryState(updatedTransports)

        // Show toast notification about the update
        toast({
          title: "Transport updated",
          description: `${changedTransport.customerName || changedTransport.name} has been updated`,
          duration: 2000,
        })
      }
    } catch (err) {
      console.error("Failed to update transport:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to update transport. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })

      // Revert the local state change on error
      setTransports([...transports])
    }
  }

  // Get transports for the selected week
  const filteredTransports = getTransportsForSelectedWeek()

  if (loading || isSeeding) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-lg">{isSeeding ? "Generating sample data..." : "Loading data..."}</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Transport Management</h1>
        <div className="flex flex-wrap items-center gap-2">
          <HistoryControls
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={() => {
              const success = undo()
              if (success) {
                setTransports(historyState)
                toast({
                  title: "Action undone",
                  description: "Previous transport arrangement restored",
                  duration: 2000,
                })
              }
            }}
            onRedo={() => {
              const success = redo()
              if (success) {
                setTransports(historyState)
                toast({
                  title: "Action redone",
                  description: "Transport arrangement restored",
                  duration: 2000,
                })
              }
            }}
            historyLength={historyLength}
            currentPosition={currentPosition}
          />
          <SettingsDialog onConfigUpdate={handleConfigUpdate} />
          <Button onClick={handleAddTransportClick} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Transport
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <WeekSelector currentWeek={selectedWeek} onWeekChange={setSelectedWeek} />
          <div className="text-sm text-muted-foreground">
            Showing {filteredTransports.length} transports for the selected week
          </div>
        </div>

        <TransportKanbanBoard
          transports={filteredTransports}
          capacitySettings={config.capacitySettings}
          onTransportsChange={handleTransportsChange}
          onEmptySlotClick={handleEmptySlotClick}
          selectedWeek={selectedWeek}
          availableDays={config.availableDays}
          config={config}
        />
      </div>

      {/* Transport Registration Dialog */}
      <TransportRegistrationDialog
        open={registrationDialogOpen}
        onOpenChange={setRegistrationDialogOpen}
        onAddTransport={handleAddTransport}
        transports={transports}
        capacityPerDay={config.capacitySettings}
        initialDay={selectedDay}
        isAddonSlot={isAddonSlot}
        availableDays={config.availableDays}
        timeWindows={config.timeWindows}
      />
    </div>
  )
}
