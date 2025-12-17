"use client"

import * as React from "react"
import { ArrowRight, Calendar } from "lucide-react"

import { DatePicker } from "@/components/blocks/date_picker"
import { cn } from "@/lib/utils"

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export type DoubleDatePickerValue = {
  startDate?: Date
  endDate?: Date
}

export type DoubleDatePickerProps = {
  startDate?: Date
  endDate?: Date
  defaultStartDate?: Date
  defaultEndDate?: Date
  minDate?: Date
  startLabel?: React.ReactNode
  endLabel?: React.ReactNode
  startPlaceholder?: string
  endPlaceholder?: string
  startButtonClassName?: string
  endButtonClassName?: string
  className?: string
  showSeparator?: boolean
  showStartLabel?: boolean
  showEndLabel?: boolean
  displayFormat?: "long" | "short"
  onChange?: (value: DoubleDatePickerValue) => void
  onStartChange?: (date?: Date) => void
  onEndChange?: (date?: Date) => void
}

const isSameDay = (a?: Date, b?: Date) =>
  (a && b && a.getTime() === b.getTime()) || (!a && !b)

export function DoubleDatePicker({
  startDate,
  endDate,
  defaultStartDate,
  defaultEndDate,
  minDate,
  startLabel,
  endLabel,
  startPlaceholder,
  endPlaceholder,
  startButtonClassName,
  endButtonClassName,
  className,
  showSeparator = true,
  showStartLabel = true,
  showEndLabel = true,
  displayFormat,
  onChange,
  onStartChange,
  onEndChange,
}: DoubleDatePickerProps) {
  const [internalStart, setInternalStart] = React.useState<Date | undefined>(
    defaultStartDate
  )
  const [internalEnd, setInternalEnd] = React.useState<Date | undefined>(
    defaultEndDate
  )

  const start = startDate ?? internalStart
  const end = endDate ?? internalEnd
  const leadingIcon = (
    <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
  )
  const resolvedStartLabel = showStartLabel ? startLabel ?? "Du" : undefined
  const resolvedEndLabel = showEndLabel ? endLabel ?? "Au" : undefined

  const updateRange = (nextStart?: Date, nextEnd?: Date) => {
    const startChanged = !isSameDay(nextStart, start)
    const endChanged = !isSameDay(nextEnd, end)

    if (startChanged && startDate === undefined) {
      setInternalStart(nextStart)
    }
    if (endChanged && endDate === undefined) {
      setInternalEnd(nextEnd)
    }

    if (startChanged) {
      onStartChange?.(nextStart)
    }
    if (endChanged) {
      onEndChange?.(nextEnd)
    }
    if (startChanged || endChanged) {
      onChange?.({ startDate: nextStart, endDate: nextEnd })
    }
  }

  const handleStartChange = (date?: Date) => {
    let nextEnd = end

    if (date && end && end < date) {
      nextEnd = new Date(date.getTime() + ONE_DAY_MS)
    }

    updateRange(date, nextEnd)
  }

  const handleEndChange = (date?: Date) => {
    let nextEnd = date

    if (date && start && date < start) {
      nextEnd = start
    }

    updateRange(start, nextEnd)
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4",
        className
      )}
    >
      <DatePicker
        label={resolvedStartLabel}
        value={start}
        onChange={handleStartChange}
        placeholder={startPlaceholder}
        buttonClassName={startButtonClassName ?? "w-[150px]"}
        fromDate={minDate}
        leadingIcon={leadingIcon}
        displayFormat={displayFormat}
      />

      {showSeparator && (
        <div className="hidden self-end pb-3 sm:flex">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      <DatePicker
        label={resolvedEndLabel}
        value={end}
        onChange={handleEndChange}
        placeholder={endPlaceholder}
        buttonClassName={endButtonClassName ?? "w-[150px]"}
        fromDate={start ?? minDate}
        leadingIcon={leadingIcon}
        displayFormat={displayFormat}
      />
    </div>
  )
}
