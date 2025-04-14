'use client';

import { useState, useEffect } from 'react';
import { FiGrid, FiList, FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import ProductCard from '@/app/component/Home/ProductCard';
import SkeletonProductCard from '@/app/component/Home/ui/SkeletonProductCard';
import BackButton from '@/app/component/ui/BackButton';
import { Product } from '@/types';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { fetchProductsByCategory, getAllProductsFromSubcollections } from '@/firebase/firebase';
import { PRODUCT_CATEGORIES_WITH_ALL } from '@/constants/categories';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'createdAt-desc' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Most Popular', value: 'reviewCount-desc' },
  { label: 'Highest Rated', value: 'rating-desc' }
];

export default function ProductsPage() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({
    categories: true,
    price: true,
    rating: false
  });

  // URL params
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const category = searchParams.get('category') || 'All categories';
  const sort = searchParams.get('sort') || 'createdAt-desc';
  const page = Number(searchParams.get('page')) || 1;
  const minPrice = Number(searchParams.get('minPrice')) || 0;
  const maxPrice = Number(searchParams.get('maxPrice')) || 1000;


  // Effect to fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Fetch products from Firebase based on category
        let fetchedProducts: Product[] = [];
        
        if (category === 'All categories') {
          fetchedProducts = await getAllProductsFromSubcollections();
        } else {
          fetchedProducts = await fetchProductsByCategory(category);
        }
        
        // Apply price filter
        fetchedProducts = fetchedProducts.filter(
          p => p.price >= minPrice && p.price <= maxPrice
        );

        // Apply sorting
        const [sortField, sortDirection] = sort.split('-');
        fetchedProducts.sort((a, b) => {
          const aValue = a[sortField as keyof Product];
          const bValue = b[sortField as keyof Product];

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          }
          
          // Handle date sorting if the field is a Date object
          if (aValue instanceof Date && bValue instanceof Date) {
            return sortDirection === 'asc' 
              ? aValue.getTime() - bValue.getTime() 
              : bValue.getTime() - aValue.getTime();
          }

          return 0;
        });

        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, sort, minPrice, maxPrice, page]);

  // Functions to update URL parameters
  const updateParams = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    router.push(`${pathname}?${newParams.toString()}`);
  };

  const toggleFilter = (filter: keyof typeof expandedFilters) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  const handlePriceChange = (min: number, max: number) => {
    updateParams({
      minPrice: min.toString(),
      maxPrice: max.toString(),
      page: '1' // Reset to first page on filter change
    });
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <BackButton destination="/" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">All Products</h1>
        </div>

        <div className="flex items-center space-x-2">
          <div className="hidden p-1 bg-white rounded-md shadow-sm md:flex dark:bg-gray-800">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-2 rounded ${viewMode === 'grid'
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`p-2 rounded ${viewMode === 'list'
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <FiList className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center p-2 text-gray-600 bg-white rounded-md shadow-sm md:hidden dark:bg-gray-800 dark:text-gray-400"
          >
            <FiFilter className="w-5 h-5 mr-1" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Mobile filter overlay */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 md:hidden">
            <div className="absolute top-0 bottom-0 right-0 p-4 overflow-y-auto bg-white shadow-lg w-80 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800 dark:text-white">Filters</h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Close filters"
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              {/* Filter content - same as desktop sidebar */}
              <div className="space-y-6">
                {/* Category filter */}
                <div className="pb-6 border-b dark:border-gray-700">
                  <button
                    onClick={() => toggleFilter('categories')}
                    className="flex items-center justify-between w-full mb-2"
                  >
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Categories</h3>
                    {expandedFilters.categories ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                  {expandedFilters.categories && (
                    <div className="mt-2 space-y-2">
                      {PRODUCT_CATEGORIES_WITH_ALL.map(cat => (
                        <div key={cat} className="flex items-center">
                          <input
                            id={`mobile-category-${cat}`}
                            type="radio"
                            name="mobile-category"
                            checked={category === cat}
                            onChange={() => updateParams({ category: cat === 'All categories' ? null : cat, page: '1' })}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:border-gray-600"
                          />
                          <label
                            htmlFor={`mobile-category-${cat}`}
                            className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            {cat}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price filter */}
                <div className="pb-6 border-b dark:border-gray-700">
                  <button
                    onClick={() => toggleFilter('price')}
                    className="flex items-center justify-between w-full mb-2"
                    aria-label="Toggle price filter"
                  >
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Price Range</h3>
                    {expandedFilters.price ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                  {expandedFilters.price && (
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <input
                          type="number"
                          value={minPrice}
                          onChange={(e) => handlePriceChange(Number(e.target.value), maxPrice)}
                          placeholder="Min"
                          className="w-20 p-1 text-sm text-gray-800 bg-white border rounded dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                        <span className="text-gray-500 dark:text-gray-400">to</span>
                        <input
                          type="number"
                          value={maxPrice}
                          onChange={(e) => handlePriceChange(minPrice, Number(e.target.value))}
                          placeholder="Max"
                          className="w-20 p-1 text-sm text-gray-800 bg-white border rounded dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">${minPrice}</span>
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          value={minPrice}
                          onChange={(e) => handlePriceChange(Number(e.target.value), maxPrice)}
                          className="flex-1 accent-indigo-600"
                          aria-label="Minimum price range"
                          title="Adjust minimum price"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">${maxPrice}</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    updateParams({
                      category: null,
                      minPrice: null,
                      maxPrice: null,
                      page: '1'
                    });
                    setMobileFiltersOpen(false);
                  }}
                  className="w-full px-4 py-2 text-gray-800 transition-colors bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <div className="flex-shrink-0 hidden w-64 md:block">
          <div className="sticky p-4 space-y-6 bg-white rounded-lg shadow-sm top-20 dark:bg-gray-800">
            <div className="pb-4 border-b dark:border-gray-700">
              <button
                onClick={() => toggleFilter('categories')}
                className="flex items-center justify-between w-full"
              >
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Categories</h3>
                {expandedFilters.categories ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              {expandedFilters.categories && (
                <div className="mt-4 space-y-2">
                  {PRODUCT_CATEGORIES_WITH_ALL.map(cat => (
                    <div key={cat} className="flex items-center">
                      <input
                        id={`category-${cat}`}
                        type="radio"
                        name="category"
                        checked={category === cat}
                        onChange={() => updateParams({ category: cat === 'All categories' ? null : cat, page: '1' })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:border-gray-600"
                      />
                      <label
                        htmlFor={`category-${cat}`}
                        className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {cat}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pb-4 border-b dark:border-gray-700">
              <button
                onClick={() => toggleFilter('price')}
                className="flex items-center justify-between w-full"
              >
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Price Range</h3>
                {expandedFilters.price ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              {expandedFilters.price && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => handlePriceChange(Number(e.target.value), maxPrice)}
                      placeholder="Min"
                      className="w-20 p-1 text-sm text-gray-800 bg-white border rounded dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <span className="text-gray-500 dark:text-gray-400">to</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => handlePriceChange(minPrice, Number(e.target.value))}
                      placeholder="Max"
                      className="w-20 p-1 text-sm text-gray-800 bg-white border rounded dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">${minPrice}</span>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={minPrice}
                      onChange={(e) => handlePriceChange(Number(e.target.value), maxPrice)}
                      className="flex-1 accent-indigo-600"
                      aria-label="Minimum price range"
                      title="Adjust minimum price"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">${maxPrice}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => updateParams({
                category: null,
                minPrice: null,
                maxPrice: null,
                page: '1'
              })}
              className="w-full px-4 py-2 text-gray-800 transition-colors bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="flex flex-col items-start justify-between mb-6 sm:flex-row sm:items-center">
            <p className="mb-4 text-gray-600 dark:text-gray-400 sm:mb-0">
              Showing {loading ? '...' : products.length} products
              {category !== 'All categories' ? ` in ${category}` : ''}
            </p>
            <div className="flex items-center">
              <label htmlFor="sort" className="mr-2 text-sm text-gray-700 dark:text-gray-300">Sort by:</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="px-2 py-1 text-sm text-gray-800 bg-white border rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Products grid */}
          {loading ? (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonProductCard key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-lg dark:bg-gray-800">
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">No products found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search criteria</p>
            </div>
          ) : (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  imageUrl={product.imageUrl}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && products.length > 0 && (
            <div className="flex justify-center mt-12">
              <nav className="flex items-center">
                <button
                  onClick={() => updateParams({ page: Math.max(1, page - 1).toString() })}
                  disabled={page === 1}
                  className={`p-2 mr-2 rounded-md border dark:border-gray-700 ${page === 1
                      ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  Previous
                </button>

                {Array.from({ length: 3 }, (_, i) => page - 1 + i).filter(p => p > 0).map(p => (
                  <button
                    key={p}
                    onClick={() => updateParams({ page: p.toString() })}
                    className={`w-10 h-10 mx-1 flex items-center justify-center rounded-md ${p === page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => updateParams({ page: (page + 1).toString() })}
                  className="p-2 ml-2 bg-white border rounded-md dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
