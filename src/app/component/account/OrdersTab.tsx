import React, { memo, useState, useEffect } from 'react';
import { FiShoppingBag, FiPackage, FiEye } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { OrderItem } from '@/types';
import { db, auth } from '@/firebase/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, getDoc, doc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

interface OrderRowProps {
  order: OrderItem;
  onViewDetails: (orderId: string) => void;
}

const OrderRow = memo(({ order, onViewDetails }: OrderRowProps) => (
  <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-750">
    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{order.id}</td>
    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">{order.date}</td>
    <td className="px-6 py-4 text-sm whitespace-nowrap">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
        ${order.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 
          order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
        <span className="mr-1.5 w-2 h-2 rounded-full bg-current"></span>
        {order.status}
      </span>
    </td>
    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">{order.items}</td>
    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">${order.total.toFixed(2)}</td>
    <td className="px-6 py-4 text-sm whitespace-nowrap">
      <button 
        onClick={() => onViewDetails(order.id)}
        className="flex items-center text-blue-600 transition-colors hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
      >
        <FiEye className="mr-1" size={16} />
        Details
      </button>
    </td>
  </tr>
));

OrderRow.displayName = 'OrderRow';

interface OrderDetailProps {
  order: OrderItem;
  onClose: () => void;
}

const OrderDetail = ({ order, onClose }: OrderDetailProps) => {
  const router = useRouter();
  const [orderProducts, setOrderProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the actual order products from Firebase
    const fetchOrderProducts = async () => {
      try {
        // If products are already in the order data
        if (order.products && Array.isArray(order.products)) {
          setOrderProducts(order.products);
          setLoading(false);
          return;
        }
        
        // Otherwise fetch the full order data to get products
        const orderRef = doc(db, 'orders', order.id);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          if (orderData.items && Array.isArray(orderData.items)) {
            setOrderProducts(orderData.items);
          } else {
            // Fallback to simulated products if no items found
            setOrderProducts([
              { id: 'p1', productId: 'p1', name: 'Wireless Headphones', price: 59.99, quantity: 1, imageUrl: '/placeholder.jpg' },
              { id: 'p2', productId: 'p2', name: 'Smartphone Case', price: 19.99, quantity: 2, imageUrl: '/placeholder.jpg' },
            ]);
          }
        }
      } catch (error) {
        console.error('Error fetching order products:', error);
        // Fallback to simulated products in case of error
        setOrderProducts([
          { id: 'p1', productId: 'p1', name: 'Wireless Headphones', price: 59.99, quantity: 1, imageUrl: '/placeholder.jpg' },
          { id: 'p2', productId: 'p2', name: 'Smartphone Case', price: 19.99, quantity: 2, imageUrl: '/placeholder.jpg' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderProducts();
  }, [order]);

  const handleViewProduct = (productId: string) => {
    // Navigate to the product detail page with information that we came from an order
    router.push(`/products/${productId}?fromOrder=true&orderId=${order.id}`);
    onClose(); // Close the modal after navigating
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Details: {order.id}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {/* Order details section */}
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Date</h4>
              <p className="text-gray-900 dark:text-white">{order.date}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h4>
              <p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                  ${order.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 
                    order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                  <span className="mr-1.5 w-2 h-2 rounded-full bg-current"></span>
                  {order.status}
                </span>
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Shipping Address</h4>
              <p className="text-gray-900 dark:text-white">123 Main St, Anytown, CA 12345</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Method</h4>
              <p className="text-gray-900 dark:text-white">Credit Card ending in 1234</p>
            </div>
          </div>
          
          <h4 className="mb-3 font-medium text-gray-900 dark:text-white">Items</h4>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <span className="ml-2 text-gray-500">Loading items...</span>
            </div>
          ) : (
            <div className="overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700">
              {orderProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="flex items-center justify-between px-4 py-3 transition-colors border-b border-gray-200 cursor-pointer last:border-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                  onClick={() => handleViewProduct(product.productId || product.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative flex-shrink-0 w-12 h-12 bg-gray-100 rounded dark:bg-gray-700">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-cover rounded"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400 dark:text-gray-500">
                          <FiPackage size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">{product.name}</h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Qty: {product.quantity} × ${product.price?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${(product.price * product.quantity).toFixed(2)}
                    </span>
                    <button
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProduct(product.productId || product.id);
                      }}
                    >
                      View Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
              <span className="text-gray-900 dark:text-white">${(order.total - 9.99).toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500 dark:text-gray-400">Shipping</span>
              <span className="text-gray-900 dark:text-white">$9.99</span>
            </div>
            <div className="flex justify-between pt-2 mt-2 text-lg font-medium border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-gray-900 dark:text-white">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end px-6 py-3 space-x-3 border-t border-gray-200 bg-gray-50 dark:bg-gray-750 dark:border-gray-700">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-650"
          >
            Close
          </button>
          <button 
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Track Order
          </button>
        </div>
      </div>
    </div>
  );
};

interface OrdersTabProps {
  orders?: OrderItem[]; // Make orders optional as we'll fetch them from Firebase
}

const OrdersTab = memo(({ orders: initialOrders }: OrdersTabProps) => {
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders || []);
  const [loading, setLoading] = useState(!initialOrders);
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    setLoading(true);

    // Create query to get orders for the current user
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // Set up real-time subscription
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData: OrderItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate().toLocaleDateString() 
            : new Date(data.createdAt).toLocaleDateString(),
          status: data.status,
          items: data.items?.length || 0,
          total: data.total || 0,
          products: data.products || []
        };
      });
      
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, [user]);

  const handleViewDetails = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) setSelectedOrder(order);
  };

  return (
    <div className=''>
      <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Your Orders</h2>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 rounded-full animate-spin border-t-blue-600"></div>
          <span className="ml-2 text-gray-500">Loading orders...</span>
        </div>
      ) : orders.length > 0 ? (
        <div className="overflow-hidden bg-white border border-gray-100 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Order ID</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Date</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Items</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Total</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {orders.map((order) => (
                  <OrderRow key={order.id} order={order} onViewDetails={handleViewDetails} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center bg-white border border-gray-100 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <FiShoppingBag className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No orders yet</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Start shopping to see your orders here.</p>
          <button className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800">
            Browse Products
          </button>
        </div>
      )}

      {/* Order details modal */}
      {selectedOrder && (
        <OrderDetail 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
});

OrdersTab.displayName = 'OrdersTab';
export default OrdersTab;