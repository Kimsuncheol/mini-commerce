'use client';

import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { PaymentButtonProps } from '@/types';
import { useCurrency } from '@/app/context/CurrencyContext';

interface PayPalPayLaterButtonProps extends Omit<PaymentButtonProps, 'successUrl' | 'failUrl' | 'customerName'> {
  onSuccess?: (orderData: Record<string, unknown>) => void;
  customerName?: string;
}

function PayPalPayLaterButton({
  amount,
  orderId,
  orderName,
  customerName,
  className = '',
  onSuccess = () => {},
}: PayPalPayLaterButtonProps) {
  
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
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
    currency: "USD",
    intent: "capture",
    components: "buttons,payment-fields,marks,funding-eligibility"
  };

  // Create order function for PayPal
  const createOrder = (_: unknown, actions: Record<string, any>) => {
    // Calculate the amount to be charged
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
      // Enable Pay Later options
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            payment_method_selected: "PAYPAL",
            brand_name: customerName ? `${customerName}'s Purchase` : "ShopSmart",
            locale: "en-US",
            landing_page: "LOGIN",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW"
          }
        }
      },
      application_context: {
        shipping_preference: "NO_SHIPPING"
      }
    });
  };

  // Handle successful payment
  const onApprove = (_: unknown, actions: Record<string, any>) => {
    // Capture the funds from the transaction
    return actions.order.capture().then(function(orderData: Record<string, unknown>) {
      console.log("PayPal Pay Later Order ID:", orderData.id);
      
      // Call the onSuccess callback with the order data
      onSuccess(orderData);
      
      return orderData;
    });
  };

  return (
    <div className={className}>
      <PayPalScriptProvider options={paypalOptions}>
        <PayPalButtons
          style={{ 
            layout: "vertical",
            color: "blue",
            shape: "pill",
            label: "pay"
          }}
          fundingSource="paylater"
          createOrder={createOrder}
          onApprove={onApprove}
          onError={(err) => {
            console.error("PayPal Pay Later Error:", err);
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}

export default PayPalPayLaterButton; 