// This file is no longer needed as password reset is handled by the client-side Firebase SDK.
// Kept for reference or future server-side password management needs.
// For now, it will just return a success message.

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'Ação movida para o cliente.' });
}

export async function GET() {
  return NextResponse.json({ message: 'Ação movida para o cliente.' });
}
