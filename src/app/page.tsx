import { MainLayout } from '@/components/main-layout';
import { DashboardPage } from '@/components/dashboard-page';

export default function Home() {
  // A imagem está na pasta `public`, então podemos referenciá-la diretamente no path.
  const ucsCoinImageUrl = '/image/ucs.png';

  return (
    <MainLayout>
      <DashboardPage ucsCoinImageUrl={ucsCoinImageUrl} />
    </MainLayout>
  );
}
