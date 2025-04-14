'use client';

import React, { useState } from 'react';
import { FiShoppingCart, FiHeart, FiShare2 } from 'react-icons/fi';
import { addToCart } from '@/firebase/firebase';
import { Product } from '@/types';
import { auth } from '@/firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCurrency } from '@/app/context/CurrencyContext';
import PaymentButton from '@/app/component/ui/PaymentButton';
import PayPalButton from '@/app/component/ui/PayPalButton';
import PayPalPayLaterButton from '@/app/component/ui/PayPalPayLaterButton';

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [user] = useAuthState(auth);

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

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= product.stock) {
      setQuantity(value);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleAddToCart = async () => {
    if (!user || !user.email) {
      alert('Please sign in to add items to your cart');
      return;
    }

    try {
      setIsAddingToCart(true);
      
      // Create a product object for the cart with quantity
      const productData = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: quantity
      };
      
      const success = await addToCart(user.email, productData);
      
      if (success) {
        alert(`${product.name} added to cart!`);
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

  const handleBuyNow = () => {
    if (!user || !user.email) {
      alert('Please sign in to purchase items');
      return;
    }
    
    setShowPayment(!showPayment);
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      alert('Share functionality not supported by your browser');
    }
  };

  const totalPrice = product.price * quantity;
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
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
      
      {/* Quantity selector */}
      <div className="mb-6">
        <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Quantity</h2>
        <div className="flex items-center">
          <button 
            onClick={decreaseQuantity}
            className="flex items-center justify-center w-8 h-8 text-gray-600 border border-gray-300 rounded-l dark:text-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            -
          </button>
          <input
            type="number"
            value={quantity}
            onChange={handleQuantityChange}
            min="1"
            max={product.stock}
            aria-label="Product quantity"
            title="Product quantity"
            className="w-16 h-8 text-center text-gray-700 border-t border-b border-gray-300 dark:text-gray-300 dark:border-gray-600 dark:bg-gray-800"
          />
          <button 
            onClick={increaseQuantity}
            className="flex items-center justify-center w-8 h-8 text-gray-600 border border-gray-300 rounded-r dark:text-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            +
          </button>
        </div>
      </div>
      
      {/* Total price */}
      {quantity > 1 && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Total</h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatAmount(convertAmount(totalPrice))}
          </p>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart || product.stock <= 0}
          className="flex items-center justify-center flex-1 px-6 py-3 text-white transition-colors bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          <FiShoppingCart className="w-5 h-5 mr-2" />
          {isAddingToCart ? 'Adding...' : 'Add to Cart'}
        </button>
        
        <button
          onClick={handleBuyNow}
          disabled={product.stock <= 0}
          className="flex items-center justify-center flex-1 px-6 py-3 text-white transition-colors bg-green-600 rounded-lg shadow hover:bg-green-700 disabled:bg-green-400"
        >
          Buy Now
        </button>
        
        <button
          onClick={toggleWishlist}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`flex items-center justify-center px-4 py-3 transition-colors rounded-lg shadow ${
            isWishlisted 
              ? 'bg-pink-100 text-pink-600 hover:bg-pink-200 dark:bg-pink-900/20 dark:text-pink-400' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
        >
          <FiHeart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={handleShare}
          className="flex items-center justify-center px-4 py-3 font-medium text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          <FiShare2 className="mr-2" />
          Share
        </button>
      </div>
      
      {/* Payment button */}
      {showPayment && user && (
        <div className="p-4 mt-6 border border-gray-200 rounded-lg dark:border-gray-700">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Complete Your Purchase</h3>
          <PaymentButton
            amount={totalPrice}
            orderId={`order-${product.id}-${Date.now()}`}
            orderName={`${product.name} (${quantity})`}
            customerName={user.displayName || user.email?.split('@')[0] || 'Customer'}
            className="w-full mb-4"
          />
          <div className="mt-4">
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Or pay with PayPal:</p>
            <PayPalButton
              amount={totalPrice}
              orderId={`paypal-${product.id}-${Date.now()}`}
              orderName={`${product.name} (${quantity})`}
              customerName={user.displayName || user.email?.split('@')[0] || 'Customer'}
              className="w-full mb-4"
              onSuccess={(orderData) => {
                // Handle successful PayPal purchase
                console.log('PayPal payment successful, order ID:', orderData.id);
                alert('Payment successful! Thank you for your purchase.');
                // You can add more logic here like updating order status, etc.
              }}
            />
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Or buy now and pay later:</p>
              <PayPalPayLaterButton
                amount={totalPrice}
                orderId={`paylater-${product.id}-${Date.now()}`}
                orderName={`${product.name} (${quantity})`}
                customerName={user.displayName || user.email?.split('@')[0] || 'Customer'}
                className="w-full"
                onSuccess={(orderData) => {
                  // Handle successful PayPal Pay Later purchase
                  console.log('PayPal Pay Later successful, order ID:', orderData.id);
                  alert('Payment plan successfully set up! Thank you for your purchase.');
                  // You can add more logic here like updating order status, etc.
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
