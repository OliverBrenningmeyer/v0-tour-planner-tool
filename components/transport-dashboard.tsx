"use client"

import { useState, useEffect } from "react"
import { TransportKanbanBoard } from "./transport-kanban-board"
import { TransportTableView } from "./transport-table-view"
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
import { Loader2, Plus, AlertTriangle, LayoutGrid, List } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TransportRegistrationDialog } from "./transport-registration-dialog"
import { TransportDetailDialog } from "./transport-detail-dialog"
import { useUser } from "@/lib/user-context"
import { UserDataDialog } from "./user-data-dialog"

export default function TransportDashboard() {
  // Get user data from context
  const { userData, isLoading: isUserLoading, isManualEntry, setUserDataManually } = useUser()

  // State for showing the user data dialog
  const [showUserDataDialog, setShowUserDataDialog] = useState(false)

  // State for transports
  const [transports, setTransports] = useState<Transport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // View mode state (kanban or table)
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban")

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

  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null)

  // Toast for notifications
  const { toast } = useToast()

  // Show user data dialog if needed
  useEffect(() => {
    if (!isUserLoading && !userData && !isManualEntry) {
      setShowUserDataDialog(true)
    }
  }, [isUserLoading, userData, isManualEntry])

  // Handle saving user data from dialog
  const handleSaveUserData = (data: typeof userData) => {
    setUserDataManually(data)
    setShowUserDataDialog(false)
    toast({
      title: "User data saved",
      description: `Logged in as ${data.email} (${data.userorgId})`,
      duration: 3000,
    })
  }

  // Fetch transports and configurations from Supabase on component mount
  useEffect(() => {
    const initialize = async () => {
      // Wait for user data to be available
      if (isUserLoading || !userData) return

      try {
        setLoading(true)

        // Fetch configurations first - use default if this fails
        try {
          const configData = await fetchConfigurations(userData.userorgId)
          setConfig(configData)
        } catch (configErr) {
          console.warn("Failed to load configurations, using defaults:", configErr)
          // Keep using the default config
        }

        // Then fetch transports
        const transportData = await fetchTransports(userData.userorgId)

        // Filter transports by userorgId in memory if needed
        // This is a fallback in case the database doesn't support filtering
        const filteredTransports = transportData.filter((t) => !t.userorgId || t.userorgId === userData.userorgId)

        setTransports(filteredTransports)
        updateHistoryState(filteredTransports)

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
  }, [toast, updateHistoryState, userData, isUserLoading])

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
  const handleAddTransportClick = (day?: string) => {
    setSelectedDay(day || null)
    setIsAddonSlot(false)
    setRegistrationDialogOpen(true)
  }

  // Handle transport click to open detail dialog
  const handleTransportClick = (transport: Transport) => {
    setSelectedTransport(transport)
    setDetailDialogOpen(true)
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
    if (!userData) {
      toast({
        title: "Error",
        description: "User data not available. Cannot add transport.",
        variant: "destructive",
      })
      return
    }

    try {
      // Add metadata
      const now = new Date().toISOString()
      const currentUser = userData.email || "Unknown User"

      // Make sure idealDeliveryDay and deliveryDay are in sync
      const transportWithMetadata = {
        ...newTransport,
        id: "", // Will be set by Supabase
        deliveryDay: newTransport.idealDeliveryDay, // Set deliveryDay to match idealDeliveryDay
        userorgId: userData.userorgId, // Add organization ID
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
    if (!userData) {
      toast({
        title: "Error",
        description: "User data not available. Cannot update transport.",
        variant: "destructive",
      })
      return
    }

    try {
      // Find the transport that changed
      const changedTransport = updatedTransports.find((newT) => {
        const oldT = transports.find((t) => t.id === newT.id)
        return oldT && oldT.idealDeliveryDay !== newT.idealDeliveryDay
      })

      if (changedTransport) {
        // Ensure the transport has the correct userorgId
        const transportToUpdate = {
          ...changedTransport,
          userorgId: userData.userorgId,
          lastModifiedDate: new Date().toISOString(),
          lastModifiedBy: userData.email || "Unknown User",
        }

        // Update in Supabase
        await updateTransport(transportToUpdate)

        // Update local state
        setTransports(updatedTransports.map((t) => (t.id === transportToUpdate.id ? transportToUpdate : t)))
        updateHistoryState(updatedTransports)

        // Show toast notification about the move
        toast({
          title: "Transport moved",
          description: `${transportToUpdate.customerName || transportToUpdate.name} moved to ${transportToUpdate.idealDeliveryDay}`,
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

  // Handle transport update from detail dialog
  const handleTransportUpdate = (updatedTransport: Transport) => {
    const updatedTransports = transports.map((t) => (t.id === updatedTransport.id ? updatedTransport : t))
    setTransports(updatedTransports)
    updateHistoryState(updatedTransports)
  }

  // Get transports for the selected week
  const filteredTransports = getTransportsForSelectedWeek()

  // Show loading state while waiting for user data
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-lg">Loading user data...</span>
      </div>
    )
  }

  // Show loading state while fetching data
  if (loading && userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-lg">Loading data...</span>
      </div>
    )
  }

  return (
    <>
      {/* User Data Dialog */}
      <UserDataDialog open={showUserDataDialog} onSave={handleSaveUserData} />

      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Transport Management</h1>
            {userData && (
              <p className="text-sm text-muted-foreground">
                Organization: {userData.userorgId} | User: {userData.email}
                {isManualEntry && <span className="ml-1 text-amber-600">(Manually entered)</span>}
              </p>
            )}
          </div>
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
            {userData && userData.roles.includes("admin") && (
              <SettingsDialog onConfigUpdate={handleConfigUpdate} userData={userData} />
            )}
            <Button onClick={() => handleAddTransportClick()} className="gap-1">
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
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredTransports.length} transports for the selected week
              </div>

              {/* View Toggle */}
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => value && setViewMode(value as "kanban" | "table")}
              >
                <ToggleGroupItem value="kanban" aria-label="Kanban View">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="table" aria-label="Table View">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {userData ? (
            viewMode === "kanban" ? (
              <TransportKanbanBoard
                transports={filteredTransports}
                capacityPerDay={config.capacitySettings}
                onTransportsChange={handleTransportsChange}
                onEmptySlotClick={handleEmptySlotClick}
                selectedWeek={selectedWeek}
                availableDays={config.availableDays}
              />
            ) : (
              <TransportTableView
                transports={filteredTransports}
                capacityPerDay={config.capacitySettings}
                availableDays={config.availableDays}
                selectedWeek={selectedWeek}
                onAddTransportClick={(day) => handleAddTransportClick(day)}
                onTransportClick={handleTransportClick}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-gray-50">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">User Information Required</h2>
              <p className="text-center mb-4 max-w-md">
                Please enter your user information to access the transport management system.
              </p>
              <Button onClick={() => setShowUserDataDialog(true)}>Enter User Information</Button>
            </div>
          )}
        </div>

        {/* Transport Registration Dialog */}
        {userData && (
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
            userData={userData}
          />
        )}

        {/* Transport Detail Dialog */}
        <TransportDetailDialog
          transport={selectedTransport}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onUpdate={handleTransportUpdate}
          capacityPerDay={config.capacitySettings}
          transports={transports}
        />
      </div>
    </>
  )
}
