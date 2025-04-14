import Link from 'next/link';
import { FiInstagram, FiFacebook, FiTwitter, FiArrowRight } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ShopEase</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              We provide the best shopping experience with quality products and excellent customer service.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <FiInstagram size={20} />
              </a>
              <a href="https://facebook.com" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <FiFacebook size={20} />
              </a>
              <a href="https://twitter.com" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <FiTwitter size={20} />
              </a>
            </div>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shop</h3>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">All Products</Link></li>
              <li><Link href="/categories" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">Categories</Link></li>
              <li><Link href="/deals" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">Deals</Link></li>
              <li><Link href="/new-arrivals" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">New Arrivals</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">Contact</Link></li>
              <li><Link href="/careers" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">Careers</Link></li>
              <li><Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">Privacy Policy</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Newsletter</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Subscribe to our newsletter for updates and promotions.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="px-3 py-2 placeholder-gray-400 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-l text-sm border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
              />
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-r px-4 flex items-center justify-center">
                <FiArrowRight />
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
            © {new Date().getFullYear()} ShopEase. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
