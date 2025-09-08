'use server';

import { db } from './firebase-admin-config';
import admin from 'firebase-admin';

// Função para criar dados de teste na coleção cotacoes_do_dia
export async function seedTestData() {
    try {
        console.log('[SeedTestData] Iniciando criação de dados de teste...');
        
        const cotacoesDoDiaRef = db.collection('cotacoes_do_dia');
        const batch = db.batch();
        
        // Dados de teste para diferentes ativos
        const testData = [
            {
                ativo: 'USD/BRL - Dólar Americano Real Brasileiro',
                data: new Date().toLocaleDateString('pt-BR'),
                timestamp: admin.firestore.Timestamp.now(),
                abertura: 5.85,
                maxima: 5.92,
                minima: 5.83,
                ultimo: 5.89,
                fechamento: 5.89,
                volume: 1000000,
                fonte: 'test'
            },
            {
                ativo: 'EUR/BRL - Euro Real Brasileiro',
                data: new Date().toLocaleDateString('pt-BR'),
                timestamp: admin.firestore.Timestamp.now(),
                abertura: 6.45,
                maxima: 6.52,
                minima: 6.43,
                ultimo: 6.49,
                fechamento: 6.49,
                volume: 800000,
                fonte: 'test'
            },
            {
                ativo: 'Boi Gordo Futuros',
                data: new Date().toLocaleDateString('pt-BR'),
                timestamp: admin.firestore.Timestamp.now(),
                abertura: 285.50,
                maxima: 287.20,
                minima: 284.80,
                ultimo: 286.75,
                fechamento: 286.75,
                volume: 15000,
                fonte: 'test'
            },
            {
                ativo: 'Soja Futuros',
                data: new Date().toLocaleDateString('pt-BR'),
                timestamp: admin.firestore.Timestamp.now(),
                abertura: 1245.50,
                maxima: 1252.75,
                minima: 1242.25,
                ultimo: 1248.00,
                fechamento: 1248.00,
                volume: 25000,
                fonte: 'test'
            },
            {
                ativo: 'Milho Futuros',
                data: new Date().toLocaleDateString('pt-BR'),
                timestamp: admin.firestore.Timestamp.now(),
                abertura: 425.25,
                maxima: 428.50,
                minima: 423.75,
                ultimo: 426.80,
                fechamento: 426.80,
                volume: 18000,
                fonte: 'test'
            }
        ];
        
        // Adicionar documentos ao batch
        testData.forEach((data, index) => {
            const docRef = cotacoesDoDiaRef.doc(`test_${Date.now()}_${index}`);
            batch.set(docRef, data);
        });
        
        // Executar o batch
        await batch.commit();
        
        console.log(`[SeedTestData] ${testData.length} documentos de teste criados com sucesso!`);
        return { success: true, message: `${testData.length} documentos de teste criados!` };
        
    } catch (error) {
        console.error('[SeedTestData] Erro ao criar dados de teste:', error);
        return { success: false, message: 'Erro ao criar dados de teste' };
    }
}

// Função para limpar dados de teste
export async function clearTestData() {
    try {
        console.log('[SeedTestData] Limpando dados de teste...');
        
        const cotacoesDoDiaRef = db.collection('cotacoes_do_dia');
        const querySnapshot = await cotacoesDoDiaRef.where('fonte', '==', 'test').get();
        
        if (querySnapshot.empty) {
            return { success: true, message: 'Nenhum dado de teste encontrado para limpar.' };
        }
        
        const batch = db.batch();
        querySnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        console.log(`[SeedTestData] ${querySnapshot.docs.length} documentos de teste removidos!`);
        return { success: true, message: `${querySnapshot.docs.length} documentos de teste removidos!` };
        
    } catch (error) {
        console.error('[SeedTestData] Erro ao limpar dados de teste:', error);
        return { success: false, message: 'Erro ao limpar dados de teste' };
    }
}