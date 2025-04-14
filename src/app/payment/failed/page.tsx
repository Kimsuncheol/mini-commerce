'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const message = searchParams.get('message');
    const orderId = searchParams.get('orderId');

    setErrorCode(code);
    setErrorMessage(message || 'An error occurred during payment processing.');
    setOrderId(orderId);
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="mt-4 text-2xl font-bold text-center">Payment Failed</h1>
        
        <div className="mt-6 space-y-2">
          {errorCode && (
            <p className="text-gray-600">Error Code: <span className="font-semibold">{errorCode}</span></p>
          )}
          
          <p className="text-gray-600">Error: <span className="font-semibold text-red-600">{errorMessage}</span></p>
          
          {orderId && (
            <p className="text-gray-600">Order ID: <span className="font-semibold">{orderId}</span></p>
          )}
        </div>
        
        <div className="flex flex-col justify-center mt-8 space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Link href="/" className="px-4 py-2 text-center text-white bg-blue-500 rounded hover:bg-blue-600">
            Return to Home
          </Link>
          <Link href="/cart" className="px-4 py-2 text-center text-blue-500 border border-blue-500 rounded hover:bg-blue-50">
            Return to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
