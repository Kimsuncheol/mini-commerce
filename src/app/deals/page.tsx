'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiChevronDown, FiGrid, FiList, FiSearch } from 'react-icons/fi';
import ProductCard from '../component/Home/ProductCard';
import Navbar from '../component/layout/Navbar';
import Footer from '../component/layout/Footer';
import { Product } from '@/types';
// Import the categories constant
import { PRODUCT_CATEGORIES_WITH_ALL } from '@/constants/categories';
// Import Firebase functions
import { getAllProductsFromSubcollections } from '@/firebase/firebase';

// Remove sampleDeals array

const discountFilters = ['All Discounts', '10% or more', '25% or more', '50% or more', '75% or more'];
const sortOptions = ['Most Popular', 'Highest Discount', 'Price: Low to High', 'Price: High to Low'];

export default function DealsPage() {
    const [activeCategory, setActiveCategory] = useState<string>(PRODUCT_CATEGORIES_WITH_ALL[0]);
    const [activeDiscount, setActiveDiscount] = useState('All Discounts');
    const [sortBy, setSortBy] = useState('Most Popular');
    const [viewMode, setViewMode] = useState('grid');
    const [filteredDeals, setFilteredDeals] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const itemsPerPage = 8;

    // Fetch products from Firebase
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const products = await getAllProductsFromSubcollections();
                
                // Filter only products with discounts (those having originalPrice higher than price)
                const dealsProducts = products.filter(product => 
                    product.originalPrice && product.originalPrice > product.price
                );
                
                setAllProducts(dealsProducts);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching products:', error);
                setLoading(false);
            }
        };
        
        fetchProducts();
    }, []);

    // Filter and sort products whenever filters change
    useEffect(() => {
        if (allProducts.length === 0) return;
        
        let results = [...allProducts];

        // Apply search filter if there's a query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            results = results.filter(deal =>
                deal.name.toLowerCase().includes(query) ||
                (deal.category && deal.category.toLowerCase().includes(query))
            );
        }

        // Apply category filter
        if (activeCategory !== 'All categories') {
            results = results.filter(deal => deal.category === activeCategory);
        }

        // Apply discount filter
        if (activeDiscount !== 'All Discounts') {
            const minDiscountPercent = parseInt(activeDiscount.split('%')[0]);
            results = results.filter(deal => {
                if (!deal.originalPrice) return false;
                const discountPercent = ((deal.originalPrice - deal.price) / deal.originalPrice) * 100;
                return discountPercent >= minDiscountPercent;
            });
        }

        // Apply sorting
        switch (sortBy) {
            case 'Highest Discount':
                results.sort((a, b) => {
                    const discountA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
                    const discountB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
                    return discountB - discountA;
                });
                break;
            case 'Price: Low to High':
                results.sort((a, b) => a.price - b.price);
                break;
            case 'Price: High to Low':
                results.sort((a, b) => b.price - a.price);
                break;
            default: // Most Popular
                results.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        }

        setFilteredDeals(results);
        setCurrentPage(1); // Reset to first page on filter change
    }, [activeCategory, activeDiscount, sortBy, searchQuery, allProducts]);

    // Calculate total pages for pagination
    const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);

    // Get current items to display
    const getCurrentItems = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredDeals.slice(startIndex, endIndex);
    };

    // Handle search form submission
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Search is already handled in the useEffect
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />

            {/* Hero Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-700">
                <div className="absolute top-0 right-0 opacity-10">
                    <Image
                        src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da"
                        alt="Deals Background"
                        width={600}
                        height={400}
                        className="object-cover"
                    />
                </div>
                <div className="container relative px-4 py-16 mx-auto text-center text-white md:py-24">
                    <h1 className="mb-2 text-3xl font-extrabold md:text-5xl">Hot Deals & Discounts</h1>
                    <p className="mb-8 text-lg">Save big on our best products with limited-time offers</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container px-4 py-8 mx-auto">
                {/* Search and Filter Section */}
                <div className="mb-8 space-y-4">
                    {/* Search Bar */}
                    <form onSubmit={handleSearchSubmit} className="flex w-full max-w-lg mx-auto mb-6">
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <FiSearch className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full p-3 pl-10 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                placeholder="Search for deals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="absolute right-2.5 bottom-2 top-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300"
                                aria-label="Search"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    {/* Filter Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                        {/* Category Filter - Already converted to select */}
                        <div className="relative inline-block">
                            <select
                                value={activeCategory}
                                onChange={(e) => setActiveCategory(e.target.value)}
                                className="px-4 py-2 pr-8 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none cursor-pointer dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                        {/* Discount Filter - Replace with select */}
                        <div className="relative inline-block" id='discount-filter'>
                            <select
                                value={activeDiscount}
                                onChange={(e) => setActiveDiscount(e.target.value)}
                                className="px-4 py-2 pr-8 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none cursor-pointer dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                aria-label="Select discount"
                            >
                                {discountFilters.map((discount) => (
                                    <option key={discount} value={discount}>
                                        {discount}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <FiChevronDown className="text-gray-500" />
                            </div>
                        </div>

                        {/* Sort Options - Replace with select */}
                        <div className="relative inline-block" id='sort-options'>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 pr-8 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none cursor-pointer dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                aria-label="Sort by"
                            >
                                {sortOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option.startsWith('Sort:') ? option : `Sort: ${option}`}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <FiChevronDown className="text-gray-500" />
                            </div>
                        </div>

                        {/* View Mode Toggles */}
                        <div className="flex items-center space-x-2">
                            <button
                                className={`p-2 rounded-md ${
                                    viewMode === 'grid'
                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid view"
                            >
                                <FiGrid />
                            </button>
                            <button
                                className={`p-2 rounded-md ${
                                    viewMode === 'list'
                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                                onClick={() => setViewMode('list')}
                                aria-label="List view"
                            >
                                <FiList />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-6">
                    <p className="text-gray-600 dark:text-gray-400">
                        Showing {getCurrentItems().length} of {filteredDeals.length} deals
                    </p>
                </div>

                {/* Products Display Section */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-t-4 border-gray-200 rounded-full border-t-blue-600 animate-spin"></div>
                    </div>
                ) : getCurrentItems().length > 0 ? (
                    <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'space-y-4'}`}>
                        {getCurrentItems().map((product) => (
                            viewMode === 'grid' ? (
                                <ProductCard 
                                    key={product.id} 
                                    id={product.id}
                                    name={product.name}
                                    price={product.price}
                                    originalPrice={product.originalPrice}
                                    imageUrl={product.imageUrl}
                                    rating={product.rating}
                                    reviewCount={product.reviewCount}
                                    category={product.category}
                                    stock={product.stock}
                                />
                            ) : (
                                <div key={product.id} className="flex p-4 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                                    <div className="flex-shrink-0 w-24 h-24 mr-4">
                                        <Image
                                            src={product.imageUrl}
                                            alt={product.name}
                                            width={96}
                                            height={96}
                                            className="object-cover rounded-md"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-between flex-grow">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{product.name}</h3>
                                            <div className="flex items-center mt-1">
                                                <p className="mr-2 text-lg font-bold text-gray-900 dark:text-white">${product.price.toFixed(2)}</p>
                                                {product.originalPrice && (
                                                    <p className="text-sm text-gray-500 line-through dark:text-gray-400">
                                                        ${product.originalPrice.toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button 
                                            className="px-4 py-2 mt-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                            aria-label={`Add ${product.name} to cart`}
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64">
                        <FiSearch className="w-12 h-12 mb-4 text-gray-400" />
                        <h3 className="mb-2 text-xl font-medium text-gray-900 dark:text-white">No deals found</h3>
                        <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                        <nav className="inline-flex -space-x-px rounded-md shadow-sm isolate">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border border-gray-300 rounded-l-md ${
                                    currentPage === 1
                                        ? 'bg-gray-100 cursor-not-allowed text-gray-400'
                                        : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                                }`}
                                aria-label="Previous page"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                                        currentPage === i + 1
                                            ? 'z-10 bg-blue-600 text-white border-blue-600'
                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                                    }`}
                                    aria-label={`Page ${i + 1}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border border-gray-300 rounded-r-md ${
                                    currentPage === totalPages
                                        ? 'bg-gray-100 cursor-not-allowed text-gray-400'
                                        : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                                }`}
                                aria-label="Next page"
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                )}
            </div>            <Footer />
        </div>
    );
}