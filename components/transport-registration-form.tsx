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
import type { Transport } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DeliveryDatePicker } from "./delivery-date-picker"
import { nextMonday, nextWednesday, nextFriday } from "date-fns"

interface TransportRegistrationFormProps {
  onAddTransport: (transport: Transport) => void
  transports: Transport[]
  capacityPerDay: Record<string, number>
  initialDay?: string | null
}

export function TransportRegistrationForm({
  onAddTransport,
  transports,
  capacityPerDay,
  initialDay = null,
}: TransportRegistrationFormProps) {
  // Orderer information
  const [ordererBranch] = useState("Berlin Branch") // Prefilled from bexOS login
  const [ordererName] = useState("John Doe") // Prefilled from bexOS login

  // Delivery date details
  const [latestDeliveryDay, setLatestDeliveryDay] = useState("")
  const [latestDeliveryTimeWindow, setLatestDeliveryTimeWindow] = useState<"Morning" | "Afternoon">("Morning")
  const [idealDeliveryDay, setIdealDeliveryDay] = useState(initialDay || "monday")
  const [idealDeliveryTimeWindow, setIdealDeliveryTimeWindow] = useState<"Morning" | "Afternoon">("Morning")

  // Customer information
  const [customerName, setCustomerName] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  // Load details
  const [loadDescription, setLoadDescription] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [weight, setWeight] = useState("")
  const [size, setSize] = useState<"S" | "M" | "L" | string>("M")

  // Unloading options
  const [unloadingOptions, setUnloadingOptions] = useState<string[]>(["Boardsteinkarte"])

  // Document
  const [documentFile, setDocumentFile] = useState<File | null>(null)

  // Legacy fields for compatibility
  const [vehicleType, setVehicleType] = useState<"LKW" | "Kran">("LKW")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update ideal delivery day when initialDay changes
  useEffect(() => {
    if (initialDay) {
      setIdealDeliveryDay(initialDay)
    }
  }, [initialDay])

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

  // Check if the selected day is at capacity
  const isDayAtCapacity = (day: string) => {
    if (!day) return false

    const dayTransports = transports.filter((t) => t.deliveryDay === day)
    return dayTransports.length >= (capacityPerDay[day] || 0)
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

    if (!customerName || !loadDescription) {
      setError("Please fill in all required fields")
      return
    }

    // Use ideal delivery day if latest delivery day is not set
    const deliveryDay = latestDeliveryDay || idealDeliveryDay

    if (!deliveryDay) {
      setError("Please select a delivery day")
      return
    }

    if (isDayAtCapacity(deliveryDay)) {
      setError(
        `${deliveryDay.charAt(0).toUpperCase() + deliveryDay.slice(1)} is at capacity (${capacityPerDay[deliveryDay]}). Please select another day.`,
      )
      return
    }

    setIsSubmitting(true)

    // Get the delivery date based on the selected day
    const deliveryDate = getDeliveryDate(deliveryDay)

    // Simulate API call
    setTimeout(() => {
      const newTransport: Transport = {
        id: "", // Will be set by the parent component

        // Orderer information
        ordererBranch,
        ordererName,

        // Delivery date details
        latestDeliveryDay: latestDeliveryDay || idealDeliveryDay, // Use ideal day as fallback
        latestDeliveryTimeWindow,
        idealDeliveryDay,
        idealDeliveryTimeWindow,
        deliveryDate: deliveryDate.toISOString(), // Store the actual date

        // Customer information
        customerName,
        customerAddress,
        customerPhone,

        // Load details
        loadDescription,
        referenceNumber,
        weight,
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
        deliveryDay: deliveryDay, // Use the determined delivery day
        status: "pending",
        vehicleType: unloadingOptions.includes("with crane") ? "Kran" : "LKW", // Determine vehicle type from unloading options
      }

      onAddTransport(newTransport)

      // Reset form
      setLatestDeliveryDay("")
      setIdealDeliveryDay("monday")
      setCustomerName("")
      setCustomerAddress("")
      setCustomerPhone("")
      setLoadDescription("")
      setReferenceNumber("")
      setWeight("")
      setSize("M")
      setUnloadingOptions(["Boardsteinkarte"])
      setDocumentFile(null)
      setError(null)
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Register New Transport</CardTitle>
        <CardDescription>
          {initialDay
            ? `Schedule a new transport for ${initialDay.charAt(0).toUpperCase() + initialDay.slice(1)}`
            : "Schedule a new transport for delivery"}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              <h4 className="text-sm font-medium">Deliver latest until</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latestDeliveryDay">Day</Label>
                  <DeliveryDatePicker
                    value={latestDeliveryDay}
                    onChange={setLatestDeliveryDay}
                    label="latest"
                    placeholder="Select a day (optional)"
                  />
                  {latestDeliveryDay && isDayAtCapacity(latestDeliveryDay) && (
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
                      <RadioGroupItem value="Morning" id="latest-morning" />
                      <Label htmlFor="latest-morning">Morning</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Afternoon" id="latest-afternoon" />
                      <Label htmlFor="latest-afternoon">Afternoon</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Ideal delivery date</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idealDeliveryDay">Day</Label>
                  <DeliveryDatePicker value={idealDeliveryDay} onChange={setIdealDeliveryDay} label="ideal" />
                  {initialDay && (
                    <p className="text-sm text-blue-600">
                      Pre-filled from selected slot: {initialDay.charAt(0).toUpperCase() + initialDay.slice(1)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Time Window</Label>
                  <RadioGroup
                    value={idealDeliveryTimeWindow}
                    onValueChange={(value) => setIdealDeliveryTimeWindow(value as "Morning" | "Afternoon")}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Morning" id="ideal-morning" />
                      <Label htmlFor="ideal-morning">Morning</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Afternoon" id="ideal-afternoon" />
                      <Label htmlFor="ideal-afternoon">Afternoon</Label>
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
                <Label htmlFor="customerAddress">Address</Label>
                <Textarea
                  id="customerAddress"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Customer Address"
                  rows={2}
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
                  <Label htmlFor="weight">Weight</Label>
                  <Input id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Weight" />
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
              <Label htmlFor="document">Upload Document (PDF, Images)</Label>
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
      </CardContent>
    </Card>
  )
}
