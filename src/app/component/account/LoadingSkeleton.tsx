import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="min-h-screen py-8 bg-gray-50 dark:bg-gray-900">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="overflow-hidden bg-white rounded-lg shadow-lg dark:bg-gray-800">
          {/* Profile Header Skeleton */}
          <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-indigo-900">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              {/* Avatar Skeleton */}
              <div className="rounded-full w-28 h-28 bg-blue-400/30 dark:bg-blue-700/30 animate-pulse"></div>
              
              {/* User Info Skeleton */}
              <div className="text-center md:text-left md:ml-4">
                <div className="w-48 h-8 mb-2 rounded-md bg-blue-400/30 dark:bg-blue-700/30 animate-pulse"></div>
                <div className="h-5 mb-2 rounded-md w-36 bg-blue-400/30 dark:bg-blue-700/30 animate-pulse"></div>
                <div className="w-24 h-4 rounded-md bg-blue-400/30 dark:bg-blue-700/30 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation Skeleton */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="w-20 h-6 bg-gray-200 rounded-md dark:bg-gray-700 animate-pulse"></div>
              </div>
            ))}
          </div>
          
          {/* Content Skeleton */}
          <div className="p-6">
            <div className="w-48 h-8 mb-6 bg-gray-200 rounded-md dark:bg-gray-700 animate-pulse"></div>
            
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="w-24 h-24 bg-gray-200 rounded-md dark:bg-gray-700 animate-pulse"></div>
                    <div className="flex-grow">
                      <div className="w-full h-6 max-w-md mb-3 bg-gray-200 rounded-md dark:bg-gray-700 animate-pulse"></div>
                      <div className="w-24 h-5 mb-3 bg-gray-200 rounded-md dark:bg-gray-700 animate-pulse"></div>
                      <div className="w-32 h-5 mb-3 bg-gray-200 rounded-md dark:bg-gray-700 animate-pulse"></div>
                      <div className="flex gap-2">
                        <div className="w-24 h-8 bg-gray-200 rounded-md dark:bg-gray-700 animate-pulse"></div>
                        <div className="w-24 h-8 bg-gray-200 rounded-md dark:bg-gray-700 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
