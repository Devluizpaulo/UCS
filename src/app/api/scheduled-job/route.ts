
import { NextRequest, NextResponse } from 'next/server';
import { fetchAndSavePricesFlow } from '@/ai/flows/fetch-and-save-prices-flow';

// This endpoint will be triggered by an external cron job service.
export async function GET(request: NextRequest) {
  // 1. Authenticate the request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Run the Genkit flow to fetch and save data for ALL assets.
  try {
    const result = await fetchAndSavePricesFlow({}); // Empty input means all assets
    
    if (result.success) {
        return NextResponse.json({ message: result.message, savedCount: result.savedCount });
    } else {
        return NextResponse.json({ message: result.message }, { status: 500 });
    }

  } catch (error) {
    console.error('[CRON JOB] An unexpected error occurred while running the flow:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
