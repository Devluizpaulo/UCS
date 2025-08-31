import { MainLayout } from '@/components/main-layout';
import { DashboardPage } from '@/components/dashboard-page';

export default function Home() {
  // Usando uma imagem de placeholder online e permitida para garantir a exibição.
  const ucsCoinImageUrl = 'https://picsum.photos/200/200';

  return (
    <MainLayout>
      <DashboardPage ucsCoinImageUrl={ucsCoinImageUrl} />
    </MainLayout>
  );
}
