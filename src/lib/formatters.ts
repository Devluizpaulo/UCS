

/**
 * Formata um valor monetário ou numérico de acordo com a moeda e o tipo de ativo.
 * Esta é uma função utilitária síncrona segura para ser usada no cliente.
 */
export function formatCurrency(value: number, currency: string, assetId?: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '';

  const isExchangeRate = assetId === 'usd' || assetId === 'eur';
  
  // No painel principal (hero), queremos sempre duas casas decimais para USD e EUR.
  // Em outros locais, taxas de câmbio podem ter 4.
  const minimumFractionDigits = isExchangeRate && assetId ? 2 : 2;
  const maximumFractionDigits = isExchangeRate && assetId ? 2 : 2;


  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: minimumFractionDigits,
    maximumFractionDigits: maximumFractionDigits,
  };
  
  try {
    // Usar 'pt-BR' para BRL, mas 'en-US'/'en-GB' para USD/EUR para garantir o símbolo correto ($/€) antes do número.
    const locale = currency === 'BRL' ? 'pt-BR' : currency === 'USD' ? 'en-US' : 'de-DE';
    let formatted = new Intl.NumberFormat(locale, options).format(value);
    
    return formatted;

  } catch (e) {
    // Fallback em caso de erro na API de internacionalização
    console.error("Currency formatting error:", e);
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

    