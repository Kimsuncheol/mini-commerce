'use client';

import React, { useEffect, useState } from 'react';
import { loadPaymentWidget } from '@tosspayments/payment-widget-sdk';
import { PaymentButtonProps } from '@/types';
import { useCurrency } from '@/app/context/CurrencyContext';

function PaymentButton({
  amount,
  orderId,
  orderName,
  customerName,
  successUrl = `${window.location.origin}/success`,
  failUrl = `${window.location.origin}/fail`,
  className = '',
}: PaymentButtonProps) {
  const [paymentWidget, setPaymentWidget] = useState<any>(null);
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
  
  // Safe access to currency context with fallback
  const defaultCurrency = { code: 'USD', symbol: '$', name: 'US Dollar' };
  const defaultConvertAmount = (amt: number) => amt;
  
  let currency = defaultCurrency;
  let convertAmount = defaultConvertAmount;
  
  try {
    const currencyContext = useCurrency();
    currency = currencyContext.currency;
    convertAmount = currencyContext.convertAmount;
  } catch (error) {
    console.error("Error accessing currency context:", error);
  }
  
  // Convert amount to the selected currency
  const convertedAmount = currency.code === 'KRW' 
    ? Math.round(convertAmount(amount)) 
    : convertAmount(amount);

  // For Toss Payments, we need to convert to KRW before processing payment
  const paymentAmount = currency.code === 'KRW' 
    ? convertedAmount 
    : Math.round(convertAmount(amount, currency.code));

  useEffect(() => {
    // Load payment widget
    const fetchPaymentWidget = async () => {
      const widget = await loadPaymentWidget(clientKey, customerName);
      setPaymentWidget(widget);
    };

    fetchPaymentWidget();
  }, [clientKey, customerName]);

  const handlePayment = async () => {
    try {
      if (!paymentWidget) return;
      
      // Always use KRW for the actual payment processing
      await paymentWidget.renderPaymentMethods('#payment-widget', { amount: paymentAmount });
      
      // Open payment widget
      await paymentWidget.requestPayment({
        orderId,
        orderName,
        customerName,
        customerEmail: '', // Optional: Add if needed
        successUrl,
        failUrl,
      });
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  return (
    <>
      <div id="payment-widget" style={{ display: 'none' }} />
      <button
        onClick={handlePayment}
        className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium 
                   hover:bg-blue-700 transition-colors duration-200 shadow-md 
                   flex items-center justify-center gap-2 ${className}`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          fill="currentColor" 
          viewBox="0 0 16 16"
        >
          <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9a1.5 1.5 0 0 1 1.432-1.499L12.136.326zM5.562 3H13V1.78a.5.5 0 0 0-.621-.484L5.562 3zM1.5 4a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-13z"/>
        </svg>
        결제하기 {currency.symbol}{convertedAmount.toLocaleString()}
      </button>
    </>
  );
}

export default PaymentButton;