'use client';

import { useState, useEffect } from 'react';
import { getProductsCollectionStructure, getAllProductsFromSubcollections } from '@/firebase/firebase';
import { Product } from '@/types';

// Define proper type for collection structure
interface CategoryDetail {
  id: string;
  name: string;
  productCount: number;
}

interface CollectionStructure {
  categoryCount: number;
  totalProductCount: number;
  categoryDetails: CategoryDetail[];
}

export default function ProductDebugPage() {
  const [loading, setLoading] = useState(true);
  const [structure, setStructure] = useState<CollectionStructure | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Get collection structure
        const collectionStructure = await getProductsCollectionStructure();
        setStructure(collectionStructure);
        
        // Get all products
        const allProducts = await getAllProductsFromSubcollections();
        setProducts(allProducts);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Product Collection Debug</h1>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <p>Loading product data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Product Collection Debug</h1>
        <div className="bg-red-50 dark:bg-red-900 p-6 rounded-lg shadow border border-red-200 dark:border-red-800">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Product Collection Debug</h1>
      
      {/* Collection Structure */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">Collection Structure</h2>
        {structure ? (
          <div>
            <p className="mb-2">Categories: {structure.categoryCount}</p>
            <p className="mb-2">Total Products: {structure.totalProductCount}</p>
            
            <h3 className="font-medium mt-4 mb-2">Categories Breakdown:</h3>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {structure.categoryDetails.map((cat) => (
                <li key={cat.id} className="py-2">
                  <span className="font-medium">{cat.id}</span>: {cat.productCount} products
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No structure data available</p>
        )}
      </div>
      
      {/* Products Preview */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3">Products Preview</h2>
        <p className="mb-4">Total products: {products.length}</p>
        
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {products.slice(0, 10).map(product => (
                  <tr key={product.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{product.id.substring(0, 8)}...</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{product.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{product.category}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">${product.price}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{product.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length > 10 && (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Showing 10 of {products.length} products
              </p>
            )}
          </div>
        ) : (
          <p>No products found</p>
        )}
      </div>

      {/* Raw data for debugging */}
      <div className="mt-6 bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Raw Collection Structure Data:</h3>
        <pre className="text-xs overflow-auto p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          {JSON.stringify(structure, null, 2)}
        </pre>
        
        <h3 className="font-medium mb-2 mt-4">First Product Raw Data:</h3>
        <pre className="text-xs overflow-auto p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          {products.length > 0 ? JSON.stringify(products[0], null, 2) : 'No products'}
        </pre>
      </div>
    </div>
  );
} 