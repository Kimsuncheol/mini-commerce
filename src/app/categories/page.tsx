'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiChevronRight, FiGrid, FiList } from 'react-icons/fi';
import Navbar from '../component/layout/Navbar';
import Footer from '../component/layout/Footer';
import { PRODUCT_CATEGORIES, getCategoryIcon } from '@/constants/categories';
import { categories } from '@/constants/categories';

// Category data mapping using our standardized categories

function CategoryCard({ category }) {
  return (
    <Link href={`/categories/${category.id}`} className="group">
      <div className="overflow-hidden transition-all duration-300 bg-white rounded-lg shadow-md dark:bg-gray-800 hover:shadow-xl">
        <div className="relative h-52">
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-gradient-to-t from-black/70 to-transparent">
            <h3 className="text-lg font-semibold text-white">{category.name}</h3>
            <p className="text-xs text-white/80">{category.productCount} products</p>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{category.description}</p>
          <div className="flex items-center mt-3 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
            <span className="text-sm font-medium">Browse category</span>
            <FiChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeaturedCategory({ category }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
      <div className="absolute inset-0 opacity-20">
        <Image
          src={category.imageUrl}
          alt={category.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="relative z-10 p-8 text-white">
        <h3 className="text-2xl font-bold">{category.name}</h3>
        <p className="mt-2 text-white/80">{category.description}</p>
        <p className="mt-1 text-sm font-medium text-white/70">{category.productCount} products available</p>
        
        <Link href={`/categories/${category.id}`} className="inline-flex items-center px-4 py-2 mt-4 font-medium text-indigo-700 transition-colors bg-white rounded-md hover:bg-gray-100">
          Explore Collection
          <FiChevronRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    </div>
  );
}

function CategoriesPage() {
  const [view, setView] = useState('grid');
  const featuredCategories = categories.filter(cat => cat.featured);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-12 bg-gray-100 dark:bg-gray-800">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
                Shop by Category
              </h1>
              <p className="max-w-xl mx-auto mt-4 text-xl text-gray-600 dark:text-gray-300">
                Browse our wide selection of products organized by category
              </p>
            </div>
          </div>
        </section>
        
        {/* Featured Categories */}
        {featuredCategories.length > 0 && (
          <section className="py-10">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Categories</h2>
              <div className="grid gap-6 mt-6 md:grid-cols-3">
                {featuredCategories.map((category) => (
                  <FeaturedCategory key={category.id} category={category} />
                ))}
              </div>
            </div>
          </section>
        )}
        
        {/* All Categories */}
        <section className="py-10">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Categories</h2>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setView('grid')}
                  className={`p-2 rounded-md ${view === 'grid' 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  title="Grid view"
                  aria-label="Grid view"
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setView('list')}
                  className={`p-2 rounded-md ${view === 'list' 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  title="List view"
                  aria-label="List view"
                >
                  <FiList className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {view === 'grid' ? (
              <div className="grid gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {categories.map((category) => (
                  <Link 
                    key={category.id} 
                    href={`/categories/${category.id}`}
                    className="flex items-center p-4 transition-colors bg-white rounded-lg shadow dark:bg-gray-800 hover:shadow-md group"
                  >
                    <div className="relative flex-shrink-0 w-24 h-24 overflow-hidden rounded-lg">
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{category.description}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{category.productCount} products</p>
                    </div>
                    <FiChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
        
        {/* Category Shopping Tips */}
        <section className="py-10 bg-gray-100 dark:bg-gray-800">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shopping Guide</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Tips for finding the right products in each category</p>
              
              <div className="grid gap-6 mt-8 md:grid-cols-3">
                <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compare Products</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Use our comparison tools to find the best value for your money across categories.
                  </p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Read Reviews</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Customer reviews can provide valuable insight before making your purchase.
                  </p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Check Availability</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Verify product availability and estimated delivery times for your location.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

export default CategoriesPage;