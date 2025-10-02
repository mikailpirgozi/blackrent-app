"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { sk } from "date-fns/locale"
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

interface DateTimePickerProps {
  value?: Date | null
  onChange?: (date: Date | null) => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = "Vyberte dátum a čas",
  required = false,
  disabled = false,
  className
}: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value || undefined)
  const [timeValue, setTimeValue] = React.useState<string>("")
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    if (value) {
      setDate(value)
      const hours = value.getHours().toString().padStart(2, '0')
      const minutes = value.getMinutes().toString().padStart(2, '0')
      setTimeValue(`${hours}:${minutes}`)
    } else {
      setDate(undefined)
      setTimeValue("")
    }
  }, [value])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined)
      onChange?.(null)
      return
    }

    // Ak máme čas, pridaj ho k dátumu
    if (timeValue) {
      const [hours, minutes] = timeValue.split(':').map(Number)
      selectedDate.setHours(hours || 0, minutes || 0, 0, 0)
    } else {
      // Nastav aktuálny čas ak nie je zadaný
      const now = new Date()
      selectedDate.setHours(now.getHours(), now.getMinutes(), 0, 0)
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      setTimeValue(`${hours}:${minutes}`)
    }

    setDate(selectedDate)
    onChange?.(selectedDate)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value
    setTimeValue(time)

    if (date && time) {
      const [hours, minutes] = time.split(':').map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours || 0, minutes || 0, 0, 0)
      setDate(newDate)
      onChange?.(newDate)
    }
  }

  const handleClear = () => {
    setDate(undefined)
    setTimeValue("")
    onChange?.(null)
    setIsOpen(false)
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
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              <>
                {format(date, "d. MMMM yyyy", { locale: sk })}
                {timeValue && (
                  <>
                    <Clock className="ml-2 mr-1 h-4 w-4" />
                    {timeValue}
                  </>
                )}
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
            <div className="border-t p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="time" className="text-sm">Čas:</Label>
                <Input
                  id="time"
                  type="time"
                  value={timeValue}
                  onChange={handleTimeChange}
                  className="flex-1"
                />
              </div>
              {date && (
                <div className="mt-3 flex gap-2">
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
                    OK
                  </Button>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
