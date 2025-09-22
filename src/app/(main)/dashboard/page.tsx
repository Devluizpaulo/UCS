
import { CommodityPrices } from '@/components/commodity-prices';
import { getCommodityPricesByDate, getCommodityPrices } from '@/lib/data-service';
import { PageHeader } from '@/components/page-header';
import { addDays, format, parseISO, isValid, isToday, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateNavigator } from '@/components/date-navigator';

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

  const isCurrentDateOrFuture = isToday(targetDate) || isFuture(targetDate);
  
  const data = isCurrentDateOrFuture 
    ? await getCommodityPrices() 
    : await getCommodityPricesByDate(targetDate);
  
  const formattedDate = format(targetDate, 'dd/MM/yyyy');
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader 
        title="Painel de Cotações"
        description={isCurrentDateOrFuture 
            ? "Cotações em tempo real dos principais ativos." 
            : `Exibindo cotações para: ${formattedDate}`
        }
      >
        <DateNavigator
          targetDate={targetDate}
        />
      </PageHeader>
      <CommodityPrices 
        initialData={data} 
        displayDate={isCurrentDateOrFuture ? 'Tempo Real' : formattedDate} 
      />
    </div>
  );
}
