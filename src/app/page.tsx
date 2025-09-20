import MainLayout from '@/app/(main)/layout';
import { DashboardPage } from '@/components/dashboard-page';

export default function Home() {
  return (
    <MainLayout>
      <DashboardPage />
    </MainLayout>
  );
}
