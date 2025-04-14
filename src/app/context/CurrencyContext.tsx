'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  fetchExchangeRates, 
  Currency, 
  SUPPORTED_CURRENCIES,
  convertCurrency,
  formatCurrency
} from '@/services/exchangeRateService';

interface CurrencyContextType {
  currency: Currency;
  exchangeRates: Record<string, number>;
  supportedCurrencies: Currency[];
  setCurrency: (currency: Currency) => void;
  convertAmount: (amount: number, fromCurrency?: string) => number;
  formatAmount: (amount: number) => string;
  isLoading: boolean;
}

const defaultCurrency: Currency = SUPPORTED_CURRENCIES[0]; // USD as default

// Create a fallback context object to use when outside the provider
const fallbackContextValue: CurrencyContextType = {
  currency: defaultCurrency,
  exchangeRates: {},
  supportedCurrencies: SUPPORTED_CURRENCIES,
  setCurrency: () => {}, // No-op
  convertAmount: (amount) => amount, // Return original amount
  formatAmount: (amount) => `$${amount.toFixed(2)}`, // Basic USD formatting
  isLoading: false
};

const CurrencyContext = createContext<CurrencyContextType>(fallbackContextValue);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    // Try to get saved currency from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferred_currency');
      if (saved) {
        try {
          return JSON.parse(saved) as Currency;
        } catch (e) {
          return defaultCurrency;
        }
      }
    }
    return defaultCurrency;
  });
  
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Save selected currency to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_currency', JSON.stringify(currency));
    }
    
    // Fetch new exchange rates when currency changes
    const updateRates = async () => {
      setIsLoading(true);
      const rates = await fetchExchangeRates(currency.code);
      setExchangeRates(rates);
      setIsLoading(false);
    };
    
    updateRates();
    
    // Refresh exchange rates every hour
    const interval = setInterval(updateRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currency]);

  const convertAmount = (amount: number, fromCurrency = 'USD'): number => {
    return convertCurrency(amount, fromCurrency, currency.code, exchangeRates);
  };

  const formatAmount = (amount: number): string => {
    return formatCurrency(amount, currency.code);
  };

  const value = {
    currency,
    exchangeRates,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    setCurrency,
    convertAmount,
    formatAmount,
    isLoading
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = (): CurrencyContextType => {
  return useContext(CurrencyContext);
};
