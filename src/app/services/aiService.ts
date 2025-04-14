import productVectorStore from '@/utils/vectorStore';
import { subscribeToWishlistChanges, subscribeToCartChanges } from '@/firebase/firebase';
import { WishlistItem, CartItem, Coupon } from '@/types';
import { getUserCoupons } from '@/app/services/couponService';

// Type for AI response
interface AIResponse {
  response: string;
  error?: string;
}

// Type for AI request payload
interface AIRequestPayload {
  message: string;
  history: string;
  productData?: string;
  cartData?: string;
  wishlistData?: string;
  couponData?: string;
}

/**
 * Processes user query to extract potential product search terms
 * @param query User message
 * @returns Extracted search terms focusing on product-related content
 */
function extractSearchTerms(query: string): string {
  // Remove common filler words to focus on important terms
  const fillerWords = [
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 
    'and', 'or', 'but', 'if', 'then', 'else', 'when',
    'can', 'you', 'tell', 'me', 'about', 'show', 'find',
    'would', 'could', 'should', 'do', 'does', 'have', 'has',
    'want', 'looking', 'for', 'need', 'help', 'with', 'please'
  ];
  
  // Split query into words and filter out filler words
  const words = query.toLowerCase().split(/\s+/);
  const importantWords = words.filter(word => 
    !fillerWords.includes(word) && 
    word.length > 2
  );
  
  // Join the important words back into a search query
  return importantWords.join(' ');
}

/**
 * Formats cart data for the AI context
 * @param items Cart items
 * @returns Formatted cart data as string
 */
function formatCartDataForContext(items: CartItem[]): string {
  if (!items || items.length === 0) return "Your cart is currently empty.";
  
  let totalPrice = 0;
  let result = "Your current cart contains:\n";
  
  items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    totalPrice += itemTotal;
    
    result += `${index + 1}. ${item.name} - $${item.price.toFixed(2)} x ${item.quantity} = $${itemTotal.toFixed(2)}\n`;
  });
  
  result += `\nTotal: $${totalPrice.toFixed(2)} (excluding shipping and taxes)`;
  return result;
}

/**
 * Formats wishlist data for the AI context
 * @param items Wishlist items
 * @returns Formatted wishlist data as string
 */
function formatWishlistDataForContext(items: WishlistItem[]): string {
  if (!items || items.length === 0) return "Your wishlist is currently empty.";
  
  let result = "Your wishlist contains these products:\n";
  
  items.forEach((item, index) => {
    result += `${index + 1}. ${item.name} - $${item.price.toFixed(2)}\n`;
  });
  
  return result;
}

/**
 * Formats coupon data for the AI context
 * @param coupons Available coupons
 * @returns Formatted coupon data as string
 */
function formatCouponDataForContext(coupons: Coupon[]): string {
  if (!coupons || coupons.length === 0) return "There are no active coupons available for you at this time.";
  
  let result = "The following coupons are available for you to use:\n";
  
  coupons.forEach((coupon, index) => {
    // Format the discount value
    const discountText = coupon.type === 'percentage' 
      ? `${coupon.value}% OFF` 
      : `$${coupon.value.toFixed(2)} OFF`;
    
    // Format minimum purchase if applicable
    const minPurchaseText = coupon.minPurchase && coupon.minPurchase > 0 
      ? ` (Min. purchase: $${coupon.minPurchase.toFixed(2)})` 
      : '';
    
    // Format expiration date
    const expiryDate = new Date(coupon.endDate).toLocaleDateString();
    
    // Add to result
    result += `${index + 1}. ${discountText} - Code: ${coupon.code}${minPurchaseText}\n   Description: ${coupon.description}\n   Valid until: ${expiryDate}\n`;
  });
  
  return result;
}

/**
 * Sends a message to the AI chat API and returns the response with RAG enhancement
 * @param message - The current user message
 * @param chatHistory - Previous conversation history
 * @param productData - Optional product information to include in context
 * @param userEmail - Optional user email for fetching cart/wishlist data
 * @returns The AI response text
 */
