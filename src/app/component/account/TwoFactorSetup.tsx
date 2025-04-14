'use client';

import React, { useState, useEffect } from 'react';
import { FiCheck, FiCopy } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { auth } from '@/firebase/firebase';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import toast from 'react-hot-toast';

interface TwoFactorSetupProps {
  onClose: () => void;
  onSuccess: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onClose, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [step, setStep] = useState<'password' | 'setup' | 'verify'>('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);
  
  // In a real app, this would come from your backend
  // For demo purposes, we're just generating a fake TOTP secret
  useEffect(() => {
    // Generate a random secret key (in a real app, this would come from your backend)
    const generateRandomKey = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let result = '';
      for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    if (step === 'setup' && !secretKey) {
      setSecretKey(generateRandomKey());
    }
  }, [step, secretKey]);
  
  const handlePasswordVerification = async () => {
    setError('');
    
    if (!currentPassword) {
      setError('Password is required to enable 2FA');
      return;
    }
    
    const user = auth.currentUser;
    if (!user || !user.email) {
      setError('User not authenticated');
      return;
    }
    
    setLoading(true);
    
    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Move to setup step
      setStep('setup');
    } catch (error) {
      const firebaseError = error as { code?: string, message: string };
      if (firebaseError.code === 'auth/wrong-password') {
        setError('Password is incorrect');
      } else {
        setError(`Error verifying password: ${firebaseError.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopySecretKey = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleVerifyCode = () => {
    setError('');
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }
    
    setLoading(true);
    
    // In a real app, you would verify this with your backend
    // For demo purposes, we'll just simulate verification
    setTimeout(() => {
      // For demo, we accept any 6-digit code
      if (/^\d{6}$/.test(verificationCode)) {
        toast.success('Two-factor authentication enabled successfully!');
        onSuccess();
      } else {
        setError('Invalid verification code. Please try again.');
      }
      setLoading(false);
    }, 1500);
  };
  
  const handleBackToSetup = () => {
    setStep('setup');
    setVerificationCode('');
    setError('');
  };
  
  const getAppName = () => {
    // Get the app name from meta or use a default
    const metaTag = document.querySelector('meta[name="application-name"]');
    return metaTag?.getAttribute('content') || 'Mini Commerce';
  };
  
  const getOtpAuthUrl = () => {
    const user = auth.currentUser;
    const appName = encodeURIComponent(getAppName());
    const email = encodeURIComponent(user?.email || 'user@example.com');
    return `otpauth://totp/${appName}:${email}?secret=${secretKey}&issuer=${appName}`;
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
      <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
        Two-Factor Authentication Setup
      </h2>
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}
      
      {step === 'password' && (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            For your security, please enter your current password to enable two-factor authentication.
          </p>
          
          <div>
            <label htmlFor="current-password" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Password
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your current password"
              disabled={loading}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePasswordVerification}
              className={`px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </div>
        </div>
      )}
      
      {step === 'setup' && (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Scan this QR code with your authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator).
          </p>
          
          <div className="flex flex-col items-center p-4 bg-white rounded-lg dark:bg-gray-700">
            <QRCodeSVG 
              value={getOtpAuthUrl()} 
              size={200} 
              fgColor="#000000"
              bgColor="#FFFFFF"
              level="H"
              className="mb-4 rounded"
            />
            
            <div className="w-full mt-4">
              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Or enter this code manually:
              </p>
              <div className="flex items-center">
                <code className="flex-grow p-2 font-mono text-sm text-gray-800 bg-gray-100 rounded dark:bg-gray-600 dark:text-gray-200">
                  {secretKey.replace(/(.{4})/g, '$1 ').trim()}
                </code>
                <button
                  type="button"
                  onClick={handleCopySecretKey}
                  className="p-2 ml-2 text-gray-700 bg-gray-100 rounded-full dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500"
                  aria-label="Copy secret key"
                >
                  {copied ? <FiCheck size={20} className="text-green-500" /> : <FiCopy size={20} />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setStep('verify')}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {step === 'verify' && (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Enter the 6-digit verification code from your authenticator app to verify setup.
          </p>
          
          <div>
            <label htmlFor="verification-code" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Verification Code
            </label>
            <input
              id="verification-code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-2 font-mono text-lg tracking-wider text-center text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="000000"
              maxLength={6}
              disabled={loading}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleBackToSetup}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              disabled={loading}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleVerifyCode}
              className={`px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Enable 2FA'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup; 