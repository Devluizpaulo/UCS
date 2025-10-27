import { format, isToday, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateComparison } from '@/components/admin/date-comparison';
import { getCommodityPrices, getCommodityPricesByDate } from '@/lib/data-service';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { ComparatorActions } from '@/components/comparator-actions';

function getValidatedDate(dateString?: string | null): Date | null {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) return parsed;
  }
  return null;
}

export default async function ComparadorPage({ searchParams }: { searchParams: { date?: string } }) {
  const targetDate = getValidatedDate(searchParams?.date) || new Date();
  const isTodayOrFuture = isToday(targetDate);

  const data = isTodayOrFuture
    ? await getCommodityPrices()
    : await getCommodityPricesByDate(targetDate);

  const formattedDate = format(targetDate, 'dd/MM/yyyy', { locale: ptBR });

  return (
    <>
      <PageHeader title="Comparativo de Datas" description="Compare rapidamente as cotações entre datas diferentes.">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="sm">
              Voltar ao Dashboard
            </Button>
          </Link>
          <ComparatorActions targetDate={targetDate} />
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-background to-muted/30">
        <div className="mb-4 text-sm text-muted-foreground">
          Exibindo cotações para <span className="font-semibold">{formattedDate}</span>.
        </div>
        <DateComparison currentDate={targetDate} currentData={data} />

        <div className="mt-6 text-xs text-muted-foreground">
          Dica: use o botão "Último dia útil" para pular fins de semana e feriados automaticamente.
        </div>
      </main>
    </>
  );
}
