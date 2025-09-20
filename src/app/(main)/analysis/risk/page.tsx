
import { PageHeader } from '@/components/page-header';
import { ShieldAlert } from 'lucide-react';

export default function RiskPage() {
    return (
        <div className="w-full flex-col">
            <PageHeader 
                title="Análise de Risco" 
                description="Calcule a volatilidade e a correlação dos ativos."
                icon={ShieldAlert}
            />
            <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-6">
                <p className="text-muted-foreground">Página de Análise de Risco em construção.</p>
            </main>
        </div>
    )
}
