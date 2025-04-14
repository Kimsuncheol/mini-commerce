"use client";
import React, { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/firebase/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FiLogOut } from 'react-icons/fi';

// Import components
import ProfileHeader from '../component/account/ProfileHeader';
import TabNavigation from '../component/account/TabNavigation';
import ProfileTab from '../component/account/ProfileTab';
import OrdersTab from '../component/account/OrdersTab'; 
import WishlistTab from '../component/account/WishlistTab';
import SettingsTab from '../component/account/SettingsTab';
import LoadingSkeleton from '../component/account/LoadingSkeleton';

// Import types
import { UserProfile, OrderItem } from '@/types';

const AccountPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'profile');
  // const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateMessage, setUpdateMessage] = useState('');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  
  // Simulate some orders
  useEffect(() => {
    const dummyOrders = [
      { id: 'ORD-1234', date: '2023-12-15', status: 'Delivered', total: 129.99, items: 3 },
      { id: 'ORD-2345', date: '2024-01-20', status: 'Shipped', total: 79.50, items: 2 },
      { id: 'ORD-3456', date: '2024-02-05', status: 'Processing', total: 215.75, items: 5 }
    ];
    setOrders(dummyOrders);
  }, []);

  // Check authentication and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();

          const userProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || 'User',
            email: user.email || '',
            photoURL: user.photoURL || '/default-avatar.png',
            address: userData?.address || '',
            phone: userData?.phone || '',
            joinedDate: userData?.joinedDate || new Date().toISOString().split('T')[0]
          };

          setProfile(userProfile);
        } catch (error) {
          console.error("Error fetching user data:", error);
          
          // Fallback if Firestore data isn't available
          setProfile({
            uid: user.uid,
            displayName: user.displayName || 'User',
            email: user.email || '',
            photoURL: user.photoURL || '/default-avatar.png'
          });
        }
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Update activeTab when the URL parameter changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [router]);

  const handleUpdateMessage = useCallback((message: string) => {
    setUpdateMessage(message);
    if (message) {
      setTimeout(() => setUpdateMessage(''), 3000);
    }
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50 dark:bg-gray-900">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="overflow-hidden bg-white rounded-lg shadow-lg dark:bg-gray-800">
          {/* Account Header */}
          <ProfileHeader profile={profile} onUpdateMessage={handleUpdateMessage} />
          
          {/* Tab Navigation */}
          <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
          
          {/* Tab Content */}
          <div className="p-6">
            {updateMessage && (
              <div className={`p-3 mb-6 rounded ${updateMessage.includes('Error') 
                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' 
                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'}`}>
                {updateMessage}
              </div>
            )}
            
            {activeTab === 'profile' && (
              <ProfileTab 
                profile={profile} 
                onUpdateMessage={handleUpdateMessage} 
                setProfile={setProfile}
              />
            )}
            
            {activeTab === 'orders' && (
              <OrdersTab orders={orders} />
            )}
            
            {activeTab === 'wishlist' && (
              <WishlistTab />
            )}
            
            {activeTab === 'settings' && (
              <SettingsTab />
            )}
          </div>
          
          <div className="px-6 py-4 text-right border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={handleSignOut}
              className="flex items-center ml-auto text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <FiLogOut className="mr-1" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;