

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
  const isExchangeRate = assetId === 'usd' || assetId === 'eur';

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: isExchangeRate ? 4 : 2,
    maximumFractionDigits: isExchangeRate ? 4 : 2,
  };

  let locale = 'pt-BR';
  if (currency === 'USD') locale = 'en-US';
  if (currency === 'EUR') locale = 'de-DE';
  
  try {
    const formatter = new Intl.NumberFormat(locale, options);
    return formatter.format(value);

  } catch (e) {
    return `${value.toFixed(2)} ${currency}`;
  }
}
