
'use server';

import { format } from 'date-fns';
import { n8nBusinessDayMiddleware, logN8NBusinessDayAction } from '@/lib/n8n-business-day-guard';
import { createAuditLog } from '@/lib/audit-log-service';

/**
 * Server Actions para integração com N8N
 */

/**
 * Dispara webhook do N8N para reprocessamento
 */
export async function triggerN8NRecalculation(
  targetDate: Date,
  editedAssets: Record<string, number>,
  userName: string = 'Administrador'
): Promise<{ success: boolean; message: string }> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const editedAssetIds = Object.keys(editedAssets);

  const writeWebhookAudit = async (details: string) => {
    try {
      await createAuditLog({
        action: 'recalculate',
        assetId: 'n8n_webhook',
        assetName: 'Webhook N8N',
        user: userName,
        details,
        affectedAssets: editedAssetIds,
        targetDate,
      });
    } catch (error) {
      console.warn('[N8N Trigger] Falha ao gravar log de auditoria do webhook:', error);
    }
  };

  if (!webhookUrl) {
    console.error('[N8N Trigger] Erro: A variável de ambiente N8N_WEBHOOK_URL não está configurada.');
    await writeWebhookAudit('Falha antes do envio: variável N8N_WEBHOOK_URL não configurada.');
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
    await writeWebhookAudit(`Envio bloqueado por regra de dia útil: ${guardResult.response?.message || guardResult.response?.skipReason || 'dia não útil'}.`);
    
    return { 
      success: false, 
      message: guardResult.response?.message || 'Reprocessamento não permitido em dias não úteis'
    };
  }

  await logN8NBusinessDayAction('ALLOWED', targetDate, { 
    source: 'manual_reprocessing' 
  });

  const detailsEntries = Object.entries(editedAssets)
    .map(([id, val]) => `${id}: ${val}`)
    .join(', ');
  await writeWebhookAudit(`Tentativa de envio iniciada para ${editedAssetIds.length} ativo(s): ${detailsEntries}.`);
  
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

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `N8N recusou autenticacao (HTTP ${response.status}). Verifique N8N_API_KEY e credencial Header Auth no webhook.`
        );
      }

      throw new Error(`O N8N respondeu com o status ${response.status}. Verifique os logs do N8N.`);
    }
    
    const responseText = await response.text();
    let result: any = {};
    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.warn("[N8N Trigger] Falha ao parsear JSON, usando resposta bruta:", responseText);
        result = { message: responseText };
      }
    }
    
    console.log('[N8N Trigger] Resposta do N8N:', result);

    await writeWebhookAudit(`Webhook enviado com sucesso (HTTP ${response.status}). Resposta: ${result.message || result.msg || responseText || 'OK'}.`);

    const successMessage = result.message || result.msg || 'Solicitação recebida pelo N8N.';
    
    return { 
      success: true, 
      message: `N8N recálculo disparado com sucesso: ${successMessage}` 
    };
  } catch (error: any) {
    console.error('[N8N Trigger] Erro ao disparar webhook:', error);

    const message = String(error?.message || 'erro desconhecido');
    const isNetworkError = /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network/i.test(message);
    const finalMessage = isNetworkError
      ? `Falha de rede ao acessar o webhook N8N. Verifique N8N_WEBHOOK_URL, acesso da VM e firewall. Detalhe: ${message}`
      : message;

    await writeWebhookAudit(`Erro no envio do webhook: ${finalMessage}.`);

    return { 
      success: false, 
      message: `Erro de comunicação com o N8N: ${finalMessage}` 
    };
  }
}

/**
 * Dispara webhook do N8N com SNAPSHOT COMPLETO dos ativos base
 */
export async function triggerN8NRecalculationFull(
  targetDate: Date,
  allAssets: Record<string, number>
): Promise<{ success: boolean; message: string }> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return { success: false, message: 'N8N webhook não configurado no servidor.' };
  }

  const payloadBase = {
    origem: 'painel_auditoria',
    data_especifica: format(targetDate, 'yyyy-MM-dd'),
    ativos: {} as Record<string, { preco: number }>,
  };

  const transformed: Record<string, { preco: number }> = {};
  for (const [key, value] of Object.entries(allAssets)) {
    if (value == null || isNaN(Number(value))) continue;
    const newKey = key === 'boi_gordo' ? 'boi' : key;
    transformed[newKey] = { preco: Number(value) };
  }
  const payload = { ...payloadBase, ativos: transformed };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-audit-token': process.env.N8N_API_KEY || ''
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`N8N ${response.status}: ${errorBody}`);
    }
    const responseText = await response.text();
    let result: any = {};
    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { message: responseText };
      }
    }
    return { success: true, message: result?.message || result?.msg || responseText || 'Solicitação aceita pelo N8N' };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Falha ao comunicar com N8N' };
  }
}
