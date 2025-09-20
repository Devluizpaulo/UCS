
import { PageHeader } from '@/components/page-header';

export default function CalculatorPage() {
    return (
        <div className="w-full flex-col">
            <PageHeader 
                title="Calculadora UCS" 
                description="Calcule manually o valor da Unidade de Crédito de Sustentabilidade."
                iconName="Calculator"
            />
            <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-6">
                <p className="text-muted-foreground">Página da Calculadora em construção.</p>
            </main>
        </div>
    )
}
