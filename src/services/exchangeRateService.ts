// Service to fetch and handle currency exchange rates

// You can use a free API like ExchangeRate-API or Open Exchange Rates
// Example using ExchangeRate-API (free tier)
const API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY || '';
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'KRW', name: 'Korean Won', symbol: '₩' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
];

export interface ExchangeRateResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

export const fetchExchangeRates = async (baseCurrency: string = 'USD'): Promise<Record<string, number>> => {
  try {
    if (!API_KEY) {
      console.warn('Exchange rate API key not found, using mock data');
      // Return mock exchange rates when API key is not available
      return getMockExchangeRates(baseCurrency);
    }
    
    const response = await fetch(`${BASE_URL}/${API_KEY}/latest/${baseCurrency}`);
    const data: ExchangeRateResponse = await response.json();
    
    if (data.result !== 'success') {
      throw new Error('Failed to fetch exchange rates');
    }
    
    return data.conversion_rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Fallback to mock data in case of error
    return getMockExchangeRates(baseCurrency);
  }
};

// Mock exchange rates for development or when API is unavailable
const getMockExchangeRates = (baseCurrency: string): Record<string, number> => {
  const mockRates: Record<string, Record<string, number>> = {
    'USD': {
      'USD': 1,
      'KRW': 1362.81,
      'EUR': 0.93,
      'JPY': 154.27,
      'GBP': 0.8,
      'CNY': 7.24
    },
    'KRW': {
      'USD': 0.00073,
      'KRW': 1,
      'EUR': 0.00068,
      'JPY': 0.11,
      'GBP': 0.00059,
      'CNY': 0.0053
    },
    'EUR': {
      'USD': 1.08,
      'KRW': 1471.5,
      'EUR': 1,
      'JPY': 166.6,
      'GBP': 0.86,
      'CNY': 7.82
    }
  };
  
  // Return mock rates for the requested base currency, or USD as fallback
  return mockRates[baseCurrency] || mockRates['USD'];
};

// Convert price from one currency to another
export const convertCurrency = (
  amount: number, 
  fromCurrency: string, 
  toCurrency: string,
  rates: Record<string, number>
): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // If direct conversion rate is available
  if (rates[toCurrency]) {
    return amount * rates[toCurrency];
  }
  
  console.error('Conversion rate not available');
  return amount;
};

// Format currency according to locale
export const formatCurrency = (amount: number, currencyCode: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};
