
import MainLayout from '@/app/(main)/layout';
import { DashboardPage } from '@/components/dashboard-page';
import { getCommodityPrices } from '@/lib/data-service';
import type { CommodityPriceData } from '@/lib/types';

export default async function Home() {
  const allCommodities: CommodityPriceData[] = await getCommodityPrices();

  return (
    <MainLayout>
      <DashboardPage initialData={allCommodities} />
    </MainLayout>
  );
}
