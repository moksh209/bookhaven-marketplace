import React, { createContext, useContext, useState } from 'react';

const CurrencyContext = createContext();

// Conversion rate: 1 USD → INR (approximate, can be updated)
const USD_TO_INR = 84;

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(
    () => localStorage.getItem('bookhaven_currency') || 'INR'
  );

  const toggleCurrency = () => {
    const next = currency === 'INR' ? 'USD' : 'INR';
    setCurrency(next);
    localStorage.setItem('bookhaven_currency', next);
  };

  // Format any amount (stored internally as INR) to the selected currency
  const formatPrice = (amountINR) => {
    const num = Number(amountINR) || 0;
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num / USD_TO_INR);
    }
    // INR — use Indian number formatting
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatPrice, USD_TO_INR }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
