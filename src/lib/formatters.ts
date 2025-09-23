
/**
 * Formata um valor monetário ou numérico de acordo com a moeda e o tipo de ativo.
 * Esta é uma função utilitária síncrona segura para ser usada no cliente.
 */
export function formatCurrency(value: number, currency: string, assetId?: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '';

  const isExchangeRate = assetId === 'usd' || assetId === 'eur';

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: isExchangeRate ? 4 : 2,
    maximumFractionDigits: isExchangeRate ? 4 : 2,
  };

  // Para moedas que não são BRL, não queremos o símbolo padrão (ex: US$ para USD)
  // mas sim um formato mais limpo.
  if (currency !== 'BRL') {
    options.style = 'decimal';
  }


  try {
    const numberFormatter = new Intl.NumberFormat('pt-BR', options);
    return numberFormatter.format(value);

  } catch (e) {
    console.error("Error formatting currency:", e);
    
    const fallbackOptions = { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
    };
    const fallbackFormatter = new Intl.NumberFormat('pt-BR', fallbackOptions);

    return `${currency} ${fallbackFormatter.format(value)}`;
  }
}
