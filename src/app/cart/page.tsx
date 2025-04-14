'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiTrash2, FiArrowLeft, FiShoppingBag, FiTag, FiX, FiGift } from 'react-icons/fi';
import { CartItem, AppliedCoupon, Coupon } from '@/types';
import {
  auth,
  subscribeToCartChanges,
  updateCartQuantity,
  removeCartItem,
  clearCart
} from '@/firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { CurrencyCode, formatCurrencyAmount } from '@/utils/currencyUtils';
import { calculateShippingFee } from '@/utils/shippingFee';
import {
  PayPalScriptProvider,
  PayPalButtons
} from "@paypal/react-paypal-js";
import { applyCoupon, getUserCoupons } from '@/app/services/couponService';
import { toast } from 'react-hot-toast';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);
  const [currencyCode] = useState<CurrencyCode>('USD'); // Default currency
  const [shippingFee, setShippingFee] = useState(15.99);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(200);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);

  // PayPal initial options
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
    currency: currencyCode,
    intent: "capture",
  };

  // Handle successful payment
  const handlePaymentSuccess = (details: any) => {
    console.log("Payment completed successfully!", details);
    setPaymentSuccess(true);

    // You would typically handle order processing here:
    // 1. Send order details to your backend
    // 2. Clear the cart
    // 3. Redirect to order confirmation page
    if (user && user.email) {
      clearCart(user.email, cartItems);
    }

    // Show success message or redirect
    alert(`Payment completed! Transaction ID: ${details.id}`);
  };

  useEffect(() => {
    if (!user || !user.email) {
      setLoading(false);
      setCartItems([]);
      return;
    }

    // Use the subscribeToCartChanges function from firebase.ts
    const unsubscribe = subscribeToCartChanges(
      user.email,
      (items) => {
        setCartItems(items);
        setLoading(false);
        
        // Fetch available coupons when cart items change
        if (items.length > 0 && user.uid) {
          fetchAvailableCoupons(user.uid, items);
        }
      },
      (error) => {
        console.error("Error fetching cart:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Fetch available coupons for current cart items
  const fetchAvailableCoupons = async (userId: string, items: CartItem[]) => {
    if (!userId || items.length === 0) return;
    
    setLoadingCoupons(true);
    try {
      // Get all coupons for the user
      const userCoupons = await getUserCoupons(userId);
      
      // Get product IDs for validation
      const productIds = items.map(item => item.id);
      
      // Get category IDs for validation if available (handle the case where category might not exist)
      const categoryIds = items
        .map(item => (item as any).category)
        .filter(Boolean) as string[];
      
      // Filter coupons that are applicable for this cart
      const applicableCoupons = userCoupons.filter(coupon => {
        // Check if coupon has product restrictions and if any cart item matches
        if (coupon.products && coupon.products.length > 0) {
          return productIds.some(id => coupon.products?.includes(id));
        }
        
        // Check if coupon has category restrictions and if any cart item matches
        if (coupon.categories && coupon.categories.length > 0) {
          return categoryIds.some(category => coupon.categories?.includes(category));
        }
        
        // Check if the subtotal meets minimum purchase requirement
        return !coupon.minPurchase || subtotal >= coupon.minPurchase;
      });
      
      setAvailableCoupons(applicableCoupons);
    } catch (error) {
      console.error('Error fetching available coupons:', error);
      toast.error('Failed to load available coupons');
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Apply a coupon from the available coupons list
  const applyCouponFromList = async (coupon: Coupon) => {
    setCouponCode(coupon.code);
    await handleApplyCoupon(coupon.code);
    setShowCoupons(false);
  };

  // Calculate cart totals with safeguards against NaN values
  const subtotal = cartItems.reduce((sum, item) => {
    const itemTotal = item.price && item.quantity ? item.price * item.quantity : 0;
    return sum + itemTotal;
  }, 0);

  const tax = subtotal * 0.1; // Assuming 10% tax

  // Update shipping fee when subtotal or currency changes
  useEffect(() => {
    const updateShipping = async () => {
      try {
        if (subtotal > 0) {
          const shippingResult = await calculateShippingFee(subtotal, currencyCode);
          setShippingFee(shippingResult.fee || 0);
          setFreeShippingThreshold(shippingResult.freeShippingThreshold || 200);
        } else {
          setShippingFee(0);
        }
      } catch (error) {
        console.error("Error calculating shipping fee:", error);
        setShippingFee(0); // Fallback to zero on error
      }
    };

    updateShipping();
  }, [subtotal, currencyCode]);

  // Apply actual shipping calculation
  const actualShippingFee = subtotal > 0 && subtotal < freeShippingThreshold ? shippingFee : 0;

  // Calculate total with discount
  const total = subtotal + tax + actualShippingFee - discount;

  // Handle coupon application
  const handleApplyCoupon = async (code?: string) => {
    const codeToApply = code || couponCode;
    
    if (!codeToApply.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    if (!user?.uid) {
      toast.error('Please login to apply coupon');
      return;
    }
    
    try {
      setCouponLoading(true);
      
      // Get product IDs for validation
      const productIds = cartItems.map(item => item.id);
      
      // Get category IDs for validation
      const categoryIds = cartItems
        .map(item => (item as any).category)
        .filter(Boolean) as string[];
      
      // Apply the coupon
      const newAppliedCoupon = await applyCoupon(
        codeToApply,
        user.uid,
        subtotal,
        productIds,
        categoryIds
      );
      
      setAppliedCoupon(newAppliedCoupon);
      setDiscount(newAppliedCoupon.discountAmount);
      
      toast.success(`Coupon applied! You saved ${formatCurrencyAmount(newAppliedCoupon.discountAmount, currencyCode)}`);
      
      // Clear the input if it was manually entered
      if (!code) {
        setCouponCode('');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to apply coupon');
      }
    } finally {
      setCouponLoading(false);
    }
  };
  
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    toast.success('Coupon removed');
  };

  // Create order data for PayPal including coupon information
  const createOrderForPayPal = (data: any, actions: any) => {
    return actions.order.create({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            value: total.toFixed(2),
            currency_code: currencyCode,
            breakdown: {
              item_total: {
                currency_code: currencyCode,
                value: subtotal.toFixed(2)
              },
              tax_total: {
                currency_code: currencyCode,
                value: tax.toFixed(2)
              },
              shipping: {
                currency_code: currencyCode,
                value: actualShippingFee.toFixed(2)
              },
              discount: {
                currency_code: currencyCode,
                value: discount.toFixed(2)
              }
            }
          },
          description: `Order with ${cartItems.length} items`,
          custom_id: appliedCoupon ? `coupon-${appliedCoupon.code}` : undefined
        }
      ]
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="container max-w-6xl px-4 py-8 mx-auto">
        <h1 className="mb-8 text-2xl font-bold text-gray-800 dark:text-white">Your Shopping Cart</h1>
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="w-full space-y-4 lg:w-2/3">
            {[1, 2].map(i => (
              <div key={i} className="flex p-4 bg-white border rounded-lg dark:border-gray-700 dark:bg-gray-800 animate-pulse">
                <div className="w-24 h-24 bg-gray-300 rounded dark:bg-gray-700"></div>
                <div className="flex-1 ml-4 space-y-2">
                  <div className="w-3/4 h-5 bg-gray-300 rounded dark:bg-gray-700"></div>
                  <div className="w-1/4 h-4 bg-gray-300 rounded dark:bg-gray-700"></div>
                  <div className="w-32 h-8 mt-2 bg-gray-300 rounded dark:bg-gray-700"></div>
                </div>
                <div className="w-24 h-8 bg-gray-300 rounded dark:bg-gray-700"></div>
              </div>
            ))}
          </div>
          <div className="w-full h-64 bg-gray-300 rounded lg:w-1/3 dark:bg-gray-700 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="container max-w-6xl px-4 py-12 mx-auto">
        <div className="py-16 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
          <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full dark:bg-gray-700">
            <FiShoppingBag className="w-12 h-12 text-gray-500 dark:text-gray-400" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">Your cart is empty</h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400">Looks like you haven't added any items to your cart yet.</p>
          <Link href="/products" className="inline-flex items-center px-6 py-3 font-medium text-white transition duration-200 bg-indigo-600 rounded-md hover:bg-indigo-700">
            <FiArrowLeft className="mr-2" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Payment success state
  if (paymentSuccess) {
    return (
      <div className="container max-w-6xl px-4 py-12 mx-auto">
        <div className="py-16 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
          <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 text-green-500 bg-green-100 rounded-full dark:bg-green-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">Payment Successful!</h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400">Thank you for your purchase. Your order has been processed.</p>
          <Link href="/products" className="inline-flex items-center px-6 py-3 font-medium text-white transition duration-200 bg-indigo-600 rounded-md hover:bg-indigo-700">
            <FiArrowLeft className="mr-2" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <div className="container max-w-6xl px-4 py-8 mx-auto">
        <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white">Your Shopping Cart</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Cart Items */}
          <div className="w-full lg:w-2/3">
            <div className="overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800">
              <div className="p-6">
                {cartItems.map(item => (
                  <div key={item.id} className="flex flex-col py-6 border-b sm:flex-row dark:border-gray-700 last:border-0">
                    <div className="flex items-center mb-4 sm:w-1/2 sm:mb-0">
                      <div className="relative flex-shrink-0 w-20 h-20 overflow-hidden rounded-md">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <Link href={`/products/${item.productId}`} className="text-lg font-medium text-gray-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                          {item.name}
                        </Link>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Item #{item.productId}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:w-1/2">
                      <div className="flex items-center border rounded-md dark:border-gray-700">
                        <button
                          onClick={() => user && updateCartQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-gray-800 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => user && updateCartQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-medium text-gray-800 dark:text-white">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={() => user && user.email && removeCartItem(user.email, item.id)}
                          className="flex items-center mt-1 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <FiTrash2 className="w-4 h-4 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between p-6 bg-gray-50 dark:bg-gray-700/30">
                <Link href="/products" className="flex items-center text-indigo-600 dark:text-indigo-400 hover:underline">
                  <FiArrowLeft className="mr-2" />
                  Continue Shopping
                </Link>
                <button
                  onClick={() => user && user.email && clearCart(user.email, cartItems)}
                  className="flex items-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <FiTrash2 className="mr-2" />
                  Clear Cart
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800">
              <div className="p-6">
                <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Order Summary</h2>

                <div className="mb-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {formatCurrencyAmount(subtotal, currencyCode)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax (10%)</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {formatCurrencyAmount(tax, currencyCode)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Shipping {subtotal > 0 && subtotal < freeShippingThreshold && (
                        <span className="text-xs text-green-600">
                          (Free on orders over {formatCurrencyAmount(freeShippingThreshold, currencyCode)})
                        </span>
                      )}
                    </span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {actualShippingFee === 0
                        ? "Free"
                        : formatCurrencyAmount(actualShippingFee, currencyCode)
                      }
                    </span>
                  </div>
                  <div className="pt-3 mt-3 border-t dark:border-gray-700">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-800 dark:text-white">Total</span>
                      <span className="text-lg font-bold text-gray-800 dark:text-white">
                        {formatCurrencyAmount(total, currencyCode)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div className="mt-4 mb-2">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2 rounded-md bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center">
                        <FiTag className="mr-2 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">
                            Coupon applied: {appliedCoupon.code}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            You saved {formatCurrencyAmount(discount, currencyCode)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        aria-label="Remove coupon"
                        title="Remove coupon"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleApplyCoupon();
                      }} className="flex space-x-2">
                        <div className="relative flex-grow">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder="Enter coupon code"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={couponLoading}
                          className="px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                        >
                          {couponLoading ? 'Applying...' : 'Apply'}
                        </button>
                      </form>
                      
                      {/* Available Coupons Section */}
                      {user && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setShowCoupons(!showCoupons)}
                            className="flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            aria-label={showCoupons ? "Hide available coupons" : "Show available coupons"}
                            title={showCoupons ? "Hide available coupons" : "Show available coupons"}
                          >
                            <FiGift className="mr-1" />
                            {showCoupons ? 'Hide available coupons' : 'Show available coupons'}
                            {!showCoupons && availableCoupons.length > 0 && (
                              <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                {availableCoupons.length}
                              </span>
                            )}
                          </button>
                          
                          {showCoupons && (
                            <div className="mt-2">
                              {loadingCoupons ? (
                                <div className="flex justify-center py-3">
                                  <div className="w-5 h-5 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                                </div>
                              ) : availableCoupons.length > 0 ? (
                                <div className="border border-gray-200 divide-y divide-gray-200 rounded-md dark:border-gray-700 dark:divide-gray-700">
                                  {availableCoupons.map((coupon) => (
                                    <div key={coupon.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                                      <div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {coupon.type === 'percentage' 
                                            ? `${coupon.value}% OFF` 
                                            : `$${coupon.value.toFixed(2)} OFF`}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {coupon.description}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => applyCouponFromList(coupon)}
                                        className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                        aria-label={`Apply coupon ${coupon.code}`}
                                        title={`Apply coupon ${coupon.code}`}
                                      >
                                        Apply
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-3 text-sm text-center text-gray-500 border border-gray-200 rounded-md dark:text-gray-400 dark:border-gray-700">
                                  No available coupons for your cart items
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Display discount if applied */}
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>-{formatCurrencyAmount(discount, currencyCode)}</span>
                  </div>
                )}

                <div className="pt-3 mt-3 border-t dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-800 dark:text-white">Total</span>
                    <span className="text-lg font-bold text-gray-800 dark:text-white">
                      {formatCurrencyAmount(total, currencyCode)}
                    </span>
                  </div>
                </div>

                {/* PayPal checkout button */}
                <PayPalScriptProvider options={paypalOptions}>
                  <PayPalButtons
                    style={{ layout: "horizontal", color: "blue", shape: "rect", label: "checkout" }}
                    createOrder={createOrderForPayPal}
                    onApprove={(data, actions) => {
                      return actions.order.capture().then((details) => {
                        handlePaymentSuccess(details);
                      });
                    }}
                    onError={(err) => {
                      console.error("PayPal Checkout Error:", err);
                      alert("An error occurred during the payment process. Please try again.");
                    }}
                  />
                </PayPalScriptProvider>

                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-medium text-gray-800 dark:text-white">We Accept:</h3>
                  <div className="flex space-x-2">
                    <div className="w-12 h-8 bg-gray-200 rounded dark:bg-gray-700"></div>
                    <div className="w-12 h-8 bg-gray-200 rounded dark:bg-gray-700"></div>
                    <div className="w-12 h-8 bg-gray-200 rounded dark:bg-gray-700"></div>
                    <div className="w-12 h-8 bg-gray-200 rounded dark:bg-gray-700"></div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-700/30">
                <h3 className="mb-2 text-sm font-medium text-gray-800 dark:text-white">Have a promo code?</h3>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="flex-1 p-2 bg-white border dark:border-gray-600 dark:bg-gray-800 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                  <button className="px-4 text-gray-800 transition duration-200 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-r-md hover:bg-gray-300 dark:hover:bg-gray-600">
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}