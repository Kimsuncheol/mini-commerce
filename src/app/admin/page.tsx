'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db, getAdminUserIds } from '@/firebase/firebase';
import { Order } from '@/types';
import { format } from 'date-fns';
import AdminProtectedRoute from './AdminProtectedRoute';

// Skeleton components for loading states
const MetricCardSkeleton = () => (
  <div className="flex flex-col h-full p-6 bg-white rounded-lg shadow-md animate-pulse dark:bg-gray-800">
    <div className="w-24 h-3 mb-2 bg-gray-300 rounded-full dark:bg-gray-600" />
    <div className="w-16 h-6 mb-2 bg-gray-300 rounded-full dark:bg-gray-600" />
    <div className="w-full h-2 mt-2 bg-gray-300 rounded-full dark:bg-gray-600" />
  </div>
);

const RecentOrderSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="w-20 h-4 bg-gray-300 rounded dark:bg-gray-600"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="w-24 h-4 bg-gray-300 rounded dark:bg-gray-600"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="w-16 h-4 bg-gray-300 rounded dark:bg-gray-600"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="w-20 h-4 bg-gray-300 rounded dark:bg-gray-600"></div>
    </td>
  </tr>
);

const ChartSkeleton = () => (
  <div className="w-full p-6 bg-white rounded-lg shadow-md animate-pulse h-72 dark:bg-gray-800">
    <div className="w-32 h-4 mb-6 bg-gray-300 rounded-full dark:bg-gray-600" />
    <div className="flex items-end justify-around w-full h-48">
      {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
        <div 
          key={i} 
          className="w-8 bg-gray-300 rounded-t dark:bg-gray-600"
          style={{ height: `${Math.random() * 80 + 20}%` }}
        />
      ))}
    </div>
  </div>
);

const CustomerSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="w-24 h-4 bg-gray-300 rounded dark:bg-gray-600"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="w-32 h-4 bg-gray-300 rounded dark:bg-gray-600"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="w-20 h-4 bg-gray-300 rounded dark:bg-gray-600"></div>
    </td>
  </tr>
);

