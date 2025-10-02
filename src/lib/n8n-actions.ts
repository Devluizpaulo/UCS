'use server';

import { format } from 'date-fns';

/**
 * Server Actions para integração com N8N
 */

/**
 * Dispara webhook do N8N para reprocessamento
 */
export async function triggerN8NRecalculation(
  targetDate: Date,
  editedAssets: Record<string, number>
): Promise<{ success: boolean; message: string }> {
  if (!process.env.N8N_WEBHOOK_URL) {
    return { success: false, message: 'N8N webhook não configurado' };
  }
  
  try {
    const webhookUrl = `${process.env.N8N_WEBHOOK_URL}/reprocessar-ucs`;
    const payload = {
      data_referencia: format(targetDate, 'yyyy-MM-dd'),
      ajustes_manuais: editedAssets,
      salvar_historico: true,
      origem: 'painel_auditoria'
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return { 
      success: true, 
      message: `N8N recálculo disparado com sucesso: ${result.mensagem || 'OK'}` 
    };
  } catch (error: any) {
    console.error('[N8N Trigger] Erro:', error);
    return { 
      success: false, 
      message: `Erro ao disparar N8N: ${error.message}` 
    };
  }
}
