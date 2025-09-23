
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
  
  try {
    // Para BRL, usa o formato pt-BR padrão que já inclui 'R$'
    if (currency === 'BRL') {
        return new Intl.NumberFormat('pt-BR', options).format(value);
    }

    // Para outras moedas, usa um formato que não inclui o símbolo da moeda por padrão,
    // permitindo controle manual do prefixo/sufixo se necessário.
    options.style = 'decimal';
    return new Intl.NumberFormat('pt-BR', options).format(value);

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
