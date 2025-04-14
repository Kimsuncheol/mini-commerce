'use client';

import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { PaymentButtonProps } from '@/types';
import { useCurrency } from '@/app/context/CurrencyContext';

interface PayPalButtonProps extends Omit<PaymentButtonProps, 'successUrl' | 'failUrl'> {
  onSuccess?: (orderData: Record<string, unknown>) => void;
}

function PayPalButton({
  amount,
  orderId,
  orderName,
  className = '',
  onSuccess = () => {},
}: PayPalButtonProps) {
  
  // Safe access to currency context with fallback
  let convertAmount = (amount: number) => amount;
  
  try {
    const currencyContext = useCurrency();
    convertAmount = currencyContext.convertAmount;
  } catch (error) {
    console.error("Error accessing currency context:", error);
  }

  // PayPal script options
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test", // Replace with your actual PayPal client ID in production
    currency: "USD",
    intent: "capture",
  };

  // Create order function for PayPal
  const createOrder = (_: unknown, actions: any) => {
    // Calculate the amount to be charged in the smallest currency unit (e.g., cents for USD)
    const convertedAmount = convertAmount(amount);
    
    return actions.order.create({
      purchase_units: [
        {
          reference_id: orderId,
          description: orderName,
          amount: {
            value: convertedAmount.toFixed(2),
            currency_code: "USD"
          }
        }
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING"
      }
    });
  };

  // Handle successful payment
  const onApprove = (_: unknown, actions: any) => {
    // Capture the funds from the transaction
    return actions.order.capture().then(function(orderData: Record<string, unknown>) {
      console.log("PayPal Order ID:", orderData.id);
      console.log("PayPal Payer:", orderData.payer);
      
      // Call the onSuccess callback with the order data
      onSuccess(orderData);
      
      // Additional actions like updating database, showing confirmation, etc.
      return orderData;
    });
  };

  return (
    <div className={className}>
      <PayPalScriptProvider options={paypalOptions}>
        <PayPalButtons
          style={{ layout: "vertical" }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={(err) => {
            console.error("PayPal Checkout Error:", err);
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}

export default PayPalButton; 