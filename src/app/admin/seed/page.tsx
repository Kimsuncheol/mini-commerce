'use client';

import { useState } from 'react';
import Link from 'next/link';
import { seedProducts } from '@/scripts/seed-products';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const seedResult = await seedProducts();
      setResult(seedResult);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container p-6 mx-auto">
      <h1 className="mb-6 text-2xl font-bold">Admin: Seed Products</h1>
      
      <div className="p-6 mb-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Seed Product Data</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          This will add sample product data to your Firebase database. You should only need to do this once.
        </p>
        
        <button
          onClick={handleSeed}
          disabled={loading}
          className={`px-4 py-2 rounded ${loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium`}
        >
          {loading ? 'Seeding Products...' : 'Seed Products'}
        </button>
      </div>
      
      {result && (
        <div className={`p-4 rounded-lg ${result.success 
          ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800' 
          : 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800'}`}
        >
          <h3 className={`font-medium ${result.success 
            ? 'text-green-700 dark:text-green-300' 
            : 'text-red-700 dark:text-red-300'}`}
          >
            {result.success ? 'Success!' : 'Error'}
          </h3>
          <p className={`mt-1 ${result.success 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'}`}
          >
            {result.message}
          </p>
        </div>
      )}
      
      <div className="mt-6">
        <Link 
          href="/products" 
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Go to Products Page
        </Link>
        {' | '}
        <Link 
          href="/product-debug" 
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Go to Products Debug Page
        </Link>
      </div>
    </div>
  );
} 