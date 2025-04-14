"use client"
import CategoryCard from './CategoryCard';
import { useRouter } from 'next/navigation';
// Sample category data
const categories = [
  { id: 'electronics', name: 'Electronics', imageUrl: '/categories/electronics.jpg', itemCount: 42 },
  { id: 'clothing', name: 'Clothing', imageUrl: '/categories/clothing.jpg', itemCount: 56 },
  { id: 'home', name: 'Home & Living', imageUrl: '/categories/home.jpg', itemCount: 38 },
  { id: 'beauty', name: 'Beauty', imageUrl: '/categories/beauty.jpg', itemCount: 27 },
  { id: 'sports', name: 'Sports', imageUrl: '/categories/sports.jpg', itemCount: 35 },
  { id: 'books', name: 'Books', imageUrl: '/categories/books.jpg', itemCount: 63 },
];

export default function CategoryGrid() {
  const router = useRouter();
  return (
    <section className="py-12 bg-white dark:bg-gray-900">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Shop by Category</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Browse our wide range of categories to find exactly what you need</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              id={category.id}
              name={category.name}
              imageUrl={category.imageUrl}
              itemCount={category.itemCount}
            />
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <button className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white transition-colors bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700" onClick={() => router.push('/categories')}>
            View All Categories
          </button>
        </div>
      </div>
    </section>
  );
}
