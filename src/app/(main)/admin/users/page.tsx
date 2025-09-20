
import { PageHeader } from '@/components/page-header';
import { Users } from 'lucide-react';

export default function UsersPage() {
    return (
        <div className="w-full flex-col">
            <PageHeader 
                title="Gestão de Usuários" 
                description="Crie, visualize, edite e gerencie usuários do sistema."
                icon={Users}
            />
            <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-6">
                <p className="text-muted-foreground">Página de Gestão de Usuários em construção.</p>
            </main>
        </div>
    )
}
