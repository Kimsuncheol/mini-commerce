import React, { memo, useEffect, useState } from 'react';
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import Image from 'next/image';
import { 
  fetchWishlistItems, 
  removeFromWishlist, 
  addWishlistItemToCart, 
  WishlistItem,
  subscribeToWishlistChanges 
} from '@/firebase/firebase';
import { auth } from '@/firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import toast from 'react-hot-toast';

interface WishlistItemCardProps {
  item: WishlistItem;
  onRemove: (id: string) => void;
  onAddToCart: (id: string) => void;
}

const WishlistItemCard = memo(({ item, onRemove, onAddToCart }: WishlistItemCardProps) => (
  <div className="flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg md:flex-row dark:bg-gray-800 dark:border-gray-700">
    <div className="flex-shrink-0 w-full h-24 overflow-hidden bg-gray-100 rounded-md md:w-24 dark:bg-gray-700">
      <Image
        src={item.imageUrl}
        alt={item.name}
        width={96}
        height={96}
        className="object-cover w-full h-full"
      />
    </div>
    <div className="flex-grow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{item.name}</h3>
      <p className="mt-1 font-bold text-gray-900 dark:text-white">${item.price.toFixed(2)}</p>
      <p className="mt-1 text-sm">
        {item.inStock !== false ? (
          <span className="text-green-600 dark:text-green-400">In Stock</span>
        ) : (
          <span className="text-red-600 dark:text-red-400">Out of Stock</span>
        )}
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onAddToCart(item.productId)}
          disabled={item.inStock === false}
          className={`flex items-center px-3 py-1 text-sm rounded-md ${item.inStock !== false
            ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
            }`}
        >
          <FiShoppingCart className="mr-1" size={14} />
          Add to Cart
        </button>
        <button
          onClick={() => onRemove(item.productId)}
          className="flex items-center px-3 py-1 text-sm text-red-600 rounded-md bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          <FiTrash2 className="mr-1" size={14} />
          Remove
        </button>
      </div>
    </div>
  </div>
));

WishlistItemCard.displayName = 'WishlistItemCard';

const EmptyWishlistState = memo(() => (
  <div className="py-12 text-center bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
      <FiHeart size={28} />
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your wishlist is empty</h3>
    <p className="max-w-sm mx-auto mt-2 text-gray-500 dark:text-gray-400">
      Save items you like to your wishlist for easy access later or to share with friends.
    </p>
    <button className="px-4 py-2 mt-6 text-white transition bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800" onClick={() => window.location.href = '/'}>
      Browse Products
    </button>
  </div>
));

EmptyWishlistState.displayName = 'EmptyWishlistState';

const WishlistTab = memo(() => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);

  // Use real-time subscription to wishlist changes
  useEffect(() => {
    if (!user || !user.email) {
      setWishlistItems([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError(null);

    // Store email in a const to ensure it's not null for TypeScript
    const email = user.email;

    // Subscribe to real-time wishlist changes
    const unsubscribe = subscribeToWishlistChanges(
      email,
      (items) => {
        setWishlistItems(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to wishlist:', err);
        setError('Failed to load your wishlist items. Please try again later.');
        setLoading(false);
        
        // Fallback to non-realtime fetch if subscription fails
        fetchWishlistItems(email)
          .then(items => {
            setWishlistItems(items);
            setLoading(false);
            setError(null);
          })
          .catch(fetchErr => {
            console.error('Error fetching wishlist as fallback:', fetchErr);
          });
      }
    );

    // Cleanup function to unsubscribe when component unmounts
    return () => unsubscribe();
  }, [user]);

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!user || !user.email) {
      toast.error('Please sign in to manage your wishlist');
      return;
    }

    try {
      const result = await removeFromWishlist(user.email, productId);
      
      if (result.success) {
        // Update local state
        setWishlistItems(prev => prev.filter(item => item.productId !== productId));
        toast.success('Item removed from wishlist');
      } else {
        toast.error('Failed to remove item. Please try again.');
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      toast.error('Failed to remove item. Please try again.');
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!user || !user.email) {
      toast.error('Please sign in to add items to your cart');
      return;
    }

    try {
      const item = wishlistItems.find(item => item.productId === productId);
      if (!item) return;

      const result = await addWishlistItemToCart(user.email, item);
      
      if (result.success) {
        toast.success('Item added to cart');
      } else {
        toast.error(result.message || 'Failed to add item to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Failed to add item to cart. Please try again.');
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Your Wishlist</h2>

      {loading ? (
        <div className="py-8 text-center">Loading your wishlist...</div>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="mb-4 text-red-500">{error}</p>
          <button 
            onClick={() => {
              setLoading(true);
              setError(null);
              if (user && user.email) {
                fetchWishlistItems(user.email)
                  .then(items => {
                    setWishlistItems(items);
                    setLoading(false);
                  })
                  .catch(err => {
                    console.error('Error fetching wishlist:', err);
                    setError('Failed to load your wishlist items. Please try again later.');
                    setLoading(false);
                  });
              } else {
                setLoading(false);
                setError('Please sign in to view your wishlist');
              }
            }}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : wishlistItems.length > 0 ? (
        <div className="space-y-4">
          {wishlistItems.map(item => (
            <WishlistItemCard
              key={item.id}
              item={item}
              onRemove={handleRemoveFromWishlist}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      ) : (
        <EmptyWishlistState />
      )}
    </div>
  );
});

WishlistTab.displayName = 'WishlistTab';
export default WishlistTab;