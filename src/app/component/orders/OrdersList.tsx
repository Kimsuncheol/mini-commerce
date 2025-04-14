import React, { useState } from 'react'
import OrderCard from './OrderCard'
import OrderDetails from './OrderDetails'
import OrderDetailsSkeletonLoader from './OrderDetailsSkeletonLoader'
import { motion, AnimatePresence } from 'framer-motion'

interface OrdersListProps {
  orders: any[]
}

function OrdersList({ orders }: OrdersListProps) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const handleViewDetails = async (order: any) => {
    setSelectedOrder(order)
    setShowDetails(true)
    
    // Simulate loading details if needed
    setLoadingDetails(true)
    
    // If you need to fetch additional order details, do it here
    try {
      // For example:
      // const details = await fetchOrderDetails(order.id);
      // setSelectedOrder({...order, ...details});
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error loading order details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const closeDetails = () => {
    setShowDetails(false)
  }

  // Animation for list items
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {loadingDetails ? (
                <OrderDetailsSkeletonLoader />
              ) : (
                <OrderDetails order={selectedOrder} onClose={closeDetails} />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        className="space-y-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {orders.map((order) => (
          <motion.div 
            key={order.id}
            variants={item}
            layout
          >
            <OrderCard 
              order={order} 
              onViewDetails={() => handleViewDetails(order)} 
            />
          </motion.div>
        ))}
      </motion.div>
      
      {orders.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">No orders found with the selected filter.</p>
        </div>
      )}
    </div>
  )
}

export default OrdersList
