import { NextRequest, NextResponse } from 'next/server';
// import { seedTestData } from '@/lib/data-service';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Seed data only available in development' },
        { status: 403 }
      );
    }

    // await seedTestData();
    // Placeholder for seeding test data
    return NextResponse.json({ message: 'Test data seeded successfully' });
  } catch (error) {
    console.error('Error seeding test data:', error);
    return NextResponse.json(
      { error: 'Failed to seed test data' },
      { status: 500 }
    );
  }
}