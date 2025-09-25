
'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { format, addDays, isToday, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarClock, CalendarIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface DateNavigatorProps {
  targetDate: Date;
}

export function DateNavigator({ targetDate }: DateNavigatorProps) {
  const router = useRouter();
  const pathname = usePathname(); // Pega o caminho atual da URL
  const [isCalendarOpen, setCalendarOpen] = useState(false);

  const isCurrentDateOrFuture = isToday(targetDate) || isFuture(targetDate);
  const prevDate = format(addDays(targetDate, -1), 'yyyy-MM-dd');
  const nextDate = format(addDays(targetDate, 1), 'yyyy-MM-dd');
  const displayDateFormatted = format(targetDate, "d 'de' LLLL", { locale: ptBR });

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = format(selectedDate, 'yyyy-MM-dd');
      // Usa o pathname dinâmico para construir a URL
      router.push(`${pathname}?date=${newDate}`);
      setCalendarOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" className="h-8 w-8" asChild>
          <Link href={`${pathname}?date=${prevDate}`} scroll={false} title="Dia anterior">
            <ChevronLeft className="h-4 w-4" />
          </Link>
      </Button>
      
      <Popover open={isCalendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'h-8 w-[160px] justify-start text-left font-normal',
              'md:w-[200px]'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className='flex-1 truncate'>{isToday(targetDate) ? 'Hoje' : displayDateFormatted}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={targetDate}
            onSelect={handleDateSelect}
            disabled={(date) => isFuture(date) || date < new Date('2015-01-01')}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="icon" className="h-8 w-8" asChild disabled={isCurrentDateOrFuture}>
        <Link href={`${pathname}?date=${nextDate}`} scroll={false} title={isCurrentDateOrFuture ? "Não é possível navegar para o futuro" : "Próximo dia"}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>

      {!isCurrentDateOrFuture && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={pathname} scroll={false} className='hidden sm:inline-flex'>
            <CalendarClock className="mr-2 h-4 w-4" />
            Hoje
          </Link>
        </Button>
      )}
    </div>
  );
}
