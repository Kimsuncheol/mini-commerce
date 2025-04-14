import React from 'react'
import Link from 'next/link'
import { FiShoppingBag } from 'react-icons/fi'
import { motion } from 'framer-motion'

function EmptyOrdersState() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-16 text-center"
    >
      <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-indigo-100 rounded-full dark:bg-indigo-900/30">
        <FiShoppingBag className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
      </div>
      
      <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
        No orders yet
      </h2>
      
      <p className="max-w-md mx-auto mb-8 text-gray-600 dark:text-gray-400">
        You haven't placed any orders yet. Start shopping and discover our amazing products!
      </p>
      
      <Link href="/products" className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Explore products
      </Link>
    </motion.div>
  )
}

export default EmptyOrdersState
