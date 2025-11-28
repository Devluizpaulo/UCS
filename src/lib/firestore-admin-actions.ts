
'use server';

import { getFirebaseAdmin } from './firebase-admin-config';
import { revalidatePath } from 'next/cache';
import { getCollectionSchema, validateAgainstSchema } from './firestore-admin-schema';

/**
 * Busca documentos com múltiplas ordenações/filtros e paginação por cursor
 */
export async function getDocumentsPaged(
  collectionId: string,
  options: GetDocumentsPagedOptions = {}
): Promise<PagedDocumentsResult> {
  const { db } = await getFirebaseAdmin();
  try {
    let query: any = db.collection(collectionId);
    if (options.wheres && options.wheres.length) {
      for (const w of options.wheres) {
        query = query.where(w.field, '==', w.value);
      }
    }
    const orderBys = options.orderBys && options.orderBys.length ? options.orderBys : undefined;
    if (orderBys) {
      for (const ob of orderBys) {
        query = query.orderBy(ob.field, ob.direction || 'asc');
      }
    }
    if (options.startAfterValues && orderBys && options.startAfterValues.length === orderBys.length) {
      query = query.startAfter(...options.startAfterValues);
    }
    if (options.limit && options.limit > 0) {
      query = query.limit(options.limit);
    }
    const snapshot = await query.get();
    const docs: DocumentData[] = snapshot.docs.map((doc: any) => ({ id: doc.id, ...serializeFirestoreData(doc.data()) }));
    let nextCursor: any[] | undefined;
    if (docs.length && orderBys) {
      const last = snapshot.docs[snapshot.docs.length - 1];
      nextCursor = orderBys.map(ob => (last.get ? last.get(ob.field) : (last.data() || {})[ob.field]));
    }
    await createGenericAuditLog({ action: 'read', collectionId, user: 'dev@local' });
    return { docs, nextCursor };
  } catch (e: any) {
    console.error('[getDocumentsPaged] error:', e);
    throw new Error('Falha ao buscar documentos paginados.');
  }
}

/**
 * Busca logs de auditoria de DEV para um documento específico
 */
export async function getDevAuditLogsForDocument(
  collectionId: string,
  docId: string,
  limit: number = 50
): Promise<Array<{ id: string; timestamp: number; action: string; collectionId: string; docId: string; changes?: any; user?: string }>> {
  const { db } = await getFirebaseAdmin();
  try {
    const snapshot = await db
      .collection('audit_logs')
      .where('scope', '==', 'firestore_admin_dev')
      .where('collectionId', '==', collectionId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const results: Array<{ id: string; timestamp: number; action: string; collectionId: string; docId: string; changes?: any; user?: string }> = [];

    snapshot.forEach((doc: any) => {
      const data = doc.data() as any;
      // alguns deletes podem ter docId com múltiplos IDs separados por vírgula
      const docIds = String(data.docId || '').split(',');
      if (docIds.includes(docId)) {
        results.push({ id: doc.id, ...data });
      }
    });

    return results;
  } catch (e: any) {
    console.error('[dev-audit] erro ao buscar logs:', e);
    return [];
  }
}

async function createGenericAuditLog(entry: {
  action: 'create' | 'edit' | 'delete' | 'read';
  collectionId: string;
  docId?: string;
  changes?: any;
  user?: string;
}) {
  try {
    const { db } = await getFirebaseAdmin();
    const ts = new Date();
    const payload = {
      ...entry,
      scope: 'firestore_admin_dev',
      timestamp: ts.getTime(),
    };
    await db.collection('audit_logs').add(payload);
  } catch (e) {
    // silencioso em dev
    console.warn('[firestore-admin] audit log falhou:', e);
  }
}

// Converte objetos do Firestore (Timestamp, Date, etc.) em tipos serializáveis
function serializeFirestoreData(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  // Firestore Timestamp-like (tem toDate)
  if (data && typeof (data as any).toDate === 'function') {
    try {
      return (data as any).toDate().getTime();
    } catch {
      // fallback
      return String(data);
    }
  }
  // Date
  if (data instanceof Date) {
    return data.getTime();
  }
  // Array
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }
  // Objeto simples
  const out: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      out[key] = serializeFirestoreData((data as any)[key]);
    }
  }
  return out;
}

export interface DocumentData {
  id: string;
  [key: string]: any;
}

export interface GetDocumentsOptions {
  limit?: number;
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  whereEq?: { field: string; value: any };
}

export type OrderByEntry = { field: string; direction: 'asc' | 'desc' };
export type WhereEqEntry = { field: string; value: any };

export interface GetDocumentsPagedOptions {
  limit?: number;
  orderBys?: OrderByEntry[];
  wheres?: WhereEqEntry[];
  startAfterValues?: any[]; // values matching orderBys order
}

export interface PagedDocumentsResult {
  docs: DocumentData[];
  nextCursor?: any[]; // last doc values in orderBys order
}

/**
 * Lista todas as coleções no banco de dados Firestore.
 */
export async function getCollections(): Promise<string[]> {
  try {
    const { db } = await getFirebaseAdmin();
    const collectionsSnapshot = await db.listCollections();
    const collectionIds = collectionsSnapshot.map(collection => collection.id);
    // audit simples
    await createGenericAuditLog({ action: 'read', collectionId: '*', user: 'dev@local' });
    return collectionIds.sort();
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    throw new Error('Falha ao buscar coleções do Firestore.');
  }
}

/**
 * Busca todos os documentos de uma coleção específica.
 * @param collectionId O ID da coleção.
 */
