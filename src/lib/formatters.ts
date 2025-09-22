
/**
 * Formata um valor monetário ou numérico de acordo com a moeda e o tipo de ativo.
 * Esta é uma função utilitária síncrona segura para ser usada no cliente.
 */
export function formatCurrency(value: number, currency: string, assetId?: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '';

  const isExchangeRate = assetId === 'usd' || assetId === 'eur';

  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: isExchangeRate ? 4 : 2,
    maximumFractionDigits: isExchangeRate ? 4 : 2,
  };

  try {
    const numberFormatter = new Intl.NumberFormat('pt-BR', options);
    const numericValue = numberFormatter.format(value);

    switch(assetId) {
        case 'usd':
            return `$ ${numericValue}`;
        case 'eur':
            // O ícone do Euro é tratado na UI, então só retornamos o valor
            return numericValue; 
        case 'soja':
        case 'madeira':
             return `$ ${numericValue}`; // Soja e Madeira são em USD
        default:
            return `R$ ${numericValue}`; // O padrão é BRL
    }

  } catch (e) {
    console.error("Error formatting currency:", e);
    return `${value.toFixed(2)} ${currency}`;
  }
}
