'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface PaymentResponse {
  paymentKey: string;
  orderId: string;
  amount: number;
  status: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (paymentKey && orderId && amount) {
      // In a real app, you would verify the payment with your backend
      // and update your database
      setPaymentData({
        paymentKey,
        orderId,
        amount: Number(amount),
        status: 'DONE',
      });
      // You could also store this in your database through an API call
      setLoading(false);
    } else if (orderId) {
      // Simple verification for demo purposes
      setPaymentData({
        paymentKey: 'demo-payment-key',
        orderId,
        amount: 0, // In a real app, you'd retrieve this from your backend
        status: 'DONE',
      });
      setLoading(false);
    } else {
      setError('Invalid payment information');
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-xl">Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2 text-gray-700">{error}</p>
          <Link href="/" className="block px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="p-8 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="mt-4 text-2xl font-bold text-center">Payment Successful!</h1>
        
        <div className="mt-6 space-y-2">
          <p className="text-gray-600">Order ID: <span className="font-semibold">{paymentData?.orderId}</span></p>
          {paymentData?.amount > 0 && (
            <p className="text-gray-600">Amount: <span className="font-semibold">${paymentData?.amount.toFixed(2)}</span></p>
          )}
          <p className="text-gray-600">Status: <span className="font-semibold text-green-600">{paymentData?.status}</span></p>
        </div>
        
        <div className="flex flex-col mt-8 space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Link href="/account?tab=orders" className="px-4 py-2 text-center text-white bg-blue-500 rounded hover:bg-blue-600">
            View Your Orders
          </Link>
          <Link href="/" className="px-4 py-2 text-center text-blue-500 border border-blue-500 rounded hover:bg-blue-50">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
