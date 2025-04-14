import { createProduct } from '@/firebase/firebase';

// Mock data for demonstration
const MOCK_PRODUCTS = [
  // Electronics
  {
    name: 'Smartphone Pro',
    description: 'Latest flagship smartphone with advanced camera and powerful processor.',
    price: 899,
    originalPrice: 999,
    imageUrl: 'https://source.unsplash.com/random/600x600/?smartphone',
    rating: 4.7,
    reviewCount: 128,
    stock: 45,
    featured: true,
    category: 'Electronics'
  },
  {
    name: 'Wireless Earbuds',
    description: 'True wireless earbuds with noise cancellation and premium sound quality.',
    price: 149,
    originalPrice: 199,
    imageUrl: 'https://source.unsplash.com/random/600x600/?earbuds',
    rating: 4.5,
    reviewCount: 92,
    stock: 78,
    featured: true,
    category: 'Electronics'
  },
  {
    name: 'Smart Watch',
    description: 'Track fitness, receive notifications, and more with this sleek smartwatch.',
    price: 249,
    originalPrice: 299,
    imageUrl: 'https://source.unsplash.com/random/600x600/?smartwatch',
    rating: 4.3,
    reviewCount: 67,
    stock: 25,
    featured: false,
    category: 'Electronics'
  },

  // Clothing
  {
    name: 'Classic Denim Jacket',
    description: 'Timeless denim jacket for all seasons, made with premium materials.',
    price: 79,
    originalPrice: 99,
    imageUrl: 'https://source.unsplash.com/random/600x600/?denim',
    rating: 4.6,
    reviewCount: 42,
    stock: 32,
    featured: true,
    category: 'Clothing'
  },
  {
    name: 'Cotton T-Shirt',
    description: 'Soft, comfortable cotton t-shirt perfect for everyday wear.',
    price: 24,
    imageUrl: 'https://source.unsplash.com/random/600x600/?tshirt',
    rating: 4.2,
    reviewCount: 118,
    stock: 145,
    featured: false,
    category: 'Clothing'
  },
  {
    name: 'Running Shoes',
    description: 'Lightweight and responsive running shoes for maximum performance.',
    price: 129,
    originalPrice: 159,
    imageUrl: 'https://source.unsplash.com/random/600x600/?runningshoes',
    rating: 4.8,
    reviewCount: 76,
    stock: 28,
    featured: true,
    category: 'Clothing'
  },

  // Home & Kitchen
  {
    name: 'Smart Coffee Maker',
    description: 'Wi-Fi enabled coffee maker you can control from your phone.',
    price: 159,
    originalPrice: 199,
    imageUrl: 'https://source.unsplash.com/random/600x600/?coffeemaker',
    rating: 4.4,
    reviewCount: 53,
    stock: 37,
    featured: true,
    category: 'Home & Kitchen'
  },
  {
    name: 'Non-Stick Cookware Set',
    description: 'Complete kitchen cookware set with durable non-stick coating.',
    price: 189,
    originalPrice: 249,
    imageUrl: 'https://source.unsplash.com/random/600x600/?cookware',
    rating: 4.6,
    reviewCount: 87,
    stock: 42,
    featured: false,
    category: 'Home & Kitchen'
  },
  {
    name: 'Robotic Vacuum Cleaner',
    description: 'Smart robot vacuum that maps your home and cleans efficiently.',
    price: 349,
    originalPrice: 399,
    imageUrl: 'https://source.unsplash.com/random/600x600/?vacuum',
    rating: 4.7,
    reviewCount: 112,
    stock: 19,
    featured: true,
    category: 'Home & Kitchen'
  },

  // Books
  {
    name: 'Bestselling Novel',
    description: 'Award-winning fiction that topped the charts this year.',
    price: 19,
    imageUrl: 'https://source.unsplash.com/random/600x600/?novel',
    rating: 4.9,
    reviewCount: 215,
    stock: 87,
    featured: true,
    category: 'Books'
  },
  {
    name: 'Cookbook Collection',
    description: 'Collection of recipes from around the world by famous chefs.',
    price: 35,
    originalPrice: 45,
    imageUrl: 'https://source.unsplash.com/random/600x600/?cookbook',
    rating: 4.5,
    reviewCount: 64,
    stock: 53,
    featured: false,
    category: 'Books'
  },
  {
    name: 'Self-Help Guide',
    description: 'Practical strategies for personal development and growth.',
    price: 16,
    imageUrl: 'https://source.unsplash.com/random/600x600/?book',
    rating: 4.3,
    reviewCount: 98,
    stock: 113,
    featured: false,
    category: 'Books'
  }
];

// Distribution mapping for categories
const CATEGORY_MAPPING = {
  'Electronics': MOCK_PRODUCTS.slice(0, 3),
  'Clothing': MOCK_PRODUCTS.slice(3, 6),
  'Home & Kitchen': MOCK_PRODUCTS.slice(6, 9),
  'Books': MOCK_PRODUCTS.slice(9, 12)
};

// Function to seed products
export async function seedProducts() {
  try {
    console.log('Starting product seeding...');
    
    // Seed products for each category
    for (const category of Object.keys(CATEGORY_MAPPING)) {
      console.log(`Seeding ${category} products...`);
      
      const products = CATEGORY_MAPPING[category as keyof typeof CATEGORY_MAPPING];
      
      for (const product of products) {
        // Add current date to the product
        const productWithDate = {
          ...product,
          createdAt: new Date()
        };
        
        // Create product in Firebase
        const result = await createProduct(productWithDate, category);
        
        if (result.success) {
          console.log(`Added product: ${product.name} with ID: ${result.id}`);
        } else {
          console.error(`Failed to add product ${product.name}: ${result.message}`);
        }
      }
    }
    
    console.log('Product seeding complete!');
    return { success: true, message: 'Products seeded successfully' };
  } catch (error) {
    console.error('Error seeding products:', error);
    return { 
      success: false, 
      message: `Failed to seed products: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Export mapping for testing/visibility
export { CATEGORY_MAPPING }; 