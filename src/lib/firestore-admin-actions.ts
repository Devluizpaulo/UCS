
'use server';

import { getFirebaseAdmin } from './firebase-admin-config';
import { revalidatePath } from 'next/cache';

export interface DocumentData {
  id: string;
  [key: string]: any;
}

/**
 * Lista todas as coleções no banco de dados Firestore.
 */
export async function getCollections(): Promise<string[]> {
  try {
    const { db } = await getFirebaseAdmin();
    const collectionsSnapshot = await db.listCollections();
    const collectionIds = collectionsSnapshot.map(collection => collection.id);
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
export async function getDocuments(collectionId: string): Promise<DocumentData[]> {
  try {
    const { db } = await getFirebaseAdmin();
    const snapshot = await db.collection(collectionId).get();
    
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    const collectionRef = db.collection(collectionId);
    
    if (docId) {
      // Se um ID for fornecido, usa set() para criar com esse ID específico
      await collectionRef.doc(docId).set(data);
      revalidatePath('/dev');
      return { id: docId };
    } else {
      // Se nenhum ID for fornecido, usa add() para gerar um ID automático
      const docRef = await collectionRef.add(data);
      revalidatePath('/dev');
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
    await db.collection(collectionId).doc(docId).update(data);
    revalidatePath('/dev');
  } catch (error: any) {
    console.error(`Error updating document ${docId} in ${collectionId}:`, error);
    throw new Error(`Falha ao atualizar documento '${docId}'.`);
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
  } catch (error: any) {
    console.error(`Error deleting documents from ${collectionId}:`, error);
    throw new Error(`Falha ao excluir documentos.`);
  }
}
