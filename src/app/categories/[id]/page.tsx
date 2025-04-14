'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiFilter, FiGrid, FiList, FiChevronDown, FiChevronUp, FiStar, FiShoppingCart, FiHeart, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import Navbar from '../../component/layout/Navbar';
import Footer from '../../component/layout/Footer';
import { Product } from '@/types';
import { fetchProductsByCategory } from '@/firebase/firebase';

// Category mapping to standardize IDs and names
interface CategoryData {
  id: string;
  name: string;
  description: string;
  bannerImage: string;
}

const categoryMapping: Record<string, CategoryData> = {
  electronics: {
    id: 'Electronics',
    name: 'Electronics',
    description: 'Discover the latest gadgets, laptops, smartphones, and accessories. Our electronics category features cutting-edge technology from top brands, designed to enhance your digital lifestyle with innovative solutions for work and entertainment.',
    bannerImage: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
  },
  clothing: {
    id: 'Clothing',
    name: 'Clothing',
    description: 'Elevate your style with our curated fashion collection. Browse through trendy clothing, shoes, and accessories for all occasions, featuring contemporary designs and timeless classics that help you express your unique personality.',
    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80'
  },
  'home-kitchen': {
    id: 'Home & Kitchen',
    name: 'Home & Kitchen',
    description: 'Transform your living space with our Home & Kitchen collection. Find beautiful furniture, decor, kitchen essentials, and garden tools designed to make your house a home, blending functionality with style for every room and outdoor area.',
    bannerImage: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1174&q=80'
  },
  beauty: {
    id: 'Beauty',
    name: 'Beauty',
    description: 'Enhance your natural beauty and wellbeing with our premium beauty products. From skincare and makeup to personal care and wellness items, our collection helps you look and feel your best every day.',
    bannerImage: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80'
  },
  sports: {
    id: 'Sports',
    name: 'Sports',
    description: 'Fuel your active lifestyle with our sports and outdoor gear. Whether you\'re a professional athlete or weekend warrior, find equipment, apparel, and accessories designed for performance, comfort, and durability in any activity.',
    bannerImage: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
  },
  books: {
    id: 'Books',
    name: 'Books',
    description: 'Expand your mind with our extensive collection of books. From bestselling novels and educational resources to entertainment and knowledge for readers of all ages.',
    bannerImage: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
  },
  toys: {
    id: 'Toys',
    name: 'Toys',
    description: 'Bring joy to children of all ages with our toys products. Our selection includes educational toys, games, puzzles, and children\'s items that combine fun with learning, designed to spark imagination and develop skills.',
    bannerImage: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
  },
  other: {
    id: 'Other',
    name: 'Other',
    // eslint-disable-next-line react/no-unescaped-entities
    description: "Miscellaneous products that don't fit in other categories.",
    bannerImage: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80'
  }
};

