// Script para corrigir a descrição do UCS ASE no Firestore
import { updateUCSASEDescription } from '../src/lib/data-service';

async function main() {
    try {
        console.log('🔄 Atualizando descrição do UCS ASE...');
        await updateUCSASEDescription();
        console.log('✅ Descrição do UCS ASE atualizada com sucesso!');
        console.log('📝 Nova descrição: "Índice principal de Unidade de Crédito de Sustentabilidade."');
    } catch (error) {
        console.error('❌ Erro ao atualizar descrição:', error);
    }
}

main();
