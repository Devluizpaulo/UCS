
import { PageHeader } from '@/components/page-header';
import { Archive } from 'lucide-react';

export default function AssetsPage() {
    return (
        <div className="w-full flex-col">
            <PageHeader 
                title="Gestão de Ativos" 
                description="Adicione, edite ou remova as commodities que servem como fonte de dados."
                icon={Archive}
            />
            <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-6">
                <p className="text-muted-foreground">Página de Gestão de Ativos em construção.</p>
            </main>
        </div>
    )
}
