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
import { startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns"
import { fetchTransports, addTransport, updateTransport } from "@/lib/transport-service"
import { fetchConfigurations } from "@/lib/config-service"
import { Loader2, Plus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { TransportRegistrationDialog } from "./transport-registration-dialog"

export default function TransportDashboard() {
  // State for transports
  const [transports, setTransports] = useState<Transport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  const [config, setConfig] = useState<AppConfig>({
    capacitySettings: {
      monday: 3,
      wednesday: 2,
      friday: 3,
    },
    availableDays: ["monday", "wednesday", "friday"],
    timeWindows: ["Morning", "Afternoon"],
  })

  // Registration dialog state
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [isAddonSlot, setIsAddonSlot] = useState<boolean>(false)

  // Toast for notifications
  const { toast } = useToast()

  // Fetch transports and configurations from Supabase on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true)

        // Fetch configurations first
        const configData = await fetchConfigurations()
        setConfig(configData)

        // Then fetch transports
        const transportData = await fetchTransports()
        setTransports(transportData)
        updateHistoryState(transportData)

        setError(null)
      } catch (err) {
        console.error("Failed to initialize:", err)
        setError("Failed to load data. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [toast, updateHistoryState])

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

  const handleAddTransport = async (newTransport: Omit<Transport, "id">) => {
    try {
      // Add metadata
      const now = new Date().toISOString()
      const currentUser = "Current User" // In a real app, this would come from authentication

      // Make sure idealDeliveryDay and deliveryDay are in sync
      const transportWithMetadata = {
        ...newTransport,
        id: "", // Will be set by Supabase
        deliveryDay: newTransport.idealDeliveryDay, // Set deliveryDay to match idealDeliveryDay
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
        description: `${newTransport.customerName} has been scheduled for ${newTransport.idealDeliveryDay}`,
        duration: 2000,
      })
    } catch (err) {
      console.error("Failed to add transport:", err)
      toast({
        title: "Error",
        description: "Failed to add transport. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleTransportsChange = async (updatedTransports: Transport[]) => {
    try {
      // Find the transport that changed
      const changedTransport = updatedTransports.find((newT) => {
        const oldT = transports.find((t) => t.id === newT.id)
        return oldT && oldT.idealDeliveryDay !== newT.idealDeliveryDay
      })

      if (changedTransport) {
        // Update in Supabase
        await updateTransport(changedTransport)

        // Update local state
        setTransports(updatedTransports)
        updateHistoryState(updatedTransports)

        // Show toast notification about the move
        toast({
          title: "Transport moved",
          description: `${changedTransport.customerName || changedTransport.name} moved to ${changedTransport.idealDeliveryDay}`,
          duration: 2000,
        })
      }
    } catch (err) {
      console.error("Failed to update transport:", err)
      toast({
        title: "Error",
        description: "Failed to update transport. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Get transports for the selected week
  const filteredTransports = getTransportsForSelectedWeek()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-lg">Loading data...</span>
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
          capacityPerDay={config.capacitySettings}
          onTransportsChange={handleTransportsChange}
          onEmptySlotClick={handleEmptySlotClick}
          selectedWeek={selectedWeek}
          availableDays={config.availableDays}
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
