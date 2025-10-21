/**
 * Funções de debug para validar normalização de dados
 * Este arquivo contém funções utilitárias para debug que não são Server Actions
 */

/**
 * Converte strings formatadas brasileiras para números
 * Ex: "1.312.50" -> 1312.50, "172.983.64" -> 172983.64
 */
function parseBrazilianNumber(value: any): number {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remove pontos (separadores de milhares) e converte vírgula em ponto decimal
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}

/**
 * Normaliza dados de qualquer ativo que podem ter formatação brasileira
 * Lida com diferenças entre modelos Python e N8N
 */
function normalizeAssetData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const normalized = { ...data };
  
  // Campos numéricos principais que podem estar formatados
  const mainNumericFields = [
    'valor', 'ultimo', 'abertura', 'maxima', 'minima', 'fechamento_anterior',
    'valor_usd', 'valor_eur', 'resultado_final_brl', 'resultado_final_usd', 'resultado_final_eur',
    'ton', 'vol', 'volume', 'variacao_pct', 'rent_media'
  ];
  
  // Normalizar campos numéricos principais
  for (const field of mainNumericFields) {
    if (normalized[field] !== undefined && normalized[field] !== null) {
      normalized[field] = parseBrazilianNumber(normalized[field]);
    }
  }
  
  // Normalizar componentes (PDM, UCS, etc.)
  if (normalized.componentes && typeof normalized.componentes === 'object') {
    const normalizedComponents: { [key: string]: number } = {};
    for (const [key, value] of Object.entries(normalized.componentes)) {
      normalizedComponents[key] = parseBrazilianNumber(value);
    }
    normalized.componentes = normalizedComponents;
  }
  
  // Normalizar valores originais
  if (normalized.valores_originais && typeof normalized.valores_originais === 'object') {
    const normalizedOriginals: { [key: string]: number } = {};
    for (const [key, value] of Object.entries(normalized.valores_originais)) {
      normalizedOriginals[key] = parseBrazilianNumber(value);
    }
    normalized.valores_originais = normalizedOriginals;
  }
  
  // Normalizar conversões (UCS ASE)
  if (normalized.conversoes && typeof normalized.conversoes === 'object') {
    const normalizedConversions: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(normalized.conversoes)) {
      // Conversões podem ser strings ou números
      normalizedConversions[key] = parseBrazilianNumber(value);
    }
    normalized.conversoes = normalizedConversions;
  }
  
  return normalized;
}

/**
 * Função de debug para validar normalização de dados de qualquer ativo
 */
export function debugAssetData(rawData: any): { original: any, normalized: any, issues: string[] } {
  const issues: string[] = [];
  const normalized = normalizeAssetData(rawData);
  
  // Verificar campos numéricos principais
  const mainNumericFields = [
    'valor', 'ultimo', 'abertura', 'maxima', 'minima', 'fechamento_anterior',
    'valor_usd', 'valor_eur', 'resultado_final_brl', 'resultado_final_usd', 'resultado_final_eur',
    'ton', 'vol', 'volume', 'variacao_pct', 'rent_media'
  ];
  
  for (const field of mainNumericFields) {
    if (rawData[field] && typeof rawData[field] === 'string') {
      const originalVal = parseBrazilianNumber(rawData[field]);
      if (originalVal !== normalized[field]) {
        issues.push(`${field}: "${rawData[field]}" -> ${normalized[field]}`);
      }
    }
  }
  
  // Verificar componentes
  if (rawData.componentes) {
    for (const [key, value] of Object.entries(rawData.componentes)) {
      if (typeof value === 'string') {
        const originalVal = parseBrazilianNumber(value);
        if (originalVal !== normalized.componentes[key]) {
          issues.push(`Componente ${key}: "${value}" -> ${normalized.componentes[key]}`);
        }
      }
    }
  }
  
  // Verificar valores originais
  if (rawData.valores_originais) {
    for (const [key, value] of Object.entries(rawData.valores_originais)) {
      if (typeof value === 'string') {
        const originalVal = parseBrazilianNumber(value);
        if (originalVal !== normalized.valores_originais[key]) {
          issues.push(`Valor original ${key}: "${value}" -> ${normalized.valores_originais[key]}`);
        }
      }
    }
  }
  
  return {
    original: rawData,
    normalized: normalized,
    issues: issues
  };
}

