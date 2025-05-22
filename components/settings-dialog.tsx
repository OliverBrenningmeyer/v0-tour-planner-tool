"use client"

import { useState, useEffect } from "react"
import { Settings, Save, X, Plus, Loader2 } from "lucide-react"
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
import type { AppConfig, CapacitySettings } from "@/lib/types"
import { fetchConfigurations, updateAllConfigurations } from "@/lib/config-service"

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
  const [capacitySettings, setCapacitySettings] = useState<CapacitySettings>({})
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [timeWindows, setTimeWindows] = useState<string[]>([])

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
        if (!capacitySettings[day] || capacitySettings[day] < 1) {
          setError(`Capacity for ${day} must be at least 1`)
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

      const config: AppConfig = {
        capacitySettings,
        availableDays,
        timeWindows,
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

  const handleCapacityChange = (day: string, value: string) => {
    const numValue = Number.parseInt(value, 10) || 0
    setCapacitySettings({
      ...capacitySettings,
      [day]: numValue,
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
      [formattedDay]: 3, // Default capacity
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
            Configure capacity, available days, and time windows for transport scheduling.
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
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="capacity">Capacity Settings</TabsTrigger>
              <TabsTrigger value="days">Available Days</TabsTrigger>
              <TabsTrigger value="timeWindows">Time Windows</TabsTrigger>
            </TabsList>

            <TabsContent value="capacity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Capacity Per Day</CardTitle>
                  <CardDescription>Set the maximum number of transports allowed for each delivery day.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availableDays.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No available days configured. Please add days in the Available Days tab.
                    </div>
                  ) : (
                    availableDays.map((day) => (
                      <div key={day} className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`capacity-${day}`} className="text-right capitalize">
                          {day}
                        </Label>
                        <Input
                          id={`capacity-${day}`}
                          type="number"
                          min="1"
                          value={capacitySettings[day] || ""}
                          onChange={(e) => handleCapacityChange(day, e.target.value)}
                          className="col-span-3"
                        />
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

                  <div className="text-sm text-muted-foreground mt-2">
                    <p>Tips:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>Day names should be lowercase (e.g., monday, tuesday)</li>
                      <li>Each day added will get a default capacity of 3</li>
                      <li>You can adjust capacities in the Capacity Settings tab</li>
                    </ul>
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

                  <div className="text-sm text-muted-foreground mt-2">
                    <p>Examples of time windows:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>Morning (8:00 - 12:00)</li>
                      <li>Afternoon (12:00 - 17:00)</li>
                      <li>Evening (17:00 - 20:00)</li>
                    </ul>
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
