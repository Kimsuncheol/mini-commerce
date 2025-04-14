// Product related interfaces
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  category: string;
  stock: number;
  featured?: boolean;
  createdAt: number | Date;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number | Date;
}

// User related interfaces
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: number | Date;
  lastLogin?: number | Date;  // Added for user management
  status?: 'active' | 'suspended' | 'banned';  // Added for user management
}

// Update the UserAddress interface definition
export interface UserAddress {
  id?: string;
  userId?: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

// Cart related interfaces
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  addedAt: number | Date | FirestoreTimestamp | null;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: number | Date;
}

// Order related interfaces
export interface OrderItem extends CartItem {
  originalPrice?: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  discount?: number;
  appliedCoupon?: AppliedCoupon;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingAddress: UserAddress;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: number | Date;
  updatedAt: number | Date;
}

export interface PaymentButtonProps {
  amount: number;
  orderId: string;
  orderName: string;
  customerName: string;
  successUrl?: string;
  failUrl?: string;
  className?: string;
}

// Wishlist related interfaces
export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  addedAt: number | Date;
}

export interface Wishlist {
  userId: string;
  items: WishlistItem[];
  updatedAt: number | Date;
}

// Firebase specific interfaces
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
  toMillis: () => number;
}

// AccountPage related types
export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  address?: string;
  phone?: string;
  joinedDate?: string;
};

// OrderItem duplicate type issue - rename to avoid conflict
export type OrderSummary = {
  id: string;
  date: string;
  status: string;
  total: number;
  items: number;
};

export type ProfileFormData = {
  displayName: string;
  email: string;
  address?: string;
  phone?: string;
};

// Coupon related interfaces
export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: Date | number;
  endDate: Date | number;
  userType: 'new' | 'loyal' | 'all';
  description: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  products?: string[];  // Product IDs this coupon applies to (empty means all products)
  categories?: string[]; // Category IDs this coupon applies to (empty means all categories)
  createdAt: Date | number;
  updatedAt: Date | number;
}

export interface AppliedCoupon {
  couponId: string;
  code: string;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
}
