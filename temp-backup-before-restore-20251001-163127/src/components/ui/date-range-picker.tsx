"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { sk } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  startDate?: Date | null
  endDate?: Date | null
  onRangeChange?: (start: Date | null, end: Date | null) => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  defaultTime?: string // Default time for both dates (e.g., "08:00")
}

export function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  label,
  placeholder = "Vyberte obdobie",
  required = false,
  disabled = false,
  className,
  defaultTime = "08:00"
}: DateRangePickerProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    if (startDate || endDate) {
      return {
        from: startDate || undefined,
        to: endDate || undefined,
      }
    }
    return undefined
  })
  
  const [startTime, setStartTime] = React.useState<string>(() => {
    if (startDate) {
      const hours = startDate.getHours().toString().padStart(2, '0')
      const minutes = startDate.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
    return defaultTime
  })
  
  const [endTime, setEndTime] = React.useState<string>(() => {
    if (endDate) {
      const hours = endDate.getHours().toString().padStart(2, '0')
      const minutes = endDate.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
    return defaultTime
  })
  
  const [isOpen, setIsOpen] = React.useState(false)

  // Sync with external changes
  React.useEffect(() => {
    if (startDate || endDate) {
      setDateRange({
        from: startDate || undefined,
        to: endDate || undefined,
      })
      
      if (startDate) {
        const hours = startDate.getHours().toString().padStart(2, '0')
        const minutes = startDate.getMinutes().toString().padStart(2, '0')
        setStartTime(`${hours}:${minutes}`)
      }
      
      if (endDate) {
        const hours = endDate.getHours().toString().padStart(2, '0')
        const minutes = endDate.getMinutes().toString().padStart(2, '0')
        setEndTime(`${hours}:${minutes}`)
      }
    } else {
      setDateRange(undefined)
      setStartTime(defaultTime)
      setEndTime(defaultTime)
    }
  }, [startDate, endDate, defaultTime])

  const handleRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    
    if (!range?.from && !range?.to) {
      // Clear selection
      onRangeChange?.(null, null)
      return
    }

    // Apply times to dates
    let fromDate = range?.from
    let toDate = range?.to

    if (fromDate) {
      const [hours, minutes] = startTime.split(':').map(Number)
      fromDate = new Date(fromDate)
      fromDate.setHours(hours, minutes, 0, 0)
    }

    if (toDate) {
      const [hours, minutes] = endTime.split(':').map(Number)
      toDate = new Date(toDate)
      toDate.setHours(hours, minutes, 0, 0)
    }

    onRangeChange?.(fromDate || null, toDate || null)
  }

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value
    setStartTime(time)

    if (dateRange?.from) {
      const [hours, minutes] = time.split(':').map(Number)
      const newDate = new Date(dateRange.from)
      newDate.setHours(hours, minutes, 0, 0)
      
      onRangeChange?.(
        newDate,
        dateRange.to ? (() => {
          const [endHours, endMinutes] = endTime.split(':').map(Number)
          const endDate = new Date(dateRange.to!)
          endDate.setHours(endHours, endMinutes, 0, 0)
          return endDate
        })() : null
      )
    }
  }

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value
    setEndTime(time)

    if (dateRange?.to) {
      const [hours, minutes] = time.split(':').map(Number)
      const newDate = new Date(dateRange.to)
      newDate.setHours(hours, minutes, 0, 0)
      
      onRangeChange?.(
        dateRange.from ? (() => {
          const [startHours, startMinutes] = startTime.split(':').map(Number)
          const startDate = new Date(dateRange.from!)
          startDate.setHours(startHours, startMinutes, 0, 0)
          return startDate
        })() : null,
        newDate
      )
    }
  }

  const handleClear = () => {
    setDateRange(undefined)
    setStartTime(defaultTime)
    setEndTime(defaultTime)
    onRangeChange?.(null, null)
    setIsOpen(false)
  }

  const handleConfirm = () => {
    setIsOpen(false)
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return placeholder
    
    if (!dateRange.to) {
      return `${format(dateRange.from, "d. MMM yyyy", { locale: sk })} - ...`
    }
    
    return `${format(dateRange.from, "d. MMM yyyy", { locale: sk })} - ${format(dateRange.to, "d. MMM yyyy", { locale: sk })}`
  }

  return (
    <div className={className}>
      {label && (
        <Label className="mb-2 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange?.from && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
            {dateRange?.from && (
              <>
                <Clock className="ml-2 mr-1 h-4 w-4" />
                {startTime}
                {dateRange.to && ` - ${endTime}`}
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleRangeSelect}
              numberOfMonths={1}
              initialFocus
            />
            <div className="border-t pt-3 space-y-3">
              {/* Start Time */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="start-time" className="text-sm min-w-[80px]">
                  Čas od:
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={handleStartTimeChange}
                  className="flex-1"
                  disabled={!dateRange?.from}
                />
              </div>

              {/* End Time */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="end-time" className="text-sm min-w-[80px]">
                  Čas do:
                </Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={handleEndTimeChange}
                  className="flex-1"
                  disabled={!dateRange?.to}
                />
              </div>

              {/* Duration info */}
              {dateRange?.from && dateRange?.to && (
                <div className="text-sm text-muted-foreground text-center pt-2 border-t">
                  Trvanie: {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} dní
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="flex-1"
                >
                  Vymazať
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  className="flex-1"
                  disabled={!dateRange?.from || !dateRange?.to}
                >
                  Potvrdiť
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

