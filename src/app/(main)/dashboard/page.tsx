
import { CommodityPrices } from '@/components/commodity-prices';
import { getCommodityPricesByDate, getCommodityPrices } from '@/lib/data-service';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';
import { addDays, format, parseISO, isValid } from 'date-fns';

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

  const isToday = !dateParam;
  
  const data = isToday 
    ? await getCommodityPrices() 
    : await getCommodityPricesByDate(targetDate);
  
  const formattedDate = format(targetDate, 'dd/MM/yyyy');
  const prevDate = format(addDays(targetDate, -1), 'yyyy-MM-dd');
  const nextDate = format(addDays(targetDate, 1), 'yyyy-MM-dd');

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
            <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard?date=${prevDate}`} scroll={false}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Anterior
                </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard?date=${nextDate}`} scroll={false}>
                    Próximo
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
             {!isToday && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard" scroll={false}>
                  <Home className="mr-2 h-4 w-4" />
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
