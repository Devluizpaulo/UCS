"use client"

import * as React from "react"
import { ptBR } from "date-fns/locale"
import { isAfter, startOfDay, isWeekend, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  blockFuture?: boolean
  blockWeekends?: boolean
  holidays?: Date[]
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  blockFuture,
  blockWeekends,
  holidays,
  ...props
}: CalendarProps) {
  const today = startOfDay(new Date())

  const disabledMatchers: any[] = []
  if (blockFuture) {
    disabledMatchers.push({ after: today })
  }
  if (blockWeekends) {
    disabledMatchers.push((date: Date) => isWeekend(date))
  }
  if (holidays && holidays.length) {
    disabledMatchers.push((date: Date) => holidays.some((h) => isSameDay(h, date)))
  }

  const mergedDisabled = React.useMemo(() => {
    const incoming = props.disabled
    if (!incoming && disabledMatchers.length === 0) return undefined
    if (!incoming) return disabledMatchers
    if (Array.isArray(incoming)) return [...incoming, ...disabledMatchers]
    return [incoming as any, ...disabledMatchers]
  }, [props.disabled, blockFuture, blockWeekends, JSON.stringify(holidays)])
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      captionLayout="dropdown-buttons"
      fromYear={2015}
      toYear={new Date().getFullYear()}
      className={cn("p-3", className)}
      // Remove textos "Month:" e "Year:" ao lado dos dropdowns
      labels={{
        labelMonthDropdown: () => "",
        labelYearDropdown: () => "",
      }}
      // Marca feriados como modificadores para estilização (apenas se houver)
      modifiers={{
        ...(holidays && holidays.length
          ? { holiday: (date: Date) => holidays!.some((h) => isSameDay(h, date)) }
          : {}),
      }}
      modifiersClassNames={{
        ...(holidays && holidays.length
          ? { holiday: "before:content-[''] before:absolute before:bottom-1 before:left-1/2 before:h-1.5 before:w-1.5 before:-translate-x-1/2 before:rounded-full before:bg-emerald-600" }
          : {}),
      }}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden",
        caption_dropdowns: "flex justify-center gap-1",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      disabled={mergedDisabled}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
