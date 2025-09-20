

/**
 * Formata um valor monetário ou numérico de acordo com a moeda e o tipo de ativo.
 * Esta é uma função utilitária síncrona segura para ser usada no cliente.
 */
export function formatCurrency(value: number, currency: string, assetId?: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '';

  const isCalculatedIndex = ['ucs', 'agua', 'custo_agua', 'pdm', 'ucs_ase'].includes(assetId || '');
  if (isCalculatedIndex) {
    currency = 'BRL';
  }

  const isExchangeRate = assetId === 'usd' || assetId === 'eur';
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: isExchangeRate ? 4 : 2,
    maximumFractionDigits: isExchangeRate ? 4 : 2,
  };

  try {
    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        ...options,
      }).format(value);
    }
    
    // For USD and EUR, return only the formatted number.
    // The currency symbol is handled by an icon in the UI.
    const locale = currency === 'USD' ? 'en-US' : 'de-DE';
    return new Intl.NumberFormat(locale, options).format(value);

  } catch (e) {
    return `${value.toFixed(2)}`;
  }
}
