

/**
 * Formata um valor monetário ou numérico de acordo com a moeda e o tipo de ativo.
 * Esta é uma função utilitária síncrona segura para ser usada no cliente.
 */
export function formatCurrency(value: number, currency: string, assetId?: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '';

  const isExchangeRate = assetId === 'usd' || assetId === 'eur';
  
  // Para USD e EUR (taxas de câmbio), usar formato americano com 4 casas decimais
  // Para outros ativos, usar 2 casas decimais
  const minimumFractionDigits = isExchangeRate ? 4 : 2;
  const maximumFractionDigits = isExchangeRate ? 4 : 2;


  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: minimumFractionDigits,
    maximumFractionDigits: maximumFractionDigits,
  };
  
  try {
    // Para USD e EUR, usar formato americano (ponto como decimal)
    // Para BRL, usar formato brasileiro (vírgula como decimal)
    const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
    let formatted = new Intl.NumberFormat(locale, options).format(value);
    
    // Debug: log para verificar formatação
    if (isExchangeRate) {
      console.log(`🔍 Formatting ${assetId}: ${value} -> ${formatted} (locale: ${locale}, currency: ${currency})`);
    }
    
    return formatted;

  } catch (e) {
    // Fallback em caso de erro na API de internacionalização
    console.error("Currency formatting error:", e);
    const fallbackOptions = { 
        minimumFractionDigits: isExchangeRate ? 4 : 2,
        maximumFractionDigits: isExchangeRate ? 4 : 2 
    };
    
    // Para fallback, usar formato americano para USD/EUR
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

    