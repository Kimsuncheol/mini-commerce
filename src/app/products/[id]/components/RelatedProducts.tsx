import Image from 'next/image';
import Link from 'next/link';
import { FiStar } from 'react-icons/fi';
import { Product } from '@/types';

interface RelatedProductsProps {
  products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products || products.length === 0) return null;
  
  return (
    <div className="mt-16">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">You May Also Like</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="overflow-hidden transition-shadow bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700 hover:shadow-md"
          >
            <Link href={`/products/${product.id}`} className="block">
              <div className="relative w-full pt-[100%]">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
            </Link>
            <div className="p-4">
              <Link href={`/products/${product.id}`} className="block">
                <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">{product.name}</h3>
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                    ({product.reviewCount})
                  </span>
                </div>
                <p className="font-medium text-gray-900 dark:text-white">${product.price.toFixed(2)}</p>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
