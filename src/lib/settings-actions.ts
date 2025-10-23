
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin-config';
import { revalidatePath } from 'next/cache';
import { SupportedLanguage, defaultTranslations } from '@/lib/i18n';

// --- TIPOS ---

export type LandingPageContent = {
  title: string;
  subtitle: string;
};

export type LandingPageSettings = Record<SupportedLanguage, LandingPageContent>;

const SETTINGS_COLLECTION = 'settings';
const LANDING_PAGE_DOC = 'landingPage';

// --- AÇÕES DO SERVIDOR ---

/**
 * Busca as configurações de conteúdo da página inicial do Firestore.
 * Se não encontrar, retorna os valores padrão do i18n.
 * @returns As configurações da página inicial para todos os idiomas.
 */
export async function getLandingPageSettings(): Promise<LandingPageSettings> {
  try {
    const { db } = await getFirebaseAdmin();
    const docRef = db.collection(SETTINGS_COLLECTION).doc(LANDING_PAGE_DOC);
    const doc = await docRef.get();

    if (doc.exists) {
      // Retorna os dados do Firestore se existirem
      return doc.data() as LandingPageSettings;
    } else {
      // Retorna os valores padrão se o documento não existir
      return defaultTranslations;
    }
  } catch (error) {
    console.error('[Settings] Erro ao buscar configurações da página inicial:', error);
    // Em caso de erro, retorna os valores padrão para evitar que a aplicação quebre
    return defaultTranslations;
  }
}

/**
 * Atualiza as configurações de conteúdo da página inicial no Firestore.
 * @param settings - O objeto contendo os novos títulos e subtítulos para todos os idiomas.
 */
export async function updateLandingPageSettings(settings: LandingPageSettings): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = await getFirebaseAdmin();
    const docRef = db.collection(SETTINGS_COLLECTION).doc(LANDING_PAGE_DOC);

    // Usa 'set' com 'merge: true' para criar o documento se não existir ou atualizar campos específicos
    await docRef.set(settings, { merge: true });

    // Revalida o cache da página inicial para que as alterações sejam refletidas imediatamente
    revalidatePath('/', 'page');

    console.log('[Settings] Configurações da página inicial atualizadas com sucesso.');
    return { success: true };
  } catch (error: any) {
    console.error('[Settings] Erro ao atualizar configurações da página inicial:', error);
    return { success: false, error: error.message };
  }
}
