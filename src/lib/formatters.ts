
/**
 * Formata um valor monetário ou numérico de acordo com a moeda e o tipo de ativo.
 * Esta é uma função utilitária síncrona segura para ser usada no cliente.
 */
export function formatCurrency(value: number, currency: string, assetId?: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '';

  const isExchangeRate = assetId === 'usd' || assetId === 'eur';
  const isBRL = currency === 'BRL';

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: isBRL ? 2 : (isExchangeRate ? 4 : 2),
    maximumFractionDigits: isBRL ? 2 : (isExchangeRate ? 4 : 2),
  };

  // Para USD e EUR, o padrão é exibir o código da moeda, não o símbolo.
  if (!isBRL) {
      options.currencyDisplay = 'code';
  }
  
  try {
    // Usa 'pt-BR' para BRL e 'en-US'/'de-DE' para consistência do símbolo/código.
    const locale = isBRL ? 'pt-BR' : (currency === 'USD' ? 'en-US' : 'de-DE');
    let formatted = new Intl.NumberFormat(locale, options).format(value);
    
    // Remove o código da moeda e adiciona o símbolo manualmente se não for BRL
    if (!isBRL) {
        formatted = formatted.replace(currency, '').trim();
        const symbol = currency === 'USD' ? 'US$' : '€';
        formatted = `${symbol} ${formatted}`;
    }
    
    return formatted;

  } catch (e) {
    // Fallback em caso de erro na API de internacionalização
    const fallbackOptions = { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
    };
    const fallbackFormatter = new Intl.NumberFormat('pt-BR', fallbackOptions);

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

    