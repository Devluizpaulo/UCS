
"use client"

import * as React from "react"
import { format, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps extends React.ComponentProps<"div"> {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    blockFuture?: boolean;
    blockWeekends?: boolean;
    holidays?: Date[];
}

export function DateRangePicker({ className, date, setDate, blockFuture, blockWeekends, holidays }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range)
    if (range?.from && range?.to) setOpen(false)
  }

  const presets: { label: string; range: () => DateRange }[] = [
    { label: "Hoje", range: () => ({ from: new Date(), to: new Date() }) },
    { label: "Ontem", range: () => { const d = addDays(new Date(), -1); return ({ from: d, to: d }) } },
    { label: "Últimos 7 dias", range: () => ({ from: addDays(new Date(), -6), to: new Date() }) },
    { label: "Este mês", range: () => { const n=new Date(); const f=new Date(n.getFullYear(), n.getMonth(), 1); return ({ from: f, to: n }) } },
  ]

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            aria-label="Selecionar período"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col gap-2 p-3">
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <Button key={p.label} size="sm" variant="outline" onClick={() => handleSelect(p.range())}>
                  {p.label}
                </Button>
              ))}
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleSelect}
              numberOfMonths={2}
              locale={ptBR}
              blockFuture={blockFuture}
              blockWeekends={blockWeekends}
              holidays={holidays}
            />
            <div className="flex justify-between pt-1">
              <Button size="sm" variant="ghost" onClick={() => handleSelect({ from: new Date(), to: new Date() })}>Hoje</Button>
              <Button size="sm" variant="outline" onClick={() => handleSelect(undefined)}>Limpar</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