export async function getDocuments(collectionId: string, options: GetDocumentsOptions = {}): Promise<DocumentData[]> {
  try {
    const { db } = await getFirebaseAdmin();
    let query: any = db.collection(collectionId);
    if (options.whereEq && options.whereEq.field) {
      query = query.where(options.whereEq.field, '==', options.whereEq.value);
    }
    if (options.orderBy && options.orderBy.field) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'asc');
    }
    if (options.limit && options.limit > 0) {
      query = query.limit(options.limit);
    }
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return [];
    }
    
    const docs = snapshot.docs.map((doc: any) => {
      const raw = doc.data();
      const serialized = serializeFirestoreData(raw);
      return { id: doc.id, ...serialized } as DocumentData;
    });
    await createGenericAuditLog({ action: 'read', collectionId, user: 'dev@local' });
    return docs;
  } catch (error: any) {
    console.error(`Error fetching documents from ${collectionId}:`, error);
    throw new Error(`Falha ao buscar documentos da coleção '${collectionId}'.`);
  }
}

/**
 * Cria um novo documento em uma coleção.
 * @param collectionId O ID da coleção.
 * @param data Os dados para o novo documento.
 * @param docId (Opcional) O ID a ser usado para o novo documento.
 */
export async function createDocument(
  collectionId: string, 
  data: Record<string, any>, 
  docId?: string
): Promise<{ id: string }> {
  try {
    const { db } = await getFirebaseAdmin();
    // validação contra schema, se existir
    const schema = getCollectionSchema(collectionId);
    if (schema) {
      const result = validateAgainstSchema(schema, data);
      if (!result.valid) {
        throw new Error('Validação falhou: ' + result.errors.join('; '));
      }
    }
    const collectionRef = db.collection(collectionId);
    
    if (docId) {
      // Se um ID for fornecido, usa set() para criar com esse ID específico
      await collectionRef.doc(docId).set(data);
      revalidatePath('/dev');
      await createGenericAuditLog({ action: 'create', collectionId, docId, changes: data, user: 'dev@local' });
      return { id: docId };
    } else {
      // Se nenhum ID for fornecido, usa add() para gerar um ID automático
      const docRef = await collectionRef.add(data);
      revalidatePath('/dev');
      await createGenericAuditLog({ action: 'create', collectionId, docId: docRef.id, changes: data, user: 'dev@local' });
      return { id: docRef.id };
    }
  } catch (error: any) {
    console.error(`Error creating document in ${collectionId}:`, error);
    throw new Error(`Falha ao criar documento na coleção '${collectionId}'.`);
  }
}

/**
 * Atualiza um documento existente.
 * @param collectionId O ID da coleção.
 * @param docId O ID do documento.
 * @param data Os dados a serem atualizados.
 */
export async function updateDocument(
  collectionId: string, 
  docId: string, 
  data: Record<string, any>
): Promise<void> {
  try {
    const { db } = await getFirebaseAdmin();
    // validação contra schema, se existir (parcial: apenas campos enviados)
    const schema = getCollectionSchema(collectionId);
    if (schema) {
      const result = validateAgainstSchema(schema, data, { partial: true });
      if (!result.valid) {
        throw new Error('Validação falhou: ' + result.errors.join('; '));
      }
    }
    const docRef = db.collection(collectionId).doc(docId);
    const beforeSnap = await docRef.get();
    const beforeData = beforeSnap.exists ? beforeSnap.data() || {} : {};
    await docRef.update(data);
    revalidatePath('/dev');
    // calcula diffs básicos
    const diff: Record<string, { before: any; after: any }> = {};
    for (const k of Object.keys(data)) {
      diff[k] = { before: serializeFirestoreData((beforeData as any)[k]), after: serializeFirestoreData((data as any)[k]) };
    }
    await createGenericAuditLog({ action: 'edit', collectionId, docId, changes: { diff }, user: 'dev@local' });
  } catch (error: any) {
    console.error(`Error updating document ${docId} in ${collectionId}:`, error);
    throw new Error(`Falha ao atualizar documento '${docId}'.`);
  }
}

/**
 * Reverte campos de um documento para valores anteriores
 */
export async function revertDocumentFields(
  collectionId: string,
  docId: string,
  beforeValues: Record<string, any>
): Promise<void> {
  try {
    const { db } = await getFirebaseAdmin();
    const docRef = db.collection(collectionId).doc(docId);
    await docRef.update(beforeValues);
    revalidatePath('/dev');
    await createGenericAuditLog({ action: 'edit', collectionId, docId, changes: { reverted: beforeValues }, user: 'dev@local' });
  } catch (e: any) {
    console.error('[revert] erro ao reverter campos:', e);
    throw new Error('Falha ao reverter campos do documento.');
  }
}

/**
 * Exclui um ou mais documentos de uma coleção.
 * @param collectionId O ID da coleção.
 * @param docIds Um array de IDs de documentos a serem excluídos.
 */
export async function deleteDocuments(collectionId: string, docIds: string[]): Promise<void> {
  try {
    const { db } = await getFirebaseAdmin();
    const batch = db.batch();
    
    docIds.forEach(docId => {
      const docRef = db.collection(collectionId).doc(docId);
      batch.delete(docRef);
    });
    
    await batch.commit();
    revalidatePath('/dev');
    await createGenericAuditLog({ action: 'delete', collectionId, docId: docIds.join(','), changes: { ids: docIds }, user: 'dev@local' });
  } catch (error: any) {
    console.error(`Error deleting documents from ${collectionId}:`, error);
    throw new Error(`Falha ao excluir documentos.`);
  }
}
