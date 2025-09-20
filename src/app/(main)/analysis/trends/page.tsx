
import { PageHeader } from '@/components/page-header';
import { LineChart } from 'lucide-react';

export default function TrendsPage() {
    return (
        <div className="w-full flex-col">
            <PageHeader 
                title="Tendências de Mercado" 
                description="Analise a performance histórica dos índices e ativos."
                icon={LineChart}
            />
            <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-6">
                <p className="text-muted-foreground">Página de Tendências em construção.</p>
            </main>
        </div>
    )
}
