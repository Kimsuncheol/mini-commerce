'use client';

import React, { useState, useEffect } from 'react';
import { FiFilter, FiChevronDown, FiChevronUp, FiGrid, FiList, FiSearch } from 'react-icons/fi';
import ProductCard from '../component/Home/ProductCard';
import Navbar from '../component/layout/Navbar';
import Footer from '../component/layout/Footer';
import { Product } from '@/types';
import { PRODUCT_CATEGORIES_WITH_ALL } from '@/constants/categories';
import { getAllProductsFromSubcollections } from '@/firebase/firebase';

// Sale ends in 5 days from now
const SALE_END_DATE = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

export default function SalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // Filter states
  const [activeCategory, setActiveCategory] = useState<string>(PRODUCT_CATEGORIES_WITH_ALL[0]);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('discount');
  const [discountFilter, setDiscountFilter] = useState<number>(0); // Minimum discount percentage
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const itemsPerPage = 12;

  // Calculate countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = SALE_END_DATE.getTime() - now.getTime();
      
      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Fetch products from Firebase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const allProducts = await getAllProductsFromSubcollections();
        
        // Filter only products with discounts (having originalPrice higher than price)
        const saleProducts = allProducts.filter(product => 
          product.originalPrice && product.originalPrice > product.price
        );
        
        // Sort by highest discount percentage by default
        const sortedProducts = [...saleProducts].sort((a, b) => {
          const discountA = a.originalPrice ? ((a.originalPrice - a.price) / a.originalPrice) * 100 : 0;
          const discountB = b.originalPrice ? ((b.originalPrice - b.price) / b.originalPrice) * 100 : 0;
          return discountB - discountA;
        });
        
        setProducts(sortedProducts);
        setFilteredProducts(sortedProducts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Apply filters when filter criteria change
  useEffect(() => {
    if (products.length === 0) return;
    
    let results = [...products];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(product => 
        product.name.toLowerCase().includes(query) || 
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (activeCategory !== 'All categories') {
      results = results.filter(product => product.category === activeCategory);
    }
    
    // Apply discount filter
    if (discountFilter > 0) {
      results = results.filter(product => {
        if (!product.originalPrice) return false;
        const discountPercent = ((product.originalPrice - product.price) / product.originalPrice) * 100;
        return discountPercent >= discountFilter;
      });
    }
    
    // Apply price range filter
    results = results.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    // Apply sorting
    switch (sortBy) {
      case 'discount':
        results.sort((a, b) => {
          const discountA = a.originalPrice ? ((a.originalPrice - a.price) / a.originalPrice) * 100 : 0;
          const discountB = b.originalPrice ? ((b.originalPrice - b.price) / b.originalPrice) * 100 : 0;
          return discountB - discountA;
        });
        break;
      case 'price-asc':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        results.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
    }
    
    setFilteredProducts(results);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [products, activeCategory, searchQuery, discountFilter, priceRange, sortBy]);
  
  // Calculate total pages for pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  // Get current items to display
  const currentItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);
  
  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };
  
  // Format number with leading zero
  const formatNumber = (num: number): string => {
    return num < 10 ? `0${num}` : num.toString();
  };
  
  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      {/* Hero Section with Sale Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-500 to-pink-600">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="pattern-circles" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
              <circle id="pattern-circle" cx="10" cy="10" r="2" fill="currentColor"></circle>
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)"></rect>
          </svg>
        </div>
        
        <div className="container relative px-4 py-16 mx-auto text-center text-white md:py-24">
          <div className="inline-block px-6 py-2 mb-6 text-sm font-bold tracking-wider text-red-700 uppercase bg-white rounded-full">
            Limited Time Offer
          </div>
          <h1 className="mb-4 text-4xl font-extrabold md:text-6xl">Super Summer Sale</h1>
          <p className="mx-auto mb-8 text-xl md:max-w-xl">Up to 70% off on thousands of items. Hurry before they're gone!</p>
          
          {/* Countdown Timer */}
          <div className="flex justify-center mb-8 space-x-4">
            <div className="w-16 p-2 bg-white rounded-lg md:w-20 md:p-3">
              <div className="text-2xl font-bold text-red-600 md:text-3xl">{formatNumber(timeLeft.days)}</div>
              <div className="text-xs font-medium text-gray-600 uppercase">Days</div>
            </div>
            <div className="w-16 p-2 bg-white rounded-lg md:w-20 md:p-3">
              <div className="text-2xl font-bold text-red-600 md:text-3xl">{formatNumber(timeLeft.hours)}</div>
              <div className="text-xs font-medium text-gray-600 uppercase">Hours</div>
            </div>
            <div className="w-16 p-2 bg-white rounded-lg md:w-20 md:p-3">
              <div className="text-2xl font-bold text-red-600 md:text-3xl">{formatNumber(timeLeft.minutes)}</div>
              <div className="text-xs font-medium text-gray-600 uppercase">Mins</div>
            </div>
            <div className="w-16 p-2 bg-white rounded-lg md:w-20 md:p-3">
              <div className="text-2xl font-bold text-red-600 md:text-3xl">{formatNumber(timeLeft.seconds)}</div>
              <div className="text-xs font-medium text-gray-600 uppercase">Secs</div>
            </div>
          </div>
          
          <button 
            onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3 font-semibold text-red-600 transition-colors bg-white rounded-full hover:bg-gray-100"
          >
            Shop Now
          </button>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="container px-4 py-16 mx-auto">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">Shop By Category</h2>
          <p className="text-gray-600 dark:text-gray-400">Browse sale items by category</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {PRODUCT_CATEGORIES_WITH_ALL.slice(1).map((category, index) => (
            <div 
              key={category}
              className={`relative overflow-hidden bg-gradient-to-br rounded-lg shadow-lg cursor-pointer transition-transform hover:scale-105 ${
                index % 6 === 0 ? 'from-pink-500 to-red-500' :
                index % 6 === 1 ? 'from-blue-500 to-indigo-500' :
                index % 6 === 2 ? 'from-green-500 to-teal-500' :
                index % 6 === 3 ? 'from-purple-500 to-indigo-500' :
                index % 6 === 4 ? 'from-yellow-500 to-orange-500' :
                'from-red-500 to-pink-500'
              }`}
              onClick={() => {
                setActiveCategory(category);
                document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="p-6 text-center text-white">
                <div className="mb-2 text-lg font-bold">{category}</div>
                <div className="text-sm opacity-75">Sale Items</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main Products Section */}
      <div id="products-section" className="container px-4 py-12 mx-auto">
        <div className="mb-8">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">Sale Items</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredProducts.length} products on sale
          </p>
        </div>
        
        {/* Filters and Search */}
        <div className="mb-8">
          <div className="p-4 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Search */}
              <div className="w-full md:w-auto">
                <form onSubmit={handleSearchSubmit} className="flex">
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full p-2 pl-10 text-sm border border-gray-300 rounded-md bg-gray-50 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      placeholder="Search sale items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search sale items"
                    />
                  </div>
                </form>
              </div>
              
              {/* Category filter */}
              <div className="w-full md:w-auto">
                <div className="relative">
                  <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    aria-label="Select category"
                  >
                    {PRODUCT_CATEGORIES_WITH_ALL.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <FiChevronDown className="text-gray-500" />
                  </div>
                </div>
              </div>
              
              {/* Sort options */}
              <div className="w-full md:w-auto">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    aria-label="Sort by"
                  >
                    <option value="discount">Highest Discount</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="popular">Most Popular</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <FiChevronDown className="text-gray-500" />
                  </div>
                </div>
              </div>
              
              {/* Discount filter */}
              <div className="w-full md:w-auto">
                <div className="relative">
                  <select
                    value={discountFilter}
                    onChange={(e) => setDiscountFilter(Number(e.target.value))}
                    className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    aria-label="Filter by discount"
                  >
                    <option value="0">All Discounts</option>
                    <option value="10">10% or more</option>
                    <option value="25">25% or more</option>
                    <option value="50">50% or more</option>
                    <option value="70">70% or more</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <FiChevronDown className="text-gray-500" />
                  </div>
                </div>
              </div>
              
              {/* View mode */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-white text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid' ? 'true' : 'false'}
                >
                  <FiGrid />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-white text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list' ? 'true' : 'false'}
                >
                  <FiList />
                </button>
              </div>
              
              {/* More filters button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-650"
              >
                <FiFilter className="mr-2" />
                More Filters
                {showFilters ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
              </button>
            </div>
            
            {/* Expanded filters */}
            {showFilters && (
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Price Range */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Price Range: ${priceRange[0]} - ${priceRange[1]}
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        step="10"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        aria-label="Minimum price range"
                      />
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        step="10"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        aria-label="Maximum price range"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse dark:bg-gray-700"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mb-4 text-5xl">🔍</div>
            <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">No products found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {currentItems.map(product => (
              <ProductCard 
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="inline-flex overflow-hidden rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-gray-700 bg-white border-r border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => goToPage(pageNum)}
                    className={`px-4 py-2 ${
                      currentPage === pageNum
                        ? 'bg-red-600 text-white font-semibold hover:bg-red-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    } border-r border-gray-300 dark:border-gray-600`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
      
      {/* Email Signup */}
      <div className="py-16 bg-gray-100 dark:bg-gray-800">
        <div className="container px-4 mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white md:text-4xl">
              Don&apos;t miss our limited time offers!
            </h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">Sign up for our newsletter to get exclusive deals and early access to future sales.</p>
            
            <form className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-2">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 font-medium text-white transition-colors bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
} 