import React from 'react'
import { FiClock, FiTruck, FiCheck, FiX, FiPackage } from 'react-icons/fi'

interface OrderCountsType {
  all: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
}

interface OrdersFilterProps {
  activeFilter: string
  setFilter: (filter: string) => void
  orderCounts: OrderCountsType
}

function OrdersFilter({ activeFilter, setFilter, orderCounts }: OrdersFilterProps) {
  const filters = [
    { id: 'all', name: 'All Orders', icon: <FiPackage />, count: orderCounts.all },
    { id: 'processing', name: 'Processing', icon: <FiClock />, count: orderCounts.processing },
    { id: 'shipped', name: 'Shipped', icon: <FiTruck />, count: orderCounts.shipped },
    { id: 'delivered', name: 'Delivered', icon: <FiCheck />, count: orderCounts.delivered },
    { id: 'cancelled', name: 'Cancelled', icon: <FiX />, count: orderCounts.cancelled }
  ]
  
  return (
    <div className="mb-8">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex py-2 space-x-4 overflow-x-auto" aria-label="Order filters">
          {filters.map((tab) => {
            const isActive = activeFilter === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`
                  whitespace-nowrap px-3 py-2 font-medium text-sm rounded-md flex items-center space-x-2
                  ${isActive 
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}>
                  {tab.icon}
                </span>
                <span>{tab.name}</span>
                {tab.count > 0 && (
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${isActive 
                      ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default OrdersFilter
