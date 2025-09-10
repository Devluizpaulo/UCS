
'use client';

import { PageHeader } from '@/components/page-header';
import { UCSIndexDisplay } from '@/components/ucs-index-display';
import { UnderlyingAssetsCard } from './underlying-assets-card';


export function DashboardPage() {

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Componente UCS Index Display integrado */}
          <div className="lg:col-span-3">
            <UCSIndexDisplay />
          </div>

          <div className="lg:col-span-2">
            <UnderlyingAssetsCard />
          </div>
        </div>
      </main>
    </div>
  );
}
