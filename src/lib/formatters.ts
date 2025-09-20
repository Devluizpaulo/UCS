

/**
 * Formata um valor monetário ou numérico de acordo com a moeda e o tipo de ativo.
 * Esta é uma função utilitária síncrona segura para ser usada no cliente.
 */
export function formatCurrency(value: number, currency: string, assetId?: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '';

  // Todos os índices calculados (ucs, pdm, etc.) devem ser tratados como BRL.
  const isCalculatedIndex = ['ucs', 'agua', 'custo_agua', 'pdm'].includes(assetId || '');
  
  if (isCalculatedIndex) {
    currency = 'BRL';
  }

  // Regra especial para taxas de câmbio que precisam de mais precisão.
  const isExchangeRate = (currency === 'BRL' && value < 100);

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2, // Padrão de 2 casas decimais
    maximumFractionDigits: isExchangeRate ? 4 : 2, // Mais precisão para câmbio
  };

  let locale = 'pt-BR';
  if (currency === 'USD') locale = 'en-US';
  if (currency === 'EUR') locale = 'de-DE';
  
  try {
    const formatter = new Intl.NumberFormat(locale, options);
    // Para o UCS, que é um índice, removemos o símbolo da moeda se não for BRL
    if (assetId === 'ucs' && currency !== 'BRL') {
       return value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return formatter.format(value);

  } catch (e) {
    return `${value.toFixed(2)} ${currency}`;
  }
}
