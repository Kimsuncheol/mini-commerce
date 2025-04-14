import { Product } from '@/types';
import { getAllProductsFromSubcollections } from '@/firebase/firebase';

// Simple in-memory vector store for product data
// In production, you would use a dedicated vector DB like Pinecone, Qdrant, etc.
class ProductVectorStore {
  private products: Product[] = [];
  private isInitialized: boolean = false;

  // Initialize the vector store with products
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.products = await getAllProductsFromSubcollections();
      this.isInitialized = true;
      console.log(`Vector store initialized with ${this.products.length} products`);
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      throw error;
    }
  }

  // Simple semantic search based on keyword matching
  // In a real implementation, you would use proper vector embeddings and similarity search
  async search(query: string, limit: number = 5): Promise<Product[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Normalize query
    const normalizedQuery = query.toLowerCase();
    const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 2);
    
    // Simple scoring function for matching products
    const scoredProducts = this.products.map(product => {
      let score = 0;
      
      // Check product name
      if (product.name.toLowerCase().includes(normalizedQuery)) {
        score += 10;
      }
      
      // Check category match
      if (product.category.toLowerCase().includes(normalizedQuery)) {
        score += 5;
      }
      
      // Check description
      if (product.description?.toLowerCase().includes(normalizedQuery)) {
        score += 3;
      }
      
      // Check each term
      for (const term of queryTerms) {
        if (product.name.toLowerCase().includes(term)) {
          score += 2;
        }
        if (product.category.toLowerCase().includes(term)) {
          score += 1;
        }
        if (product.description?.toLowerCase().includes(term)) {
          score += 1;
        }
      }
      
      // Boost score for featured products
      if (product.featured) {
        score *= 1.2;
      }
      
      return { product, score };
    });
    
    // Sort by score and take top results
    const results = scoredProducts
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);
      
    return results;
  }

  // Format products as a text context for the AI
  formatProductsForContext(products: Product[]): string {
    if (products.length === 0) return "No relevant products found.";
    
    return products.map(product => {
      // Format price with currency
      const formattedPrice = `$${product.price.toFixed(2)}`;
      const formattedOriginalPrice = product.originalPrice 
        ? `$${product.originalPrice.toFixed(2)}`
        : null;
      
      // Format discount info if available
      const discountInfo = product.originalPrice 
        ? ` (Original price: ${formattedOriginalPrice}, ${Math.round((1 - product.price / product.originalPrice) * 100)}% off)`
        : '';
      
      // Format product details
      return `Product: ${product.name}
Category: ${product.category}
Price: ${formattedPrice}${discountInfo}
Stock: ${product.stock} available
Rating: ${product.rating.toFixed(1)}/5 (${product.reviewCount} reviews)
Description: ${product.description || 'No description available.'}
---`;
    }).join('\n\n');
  }

  // Search and format products in one step
  async searchAndFormatForContext(query: string, limit: number = 5): Promise<string> {
    const results = await this.search(query, limit);
    return this.formatProductsForContext(results);
  }
}

// Create singleton instance
const productVectorStore = new ProductVectorStore();

export default productVectorStore; 