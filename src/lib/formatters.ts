
/**
 * Formata um valor monetário de acordo com a moeda.
 * Esta é uma função utilitária síncrona segura para ser usada no cliente.
 */
export function formatCurrency(value: number, currency: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '';
  
  const formatters: Record<string, Intl.NumberFormat> = {
    BRL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
  };

  const formatter = formatters[currency as keyof typeof formatters];
  return formatter ? formatter.format(value) : `${value.toFixed(2)} ${currency}`;
}
