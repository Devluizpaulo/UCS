
import { PageHeader } from '@/components/page-header';
import { CandlestickChart } from 'lucide-react';
import { getCommodityPrices } from '@/lib/data-service';
import { ScenariosClient } from '@/components/scenarios-client';

export const dynamic = 'force-dynamic';

export default async function ScenariosPage() {
    const assets = await getCommodityPrices();

    return (
        <div className="w-full flex-col">
            <PageHeader 
                title="Análise de Cenários" 
                description="Simule o impacto de variações de preço no valor do Índice UCS ASE."
                icon={CandlestickChart}
            />
            <main className="flex flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-6">
                <div className="w-full max-w-4xl">
                   <ScenariosClient assets={assets} />
                </div>
            </main>
        </div>
    )
}
