
'use server';

import { format } from 'date-fns';
import { n8nBusinessDayMiddleware, logN8NBusinessDayAction } from '@/lib/n8n-business-day-guard';

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
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('[N8N Trigger] Erro: A variável de ambiente N8N_WEBHOOK_URL não está configurada.');
    return { success: false, message: 'N8N webhook não configurado no servidor.' };
  }

  // Validação de dia útil usando o guard específico do N8N
  const payload = {
    origem: 'painel_auditoria',
    data_especifica: format(targetDate, 'yyyy-MM-dd'),
    ativos: {}
  };

  const guardResult = await n8nBusinessDayMiddleware(payload);
  console.log(guardResult.logMessage);

  if (!guardResult.proceed) {
    await logN8NBusinessDayAction('BLOCKED', targetDate, { 
      source: 'manual_reprocessing',
      reason: guardResult.response?.skipReason 
    });
    
    return { 
      success: false, 
      message: guardResult.response?.message || 'Reprocessamento não permitido em dias não úteis'
    };
  }

  await logN8NBusinessDayAction('ALLOWED', targetDate, { 
    source: 'manual_reprocessing' 
  });
  
  try {
    // Transforma a chave 'boi_gordo' para 'boi' para compatibilidade com o N8N
    const transformedAssets: Record<string, any> = {};
    for (const [key, value] of Object.entries(editedAssets)) {
        const newKey = key === 'boi_gordo' ? 'boi' : key;
        transformedAssets[newKey] = { preco: value };
    }

    // Monta o payload no formato esperado pelo N8N
    const payload = {
      origem: 'painel_auditoria',
      data_especifica: format(targetDate, 'yyyy-MM-dd'),
      ativos: transformedAssets,
    };
    
    console.log('[N8N Trigger] Enviando payload para:', webhookUrl);
    console.log('[N8N Trigger] Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Adicionando a chave de API no header para autenticação, como o código N8N espera
        'x-audit-token': process.env.N8N_API_KEY || ''
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[N8N Trigger] Resposta de erro do N8N (${response.status}):`, errorBody);
      throw new Error(`O N8N respondeu com o status ${response.status}. Verifique os logs do N8N.`);
    }
    
    const result = await response.json();
    console.log('[N8N Trigger] Resposta do N8N:', result);

    const successMessage = result.message || result.msg || 'Solicitação recebida pelo N8N.';
    
    return { 
      success: true, 
      message: `N8N recálculo disparado com sucesso: ${successMessage}` 
    };
  } catch (error: any) {
    console.error('[N8N Trigger] Erro ao disparar webhook:', error);
    return { 
      success: false, 
      message: `Erro de comunicação com o N8N: ${error.message}` 
    };
  }
}
