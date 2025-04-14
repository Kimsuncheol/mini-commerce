import React from 'react'
import Image from 'next/image'
import { formatCurrency } from '@/utils/formatters'
import { FiClock, FiTruck, FiCheck, FiX, FiPackage, FiEye } from 'react-icons/fi'

interface OrderCardProps {
  order: any
  onViewDetails: () => void
}

function OrderCard({ order, onViewDetails }: OrderCardProps) {
  // Format date to be more readable
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get status icon based on order status
  const getStatusIcon = () => {
    switch (order.status) {
      case 'processing':
        return <FiClock className="w-5 h-5 text-yellow-500" />
      case 'shipped':
        return <FiTruck className="w-5 h-5 text-blue-500" />
      case 'delivered':
        return <FiCheck className="w-5 h-5 text-green-500" />
      case 'cancelled':
        return <FiX className="w-5 h-5 text-red-500" />
      default:
        return <FiPackage className="w-5 h-5 text-gray-500" />
    }
  }

  // Get status color for the badge
  const getStatusColor = () => {
    switch (order.status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  return (
    <div className="overflow-hidden transition-all bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 hover:shadow-lg dark:border-gray-700">
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
          <div>
            <div className="flex items-center mb-2 space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Order ID: {order.id.substring(0, 8)}...
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            
            <p className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
              {formatCurrency(order.totalAmount)}
            </p>
            
            <div className="flex items-center mb-4 space-x-3">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="mr-1">{order.items?.length || 0} items</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center mt-4 sm:mt-0">
            <div className="flex mr-4 -space-x-2">
              {(order.items || []).slice(0, 3).map((item: any, index: number) => (
                <div 
                  key={index}
                  className="relative w-10 h-10 overflow-hidden bg-gray-200 border-2 border-white rounded-full dark:border-gray-800 dark:bg-gray-700"
                >
                  {item.imageUrl ? (
                    <Image 
                      src={item.imageUrl} 
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400">
                      <FiPackage />
                    </div>
                  )}
                </div>
              ))}
              {order.items && order.items.length > 3 && (
                <div className="relative flex items-center justify-center w-10 h-10 bg-gray-100 border-2 border-white rounded-full dark:border-gray-800 dark:bg-gray-700">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    +{order.items.length - 3}
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={onViewDetails}
              className="flex items-center space-x-1 text-indigo-600 transition-colors hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <FiEye className="w-4 h-4" />
              <span>View details</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Status: </span>
              <span className="text-gray-800 dark:text-gray-200">
                {order.statusMessage || `Your order is ${order.status}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderCard
