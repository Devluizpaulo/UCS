
import MainLayout from '@/app/(main)/layout';
import { DashboardPage } from '@/components/dashboard-page';
import type { CommodityPriceData } from '@/lib/types';

export default async function Home() {
  // Reset: No data is fetched here for now.
  const allCommodities: CommodityPriceData[] = [];

  return (
    <MainLayout>
      <DashboardPage initialData={allCommodities} />
    </MainLayout>
  );
}
