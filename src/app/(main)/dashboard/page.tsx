
import { CommodityPrices } from '@/components/commodity-prices';
import { getCommodityPricesByDate, getCommodityPrices } from '@/lib/data-service';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { addDays, format, parseISO, isValid, isToday as isTodayDateFns } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getValidatedDate(dateString?: string | null): Date {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return new Date();
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  
  const dateParam = typeof searchParams.date === 'string' ? searchParams.date : null;
  const targetDate = getValidatedDate(dateParam);

  const isToday = !dateParam || isTodayDateFns(targetDate);
  
  const data = isToday 
    ? await getCommodityPrices() 
    : await getCommodityPricesByDate(targetDate);
  
  const formattedDate = format(targetDate, 'dd/MM/yyyy');
  const prevDate = format(addDays(targetDate, -1), 'yyyy-MM-dd');
  const nextDate = format(addDays(targetDate, 1), 'yyyy-MM-dd');
  
  // Format for the new date display in Portuguese
  const displayDateFormatted = format(targetDate, "d 'de' LLLL", { locale: ptBR });

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader 
        title="Painel de Cotações"
        description={isToday 
            ? "Cotações em tempo real dos principais ativos." 
            : `Exibindo cotações para: ${formattedDate}`
        }
      >
        <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border">
              <Button variant="outline" size="icon" className="h-9 w-9 border-none" asChild>
                  <Link href={`/dashboard?date=${prevDate}`} scroll={false} title="Dia anterior">
                      <ChevronLeft className="h-4 w-4" />
                  </Link>
              </Button>
              <div className="px-3 text-sm font-medium tabular-nums capitalize">
                {displayDateFormatted}
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 border-none" asChild>
                  <Link href={`/dashboard?date=${nextDate}`} scroll={false} title="Próximo dia">
                      <ChevronRight className="h-4 w-4" />
                  </Link>
              </Button>
            </div>

             {!isToday && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard" scroll={false}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Hoje
                </Link>
              </Button>
            )}
        </div>
      </PageHeader>
      <CommodityPrices 
        initialData={data} 
        displayDate={isToday ? 'Tempo Real' : formattedDate} 
      />
    </div>
  );
}
