import { db, firestore } from '@/firebase/firebase';
import { Coupon, AppliedCoupon } from '@/types';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  startAfter
} from 'firebase/firestore';
import crypto from 'crypto';

// Get all coupons with pagination
export const getCoupons = async (
  lastVisible: QueryDocumentSnapshot<DocumentData> | null = null,
  limitCount: number = 20,
  filterActive?: boolean,
  filterUserType?: string
) => {
  try {
    const couponsRef = collection(firestore, 'coupons');
    const constraints = [];
    
    // Apply active filter if provided
    if (filterActive !== undefined) {
      constraints.push(where('isActive', '==', filterActive));
    }
    
    // Apply user type filter if provided
    if (filterUserType) {
      constraints.push(where('userType', '==', filterUserType));
    }
    
    // Apply sorting - most recent first
    constraints.push(orderBy('createdAt', 'desc'));
    
    // Apply pagination
    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }
    
    constraints.push(limit(limitCount));
    
    const q = query(couponsRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const coupons: Coupon[] = [];
    querySnapshot.forEach((doc) => {
      const couponData = doc.data();
      coupons.push({
        id: doc.id,
        ...couponData,
        startDate: couponData.startDate instanceof Timestamp 
          ? couponData.startDate.toDate() 
          : couponData.startDate,
        endDate: couponData.endDate instanceof Timestamp 
          ? couponData.endDate.toDate() 
          : couponData.endDate,
        createdAt: couponData.createdAt instanceof Timestamp 
          ? couponData.createdAt.toDate() 
          : couponData.createdAt,
        updatedAt: couponData.updatedAt instanceof Timestamp 
          ? couponData.updatedAt.toDate() 
          : couponData.updatedAt
      } as Coupon);
    });
    
    // Get the last visible document for pagination
    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return {
      coupons,
      lastVisible: lastVisibleDoc,
      hasMore: querySnapshot.docs.length >= limitCount
    };
  } catch (error) {
    console.error('Error getting coupons:', error);
    throw error;
  }
};

// Get a single coupon by ID
export const getCouponById = async (couponId: string): Promise<Coupon | null> => {
  try {
    const couponDoc = await getDoc(doc(db, 'coupons', couponId));
    if (couponDoc.exists()) {
      const couponData = couponDoc.data();
      return {
        id: couponDoc.id,
        ...couponData,
        startDate: couponData.startDate instanceof Timestamp 
          ? couponData.startDate.toDate() 
          : couponData.startDate,
        endDate: couponData.endDate instanceof Timestamp 
          ? couponData.endDate.toDate() 
          : couponData.endDate,
        createdAt: couponData.createdAt instanceof Timestamp 
          ? couponData.createdAt.toDate() 
          : couponData.createdAt,
        updatedAt: couponData.updatedAt instanceof Timestamp 
          ? couponData.updatedAt.toDate() 
          : couponData.updatedAt
      } as Coupon;
    }
    return null;
  } catch (error) {
    console.error('Error getting coupon by ID:', error);
    throw error;
  }
};

