import { MainLayout } from '@/components/main-layout';
import { DashboardPage } from '@/components/dashboard-page';

export default function Home() {
  // Alterado para usar uma imagem de placeholder funcional
  const ucsCoinImageUrl = 'https://picsum.photos/200/200';

  return (
    <MainLayout>
      <DashboardPage ucsCoinImageUrl={ucsCoinImageUrl} />
    </MainLayout>
  );
}
