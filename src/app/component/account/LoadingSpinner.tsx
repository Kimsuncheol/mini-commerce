import React, { memo } from 'react';

const LoadingSpinner = memo(() => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
export default LoadingSpinner;