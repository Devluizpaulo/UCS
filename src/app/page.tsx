import { MainLayout } from '@/components/main-layout';
import { DashboardPage } from '@/components/dashboard-page';

export default function Home() {
  // Alterado para usar a imagem local da pasta /public
  const ucsCoinImageUrl = '/image/ucs.png';

  return (
    <MainLayout>
      <DashboardPage ucsCoinImageUrl={ucsCoinImageUrl} />
    </MainLayout>
  );
}
