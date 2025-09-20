
import { DashboardPage } from '@/components/dashboard-page';
import type { CommodityPriceData } from '@/lib/types';
import { getCommodityPrices } from '@/lib/data-service';

// This is a Server Component that fetches data
export default async function DashboardRootPage() {
  // Fetch initial data on the server
  const commodityData: CommodityPriceData[] = await getCommodityPrices();

  // Pass the server-fetched data as a prop to the Client Component
  return <DashboardPage initialData={commodityData} />;
}
