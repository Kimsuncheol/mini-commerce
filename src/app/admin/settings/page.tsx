'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { auth } from '@/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Component for toggle switch to reduce repetitive code
const ToggleSwitch = ({ 
  enabled, 
  onChange, 
  label, 
  id 
}: { 
  enabled: boolean; 
  onChange: () => void; 
  label: string; 
  id: string;
}) => (
  <div className="flex items-center justify-between">
    <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <button 
      type="button"
      id={id}
      onClick={onChange}
      className={`${
        enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      ></span>
    </button>
  </div>
);

// Loading spinner component
const LoadingSpinner = ({ size = "lg", message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-[600px]">
    <div className="flex flex-col items-center space-y-4">
      <svg 
        className={`${size === "lg" ? "w-12 h-12" : "w-4 h-4"} text-blue-600 animate-spin`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{message}</p>
    </div>
  </div>
);

// Navigation item component
const NavItem = ({ href, label, icon, isActive }: { href: string; label: string; icon: React.ReactNode; isActive: boolean }) => (
  <a 
    href={href} 
    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
      isActive 
        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-700' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
    }`}
  >
    {icon}
    {label}
  </a>
);

function AdminSettingsPage() {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("general");
  
  // Store settings in state
  const [settings, setSettings] = useState({
    general: {
      siteName: 'Mini Commerce',
      description: 'Your one-stop shop for amazing products',
      contactEmail: '',
      supportPhone: ''
    },
    notifications: {
      emailAlerts: true,
      orderNotifications: true,
      marketingEmails: false,
      lowStockAlerts: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: '30',
      passwordExpiry: '90'
    }
  });

  // Generate random phone number if needed
  const generateRandomPhone = useCallback(() => {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;
    return `+1 (${areaCode}) ${prefix}-${lineNumber}`;
  }, []);

  // Handle scroll to set active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["general", "notifications", "security"];
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Fetch admin data direct from document if we have the ID
  const fetchAdminById = useCallback(async (id: string) => {
    try {
      const docRef = doc(firestore, 'users', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching admin by ID:', error);
      return null;
    }
  }, []);

  // Fetch admin data from Firebase
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!currentUser?.email) return;
      
      try {
        setLoading(true);
        
        // Check local storage for cached admin ID to avoid unnecessary queries
        const cachedAdminId = localStorage.getItem('adminId');
        let adminData;
        
        if (cachedAdminId) {
          adminData = await fetchAdminById(cachedAdminId);
          if (adminData && adminData.email === currentUser.email) {
            setAdminId(cachedAdminId);
          } else {
            // If cached ID is invalid or email doesn't match, clear it
            localStorage.removeItem('adminId');
            adminData = null;
          }
        }
        
        // If no cached data, perform a query
        if (!adminData) {
          const usersRef = collection(firestore, 'users');
          const q = query(usersRef, where('email', '==', currentUser.email), where('role', '==', 'admin'));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            toast.error('No admin account found');
            setLoading(false);
            return;
          }
          
          // Get the first matching admin user
          const adminDoc = querySnapshot.docs[0];
          adminData = adminDoc.data();
          setAdminId(adminDoc.id);
          
          // Cache the admin ID
          localStorage.setItem('adminId', adminDoc.id);
        }
        
        // Update settings with admin data
        setSettings(prevSettings => ({
          general: {
            siteName: adminData.siteName || prevSettings.general.siteName,
            description: adminData.description || prevSettings.general.description,
            contactEmail: adminData.email || currentUser.email || '',
            supportPhone: adminData.supportPhone || generateRandomPhone()
          },
          notifications: {
            emailAlerts: adminData.notifications?.emailAlerts ?? prevSettings.notifications.emailAlerts,
            orderNotifications: adminData.notifications?.orderNotifications ?? prevSettings.notifications.orderNotifications,
            marketingEmails: adminData.notifications?.marketingEmails ?? prevSettings.notifications.marketingEmails,
            lowStockAlerts: adminData.notifications?.lowStockAlerts ?? prevSettings.notifications.lowStockAlerts
          },
          security: {
            twoFactorAuth: adminData.security?.twoFactorAuth ?? prevSettings.security.twoFactorAuth,
            sessionTimeout: adminData.security?.sessionTimeout || prevSettings.security.sessionTimeout,
            passwordExpiry: adminData.security?.passwordExpiry || prevSettings.security.passwordExpiry
          }
        }));
        
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [currentUser, generateRandomPhone, fetchAdminById]);

  // Handle input change with memoization
  const handleInputChange = useCallback((
    section: 'general' | 'notifications' | 'security',
    field: string,
    value: string | boolean
  ) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section],
        [field]: value
      }
    }));
  }, []);

  // Handle toggle change with memoization
  const handleToggleChange = useCallback((
    section: 'notifications' | 'security',
    field: string
  ) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section],
        [field]: !prevSettings[section][field as keyof typeof prevSettings[typeof section]]
      }
    }));
  }, []);

  // Save settings to Firebase with optimistic UI update
  const saveSettings = useCallback(async () => {
    if (!adminId) {
      toast.error('Admin account not found');
      return;
    }
    
    setSaving(true);
    // Store current settings for rollback if needed
    const previousSettings = {...settings};
    
    // Show optimistic toast
    const toastId = toast.loading('Saving settings...');
    
    try {
      const adminRef = doc(firestore, 'users', adminId);
      
      await updateDoc(adminRef, {
        siteName: settings.general.siteName,
        description: settings.general.description,
        supportPhone: settings.general.supportPhone,
        notifications: {
          emailAlerts: settings.notifications.emailAlerts,
          orderNotifications: settings.notifications.orderNotifications,
          marketingEmails: settings.notifications.marketingEmails,
          lowStockAlerts: settings.notifications.lowStockAlerts
        },
        security: {
          twoFactorAuth: settings.security.twoFactorAuth,
          sessionTimeout: settings.security.sessionTimeout,
          passwordExpiry: settings.security.passwordExpiry
        },
        updatedAt: serverTimestamp()
      });
      
      toast.success('Settings saved successfully!', { id: toastId });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings', { id: toastId });
      
      // Rollback to previous settings
      setSettings(previousSettings);
    } finally {
      setSaving(false);
    }
  }, [adminId, settings]);

  // Memoize the navigation icons to prevent unnecessary re-renders
  const navIcons = useMemo(() => ({
    general: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    notifications: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    security: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }), []);

  // Main content rendering
  if (loading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  return (
    <div className="max-w-6xl p-6 mx-auto">
      <h1 className="mb-6 text-3xl font-bold text-gray-800 dark:text-gray-100">Admin Settings</h1>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <div className="sticky p-4 bg-white rounded-lg shadow dark:bg-gray-800 top-10">
            <nav className="space-y-1">
              <NavItem 
                href="#general" 
                label="General" 
                icon={navIcons.general} 
                isActive={activeSection === "general"} 
              />
              <NavItem 
                href="#notifications" 
                label="Notifications" 
                icon={navIcons.notifications} 
                isActive={activeSection === "notifications"} 
              />
              <NavItem 
                href="#security" 
                label="Security" 
                icon={navIcons.security} 
                isActive={activeSection === "security"} 
              />
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="space-y-8 md:col-span-2">
          {/* General Settings */}
          <section id="general" className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">General Settings</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="siteName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Site Name
                </label>
                <input
                  type="text"
                  id="siteName"
                  value={settings.general.siteName}
                  onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Site Description
                </label>
                <textarea
                  id="description"
                  value={settings.general.description}
                  onChange={(e) => handleInputChange('general', 'description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="contactEmail" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contact Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="contactEmail"
                      value={settings.general.contactEmail}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed dark:border-gray-600 dark:bg-gray-600 dark:text-gray-300 focus:outline-none"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This is your admin email and cannot be changed here
                  </p>
                </div>
                <div>
                  <label htmlFor="supportPhone" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Support Phone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="supportPhone"
                      value={settings.general.supportPhone}
                      onChange={(e) => handleInputChange('general', 'supportPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                      type="button"
                      onClick={() => handleInputChange('general', 'supportPhone', generateRandomPhone())}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500 transition-colors bg-gray-100 border border-gray-300 rounded-r-md dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500"
                      title="Generate random phone number"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Click the refresh button to generate a new random number
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Notification Settings */}
          <section id="notifications" className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">Notification Settings</h2>
            <div className="space-y-4">
              <ToggleSwitch
                id="emailAlerts"
                label="Email Alerts"
                enabled={settings.notifications.emailAlerts}
                onChange={() => handleToggleChange('notifications', 'emailAlerts')}
              />
              
              <ToggleSwitch
                id="orderNotifications"
                label="Order Notifications"
                enabled={settings.notifications.orderNotifications}
                onChange={() => handleToggleChange('notifications', 'orderNotifications')}
              />
              
              <ToggleSwitch
                id="marketingEmails"
                label="Marketing Emails"
                enabled={settings.notifications.marketingEmails}
                onChange={() => handleToggleChange('notifications', 'marketingEmails')}
              />
              
              <ToggleSwitch
                id="lowStockAlerts"
                label="Low Stock Alerts"
                enabled={settings.notifications.lowStockAlerts}
                onChange={() => handleToggleChange('notifications', 'lowStockAlerts')}
              />
            </div>
          </section>
          
          {/* Security Settings */}
          <section id="security" className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">Security Settings</h2>
            <div className="space-y-4">
              <ToggleSwitch
                id="twoFactorAuth"
                label="Two Factor Authentication"
                enabled={settings.security.twoFactorAuth}
                onChange={() => handleToggleChange('security', 'twoFactorAuth')}
              />
              
              <div>
                <label htmlFor="sessionTimeout" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Session Timeout (minutes)
                </label>
                <select
                  id="sessionTimeout"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleInputChange('security', 'sessionTimeout', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="passwordExpiry" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password Expiry (days)
                </label>
                <select
                  id="passwordExpiry"
                  value={settings.security.passwordExpiry}
                  onChange={(e) => handleInputChange('security', 'passwordExpiry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>
          </section>
          
          {/* Save Button */}
          <div className="flex justify-end">
            <button 
              type="button" 
              onClick={saveSettings}
              disabled={saving || !adminId}
              className="px-6 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:bg-blue-300 dark:disabled:bg-blue-800"
              aria-label="Save settings"
            >
              {saving ? (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSettingsPage;