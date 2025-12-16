"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  label?: string
  placeholder?: string
  value?: Date
  defaultValue?: Date
  onChange?: (date: Date | undefined) => void
  className?: string
  buttonClassName?: string
  fromDate?: Date
}

export function DatePicker({
  label,
  placeholder = "Sélectionner une date",
  value,
  defaultValue,
  onChange,
  className,
  buttonClassName,
  fromDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    defaultValue
  )

  const selected = value ?? internalDate

  const handleSelect = (nextDate?: Date) => {
    if (!value) {
      setInternalDate(nextDate)
    }
    onChange?.(nextDate)
    setOpen(false)
  }

  const isDisabled = React.useCallback(
    (date: Date) => {
      if (!fromDate) return false
      return date.getTime() < fromDate.getTime()
    },
    [fromDate]
  )

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <Label className="text-xs font-medium text-muted-foreground px-0">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[160px] justify-between font-normal",
              buttonClassName
            )}
          >
            {selected
              ? selected.toLocaleDateString("fr-FR")
              : placeholder}
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            captionLayout="dropdown"
            fromDate={fromDate}
            fromYear={fromDate?.getFullYear()}
            disabled={isDisabled}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
