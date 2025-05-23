"use client"

import type React from "react"

import { useState } from "react"
import { Building, User, Package, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "./date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Transport, CapacityLimits } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

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
  const [idealDeliveryDate, setIdealDeliveryDate] = useState<Date | undefined>(undefined)
  const [idealDeliveryTimeWindow, setIdealDeliveryTimeWindow] = useState<string>(timeWindows[0] || "Morning")
  const [latestDeliveryDate, setLatestDeliveryDate] = useState<Date | undefined>(undefined)
  const [latestDeliveryTimeWindow, setLatestDeliveryTimeWindow] = useState<string>(timeWindows[0] || "Morning")

  // Customer information
  const [customerName, setCustomerName] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  // Load details
  const [loadDescription, setLoadDescription] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [weight, setWeight] = useState<string>("0")
  const [volume, setVolume] = useState<string>("0")
  const [size, setSize] = useState<"S" | "M" | "L" | string>("M")

  // Unloading options
  const [unloadingOptions, setUnloadingOptions] = useState<string[]>(["Boardsteinkarte"])

  // Document
  const [documentFile, setDocumentFile] = useState<File | null>(null)

  // Legacy fields for compatibility
  const [vehicleType, setVehicleType] = useState<"LKW" | "Kran">("LKW")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Toggle unloading option
  const toggleUnloadingOption = (option: string) => {
    if (unloadingOptions.includes(option)) {
      setUnloadingOptions(unloadingOptions.filter((item) => item !== option))
    } else {
      setUnloadingOptions([...unloadingOptions, option])
    }
  }

  // Handle numeric input changes
  const handleNumericChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    // Allow empty string, numbers, and decimal point
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setter(value)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName || !loadDescription) {
      setError("Please fill in all required fields")
      return
    }

    // Validate dates
    if (!idealDeliveryDate || !latestDeliveryDate) {
      setError("Please select both delivery dates")
      return
    }

    setIsSubmitting(true)

    // Ensure dates are valid ISO strings
    const idealDeliveryDateISO = idealDeliveryDate.toISOString()
    const latestDeliveryDateISO = latestDeliveryDate.toISOString()

    // Create new transport
    const newTransport: Omit<Transport, "id"> = {
      // Orderer information
      ordererBranch,
      ordererName,

      // Delivery date details
      deliveryDate: idealDeliveryDateISO, // Use ideal date as the actual delivery date
      latestDeliveryDate: latestDeliveryDateISO,
      latestDeliveryTimeWindow: latestDeliveryTimeWindow as "Morning" | "Afternoon",
      idealDeliveryDate: idealDeliveryDateISO,
      idealDeliveryTimeWindow: idealDeliveryTimeWindow as "Morning" | "Afternoon",

      // Customer information
      customerName,
      customerAddress,
      customerPhone,

      // Load details
      loadDescription,
      referenceNumber,
      weight: Number(weight) || 0, // Ensure weight is a number
      volume: Number(volume) || 0, // Ensure volume is a number
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
      deliveryDay: format(idealDeliveryDate, "EEEE").toLowerCase(), // Get day of week from date
      status: "pending",
      vehicleType: unloadingOptions.includes("with crane") ? "Kran" : "LKW", // Determine vehicle type from unloading options
    }

    onAddTransport(newTransport)
    setIsSubmitting(false)
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
          <Package className="h-4 w-4" />
          Delivery Date
        </h3>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Ideal delivery date</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="idealDeliveryDate">Date</Label>
              <DatePicker
                date={idealDeliveryDate}
                onDateChange={setIdealDeliveryDate}
                placeholder="Select ideal delivery date"
              />
            </div>
            <div className="space-y-2">
              <Label>Time Window</Label>
              <Select value={idealDeliveryTimeWindow} onValueChange={setIdealDeliveryTimeWindow}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time window" />
                </SelectTrigger>
                <SelectContent>
                  {timeWindows.map((window) => (
                    <SelectItem key={window} value={window}>
                      {window}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Deliver latest until</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latestDeliveryDate">Date</Label>
              <DatePicker
                date={latestDeliveryDate}
                onDateChange={setLatestDeliveryDate}
                placeholder="Select latest delivery date"
              />
            </div>
            <div className="space-y-2">
              <Label>Time Window</Label>
              <Select value={latestDeliveryTimeWindow} onValueChange={setLatestDeliveryTimeWindow}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time window" />
                </SelectTrigger>
                <SelectContent>
                  {timeWindows.map((window) => (
                    <SelectItem key={window} value={window}>
                      {window}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => handleNumericChange(setWeight, e.target.value)}
                placeholder="Weight in kg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="volume">Volume (m³)</Label>
              <Input
                id="volume"
                type="text"
                inputMode="decimal"
                value={volume}
                onChange={(e) => handleNumericChange(setVolume, e.target.value)}
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

  return <div>{formContent}</div>
}
