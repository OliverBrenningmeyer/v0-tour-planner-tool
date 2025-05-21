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
import { startOfWeek, endOfWeek, parseISO, isWithinInterval, addDays } from "date-fns"

export default function TransportDashboard() {
  // Initial transports data
  const initialTransports: Transport[] = [
    {
      id: "1",
      name: "Furniture Delivery",
      description: "3 sofas and 2 tables",
      deliveryDay: "monday",
      status: "pending",
      vehicleType: "LKW",
      size: "L",

      // Orderer information
      ordererBranch: "Berlin Branch",
      ordererName: "John Doe",

      // Delivery date details
      latestDeliveryDay: "monday",
      latestDeliveryTimeWindow: "Afternoon",
      idealDeliveryDay: "monday",
      idealDeliveryTimeWindow: "Morning",
      deliveryDate: new Date().toISOString(), // Today

      // Customer information
      customerName: "Alice Johnson",
      customerAddress: "123 Main St, Berlin",
      customerPhone: "+49 123 456789",

      // Load details
      loadDescription: "3 sofas and 2 tables",
      referenceNumber: "REF-001",
      weight: "250kg",

      // Unloading options
      unloadingOptions: ["Boardsteinkarte"],

      // Hidden fields
      createdDate: "2025-05-15T10:30:00Z",
      createdBy: "John Doe",
      lastModifiedDate: "2025-05-15T10:30:00Z",
      lastModifiedBy: "John Doe",
      creationChannel: "bexOS form",
    },
    {
      id: "2",
      name: "Electronics Shipment",
      description: "TVs and computers",
      deliveryDay: "monday",
      status: "confirmed",
      vehicleType: "LKW",
      size: "M",

      // Orderer information
      ordererBranch: "Munich Branch",
      ordererName: "Jane Smith",

      // Delivery date details
      latestDeliveryDay: "monday",
      latestDeliveryTimeWindow: "Afternoon",
      idealDeliveryDay: "monday",
      idealDeliveryTimeWindow: "Morning",
      deliveryDate: new Date().toISOString(), // Today

      // Customer information
      customerName: "Bob Williams",
      customerAddress: "456 Oak St, Munich",
      customerPhone: "+49 987 654321",

      // Load details
      loadDescription: "TVs and computers",
      referenceNumber: "REF-002",
      weight: "180kg",

      // Unloading options
      unloadingOptions: ["Boardsteinkarte"],

      // Hidden fields
      createdDate: "2025-05-16T09:15:00Z",
      createdBy: "Jane Smith",
      lastModifiedDate: "2025-05-16T09:15:00Z",
      lastModifiedBy: "Jane Smith",
      creationChannel: "bexOS form",
    },
    {
      id: "3",
      name: "Office Supplies",
      description: "Paper, pens, and staplers",
      deliveryDay: "wednesday",
      status: "pending",
      vehicleType: "LKW",
      size: "S",

      // Orderer information
      ordererBranch: "Hamburg Branch",
      ordererName: "Michael Brown",

      // Delivery date details
      latestDeliveryDay: "wednesday",
      latestDeliveryTimeWindow: "Morning",
      idealDeliveryDay: "monday",
      idealDeliveryTimeWindow: "Morning",
      deliveryDate: new Date().toISOString(), // Today

      // Customer information
      customerName: "Carol Davis",
      customerAddress: "789 Pine St, Hamburg",
      customerPhone: "+49 456 789012",

      // Load details
      loadDescription: "Paper, pens, and staplers",
      referenceNumber: "REF-003",
      weight: "50kg",

      // Unloading options
      unloadingOptions: ["Boardsteinkarte"],

      // Hidden fields
      createdDate: "2025-05-17T14:20:00Z",
      createdBy: "Michael Brown",
      lastModifiedDate: "2025-05-17T14:20:00Z",
      lastModifiedBy: "Michael Brown",
      creationChannel: "bexOS form",
    },
    {
      id: "4",
      name: "Construction Materials",
      description: "Steel beams and concrete blocks",
      deliveryDay: "friday",
      status: "confirmed",
      vehicleType: "Kran",
      size: "L",

      // Orderer information
      ordererBranch: "Frankfurt Branch",
      ordererName: "David Wilson",

      // Delivery date details
      latestDeliveryDay: "friday",
      latestDeliveryTimeWindow: "Afternoon",
      idealDeliveryDay: "wednesday",
      idealDeliveryTimeWindow: "Afternoon",
      deliveryDate: new Date().toISOString(), // Today

      // Customer information
      customerName: "Eva Martinez",
      customerAddress: "101 Elm St, Frankfurt",
      customerPhone: "+49 234 567890",

      // Load details
      loadDescription: "Steel beams and concrete blocks",
      referenceNumber: "REF-004",
      weight: "1200kg",

      // Unloading options
      unloadingOptions: ["Boardsteinkarte", "with crane"],

      // Hidden fields
      createdDate: "2025-05-18T11:45:00Z",
      createdBy: "David Wilson",
      lastModifiedDate: "2025-05-18T11:45:00Z",
      lastModifiedBy: "David Wilson",
      creationChannel: "bexOS form",
    },
    {
      id: "5",
      name: "Heavy Machinery",
      description: "Industrial equipment",
      deliveryDay: "friday",
      status: "pending",
      vehicleType: "Kran",
      size: "L",

      // Orderer information
      ordererBranch: "Cologne Branch",
      ordererName: "Sarah Taylor",

      // Delivery date details
      latestDeliveryDay: "friday",
      latestDeliveryTimeWindow: "Morning",
      idealDeliveryDay: "friday",
      idealDeliveryTimeWindow: "Morning",
      deliveryDate: new Date().toISOString(), // Today

      // Customer information
      customerName: "Frank Anderson",
      customerAddress: "202 Maple St, Cologne",
      customerPhone: "+49 345 678901",

      // Load details
      loadDescription: "Industrial equipment",
      referenceNumber: "REF-005",
      weight: "850kg",

      // Unloading options
      unloadingOptions: ["Boardsteinkarte", "with crane"],

      // Hidden fields
      createdDate: "2025-05-19T16:30:00Z",
      createdBy: "Sarah Taylor",
      lastModifiedDate: "2025-05-19T16:30:00Z",
      lastModifiedBy: "Sarah Taylor",
      creationChannel: "bexOS form",
    },
  ]

  // Add some future transports for next week
  const nextWeekTransports: Transport[] = [
    {
      id: "6",
      name: "Furniture Delivery Next Week",
      description: "Office furniture",
      deliveryDay: "monday",
      status: "pending",
      vehicleType: "LKW",
      size: "L",

      // Orderer information
      ordererBranch: "Berlin Branch",
      ordererName: "John Doe",

      // Delivery date details
      latestDeliveryDay: "monday",
      latestDeliveryTimeWindow: "Morning",
      idealDeliveryDay: "monday",
      idealDeliveryTimeWindow: "Morning",
      deliveryDate: addDays(new Date(), 7).toISOString(), // Next week

      // Customer information
      customerName: "Tech Solutions Inc.",
      customerAddress: "500 Tech Blvd, Berlin",
      customerPhone: "+49 123 789456",

      // Load details
      loadDescription: "Office furniture for new headquarters",
      referenceNumber: "REF-006",
      weight: "350kg",

      // Unloading options
      unloadingOptions: ["Boardsteinkarte"],

      // Hidden fields
      createdDate: "2025-05-20T10:30:00Z",
      createdBy: "John Doe",
      lastModifiedDate: "2025-05-20T10:30:00Z",
      lastModifiedBy: "John Doe",
      creationChannel: "bexOS form",
    },
    {
      id: "7",
      name: "Medical Equipment",
      description: "Hospital supplies",
      deliveryDay: "wednesday",
      status: "confirmed",
      vehicleType: "LKW",
      size: "M",

      // Orderer information
      ordererBranch: "Munich Branch",
      ordererName: "Jane Smith",

      // Delivery date details
      latestDeliveryDay: "wednesday",
      latestDeliveryTimeWindow: "Afternoon",
      idealDeliveryDay: "wednesday",
      idealDeliveryTimeWindow: "Morning",
      deliveryDate: addDays(new Date(), 9).toISOString(), // Next week Wednesday

      // Customer information
      customerName: "City Hospital",
      customerAddress: "123 Health St, Munich",
      customerPhone: "+49 987 123456",

      // Load details
      loadDescription: "Medical equipment and supplies",
      referenceNumber: "REF-007",
      weight: "200kg",

      // Unloading options
      unloadingOptions: ["Boardsteinkarte"],

      // Hidden fields
      createdDate: "2025-05-21T09:15:00Z",
      createdBy: "Jane Smith",
      lastModifiedDate: "2025-05-21T09:15:00Z",
      lastModifiedBy: "Jane Smith",
      creationChannel: "bexOS form",
    },
  ]

  // Combine current and next week transports
  const allTransports = [...initialTransports, ...nextWeekTransports]

  // Use history hook for transports
  const {
    state: transports,
    updateState: setTransports,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength,
    currentPosition,
  } = useHistory<Transport[]>(allTransports)

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

  // Toast for notifications
  const { toast } = useToast()

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: () => {
      if (canUndo && activeTab === "kanban") {
        const success = undo()
        if (success) {
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
  const handleEmptySlotClick = (day: string) => {
    setSelectedDay(day)
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

  const handleAddTransport = (newTransport: Transport) => {
    // Add metadata
    const now = new Date().toISOString()
    const currentUser = "Current User" // In a real app, this would come from authentication

    const transportWithMetadata = {
      ...newTransport,
      id: (transports.length + 1).toString(),
      createdDate: now,
      createdBy: currentUser,
      lastModifiedDate: now,
      lastModifiedBy: currentUser,
      creationChannel: "bexOS form",
    }

    const updatedTransports = [...transports, transportWithMetadata]
    setTransports(updatedTransports)

    // Show success toast
    toast({
      title: "Transport added",
      description: `${newTransport.customerName} has been scheduled for ${newTransport.deliveryDay}`,
      duration: 2000,
    })

    // Reset selected day and switch back to kanban view
    setSelectedDay(null)
    setActiveTab("kanban")
  }

  const handleTransportsChange = (updatedTransports: Transport[]) => {
    // Find the transport that changed
    const changedTransport = updatedTransports.find((newT) => {
      const oldT = transports.find((t) => t.id === newT.id)
      return oldT && oldT.deliveryDay !== newT.deliveryDay
    })

    setTransports(updatedTransports)

    // Show toast notification about the move
    if (changedTransport) {
      toast({
        title: "Transport moved",
        description: `${changedTransport.customerName || changedTransport.name} moved to ${changedTransport.deliveryDay}`,
        duration: 2000,
      })
    }
  }

  // Get transports for the selected week
  const filteredTransports = getTransportsForSelectedWeek()

  // Reset selected day when tab changes
  useEffect(() => {
    if (activeTab !== "register") {
      setSelectedDay(null)
    }
  }, [activeTab])

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
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
