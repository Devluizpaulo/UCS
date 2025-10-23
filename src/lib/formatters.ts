

/**
 * Formata um valor monetário ou numérico de acordo com a moeda e o tipo de ativo.
 * Esta é uma função utilitária síncrona segura para ser usada no cliente.
 */
export function formatCurrency(value: number, currency: string, assetId?: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '';

  // Uma taxa de câmbio é quando o assetId é 'usd' ou 'eur', OU quando estamos formatando um valor em BRL
  // que representa a cotação de uma moeda estrangeira.
  const isExchangeRate = assetId === 'usd' || assetId === 'eur' || (currency === 'BRL' && (assetId === 'usd' || assetId === 'eur'));
  
  const minimumFractionDigits = isExchangeRate ? 4 : 2;
  const maximumFractionDigits = isExchangeRate ? 4 : 2;

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: minimumFractionDigits,
    maximumFractionDigits: maximumFractionDigits,
  };
  
  try {
    const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
    let formatted = new Intl.NumberFormat(locale, options).format(value);
    
    return formatted;

  } catch (e) {
    // Fallback em caso de erro na API de internacionalização
    console.error("Currency formatting error:", e);
    const fallbackOptions = { 
        minimumFractionDigits: isExchangeRate ? 4 : 2,
        maximumFractionDigits: isExchangeRate ? 4 : 2 
    };
    
    const fallbackLocale = currency === 'BRL' ? 'pt-BR' : 'en-US';
    const fallbackFormatter = new Intl.NumberFormat(fallbackLocale, fallbackOptions);

    return `${currency} ${fallbackFormatter.format(value)}`;
  }
}


/**
 * Formata um número como uma porcentagem.
 */
export function formatPercentage(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '0,00%';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

    