/**
 * Função de debug específica para PDM (mantida para compatibilidade)
 */
export function debugPDMData(rawData: any): { original: any, normalized: any, issues: string[] } {
  return debugAssetData(rawData);
}

// Dados de exemplo para teste
export const samplePDMData = {
  "created_at": "2025-10-18 21:40:09.372954+00:00",
  "componentes": {
    "boi_gordo_35": 905.56,
    "carbono_100": 58.45,
    "custo_agua_100": "2.883.63",
    "madeira_100": 58.45,
    "milho_30": 1065.24,
    "soja_35": "1.243.30"
  },
  "timestamp": "2015-02-01 03:00:00.07:00:33.690000+00:00",
  "formula": "PDM = (Boi×35%) + (Milho×30%) + (Soja×35%) + Madeira + Carbono + Custo_Água",
  "data": "01/02/2015",
  "documentId": "2015-02-01 03:00:00.07:00:33.690000+00:00",
  "valor": "44.078.29",
  "status": "sucesso",
  "fonte": "Banco de dados - Cálculo UCS",
  "moeda": "BRL",
  "ativo": "PDM",
  "valores_originais": {
    "custo_agua": "2.883.63",
    "rent_boi_gordo": "2.587.32",
    "rent_carbono": 58.45,
    "rent_madeira": "37.922.11",
    "rent_milho": "3.550.80",
    "rent_soja": "3.552.30"
  },
  "bulk_import": true
};

export const sampleMilhoPythonData = {
  "abertura": 29.59,
  "ativo": "Milho Futuros",
  "bulk_import": true,
  "created_at": "2025-10-18 21:13:13.372954+00:00",
  "data": "01/02/2015",
  "documentid": "1 de fevereiro de 2015 às 00:00:00 UTC-3",
  "fonte": "banco de dados",
  "maxima": 29.59,
  "minima": 29.59,
  "moeda": "BRL",
  "status": "sucesso",
  "timestamp": "1 de fevereiro de 2015 às 00:00:00 UTC-3",
  "ton": 493.17,
  "ultimo": 29.59,
  "valores_originais": {
    "rent_media": "3.550.80",
    "variacao_pct": null,
    "vol": null
  }
};

/**
 * Função para testar a normalização de dados de todos os ativos
 */
export function testAllAssetsNormalization() {
  console.log('🧪 Testando normalização de dados de todos os ativos...\n');
  
  // Teste com dados PDM Python (formatados)
  console.log('📊 Testando dados PDM Python (formatados):');
  const pdmPythonResult = debugAssetData(samplePDMData);
  console.log('Problemas encontrados:', pdmPythonResult.issues);
  console.log('Valor normalizado:', pdmPythonResult.normalized.valor);
  console.log('Componentes normalizados:', pdmPythonResult.normalized.componentes);
  console.log('---\n');
  
  // Teste com dados Milho Python (formatados)
  console.log('📊 Testando dados Milho Python (formatados):');
  const milhoPythonResult = debugAssetData(sampleMilhoPythonData);
  console.log('Problemas encontrados:', milhoPythonResult.issues);
  console.log('Ultimo normalizado:', milhoPythonResult.normalized.ultimo);
  console.log('Rent media normalizada:', milhoPythonResult.normalized.valores_originais.rent_media);
  console.log('---\n');
  
  // Validação de conversões específicas
  console.log('✅ Validação de conversões:');
  console.log(`PDM: "44.078.29" -> ${pdmPythonResult.normalized.valor} (esperado: 44078290)`);
  console.log(`Milho: "3.550.80" -> ${milhoPythonResult.normalized.valores_originais.rent_media} (esperado: 3550.80)`);
  
  return {
    pdmPythonResult,
    milhoPythonResult,
    success: pdmPythonResult.normalized.valor === 44078290 && 
             milhoPythonResult.normalized.valores_originais.rent_media === 3550.80
  };
}

/**
 * Função para testar a normalização dos dados PDM (mantida para compatibilidade)
 */
export function testPDMDataNormalization() {
  return testAllAssetsNormalization();
}

