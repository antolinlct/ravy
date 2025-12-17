"use client"

import * as React from "react"
import { Calendar as CalendarIcon, ChevronDownIcon } from "lucide-react"
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
  label?: React.ReactNode
  placeholder?: string
  value?: Date
  defaultValue?: Date
  onChange?: (date: Date | undefined) => void
  className?: string
  buttonClassName?: string
  fromDate?: Date
  leadingIcon?: React.ReactNode
  displayFormat?: "long" | "short"
}

const isSameDay = (a?: Date, b?: Date) =>
  (a && b && a.getTime() === b.getTime()) || (!a && !b)
const isSameMonth = (a?: Date, b?: Date) =>
  (a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth()) ||
  (!a && !b)

export function DatePicker({
  label,
  placeholder = "Sélectionner une date",
  value,
  defaultValue,
  onChange,
  className,
  buttonClassName,
  fromDate,
  leadingIcon,
  displayFormat = "long",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    defaultValue
  )
  const [month, setMonth] = React.useState<Date>(
    value ?? defaultValue ?? fromDate ?? new Date()
  )

  const selected = value ?? internalDate

  const handleSelect = (nextDate?: Date) => {
    if (!value) {
      setInternalDate(nextDate)
    }
    if (nextDate && !isSameMonth(nextDate, month)) {
      setMonth(nextDate)
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

  const getFirstAvailableDay = React.useCallback(
    (monthDate: Date) => {
      const year = monthDate.getFullYear()
      const month = monthDate.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      for (let day = 1; day <= daysInMonth; day++) {
        const candidate = new Date(year, month, day)
        if (!isDisabled(candidate)) {
          return candidate
        }
      }
      return undefined
    },
    [isDisabled]
  )

  const handleMonthChange = (month: Date) => {
    setMonth(month)
    const firstDay = getFirstAvailableDay(month)
    if (!firstDay || isSameDay(firstDay, selected)) return

    if (!value) {
      setInternalDate(firstDay)
    }
    onChange?.(firstDay)
  }

  React.useEffect(() => {
    const target = value ?? defaultValue
    if (target && !isSameMonth(target, month)) {
      setMonth(target)
    }
  }, [value, defaultValue, month])

  const formatDate = React.useCallback(
    (date: Date) => {
      if (displayFormat === "short") {
        return date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })
      }

      const months = [
        "Janv",
        "Fevr",
        "Mars",
        "Avr",
        "Mai",
        "Juin",
        "Juil",
        "Aout",
        "Sept",
        "Oct",
        "Nov",
        "Dec",
      ]
      const day = String(date.getDate()).padStart(2, "0")
      const monthLabel = months[date.getMonth()] ?? ""
      return `${day} ${monthLabel}, ${date.getFullYear()}`
    },
    [displayFormat]
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
            <span className="flex items-center gap-2">
              {leadingIcon ?? (
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              )}
              {selected ? formatDate(selected) : placeholder}
            </span>
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            captionLayout="dropdown"
            month={month}
            fromDate={fromDate}
            fromYear={fromDate?.getFullYear()}
            disabled={isDisabled}
            onSelect={handleSelect}
            onMonthChange={handleMonthChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
