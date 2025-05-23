"use client"

import { useState, useEffect } from "react"
import { Settings, Save, X, Plus, Loader2, MapPin, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import type { AppConfig, CapacityLimits } from "@/lib/types"
import { fetchConfigurations, updateAllConfigurations } from "@/lib/config-service"
// Add import for the address helper
import { getCustomerAddresses, getDepotAddresses } from "@/lib/address-helper"

interface SettingsDialogProps {
  onConfigUpdate: (config: AppConfig) => void
}

export function SettingsDialog({ onConfigUpdate }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("capacity")

  // Configuration state
  const [capacitySettings, setCapacitySettings] = useState<{ [key: string]: CapacityLimits }>({})
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [timeWindows, setTimeWindows] = useState<string[]>([])

  // Tour planning settings
  const [depotAddress, setDepotAddress] = useState("")
  const [stopTimeMinutes, setStopTimeMinutes] = useState<string>("30")

  // New item inputs
  const [newDay, setNewDay] = useState("")
  const [newTimeWindow, setNewTimeWindow] = useState("")

  const { toast } = useToast()

  // Load configurations when dialog opens
  useEffect(() => {
    if (open) {
      loadConfigurations()
    }
  }, [open])

  const loadConfigurations = async () => {
    try {
      setLoading(true)
      setError(null)
      const config = await fetchConfigurations()
      setCapacitySettings(config.capacitySettings)
      setAvailableDays(config.availableDays)
      setTimeWindows(config.timeWindows)
      setDepotAddress(config.tourPlanning.depotAddress)
      setStopTimeMinutes(config.tourPlanning.stopTimeMinutes.toString())
    } catch (err) {
      console.error("Failed to load configurations:", err)
      setError("Failed to load configurations. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validate capacity settings
      for (const day of availableDays) {
        if (!capacitySettings[day]) {
          setError(`Missing capacity settings for ${day}`)
          setSaving(false)
          return
        }
        if (capacitySettings[day].weight < 1) {
          setError(`Weight capacity for ${day} must be at least 1`)
          setSaving(false)
          return
        }
        if (capacitySettings[day].volume < 1) {
          setError(`Volume capacity for ${day} must be at least 1`)
          setSaving(false)
          return
        }
      }

      // Validate available days
      if (availableDays.length === 0) {
        setError("At least one delivery day must be available")
        setSaving(false)
        return
      }

      // Validate time windows
      if (timeWindows.length === 0) {
        setError("At least one time window must be available")
        setSaving(false)
        return
      }

      // Validate tour planning settings
      if (!depotAddress.trim()) {
        setError("Depot address is required")
        setSaving(false)
        return
      }

      const stopTime = Number.parseInt(stopTimeMinutes, 10)
      if (isNaN(stopTime) || stopTime < 1) {
        setError("Stop time must be a valid number greater than 0")
        setSaving(false)
        return
      }

      const config: AppConfig = {
        capacitySettings,
        availableDays,
        timeWindows,
        tourPlanning: {
          depotAddress: depotAddress.trim(),
          stopTimeMinutes: stopTime,
        },
      }

      await updateAllConfigurations(config)
      onConfigUpdate(config)

      toast({
        title: "Settings saved",
        description: "Your configuration has been updated successfully.",
        duration: 3000,
      })

      setOpen(false)
    } catch (err) {
      console.error("Failed to save configurations:", err)
      setError("Failed to save configurations. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleCapacityChange = (day: string, field: keyof CapacityLimits, value: string) => {
    const numValue = Number.parseInt(value, 10) || 0
    setCapacitySettings({
      ...capacitySettings,
      [day]: {
        ...capacitySettings[day],
        [field]: numValue,
      },
    })
  }

  const handleAddDay = () => {
    if (!newDay.trim()) return

    const formattedDay = newDay.trim().toLowerCase()

    if (availableDays.includes(formattedDay)) {
      toast({
        title: "Day already exists",
        description: `${formattedDay} is already in the list of available days.`,
        variant: "destructive",
      })
      return
    }

    setAvailableDays([...availableDays, formattedDay])
    setCapacitySettings({
      ...capacitySettings,
      [formattedDay]: {
        weight: 1000, // Default weight capacity (kg)
        volume: 10, // Default volume capacity (m³)
      },
    })
    setNewDay("")
  }

  const handleRemoveDay = (day: string) => {
    setAvailableDays(availableDays.filter((d) => d !== day))

    // Create a new object without the removed day
    const newCapacitySettings = { ...capacitySettings }
    delete newCapacitySettings[day]
    setCapacitySettings(newCapacitySettings)
  }

  const handleAddTimeWindow = () => {
    if (!newTimeWindow.trim()) return

    if (timeWindows.includes(newTimeWindow)) {
      toast({
        title: "Time window already exists",
        description: `${newTimeWindow} is already in the list of time windows.`,
        variant: "destructive",
      })
      return
    }

    setTimeWindows([...timeWindows, newTimeWindow])
    setNewTimeWindow("")
  }

  const handleRemoveTimeWindow = (timeWindow: string) => {
    setTimeWindows(timeWindows.filter((tw) => tw !== timeWindow))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>System Settings</DialogTitle>
          <DialogDescription>
            Configure capacity, available days, time windows, and tour planning for transport scheduling.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-lg">Loading settings...</span>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="capacity">Capacity</TabsTrigger>
              <TabsTrigger value="days">Days</TabsTrigger>
              <TabsTrigger value="timeWindows">Time Windows</TabsTrigger>
              <TabsTrigger value="tourPlanning">Tour Planning</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
            </TabsList>

            <TabsContent value="capacity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Capacity Per Day</CardTitle>
                  <CardDescription>Set the maximum capacity limits for each delivery day.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {availableDays.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No available days configured. Please add days in the Days tab.
                    </div>
                  ) : (
                    availableDays.map((day) => (
                      <div key={day} className="space-y-4 border p-4 rounded-md">
                        <h3 className="font-medium capitalize">{day}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`capacity-weight-${day}`}>Max Weight</Label>
                            <Input
                              id={`capacity-weight-${day}`}
                              type="number"
                              min="1"
                              value={capacitySettings[day]?.weight || ""}
                              onChange={(e) => handleCapacityChange(day, "weight", e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Weight in kg</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`capacity-volume-${day}`}>Max Volume</Label>
                            <Input
                              id={`capacity-volume-${day}`}
                              type="number"
                              min="1"
                              value={capacitySettings[day]?.volume || ""}
                              onChange={(e) => handleCapacityChange(day, "volume", e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Volume in m³</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="days" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Available Delivery Days</CardTitle>
                  <CardDescription>Configure which days of the week are available for delivery.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {availableDays.map((day) => (
                      <Badge key={day} variant="secondary" className="capitalize flex items-center gap-1 py-1 px-3">
                        {day}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveDay(day)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    {availableDays.length === 0 && (
                      <div className="text-muted-foreground">No days configured. Add your first day below.</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add new day (e.g., monday, tuesday)"
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddDay()}
                    />
                    <Button type="button" onClick={handleAddDay} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeWindows" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Time Windows</CardTitle>
                  <CardDescription>Configure available time windows for delivery scheduling.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {timeWindows.map((timeWindow) => (
                      <Badge key={timeWindow} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                        {timeWindow}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveTimeWindow(timeWindow)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    {timeWindows.length === 0 && (
                      <div className="text-muted-foreground">
                        No time windows configured. Add your first time window below.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add new time window (e.g., Morning, Afternoon)"
                      value={newTimeWindow}
                      onChange={(e) => setNewTimeWindow(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTimeWindow()}
                    />
                    <Button type="button" onClick={handleAddTimeWindow} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tourPlanning" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tour Planning Settings</CardTitle>
                  <CardDescription>Configure depot location and stop times for route calculation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="depotAddress" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Depot Address
                      </Label>
                      <Input
                        id="depotAddress"
                        value={depotAddress}
                        onChange={(e) => setDepotAddress(e.target.value)}
                        placeholder="Enter depot/warehouse address"
                      />
                      <p className="text-xs text-muted-foreground">
                        Starting point for all delivery routes. Used to calculate total distance and duration.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stopTimeMinutes" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Stop Time per Delivery
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="stopTimeMinutes"
                          type="number"
                          min="1"
                          max="120"
                          value={stopTimeMinutes}
                          onChange={(e) => setStopTimeMinutes(e.target.value)}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">minutes</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Time allocated for each delivery stop (unloading, paperwork, etc.)
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="font-medium text-blue-900 mb-2">Route Calculation</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Routes start and end at the depot address</li>
                      <li>• Deliveries are ordered by time window (Morning first, then Afternoon)</li>
                      <li>• Total duration includes driving time + stop time for each delivery</li>
                      <li>• Distance calculations use direct routes between addresses</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Address References</CardTitle>
                  <CardDescription>List of valid addresses for route planning.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Depot Addresses</h3>
                    <div className="bg-muted p-3 rounded-md max-h-40 overflow-y-auto">
                      <ul className="space-y-1">
                        {getDepotAddresses().map((address) => (
                          <li key={address} className="text-sm">
                            {address}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Customer Addresses</h3>
                    <div className="bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
                      <ul className="space-y-1">
                        {getCustomerAddresses().map((address) => (
                          <li key={address} className="text-sm">
                            {address}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      These addresses are used for route planning and distance calculations. You can copy and paste
                      these addresses when creating new transports.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
