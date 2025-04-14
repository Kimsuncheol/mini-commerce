export default function SkeletonProductCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="h-64 bg-gray-300 dark:bg-gray-700"></div>
      
      <div className="p-4">
        {/* Title placeholder */}
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
        
        {/* Rating placeholder */}
        <div className="flex items-center mt-1 mb-3">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-4 ml-2 bg-gray-300 dark:bg-gray-700 rounded w-10"></div>
        </div>
        
        {/* Price placeholder */}
        <div className="flex items-center mt-2">
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
          <div className="ml-2 h-4 bg-gray-300 dark:bg-gray-700 rounded w-12"></div>
        </div>
        
        {/* Button placeholder */}
        <div className="mt-4 h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}
