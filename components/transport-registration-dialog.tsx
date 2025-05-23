"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TransportRegistrationForm } from "./transport-registration-form"
import type { Transport, CapacityLimits } from "@/lib/types"

interface TransportRegistrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransport: (transport: Omit<Transport, "id">) => void
  transports: Transport[]
  capacityPerDay: {
    [key: string]: CapacityLimits
  }
  initialDay?: string | null
  isAddonSlot?: boolean
  availableDays?: string[]
  timeWindows?: string[]
}

export function TransportRegistrationDialog({
  open,
  onOpenChange,
  onAddTransport,
  transports,
  capacityPerDay,
  initialDay,
  isAddonSlot,
  availableDays,
  timeWindows,
}: TransportRegistrationDialogProps) {
  const handleAddTransport = (transport: Omit<Transport, "id">) => {
    onAddTransport(transport)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Transport</DialogTitle>
          <DialogDescription>Schedule a new transport for delivery</DialogDescription>
        </DialogHeader>

        <TransportRegistrationForm
          onAddTransport={handleAddTransport}
          transports={transports}
          capacityPerDay={capacityPerDay}
          initialDay={initialDay}
          isAddonSlot={isAddonSlot}
          inDialog={true}
          availableDays={availableDays}
          timeWindows={timeWindows}
        />
      </DialogContent>
    </Dialog>
  )
}
