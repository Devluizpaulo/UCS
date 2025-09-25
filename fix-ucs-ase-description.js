// Script temporário para corrigir a descrição do UCS ASE no Firestore
// Execute este script uma vez para corrigir os dados existentes

const { getFirebaseAdmin } = require('./src/lib/firebase-admin-config');

async function updateUCSASEDescription() {
    try {
        const { db } = await getFirebaseAdmin();
        const settingsDocRef = db.collection('settings').doc('commodities');
        
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(settingsDocRef);
            if (doc.exists) {
                const data = doc.data();
                if (data && data.ucs_ase) {
                    console.log('Descrição atual:', data.ucs_ase.description);
                    data.ucs_ase.description = 'Índice principal de Unidade de Crédito de Sustentabilidade.';
                    transaction.update(settingsDocRef, { ucs_ase: data.ucs_ase });
                    console.log('Descrição atualizada para:', data.ucs_ase.description);
                }
            }
        });

        console.log('✅ Descrição do UCS ASE atualizada com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao atualizar descrição:', error);
    }
}

updateUCSASEDescription();

