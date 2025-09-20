
/**
 * Formata um valor monetário de acordo com a moeda.
 * Esta é uma função utilitária síncrona segura para ser usada no cliente.
 */
export function formatCurrency(value: number, currency: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '';

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
    // For BRL values that are exchange rates, we still want to show R$ prefix.
    const formatter = new Intl.NumberFormat(locale, { ...options, currency: currency });
    return formatter.format(value);

  } catch (e) {
    return `${value.toFixed(isExchangeRate ? 4 : 2)} ${currency}`;
  }
}
