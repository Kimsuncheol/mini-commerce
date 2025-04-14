'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, getAdminUserIds } from '@/firebase/firebase';
import { Order, UserAddress } from '@/types';
import { format } from 'date-fns';
import AdminProtectedRoute from '../AdminProtectedRoute';

// Skeleton UI components for loading state
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="w-20 h-4 bg-gray-300 rounded dark:bg-gray-600"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="w-24 h-4 bg-gray-300 rounded dark:bg-gray-600"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="w-16 h-4 mb-1 bg-gray-300 rounded dark:bg-gray-600"></div>
      <div className="w-24 h-3 bg-gray-300 rounded dark:bg-gray-600"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="w-16 h-4 mb-1 bg-gray-300 rounded dark:bg-gray-600"></div>
      <div className="w-12 h-3 bg-gray-300 rounded dark:bg-gray-600"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="w-20 h-6 bg-gray-300 rounded-full dark:bg-gray-600"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="w-16 h-6 bg-gray-300 rounded-full dark:bg-gray-600"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex space-x-2">
        <div className="w-12 h-6 bg-gray-300 rounded dark:bg-gray-600"></div>
        <div className="w-20 h-6 bg-gray-300 rounded dark:bg-gray-600"></div>
      </div>
    </td>
  </tr>
);

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [adminFilter, setAdminFilter] = useState('all'); // 'all', 'customers', 'admins'
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);

  // Show initial loading skeleton for a minimum time
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 800); // Show skeleton for at least 800ms for better UX
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Get admin user IDs for filtering
        const adminIds = await getAdminUserIds();
        setAdminUserIds(adminIds);
        
        // Fetch all orders
        const ordersRef = collection(db, 'orders');
        const snapshot = await getDocs(ordersRef);
        
        const ordersData = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const orderData = docSnapshot.data() as Order;
            orderData.id = docSnapshot.id;
            
            // Add a flag to identify if order is from admin
            orderData.isAdminOrder = adminIds.includes(orderData.userId);
            
            // Convert Firestore timestamps to Date objects
            if (orderData.createdAt && typeof orderData.createdAt !== 'number') {
              orderData.createdAt = new Date((orderData.createdAt as any).toDate());
            }
            if (orderData.updatedAt && typeof orderData.updatedAt !== 'number') {
              orderData.updatedAt = new Date((orderData.updatedAt as any).toDate());
            }
            
            return orderData;
          })
        );
        
        // Sort by newest first
        const sortedOrders = ordersData.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : +a.createdAt;
          const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : +b.createdAt;
          return dateB - dateA;
        });
        
        setOrders(sortedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? {...order, status: newStatus, updatedAt: new Date()} : order
      ));
      
      // If the selected order is being updated, update it too
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({...selectedOrder, status: newStatus, updatedAt: new Date()});
      }
      
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };
  
  const handleViewOrderDetails = async (orderId: string) => {
    // If we're already viewing this order, just close it
    if (selectedOrder && selectedOrder.id === orderId) {
      setShowOrderDetails(false);
      setSelectedOrder(null);
      return;
    }
    
    // Otherwise, find the order and show its details
    const order = orders.find(order => order.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowOrderDetails(true);
    }
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
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  const getPaymentStatusBadgeClass = (status: Order['paymentStatus']) => {
    switch(status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (date: Date | number) => {
    if (date instanceof Date) {
      return format(date, 'MMM d, yyyy h:mm a');
    } else {
      return format(new Date(date), 'MMM d, yyyy h:mm a');
    }
  };
  
  const filteredOrders = orders.filter(order => {
    // Filter by search term
    const orderIdMatch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const userIdMatch = order.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const nameMatch = order.shippingAddress?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const searchMatch = orderIdMatch || userIdMatch || nameMatch;
    
    // Filter by status
    const statusMatch = statusFilter === '' || order.status === statusFilter;
    
    // Filter by admin/customer
    let adminMatch = true;
    if (adminFilter === 'customers') {
      adminMatch = !order.isAdminOrder;
    } else if (adminFilter === 'admins') {
      adminMatch = order.isAdminOrder;
    }
    
    return searchMatch && statusMatch && adminMatch;
  });

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="mb-6 text-3xl font-bold text-gray-800 dark:text-white">Order Management</h1>
      
      <div className="p-6 mb-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <div className="flex flex-col justify-between gap-4 mb-6 md:flex-row">
          <div className="w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search by order ID, customer ID or name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-1/4">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="w-full md:w-1/4">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
            >
              <option value="all">All Orders</option>
              <option value="customers">Customer Orders Only</option>
              <option value="admins">Admin Orders Only</option>
            </select>
          </div>
        </div>
        
        {/* Show skeleton UI during initial loading */}
        {initialLoading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Order ID</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Date</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Customer</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Total</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Status</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Payment</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {Array(5).fill(0).map((_, index) => (
                  <SkeletonRow key={index} />
                ))}
              </tbody>
            </table>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Order ID</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Date</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Customer</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Total</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Status</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Payment</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${order.isAdminOrder ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.id.substring(0, 8)}...
                          {order.isAdminOrder && (
                            <span className="inline-flex px-2 py-1 ml-2 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full dark:bg-blue-800 dark:text-blue-100">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {order.userId.substring(0, 8)}...
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {order.shippingAddress?.fullName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          ${order.total.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order.items.length} items
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewOrderDetails(order.id)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View
                          </button>
                          <div className="relative inline-block text-left">
                            <select
                              className="px-2 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600"
                              value={order.status}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value as Order['status'])}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Order Details</h2>
                <button 
                  onClick={() => setShowOrderDetails(false)} 
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-lg font-medium text-gray-800 dark:text-white">Order Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Order ID:</span> {selectedOrder.id}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Date:</span> {formatDate(selectedOrder.createdAt)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Payment Status:</span>
                      <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeClass(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Payment Method:</span> {selectedOrder.paymentMethod}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-medium text-gray-800 dark:text-white">Customer Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Customer ID:</span> {selectedOrder.userId}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Name:</span> {selectedOrder.shippingAddress?.fullName || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Address:</span> {selectedOrder.shippingAddress?.addressLine1}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.postalCode}, {selectedOrder.shippingAddress?.country}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Phone:</span> {selectedOrder.shippingAddress?.phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-white">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Product</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Price</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Quantity</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-10 h-10 mr-4">
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.name}
                                  className="object-cover w-10 h-10 rounded"
                                />
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                            ${item.price.toFixed(2)}
                            {item.originalPrice && (
                              <span className="ml-2 text-xs text-gray-400 line-through dark:text-gray-500">
                                ${item.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="pt-4 mt-8 border-t border-gray-200 dark:border-gray-700"></div>
                <div className="flex justify-end">
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Subtotal</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Shipping</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">${selectedOrder.shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Tax</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">${selectedOrder.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-base font-medium text-gray-900 dark:text-white">Total</span>
                      <span className="text-base font-medium text-gray-900 dark:text-white">${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                <select
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as Order['status'])}
                  aria-label="Change order status"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="px-4 py-2 text-sm text-gray-700 transition-colors border border-gray-300 rounded-md dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        
      )}
    </div>
  );
};

// Wrap Orders component with AdminProtectedRoute
const OrdersPage = () => {
  return (
    <AdminProtectedRoute>
      <Orders />
    </AdminProtectedRoute>
  );
};

export default OrdersPage;
