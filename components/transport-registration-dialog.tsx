"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { TransportRegistrationForm } from "./transport-registration-form"
import type { Transport } from "@/lib/types"
import type { UserData } from "@/lib/user-context"

interface TransportRegistrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransport: (transport: Transport) => void
  transports: Transport[]
  capacityPerDay: Record<string, number>
  initialDay?: string | null
  isAddonSlot?: boolean
  availableDays?: string[]
  timeWindows?: string[]
  userData: UserData
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
  userData,
}: TransportRegistrationDialogProps) {
  const handleAddTransport = (transport: Transport) => {
    onAddTransport(transport)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <TransportRegistrationForm
          onAddTransport={handleAddTransport}
          transports={transports}
          capacityPerDay={capacityPerDay}
          initialDay={initialDay}
          isAddonSlot={isAddonSlot}
          inDialog={true}
          availableDays={availableDays}
          timeWindows={timeWindows}
          userData={userData}
        />
      </DialogContent>
    </Dialog>
  )
}