// Type definition for user data
interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt?: any; // Firestore timestamp
  lastLoginAt?: any; // Firestore timestamp
  photoURL?: string;
  orders?: number;
  totalSpent?: number;
  role?: string;
  isAdmin?: boolean;
  userType?: string;
}

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    averageOrderValue: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });
  const [customerData, setCustomerData] = useState<{
    totalCustomers: number;
    recentCustomers: User[];
    averageSpentPerCustomer: number;
  }>({
    totalCustomers: 0,
    recentCustomers: [],
    averageSpentPerCustomer: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get all admin user IDs first to filter them out
        const adminUserIds = await getAdminUserIds();
        
        // Fetch all orders for metrics calculation
        const ordersRef = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersRef);
        const allOrders = ordersSnapshot.docs.map(doc => {
          const data = doc.data() as Order;
          return { ...data, id: doc.id };
        });
        
        // Filter out orders from admin users
        const customerOrders = allOrders.filter(order => !adminUserIds.includes(order.userId));
        
        // Calculate metrics using only customer orders
        const totalRevenue = customerOrders.reduce((sum, order) => sum + order.total, 0);
        const pendingOrders = customerOrders.filter(order => order.status === 'pending').length;
        const averageOrderValue = customerOrders.length > 0 ? totalRevenue / customerOrders.length : 0;
        
        // Calculate counts by status
        const counts = customerOrders.reduce((acc, order) => {
          const status = order.status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // Fetch recent orders (excluding admin orders)
        const recentOrdersList = allOrders
          .filter(order => !adminUserIds.includes(order.userId))
          .sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 
              typeof a.createdAt === 'object' && a.createdAt?.seconds ? a.createdAt.seconds * 1000 : +a.createdAt;
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 
              typeof b.createdAt === 'object' && b.createdAt?.seconds ? b.createdAt.seconds * 1000 : +b.createdAt;
            return dateB - dateA;
          })
          .slice(0, 5);
        
        // Fetch user data
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const allUsers = usersSnapshot.docs.map(doc => {
          const userData = doc.data() as User;
          return { ...userData, uid: doc.id };
        });
        
        // Filter out admin users from the customer list
        const customers = allUsers.filter(user => !adminUserIds.includes(user.uid));
        
        // Calculate user metrics
        const userOrderMap = customerOrders.reduce((acc, order) => {
          if (!acc[order.userId]) {
            acc[order.userId] = {
              orders: 0,
              spent: 0
            };
          }
          acc[order.userId].orders += 1;
          acc[order.userId].spent += order.total;
          return acc;
        }, {} as Record<string, { orders: number, spent: number }>);
        
        // Enrich user data with order information
        const enrichedCustomers = customers.map(user => ({
          ...user,
          orders: userOrderMap[user.uid]?.orders || 0,
          totalSpent: userOrderMap[user.uid]?.spent || 0
        }));
        
        // Calculate average spent per customer with orders
        const customersWithOrders = enrichedCustomers.filter(user => user.orders > 0);
        const avgSpent = customersWithOrders.length > 0 
          ? customersWithOrders.reduce((sum, user) => sum + user.totalSpent, 0) / customersWithOrders.length 
          : 0;
        
        // Get recent customers (excluding admins)
        const recentCustomers = [...enrichedCustomers]
          .sort((a, b) => {
            // Sort by creation date if available
            if (a.createdAt && b.createdAt) {
              const dateA = typeof a.createdAt === 'object' && a.createdAt?.seconds ? a.createdAt.seconds : 0;
              const dateB = typeof b.createdAt === 'object' && b.createdAt?.seconds ? b.createdAt.seconds : 0;
              return dateB - dateA;
            }
            return 0;
          })
          .slice(0, 5);
        
        setMetrics({
          totalOrders: customerOrders.length,
          totalRevenue,
          pendingOrders,
          averageOrderValue
        });
        setStatusCounts(counts);
        setRecentOrders(recentOrdersList);
        setCustomerData({
          // We only count non-admin users as customers
          totalCustomers: customers.length,
          recentCustomers,
          averageSpentPerCustomer: avgSpent
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        // Simulate loading for a better UX
        setTimeout(() => setLoading(false), 800);
      }
    };
    
    fetchDashboardData();
  }, []);

  const formatDate = (date: Date | number | any) => {
    if (date instanceof Date) {
      return format(date, 'MMM d, yyyy');
    } else if (typeof date === 'object' && date?.seconds) {
      // Handle Firestore timestamp
      return format(new Date(date.seconds * 1000), 'MMM d, yyyy');
    } else if (date) {
      return format(new Date(date), 'MMM d, yyyy');
    }
    return 'N/A';
  };

  const getStatusBadgeClass = (status: Order['status']) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:text-green-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="mb-6 text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
      
      {/* Metrics Section */}
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h2 className="mb-2 text-sm font-medium text-gray-500 uppercase dark:text-gray-400">Total Orders</h2>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{metrics.totalOrders}</p>
              <div className="h-2 mt-2 overflow-hidden bg-blue-100 rounded dark:bg-blue-900">
                <div className="w-full h-full bg-blue-500"></div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h2 className="mb-2 text-sm font-medium text-gray-500 uppercase dark:text-gray-400">Revenue</h2>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">${metrics.totalRevenue.toFixed(2)}</p>
              <div className="h-2 mt-2 overflow-hidden bg-green-100 rounded dark:bg-green-900">
                <div className="w-full h-full bg-green-500"></div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h2 className="mb-2 text-sm font-medium text-gray-500 uppercase dark:text-gray-400">Total Customers</h2>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{customerData.totalCustomers}</p>
              <div className="h-2 mt-2 overflow-hidden bg-indigo-100 rounded dark:bg-indigo-900">
                <div className="w-full h-full bg-indigo-500"></div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h2 className="mb-2 text-sm font-medium text-gray-500 uppercase dark:text-gray-400">Avg. Customer Value</h2>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                ${customerData.averageSpentPerCustomer.toFixed(2)}
              </p>
              <div className="h-2 mt-2 overflow-hidden bg-purple-100 rounded dark:bg-purple-900">
                <div className="w-full h-full bg-purple-500"></div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h2 className="mb-2 text-sm font-medium text-gray-500 uppercase dark:text-gray-400">Pending Orders</h2>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{metrics.pendingOrders}</p>
              <div className="h-2 mt-2 overflow-hidden bg-yellow-100 rounded dark:bg-yellow-900">
                <div className="w-full h-full bg-yellow-500"></div>
              </div>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h2 className="mb-2 text-sm font-medium text-gray-500 uppercase dark:text-gray-400">Avg. Order Value</h2>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">${metrics.averageOrderValue.toFixed(2)}</p>
              <div className="h-2 mt-2 overflow-hidden bg-pink-100 rounded dark:bg-pink-900">
                <div className="w-full h-full bg-pink-500"></div>
              </div>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h2 className="mb-2 text-sm font-medium text-gray-500 uppercase dark:text-gray-400">Completed Orders</h2>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {statusCounts.delivered || 0}
              </p>
              <div className="h-2 mt-2 overflow-hidden bg-green-100 rounded dark:bg-green-900">
                <div className="w-full h-full bg-green-500"></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Chart and Status Distribution */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {/* Order Status Distribution */}
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white">Order Status Distribution</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <span className={`inline-block px-2 py-1 mb-2 text-xs font-semibold rounded-full ${getStatusBadgeClass(status as Order['status'])}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    <p className="text-xl font-semibold text-gray-800 dark:text-white">{count}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">orders</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Simplified Chart Representation */}
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white">Revenue Trend (Visual Representation)</h2>
              <div className="flex items-end h-48 mt-6 space-x-2">
                {Array(7).fill(0).map((_, i) => (
                  <div key={i} className="relative flex flex-col items-center flex-1">
                    <div 
                      className="w-full bg-blue-500 rounded-t dark:bg-blue-600"
                      style={{ height: `${30 + Math.random() * 70}%` }}
                    ></div>
                    <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Day {i + 1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  * For illustration purposes
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Orders Section */}
      <div className="p-6 mb-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">Recent Orders</h2>
          <Link href="/admin/orders" className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
            View All
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Order ID</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Date</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Total</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {loading ? (
                <>
                  <RecentOrderSkeleton />
                  <RecentOrderSkeleton />
                  <RecentOrderSkeleton />
                </>
              ) : recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${order.total.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                    No recent orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recent Customers Section */}
      <div className="p-6 mb-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">Recent Customers</h2>
          <Link href="/admin/customers" className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
            View All
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Customer</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Email</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Joined Date</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Orders</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Total Spent</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {loading ? (
                <>
                  <CustomerSkeleton />
                  <CustomerSkeleton />
                  <CustomerSkeleton />
                </>
              ) : customerData.recentCustomers.length > 0 ? (
                customerData.recentCustomers.map((customer) => (
                  <tr key={customer.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8">
                          <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-blue-500 rounded-full">
                            {customer.displayName ? customer.displayName[0].toUpperCase() : 
                             customer.email ? customer.email[0].toUpperCase() : 'U'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.displayName || 'Anonymous User'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(customer.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.orders || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${(customer.totalSpent || 0).toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Quick Links Section */}
      <div className="grid grid-cols-1 gap-6 mt-8 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/orders" className="block p-6 transition-shadow bg-white rounded-lg shadow-md dark:bg-gray-800 hover:shadow-lg">
          <h3 className="mb-2 text-lg font-medium text-gray-800 dark:text-white">Orders Management</h3>
          <p className="text-gray-600 dark:text-gray-400">View and manage all customer orders</p>
        </Link>
        
        <Link href="/admin/products" className="block p-6 transition-shadow bg-white rounded-lg shadow-md dark:bg-gray-800 hover:shadow-lg">
          <h3 className="mb-2 text-lg font-medium text-gray-800 dark:text-white">Product Management</h3>
          <p className="text-gray-600 dark:text-gray-400">Add, edit or delete products</p>
        </Link>
        
        <Link href="/admin/coupons" className="block p-6 transition-shadow bg-white rounded-lg shadow-md dark:bg-gray-800 hover:shadow-lg">
          <h3 className="mb-2 text-lg font-medium text-gray-800 dark:text-white">Coupon Management</h3>
          <p className="text-gray-600 dark:text-gray-400">Create and manage promotional coupons</p>
        </Link>
        
        <Link href="/admin/customers" className="block p-6 transition-shadow bg-white rounded-lg shadow-md dark:bg-gray-800 hover:shadow-lg">
          <h3 className="mb-2 text-lg font-medium text-gray-800 dark:text-white">Customer Accounts</h3>
          <p className="text-gray-600 dark:text-gray-400">Manage customer information</p>
        </Link>
      </div>
    </div>
  );
}

// Wrap the admin dashboard component with the admin protection
function AdminDashboardPage() {
  return (
    <AdminProtectedRoute>
      <AdminDashboard />
    </AdminProtectedRoute>
  );
}

export default AdminDashboardPage;