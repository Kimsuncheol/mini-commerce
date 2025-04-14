// import React, { useRef, useState } from 'react'
// import { FiSearch } from 'react-icons/fi';

// function Searchbar({parentPagePath} : {parentPagePath: string}) {
//     const [searchTerm, setSearchTerm] = useState('');
//     const [recentSearches, setRecentSearches] = useState<string[]>([]);
//     const [showRecentSearches, setShowRecentSearches] = useState(false);
//     const searchInputRef = useRef<HTMLInputElement>(null);
//     const router = useRouter();

//     const handleSearch = (e: React.FormEvent) => {
//         e.preventDefault();
        
//         if (searchTerm.trim()) {
//           // Add to recent searches
//           const updatedSearches = [
//             searchTerm,
//             ...recentSearches.filter(s => s !== searchTerm)
//           ].slice(0, 5); // Keep only 5 most recent searches
          
//           setRecentSearches(updatedSearches);
//           localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
          
//           // Navigate to search results page
//           router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
//           setShowRecentSearches(false);
//         }
//       };

//     return (
//         <form onSubmit={handleSearch}>
//             <input
//                 type="text"
//                 placeholder="Search products..."
//                 className="w-full px-4 py-2 text-gray-800 transition-colors duration-300 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 onFocus={() => { if (recentSearches.length > 0) setShowRecentSearches(true) }}
//                 ref={searchInputRef}
//             />
//             <button
//                 type="submit"
//                 aria-label="Search"
//                 className="absolute inset-y-0 right-0 flex items-center px-4 transition-colors duration-300 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 rounded-r-md"
//             >
//                 <FiSearch className="w-5 h-5 text-white" />
//             </button>
//         </form>
//     )
// }

// export default Searchbar