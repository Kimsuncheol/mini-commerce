'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiShoppingCart, FiHeart } from 'react-icons/fi';
import { useProductContext } from '@/app/context/ProductContext';
import { Product } from '@/types';
import { auth, addToCart } from '@/firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import PaymentButton from '../ui/PaymentButton';
import PayPalButton from '../ui/PayPalButton';
import PayPalPayLaterButton from '../ui/PayPalPayLaterButton';
import { useCurrency } from '@/app/context/CurrencyContext';
import { db } from '@/firebase/firebase';
import { toast } from 'react-hot-toast';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';

interface ProductCardProps {
  id?: string;
  name?: string;
  price?: number;
  originalPrice?: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  description?: string;
  stock?: number;
  product?: Product;  // Add this to accept a full Product object
}

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  imageUrl,
  rating = 0,
  reviewCount,
  category = 'General',
  description = '',
  stock = 10,
  product, // New prop to accept a full product
}: ProductCardProps) {
  // If a full product object is provided, use its properties
  const productId = product?.id || id || '';
  const productName = product?.name || name || '';
  const productPrice = product?.price || price || 0;
  const productOriginalPrice = product?.originalPrice || originalPrice;
  const productImageUrl = product?.imageUrl || imageUrl || '';
  const productRating = product?.rating || rating || 0;
  const productReviewCount = product?.reviewCount || reviewCount || 0;
  const productCategory = product?.category || category;
  const productDescription = product?.description || description;
  const productStock = product?.stock || stock;

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const router = useRouter();
  const [user] = useAuthState(auth);

  // Safe access to product context with fallback
  let setSelectedProduct;
  try {
    const context = useProductContext();
    setSelectedProduct = context.setSelectedProduct;
  } catch (error) {
    console.error("Error accessing product context:", error);
    setSelectedProduct = () => { }; // Fallback function
  }

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

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  // Check if the product is already in the user's wishlist on component mount
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!user || !user.email || !productId) return;

      try {
        const wishlistRef = doc(db, 'wishlists', user.email, 'items', productId);
        const docSnap = await getDoc(wishlistRef);

        setIsWishlisted(docSnap.exists());
      } catch (error) {
        console.error("Error checking wishlist status:", error);
      }
    };

    checkWishlistStatus();
  }, [user, productId]);

  // Handle wishlist toggle
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !user.email) {
      toast.error("Please sign in to add items to your wishlist");
      router.push('/login');
      return;
    }

    try {
      const wishlistRef = doc(db, 'wishlists', user.email, 'items', productId);

      if (isWishlisted) {
        // Remove from wishlist
        await deleteDoc(wishlistRef);
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        // Add to wishlist
        // Create an object with only defined values
        const wishlistItem: Record<string, any> = {
          productId,
          name: productName,
          price: productPrice,
          imageUrl: productImageUrl,
          category: productCategory,
          addedAt: new Date(),
        };

        // Only add originalPrice if it exists
        if (productOriginalPrice !== undefined) {
          wishlistItem.originalPrice = productOriginalPrice;
        }

        // Add rating and reviewCount if they exist
        if (productRating !== undefined) {
          wishlistItem.rating = productRating;
        }

        if (productReviewCount !== undefined) {
          wishlistItem.reviewCount = productReviewCount;
        }

        // Add to Firestore
        await setDoc(wishlistRef, wishlistItem);
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error("Failed to update wishlist. Please try again.");
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !user.email) {
      alert('Please sign in to add items to your cart');
      return;
    }

    try {
      setIsAddingToCart(true);

      // Create a product object for the cart
      const productData = {
        id: productId,
        name: productName,
        price: productPrice,
        imageUrl: productImageUrl
      };

      const success = await addToCart(user?.email, productData);

      if (success) {
        alert(`${productName} added to cart!`);
      } else {
        alert('Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding item to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !user.email) {
      alert('Please sign in to purchase items');
      return;
    }

    setShowPayment(!showPayment);
  };

  const handleProductClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Create a temporary product object with available data
    const productData = {
      id: productId,
      name: productName,
      price: productPrice,
      originalPrice: productOriginalPrice,
      imageUrl: productImageUrl,
      rating: productRating,
      reviewCount: productReviewCount,
      category: productCategory,
      description: productDescription,
      stock: productStock,
      createdAt: Date.now()
    };

    // Set this as the selected product in context
    try {
      setSelectedProduct(productData);
    } catch (error) {
      console.error("Failed to set selected product:", error);
    }

    // Navigate to the product detail page
    // router.push(`/products/${productId}`);
    router.push(`/products/${productId}${productCategory ? `?category=${encodeURIComponent(productCategory)}` : ''}`);
  };

  const discount = productOriginalPrice ? Math.round(((productOriginalPrice - productPrice) / productOriginalPrice) * 100) : 0;

  return (
    <div onClick={handleProductClick} className="cursor-pointer">
      <div className="overflow-hidden transition-all bg-white rounded-lg shadow-md group dark:bg-gray-800 hover:shadow-lg">
        <div className="relative h-64 overflow-hidden">
          <Image
            src={productImageUrl}
            alt={productName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {discount > 0 && (
            <div className="absolute px-2 py-1 text-xs font-bold text-white bg-red-500 rounded top-2 left-2">
              {discount}% OFF
            </div>
          )}

          <button
            onClick={handleWishlistToggle}
            // onClick={toggleWishlist}
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute p-2 transition-colors rounded-full top-2 right-2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700"
          >
            <FiHeart
              className={`w-5 h-5 ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-600 dark:text-gray-400'}`}
            />
          </button>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white overflow-ellipsis line-clamp-1">{productName}</h3>

          <div className="flex items-center mt-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < productRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              ))}
            </div>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({productReviewCount})</span>
          </div>

          <div className="flex items-center mt-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatAmount(convertAmount(productPrice))}
            </span>
            {productOriginalPrice && (
              <span className="ml-2 text-sm text-gray-500 line-through dark:text-gray-400">
                {formatAmount(convertAmount(productOriginalPrice))}
              </span>
            )}
          </div>

          <div className="grid gap-4 mt-4">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="flex items-center justify-center px-3 py-2 text-white transition-colors bg-indigo-600 rounded hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              <FiShoppingCart className="mr-1" />
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
            {user && (
              <div
                onClick={(e) => e.stopPropagation()}
              >
                <PayPalButton
                  amount={productPrice}
                  orderId={`paypal-${productId}-${Date.now()}`}
                  orderName={`${productName} Purchase`}
                  customerName={user.displayName || user.email?.split('@')[0] || 'Customer'}
                  className="w-full mb-3"
                  onSuccess={() => {
                    // Handle successful PayPal purchase
                    alert('Payment successful! Thank you for your purchase.');
                    setShowPayment(false);
                  }}
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
