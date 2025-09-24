

/**
 * Formata um valor monetário ou numérico de acordo com a moeda e o tipo de ativo.
 * Esta é uma função utilitária síncrona segura para ser usada no cliente.
 */
export function formatCurrency(value: number, currency: string, assetId?: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '';

  const isExchangeRate = assetId === 'usd' || assetId === 'eur';
  const isIndex = assetId === 'ucs_ase';
  const isSpecialIndex = assetId === 'ch2o_agua' || assetId === 'custo_agua';


  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: isIndex || isSpecialIndex ? 0 : (isExchangeRate ? 4 : 2),
    maximumFractionDigits: isIndex || isSpecialIndex ? 0 : (isExchangeRate ? 4 : 2),
  };
  
  if (isSpecialIndex) {
      return new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
      }).format(value);
  }
  
  try {
    // Usa 'pt-BR' para todas as moedas para garantir o formato R$ 1.234,56
    return new Intl.NumberFormat('pt-BR', options).format(value);

  } catch (e) {
    console.error("Error formatting currency:", e);
    
    // Fallback em caso de erro na API de internacionalização
    const fallbackOptions = { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
    };
    const fallbackFormatter = new Intl.NumberFormat('pt-BR', fallbackOptions);

    return `${currency} ${fallbackFormatter.format(value)}`;
  }
}
