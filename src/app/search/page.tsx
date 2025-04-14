'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiFilter, FiGrid, FiList, FiSearch, FiShoppingCart, FiHeart } from 'react-icons/fi';
import Navbar from '../component/layout/Navbar';
import Footer from '../component/layout/Footer';
import { Product } from '@/types';
import { fetchProductsByCategory } from '@/firebase/firebase';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState<string>('relevance');
  const [relatedSearches, setRelatedSearches] = useState<string[]>([]);

  // Fetch all products and filter them based on the search query
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetch all products from 'All categories'
        const allProducts = await fetchProductsByCategory('All categories');
        setProducts(allProducts);
        
        // Filter products based on search query
        filterProducts(allProducts, query);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query]);

  // Filter products based on search query and generate related searches
  const filterProducts = (productsToFilter: Product[], searchQuery: string) => {
    if (!searchQuery.trim()) {
      setFilteredProducts([]);
      return;
    }

    const terms = searchQuery.toLowerCase().split(/\s+/);
    const keywordMap = new Map<string, number>();
    
    // Filter products by search query
    const filtered = productsToFilter.filter(product => {
      // Check if product matches any search term
      const nameMatch = terms.some(term => 
        product.name.toLowerCase().includes(term)
      );
      
      const descMatch = terms.some(term => 
        product.description?.toLowerCase().includes(term)
      );
      
      const categoryMatch = terms.some(term => 
        product.category.toLowerCase().includes(term)
      );
      
      // For related searches, collect keywords from matching products
      if (nameMatch || descMatch || categoryMatch) {
        // Extract keywords from product name and description
        const words = [
          ...product.name.toLowerCase().split(/\s+/),
          ...(product.description?.toLowerCase().split(/\s+/) || [])
        ];
        
        // Count keyword frequencies
        words.forEach(word => {
          if (word.length > 3 && !terms.includes(word)) {
            keywordMap.set(word, (keywordMap.get(word) || 0) + 1);
          }
        });
      }
      
      return nameMatch || descMatch || categoryMatch;
    });
    
    // Generate related searches based on keyword frequency
    const relatedTerms = Array.from(keywordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => {
        // Combine original query with the related term
        const firstTerm = terms[0];
        return firstTerm !== term ? `${firstTerm} ${term}` : term;
      });
    
    setRelatedSearches(relatedTerms);
    
    // Sort products based on relevance or other criteria
    const sortedProducts = sortProducts(filtered, sort);
    setFilteredProducts(sortedProducts);
  };

  // Apply sorting to filtered products
  const sortProducts = (productsToSort: Product[], sortOption: string) => {
    switch (sortOption) {
      case 'price-low':
        return [...productsToSort].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...productsToSort].sort((a, b) => b.price - a.price);
      case 'newest':
        return [...productsToSort].sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : +a.createdAt;
          const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : +b.createdAt;
          return dateB - dateA;
        });
      case 'rating':
        return [...productsToSort].sort((a, b) => b.rating - a.rating);
      case 'relevance':
      default:
        // For relevance, prioritize products with exact match in name
        return [...productsToSort].sort((a, b) => {
          const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
          const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
          
          if (aNameMatch !== bNameMatch) return bNameMatch - aNameMatch;
          
          // Then by featured status
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          
          // Then by rating
          return b.rating - a.rating;
        });
    }
  };

  // Handle sort change
  const handleSortChange = (sortOption: string) => {
    setSort(sortOption);
    setFilteredProducts(sortProducts(filteredProducts, sortOption));
  };

  // Product Card Component
  const ProductCard = ({ product }: { product: Product }) => {
    const isDiscounted = product.originalPrice && product.originalPrice > product.price;
    const discountPercentage = isDiscounted 
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
      : 0;

    return (
      <div className="flex flex-col overflow-hidden transition-all duration-300 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg">
        <div className="relative overflow-hidden bg-gray-100 group aspect-square">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {isDiscounted && (
            <div className="absolute px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md top-2 left-2">
              {discountPercentage}% OFF
            </div>
          )}
          <div className="absolute flex space-x-1 transition-opacity opacity-0 right-2 bottom-2 group-hover:opacity-100">
            <button 
              className="p-2 text-gray-800 transition-colors bg-white rounded-full shadow-md hover:bg-blue-500 hover:text-white"
              title="Add to cart"
              aria-label="Add to cart"
            >
              <FiShoppingCart className="w-5 h-5" />
            </button>
            <button 
              className="p-2 text-gray-800 transition-colors bg-white rounded-full shadow-md hover:bg-rose-500 hover:text-white"
              title="Add to wishlist"
              aria-label="Add to wishlist"
            >
              <FiHeart className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex flex-col flex-1 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 line-clamp-1 dark:text-white">{product.name}</h3>
            <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">
              {product.category}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600 line-clamp-2 dark:text-gray-300">
            {product.description}
          </p>
          <div className="flex items-end justify-between pt-3 mt-auto">
            <div>
              {isDiscounted ? (
                <div className="flex items-end space-x-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">${product.price}</span>
                  <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
                </div>
              ) : (
                <span className="text-lg font-bold text-gray-900 dark:text-white">${product.price}</span>
              )}
              <p className="text-xs text-gray-500">{product.stock > 0 ? 'In stock' : 'Out of stock'}</p>
            </div>
            <div className="flex items-center space-x-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(product.rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 fill-gray-300'
                    }`}
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-500">({product.reviewCount || 0})</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Product List Item Component
  const ProductListItem = ({ product }: { product: Product }) => {
    const isDiscounted = product.originalPrice && product.originalPrice > product.price;
    const discountPercentage = isDiscounted 
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
      : 0;

    return (
      <div className="flex overflow-hidden transition-all duration-300 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg">
        <div className="relative w-1/4 overflow-hidden bg-gray-100 group">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {isDiscounted && (
            <div className="absolute px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md top-2 left-2">
              {discountPercentage}% OFF
            </div>
          )}
        </div>
        <div className="flex flex-col flex-1 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
            <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">
              {product.category}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600 line-clamp-3 dark:text-gray-300">
            {product.description}
          </p>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <div>
                {isDiscounted ? (
                  <div className="flex items-end space-x-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">${product.price}</span>
                    <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-gray-900 dark:text-white">${product.price}</span>
                )}
                <p className="text-xs text-gray-500">{product.stock > 0 ? 'In stock' : 'Out of stock'}</p>
              </div>
              <div className="flex items-center space-x-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(product.rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 fill-gray-300'
                      }`}
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-gray-500">({product.reviewCount || 0})</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="flex items-center px-3 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded hover:bg-blue-700">
                <FiShoppingCart className="w-4 h-4 mr-1" /> Add to Cart
              </button>
              <button 
                className="p-2 text-gray-600 transition-colors border border-gray-300 rounded hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                title="Add to wishlist"
                aria-label="Add to wishlist"
              >
                <FiHeart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="py-8">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Search header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Search Results for "<span className="text-blue-600 dark:text-blue-400">{query}</span>"
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {filteredProducts.length} products found
            </p>
            
            {/* Related searches */}
            {relatedSearches.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Related searches:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {relatedSearches.map((term, index) => (
                    <Link 
                      key={index}
                      href={`/search?q=${encodeURIComponent(term)}`}
                      className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      {term}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Sort and view options */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-y-4">
            <div className="flex items-center space-x-4">
              <label htmlFor="sort" className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                <option value="relevance">Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Best Rating</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setView('grid')}
                className={`p-2.5 rounded-md ${view === 'grid' 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Grid view"
                aria-label="Grid view"
              >
                <FiGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setView('list')}
                className={`p-2.5 rounded-md ${view === 'list' 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="List view"
                aria-label="List view"
              >
                <FiList className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Search results */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg shadow dark:bg-gray-800">
              <FiSearch className="mx-auto mb-4 text-gray-400 w-14 h-14" />
              <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">No products found</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                We couldn't find any products matching "{query}". Try using different or more general keywords.
              </p>
              <Link href="/products" className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className={view === 'grid' 
              ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "space-y-6"}
            >
              {filteredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  {view === 'grid' ? (
                    <ProductCard product={product} />
                  ) : (
                    <ProductListItem product={product} />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 