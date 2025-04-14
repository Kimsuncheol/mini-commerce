import { Product, CartItem, WishlistItem } from '@/types';
import { fetchCartWishListProductsItems } from '@/firebase/firebase';

// Define the possible intents the analysis can detect
export type ChatIntent = 'find_product' | 'show_cart' | 'show_wishlist' | 'unknown';

// Define the structure of the analysis result
export interface AnalysisResult {
  intent: ChatIntent;
  matchedProducts?: Product[]; // Products found related to the message
  // We might add matchedCartItems or matchedWishlistItems later if needed
}

/**
 * Analyzes the user's chat message to determine intent and find related products.
 * This is a basic implementation using keyword matching.
 *
 * @param message The user's input message.
 * @param allProducts An array of all available products.
 * @param cartItems An array of items currently in the user's cart.
 * @param wishlistItems An array of items currently in the user's wishlist.
 * @returns An AnalysisResult object with the detected intent and any matched products.
 */

/**
 * Performs morpheme analysis on a message using a morpheme analysis API
 * This helps handle different word forms and inflections for better matching
 * 
 * @param message The input message to analyze
 * @returns Promise resolving to an array of analyzed morphemes
 */




export const analyzeChatMessage = (
  message: string,
  allProducts: Product[],
  cartItems: CartItem[], // Included for potential future use
  wishlistItems: WishlistItem[] // Included for potential future use
): AnalysisResult => {
  const lowerCaseMessage = message.toLowerCase();

  // 1. Check for specific intents (cart, wishlist)
  if (/\b(cart|bag|checkout|basket)\b/.test(lowerCaseMessage)) {
    return { intent: 'show_cart' };
  }
  if (/\b(wishlist|wish list|saved|favorites)\b/.test(lowerCaseMessage)) {
    return { intent: 'show_wishlist' };
  }

  // 2. Check for product mentions (simple word matching)
  const matchedProducts: Product[] = [];
  const words = lowerCaseMessage.split(/\s+/).filter(word => word.length > 2); // Get significant words

  allProducts.forEach(product => {
    const lowerCaseName = product.name.toLowerCase();
    // Check if product name is fully contained in the message
    if (lowerCaseMessage.includes(lowerCaseName)) {
      matchedProducts.push(product);
      return; // Prioritize full name match
    }
    // Check if any significant word from the message is in the product name
    if (words.some(word => lowerCaseName.includes(word))) {
      if (!matchedProducts.find(p => p.id === product.id)) { // Avoid duplicates
        matchedProducts.push(product);
      }
    }
  });

  if (matchedProducts.length > 0) {
    // Sort matched products (e.g., by relevance score if implemented, or keep as is)
    // For now, just return them.
    return { intent: 'find_product', matchedProducts };
  }

  // 3. Default intent if nothing specific is found
  return { intent: 'unknown' };
};