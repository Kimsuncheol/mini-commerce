import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FiX, FiPackage } from 'react-icons/fi'
import { formatCurrency } from '@/utils/formatters'

interface OrderDetailsProps {
  order: any
  onClose: () => void
}

function OrderDetails({ order, onClose }: OrderDetailsProps) {
  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Status steps array
  const statusSteps = ['processing', 'shipped', 'delivered']
  const currentStepIndex = statusSteps.findIndex(step => step === order.status)
  
  // Don't show progress for cancelled orders
  const showProgress = order.status !== 'cancelled'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h2>
          <button 
            onClick={onClose}
            className="p-1 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Order ID</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{order.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Order Date</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(order.createdAt)}</p>
              </div>
            </div>
            
            {showProgress && (
              <div className="my-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-1 bg-gray-200 rounded dark:bg-gray-700"></div>
                  </div>
                  <div className="relative flex justify-between">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= currentStepIndex
                      const isCurrent = index === currentStepIndex
                      
                      return (
                        <div 
                          key={step}
                          className="flex flex-col items-center"
                        >
                          <div className={`
                            w-6 h-6 flex items-center justify-center rounded-full
                            ${isCompleted ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}
                            ${isCurrent ? 'ring-2 ring-indigo-300 dark:ring-indigo-800' : ''}
                          `}>
                            {isCompleted && (
                              <span className="text-xs text-white">✓</span>
                            )}
                          </div>
                          <p className={`mt-2 text-xs font-medium ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {step.charAt(0).toUpperCase() + step.slice(1)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {order.status === 'cancelled' && (
              <div className="p-4 mb-6 border-l-4 border-red-500 rounded-r bg-red-50 dark:bg-red-900/20 dark:border-red-400">
                <p className="text-sm text-red-700 dark:text-red-400">
                  This order was cancelled{order.cancelReason ? `: ${order.cancelReason}` : ''}
                </p>
              </div>
            )}
          </div>
          
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Items</h3>
          <div className="mb-6 space-y-4">
            {order.items?.map((item: any, index: number) => (
              <div 
                key={index} 
                className="flex items-center py-3 space-x-4 border-b dark:border-gray-700 last:border-b-0"
              >
                <div className="relative w-16 h-16 overflow-hidden bg-gray-100 rounded-md dark:bg-gray-700">
                  {item.imageUrl ? (
                    <Image 
                      src={item.imageUrl} 
                      alt={item.name} 
                      fill 
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <FiPackage className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate dark:text-white">{item.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Qty: {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4 space-y-2 border-t dark:border-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="text-gray-900 dark:text-gray-100">{formatCurrency(order.subtotal || order.totalAmount)}</span>
            </div>
            {order.shippingCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="text-gray-900 dark:text-gray-100">{formatCurrency(order.shippingCost)}</span>
              </div>
            )}
            {(order.tax || order.taxAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span className="text-gray-900 dark:text-gray-100">{formatCurrency(order.tax || order.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-white">Total</span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
          
          {order.shippingAddress && (
            <div className="pt-6 mt-8 border-t dark:border-gray-700">
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Shipping Address</h3>
              <address className="space-y-1 not-italic text-gray-600 dark:text-gray-300">
                <p>{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
              </address>
            </div>
          )}
          
          {order.paymentMethod && (
            <div className="pt-6 mt-6 border-t dark:border-gray-700">
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Payment Information</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Payment Method: {order.paymentMethod}
                {order.paymentId && ` (ID: ${order.paymentId})`}
              </p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t rounded-b-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 font-medium text-white transition-colors bg-indigo-600 rounded hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default OrderDetails
