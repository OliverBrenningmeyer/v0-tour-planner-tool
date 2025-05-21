"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings } from "lucide-react"

interface CapacitySettingsProps {
  capacityPerDay: Record<string, number>
  onUpdateCapacity: (newCapacity: Record<string, number>) => void
}

export function CapacitySettings({ capacityPerDay, onUpdateCapacity }: CapacitySettingsProps) {
  const [mondayCapacity, setMondayCapacity] = useState(capacityPerDay.monday.toString())
  const [wednesdayCapacity, setWednesdayCapacity] = useState(capacityPerDay.wednesday.toString())
  const [fridayCapacity, setFridayCapacity] = useState(capacityPerDay.friday.toString())
  const [open, setOpen] = useState(false)

  const handleSave = () => {
    const newCapacity = {
      monday: Number.parseInt(mondayCapacity) || 1,
      wednesday: Number.parseInt(wednesdayCapacity) || 1,
      friday: Number.parseInt(fridayCapacity) || 1,
    }
    onUpdateCapacity(newCapacity)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Capacity Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Capacity Settings</DialogTitle>
          <DialogDescription>Set the maximum number of transports allowed for each delivery day.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="monday" className="text-right">
              Monday
            </Label>
            <Input
              id="monday"
              type="number"
              min="1"
              value={mondayCapacity}
              onChange={(e) => setMondayCapacity(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="wednesday" className="text-right">
              Wednesday
            </Label>
            <Input
              id="wednesday"
              type="number"
              min="1"
              value={wednesdayCapacity}
              onChange={(e) => setWednesdayCapacity(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="friday" className="text-right">
              Friday
            </Label>
            <Input
              id="friday"
              type="number"
              min="1"
              value={fridayCapacity}
              onChange={(e) => setFridayCapacity(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
