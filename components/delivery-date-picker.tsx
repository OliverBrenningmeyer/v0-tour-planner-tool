"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DeliveryDatePickerProps {
  value: string
  onChange: (value: string) => void
  label: string
  availableDays?: string[]
}

export function DeliveryDatePicker({
  value,
  onChange,
  label,
  availableDays = ["monday", "wednesday", "friday"],
}: DeliveryDatePickerProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={`Select ${label} delivery day`} />
      </SelectTrigger>
      <SelectContent>
        {availableDays.map((day) => (
          <SelectItem key={day} value={day}>
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
