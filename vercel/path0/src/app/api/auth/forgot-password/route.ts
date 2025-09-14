// This file is no longer needed as the password reset flow
// is now handled by the client-side Firebase SDK (`sendPasswordResetEmail`).
// Kept for reference, but it's not actively used.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // This endpoint is deprecated. The client should call `sendPasswordResetEmail` directly.
  return NextResponse.json(
    { message: 'This functionality has been moved to the client-side Firebase SDK.' },
    { status: 200 }
  );
}
