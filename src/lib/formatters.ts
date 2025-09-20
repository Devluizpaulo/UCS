
/**
 * Formata um valor monetário ou numérico de acordo com a moeda e o tipo de ativo.
 * Esta é uma função utilitária síncrona segura para ser usada no cliente.
 */
export function formatCurrency(value: number, currency: string, assetId?: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '';

  // Casos especiais para índices que precisam de mais precisão
  if (assetId === 'ucs') {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }
  
  if (['agua', 'custo_agua', 'pdm'].includes(assetId || '')) {
     return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const isExchangeRate = (currency === 'BRL' && value < 100);

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: isExchangeRate ? 2 : 2,
    maximumFractionDigits: isExchangeRate ? 4 : 2,
  };

  let locale = 'pt-BR';
  if (currency === 'USD') locale = 'en-US';
  if (currency === 'EUR') locale = 'de-DE';
  
  try {
    const formatter = new Intl.NumberFormat(locale, options);
    return formatter.format(value);

  } catch (e) {
    return `${value.toFixed(isExchangeRate ? 4 : 2)} ${currency}`;
  }
}
