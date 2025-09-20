import MainLayout from '@/app/(main)/layout';
import { PageHeader } from '@/components/page-header';

export default function Home() {
  return (
    <MainLayout>
       <div className="flex min-h-screen w-full flex-col">
          <PageHeader title="Painel" />
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            {/* O conteúdo da página será adicionado aqui */}
          </main>
        </div>
    </MainLayout>
  );
}
