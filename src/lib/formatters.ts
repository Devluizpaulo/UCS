

/**
 * Formata um valor monetário ou numérico de acordo com a moeda e o tipo de ativo.
 * Esta é uma função utilitária síncrona segura para ser usada no cliente.
 */
export function formatCurrency(value: number, currency: string, assetId?: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '';

  // Todos os índices calculados (ucs, pdm, etc.) devem ser tratados como BRL.
  const isCalculatedIndex = ['ucs', 'agua', 'custo_agua', 'pdm', 'ucs_ase'].includes(assetId || '');
  
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
  if (currency === 'EUR') locale = 'de-DE'; // Use a locale that formats EUR correctly, like German.
  
  try {
    const formatter = new Intl.NumberFormat(locale, options);
    let formatted = formatter.format(value);
    
    // The issue is that some locales add the currency symbol. 
    // `Intl.NumberFormat` with `style: 'currency'` already adds the symbol.
    // The icon is handled separately. So we should just format the number.
    // Let's change the approach to format as a number and prepend the symbol manually where needed.
    
    const numberFormatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: isExchangeRate ? 4 : 2,
        maximumFractionDigits: isExchangeRate ? 4 : 2,
    });
    
    const numericValue = numberFormatter.format(value);

    switch(currency) {
        case 'BRL':
            return `R$ ${numericValue}`;
        case 'USD':
            return `$ ${numericValue}`;
        case 'EUR':
             // The icon is already showing, so just return the number.
             // The de-DE locale for Euro formats as "27,34 €". We strip the symbol.
            return new Intl.NumberFormat('de-DE', {
                minimumFractionDigits: isExchangeRate ? 4 : 2,
                maximumFractionDigits: isExchangeRate ? 4 : 2,
            }).format(value);
        default:
            return `${numericValue} ${currency}`;
    }

  } catch (e) {
    return `${value.toFixed(2)} ${currency}`;
  }
}
