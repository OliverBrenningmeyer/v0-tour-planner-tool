"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { TransportRegistrationForm } from "./transport-registration-form"
import type { Transport } from "@/lib/types"

interface TransportRegistrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransport: (transport: Transport) => void
  transports: Transport[]
  capacityPerDay: Record<string, number>
  initialDay?: string | null
  isAddonSlot?: boolean
}

export function TransportRegistrationDialog({
  open,
  onOpenChange,
  onAddTransport,
  transports,
  capacityPerDay,
  initialDay,
  isAddonSlot,
}: TransportRegistrationDialogProps) {
  const handleAddTransport = (transport: Transport) => {
    onAddTransport(transport)
    onOpenChange(false) // Close the dialog after adding
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0">
        <TransportRegistrationForm
          onAddTransport={handleAddTransport}
          transports={transports}
          capacityPerDay={capacityPerDay}
          initialDay={initialDay}
          isAddonSlot={isAddonSlot}
          inDialog={true}
        />
      </DialogContent>
    </Dialog>
  )
}
