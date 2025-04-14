'use client'

import React, { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/firebase/firebase'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import BackButton from '../component/ui/BackButton'
import OrdersList from '../component/orders/OrdersList'
import OrdersFilter from '../component/orders/OrdersFilter'
import EmptyOrdersState from '../component/orders/EmptyOrdersState'
import OrderDetailsSkeletonLoader from '../component/orders/OrderDetailsSkeletonLoader'
import { motion } from 'framer-motion'
import { fadeIn } from '@/utils/animations'

function OrdersPage() {
  const [user, authLoading] = useAuthState(auth)
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'processing', 'shipped', 'delivered', 'cancelled'
  
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0)
    
    const fetchOrders = async () => {
      if (!user?.email) {
        if (!authLoading) setLoading(false)
        return
      }
      
      try {
        const ordersRef = collection(db, 'orders')
        const q = query(
          ordersRef, 
          where('userEmail', '==', user.email),
          orderBy('createdAt', 'desc')
        )
        
        const querySnapshot = await getDocs(q)
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        setOrders(ordersData)
        setFilteredOrders(ordersData)
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrders()
  }, [user, authLoading])
  
  // Apply filters when filter state changes
  useEffect(() => {
    if (filter === 'all') {
      setFilteredOrders(orders)
    } else {
      const filtered = orders.filter(order => order.status === filter)
      setFilteredOrders(filtered)
    }
  }, [filter, orders])
  
  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-gray-900">
        <div className="p-4 md:p-6">
          <BackButton destination="/" />
        </div>
        
        <div className="flex items-center justify-center h-[80vh]">
          <div className="p-6 text-center">
            <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-white">
              Sign in to view your orders
            </h2>
            <a href="/login" className="px-5 py-2 text-white transition-colors bg-indigo-600 rounded-md hover:bg-indigo-700">
              Sign in
            </a>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header with BackButton */}
        <div className="flex items-center mb-8">
          <div className="mr-4">
            <BackButton destination="/" />
          </div>
          <motion.h1 
            className="text-3xl font-bold text-gray-900 dark:text-white"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            My Orders
          </motion.h1>
        </div>
        
        {/* Show skeleton loader while loading */}
        {(loading || authLoading) ? (
          <OrderDetailsSkeletonLoader />
        ) : (
          <>
            {orders.length === 0 ? (
              <EmptyOrdersState />
            ) : (
              <motion.div 
                variants={fadeIn}
                initial="hidden"
                animate="visible"
              >
                <OrdersFilter 
                  activeFilter={filter} 
                  setFilter={setFilter} 
                  orderCounts={{
                    all: orders.length,
                    processing: orders.filter(order => order.status === 'processing').length,
                    shipped: orders.filter(order => order.status === 'shipped').length,
                    delivered: orders.filter(order => order.status === 'delivered').length,
                    cancelled: orders.filter(order => order.status === 'cancelled').length,
                  }}
                />
                
                <OrdersList orders={filteredOrders} />
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default OrdersPage