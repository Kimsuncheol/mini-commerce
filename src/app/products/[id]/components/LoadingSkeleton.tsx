import React from 'react';
import BackButton from '@/app/component/ui/BackButton';

export default function LoadingSkeleton() {
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center mb-4 space-x-2">
        <BackButton destination="/" />
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Skeleton Product Image */}
        <div className="space-y-4">
          <div className="relative w-full overflow-hidden bg-gray-200 rounded-lg aspect-square dark:bg-gray-700 animate-pulse"></div>
          <div className="flex space-x-2">
            {[...Array(4)].map((_, index) => (
              <div 
                key={index} 
                className="w-20 h-20 bg-gray-200 rounded-md dark:bg-gray-700 animate-pulse"
              ></div>
            ))}
          </div>
        </div>

        {/* Skeleton Product Info */}
        <div className="flex flex-col space-y-6">
          {/* Title and ratings */}
          <div>
            <div className="w-3/4 h-8 mb-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
            <div className="flex items-center mb-4">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                ))}
              </div>
              <div className="w-24 h-4 ml-2 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
            </div>
            
            {/* Price */}
            <div className="w-32 h-10 mb-6 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
            
            {/* Description */}
            <div className="mb-6">
              <div className="w-40 h-6 mb-2 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-full h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                <div className="w-full h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                <div className="w-2/3 h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
              </div>
            </div>
            
            {/* Stock */}
            <div className="w-40 h-6 mb-6 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
            
            {/* Quantity */}
            <div className="flex items-center mb-6">
              <div className="w-20 h-6 mr-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
              <div className="flex items-center h-10 bg-gray-200 rounded dark:bg-gray-700 animate-pulse w-28"></div>
            </div>
            
            {/* Buttons */}
            <div className="flex flex-wrap gap-4">
              <div className="w-40 h-12 bg-gray-200 rounded-lg dark:bg-gray-700 animate-pulse"></div>
              <div className="w-40 h-12 bg-gray-200 rounded-lg dark:bg-gray-700 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-lg w-28 dark:bg-gray-700 animate-pulse"></div>
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="w-40 h-6 mb-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="w-20 h-4 mb-1 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                <div className="w-24 h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
              </div>
              <div>
                <div className="w-20 h-4 mb-1 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                <div className="w-24 h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Skeleton Related Products */}
      <div className="mt-16">
        <div className="h-8 mb-6 bg-gray-200 rounded w-60 dark:bg-gray-700 animate-pulse"></div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700">
              <div className="relative w-full bg-gray-200 pt-[100%] dark:bg-gray-700 animate-pulse"></div>
              <div className="p-4">
                <div className="w-3/4 h-6 mb-1 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                <div className="flex items-center mb-2">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
                    ))}
                  </div>
                </div>
                <div className="w-20 h-5 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
