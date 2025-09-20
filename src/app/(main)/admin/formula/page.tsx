
import { PageHeader } from '@/components/page-header';
import { SlidersHorizontal } from 'lucide-react';

export default function FormulaPage() {
    return (
        <div className="w-full flex-col">
            <PageHeader 
                title="Fórmula do Índice" 
                description="Ajuste os parâmetros, pesos e fatores de cálculo do índice UCS."
                icon={SlidersHorizontal}
            />
            <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-6">
                <p className="text-muted-foreground">Página de Gestão da Fórmula em construção.</p>
            </main>
        </div>
    )
}
