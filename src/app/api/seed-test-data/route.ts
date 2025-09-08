import { NextRequest, NextResponse } from 'next/server';
import { seedTestData, clearTestData } from '@/lib/seed-test-data';

export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json();
        
        if (action === 'seed') {
            const result = await seedTestData();
            return NextResponse.json(result);
        } else if (action === 'clear') {
            const result = await clearTestData();
            return NextResponse.json(result);
        } else {
            return NextResponse.json(
                { success: false, message: 'Ação inválida. Use "seed" ou "clear".' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Erro na API de seed:', error);
        return NextResponse.json(
            { success: false, message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'API de dados de teste',
        usage: {
            seed: 'POST /api/seed-test-data com { "action": "seed" }',
            clear: 'POST /api/seed-test-data com { "action": "clear" }'
        }
    });
}