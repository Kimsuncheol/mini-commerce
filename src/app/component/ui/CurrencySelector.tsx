'use client';

import React, { useState } from 'react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { Currency, SUPPORTED_CURRENCIES } from '@/services/exchangeRateService';

export default function CurrencySelector() {
  // Provide fallbacks in case the context isn't available
  const defaultCurrency = SUPPORTED_CURRENCIES[0];
  let currency = defaultCurrency;
  let supportedCurrencies = SUPPORTED_CURRENCIES;
  let setCurrency = (c: Currency) => {};
  let isLoading = false;
  
  try {
    const currencyContext = useCurrency();
    currency = currencyContext.currency;
    supportedCurrencies = currencyContext.supportedCurrencies;
    setCurrency = currencyContext.setCurrency;
    isLoading = currencyContext.isLoading;
  } catch (error) {
    console.error("Error accessing currency context:", error);
  }
  
  const [isOpen, setIsOpen] = useState(false);

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex justify-center w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          id="currency-menu"
          aria-expanded="true"
          aria-haspopup="true"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : (
            <>
              <span className="mr-1">{currency.symbol}</span>
              <span>{currency.code}</span>
              <svg className="w-5 h-5 ml-2 -mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute right-0 z-10 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="currency-menu"
        >
          <div className="py-1" role="none">
            {supportedCurrencies.map((curr) => (
              <button
                key={curr.code}
                className={`block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 ${
                  currency.code === curr.code ? 'bg-gray-100' : ''
                }`}
                role="menuitem"
                onClick={() => handleCurrencyChange(curr)}
              >
                <span className="mr-2">{curr.symbol}</span>
                {curr.name} ({curr.code})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
