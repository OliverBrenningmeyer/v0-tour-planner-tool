"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransportRegistrationForm } from "./transport-registration-form"
import { TransportKanbanBoard } from "./transport-kanban-board"
import { WeekSelector } from "./week-selector"
import type { Transport } from "@/lib/types"
import { CapacitySettings } from "./capacity-settings"
import { HistoryControls } from "./history-controls"
import { useHistory } from "@/hooks/use-history"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useToast } from "@/hooks/use-toast"
import { startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns"
import { fetchTransports, addTransport, updateTransport } from "@/lib/transport-service"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

  // Capacity settings
  const [capacityPerDay, setCapacityPerDay] = useState({
    monday: 3,
    wednesday: 2,
    friday: 3,
  })

  // Active tab state
  const [activeTab, setActiveTab] = useState("kanban")

  // Selected day for registration form
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [isAddonSlot, setIsAddonSlot] = useState<boolean>(false)

  // Toast for notifications
  const { toast } = useToast()

  // Fetch transports from Supabase on component mount
  useEffect(() => {
    const loadTransports = async () => {
      try {
        setLoading(true)
        const data = await fetchTransports()
        setTransports(data)
        updateHistoryState(data)
        setError(null)
      } catch (err) {
        console.error("Failed to load transports:", err)
        setError("Failed to load transports. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load transports. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadTransports()
  }, [toast, updateHistoryState])

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: () => {
      if (canUndo && activeTab === "kanban") {
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
      if (canRedo && activeTab === "kanban") {
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
    enabled: activeTab === "kanban",
  })

  // Handle empty slot click
  const handleEmptySlotClick = (day: string, isAddon = false) => {
    setSelectedDay(day)
    setIsAddonSlot(isAddon)
    setActiveTab("register")
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

      // Reset selected day and switch back to kanban view
      setSelectedDay(null)
      setIsAddonSlot(false)
      setActiveTab("kanban")
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

  // Reset selected day when tab changes
  useEffect(() => {
    if (activeTab !== "register") {
      setSelectedDay(null)
      setIsAddonSlot(false)
    }
  }, [activeTab])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-lg">Loading transports...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Transport Management</h1>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "kanban" && (
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
          )}
          <CapacitySettings capacityPerDay={capacityPerDay} onUpdateCapacity={setCapacityPerDay} />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="kanban">Kanban View</TabsTrigger>
          <TabsTrigger value="register">Register Transport</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <WeekSelector currentWeek={selectedWeek} onWeekChange={setSelectedWeek} />
            <div className="text-sm text-muted-foreground">
              Showing {filteredTransports.length} transports for the selected week
            </div>
          </div>

          <TransportKanbanBoard
            transports={filteredTransports}
            capacityPerDay={capacityPerDay}
            onTransportsChange={handleTransportsChange}
            onEmptySlotClick={handleEmptySlotClick}
            selectedWeek={selectedWeek}
          />
        </TabsContent>

        <TabsContent value="register">
          <TransportRegistrationForm
            onAddTransport={handleAddTransport}
            transports={transports}
            capacityPerDay={capacityPerDay}
            initialDay={selectedDay}
            isAddonSlot={isAddonSlot}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
