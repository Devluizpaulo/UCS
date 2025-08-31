import { MainLayout } from '@/components/main-layout';
import { DashboardPage } from '@/components/dashboard-page';

export default function Home() {
  // Since we are using a placeholder image, we need to provide the correct path.
  // The image is added to the public folder, so we can reference it directly.
  const ucsCoinImageUrl = '/ucs-coin.png';

  return (
    <MainLayout>
      <DashboardPage ucsCoinImageUrl={ucsCoinImageUrl} />
    </MainLayout>
  );
}
