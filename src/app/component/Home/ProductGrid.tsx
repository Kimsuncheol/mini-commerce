'use client';
import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import SkeletonProductCard from './ui/SkeletonProductCard';
import { fetchProductsByCategory } from '@/firebase/firebase';
import { Product } from '@/types';

export default function ProductGrid() {
  const [loading, setLoading] = useState(true);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getProducts = async () => {
      try {
        setLoading(true);
        // Fetch featured products - default to "All Categories" to get products across categories
        const products = await fetchProductsByCategory('All Categories');
        
        // Take only the first 8 products for the featured section
        const featuredProducts = products.slice(0, 8);
        setDisplayProducts(featuredProducts);
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    getProducts();
  }, []);

  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-800" id='Featured Products'>
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Products</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Discover our most popular items handpicked for you</p>
        </div>
        
        {error && (
          <div className="p-4 mb-6 text-center text-red-600 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {loading 
            ? Array(8).fill(0).map((_, index) => <SkeletonProductCard key={index} />)
            : displayProducts.map(product => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  imageUrl={product.imageUrl || '/placeholder-product.jpg'}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  category={product.category}
                  description={product.description}
                  stock={product.stock}
                />
              ))
          }
        </div>
        
        <div className="mt-12 text-center">
          <button className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white transition-colors bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700" onClick={() => window.location.href = '/products'}>
            View All Products
          </button>
        </div>
      </div>
    </section>
  );
}
