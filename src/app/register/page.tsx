"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiAlertCircle,
  FiArrowRight,
  FiGithub,
  FiTwitter,
  FiUser,
  FiCheckCircle,
  FiShield,
  FiMapPin,
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { auth, db } from '@/firebase/firebase';
import { 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import KakaoPostcodeComponent from '@/components/KakaoPostcode';

// Define the available user roles
type UserRole = 'user' | 'admin';

const RegisterPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [role, setRole] = useState<UserRole>('user');
  
  // Address fields
  const [postcode, setPostcode] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/account');
      } else {
        setIsChecking(false);
      }
    });
    
    return () => unsubscribe();
  }, [router]);

  // Check password strength
  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength(null);
      return;
    }
    
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    
    if (isLongEnough && hasLetters && hasNumbers && hasSpecialChars) {
      setPasswordStrength('strong');
    } else if (isLongEnough && ((hasLetters && hasNumbers) || (hasLetters && hasSpecialChars) || (hasNumbers && hasSpecialChars))) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('weak');
    }
  }, [password]);

  // Handle postcode selection
  const handleComplete = (data: any) => {
    let fullAddress = data.address;
    let extraAddress = '';

    if (data.addressType === 'R') {
      if (data.bname !== '') {
        extraAddress += data.bname;
      }
      if (data.buildingName !== '') {
        extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
      }
      fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
    }

    setPostcode(data.zonecode);
    setAddress1(fullAddress);
    setIsPostcodeOpen(false);
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!termsAccepted) {
      setError('Please accept the terms and conditions');
      return;
    }
    
    if (!postcode || !address1) {
      setError('Please enter your address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with name
      await updateProfile(user, {
        displayName: name
      });
      
      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        email: email,
        createdAt: serverTimestamp(),
        joinedDate: new Date().toISOString().split('T')[0],
        role: role, // Store the selected role
        address: {
          postcode: postcode,
          address1: address1,
          address2: address2
        }
      });
      
      router.push('/login');
    } catch (err: any) {
      console.error(err);
      switch(err.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address format');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters');
          break;
        default:
          setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        joinedDate: new Date().toISOString().split('T')[0],
        role: 'user' // Default role for Google sign-up
      }, { merge: true });
      
      router.push('/account');
    } catch (err) {
      console.error(err);
      setError('Failed to sign up with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 overflow-hidden bg-white rounded-lg shadow-xl dark:bg-gray-800">
          {/* Header */}
          <div className="p-6 text-center bg-green-600 dark:bg-green-700">
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <p className="mt-1 text-green-100">Join ShopSmart to start shopping</p>
          </div>
          
          <div className="p-8">
            {/* Error display */}
            {error && (
              <div className="flex items-start p-4 mb-4 border border-red-200 rounded-md bg-red-50 dark:bg-red-900/30 dark:border-red-800">
                <FiAlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-3 mt-0.5" />
                <span className="text-sm text-red-800 dark:text-red-300">{error}</span>
              </div>
            )}
            
            {/* Registration form */}
            <form className="space-y-5" onSubmit={handleEmailRegister}>
              <div>
                <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiUser className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiMail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiLock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-2 pl-10 pr-10 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <FiEyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <FiEye className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Password strength indicator */}
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center">
                      <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                        <div 
                          className={`h-2 rounded-full ${
                            passwordStrength === 'weak' ? 'w-1/3 bg-red-500' : 
                            passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' : 
                            'w-full bg-green-500'
                          }`}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        {passwordStrength === 'weak' ? 'Weak' : 
                         passwordStrength === 'medium' ? 'Medium' : 
                         'Strong'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {passwordStrength === 'weak' ? 'Add numbers and special characters' : 
                       passwordStrength === 'medium' ? 'Good! Consider adding more variety' : 
                       'Excellent password!'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiLock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2 border rounded-md 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                             focus:outline-none focus:ring-2 focus:ring-green-500
                             ${confirmPassword && password !== confirmPassword 
                               ? 'border-red-500 dark:border-red-500' 
                               : 'border-gray-300 dark:border-gray-700'}`}
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="focus:outline-none"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <FiEye className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="flex items-center mt-1 text-xs text-green-600 dark:text-green-400">
                    <FiCheckCircle className="mr-1" /> Passwords match
                  </p>
                )}
              </div>

              {/* Address fields */}
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Address
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FiMapPin className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="postcode"
                        name="postcode"
                        value={postcode}
                        readOnly
                        placeholder="Postal Code"
                        className="w-full py-2 pl-10 pr-3 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPostcodeOpen(true)}
                      className="px-3 py-2 font-medium text-white transition-colors bg-green-600 rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                    >
                      Search Address
                    </button>
                  </div>
                  <input
                    type="text"
                    id="address1"
                    name="address1"
                    value={address1}
                    readOnly
                    placeholder="Street Address"
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    type="text"
                    id="address2"
                    name="address2"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    placeholder="Apartment, suite, unit, etc. (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              {/* Kakao Postcode Modal */}
              {isPostcodeOpen && (
                <KakaoPostcodeComponent
                  onComplete={handleComplete}
                  onClose={() => setIsPostcodeOpen(false)}
                />
              )}

              {/* Role Selection */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Account Type
                </label>
                <div className="flex flex-col gap-4 mt-2 sm:flex-row">
                  <div 
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                      role === 'user' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-700' 
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setRole('user')}
                  >
                    <input
                      type="radio"
                      name="role"
                      id="role-user"
                      value="user"
                      checked={role === 'user'}
                      onChange={() => setRole('user')}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <label htmlFor="role-user" className="block ml-3 cursor-pointer">
                      <span className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-100">
                        <FiUser className="mr-2 text-gray-500 dark:text-gray-400" /> Regular User
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Standard account with shopping capabilities
                      </span>
                    </label>
                  </div>

                  <div 
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                      role === 'admin' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700' 
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setRole('admin')}
                  >
                    <input
                      type="radio"
                      name="role"
                      id="role-admin"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={() => setRole('admin')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="role-admin" className="block ml-3 cursor-pointer">
                      <span className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-100">
                        <FiShield className="mr-2 text-gray-500 dark:text-gray-400" /> Administrator
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Manage products, orders, and users
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="font-medium text-gray-700 dark:text-gray-300">
                    I accept the 
                    <Link href="/terms" className="mx-1 text-green-600 dark:text-green-400 hover:underline">
                      Terms of Service
                    </Link>
                    and
                    <Link href="/privacy" className="ml-1 text-green-600 dark:text-green-400 hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !termsAccepted || password !== confirmPassword || !postcode || !address1}
                  className="relative flex justify-center w-full px-4 py-2 font-medium text-white transition duration-150 ease-in-out bg-green-600 border border-transparent rounded-md group hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                    </span>
                  ) : (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <FiArrowRight className="w-5 h-5 text-green-500 group-hover:text-green-400" />
                    </span>
                  )}
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400">
                    Or register with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6">
                <button
                  onClick={handleGoogleRegister}
                  className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 transition duration-150 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                  title="Sign up with Google"
                  aria-label="Sign up with Google"
                >
                  <FcGoogle className="w-5 h-5" />
                </button>
                <button
                  className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 transition duration-150 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                  title="Sign up with GitHub"
                  aria-label="Sign up with GitHub"
                >
                  <FiGithub className="w-5 h-5 text-gray-900 dark:text-white" />
                </button>
                <button
                  className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 transition duration-150 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                  title="Sign up with Twitter"
                  aria-label="Sign up with Twitter"
                >
                  <FiTwitter className="w-5 h-5 text-blue-400" />
                </button>
              </div>
            </div>
            
            {/* Sign in link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
                >
                  Sign in instead
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;