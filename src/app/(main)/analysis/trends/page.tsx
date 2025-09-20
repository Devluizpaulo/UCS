
import { PageHeader } from '@/components/page-header';
import { TrendsClient } from '@/components/trends-client';
import { getCommodityConfigs } from '@/lib/commodity-config-service';

export const dynamic = 'force-dynamic';

export default async function TrendsPage() {
    const configs = await getCommodityConfigs();
    const availableAssets = configs.filter(c => c.id !== 'usd' && c.id !== 'eur');
    
    return (
        <div className="w-full flex-col">
            <PageHeader 
                title="Tendências de Mercado" 
                description="Analise a performance histórica dos índices e ativos."
                iconName="LineChart"
            />
             <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <TrendsClient availableAssets={availableAssets} />
            </main>
        </div>
    )
}
