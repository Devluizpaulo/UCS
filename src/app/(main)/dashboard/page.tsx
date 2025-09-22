
import { CommodityPrices } from '@/components/commodity-prices';
import { getCommodityPrices } from '@/lib/data-service';

export default async function DashboardPage() {
  const initialData = await getCommodityPrices();
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <CommodityPrices initialData={initialData} />
    </div>
  );
}
