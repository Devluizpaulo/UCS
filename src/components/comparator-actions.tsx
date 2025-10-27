"use client";

import { Button } from '@/components/ui/button';
import { CalendarIcon, ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function ComparatorActions({ targetDate }: { targetDate: Date }) {
  const router = useRouter();

  const goToPreviousBusinessDay = async () => {
    try {
      const res = await fetch(`/api/business-day/previous?date=${format(targetDate, 'yyyy-MM-dd')}`);
      const json = await res.json();
      if (json?.success && json?.date) {
        router.push(`/comparador?date=${json.date.substring(0,10)}`);
      }
    } catch {}
  };

  const goToNextDay = () => {
    const next = new Date(targetDate);
    next.setDate(next.getDate() + 1);
    router.push(`/comparador?date=${format(next, 'yyyy-MM-dd')}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Link href={`/comparador?date=${format(new Date(), 'yyyy-MM-dd')}`}>
        <Button variant="outline" size="sm" title="Hoje">
          <CalendarIcon className="h-4 w-4 mr-2" /> Hoje
        </Button>
      </Link>
      <Button variant="outline" size="sm" onClick={goToPreviousBusinessDay} title="Último dia útil">
        <ArrowLeftCircle className="h-4 w-4 mr-2" /> Último dia útil
      </Button>
      <Button variant="outline" size="sm" onClick={goToNextDay} title="Próximo dia">
        <ArrowRightCircle className="h-4 w-4 mr-2" /> Próximo dia
      </Button>
    </div>
  );
}
