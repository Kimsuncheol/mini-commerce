'use client';

import React, { useState, useEffect } from 'react';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiX } from 'react-icons/fi';
import { auth } from '@/firebase/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import toast from 'react-hot-toast';

interface PasswordChangeFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Function to update user password
const updateUserPassword = async (user: any, newPassword: string) => {
  await updatePassword(user, newPassword);
};

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ onClose, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [error, setError] = useState('');

  // Check password strength
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(null);
      return;
    }
    
    const hasLetters = /[a-zA-Z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const isLongEnough = newPassword.length >= 8;
    
    if (isLongEnough && hasLetters && hasNumbers && hasSpecialChars) {
      setPasswordStrength('strong');
    } else if (isLongEnough && ((hasLetters && hasNumbers) || (hasLetters && hasSpecialChars) || (hasNumbers && hasSpecialChars))) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('weak');
    }
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate inputs
    if (!currentPassword) {
      setError('Current password is required');
      return;
    }
    
    if (!newPassword) {
      setError('New password is required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }
    
    if (passwordStrength === 'weak') {
      setError('Please use a stronger password');
      return;
    }
    
    const user = auth.currentUser;
    if (!user || !user.email) {
      setError('User not authenticated');
      return;
    }
    
    setLoading(true);
    
    try {
      // Reauthenticate user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updateUserPassword(user, newPassword);
      
      // Success notification
      toast.success('Password updated successfully');
      setLoading(false);
      onSuccess();
    } catch (error) {
      setLoading(false);
      const firebaseError = error as { code?: string, message: string };
      if (firebaseError.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else {
        setError(`Error updating password: ${firebaseError.message}`);
      }
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
      <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">Change Password</h2>
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label htmlFor="currentPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiLock className="w-5 h-5 text-gray-400" />
            </div>
            <input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full py-2 pl-10 pr-10 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter current password"
              disabled={loading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="focus:outline-none"
                tabIndex={-1}
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? (
                  <FiEyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                ) : (
                  <FiEye className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiLock className="w-5 h-5 text-gray-400" />
            </div>
            <input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full py-2 pl-10 pr-10 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter new password"
              disabled={loading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="focus:outline-none"
                tabIndex={-1}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
                  <FiEyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                ) : (
                  <FiEye className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                )}
              </button>
            </div>
          </div>
          
          {/* Password strength indicator */}
          {passwordStrength && (
            <div className="mt-1">
              <div className="w-full h-1 mt-2 bg-gray-200 rounded dark:bg-gray-700">
                <div
                  className={`h-1 rounded ${
                    passwordStrength === 'weak' ? 'bg-red-500 w-1/3' :
                    passwordStrength === 'medium' ? 'bg-yellow-500 w-2/3' :
                    'bg-green-500 w-full'
                  }`}
                />
              </div>
              <div className="flex items-center mt-1">
                <span
                  className={`text-xs ${
                    passwordStrength === 'weak' ? 'text-red-500' :
                    passwordStrength === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`}
                >
                  {passwordStrength === 'weak' ? 'Weak password' :
                   passwordStrength === 'medium' ? 'Medium strength' :
                   'Strong password'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Confirm New Password */}
        <div>
          <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiLock className="w-5 h-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full py-2 pl-10 pr-10 border text-gray-900 bg-white rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500
                ${confirmPassword && newPassword !== confirmPassword
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-700'}`}
              placeholder="Confirm new password"
              disabled={loading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="focus:outline-none"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <FiEyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                ) : (
                  <FiEye className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                )}
              </button>
            </div>
          </div>
          
          {/* Password match indicator */}
          {confirmPassword && (
            <div className="flex items-center mt-1">
              {newPassword === confirmPassword ? (
                <div className="flex items-center text-green-500">
                  <FiCheck className="w-4 h-4 mr-1" />
                  <span className="text-xs">Passwords match</span>
                </div>
              ) : (
                <div className="flex items-center text-red-500">
                  <FiX className="w-4 h-4 mr-1" />
                  <span className="text-xs">Passwords don't match</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end mt-6 space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordChangeForm; 