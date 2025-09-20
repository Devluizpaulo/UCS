
import MainLayout from '@/app/(main)/layout';
import { DashboardPage } from '@/components/dashboard-page';
import type { CommodityPriceData } from '@/lib/types';
import { getCommodityPrices } from '@/lib/data-service';

export default async function Home() {
  const commodityData: CommodityPriceData[] = await getCommodityPrices();

  return (
    <MainLayout>
      <DashboardPage initialData={commodityData} />
    </MainLayout>
  );
}