// Get a coupon by code
export const getCouponByCode = async (code: string): Promise<Coupon | null> => {
  try {
    const couponsRef = collection(firestore, 'coupons');
    const q = query(couponsRef, where('code', '==', code.toUpperCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const couponDoc = querySnapshot.docs[0];
    const couponData = couponDoc.data();
    return {
      id: couponDoc.id,
      ...couponData,
      startDate: couponData.startDate instanceof Timestamp 
        ? couponData.startDate.toDate() 
        : couponData.startDate,
      endDate: couponData.endDate instanceof Timestamp 
        ? couponData.endDate.toDate() 
        : couponData.endDate,
      createdAt: couponData.createdAt instanceof Timestamp 
        ? couponData.createdAt.toDate() 
        : couponData.createdAt,
      updatedAt: couponData.updatedAt instanceof Timestamp 
        ? couponData.updatedAt.toDate() 
        : couponData.updatedAt
    } as Coupon;
  } catch (error) {
    console.error('Error getting coupon by code:', error);
    throw error;
  }
};

// Create a new coupon
export const createCoupon = async (couponData: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<string> => {
  try {
    // Convert string code to uppercase
    couponData.code = couponData.code.toUpperCase();
    
    // Validate the coupon code doesn't already exist
    const existingCoupon = await getCouponByCode(couponData.code);
    if (existingCoupon) {
      throw new Error('Coupon code already exists');
    }
    
    const couponRef = collection(db, 'coupons');
    const newCoupon = {
      ...couponData,
      usageCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(couponRef, newCoupon);
    return docRef.id;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
};

// Update an existing coupon
export const updateCoupon = async (couponId: string, couponData: Partial<Coupon>): Promise<void> => {
  try {
    // Convert code to uppercase if it's being updated
    if (couponData.code) {
      couponData.code = couponData.code.toUpperCase();
      
      // If code is being updated, check that it doesn't conflict with another coupon
      const existingCoupon = await getCouponByCode(couponData.code);
      if (existingCoupon && existingCoupon.id !== couponId) {
        throw new Error('Coupon code already exists');
      }
    }
    
    const couponRef = doc(db, 'coupons', couponId);
    await updateDoc(couponRef, {
      ...couponData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }
};

// Delete a coupon
export const deleteCoupon = async (couponId: string): Promise<void> => {
  try {
    const couponRef = doc(db, 'coupons', couponId);
    await deleteDoc(couponRef);
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }
};

// Apply a coupon - validates and returns discount information
export const applyCoupon = async (
  couponCode: string, 
  userId: string, 
  subtotal: number,
  productIds: string[] = [], 
  categoryIds: string[] = []
): Promise<AppliedCoupon> => {
  try {
    // Get the coupon by code
    const coupon = await getCouponByCode(couponCode);
    if (!coupon) {
      throw new Error('Invalid coupon code');
    }
    
    // Check if coupon is active
    if (!coupon.isActive) {
      throw new Error('This coupon is no longer active');
    }
    
    // Check if coupon is within valid date range
    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      throw new Error('This coupon is expired or not yet active');
    }
    
    // Check if the coupon has reached its usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new Error('This coupon has reached its usage limit');
    }
    
    // Check if the subtotal meets the minimum purchase requirement
    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      throw new Error(`Minimum purchase amount of $${coupon.minPurchase.toFixed(2)} required`);
    }
    
    // Check product and category restrictions
    if (coupon.products && coupon.products.length > 0) {
      const hasValidProduct = productIds.some(id => coupon.products?.includes(id));
      if (!hasValidProduct) {
        throw new Error('This coupon is not valid for the selected products');
      }
    }
    
    if (coupon.categories && coupon.categories.length > 0) {
      const hasValidCategory = categoryIds.some(id => coupon.categories?.includes(id));
      if (!hasValidCategory) {
        throw new Error('This coupon is not valid for the selected product categories');
      }
    }
    
    // Check user type restriction
    if (coupon.userType !== 'all') {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const userCreatedAt = userData.createdAt instanceof Timestamp 
        ? userData.createdAt.toDate() 
        : new Date(userData.createdAt);
      const daysSinceRegistration = Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // For new users (less than 30 days)
      if (coupon.userType === 'new' && daysSinceRegistration > 30) {
        throw new Error('This coupon is only valid for new members');
      }
      
      // For loyal users (more than 90 days)
      if (coupon.userType === 'loyal' && daysSinceRegistration < 90) {
        throw new Error('This coupon is only valid for long-term members');
      }
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = subtotal * (coupon.value / 100);
      
      // Apply max discount cap if specified
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      // Fixed amount discount
      discountAmount = Math.min(coupon.value, subtotal); // Can't discount more than the subtotal
    }
    
    // Increment usage count
    await updateDoc(doc(db, 'coupons', coupon.id), {
      usageCount: coupon.usageCount + 1,
      updatedAt: serverTimestamp()
    });
    
    return {
      couponId: coupon.id,
      code: coupon.code,
      discountAmount,
      discountType: coupon.type
    };
  } catch (error: unknown) {
    console.error('Error applying coupon:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to apply coupon');
    }
    throw new Error('Failed to apply coupon');
  }
};

// Get coupons for a specific user
export const getUserCoupons = async (userId: string): Promise<Coupon[]> => {
  try {
    // First, get the user data to determine their status
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const userCreatedAt = userData.createdAt instanceof Timestamp 
      ? userData.createdAt.toDate() 
      : new Date(userData.createdAt);
    
    const now = new Date();
    const daysSinceRegistration = Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine what type of user they are
    const isNewUser = daysSinceRegistration <= 30;
    const isLoyalUser = daysSinceRegistration >= 90;
    
    // Get all active coupons
    const couponsRef = collection(firestore, 'coupons');
    const q = query(
      couponsRef,
      where('isActive', '==', true),
      where('endDate', '>', Timestamp.fromDate(now))
    );
    
    const querySnapshot = await getDocs(q);
    
    const coupons: Coupon[] = [];
    querySnapshot.forEach((doc) => {
      const couponData = doc.data();
      const coupon = {
        id: doc.id,
        ...couponData,
        startDate: couponData.startDate instanceof Timestamp 
          ? couponData.startDate.toDate() 
          : couponData.startDate,
        endDate: couponData.endDate instanceof Timestamp 
          ? couponData.endDate.toDate() 
          : couponData.endDate,
        createdAt: couponData.createdAt instanceof Timestamp 
          ? couponData.createdAt.toDate() 
          : couponData.createdAt,
        updatedAt: couponData.updatedAt instanceof Timestamp 
          ? couponData.updatedAt.toDate() 
          : couponData.updatedAt
      } as Coupon;
      
      // Filter by user type
      if (
        coupon.userType === 'all' || 
        (coupon.userType === 'new' && isNewUser) || 
        (coupon.userType === 'loyal' && isLoyalUser)
      ) {
        coupons.push(coupon);
      }
    });
    
    return coupons;
  } catch (error: unknown) {
    console.error('Error getting user coupons:', error);
    throw error;
  }
};

// A simpler fallback coupon code generator that doesn't rely on encryption
export const generateSimpleCouponCode = async (
  options: {
    prefix?: string;
    length?: number;
    useNumbers?: boolean;
    useLetters?: boolean;
    separator?: string;
    segmentLength?: number;
  } = {}
): Promise<string> => {
  try {
    // Set defaults for options
    const {
      prefix = '',
      length = 8,
      useNumbers = true,
      useLetters = true,
      separator = '-',
      segmentLength = 4
    } = options;

    // Create character set based on options
    let charset = '';
    if (useLetters) charset += 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude O and I to avoid confusion
    if (useNumbers) charset += '23456789'; // Exclude 0 and 1 to avoid confusion
    
    if (charset.length === 0) charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Default charset

    // Generate random code
    let code = '';
    const randomValues = new Uint8Array(length);
    
    // Use crypto.getRandomValues if available (browser)
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(randomValues);
    } else {
      // Fallback for environments without crypto.getRandomValues
      for (let i = 0; i < length; i++) {
        randomValues[i] = Math.floor(Math.random() * 256);
      }
    }
    
    // Generate code from random values
    for (let i = 0; i < length; i++) {
      code += charset.charAt(randomValues[i] % charset.length);
    }
    
    // Add a checksum character
    const checksumBase = code + (prefix || '');
    const checksumValue = Array.from(checksumBase)
      .reduce((sum, char) => sum + char.charCodeAt(0), 0) % charset.length;
    const checksumChar = charset.charAt(checksumValue);
    
    // Format the code with segments if needed
    let formattedCode = code;
    if (segmentLength > 0 && code.length > segmentLength) {
      formattedCode = '';
      for (let i = 0; i < code.length; i += segmentLength) {
        formattedCode += code.substring(i, i + segmentLength);
        if (i + segmentLength < code.length) formattedCode += separator;
      }
    }
    
    // Combine prefix, formatted code, and checksum
    const fullCode = (prefix ? `${prefix}${separator}` : '') + formattedCode + checksumChar;
    
    // Check if this code already exists
    const existingCoupon = await getCouponByCode(fullCode);
    if (existingCoupon) {
      // Recursively try again if code already exists
      return generateSimpleCouponCode(options);
    }
    
    return fullCode;
  } catch (error) {
    console.error('Error generating simple coupon code:', error);
    
    // Ultimate fallback - generate a very basic code
    const prefix = options.prefix || '';
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return prefix ? `${prefix}-${randomPart}` : randomPart;
  }
};

// Update the main generateCouponCode function to use the simple generator as fallback
export const generateCouponCode = async (
  options: {
    prefix?: string;
    length?: number;
    useNumbers?: boolean;
    useLetters?: boolean;
    separator?: string;
    segmentLength?: number;
    expiryDays?: number;
    discountValue?: number;
    discountType?: 'percentage' | 'fixed';
  } = {}
): Promise<string> => {
  try {
    // Set defaults for options
    const {
      prefix = '',
      length = 8,
      useNumbers = true,
      useLetters = true,
      separator = '-',
      segmentLength = 4,
      expiryDays = 30,
      discountValue,
      discountType = 'percentage'
    } = options;

    // Create a seed that includes the current timestamp and some random data
    const timestamp = Date.now().toString();
    const randomSeed = crypto.randomBytes(16).toString('hex');
    
    // Add encrypted metadata if discount info is provided
    let metadataPart = '';
    let encryptionSuccessful = false;
    
    if (discountValue !== undefined) {
      // Create a string with discount info - format: type|value|expiryDays
      const metadataString = `${discountType[0]}|${discountValue}|${expiryDays}`;
      
      try {
        // For AES-256-CBC, key must be exactly 32 bytes (256 bits) and IV must be 16 bytes
        // Use a crypto-safe way to create keys of correct length
        const keyMaterial = process.env.NEXT_PUBLIC_COUPON_ENCRYPTION_KEY || 'coupon-encryption-default-key-12345';
        const ivMaterial = process.env.NEXT_PUBLIC_COUPON_ENCRYPTION_IV || 'coupon-iv-12345';
        
        // Create a 32-byte key using SHA-256 hash
        const key = crypto.createHash('sha256').update(keyMaterial).digest();
        
        // Create a 16-byte IV using first 16 bytes of MD5 hash
        const iv = crypto.createHash('md5').update(ivMaterial).digest();
        
        // Create the cipher with correctly sized key and IV
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        
        // Encrypt the data
        let encrypted = cipher.update(metadataString, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Use first few characters of the encrypted string
        metadataPart = encrypted.substring(0, 8);
        encryptionSuccessful = true;
      } catch (encryptError) {
        console.error('Encryption error:', encryptError);
        // If encryption fails, fallback to simple generator
        return generateSimpleCouponCode({
          prefix,
          length,
          useNumbers,
          useLetters,
          separator,
          segmentLength
        });
      }
    }
    
    // If encryption failed or wasn't needed, proceed with normal generation
    // Combine seed with metadata
    const seed = timestamp + randomSeed + metadataPart;
    
    // Use the hash to generate a randomized code
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    
    // Create character set based on options
    let charset = '';
    if (useLetters) charset += 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude O and I to avoid confusion
    if (useNumbers) charset += '23456789'; // Exclude 0 and 1 to avoid confusion

    // Generate the random part of the code using the hash for entropy
    let code = '';
    for (let i = 0; i < length; i++) {
      const index = parseInt(hash.substring(i * 2, i * 2 + 2), 16) % charset.length;
      code += charset.charAt(index);
    }
    
    // Add a checksum digit/character to provide simple validation
    const checksumBase = code + (prefix || '');
    const checksumValue = Array.from(checksumBase)
      .reduce((sum, char) => sum + char.charCodeAt(0), 0) % charset.length;
    const checksumChar = charset.charAt(checksumValue);
    
    // Format the code with segments if needed
    let formattedCode = code;
    if (segmentLength > 0 && code.length > segmentLength) {
      formattedCode = '';
      for (let i = 0; i < code.length; i += segmentLength) {
        formattedCode += code.substring(i, i + segmentLength);
        if (i + segmentLength < code.length) formattedCode += separator;
      }
    }
    
    // Combine prefix, formatted code, and checksum
    const fullCode = (prefix ? `${prefix}${separator}` : '') + formattedCode + checksumChar;
    
    // Check if this code already exists
    const existingCoupon = await getCouponByCode(fullCode);
    if (existingCoupon) {
      // Recursively try again if code already exists
      return generateCouponCode(options);
    }
    
    return fullCode;
  } catch (error) {
    console.error('Error generating coupon code:', error);
    // Fall back to simple generator
    return generateSimpleCouponCode(options);
  }
};

// Decrypt and validate a coupon code
export const decryptCouponCode = (code: string): { 
  isValid: boolean; 
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  expiryDays?: number;
  message?: string;
} => {
  try {
    // This is a placeholder for actual decryption logic
    // In a real implementation, you would extract the encrypted part and decrypt it
    
    // Check if code is valid format first
    if (!code || code.length < 6) {
      throw new Error('Invalid coupon code format');
    }
    
    // For demonstration purposes, extract any actual discount info from the code
    // e.g., if the code contains metadata in parts separated by a separator
    console.log(`Attempting to decrypt coupon code: ${code}`);
    
    // Example implementation (not actually decrypting anything)
    return {
      isValid: true,
      // These values would come from actual decryption
      discountType: 'percentage',
      discountValue: 10,
      expiryDays: 30
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid or tampered coupon code';
    return {
      isValid: false,
      message: errorMessage
    };
  }
};

// Function to save a coupon to user's getCouponsList subcollection
export const saveCouponToUser = async (userId: string, couponId: string) => {
  try {
    if (!userId || !couponId) {
      throw new Error('User ID and coupon ID are required');
    }

    // Get the coupon data first
    const coupon = await getCouponById(couponId);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Create a reference to the user's getCouponsList subcollection
    const userCouponRef = collection(db, 'users', userId, 'getCouponsList');
    
    // Check if this coupon is already saved for this user
    const q = query(userCouponRef, where('couponId', '==', couponId));
    const existingDoc = await getDocs(q);
    
    if (!existingDoc.empty) {
      // Coupon already exists in user's collection
      return { success: true, alreadySaved: true };
    }
    
    // Add the coupon to the user's collection
    await addDoc(userCouponRef, {
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minPurchase: coupon.minPurchase,
      maxDiscount: coupon.maxDiscount,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      description: coupon.description,
      userType: coupon.userType,
      isActive: coupon.isActive,
      acquiredAt: serverTimestamp()
    });
    
    return { success: true, alreadySaved: false };
  } catch (error) {
    console.error('Error saving coupon to user:', error);
    throw error;
  }
};

// Function to get coupons that the user has saved/claimed from the getCouponsList subcollection
export const getUserSavedCoupons = async (userId: string): Promise<Coupon[]> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Reference to the user's getCouponsList subcollection
    const couponListRef = collection(db, 'users', userId, 'getCouponsList');
    const querySnapshot = await getDocs(couponListRef);
    
    const coupons: Coupon[] = [];
    
    // Process each document in the collection
    querySnapshot.forEach((doc) => {
      const couponData = doc.data();
      
      // Convert Firestore timestamps to Date objects
      const startDate = couponData.startDate instanceof Timestamp 
        ? couponData.startDate.toDate() 
        : new Date(couponData.startDate);
        
      const endDate = couponData.endDate instanceof Timestamp 
        ? couponData.endDate.toDate() 
        : new Date(couponData.endDate);
        
      const acquiredAt = couponData.acquiredAt instanceof Timestamp 
        ? couponData.acquiredAt.toDate() 
        : new Date(couponData.acquiredAt);
      
      // Create a coupon object with the correct format
      coupons.push({
        id: couponData.couponId,
        code: couponData.code,
        type: couponData.type,
        value: couponData.value,
        minPurchase: couponData.minPurchase,
        maxDiscount: couponData.maxDiscount,
        startDate,
        endDate,
        userType: couponData.userType || 'all',
        description: couponData.description,
        isActive: couponData.isActive !== false, // Default to active if not specified
        products: couponData.products || [],
        categories: couponData.categories || [],
        usageCount: couponData.usageCount || 0,
        usageLimit: couponData.usageLimit || 0,
        createdAt: acquiredAt,
        updatedAt: acquiredAt,
        
        // Add additional information not in the base Coupon type
        acquiredAt
      });
    });
    
    // Sort coupons by acquisition date (newest first)
    coupons.sort((a, b) => {
      const dateA = (a as any).acquiredAt;
      const dateB = (b as any).acquiredAt;
      return dateB.getTime() - dateA.getTime();
    });
    
    return coupons;
  } catch (error) {
    console.error('Error getting user saved coupons:', error);
    throw error;
  }
}; 