// Function to calculate discount percentage safely
const calculateDiscountPercentage = (price: number, originalPrice?: number): number => {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

// Component for displaying products
function ProductCard({ product, view }: { product: Product; view: 'grid' | 'list' }) {
  const isDiscounted = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = calculateDiscountPercentage(product.price, product.originalPrice);

  if (view === 'grid') {
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
          <h3 className="font-medium text-gray-900 line-clamp-1 dark:text-white">{product.name}</h3>
          <div className="flex items-center mt-1 space-x-1">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, index) => (
                <FiStar
                  key={index}
                  className={`w-4 h-4 ${
                    index < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : index < product.rating
                        ? 'text-yellow-400 fill-yellow-400 opacity-50'
                        : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.reviewCount})</span>
          </div>
          <div className="flex items-end pt-3 mt-auto">
            <div className="flex-1">
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
          </div>
        </div>
      </div>
    );
  } else {
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
          <div className="flex justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
            <div className="flex items-center space-x-1">
              <div className="flex items-center">
                <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="ml-1 text-sm font-medium text-gray-600 dark:text-gray-300">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-gray-500">({product.reviewCount})</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between mt-4">
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
  }
}

interface FilterAccordionProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  toggle: () => void;
}

function FilterAccordion({ title, children, isOpen, toggle }: FilterAccordionProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full py-4 text-left"
        aria-expanded={isOpen ? "true" : "false"}
        title={`Toggle ${title} filter section`}
        aria-label={`Toggle ${title} filter section`}
      >
        <span className="text-sm font-medium text-gray-900 dark:text-white">{title}</span>
        {isOpen ? (
          <FiChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <FiChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="pb-4">{children}</div>
      </div>
    </div>
  );
}

function CategoryPage() {
  const params = useParams();
  const categoryId = typeof params.id === 'string' ? params.id : '';
  const category = categoryMapping[categoryId];
  
  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState('featured');
  const [filters, setFilters] = useState({
    priceRange: [0, 1000],
    rating: 0,
    onSale: false
  });
  const [openFilters, setOpenFilters] = useState({
    price: true,
    rating: false,
    availability: false
  });
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const productsPerPage = 12;
  const toggleFilter = (filterName: keyof typeof openFilters) => {
    setOpenFilters((prev) => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  useEffect(() => {
    // Set loading state
    setLoading(true);
    
    // Get the standard category name for Firebase query
    const fbCategoryName = categoryMapping[categoryId]?.id || '';
    
    // Fetch products from Firebase based on category
    const getProducts = async () => {
      try {
        // Fetch products from Firebase category subcollection
        let fetchedProducts = await fetchProductsByCategory(fbCategoryName);
        
        // Apply any filters
        if (filters.onSale) {
          fetchedProducts = fetchedProducts.filter(p => p.originalPrice && p.originalPrice > p.price);
        }
        
        if (filters.rating > 0) {
          fetchedProducts = fetchedProducts.filter(p => p.rating >= filters.rating);
        }
        
        fetchedProducts = fetchedProducts.filter(
          p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
        );
        
        // Apply sort
        switch (sort) {
          case 'price-low':
            fetchedProducts.sort((a, b) => a.price - b.price);
            break;
          case 'price-high':
            fetchedProducts.sort((a, b) => b.price - a.price);
            break;
          case 'rating':
            fetchedProducts.sort((a, b) => b.rating - a.rating);
            break;
          case 'newest':
            fetchedProducts.sort((a, b) => {
              const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : +a.createdAt;
              const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : +b.createdAt;
              return dateB - dateA;
            });
            break;
          case 'featured':
          default:
            fetchedProducts.sort((a, b) => ((a.featured ? 1 : 0) - (b.featured ? 1 : 0)) * -1);
        }
        
        setProducts(fetchedProducts);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    getProducts();
  }, [categoryId, filters, sort]);

  // Fix apostrophe in other category description
  const otherCategory = categoryMapping.other;
  if (otherCategory) {
    otherCategory.description = "Miscellaneous products that don't fit in other categories.";
  }

  // Get current products for pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <h1 className="text-2xl text-gray-700 dark:text-gray-200">Category not found</h1>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main>
        {/* Category Banner */}
        <section className="relative bg-gradient-to-r from-black to-gray-800">
          <div className="absolute inset-0 opacity-40">
            <Image
              src={category.bannerImage}
              alt={category.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="relative z-10 px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <nav className="flex mb-4" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  <li className="inline-flex items-center">
                    <Link href="/" className="inline-flex items-center text-sm text-gray-300 hover:text-white">
                      Home
                    </Link>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <span className="mx-2 text-gray-400">/</span>
                      <Link href="/categories" className="text-sm text-gray-300 hover:text-white">
                        Categories
                      </Link>
                    </div>
                  </li>
                  <li aria-current="page">
                    <div className="flex items-center">
                      <span className="mx-2 text-gray-400">/</span>
                      <span className="text-sm text-gray-100">{category.name}</span>
                    </div>
                  </li>
                </ol>
              </nav>
              
              <h1 className="text-4xl font-bold text-white">{category.name}</h1>
              <p className="mt-4 text-lg text-gray-200">{category.description}</p>
            </div>
          </div>
        </section>
        
        {/* Product Listing */}
        <section className="py-10">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              {/* Filter Sidebar - Desktop */}
              <div className="hidden lg:block lg:col-span-3">
                <div className="sticky p-4 bg-white rounded-lg shadow dark:bg-gray-800 top-24">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h2>
                  
                  <div className="mt-4 space-y-1">
                    <FilterAccordion 
                      title="Price Range" 
                      isOpen={openFilters.price} 
                      toggle={() => toggleFilter('price')}
                    >
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          ${filters.priceRange[0]} - ${filters.priceRange[1]}
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1000" 
                        value={filters.priceRange[1]} 
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            priceRange: [prev.priceRange[0], parseInt(e.target.value)]
                          }))
                        }}
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        title="Maximum price"
                        aria-label="Maximum price range"
                      />
                      <input 
                        type="range" 
                        min="0" 
                        max="1000" 
                        value={filters.priceRange[0]} 
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            priceRange: [parseInt(e.target.value), prev.priceRange[1]]
                          }))
                        }}
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        title="Minimum price"
                        aria-label="Minimum price range"
                      />
                    </FilterAccordion>
                    
                    <FilterAccordion 
                      title="Rating" 
                      isOpen={openFilters.rating}
                      toggle={() => toggleFilter('rating')}
                    >
                      {[4, 3, 2, 1].map((star) => (
                        <div key={star} className="flex items-center mt-2">
                          <input
                            id={`rating-${star}`}
                            type="radio"
                            checked={filters.rating === star}
                            onChange={() => setFilters(prev => ({ ...prev, rating: star }))}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label htmlFor={`rating-${star}`} className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <FiStar
                                  key={index}
                                  className={`w-4 h-4 ${
                                    index < star
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="ml-1">& up</span>
                            </div>
                          </label>
                        </div>
                      ))}
                      <div className="flex items-center mt-2">
                        <input
                          id="rating-any"
                          type="radio"
                          checked={filters.rating === 0}
                          onChange={() => setFilters(prev => ({ ...prev, rating: 0 }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor="rating-any" className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                          Any Rating
                        </label>
                      </div>
                    </FilterAccordion>
                    
                    <FilterAccordion 
                      title="Availability" 
                      isOpen={openFilters.availability}
                      toggle={() => toggleFilter('availability')}
                    >
                      <div className="flex items-center mt-2">
                        <input
                          id="sale-filter"
                          type="checkbox"
                          checked={filters.onSale}
                          onChange={() => setFilters(prev => ({ ...prev, onSale: !prev.onSale }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor="sale-filter" className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                          On Sale
                        </label>
                      </div>
                    </FilterAccordion>
                  </div>
                  
                  <button 
                    onClick={() => setFilters({
                      priceRange: [0, 1000],
                      rating: 0,
                      onSale: false
                    })}
                    className="w-full px-4 py-2 mt-6 text-sm font-medium text-gray-800 transition-colors bg-gray-100 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
              
              {/* Product Grid */}
              <div className="lg:col-span-9">
                {/* Product Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-4 bg-white rounded-lg shadow dark:bg-gray-800">
                  <div className="flex items-center">
                    <button 
                      onClick={() => setIsFilterSidebarOpen(!isFilterSidebarOpen)}
                      className="flex items-center px-3 py-2 mr-3 text-sm font-medium text-gray-800 border border-gray-300 rounded-md lg:hidden dark:text-gray-200 dark:border-gray-600"
                    >
                      <FiFilter className="mr-2" /> Filters
                    </button>
                    
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Showing {products.length} products
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <label htmlFor="sort" className="mr-2 text-sm text-gray-600 dark:text-gray-300">Sort by:</label>
                      <select
                        id="sort"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="px-2 py-1 text-sm bg-white border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                      >
                        <option value="featured">Featured</option>
                        <option value="newest">Newest</option>
                        <option value="rating">Best Rating</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => setView('grid')}
                        className={`p-2 rounded-md ${view === 'grid' 
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      >
                        <FiGrid className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setView('list')}
                        className={`p-2 rounded-md ${view === 'list' 
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      >
                        <FiList className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Mobile Filters Sidebar */}
                {isFilterSidebarOpen && (
                  <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setIsFilterSidebarOpen(false)} />
                      <div className="fixed inset-y-0 left-0 flex max-w-full pr-10">
                        <div className="relative w-full max-w-md">
                          <div className="flex flex-col h-full overflow-y-scroll bg-white shadow-xl dark:bg-gray-800">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h2>
                              <button 
                                onClick={() => setIsFilterSidebarOpen(false)}
                                className="p-2 text-gray-400 rounded-md hover:text-gray-500 dark:hover:text-gray-300"
                              >
                                <span className="sr-only">Close panel</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                              {/* Filter content - same as desktop but adapted for mobile */}
                              <div className="space-y-4">
                                <div>
                                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Price Range</h3>
                                  <div className="mt-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600 dark:text-gray-300">
                                        ${filters.priceRange[0]} - ${filters.priceRange[1]}
                                      </span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="0" 
                                      max="1000" 
                                      value={filters.priceRange[1]} 
                                      onChange={(e) => {
                                        setFilters(prev => ({
                                          ...prev,
                                          priceRange: [prev.priceRange[0], parseInt(e.target.value)]
                                        }))
                                      }}
                                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                      title="Maximum price"
                                      aria-label="Maximum price range"
                                    />
                                    <input 
                                      type="range" 
                                      min="0" 
                                      max="1000" 
                                      value={filters.priceRange[0]} 
                                      onChange={(e) => {
                                        setFilters(prev => ({
                                          ...prev,
                                          priceRange: [parseInt(e.target.value), prev.priceRange[1]]
                                        }))
                                      }}
                                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                      title="Minimum price"
                                      aria-label="Minimum price range"
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Rating</h3>
                                  <div className="mt-2 space-y-2">
                                    {[4, 3, 2, 1].map((star) => (
                                      <div key={star} className="flex items-center">
                                        <input
                                          id={`mobile-rating-${star}`}
                                          type="radio"
                                          checked={filters.rating === star}
                                          onChange={() => setFilters(prev => ({ ...prev, rating: star }))}
                                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <label htmlFor={`mobile-rating-${star}`} className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                                          <div className="flex items-center">
                                            {Array.from({ length: 5 }).map((_, index) => (
                                              <FiStar
                                                key={index}
                                                className={`w-4 h-4 ${
                                                  index < star
                                                    ? 'text-yellow-400 fill-yellow-400'
                                                    : 'text-gray-300'
                                                }`}
                                              />
                                            ))}
                                            <span className="ml-1">& up</span>
                                          </div>
                                        </label>
                                      </div>
                                    ))}
                                    <div className="flex items-center">
                                      <input
                                        id="mobile-rating-any"
                                        type="radio"
                                        checked={filters.rating === 0}
                                        onChange={() => setFilters(prev => ({ ...prev, rating: 0 }))}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                      />
                                      <label htmlFor="mobile-rating-any" className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                                        Any Rating
                                      </label>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Availability</h3>
                                  <div className="mt-2">
                                    <div className="flex items-center">
                                      <input
                                        id="mobile-sale-filter"
                                        type="checkbox"
                                        checked={filters.onSale}
                                        onChange={() => setFilters(prev => ({ ...prev, onSale: !prev.onSale }))}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                      />
                                      <label htmlFor="mobile-sale-filter" className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                                        On Sale
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                              <button 
                                onClick={() => {
                                  setFilters({
                                    priceRange: [0, 1000],
                                    rating: 0,
                                    onSale: false
                                  });
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                              >
                                Clear All
                              </button>
                              <button 
                                onClick={() => setIsFilterSidebarOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                              >
                                Apply Filters
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Products Display */}
                {loading ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                        <div className="w-full h-48 bg-gray-200 rounded-t-lg animate-pulse dark:bg-gray-700"></div>
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
                          <div className="flex items-center justify-between pt-3">
                            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
                            <div className="w-12 h-6 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {currentProducts.length === 0 ? (
                      <div className="py-10 text-center">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No products found</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">Try adjusting your filters to find what you're looking for.</p>
                      </div>
                    ) : (
                      <div className={view === 'grid' 
                        ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" 
                        : "space-y-6"}
                      >
                        {currentProducts.map((product) => (
                          <Link href={`/products/${product.id}`} key={product.id}>
                            <ProductCard product={product} view={view} />
                          </Link>
                        ))}
                      </div>
                    )}
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between py-6">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                            currentPage === 1 
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600' 
                              : 'text-gray-700 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                        >
                          <FiArrowLeft className="w-4 h-4 mr-2" />
                          Previous
                        </button>
                        
                        <div className="hidden sm:flex">
                          {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`px-4 py-2 mx-1 text-sm font-medium rounded-md ${
                                currentPage === i + 1
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                        
                        <span className="text-sm text-gray-700 sm:hidden dark:text-gray-300">
                          Page {currentPage} of {totalPages}
                        </span>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                            currentPage === totalPages 
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600' 
                              : 'text-gray-700 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                        >
                          Next
                          <FiArrowRight className="w-4 h-4 ml-2" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
        
        {/* Related Categories Section */}
        <section className="py-10 bg-gray-100 dark:bg-gray-800">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">You might also like</h2>
            <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Object.values(categoryMapping)
                .filter(cat => cat.id !== categoryId)
                .slice(0, 4)
                .map((cat) => (
                  <Link 
                    href={`/categories/${cat.id}`}
                    key={cat.id}
                    className="overflow-hidden transition-all duration-300 bg-white rounded-lg shadow dark:bg-gray-700 hover:shadow-md group"
                  >
                    <div className="relative w-full h-32">
                      <Image
                        src={cat.bannerImage}
                        alt={cat.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                        <h3 className="text-xl font-bold text-white">{cat.name}</h3>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

export default CategoryPage;