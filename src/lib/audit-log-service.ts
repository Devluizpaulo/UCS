
'use server';

import { getFirebaseAdmin } from './firebase-admin-config';
import { format, startOfDay, endOfDay } from 'date-fns';
import type { AuditLogEntry } from '@/components/admin/audit-history';
import { Timestamp } from 'firebase-admin/firestore';

const AUDIT_COLLECTION = 'audit_logs';

export interface CreateAuditLogParams {
  action: 'edit' | 'recalculate' | 'create' | 'delete';
  assetId: string;
  assetName: string;
  oldValue?: number;
  newValue?: number;
  user: string;
  details?: string;
  affectedAssets?: string[];
  targetDate: Date;
}

/**
 * Cria uma nova entrada no log de auditoria
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = await getFirebaseAdmin();
    
    const logEntry = {
      timestamp: Timestamp.now(),
      action: params.action,
      assetId: params.assetId,
      assetName: params.assetName,
      oldValue: params.oldValue,
      newValue: params.newValue,
      user: params.user,
      details: params.details,
      affectedAssets: params.affectedAssets || [],
      targetDate: format(params.targetDate, 'yyyy-MM-dd'),
      targetDateFormatted: format(params.targetDate, 'dd/MM/yyyy'),
    };

    await db.collection(AUDIT_COLLECTION).add(logEntry);
    
    return { success: true };
  } catch (error: any) {
    console.error('[AuditLog] Error creating audit log:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Busca logs de auditoria para uma data específica
 */
export async function getAuditLogsForDate(targetDate: Date): Promise<AuditLogEntry[]> {
  try {
    const { db } = await getFirebaseAdmin();
    
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    
    const snapshot = await db
      .collection(AUDIT_COLLECTION)
      .where('targetDate', '==', targetDateStr)
      .orderBy('timestamp', 'desc')
      .limit(100) // Limita a 100 entradas mais recentes
      .get();

    const logs: AuditLogEntry[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        timestamp: data.timestamp.toDate(),
        action: data.action,
        assetId: data.assetId,
        assetName: data.assetName,
        oldValue: data.oldValue,
        newValue: data.newValue,
        user: data.user,
        details: data.details,
        affectedAssets: data.affectedAssets || [],
      });
    });

    return logs;
  } catch (error: any) {
    console.error('[AuditLog] Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Busca logs de auditoria para um período
 */
export async function getAuditLogsForPeriod(startDate: Date, endDate: Date): Promise<AuditLogEntry[]> {
  try {
    const { db } = await getFirebaseAdmin();
    
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    const snapshot = await db
      .collection(AUDIT_COLLECTION)
      .where('targetDate', '>=', startDateStr)
      .where('targetDate', '<=', endDateStr)
      .orderBy('targetDate', 'desc')
      .orderBy('timestamp', 'desc')
      .limit(500) // Limita a 500 entradas
      .get();

    const logs: AuditLogEntry[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        timestamp: data.timestamp.toDate(),
        action: data.action,
        assetId: data.assetId,
        assetName: data.assetName,
        oldValue: data.oldValue,
        newValue: data.newValue,
        user: data.user,
        details: data.details,
        affectedAssets: data.affectedAssets || [],
      });
    });

    return logs;
  } catch (error: any) {
    console.error('[AuditLog] Error fetching audit logs for period:', error);
    return [];
  }
}

/**
 * Cria um log de recálculo com todos os ativos afetados
 */
export async function createRecalculationLog(
  targetDate: Date,
  editedAssets: Record<string, { name: string; oldValue: number; newValue: number }>,
  affectedAssets: string[],
  user: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = await getFirebaseAdmin();
    
    const batch = db.batch();
    const timestamp = Timestamp.now();
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    const targetDateFormatted = format(targetDate, 'dd/MM/yyyy');
    
    // Cria um log individual para cada ativo editado
    for (const [assetId, assetData] of Object.entries(editedAssets)) {
      const logRef = db.collection(AUDIT_COLLECTION).doc();
      const logEntry = {
        timestamp,
        action: 'edit' as const,
        assetId,
        assetName: assetData.name,
        oldValue: assetData.oldValue,
        newValue: assetData.newValue,
        user,
        details: `Valor alterado durante recálculo. ${affectedAssets.length} outros ativos foram afetados.`,
        affectedAssets: affectedAssets,
        targetDate: targetDateStr,
        targetDateFormatted: targetDateFormatted,
      };
      batch.set(logRef, logEntry);
    }
    
    await batch.commit();
    
    return { success: true };
  } catch (error: any) {
    console.error('[AuditLog] Error creating recalculation log:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Limpa logs antigos (mais de 90 dias)
 */
export async function cleanupOldAuditLogs(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const { db } = await getFirebaseAdmin();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoffDateStr = format(cutoffDate, 'yyyy-MM-dd');
    
    const snapshot = await db
      .collection(AUDIT_COLLECTION)
      .where('targetDate', '<', cutoffDateStr)
      .limit(1000) // Processa em lotes de 1000
      .get();

    if (snapshot.empty) {
      return { success: true, deletedCount: 0 };
    }

    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    
    return { success: true, deletedCount: snapshot.size };
  } catch (error: any) {
    console.error('[AuditLog] Error cleaning up old audit logs:', error);
    return { success: false, error: error.message };
  }
}
