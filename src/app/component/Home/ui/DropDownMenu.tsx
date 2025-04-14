"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/firebase/firebase';
import { 
  FiUser, 
  FiShoppingBag, 
  FiHeart, 
  FiSettings, 
  FiLogOut, 
  FiLogIn,
  FiDatabase,
  FiBarChart2,
  FiUsers,
  FiPackage,
  FiVoicemail,
  FiTag
} from 'react-icons/fi';
import Image from 'next/image';
import { signOut } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { FaLetterboxd } from 'react-icons/fa6';
import { MailCheck } from 'lucide-react';

interface DropDownMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function DropDownMenu({ isOpen, onClose }: DropDownMenuProps) {
  const [user, loading] = useAuthState(auth);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.role === 'admin');
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  if (!mounted || !isOpen) return null;

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="absolute left-0 z-50 mt-2 overflow-hidden transition-all duration-200 transform bg-white border border-gray-200 rounded-lg shadow-lg top-full w-72 dark:bg-gray-800 dark:border-gray-700">
      {loading ? (
        // Skeleton UI for loading state
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse dark:bg-gray-700"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-28 animate-pulse dark:bg-gray-700"></div>
              <div className="w-20 h-3 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
            </div>
          </div>
          <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse dark:bg-gray-700"></div>
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {/* User info section or sign in link */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {user.photoURL ? (
                    <Image 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      width={48} 
                      height={48} 
                      className="rounded-full" 
                    />
                  ) : (
                    <div className="flex items-center justify-center w-12 h-12 text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                      <FiUser size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                    {user.displayName || 'Welcome!'}
                  </p>
                  <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                    {user.email} {isAdmin && <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">(Admin)</span>}
                  </p>
                </div>
              </div>
            ) : (
              <Link href="/login" onClick={onClose} className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                <FiLogIn size={20} />
                <span className="font-medium">Sign In / Register</span>
              </Link>
            )}
          </div>

          {/* Admin Panel Links - Only shown to admins */}
          {isAdmin && (
            <div>
              <div className="px-3 pt-2 pb-1">
                <p className="text-xs font-bold tracking-wide text-gray-500 uppercase dark:text-gray-400">Admin Dashboard</p>
              </div>
              <nav className="p-2 border-b border-gray-200 dark:border-gray-700">
                <ul className="space-y-1">
                  <li>
                    <Link 
                      href="/admin" 
                      onClick={onClose}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <FiBarChart2 className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/admin/products" 
                      onClick={onClose}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <FiPackage className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                      Products
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/admin/orders" 
                      onClick={onClose}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <FiShoppingBag className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                      Orders
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/admin/coupons" 
                      onClick={onClose}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <FiTag className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                      Coupons
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/admin/users" 
                      onClick={onClose}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <FiUsers className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                      Users
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/admin/settings" 
                      onClick={onClose}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <FiSettings className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                      Admin Settings
                    </Link>
                  </li>
                  {/* <li>
                    <Link 
                      href="/admin/email" 
                      onClick={onClose}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <MailCheck className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                      Email
                    </Link>
                  </li> */}
                </ul>
              </nav>
            </div>
          )}

          {/* User Navigation links */}
          <div className="px-3 pt-2 pb-1">
            <p className="text-xs font-bold tracking-wide text-gray-500 uppercase dark:text-gray-400">My Account</p>
          </div>
          <nav className="p-2">
            <ul className="space-y-1">
              <li>
                <Link 
                  href="/account" 
                  onClick={onClose}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <FiUser className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                  My Profile
                </Link>
              </li>
              <li>
                <Link 
                  href="/account?tab=orders" 
                  onClick={onClose}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <FiShoppingBag className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                  Orders
                </Link>
              </li>
              <li>
                <Link 
                  href="/account?tab=wishlist" 
                  onClick={onClose}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <FiHeart className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                  Wishlist
                </Link>
              </li>
              <li>
                <Link 
                  href="/account?tab=settings" 
                  onClick={onClose}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <FiSettings className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                  Settings
                </Link>
              </li>
            </ul>
          </nav>

          {/* Sign out button (only if logged in) */}
          {user && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={handleSignOut}
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <FiLogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DropDownMenu;