'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth, addToCart, addPurchaseToHistory } from '@/firebase/firebase';
import { Product, Coupon } from '@/types';
import { FiArrowLeft, FiShoppingCart, FiHeart, FiTag, FiCheck, FiGift } from 'react-icons/fi';
import BackButton from '@/app/component/ui/BackButton';
import { useProductContext } from '@/app/context/ProductContext';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCurrency } from '@/app/context/CurrencyContext';
import ProductImageGallery from './components/ProductImageGallery';
import RelatedProducts from './components/RelatedProducts';
import LoadingSkeleton from './components/LoadingSkeleton';
import NotFound from './components/NotFound';
import PayPalButton from '@/app/component/ui/PayPalButton';
import { applyCoupon, getUserCoupons, getUserSavedCoupons } from '@/app/services/couponService';
import { toast } from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromOrder = searchParams.get('fromOrder');
  const orderId = searchParams.get('orderId');
  const category = searchParams.get('category');

  const { selectedProduct, setSelectedProduct } = useProductContext();
  const [product, setProduct] = useState<Product | null>(selectedProduct);
  const [loading, setLoading] = useState(!selectedProduct);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [user] = useAuthState(auth);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string;
    code: string;
    discountAmount: number;
    discountType: 'percentage' | 'fixed';
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [couponsSource, setCouponsSource] = useState<'all' | 'saved'>('all');

  // Safe access to currency context with fallback
  let formatAmount = (amount: number) => `$${amount.toFixed(2)}`;
  let convertAmount = (amount: number) => amount;
  try {
    const currencyContext = useCurrency();
    formatAmount = currencyContext.formatAmount;
    convertAmount = currencyContext.convertAmount;
  } catch (error) {
    console.error("Error accessing currency context:", error);
  }

  const fetchAvailableCoupons = async (productData: Product, source: 'all' | 'saved' = 'all') => {
    if (!user || !user.uid || !productData) return;
    
    setLoadingCoupons(true);
    try {
      let userCoupons: Coupon[] = [];
      
      // Get coupons from the specified source
      if (source === 'saved') {
        // Get coupons from the user's getCouponsList subcollection
        userCoupons = await getUserSavedCoupons(user.uid);
        setCouponsSource('saved');
      } else {
        // Get all available coupons (default behavior)
        userCoupons = await getUserCoupons(user.uid);
        setCouponsSource('all');
      }
      
      // Filter coupons that are applicable for this product
      const applicableCoupons = userCoupons.filter(coupon => {
        // Don't show expired or inactive coupons
        const now = new Date();
        if (now > new Date(coupon.endDate) || !coupon.isActive) {
          return false;
        }
        
        // Check if coupon has product restrictions
        if (coupon.products && coupon.products.length > 0) {
          return coupon.products.includes(productData.id);
        }
        
        // Check if coupon has category restrictions
        if (coupon.categories && coupon.categories.length > 0) {
          return productData.category && coupon.categories.includes(productData.category);
        }
        
        // If no product or category restrictions, check if it meets the minimum purchase
        const productPrice = productData.price * quantity;
        return !coupon.minPurchase || productPrice >= coupon.minPurchase;
      });
      
      setAvailableCoupons(applicableCoupons);
    } catch (error) {
      console.error('Error fetching available coupons:', error);
      toast.error('Failed to load available coupons');
    } finally {
      setLoadingCoupons(false);
    }
  };

  const applyCouponFromList = (coupon: Coupon) => {
    setCouponCode(coupon.code);
    handleApplyCoupon(coupon.code);
    setShowCoupons(false);
  };

  const handleCouponChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCouponCode(e.target.value.trim().toUpperCase());
  };

  const handleApplyCoupon = async (code?: string) => {
    const codeToApply = code || couponCode;
    if (!codeToApply) return;
    if (!user || !user.uid) {
      toast.error('Please sign in to apply a coupon');
      router.push('/login');
      return;
    }
    if (!product) return;

    setIsApplyingCoupon(true);
    try {
      const couponResult = await applyCoupon(
        codeToApply,
        user.uid,
        product.price * quantity,
        [product.id],
        product.category ? [product.category] : []
      );
      
      setAppliedCoupon(couponResult);
      toast.success(`Coupon applied! You saved ${formatAmount(convertAmount(couponResult.discountAmount))}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply coupon';
      toast.error(errorMessage);
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  // Order creation for PayPal
  const createOrder = (data: Record<string, unknown>, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          description: `Purchase of ${product?.name}`,
          amount: {
            currency_code: 'USD',
            value: discountedPrice.toString(),
          },
        },
      ],
    });
  };

  // Handle successful payment
  const onApprove = (orderData: Record<string, unknown>) => {
    // Add to purchase history
    if (product && user) {
      addPurchaseToHistory(user.uid, {
        productId: product.id,
        productName: product.name,
        quantity,
        price: discountedPrice,
        date: new Date().toISOString(),
        paymentMethod: 'PayPal',
        orderId: orderData.id as string || `order-${Date.now()}`,
      });
    }

    // Show a success message
    setCheckoutSuccess(true);
    
    // Here you would typically:
    // 1. Save the order to your database
    // 2. Clear the cart if purchased from cart
    // 3. Update inventory
    // 4. Send confirmation email
    
    // For now, just display success message
    setTimeout(() => {
      alert(`Payment completed successfully! Order ID: ${orderData.id}`);
    }, 100);
  };

  const toggleCoupons = () => {
    if (showCoupons) {
      // Simply hide the coupons if they're already shown
      setShowCoupons(false);
    } else {
      // Show the coupons and fetch them from the user's saved coupons collection
      setShowCoupons(true);
      if (product && user?.uid) {
        fetchAvailableCoupons(product, 'saved');
      }
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      const productId = id as string;
      
      if (!productId) {
        console.error("[fetchProduct] Product ID is missing from URL params.");
        setLoading(false);
        setProduct(null);
        return;
      }
      
      console.log(`[fetchProduct] Starting fetch for ID: ${productId}, Category from URL: ${category}`);

      // If we already have the product data from context and it matches
      if (selectedProduct && selectedProduct.id === productId) {
        console.log("[fetchProduct] Using product data from context.");
        setProduct(selectedProduct);
        setLoading(false);
        // Ensure related products/coupons are generated/fetched even when using context
        // generateRelatedProducts(selectedProduct); // TODO: Uncomment when function is available
        if (user) fetchAvailableCoupons(selectedProduct, 'saved');
        return;
      }

      setLoading(true);
      try {
        let fetchedProductData: Product | null = null;
        
        // 1. Try fetching from the specific category provided in the URL
        if (category) {
          const categoryPath = `products/${category}/items/${productId}`;
          console.log(`[fetchProduct] Attempt 1: Fetching from specific category path: ${categoryPath}`);
          try {
            const categoryRef = doc(db, 'products', category, 'items', productId);
            const categorySnap = await getDoc(categoryRef);
            console.log(`[fetchProduct] Attempt 1 Result: Exists = ${categorySnap.exists()}`);
            if (categorySnap.exists()) {
              fetchedProductData = { id: categorySnap.id, ...categorySnap.data() } as Product;
              if (!fetchedProductData.category) {
                fetchedProductData.category = category;
              }
            }
          } catch (catError) {
            console.error(`[fetchProduct] Attempt 1 Error fetching from ${categoryPath}:`, catError);
          }
        }
        
        // 2. If not found yet, try fetching from 'All categories' subcollection
        if (!fetchedProductData) {
          const allCatPath = `products/All categories/items/${productId}`;
          console.log(`[fetchProduct] Attempt 2: Fetching from 'All categories' path: ${allCatPath}`);
          try {
            const allCategoriesRef = doc(db, 'products', 'All categories', 'items', productId);
            const allCatSnap = await getDoc(allCategoriesRef);
            console.log(`[fetchProduct] Attempt 2 Result: Exists = ${allCatSnap.exists()}`);
            if (allCatSnap.exists()) {
              fetchedProductData = { id: allCatSnap.id, ...allCatSnap.data() } as Product;
            }
          } catch (allCatError) {
            console.error(`[fetchProduct] Attempt 2 Error fetching from ${allCatPath}:`, allCatError);
          }
        }

        // 3. Fallback: If still not found, check the top-level products collection (legacy)
        if (!fetchedProductData) {
          const legacyPath = `products/${productId}`;
          console.log(`[fetchProduct] Attempt 3: Fetching from legacy path: ${legacyPath}`);
          try {
            const legacyRef = doc(db, 'products', productId);
            const legacySnap = await getDoc(legacyRef);
            console.log(`[fetchProduct] Attempt 3 Result: Exists = ${legacySnap.exists()}`);
            if (legacySnap.exists()) {
              fetchedProductData = { id: legacySnap.id, ...legacySnap.data() } as Product;
            }
           } catch (legacyError) {
            console.error(`[fetchProduct] Attempt 3 Error fetching from ${legacyPath}:`, legacyError);
          }
        }
        
        // Update state with the fetched data or null if not found
        if (fetchedProductData) {
          console.log("[fetchProduct] Success! Product data found:", fetchedProductData);
          setProduct(fetchedProductData);
          setSelectedProduct(fetchedProductData);
          // Generate related products and fetch coupons *after* setting state
          // generateRelatedProducts(fetchedProductData); // TODO: Uncomment when function is available
          if (user) fetchAvailableCoupons(fetchedProductData, 'saved');
        } else {
          console.error(`[fetchProduct] Failed! Product not found with ID: ${productId} (Category searched: ${category || 'All/Legacy'})`);
          setProduct(null);
        }
      } catch (error) {
        console.error("[fetchProduct] General error during fetch process:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, category, user, setSelectedProduct]);

  const handleBackToOrder = () => {
    router.push(`/account?tab=orders`);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (product && value > 0 && value <= product.stock) {
      setQuantity(value);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!user || !user.email) {
      alert('Please sign in to add items to your cart');
      router.push('/login');
      return;
    }

    try {
      setIsAddingToCart(true);

      // Pass the full product object and quantity separately
      const result = await addToCart(user.email, product, quantity);

      // Check the result object for success
      if (result.success) {
        toast.success(`${product.name} added to cart! Quantity: ${result.newQuantity}`);
      } else {
        toast.error(result.message || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error adding item to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!product) {
    return <NotFound router={router} />;
  }

  const totalPrice = product.price * quantity;
  const discountedPrice = appliedCoupon 
    ? totalPrice - appliedCoupon.discountAmount 
    : totalPrice;
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="container px-4 py-8 mx-auto">
      {/* Back to Order link - only show if coming from an order */}
      {fromOrder && orderId && (
        <button
          onClick={handleBackToOrder}
          className="flex items-center mb-4 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <FiArrowLeft className="mr-1" />
          Back to Order #{orderId}
        </button>
      )}

      {/* Breadcrumbs */}
      <nav className="flex mb-4 text-sm">
        <BackButton destination="/" />
      </nav>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Product Images */}
        <ProductImageGallery product={product} />

        {/* Product Info */}
        <div>
          {/* Product title */}
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h1>

          {/* Product rating */}
          <div className="flex items-center mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < product.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{product.rating} ({product.reviewCount} reviews)</span>
          </div>

          {/* Product price */}
          <div className="mb-6">
            <div className="flex items-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatAmount(convertAmount(product.price))}
              </span>

              {product.originalPrice && (
                <>
                  <span className="mx-2 text-lg text-gray-500 line-through dark:text-gray-400">
                    {formatAmount(convertAmount(product.originalPrice))}
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {product.stock > 10
                ? 'In stock'
                : product.stock > 0
                  ? `Only ${product.stock} left in stock - order soon`
                  : 'Out of stock'}
            </p>
          </div>

          {/* Product description */}
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Description</h2>
            <p className="text-gray-700 dark:text-gray-300">{product.description}</p>
          </div>

          {/* Coupon section */}
          {user && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Apply Coupon</h2>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 border border-green-200 rounded-md bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                  <div>
                    <div className="flex items-center">
                      <FiCheck className="mr-2 text-green-500" />
                      <span className="font-medium text-green-700 dark:text-green-400">
                        {appliedCoupon.code} applied
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                      You saved {formatAmount(convertAmount(appliedCoupon.discountAmount))}
                    </p>
                  </div>
                  <button 
                    onClick={removeCoupon}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    aria-label="Remove coupon"
                    title="Remove coupon"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex">
                    <div className="relative flex-grow">
                      <label htmlFor="coupon-input" className="sr-only">Coupon code</label>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FiTag className="text-gray-500" />
                      </div>
                      <input
                        id="coupon-input"
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={handleCouponChange}
                        className="w-full py-2 pl-10 pr-3 text-gray-700 border border-gray-300 rounded-l-md dark:text-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        aria-label="Coupon code"
                        title="Enter a valid coupon code"
                      />
                    </div>
                    <button
                      onClick={() => handleApplyCoupon()}
                      disabled={!couponCode || isApplyingCoupon}
                      className="px-4 py-2 text-white bg-blue-600 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
                      aria-label="Apply coupon"
                      title="Apply coupon code"
                    >
                      {isApplyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  
                  {/* Available Coupons Section */}
                  <div>
                    <button
                      type="button"
                      onClick={toggleCoupons}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <FiGift className="mr-1" />
                      {showCoupons ? 'Hide your coupons' : 'Show your coupons'}
                      {!showCoupons && availableCoupons.length > 0 && (
                        <span className="ml-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                          {availableCoupons.length}
                        </span>
                      )}
                    </button>
                    
                    {showCoupons && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {couponsSource === 'saved' ? 'Your Saved Coupons' : 'All Available Coupons'}
                          </h3>
                          <div className="flex space-x-2 text-xs">
                            <button
                              onClick={() => product && fetchAvailableCoupons(product, 'saved')}
                              className={`px-2 py-1 rounded ${
                                couponsSource === 'saved' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-medium' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              Saved
                            </button>
                            <button
                              onClick={() => product && fetchAvailableCoupons(product, 'all')}
                              className={`px-2 py-1 rounded ${
                                couponsSource === 'all' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-medium' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              All Available
                            </button>
                          </div>
                        </div>
                        
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
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {coupon.description}
                                  </p>
                                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Expires: {new Date(coupon.endDate).toLocaleDateString()}
                                  </div>
                                </div>
                                <button
                                  onClick={() => applyCouponFromList(coupon)}
                                  className="px-3 py-1 text-sm text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
                                >
                                  Apply
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-sm text-center text-gray-500 border border-gray-200 rounded-md dark:text-gray-400 dark:border-gray-700">
                            {couponsSource === 'saved' 
                              ? "You haven't saved any coupons yet"
                              : "No available coupons for this product"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity selector */}
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Quantity</h2>
            <div className="flex items-center">
              <button
                onClick={decreaseQuantity}
                className="flex items-center justify-center w-8 h-8 text-gray-600 border border-gray-300 rounded-l dark:text-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Decrease quantity"
                title="Decrease quantity"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                min="1"
                max={product.stock}
                className="w-16 h-8 text-center text-gray-700 border-t border-b border-gray-300 dark:text-gray-300 dark:border-gray-600 dark:bg-gray-800"
                aria-label="Product quantity"
                title="Product quantity"
              />
              <button
                onClick={increaseQuantity}
                className="flex items-center justify-center w-8 h-8 text-gray-600 border border-gray-300 rounded-r dark:text-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Increase quantity"
                title="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Total price */}
          {(quantity > 1 || appliedCoupon) && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Total</h2>
              {appliedCoupon && (
                <div className="flex flex-col mb-2">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal:</span>
                    <span>{formatAmount(convertAmount(totalPrice))}</span>
                  </div>
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Coupon discount:</span>
                    <span>-{formatAmount(convertAmount(appliedCoupon.discountAmount))}</span>
                  </div>
                </div>
              )}
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatAmount(convertAmount(discountedPrice))}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.stock <= 0}
              className="flex items-center justify-center flex-1 px-6 py-3 text-white transition-colors bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 disabled:bg-indigo-400"
              aria-label="Add to cart"
              title="Add to cart"
            >
              <FiShoppingCart className="w-5 h-5 mr-2" />
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </button>

            <button
              onClick={toggleWishlist}
              className={`flex items-center justify-center px-4 py-3 transition-colors rounded-lg shadow ${isWishlisted
                  ? 'bg-pink-100 text-pink-600 hover:bg-pink-200 dark:bg-pink-900/20 dark:text-pink-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <FiHeart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* PayPal Checkout Section */}
          {user && (
            <div id="payment-section" className="p-6 mt-8 border border-gray-200 rounded-lg dark:border-gray-700">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Checkout</h2>
              
              {checkoutSuccess ? (
                <div className="p-4 mb-4 text-green-700 bg-green-100 rounded-lg dark:bg-green-900/20 dark:text-green-400">
                  <p className="font-medium">Payment successful!</p>
                  <p className="text-sm">Thank you for your purchase. A confirmation email will be sent shortly.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    Complete your purchase of {quantity} {quantity === 1 ? 'item' : 'items'} for {formatAmount(convertAmount(discountedPrice))}
                  </p>
                  
                  <PayPalButton 
                    amount={discountedPrice}
                    orderId={`paypal-${product.id}-${Date.now()}`}
                    orderName={`${product.name} (${quantity})`}
                    customerName={user.displayName || user.email?.split('@')[0] || 'Customer'}
                    className="w-full"
                    onSuccess={onApprove}
                  />
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}