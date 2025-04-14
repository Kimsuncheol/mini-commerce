import React, { memo, useState, useEffect } from 'react';
import { FiLock, FiAlertTriangle, FiBell, FiTrash2, FiShield, FiSun, FiMoon, FiX } from 'react-icons/fi';
import { CgScreen } from 'react-icons/cg'; // Import the system/auto icon
import { useTheme } from 'next-themes';
import { auth, firestore } from '@/firebase/firebase';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast'; // or your preferred toast library
import PasswordChangeForm from '../account/PasswordChangeForm';
import TwoFactorSetup from '../account/TwoFactorSetup';


interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}

const SettingsSection = memo(({ title, icon, children, variant = 'default' }: SettingsSectionProps) => (
  <div className={`p-5 border rounded-lg ${
    variant === 'danger' 
      ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20' 
      : 'border-gray-200 dark:border-gray-700'
  }`}>
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 rounded-full ${
        variant === 'danger'
          ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
          : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      }`}>
        {icon}
      </div>
      <h3 className={`text-lg font-medium ${
        variant === 'danger' 
          ? 'text-red-800 dark:text-red-300' 
          : 'text-gray-900 dark:text-white'
      }`}>
        {title}
      </h3>
    </div>
    {children}
  </div>
));

SettingsSection.displayName = 'SettingsSection';

interface ToggleSwitchProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}

const ToggleSwitch = memo(({ id, label, description, checked, onChange }: ToggleSwitchProps) => (
  <div className="flex items-start">
    <div className="flex items-center h-5">
      <input
        id={id}
        aria-describedby={`${id}-description`}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`flex w-10 h-6 transition duration-200 ease-in-out rounded-full ${
          checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
        aria-labelledby={`${id}-label`}
      >
        <span
          className={`inline-block w-5 h-5 transition duration-200 ease-in-out transform bg-white rounded-full shadow ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
    <div className="ml-3 text-sm">
      <label id={`${id}-label`} htmlFor={id} className="font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {description && (
        <p id={`${id}-description`} className="text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  </div>
));

ToggleSwitch.displayName = 'ToggleSwitch';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = memo(({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="w-full max-w-sm p-6 m-4 bg-white rounded-lg shadow-xl dark:bg-gray-800">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-gray-600 dark:text-gray-300">{message}</p>
      <div className="flex justify-end mt-4 space-x-3">
        <button
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-650"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
));

ConfirmDialog.displayName = 'ConfirmDialog';

const SettingsTab = memo(() => {
  const [notificationSettings, setNotificationSettings] = useState({
    newProduct: false,
    orderUpdates: true,
    specialOffers: true,
    newsletter: false,
    accountActivity: true,
  });
  
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [systemPreference, setSystemPreference] = useState<string | undefined>(undefined);
  const router = useRouter();
  
  // Use effect to avoid hydration mismatch and detect system preference
  useEffect(() => {
    setMounted(true);
    // Get the system preference
    setSystemPreference(systemTheme);
    
    // Optional: Add listener for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [systemTheme]);
  
  const handleToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleDeleteAccount = async () => {
    try {
      // Get the current user from Firebase Auth
      const user = auth.currentUser;
      
      if (!user) {
        console.error("No user is currently signed in");
        toast.error("You must be logged in to delete your account");
        return;
      }
  
      // Optional: Reauthenticate the user before deletion if required
      // This is especially important for sensitive operations
      // const credential = firebase.auth.EmailAuthProvider.credential(
      //   user.email as string,
      //   currentPassword
      // );
      // await user.reauthenticateWithCredential(credential);
  
      // Delete user data from Firestore if needed
      const userId = user.uid;
      await deleteDoc(doc(firestore, "users", userId));
  
      // Delete any user storage items if needed
      // For example, profile pictures
      // const storageRef = ref(storage, `users/${userId}/profilePicture`);
      // await deleteObject(storageRef);
  
      // Finally delete the user account
      await deleteUser(user);
      
      // Show success message
      toast.success("Your account has been deleted successfully");
      
      // Redirect to homepage or login page
      router.push("/");
      
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again later.");
    }
  };
  
  const handleTwoFactorSetupSuccess = () => {
    setShowTwoFactorSetup(false);
    toast.success('Two-factor authentication enabled successfully!');
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordChangeForm(false);
    toast.success('Password updated successfully!');
  };
  
  // Display helpers for the theme buttons
  const isLightActive = mounted && theme === 'light';
  const isDarkActive = mounted && theme === 'dark';
  const isSystemActive = mounted && theme === 'system';

  return (
    <div className="container max-w-4xl px-4 py-8 mx-auto">
      <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Account Settings</h2>
      
      <div className="space-y-6">
        {/* Appearance Section - With 3 buttons */}
        <SettingsSection title="Appearance" icon={isDarkActive ? <FiMoon size={20} /> : <FiSun size={20} />}>
          <div className="mt-4">
            <div className="flex flex-col py-2">
              <div className="mb-3">
                <label id="theme-selection" className="text-base font-medium text-gray-700 dark:text-gray-300">
                  Choose Theme
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select your preferred appearance mode
                </p>
              </div>
              
              {/* Theme Selection Buttons */}
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4" role="radiogroup" aria-labelledby="theme-selection">
                {/* Light Theme Button */}
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 border rounded-lg transition-all duration-200 ${
                    isLightActive 
                      ? 'bg-blue-50 border-blue-300 shadow-sm dark:bg-blue-900/30 dark:border-blue-700' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750'
                  }`}
                  role="radio"
                  aria-checked={isLightActive}
                >
                  <FiSun size={24} className={`${isLightActive ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className={`font-medium ${isLightActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      Light
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Always light mode
                    </div>
                  </div>
                  {isLightActive && (
                    <div className="w-3 h-3 ml-auto bg-blue-500 rounded-full"></div>
                  )}
                </button>
                
                {/* Dark Theme Button */}
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 border rounded-lg transition-all duration-200 ${
                    isDarkActive 
                      ? 'bg-blue-50 border-blue-300 shadow-sm dark:bg-blue-900/30 dark:border-blue-700' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750'
                  }`}
                  role="radio"
                  aria-checked={isDarkActive}
                >
                  <FiMoon size={24} className={`${isDarkActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className={`font-medium ${isDarkActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      Dark
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Always dark mode
                    </div>
                  </div>
                  {isDarkActive && (
                    <div className="w-3 h-3 ml-auto bg-blue-500 rounded-full"></div>
                  )}
                </button>
                
                {/* System Theme Button */}
                <button
                  onClick={() => setTheme('system')}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 border rounded-lg transition-all duration-200 ${
                    isSystemActive 
                      ? 'bg-blue-50 border-blue-300 shadow-sm dark:bg-blue-900/30 dark:border-blue-700' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750'
                  }`}
                  role="radio"
                  aria-checked={isSystemActive}
                >
                  <CgScreen size={24} className={`${isSystemActive ? 'text-green-500' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className={`font-medium ${isSystemActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      System
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Follow device
                    </div>
                  </div>
                  {isSystemActive && (
                    <div className="w-3 h-3 ml-auto bg-blue-500 rounded-full"></div>
                  )}
                </button>
              </div>
              
              <div className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
                {mounted && (
                  theme === 'dark' 
                    ? 'Dark mode will be applied regardless of your device settings' 
                    : theme === 'light'
                      ? 'Light mode will be applied regardless of your device settings'
                      : 'System theme automatically switches based on your device settings'
                )}
              </div>
              {mounted && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {theme === 'system' && systemPreference && `Using your system preference: ${systemPreference === 'dark' ? 'Dark' : 'Light'} mode`}
                </div>
              )}
            </div>
          </div>
        </SettingsSection>
        
        <SettingsSection title="Notifications" icon={<FiBell size={20} />}>
          <div className="mt-2 space-y-3">
            <ToggleSwitch
              id="order-updates"
              label="Order updates"
              description="Get notified about the status of your orders"
              checked={notificationSettings.orderUpdates}
              onChange={() => handleToggle('orderUpdates')}
            />
            <ToggleSwitch
              id="promotions"
              label="Promotions and deals"
              description="Receive notifications about sales and special offers"
              checked={notificationSettings.specialOffers}
              onChange={() => handleToggle('specialOffers')}
            />
            <ToggleSwitch
              id="account-activity"
              label="Account activity"
              description="Get important notifications about your account"
              checked={notificationSettings.accountActivity}
              onChange={() => handleToggle('accountActivity')}
            />
          </div>
        </SettingsSection>
        
        <SettingsSection title="Security" icon={<FiShield size={20} />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Two-factor authentication</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
              </div>
              <button 
                onClick={() => setShowTwoFactorSetup(true)}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                Setup
              </button>
            </div>
          </div>
        </SettingsSection>
        
        <SettingsSection title="Password" icon={<FiLock size={20} />}>
          <div>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Change your password regularly to keep your account secure.
            </p>
            <button 
              onClick={() => setShowPasswordChangeForm(true)}
              className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Change Password
            </button>
          </div>
        </SettingsSection>
        
        <SettingsSection title="Danger Zone" icon={<FiAlertTriangle size={20} />} variant="danger">
          <div>
            <p className="mb-4 text-red-600 dark:text-red-400">
              Once you delete your account, all of your data will be permanently removed. This action cannot be undone.
            </p>
            <button 
              onClick={() => setShowDeleteConfirmation(true)}
              className="flex items-center px-4 py-2 text-red-600 transition-colors bg-white border border-red-600 rounded hover:bg-red-50 dark:bg-transparent dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
            >
              <FiTrash2 className="mr-2" />
              Delete Account
            </button>
          </div>
        </SettingsSection>
      </div>
      
      {showDeleteConfirmation && (
        <ConfirmDialog
          title="Delete Account"
          message="Are you sure you want to delete your account? All of your data will be permanently removed. This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteConfirmation(false)}
        />
      )}
      
      {/* Password Change Dialog */}
      {showPasswordChangeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative max-w-md mx-auto">
            <button
              className="absolute top-0 right-0 z-50 p-2 m-2 text-gray-600 transform translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-md dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => setShowPasswordChangeForm(false)}
              aria-label="Close password change form"
            >
              <FiX size={20} />
            </button>
            <PasswordChangeForm 
              onClose={() => setShowPasswordChangeForm(false)} 
              onSuccess={handlePasswordChangeSuccess}
            />
          </div>
        </div>
      )}
      
      {/* Two-Factor Authentication Setup Dialog */}
      {showTwoFactorSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative max-w-md mx-auto">
            <button
              className="absolute top-0 right-0 z-50 p-2 m-2 text-gray-600 transform translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-md dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => setShowTwoFactorSetup(false)}
              aria-label="Close two-factor authentication setup"
            >
              <FiX size={20} />
            </button>
            <TwoFactorSetup 
              onClose={() => setShowTwoFactorSetup(false)}
              onSuccess={handleTwoFactorSetupSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
});

SettingsTab.displayName = 'SettingsTab';
export default SettingsTab;