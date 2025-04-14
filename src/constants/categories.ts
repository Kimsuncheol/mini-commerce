/**
 * Product categories for the application
 * Centralized here to maintain consistency across components
 */
export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Kitchen',
  'Books',
  'Beauty',
  'Sports',
  'Toys',
  'Other'
] as const;

// Type for strongly typed categories
export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// For filter UI that includes "All Categories" option
export const PRODUCT_CATEGORIES_WITH_ALL = ['All categories', ...PRODUCT_CATEGORIES] as const;

/**
 * Function to get category icon based on category name
 * @param category - The category to get an icon for
 * @returns A string icon name or default icon
 */
export const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'Electronics':
      return 'device-mobile';
    case 'Clothing':
      return 'tshirt';
    case 'Home & Kitchen':
      return 'home';
    case 'Books':
      return 'book-open';
    case 'Beauty':
      return 'sparkles';
    case 'Sports':
      return 'speakerphone';
    case 'Toys':
      return 'puzzle';
    default:
      return 'view-grid';
  }
};

export const categories = [
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Latest gadgets, laptops, smartphones, and accessories.',
    imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    productCount: 243,
    featured: true
  },
  {
    id: 'clothing',
    name: 'Clothing',
    description: 'Clothing, shoes, accessories and more.',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80',
    productCount: 521,
    featured: true
  },
  {
    id: 'home-kitchen',
    name: 'Home & Kitchen',
    description: 'Everything you need for your home and garden.',
    imageUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1174&q=80',
    productCount: 189,
    featured: true
  },
  {
    id: 'beauty',
    name: 'Beauty',
    description: 'Makeup, skincare, personal care, and wellness products.',
    imageUrl: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    productCount: 312,
    featured: false
  },
  {
    id: 'sports',
    name: 'Sports',
    description: 'Equipment and apparel for all sports and outdoor activities.',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    productCount: 154,
    featured: false
  },
  {
    id: 'books',
    name: 'Books',
    description: 'Books, movies, music, and other media products.',
    imageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    productCount: 276,
    featured: false
  },
  {
    id: 'toys',
    name: 'Toys',
    description: 'Toys, games, and products for children of all ages.',
    imageUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    productCount: 198,
    featured: false
  },
  {
    id: 'other',
    name: 'Other',
    description: "Miscellaneous products that don't fit in other categories.",
    imageUrl: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
    productCount: 142,
    featured: false
  }
];