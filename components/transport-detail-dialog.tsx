"use client"

import { useState } from "react"
import { Package, Truck, Box, User, Building, Calendar, FileText, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Crane } from "./icons/crane"
import { DeliveryDatePicker } from "./delivery-date-picker"
import type { Transport, CapacityLimits } from "@/lib/types"
import { format, parseISO, nextMonday, nextWednesday, nextFriday } from "date-fns"

interface TransportDetailDialogProps {
  transport: Transport | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (updatedTransport: Transport) => void
  capacitySettings: {
    [key: string]: CapacityLimits
  }
  transports: Transport[]
}

export function TransportDetailDialog({
  transport,
  open,
  onOpenChange,
  onUpdate,
  capacitySettings,
  transports,
}: TransportDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false)

  // Orderer information
  const [ordererBranch, setOrdererBranch] = useState(transport?.ordererBranch || "")
  const [ordererName, setOrdererName] = useState(transport?.ordererName || "")

  // Delivery date details
  const [latestDeliveryDay, setLatestDeliveryDay] = useState(transport?.latestDeliveryDay || "")
  const [latestDeliveryTimeWindow, setLatestDeliveryTimeWindow] = useState<"Morning" | "Afternoon">(
    transport?.latestDeliveryTimeWindow || "Morning",
  )
  const [idealDeliveryDay, setIdealDeliveryDay] = useState(transport?.idealDeliveryDay || "")
  const [idealDeliveryTimeWindow, setIdealDeliveryTimeWindow] = useState<"Morning" | "Afternoon">(
    transport?.idealDeliveryTimeWindow || "Morning",
  )

  // Customer information
  const [customerName, setCustomerName] = useState(transport?.customerName || "")
  const [customerAddress, setCustomerAddress] = useState(transport?.customerAddress || "")
  const [customerPhone, setCustomerPhone] = useState(transport?.customerPhone || "")

  // Load details
  const [loadDescription, setLoadDescription] = useState(transport?.loadDescription || "")
  const [referenceNumber, setReferenceNumber] = useState(transport?.referenceNumber || "")
  const [weight, setWeight] = useState(transport?.weight || "")
  const [size, setSize] = useState(transport?.size || "M")
  const [volume, setVolume] = useState(transport?.volume || "")

  // Unloading options
  const [unloadingOptions, setUnloadingOptions] = useState<string[]>(transport?.unloadingOptions || ["Boardsteinkarte"])

  // Legacy fields
  const [name, setName] = useState(transport?.name || "")
  const [description, setDescription] = useState(transport?.description || "")
  const [vehicleType, setVehicleType] = useState<"LKW" | "Kran">(transport?.vehicleType || "LKW")
  const [status, setStatus] = useState<"pending" | "confirmed" | "completed" | "cancelled">(
    transport?.status || "pending",
  )
  const [deliveryDay, setDeliveryDay] = useState<string>(transport?.deliveryDay || "monday")

  // Reset form when transport changes
  if (transport && transport.name !== name && !isEditing) {
    // Orderer information
    setOrdererBranch(transport.ordererBranch || "")
    setOrdererName(transport.ordererName || "")

    // Delivery date details
    setLatestDeliveryDay(transport.latestDeliveryDay || "")
    setLatestDeliveryTimeWindow(transport.latestDeliveryTimeWindow || "Morning")
    setIdealDeliveryDay(transport.idealDeliveryDay || "")
    setIdealDeliveryTimeWindow(transport.idealDeliveryTimeWindow || "Morning")

    // Customer information
    setCustomerName(transport.customerName || "")
    setCustomerAddress(transport.customerAddress || "")
    setCustomerPhone(transport.customerPhone || "")

    // Load details
    setLoadDescription(transport.loadDescription || "")
    setReferenceNumber(transport.referenceNumber || "")
    setWeight(transport.weight || "")
    setSize(transport.size || "M")
    setVolume(transport.volume || "")

    // Unloading options
    setUnloadingOptions(transport.unloadingOptions || ["Boardsteinkarte"])

    // Legacy fields
    setName(transport.name)
    setDescription(transport.description)
    setVehicleType(transport.vehicleType || "LKW")
    setStatus(transport.status)
    setDeliveryDay(transport.deliveryDay)
  }

  if (!transport) return null

  // Get the actual delivery date based on the selected day
  const getDeliveryDate = (day: string): Date => {
    const today = new Date()

    switch (day) {
      case "monday":
        return nextMonday(today)
      case "wednesday":
        return nextWednesday(today)
      case "friday":
        return nextFriday(today)
      default:
        return today
    }
  }

  const handleSave = async () => {
    // Get the delivery date based on the selected day
    const deliveryDate = getDeliveryDate(latestDeliveryDay)

    const updatedTransport: Transport = {
      ...transport,
      // Orderer information
      ordererBranch,
      ordererName,

      // Delivery date details
      latestDeliveryDay,
      latestDeliveryTimeWindow,
      idealDeliveryDay,
      idealDeliveryTimeWindow,
      deliveryDate: deliveryDate.toISOString(), // Update the actual date

      // Customer information
      customerName,
      customerAddress,
      customerPhone,

      // Load details
      loadDescription,
      referenceNumber,
      weight: Number(weight) || 0, // Ensure numeric value
      volume: Number(volume) || 0, // Ensure numeric value
      size,

      // Unloading options
      unloadingOptions: unloadingOptions || [],

      // Update last modified
      lastModifiedDate: new Date().toISOString(),
      lastModifiedBy: "Current User",

      // Legacy fields
      name: customerName, // Update name to match customer name
      description: loadDescription, // Update description to match load description
      vehicleType,
      status,
      deliveryDay: idealDeliveryDay, // Update the main delivery day to match ideal
    }

    onUpdate(updatedTransport)
    setIsEditing(false)
  }

  const handleCancel = () => {
    // Reset all fields to original values
    if (transport) {
      // Orderer information
      setOrdererBranch(transport.ordererBranch || "")
      setOrdererName(transport.ordererName || "")

      // Delivery date details
      setLatestDeliveryDay(transport.latestDeliveryDay || "")
      setLatestDeliveryTimeWindow(transport.latestDeliveryTimeWindow || "Morning")
      setIdealDeliveryDay(transport.idealDeliveryDay || "")
      setIdealDeliveryTimeWindow(transport.idealDeliveryTimeWindow || "Morning")

      // Customer information
      setCustomerName(transport.customerName || "")
      setCustomerAddress(transport.customerAddress || "")
      setCustomerPhone(transport.customerPhone || "")

      // Load details
      setLoadDescription(transport.loadDescription || "")
      setReferenceNumber(transport.referenceNumber || "")
      setWeight(transport.weight || "")
      setSize(transport.size || "M")
      setVolume(transport.volume || "")

      // Unloading options
      setUnloadingOptions(transport.unloadingOptions || ["Boardsteinkarte"])

      // Legacy fields
      setName(transport.name)
      setDescription(transport.description)
      setVehicleType(transport.vehicleType || "LKW")
      setStatus(transport.status)
      setDeliveryDay(transport.deliveryDay)
    }
    setIsEditing(false)
  }

  // Toggle unloading option
  const toggleUnloadingOption = (option: string) => {
    if (unloadingOptions.includes(option)) {
      setUnloadingOptions(unloadingOptions.filter((item) => item !== option))
    } else {
      setUnloadingOptions([...unloadingOptions, option])
    }
  }

  // Check if the selected day is at capacity
  const isDayAtCapacity = (day: string) => {
    if (!day || !capacitySettings || !capacitySettings[day]) return false
    if (day === transport.idealDeliveryDay) return false // Don't count the current transport

    const dayTransports = transports.filter((t) => t.idealDeliveryDay === day && t.id !== transport.id)
    const capacityLimits = capacitySettings[day]

    // Calculate current usage using actual weight and volume
    const weightUsage = dayTransports.reduce((sum, t) => sum + (Number(t.weight) || 0), 0)
    const volumeUsage = dayTransports.reduce((sum, t) => sum + (Number(t.volume) || 0), 0)

    // Check if any capacity limit is reached
    return weightUsage >= capacityLimits.weight || volumeUsage >= capacityLimits.volume
  }

  // Get the vehicle type icon
  const getVehicleIcon = () => {
    switch (vehicleType) {
      case "LKW":
        return <Truck className="h-5 w-5 text-blue-500" />
      case "Kran":
        return <Crane className="h-5 w-5 text-amber-500" />
      default:
        return <Truck className="h-5 w-5" />
    }
  }

  // Get the size icon
  const getSizeIcon = () => {
    switch (size) {
      case "S":
        return <Box className="h-5 w-5 text-blue-500" />
      case "M":
        return <Package className="h-5 w-5 text-green-500" />
      case "L":
        return <Truck className="h-5 w-5 text-purple-500" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  // Format the delivery date for display
  const formatDeliveryDate = (dateString?: string) => {
    if (!dateString) return "Not specified"
    try {
      return format(parseISO(dateString), "EEEE, MMMM d, yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {isEditing ? (
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-7 text-lg font-semibold"
                placeholder="Customer Name"
              />
            ) : (
              <div className="flex flex-col">
                <span>{transport.customerName || transport.name}</span>
                <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                  {getSizeIcon()}
                  {transport.loadDescription || transport.description}
                </span>
              </div>
            )}
          </DialogTitle>
          <div className="flex justify-between items-center mt-2">
            <Badge
              variant="outline"
              className={cn(
                "text-sm",
                vehicleType === "LKW" ? "bg-blue-50 text-blue-700 border-blue-200" : "",
                vehicleType === "Kran" ? "bg-amber-50 text-amber-700 border-amber-200" : "",
              )}
            >
              <span className="flex items-center gap-1">
                {getVehicleIcon()}
                {vehicleType}
              </span>
            </Badge>
            <div className="text-sm text-muted-foreground">ID: {transport.id}</div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {isEditing ? (
              <div className="space-y-6">
                {/* Orderer Information */}
                <div className="space-y-4 border rounded-md p-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Orderer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ordererBranch">Branch</Label>
                      <Input
                        id="ordererBranch"
                        value={ordererBranch}
                        onChange={(e) => setOrdererBranch(e.target.value)}
                        placeholder="Branch"
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">Prefilled from bexOS login</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ordererName">Name</Label>
                      <Input
                        id="ordererName"
                        value={ordererName}
                        onChange={(e) => setOrdererName(e.target.value)}
                        placeholder="Name"
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">Prefilled from bexOS login</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Date */}
                <div className="space-y-4 border rounded-md p-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Delivery Date
                  </h3>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Deliver latest until</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="latestDeliveryDay">Day</Label>
                        <DeliveryDatePicker value={latestDeliveryDay} onChange={setLatestDeliveryDay} label="latest" />
                        {isDayAtCapacity(latestDeliveryDay) && (
                          <p className="text-sm text-red-500">Warning: This day is at capacity</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Time Window</Label>
                        <RadioGroup
                          value={latestDeliveryTimeWindow}
                          onValueChange={(value) => setLatestDeliveryTimeWindow(value as "Morning" | "Afternoon")}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Morning" id="detail-latest-morning" />
                            <Label htmlFor="detail-latest-morning">Morning</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Afternoon" id="detail-latest-afternoon" />
                            <Label htmlFor="detail-latest-afternoon">Afternoon</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Ideal delivery date</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="idealDeliveryDay">Day</Label>
                        <DeliveryDatePicker value={idealDeliveryDay} onChange={setIdealDeliveryDay} label="ideal" />
                      </div>
                      <div className="space-y-2">
                        <Label>Time Window</Label>
                        <RadioGroup
                          value={idealDeliveryTimeWindow}
                          onValueChange={(value) => setIdealDeliveryTimeWindow(value as "Morning" | "Afternoon")}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Morning" id="detail-ideal-morning" />
                            <Label htmlFor="detail-ideal-morning">Morning</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Afternoon" id="detail-ideal-afternoon" />
                            <Label htmlFor="detail-ideal-afternoon">Afternoon</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4 border rounded-md p-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerName">Name</Label>
                        <Input
                          id="customerName"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Customer Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customerPhone">Phone Number</Label>
                        <Input
                          id="customerPhone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Phone Number"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerAddress">Address</Label>
                      <Textarea
                        id="customerAddress"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Customer Address"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Load Details */}
                <div className="space-y-4 border rounded-md p-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Load Details
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="loadDescription">Description</Label>
                      <Textarea
                        id="loadDescription"
                        value={loadDescription}
                        onChange={(e) => setLoadDescription(e.target.value)}
                        placeholder="Load Description"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="referenceNumber">Reference Number</Label>
                        <Input
                          id="referenceNumber"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          placeholder="Reference Number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          min="0"
                          step="1"
                          value={weight}
                          onChange={(e) => setWeight(Number(e.target.value) || 0)}
                          placeholder="Weight in kg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="volume">Volume (m³)</Label>
                        <Input
                          id="volume"
                          type="number"
                          min="0"
                          step="0.1"
                          value={volume}
                          onChange={(e) => setVolume(Number(e.target.value) || 0)}
                          placeholder="Volume in cubic meters"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <div className="flex items-center space-x-4">
                        <RadioGroup value={size} onValueChange={setSize} className="flex space-x-2">
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="S" id="size-s" />
                            <Label htmlFor="size-s">S</Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="M" id="size-m" />
                            <Label htmlFor="size-m">M</Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="L" id="size-l" />
                            <Label htmlFor="size-l">L</Label>
                          </div>
                        </RadioGroup>
                        <span className="text-sm text-muted-foreground">or</span>
                        <Input
                          value={size.match(/^[SML]$/) ? "" : size}
                          onChange={(e) => setSize(e.target.value)}
                          placeholder="Custom size"
                          className="w-32"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unloading Options */}
                <div className="space-y-4 border rounded-md p-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Unloading Options
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="boardsteinkarte"
                        checked={unloadingOptions.includes("Boardsteinkarte")}
                        onCheckedChange={() => toggleUnloadingOption("Boardsteinkarte")}
                      />
                      <Label htmlFor="boardsteinkarte">Boardsteinkarte (Default)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="with-crane"
                        checked={unloadingOptions.includes("with crane")}
                        onCheckedChange={() => toggleUnloadingOption("with crane")}
                      />
                      <Label htmlFor="with-crane">with crane</Label>
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div className="space-y-4 border rounded-md p-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Document
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="document">Upload Document (PDF, Images)</Label>
                    <div className="flex items-center gap-2">
                      <Input id="document" type="file" accept=".pdf,.jpg,.jpeg,.png" className="flex-1" />
                      <Button type="button" size="sm">
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </div>
                    {transport.documentName && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        <span>{transport.documentName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Orderer Information */}
                <div className="border rounded-md p-4">
                  <h3 className="font-medium flex items-center gap-2 mb-3">
                    <Building className="h-4 w-4" />
                    Orderer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Branch</h4>
                      <p className="mt-1">{transport.ordererBranch || "Not specified"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Name</h4>
                      <p className="mt-1">{transport.ordererName || "Not specified"}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Date */}
                <div className="border rounded-md p-4">
                  <h3 className="font-medium flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4" />
                    Delivery Date
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">Scheduled Delivery Date</h4>
                      <p className="mt-1">{formatDeliveryDate(transport.deliveryDate)}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium">Deliver latest until</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <h5 className="text-sm font-medium text-gray-500">Day</h5>
                          <p className="mt-1 capitalize">{transport.latestDeliveryDay || "Not specified"}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-500">Time Window</h5>
                          <p className="mt-1">{transport.latestDeliveryTimeWindow || "Not specified"}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium">Ideal delivery date</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <h5 className="text-sm font-medium text-gray-500">Day</h5>
                          <p className="mt-1 capitalize">{transport.idealDeliveryDay || "Not specified"}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-500">Time Window</h5>
                          <p className="mt-1">{transport.idealDeliveryTimeWindow || "Not specified"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="border rounded-md p-4">
                  <h3 className="font-medium flex items-center gap-2 mb-3">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Name</h4>
                      <p className="mt-1">{transport.customerName || "Not specified"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Address</h4>
                      <p className="mt-1">{transport.customerAddress || "Not specified"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Phone Number</h4>
                      <p className="mt-1">{transport.customerPhone || "Not specified"}</p>
                    </div>
                  </div>
                </div>

                {/* Load Details */}
                <div className="border rounded-md p-4">
                  <h3 className="font-medium flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4" />
                    Load Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Description</h4>
                      <p className="mt-1">{transport.loadDescription || "Not specified"}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Reference Number</h4>
                        <p className="mt-1">{transport.referenceNumber || "Not specified"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Weight (kg)</h4>
                        <p className="mt-1">{transport.weight || "Not specified"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Volume (m³)</h4>
                        <p className="mt-1">{transport.volume || "Not specified"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Size</h4>
                        <p className="mt-1">{transport.size || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unloading Options */}
                <div className="border rounded-md p-4">
                  <h3 className="font-medium flex items-center gap-2 mb-3">
                    <Truck className="h-4 w-4" />
                    Unloading Options
                  </h3>
                  <div className="space-y-2">
                    {transport.unloadingOptions && transport.unloadingOptions.length > 0 ? (
                      transport.unloadingOptions.map((option, index) => (
                        <p className="mt-1" key={index}>
                          {option}
                        </p>
                      ))
                    ) : (
                      <p className="mt-1">Not specified</p>
                    )}
                  </div>
                </div>

                {/* Document */}
                <div className="border rounded-md p-4">
                  <h3 className="font-medium flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4" />
                    Document
                  </h3>
                  {transport.documentName ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <span>{transport.documentName}</span>
                    </div>
                  ) : (
                    <p>No document uploaded</p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <p>This is the history tab.</p>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-4">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Details
              </Button>
              <Button variant="destructive">Delete</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
