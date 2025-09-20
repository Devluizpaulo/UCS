
import { PageHeader } from '@/components/page-header';
import { RiskAnalysisClient } from '@/components/risk-analysis-client';
import { getCommodityPrices, getCotacoesHistorico } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export default async function RiskPage() {
    const assets = await getCommodityPrices();
    const ucsAseHistory = await getCotacoesHistorico('ucs_ase', 365);
    const assetIds = assets.filter(a => !a.isCalculated && a.id !== 'usd' && a.id !== 'eur').map(a => a.id);
    
    const histories = await Promise.all(
        assetIds.map(id => getCotacoesHistorico(id, 365))
    );

    const assetHistories: Record<string, any[]> = assetIds.reduce((acc, id, index) => {
        acc[id] = histories[index];
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div className="w-full flex-col">
            <PageHeader 
                title="Análise de Risco" 
                description="Calcule a volatilidade e a correlação dos ativos com o Índice UCS ASE."
                iconName="ShieldAlert"
            />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <RiskAnalysisClient 
                    assets={assets} 
                    ucsAseHistory={ucsAseHistory}
                    assetHistories={assetHistories}
                />
            </main>
        </div>
    )
}
