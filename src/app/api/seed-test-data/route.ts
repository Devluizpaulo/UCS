
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json(
        { message: 'Esta API foi desativada.' },
        { status: 404 }
    );
}

export async function POST(request: NextRequest) {
    return NextResponse.json(
        { message: 'Esta API foi desativada.' },
        { status: 404 }
    );
}
