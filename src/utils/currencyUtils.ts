// src/utils/currencyUtils.ts
import { fetchExchangeRates } from '@/services/exchangeRateService'; // Import your exchange rate service

// Keep your existing type definitions and currency info
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'KRW' | 'CNY' | 'CAD' | 'AUD';

// Interface defining currency formatting options
export interface CurrencyInfo {
  symbol: string;
  position: 'before' | 'after';
  space: boolean;
  thousandSeparator: string;
  decimalSeparator: string;
  decimalPlaces: number;
}

// Define currency formatting rules for each supported currency
export const CURRENCY_INFO: Record<CurrencyCode, CurrencyInfo> = {
  USD: { 
    symbol: '$', 
    position: 'before', 
    space: false, 
    thousandSeparator: ',', 
    decimalSeparator: '.', 
    decimalPlaces: 2 
  },
  EUR: { 
    symbol: '€', 
    position: 'after', 
    space: true, 
    thousandSeparator: '.', 
    decimalSeparator: ',', 
    decimalPlaces: 2 
  },
  GBP: { 
    symbol: '£', 
    position: 'before', 
    space: false, 
    thousandSeparator: ',', 
    decimalSeparator: '.', 
    decimalPlaces: 2 
  },
  JPY: { 
    symbol: '¥', 
    position: 'before', 
    space: false, 
    thousandSeparator: ',', 
    decimalSeparator: '.', 
    decimalPlaces: 0  // JPY typically doesn't use decimals
  },
  KRW: { 
    symbol: '₩', 
    position: 'before', 
    space: false, 
    thousandSeparator: ',', 
    decimalSeparator: '.', 
    decimalPlaces: 0  // KRW typically doesn't use decimals
  },
  CNY: { 
    symbol: '¥', 
    position: 'before', 
    space: false, 
    thousandSeparator: ',', 
    decimalSeparator: '.', 
    decimalPlaces: 2 
  },
  CAD: { 
    symbol: 'CA$', 
    position: 'before', 
    space: false, 
    thousandSeparator: ',', 
    decimalSeparator: '.', 
    decimalPlaces: 2 
  },
  AUD: { 
    symbol: 'A$', 
    position: 'before', 
    space: false, 
    thousandSeparator: ',', 
    decimalSeparator: '.', 
    decimalPlaces: 2 
  }
};

/**
 * Gets the formatting information for a specific currency
 * @param currencyCode The currency code to get info for
 * @returns CurrencyInfo object containing formatting rules
 */
export const getCurrencyInfo = (currencyCode: CurrencyCode): CurrencyInfo => {
  return CURRENCY_INFO[currencyCode] || CURRENCY_INFO.USD;
};

/**
 * Formats a numeric amount according to the specified currency's rules
 * @param amount The numeric amount to format
 * @param currencyCode The currency code to use for formatting
 * @returns A formatted string with the proper currency symbol and formatting
 */
export const formatCurrencyAmount = (amount: number, currencyCode: CurrencyCode = 'USD'): string => {
  // Handle undefined, NaN or invalid values
  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0;
  }
  
  const info = getCurrencyInfo(currencyCode);
  
  // Format the number with proper decimal places
  let formattedNumber = amount.toFixed(info.decimalPlaces);
  
  // Add thousand separators if needed
  const parts = formattedNumber.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, info.thousandSeparator);
  formattedNumber = parts.join(info.decimalSeparator);
  
  // Add currency symbol in the right position
  if (info.position === 'before') {
    return `${info.symbol}${info.space ? ' ' : ''}${formattedNumber}`;
  } else {
    return `${formattedNumber}${info.space ? ' ' : ''}${info.symbol}`;
  }
};

/**
 * Convert an amount between currencies using exchange rates from the service
 * @param amount Amount to convert
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Promise that resolves to the converted amount
 */
export const convertCurrencyAmount = async (
  amount: number, 
  fromCurrency: CurrencyCode = 'USD', 
  toCurrency: CurrencyCode = 'USD'
): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  try {
    // Get the latest exchange rates from your service
    const rates = await fetchExchangeRates(fromCurrency);
    
    // If we have a direct conversion rate
    if (rates && rates[toCurrency]) {
      return amount * rates[toCurrency];
    }
    
    // If no direct rate is available
    console.warn(`No exchange rate found from ${fromCurrency} to ${toCurrency}`);
    return amount;  // Return original amount as fallback
  } catch (error) {
    console.error('Error converting currency:', error);
    return amount;  // Return original amount on error
  }
};

/**
 * Synchronous version for use when rates are already available
 * (Useful for components that don't want to deal with async/await)
 */
export const convertCurrencyWithRates = (
  amount: number,
  fromCurrency: CurrencyCode = 'USD',
  toCurrency: CurrencyCode = 'USD',
  rates?: Partial<Record<CurrencyCode, number>>
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  if (rates && rates[toCurrency]) {
    return amount * rates[toCurrency];
  }
  
  // Return original amount if no rates are available
  return amount;
};