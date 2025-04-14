'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiCopy, FiCheck, FiGift, FiCalendar, FiClock, FiInfo } from 'react-icons/fi';
import { auth } from '@/firebase/firebase';
import { getUserCoupons, saveCouponToUser } from '@/app/services/couponService';
import { useAuthState } from 'react-firebase-hooks/auth';
import Navbar from '../component/layout/Navbar';
import Footer from '../component/layout/Footer';
import { Coupon } from '@/types';
import { toast } from 'react-hot-toast';

export default function CouponsPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [revealedCoupons, setRevealedCoupons] = useState<Record<string, boolean>>({});
  const [savingCoupon, setSavingCoupon] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      fetchUserCoupons();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserCoupons = async () => {
    try {
      setLoading(true);
      if (!user?.uid) return;
      
      const userCoupons = await getUserCoupons(user.uid);
      setCoupons(userCoupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load your coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCoupon = async (couponId: string) => {
    if (!user?.uid) {
      toast.error('Please sign in to get coupons');
      router.push('/login');
      return;
    }
    
    // Set loading state for this specific coupon
    setSavingCoupon(prev => ({ ...prev, [couponId]: true }));
    
    try {
      // Save the coupon to the user's document in Firebase
      const result = await saveCouponToUser(user.uid, couponId);
      
      // Update UI state to show the coupon code
      setRevealedCoupons(prev => ({
        ...prev,
        [couponId]: true
      }));
      
      // Show success message
      if (result.alreadySaved) {
        toast.success('Coupon already in your account!');
      } else {
        toast.success('Coupon added to your account!');
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error('Failed to save coupon to your account');
    } finally {
      setSavingCoupon(prev => ({ ...prev, [couponId]: false }));
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedCode(code);
        toast.success('Coupon code copied to clipboard!');
        setTimeout(() => setCopiedCode(null), 3000);
      })
      .catch(() => {
        toast.error('Failed to copy code');
      });
  };

  // Helper to format date in a readable way
  const formatDate = (date: Date | number) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Calculate days remaining until expiration
  const getDaysRemaining = (endDate: Date | number) => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return daysRemaining > 0 ? daysRemaining : 0;
  };

  // Get a background gradient based on user type
  const getCouponBackground = (userType: string) => {
    switch (userType) {
      case 'new':
        return 'bg-gradient-to-r from-green-500 to-emerald-700';
      case 'loyal':
        return 'bg-gradient-to-r from-purple-500 to-indigo-700';
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-600';
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md p-8 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
            <FiGift className="mx-auto mb-4 text-6xl text-blue-600" />
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Exclusive Discounts Await!</h1>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Sign in to view special coupons and promotional offers tailored just for you!
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full px-4 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Log In to View Coupons
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Your Special Offers
            </h1>
            <p className="mt-3 text-xl text-gray-500 dark:text-gray-400 sm:mt-4">
              Exclusive discounts available for you based on your membership status
            </p>
          </div>

          {coupons.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <FiGift className="mx-auto mb-4 text-6xl text-gray-400 dark:text-gray-500" />
              <h2 className="text-xl font-medium text-gray-900 dark:text-white">No Coupons Available</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Check back soon! We&apos;re always adding new offers and promotions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {coupons.map((coupon) => (
                <div 
                  key={coupon.id} 
                  className="overflow-hidden transition transform bg-white rounded-lg shadow-sm dark:bg-gray-800 hover:shadow-md hover:-translate-y-1"
                >
                  <div className={`${getCouponBackground(coupon.userType)} px-6 py-4 relative`}>
                    <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 bg-white rounded-full dark:bg-gray-800 opacity-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 -mb-8 -ml-8 bg-white rounded-full dark:bg-gray-800 opacity-10"></div>
                    
                    <h3 className="text-xl font-bold text-white">
                      {coupon.type === 'percentage' 
                        ? `${coupon.value}% OFF` 
                        : `$${coupon.value.toFixed(2)} OFF`}
                    </h3>
                    <p className="mt-1 text-white text-opacity-90">{coupon.description}</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      {/* Coupon Code Section - Hidden by Default */}
                      <div className="flex items-center">
                        {revealedCoupons[coupon.id] ? (
                          <>
                            <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md font-mono text-lg">
                              {coupon.code}
                            </div>
                            <button
                              onClick={() => handleCopyCode(coupon.code)}
                              className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              aria-label={`Copy coupon code ${coupon.code}`}
                              title="Copy to clipboard"
                            >
                              {copiedCode === coupon.code ? (
                                <FiCheck className="text-green-500" />
                              ) : (
                                <FiCopy />
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleGetCoupon(coupon.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-medium flex items-center"
                            aria-label="Get coupon code"
                            disabled={savingCoupon[coupon.id]}
                          >
                            {savingCoupon[coupon.id] ? (
                              <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                Saving...
                              </>
                            ) : (
                              <>
                                <FiGift className="mr-1" />
                                Get Coupon
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      
                      <div className="text-sm">
                        {coupon.userType === 'new' && (
                          <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-800 dark:text-green-100">
                            New Member
                          </span>
                        )}
                        {coupon.userType === 'loyal' && (
                          <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full dark:bg-purple-800 dark:text-purple-100">
                            Loyal Member
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4 space-y-2">
                      {coupon.minPurchase && coupon.minPurchase > 0 && (
                        <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                          <FiInfo className="flex-shrink-0 mt-0.5 mr-2" />
                          <p>Minimum purchase: ${coupon.minPurchase.toFixed(2)}</p>
                        </div>
                      )}
                      
                      {coupon.type === 'percentage' && coupon.maxDiscount && coupon.maxDiscount > 0 && (
                        <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                          <FiInfo className="flex-shrink-0 mt-0.5 mr-2" />
                          <p>Maximum discount: ${coupon.maxDiscount.toFixed(2)}</p>
                        </div>
                      )}
                      
                      <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                        <FiCalendar className="flex-shrink-0 mt-0.5 mr-2" />
                        <p>Valid: {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                        <FiClock className="mr-1" />
                        <span>
                          {getDaysRemaining(coupon.endDate) <= 3 
                            ? `Expires in ${getDaysRemaining(coupon.endDate)} days!` 
                            : `${getDaysRemaining(coupon.endDate)} days remaining`}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => router.push('/products')}
                        className="px-3 py-1 text-sm text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
                      >
                        Shop Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations section */}
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
              More Ways to Save
            </h2>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <FiClock className="mb-3 text-3xl text-blue-600" />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Check Back Often</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We regularly add new promotional coupons. Visit this page frequently to catch the latest deals.
                </p>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <FiGift className="mb-3 text-3xl text-blue-600" />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Refer a Friend</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Invite friends to sign up and receive exclusive coupons for both of you.
                </p>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <FiCalendar className="mb-3 text-3xl text-blue-600" />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Special Events</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Stay tuned for holiday promotions and special event discounts throughout the year.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
} 