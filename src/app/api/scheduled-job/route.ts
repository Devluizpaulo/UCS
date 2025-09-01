
import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedCommodityPrices } from '@/lib/yahoo-finance-optimizer';
import { saveCommodityData } from '@/lib/database-service';
import { COMMODITY_TICKER_MAP } from '@/lib/yahoo-finance-config-data';

// This endpoint will be triggered by an external cron job service.
export async function GET(request: NextRequest) {
  // 1. Authenticate the request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Fetch data from the external API
  try {
    const commodityNames = Object.keys(COMMODITY_TICKER_MAP);
    console.log('[CRON JOB] Starting daily commodity price fetch...');
    console.log(`[CRON JOB] Fetching prices for: ${commodityNames.join(', ')}`);

    const prices = await getOptimizedCommodityPrices(commodityNames);

    if (!prices || prices.length === 0) {
      console.error('[CRON JOB] Failed to fetch any prices from the external API.');
      return NextResponse.json({ message: 'Failed to fetch prices' }, { status: 500 });
    }
    
    // 3. Save the data to Firestore
    console.log(`[CRON JOB] Fetched ${prices.length} prices. Saving to database...`);
    await saveCommodityData(prices);
    console.log('[CRON JOB] Successfully fetched and saved commodity prices.');

    return NextResponse.json({ message: 'Commodity prices updated successfully.' });

  } catch (error) {
    console.error('[CRON JOB] An unexpected error occurred:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

    