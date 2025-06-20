"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Building, User, Package, FileText, Loader2, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import type { Transport, CapacityLimits } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DeliveryDatePicker } from "./delivery-date-picker"
import { addDays } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface TransportRegistrationFormProps {
  onAddTransport: (transport: Omit<Transport, "id">) => void
  transports: Transport[]
  capacityPerDay: {
    [key: string]: CapacityLimits
  }
  initialDay?: string | null
  isAddonSlot?: boolean
  inDialog?: boolean
  availableDays?: string[]
  timeWindows?: string[]
}

export function TransportRegistrationForm({
  onAddTransport,
  transports,
  capacityPerDay,
  initialDay = null,
  isAddonSlot = false,
  inDialog = false,
  availableDays = ["monday", "wednesday", "friday"],
  timeWindows = ["Morning", "Afternoon"],
}: TransportRegistrationFormProps) {
  // Orderer information
  const [ordererBranch] = useState("Berlin Branch") // Prefilled from bexOS login
  const [ordererName] = useState("John Doe") // Prefilled from bexOS login

  // Delivery date details
  const [latestDeliveryDay, setLatestDeliveryDay] = useState(initialDay || availableDays[0] || "monday")
  const [latestDeliveryTimeWindow, setLatestDeliveryTimeWindow] = useState<string>(timeWindows[0] || "Morning")
  const [idealDeliveryDay, setIdealDeliveryDay] = useState(initialDay || availableDays[0] || "monday")
  const [idealDeliveryTimeWindow, setIdealDeliveryTimeWindow] = useState<string>(timeWindows[0] || "Morning")

  // Customer information
  const [customerName, setCustomerName] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  // Load details
  const [loadDescription, setLoadDescription] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [weight, setWeight] = useState<number>(0)
  const [volume, setVolume] = useState<number>(0)
  const [size, setSize] = useState<"S" | "M" | "L" | string>("M")

  // Unloading options
  const [unloadingOptions, setUnloadingOptions] = useState<string[]>(["Boardsteinkarte"])

  // Document
  const [documentFile, setDocumentFile] = useState<File | null>(null)

  // Legacy fields for compatibility
  const [vehicleType, setVehicleType] = useState<"LKW" | "Kran">("LKW")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update delivery day when initialDay changes
  useEffect(() => {
    if (initialDay && availableDays.includes(initialDay)) {
      setLatestDeliveryDay(initialDay)
      setIdealDeliveryDay(initialDay)
    } else if (availableDays.length > 0) {
      setLatestDeliveryDay(availableDays[0])
      setIdealDeliveryDay(availableDays[0])
    }
  }, [initialDay, availableDays])

  // Get the actual delivery date based on the selected day
  const getDeliveryDate = (day: string): Date => {
    const today = new Date()
    let targetDate = new Date(today)

    // Find the next occurrence of the selected day
    let daysChecked = 0
    while (daysChecked < 14) {
      // Prevent infinite loop
      const dayName = targetDate.toLocaleDateString("en-US", { weekday: "lowercase" })
      if (dayName === day) break

      targetDate = addDays(targetDate, 1)
      daysChecked++
    }

    return targetDate
  }

  // Check if the selected day is at capacity
  const isDayAtCapacity = (day: string) => {
    if (!day) return false
    if (isAddonSlot) return false // Addon slots don't have capacity limits

    const dayCapacity = capacityPerDay[day]
    if (!dayCapacity) return false

    // Count transports by ideal delivery day
    const dayTransports = transports.filter((t) => t.idealDeliveryDay === day)

    // Calculate current usage
    const currentCount = dayTransports.length
    const currentWeight = dayTransports.reduce((sum, t) => sum + (t.weight || 0), 0)
    const currentVolume = dayTransports.reduce((sum, t) => sum + (t.volume || 0), 0)

    return (
      currentCount >= dayCapacity.count || currentWeight >= dayCapacity.weight || currentVolume >= dayCapacity.volume
    )
  }

  // Toggle unloading option
  const toggleUnloadingOption = (option: string) => {
    if (unloadingOptions.includes(option)) {
      setUnloadingOptions(unloadingOptions.filter((item) => item !== option))
    } else {
      setUnloadingOptions([...unloadingOptions, option])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName || !loadDescription || !latestDeliveryDay || !idealDeliveryDay) {
      setError("Please fill in all required fields")
      return
    }

    if (!isAddonSlot && isDayAtCapacity(idealDeliveryDay)) {
      setError(
        `${idealDeliveryDay.charAt(0).toUpperCase() + idealDeliveryDay.slice(1)} is at capacity. Please select another day.`,
      )
      return
    }

    setIsSubmitting(true)

    // Get the delivery date based on the selected day
    const deliveryDate = getDeliveryDate(idealDeliveryDay)

    // Create new transport
    const newTransport: Omit<Transport, "id"> = {
      // Orderer information
      ordererBranch,
      ordererName,

      // Delivery date details
      latestDeliveryDay,
      latestDeliveryTimeWindow: latestDeliveryTimeWindow as "Morning" | "Afternoon",
      idealDeliveryDay,
      idealDeliveryTimeWindow: idealDeliveryTimeWindow as "Morning" | "Afternoon",
      deliveryDate: deliveryDate.toISOString(), // Store the actual date

      // Customer information
      customerName,
      customerAddress,
      customerPhone,

      // Load details
      loadDescription,
      referenceNumber,
      weight,
      volume,
      size,

      // Unloading options
      unloadingOptions,

      // Document
      documentName: documentFile?.name,
      documentUrl: documentFile ? URL.createObjectURL(documentFile) : undefined,

      // Hidden fields
      createdDate: new Date().toISOString(),
      createdBy: ordererName,
      lastModifiedDate: new Date().toISOString(),
      lastModifiedBy: ordererName,
      creationChannel: "bexOS form",

      // Legacy fields
      name: customerName, // Use customer name as transport name for compatibility
      description: loadDescription, // Use load description for compatibility
      deliveryDay: idealDeliveryDay, // Use ideal delivery day for compatibility
      status: "pending",
      vehicleType: unloadingOptions.includes("with crane") ? "Kran" : "LKW", // Determine vehicle type from unloading options
    }

    onAddTransport(newTransport)
    setIsSubmitting(false)
  }

  const renderTimeWindowOptions = () => {
    return timeWindows.map((timeWindow) => (
      <div key={timeWindow} className="flex items-center space-x-2">
        <RadioGroupItem value={timeWindow} id={`ideal-${timeWindow.toLowerCase()}`} />
        <Label htmlFor={`ideal-${timeWindow.toLowerCase()}`}>{timeWindow}</Label>
      </div>
    ))
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Orderer Information */}
      <div className="space-y-4 border rounded-md p-4">
        <h3 className="font-medium flex items-center gap-2">
          <Building className="h-4 w-4" />
          Orderer Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ordererBranch">Branch</Label>
            <Input id="ordererBranch" value={ordererBranch} disabled className="bg-gray-50" />
            <p className="text-xs text-muted-foreground">Prefilled from bexOS login</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ordererName">Name</Label>
            <Input id="ordererName" value={ordererName} disabled className="bg-gray-50" />
            <p className="text-xs text-muted-foreground">Prefilled from bexOS login</p>
          </div>
        </div>
      </div>

      {/* Delivery Date */}
      <div className="space-y-4 border rounded-md p-4">
        <h3 className="font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Delivery Date
        </h3>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Ideal delivery date</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="idealDeliveryDay">Day</Label>
              <DeliveryDatePicker
                value={idealDeliveryDay}
                onChange={setIdealDeliveryDay}
                label="ideal"
                availableDays={availableDays}
              />
              {!isAddonSlot && isDayAtCapacity(idealDeliveryDay) && (
                <p className="text-sm text-red-500">Warning: This day is at capacity</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Time Window</Label>
              <RadioGroup
                value={idealDeliveryTimeWindow}
                onValueChange={setIdealDeliveryTimeWindow}
                className="flex space-x-4"
              >
                {renderTimeWindowOptions()}
              </RadioGroup>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Deliver latest until</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latestDeliveryDay">Day</Label>
              <DeliveryDatePicker
                value={latestDeliveryDay}
                onChange={setLatestDeliveryDay}
                label="latest"
                availableDays={availableDays}
              />
            </div>
            <div className="space-y-2">
              <Label>Time Window</Label>
              <RadioGroup
                value={latestDeliveryTimeWindow}
                onValueChange={setLatestDeliveryTimeWindow}
                className="flex space-x-4"
              >
                {renderTimeWindowOptions()}
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
                required
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
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="flex items-center space-x-2">
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
            </div>
          </div>
        </div>
      </div>

      {/* Unloading Options and Document Upload in a grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unloading Options */}
        <div className="space-y-4 border rounded-md p-4">
          <h3 className="font-medium">Unloading Options</h3>
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
            <Label htmlFor="document">Upload Document</Label>
            <div className="flex items-center gap-2">
              <Input
                id="document"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="flex-1"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDocumentFile(e.target.files[0])
                  }
                }}
              />
            </div>
            {documentFile && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                <span>{documentFile.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registering...
          </>
        ) : (
          "Register Transport"
        )}
      </Button>
    </form>
  )

  if (!inDialog) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Register New Transport</CardTitle>
              <CardDescription>Schedule a new transport for delivery</CardDescription>
            </div>
            {isAddonSlot && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Additional Slot
              </Badge>
            )}
            {initialDay && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {initialDay.charAt(0).toUpperCase() + initialDay.slice(1)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>{formContent}</CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold">Register New Transport</h2>
            <p className="text-sm text-muted-foreground">Schedule a new transport for delivery</p>
          </div>
          <div className="flex gap-2">
            {isAddonSlot && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Additional Slot
              </Badge>
            )}
            {initialDay && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {initialDay.charAt(0).toUpperCase() + initialDay.slice(1)}
              </Badge>
            )}
          </div>
        </div>
      </div>
      {formContent}
    </div>
  )
}
