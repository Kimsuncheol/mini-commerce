'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, checkUserIsAdmin } from '@/firebase/firebase';

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-12 h-12 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
    <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Checking admin access...</span>
  </div>
);

// Access denied component
const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center">
    <div className="mb-4 text-red-500">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Access Denied</h1>
    <p className="mt-2 text-gray-600 dark:text-gray-400">
      You don't have permission to access this page.
    </p>
    <button 
      onClick={() => window.location.href = '/'}
      className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
    >
      Return to Home
    </button>
  </div>
);

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const router = useRouter();

  // Special admin emails - for development or emergency access
  const hardcodedAdminEmails = [
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    'admin@example.com' // Replace with your actual admin email if needed
  ].filter(Boolean); // Filter out undefined values

  useEffect(() => {
    const checkAdmin = async () => {
      if (!loading && user) {
        // Check for hardcoded admin emails first (for development)
        if (user.email && hardcodedAdminEmails.includes(user.email)) {
          setIsAdmin(true);
          setCheckingAdmin(false);
          return;
        }

        try {
          // Check in Firebase
          const adminStatus = await checkUserIsAdmin(user.uid);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error("Error verifying admin status:", error);
          setIsAdmin(false);
        } finally {
          setCheckingAdmin(false);
        }
        
      } else if (!loading && !user) {
        // User is not authenticated, redirect to login
        router.push('/login?redirect=/admin');
      }
    };

    if (!loading) {
      checkAdmin();
    }
  }, [user, loading, router, hardcodedAdminEmails]);

  // Show loading spinner while checking authentication and admin status
  if (loading || checkingAdmin) {
    return <LoadingSpinner />;
  }

  // If not admin, show access denied
  if (!isAdmin) {
    return <AccessDenied />;
  }

  // User is admin, render the protected content
  return <>{children}</>;
};

export default AdminProtectedRoute;
