import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';

interface SearchPreviewProps {
  products: Product[];
  searchTerm: string;
  onClose: () => void;
  maxResults?: number;
}

const SearchPreview: React.FC<SearchPreviewProps> = ({
  products,
  searchTerm,
  onClose,
  maxResults = 5
}) => {
  if (!searchTerm || products.length === 0) return null;

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .slice(0, maxResults);

  if (filteredProducts.length === 0) return null;

  return (
    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl dark:bg-gray-800 dark:border-gray-700">
      <div className="p-4">
        <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          Quick Results
        </h3>
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <Link
              href={`/products/${product.id}${product.category ? `?category=${encodeURIComponent(product.category)}` : ''}`}
              key={product.id}
              onClick={onClose}
              className="flex items-center p-2 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {product.imageUrl && (
                <div className="relative w-12 h-12 mr-3">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                  {product.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ${product.price.toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
        {products.length > maxResults && (
          <Link
            href={`/search?q=${encodeURIComponent(searchTerm)}`}
            onClick={onClose}
            className="block mt-4 text-sm text-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all results
          </Link>
        )}
      </div>
    </div>
  );
};

export default SearchPreview; 