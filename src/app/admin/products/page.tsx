'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db, fetchProductsByCategory } from '@/firebase/firebase';
import { Product } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { PRODUCT_CATEGORIES_WITH_ALL } from '@/constants/categories';
import BackButton from '@/app/component/ui/BackButton';
import { FiSearch, FiX, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// Interface for advanced search filters
interface AdvancedFilters {
  priceRange: [number, number];
  inStock: boolean | null;
  featured: boolean | null;
}

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    priceRange: [0, 1000],
    inStock: null,
    featured: null
  });

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await fetchProductsByCategory(categoryFilter);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryFilter]);

  useEffect(() => {
    // Reset selected products when category changes
    setSelectedProducts([]);
    setSelectAll(false);
  }, [categoryFilter]);

  // Save search to history
  const saveToSearchHistory = useCallback((term: string) => {
    if (!term) return;
    
    setSearchHistory(prev => {
      const newHistory = [term, ...prev.filter(item => item !== term)].slice(0, 5);
      localStorage.setItem('adminProductSearchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // Load search history on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('adminProductSearchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error parsing search history:', e);
      }
    }
  }, []);

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleSearchHistoryClick = (term: string) => {
    setSearchTerm(term);
    saveToSearchHistory(term);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('adminProductSearchHistory');
  };

  const handleDeleteSelectedProducts = async () => {
    if (selectedProducts.length === 0) return;

    setIsDeleting(true);
    setIsDeleteModalOpen(false);

    try {
      const deletePromises = selectedProducts.map(productId => {
        const product = products.find(p => p.id === productId);
        if (product) {
          if (product?.category === 'All categories') {
            const productRef = doc(db, 'products', product.category, 'items', productId);

            return getDoc(productRef).then((docSnapshot) => {
              if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                return Promise.all([
                  deleteDoc(doc(db, 'products', data.originalCategory, 'items', productId)),
                  deleteDoc(productRef),
                ]).then(() => {
                  return;
                });
              } else {
                console.log('No such document!');
                return Promise.resolve();
              }
            });
          } else {
            const productRef = doc(db, 'products', product.category, 'items', productId);

            return Promise.all([
              deleteDoc(productRef),
              deleteDoc(doc(db, 'products', "All categories", 'items', productId))
            ])
          }
        }
        return Promise.resolve();
      });

      await Promise.all(deletePromises);

      // Update products list after bulk delete
      setProducts(products.filter(product => !selectedProducts.includes(product.id)));
      setSelectedProducts([]);
      setSelectAll(false);

      alert(`Successfully deleted ${selectedProducts.length} products`);
    } catch (error) {
      console.error('Error deleting selected products:', error);
      alert(`Failed to delete some products: ${(error as Error).message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      // Update in the proper subcollection
      const productRef = doc(db, 'products', product.category, 'items', product.id);
      await updateDoc(productRef, {
        featured: !product.featured
      });

      setProducts(products.map(p =>
        p.id === product.id ? { ...p, featured: !p.featured } : p
      ));
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const toggleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setSelectedProducts([]);
    } else {
      // Select all visible products
      const visibleProductIds = filteredProducts.map(p => p.id);
      setSelectedProducts(visibleProductIds);
    }
    setSelectAll(!selectAll);
  };

  const handleAdvancedFiltersChange = (filters: Partial<AdvancedFilters>) => {
    setAdvancedFilters(prev => ({ ...prev, ...filters }));
  };

  // Apply all filters to products
  const filteredProducts = products.filter(product => {
    // Basic text search across multiple fields
    const searchLower = debouncedSearchTerm.toLowerCase();
    const matchesSearch = debouncedSearchTerm === '' || 
      product.name.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.id.toLowerCase().includes(searchLower);
      
    // If doesn't match the text search, return false immediately
    if (!matchesSearch) return false;
    
    // Advanced filters
    if (advancedFilters.priceRange[0] > 0 && product.price < advancedFilters.priceRange[0]) {
      return false;
    }
    
    if (advancedFilters.priceRange[1] < 1000 && product.price > advancedFilters.priceRange[1]) {
      return false;
    }
    
    if (advancedFilters.inStock === true && (!product.stock || product.stock <= 0)) {
      return false;
    }
    
    if (advancedFilters.inStock === false && product.stock > 0) {
      return false;
    }
    
    if (advancedFilters.featured === true && !product.featured) {
      return false;
    }
    
    if (advancedFilters.featured === false && product.featured) {
      return false;
    }
    
    return true;
  });

  // When a search is performed, save it to history
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm !== searchTerm) {
      saveToSearchHistory(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, saveToSearchHistory, searchTerm]);

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className='flex items-center gap-4'>
          <BackButton destination="/" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Product Management</h1>
        </div>
        <div className="flex space-x-3">
          {selectedProducts.length > 0 && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400"
              disabled={isDeleting}
            >
              Delete Selected ({selectedProducts.length})
            </button>
          )}

          <button onClick={() => setShowDeleteButton(prev => !prev)} className="px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-gray-700">
            {showDeleteButton ? 'Hide Delete Button' : 'Show Delete Button'}
          </button>

          <Link href="/admin/products/new" className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Add New Product
          </Link>
        </div>
      </div>

      <div className="p-6 mb-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <div className="flex flex-col justify-between gap-4 mb-6 md:flex-row">
          <div className="w-full md:w-1/2">
            <div className="relative">
              <div className="flex items-center">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search by name, ID, or description..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FiSearch className="absolute w-5 h-5 text-gray-400 left-3 top-2.5" />
                  {searchTerm && (
                    <button 
                      onClick={handleClearSearch}
                      className="absolute p-1 -translate-y-1/2 rounded-full right-3 top-1/2 hover:bg-gray-200 dark:hover:bg-gray-600"
                      aria-label="Clear search"
                    >
                      <FiX className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className="flex items-center px-3 py-2 ml-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                  aria-expanded={showAdvancedSearch}
                  aria-controls="advanced-search-panel"
                >
                  <FiFilter className="w-4 h-4 mr-1" />
                  Filters
                  {showAdvancedSearch ? (
                    <FiChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 ml-1" />
                  )}
                </button>
              </div>
              
              {/* Search history dropdown */}
              {searchTerm && searchHistory.length > 0 && (
                <div className="absolute left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center justify-between p-2 border-b dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Searches</span>
                    <button 
                      onClick={clearSearchHistory}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Clear All
                    </button>
                  </div>
                  <ul>
                    {searchHistory.map((term, index) => (
                      <li key={index} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                        <button
                          onClick={() => handleSearchHistoryClick(term)}
                          className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <FiSearch className="w-4 h-4 mr-2 text-gray-400" />
                          {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Advanced search panel */}
            {showAdvancedSearch && (
              <div 
                id="advanced-search-panel"
                className="p-4 mt-2 border border-gray-200 rounded-md dark:border-gray-700"
              >
                <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Advanced Filters</h3>
                
                <div className="mb-3">
                  <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Price Range</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      min="0"
                      max={advancedFilters.priceRange[1]}
                      value={advancedFilters.priceRange[0]}
                      onChange={(e) => handleAdvancedFiltersChange({
                        priceRange: [parseInt(e.target.value) || 0, advancedFilters.priceRange[1]]
                      })}
                      className="w-24 px-2 py-1 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Min"
                    />
                    <span className="text-gray-600 dark:text-gray-400">to</span>
                    <span className="text-gray-600 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      min={advancedFilters.priceRange[0]}
                      value={advancedFilters.priceRange[1]}
                      onChange={(e) => handleAdvancedFiltersChange({
                        priceRange: [advancedFilters.priceRange[0], parseInt(e.target.value) || 1000]
                      })}
                      className="w-24 px-2 py-1 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Max"
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Stock Status</label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="text-blue-600 border-gray-300 rounded form-radio focus:ring-blue-500"
                        name="stockStatus"
                        checked={advancedFilters.inStock === null}
                        onChange={() => handleAdvancedFiltersChange({ inStock: null })}
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">All</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="text-blue-600 border-gray-300 rounded form-radio focus:ring-blue-500"
                        name="stockStatus"
                        checked={advancedFilters.inStock === true}
                        onChange={() => handleAdvancedFiltersChange({ inStock: true })}
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">In Stock</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="text-blue-600 border-gray-300 rounded form-radio focus:ring-blue-500"
                        name="stockStatus"
                        checked={advancedFilters.inStock === false}
                        onChange={() => handleAdvancedFiltersChange({ inStock: false })}
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Out of Stock</span>
                    </label>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Featured Status</label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="text-blue-600 border-gray-300 rounded form-radio focus:ring-blue-500"
                        name="featuredStatus"
                        checked={advancedFilters.featured === null}
                        onChange={() => handleAdvancedFiltersChange({ featured: null })}
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">All</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="text-blue-600 border-gray-300 rounded form-radio focus:ring-blue-500"
                        name="featuredStatus"
                        checked={advancedFilters.featured === true}
                        onChange={() => handleAdvancedFiltersChange({ featured: true })}
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Featured</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="text-blue-600 border-gray-300 rounded form-radio focus:ring-blue-500"
                        name="featuredStatus"
                        checked={advancedFilters.featured === false}
                        onChange={() => handleAdvancedFiltersChange({ featured: false })}
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Not Featured</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => {
                      setAdvancedFilters({
                        priceRange: [0, 1000],
                        inStock: null,
                        featured: null
                      });
                    }}
                    className="px-3 py-1 text-sm text-gray-600 bg-gray-100 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="w-full md:w-1/4">
            <label htmlFor="categoryFilter" className="sr-only">Filter by category</label>
            <select
              id="categoryFilter"
              aria-label="Filter by category"
              className="w-full px-4 py-2 border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {PRODUCT_CATEGORIES_WITH_ALL.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              {filteredProducts.length} products found
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {
                      showDeleteButton && (
                        <th className="w-16 px-6 py-3">
                          <div className="flex items-center">
                            <input
                              id="select-all"
                              type="checkbox"
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              checked={selectAll}
                              onChange={handleSelectAll}
                            />
                            <label htmlFor="select-all" className="sr-only">Select All</label>
                          </div>
                        </th>
                      )
                    }
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Product</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Category</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Price</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Stock</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Featured</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {
                          showDeleteButton && (
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                checked={selectedProducts.includes(product.id)}
                                onChange={() => toggleSelectProduct(product.id)}
                                title={`Select ${product.name}`}
                                aria-label={`Select ${product.name}`}
                              />
                            </td>
                          )
                        }
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link href={`/admin/products/${product.id}?category=${product.category}`} className="flex items-center">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-10 h-10 mr-4">
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  width={40}
                                  height={40}
                                  className="object-cover w-10 h-10 rounded-full"
                                />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">ID: {product.id.substring(0, 8)}</div>
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                          <Link href={`/admin/products/${product.id}?category=${product.category}`} className="flex items-center">
                            <span className="inline-flex px-2 text-xs font-semibold leading-5 text-blue-800 bg-blue-100 rounded-full dark:bg-blue-800 dark:text-blue-100">
                              {product.category}
                            </span>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                          <Link href={`/admin/products/${product.id}?category=${product.category}`} className="flex items-center">
                            ${product.price.toFixed(2)}
                            {product.originalPrice && (
                              <span className="ml-2 text-xs text-gray-400 line-through dark:text-gray-500">
                                ${product.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link href={`/admin/products/${product.id}?category=${product.category}`} className="flex items-center">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock > 10 ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                              product.stock > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                                'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                              }`}>
                              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                            </span>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <button
                            onClick={() => handleToggleFeatured(product)}
                            className={`px-2 py-1 rounded-md ${product.featured ?
                              'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                          >
                            {product.featured ? 'Featured' : 'Not Featured'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Confirm Deletion</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Are you sure you want to delete {selectedProducts.length} selected products? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelectedProducts}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete {selectedProducts.length} Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;