"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { sk } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  value?: {
    from: Date | null
    to: Date | null
  }
  onChange?: (value: { from: Date | null; to: Date | null }) => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  label,
  placeholder = "Vyberte dátumový rozsah",
  required = false,
  disabled = false,
  className,
}: DateRangePickerProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)
  const [isOpen, setIsOpen] = React.useState(false)

  // Sync with external value changes ONLY when value changes from parent
  React.useEffect(() => {
    if (value?.from && value?.to) {
      setDateRange({ from: value.from, to: value.to })
    }
  }, [value])

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    
    if (range?.from && range?.to) {
      onChange?.({ from: range.from, to: range.to })
    } else if (!range?.from && !range?.to) {
      onChange?.({ from: null, to: null })
    }
  }

  const handleClear = () => {
    setDateRange(undefined)
    onChange?.({ from: null, to: null })
    setIsOpen(false)
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return null
    
    if (dateRange.to) {
      return (
        <>
          {format(dateRange.from, "d. MMM yyyy", { locale: sk })}
          {" - "}
          {format(dateRange.to, "d. MMM yyyy", { locale: sk })}
        </>
      )
    }
    
    return format(dateRange.from, "d. MMM yyyy", { locale: sk })
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
            {dateRange?.from ? (
              <span>{formatDateRange()}</span>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
              initialFocus
              classNames={{
                day_range_middle: "bg-primary/20 text-primary-foreground rounded-none hover:bg-primary/30 transition-colors",
                day_range_start: "bg-primary text-primary-foreground rounded-l-md rounded-r-none hover:bg-primary/90",
                day_range_end: "bg-primary text-primary-foreground rounded-r-md rounded-l-none hover:bg-primary/90",
              }}
            />
            
            {/* Helper text keď je vybraný len jeden dátum */}
            {dateRange?.from && !dateRange?.to && (
              <div className="border-t mt-3 pt-3">
                <p className="text-sm text-muted-foreground text-center">
                  Vyberte koncový dátum
                </p>
              </div>
            )}

            {/* Action buttons - zobrazí sa len keď sú vybrané oba dátumy */}
            {dateRange?.from && dateRange?.to && (
              <div className="border-t mt-3 pt-3">
                <div className="flex gap-2">
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
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    Potvrdiť
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

