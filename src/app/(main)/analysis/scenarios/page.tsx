
import { PageHeader } from '@/components/page-header';
import { CandlestickChart } from 'lucide-react';

export default function ScenariosPage() {
    return (
        <div className="w-full flex-col">
            <PageHeader 
                title="Análise de Cenários" 
                description="Simule o impacto de mudanças de preço no índice."
                icon={CandlestickChart}
            />
            <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-6">
                <p className="text-muted-foreground">Página de Análise de Cenários em construção.</p>
            </main>
        </div>
    )
}
