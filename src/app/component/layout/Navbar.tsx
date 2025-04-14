"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { FiSearch, FiShoppingCart, FiUser } from 'react-icons/fi';
import { GiHamburgerMenu } from 'react-icons/gi';
import {
  subscribeToCartChanges,
  auth,
  db,
  collection,
  getDocs
} from '@/firebase/firebase'; 
import { DocumentData } from 'firebase/firestore'; // Import directly from firestore
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import DropDownMenu from '../Home/ui/DropDownMenu';
import { correctSearchQuery } from '@/app/services/searchService';
import SearchPreview from '../Home/ui/SearchPreview';
import { Product } from '@/types';
import { ngramSimilarity } from '@/utils/ngram'; // Import the ngram utility

// Function to fetch products from 'All Categories'
const getProductsFromAllCategories = async (): Promise<Product[]> => {
  try {
    const itemsRef = collection(db, 'products', 'All categories', 'items');
    const itemsSnapshot = await getDocs(itemsRef);
    return itemsSnapshot.docs.map((doc: DocumentData) => ({ 
      id: doc.id,
      ...doc.data(),
    } as Product));
  } catch (error) {
    console.error('Error fetching products from All Categories:', error);
    return [];
  }
};

const Navbar = () => {
  const [cartCount, setCartCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [productNames, setProductNames] = useState<string[]>([]); // For correction
  const [suggestionProducts, setSuggestionProducts] = useState<Product[]>([]); // Products for suggestions
  const [suggestions, setSuggestions] = useState<Product[]>([]); // Filtered suggestions
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Use effect to avoid hydration mismatch & load history
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error parsing search history', e);
      }
    }
  }, []);

  // Fetch products for suggestions and correction dictionary
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await getProductsFromAllCategories();
        setSuggestionProducts(products);
        const names = products.map((product: Product) => product.name.toLowerCase());
        setProductNames(names); // Keep this for the correction feature
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  // Generate suggestions based on n-gram similarity
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setShowPreview(false);
      return;
    }

    const calculatedSuggestions = suggestionProducts
      .map(product => ({
        ...product,
        similarity: ngramSimilarity(searchTerm.toLowerCase(), product.name.toLowerCase(), 2)
      }))
      .filter(product => product.similarity > 0.15) // Adjust threshold as needed
      .sort((a, b) => b.similarity - a.similarity);

    setSuggestions(calculatedSuggestions);
    setShowPreview(calculatedSuggestions.length > 0);

  }, [searchTerm, suggestionProducts]);

  // Handle clicks outside the search preview to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowPreview(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchContainerRef]);

  // Handle search submission
  const handleSearch = (e?: React.FormEvent<HTMLFormElement>, query?: string) => {
    e?.preventDefault();
    const finalQuery = query || searchTerm;
    if (!finalQuery.trim()) return;

    setShowPreview(false);

    // Check if query needs correction
    if (productNames.length > 0) {
      const { corrected, wasCorrection } = correctSearchQuery(finalQuery, productNames, 2, 0.3);
      if (wasCorrection) {
        setCorrectedQuery(corrected);
      } else {
        setCorrectedQuery(null);
      }
    }
      
    // Add to search history
    const updatedSearches = [
      finalQuery,
      ...searchHistory.filter(item => item !== finalQuery)
    ].slice(0, 10);
      
    setSearchHistory(updatedSearches);
    localStorage.setItem('searchHistory', JSON.stringify(updatedSearches));
      
    // Navigate to search results page
    router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
  };

  const handleCorrectionClick = () => {
    if (correctedQuery) {
      setSearchTerm(correctedQuery);
      setCorrectedQuery(null);
      handleSearch(undefined, correctedQuery); // Use handleSearch to navigate
    }
  };

  // Subscribe to cart changes
  useEffect(() => {
    if (!user || !user.email) {
      setCartCount(0);
      return;
    }

    const unsubscribe = subscribeToCartChanges(
      user.email,
      (items) => {
        setCartCount(items.length); 
      },
      (error) => {
        console.error("Error subscribing to cart:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Navigation Links section
  const renderNavigationLinks = () => (
    <div className="py-3 overflow-x-auto scrollbar-hide">
      <div className="flex space-x-1 md:space-x-8 md:justify-center">
        <Link href="/" className={linkClass}>Home</Link>
        <Link href="/products" className={linkClass}>Products</Link>
        <Link href="/categories/electronics" className={linkClass}>Categories</Link>
        <Link href="/deals" className={linkClass}>Deals</Link>
        <Link href="/about" className={linkClass}>About</Link>
        <Link href="/coupons" className={linkClass}>Coupons</Link>
        <Link href="/orders" className={linkClass}>Orders</Link>
      </div>
    </div>
  );
  
  const linkClass = "px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-300 rounded-md whitespace-nowrap dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800";

  return (
    <nav className="sticky top-0 z-[5000] transition-colors duration-300 bg-white shadow-md dark:bg-gray-900">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Top section with logo and icons */}
        <div className="flex items-center justify-between h-16">
          {/* HamburgerMenu */}
          <div className='relative flex items-center' ref={dropdownRef}>
            <div
              className="flex items-center gap-4 cursor-pointer" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <GiHamburgerMenu className='w-6 h-6 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white' />
              <Link href="/" className="text-xl font-bold text-gray-800 dark:text-white">
                ShopSmart
              </Link>
            </div>
            <DropDownMenu 
              isOpen={isDropdownOpen} 
              onClose={() => setIsDropdownOpen(false)} 
            />
          </div>

          {/* Action Icons - Always visible */}
          <div className="flex items-center space-x-4">
            <Link href="/account" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <FiUser className="w-6 h-6" />
            </Link>
            <Link href="/cart" className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <FiShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-blue-500 rounded-full -top-2 -right-2 dark:bg-blue-600">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search bar - Always visible */}
        <div className="py-2" ref={searchContainerRef}>
          <div className="relative">
            <form onSubmit={handleSearch} className="flex-grow max-w-full mx-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}                  
                  onFocus={() => searchTerm.length >= 2 && setShowPreview(true)} // Show preview on focus only if there's text
                  placeholder="Search products..."
                  className="w-full py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border-none rounded-lg dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="off" // Prevent browser suggestions
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiSearch className="text-gray-500" />
                </div>

                {/* Search Preview */} 
                {showPreview && (
                  <SearchPreview
                    products={suggestions} // Pass suggestions here
                    searchTerm={searchTerm}
                    onClose={() => setShowPreview(false)}
                    maxResults={5} 
                  />
                )}
              </div>
                  
              {/* Show correction suggestion */}
              {correctedQuery && !showPreview && ( // Only show correction if preview is hidden
                <div className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                  Did you mean:{' '}
                  <button 
                    type="button"
                    onClick={handleCorrectionClick}
                    className="font-medium underline hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {correctedQuery}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Navigation Links - Desktop only */}
        {renderNavigationLinks()}
      </div>
    </nav>
  );
};

export default Navbar;