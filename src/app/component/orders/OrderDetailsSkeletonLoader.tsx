import React from 'react'

function OrderDetailsSkeletonLoader() {
  return (
    <div className="w-full animate-pulse">
      {/* Order header */}
      <div className="p-6 mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <div className="w-1/3 h-8 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="w-1/4 h-8 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
          <div className="flex justify-between">
            <div className="w-1/4 h-6 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="w-1/5 h-6 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
        </div>
      </div>

      {/* Order status */}
      <div className="p-6 mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
        <div className="w-1/4 h-6 mb-3 bg-gray-200 rounded dark:bg-gray-700"></div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div className="w-1/3 h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
        </div>
      </div>

      {/* Order items */}
      <div className="p-6 mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
        <div className="w-1/4 h-6 mb-4 bg-gray-200 rounded dark:bg-gray-700"></div>
        
        {/* Product items (3 items) */}
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex gap-4 py-4 border-b dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="flex-1">
              <div className="w-3/4 h-5 mb-2 bg-gray-200 rounded dark:bg-gray-700"></div>
              <div className="w-1/4 h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>
            <div className="w-20 h-6 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
        ))}
      </div>

      {/* Shipping details */}
      <div className="p-6 mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
        <div className="w-1/3 h-6 mb-4 bg-gray-200 rounded dark:bg-gray-700"></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="w-24 h-4 mb-2 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="w-3/4 h-5 mb-4 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
          <div>
            <div className="w-24 h-4 mb-2 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="w-3/4 h-5 mb-4 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
          <div>
            <div className="w-24 h-4 mb-2 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="w-3/4 h-5 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
        </div>
      </div>

      {/* Order summary */}
      <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
        <div className="w-1/4 h-6 mb-4 bg-gray-200 rounded dark:bg-gray-700"></div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="w-20 h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="w-16 h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
          <div className="flex justify-between">
            <div className="w-24 h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="w-16 h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
          <div className="flex justify-between pt-3 border-t dark:border-gray-700">
            <div className="w-20 h-6 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="w-20 h-6 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsSkeletonLoader
