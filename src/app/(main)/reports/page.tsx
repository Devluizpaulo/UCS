
import { PageHeader } from '@/components/page-header';

export default function ReportsPage() {
    return (
        <div className="w-full flex-col">
            <PageHeader 
                title="Geração de Relatórios" 
                description="Exporte os dados da plataforma em formatos profissionais com análises de IA."
                iconName="FileText"
            />
            <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-6">
                <p className="text-muted-foreground">Página de Relatórios em construção.</p>
            </main>
        </div>
    )
}