export async function processAIChat(
  message: string, 
  chatHistory: string, 
  productData?: string,
  userEmail?: string | null
): Promise<string> {
  try {
    // Use RAG to retrieve relevant product information
    let contextProductData = productData;
    let cartData: string | undefined;
    let wishlistData: string | undefined;
    let couponData: string | undefined;
    
    // If no specific product data was provided, try to retrieve relevant products
    if (!contextProductData) {
      const searchTerms = extractSearchTerms(message);
      
      // Only perform search if we have meaningful terms
      if (searchTerms.length > 0) {
        try {
          // Retrieve and format product data
          contextProductData = await productVectorStore.searchAndFormatForContext(searchTerms);
        } catch (error) {
          console.warn('Product retrieval failed, continuing without product context:', error);
        }
      }
    }
    
    // Fetch cart, wishlist, and coupon data if user is logged in and message relates to them
    const messageLC = message.toLowerCase();
    if (userEmail) {
      const needsCartData = messageLC.includes('cart') || 
                            messageLC.includes('shopping bag') || 
                            messageLC.includes('checkout') || 
                            messageLC.includes('purchase');
                            
      const needsWishlistData = messageLC.includes('wishlist') || 
                                messageLC.includes('wish list') || 
                                messageLC.includes('saved items') || 
                                messageLC.includes('favorites');
      
      const needsCouponData = messageLC.includes('coupon') ||
                              messageLC.includes('discount') ||
                              messageLC.includes('promo') ||
                              messageLC.includes('promocode') ||
                              messageLC.includes('code') ||
                              messageLC.includes('offer') ||
                              messageLC.includes('deal') ||
                              messageLC.includes('sale') ||
                              messageLC.includes('saving') ||
                              messageLC.includes('percent off') ||
                              messageLC.includes('% off');
      
      if (needsCartData) {
        try {
          // Get cart data
          const fetchCart = () => new Promise<CartItem[]>((resolve) => {
            const unsubscribe = subscribeToCartChanges(
              userEmail,
              (items) => {
                unsubscribe();
                resolve(items);
              },
              (error) => {
                console.error('Error getting cart data:', error);
                resolve([]);
              }
            );
          });
          
          const cartItems = await fetchCart();
          cartData = formatCartDataForContext(cartItems);
        } catch (error) {
          console.warn('Cart data retrieval failed:', error);
        }
      }
      
      if (needsWishlistData) {
        try {
          // Get wishlist data
          const fetchWishlist = () => new Promise<WishlistItem[]>((resolve) => {
            const unsubscribe = subscribeToWishlistChanges(
              userEmail,
              (items) => {
                unsubscribe();
                resolve(items);
              },
              (error) => {
                console.error('Error getting wishlist data:', error);
                resolve([]);
              }
            );
          });
          
          const wishlistItems = await fetchWishlist();
          wishlistData = formatWishlistDataForContext(wishlistItems);
        } catch (error) {
          console.warn('Wishlist data retrieval failed:', error);
        }
      }
      
      if (needsCouponData) {
        try {
          // Get available coupons
          const userCoupons = await getUserCoupons(userEmail);
          couponData = formatCouponDataForContext(userCoupons);
        } catch (error) {
          console.warn('Coupon data retrieval failed:', error);
        }
      }
    }
    
    // Prepare the payload
    const payload: AIRequestPayload = {
      message,
      history: chatHistory,
    };
    
    // Only include product data if available to keep payload size manageable
    if (contextProductData && contextProductData !== "No relevant products found.") {
      payload.productData = contextProductData;
    }
    
    // Include cart data if available
    if (cartData) {
      payload.cartData = cartData;
    }
    
    // Include wishlist data if available
    if (wishlistData) {
      payload.wishlistData = wishlistData;
    }
    
    // Include coupon data if available
    if (couponData) {
      payload.couponData = couponData;
    }
    
    // Call the API endpoint
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data: AIResponse = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.response;
  } catch (error) {
    console.error('Error in AI chat processing:', error);
    throw error;
  }
}
