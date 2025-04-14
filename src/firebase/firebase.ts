import { initializeApp } from 'firebase/app';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  increment,
  setDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { deleteAllUserChats } from '@/app/services/chatService';
import { CartItem, Product } from '@/types';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const userEmail = auth.currentUser?.email || '';
const user = auth.currentUser;

// doc references
// Interface for Firebase document references
interface DocumentRefFunction {
  (userEmail: string, productId: string): ReturnType<typeof doc>;
}

const cartCollectionRef = (userEmail: string) => collection(db, 'carts', userEmail, 'items');
const wishlistCollectionRef = (userEmail: string) => collection(db, 'wishlists', userEmail, 'items');

// Wishlist item reference function with proper typing
const wishlistItemRef: DocumentRefFunction = (userEmail: string, productId: string) =>
  doc(db, 'wishlists', userEmail, 'items', productId);
const cartItemRef: DocumentRefFunction = (userEmail: string, productId: string) => doc(db, 'carts', userEmail, 'items', productId);

// Initialize analytics only in browser environment
let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
    } else {
      console.log("Firebase Analytics is not supported in this browser.");
    }
  });
}

// New types for wishlist functionality
export type WishlistItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  addedAt: Date;
  category?: string;
  originalPrice?: number;
  inStock?: boolean;
};

/////// Wishlist Functions ///////////

// Function to fetch wishlist items
export const fetchWishlistItems = async (userEmail: string): Promise<WishlistItem[]> => {
  try {
    if (!userEmail) {
      return [];
    }

    const querySnapshot = await getDocs(wishlistCollectionRef(userEmail));

    const items: WishlistItem[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      items.push({
        id: doc.id,
        productId: data.productId || doc.id,
        name: data.name || 'Unknown Product',
        price: data.price || 0,
        imageUrl: data.imageUrl || '/placeholder-product.jpg',
        addedAt: data.addedAt ? data.addedAt.toDate() : new Date(),
        category: data.category,
        originalPrice: data.originalPrice,
        inStock: data.inStock !== false // Default to true if not specified
      });
    });

    // Sort by most recently added
    items.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());

    return items;
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    throw error;
  }
};

// Function to remove an item from wishlist
export const removeFromWishlist = async (userEmail: string, productId: string) => {
  try {
    if (!userEmail) throw new Error('User email is required');

    await deleteDoc(wishlistItemRef(userEmail, productId));
    return { success: true };
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return { success: false, error };
  }
};

// Function to add item from wishlist to cart
export const addWishlistItemToCart = async (userEmail: string, item: Partial<WishlistItem>) => {
  try {
    if (!userEmail) throw new Error('User email is required');
    if (!item.productId) throw new Error('Product ID is required');

    // Construct a minimal Product object for addToCart
    const productToAdd: Partial<Product> = {
      id: item.productId,
      name: item.name || 'Unknown Product',
      price: item.price || 0,
      imageUrl: item.imageUrl || '/placeholder-product.jpg',
      // Add other required Product fields with defaults if necessary
      category: item.category || 'Unknown',
      stock: item.inStock ? 1 : 0, // Assuming inStock maps to stock > 0
      rating: 0, // Default value
      reviewCount: 0, // Default value
      createdAt: item.addedAt || new Date() // Default value
    };

    // Add to cart using existing addToCart function
    const result = await addToCart(userEmail, productToAdd as Product, 1); // Type assertion needed

    return result;
  } catch (error) {
    console.error("Error adding wishlist item to cart:", error);
    return {
      success: false,
      error,
      message: `Failed to add wishlist item to cart: ${(error as Error).message}`
    };
  }
};

// Function to add item to wishlist
export const addToWishlist = async (userEmail: string, product: Product) => {
  try {
    if (!userEmail) throw new Error('User email is required');
    if (!product || !product.id) throw new Error('Valid product data is required');

    // Use the wishlistItemRef function to get the document reference
    const itemRef = wishlistItemRef(userEmail, product.id);

    // Check if item already exists in wishlist
    const itemDoc = await getDoc(itemRef);

    if (itemDoc.exists()) {
      return {
        success: true,
        message: 'Item already in wishlist',
        isDuplicate: true
      };
    }

    // Item doesn't exist, add it to wishlist
    await setDoc(itemRef, {
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || '',
      addedAt: serverTimestamp(),
      inStock: product.stock > 0, // Map stock to inStock boolean
      category: product.category || ''
    });

    return {
      success: true,
      message: 'Item added to wishlist',
      isDuplicate: false
    };
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return {
      success: false,
      error,
      message: `Failed to add item to wishlist: ${(error as Error).message}`,
      isDuplicate: false
    };
  }
};

// Function to subscribe to wishlist changes in real-time
export const subscribeToWishlistChanges = (
  userEmail: string | null | undefined,
  onWishlistUpdate: (items: WishlistItem[]) => void,
  onError: (error: Error) => void
) => {
  if (!userEmail) {
    onWishlistUpdate([]);
    return () => { };
  }

  const unsubscribe = onSnapshot(wishlistCollectionRef(userEmail), (snapshot) => {
    const items: WishlistItem[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        productId: data.productId || doc.id,
        name: data.name || 'Unknown Product',
        price: data.price || 0,
        imageUrl: data.imageUrl || '/placeholder-product.jpg',
        addedAt: data.addedAt ? data.addedAt.toDate() : new Date(),
        category: data.category,
        originalPrice: data.originalPrice,
        inStock: data.inStock !== false
      });
    });

    // Sort by most recently added
    items.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());

    onWishlistUpdate(items);
  }, onError);

  return unsubscribe;
};

/////////// Cart Functions ///////////

export const checkDuplicatedItem = async (userEmail: string, productId: string): Promise<{ exists: boolean, currentQuantity: number }> => {
  try {
    if (!userEmail) return { exists: false, currentQuantity: 0 };

    const itemRef = cartItemRef(userEmail, productId);
    const itemDoc = await getDoc(itemRef);

    if (itemDoc.exists()) {
      const data = itemDoc.data();
      return {
        exists: true,
        currentQuantity: data.quantity || 0
      };
    }

    return { exists: false, currentQuantity: 0 };
  } catch (error) {
    console.error("Error checking for duplicate item:", error);
    return { exists: false, currentQuantity: 0 };
  }
};

export const addToCart = async (
  userEmail: string,
  product: Product,
  quantity: number = 1,
  incremental: boolean = false
) => {
  try {
    if (!userEmail) throw new Error('User email is required');
    if (!product || !product.id) throw new Error('Valid product data is required');
    if (quantity <= 0) throw new Error('Quantity must be greater than zero');

    // Check if the item already exists and get current quantity
    const { exists, currentQuantity } = await checkDuplicatedItem(userEmail, product.id);

    // Use the cartItemRef function to get the document reference
    const itemRef = cartItemRef(userEmail, product.id);

    if (exists) {
      // Item exists in cart
      if (incremental) {
        // If incremental mode, add to existing quantity
        await updateDoc(itemRef, {
          quantity: increment(quantity),
          updatedAt: serverTimestamp()
        });

        return {
          success: true,
          message: `Quantity increased by ${quantity}`,
          exists,
          previousQuantity: currentQuantity,
          newQuantity: currentQuantity + quantity
        };
      } else {
        // If not incremental mode, replace quantity with new value
        await updateDoc(itemRef, {
          quantity: quantity,  // Set to exact quantity
          updatedAt: serverTimestamp()
        });

        return {
          success: true,
          message: `Quantity updated to ${quantity}`,
          exists,
          previousQuantity: currentQuantity,
          newQuantity: quantity
        };
      }
    } else {
      // Item doesn't exist in cart, create new item
      await setDoc(itemRef, {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl || '',
        quantity: quantity,
        addedAt: serverTimestamp()
      });

      return {
        success: true,
        message: 'Item added to cart',
        exists: false,
        previousQuantity: 0,
        newQuantity: quantity
      };
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return {
      success: false,
      error,
      message: `Failed to add item to cart: ${(error as Error).message}`,
      exists: false,
      previousQuantity: 0,
      newQuantity: 0
    };
  }
};

// Similarly, update removeFromCart to use cartItemRef
export const removeFromCart = async (userEmail: string, productId: string) => {
  try {
    if (!userEmail) throw new Error('User email is required');

    // Use the cartItemRef function
    const itemRef = cartItemRef(userEmail, productId);
    await deleteDoc(itemRef);

    return { success: true };
  } catch (error) {
    console.error("Error removing from cart:", error);
    return { success: false, error };
  }
};

// And update cart quantity function
export const updateCartItemQuantity = async (userEmail: string, productId: string, newQuantity: number) => {
  try {
    if (!userEmail) throw new Error('User email is required');

    if (newQuantity <= 0) {
      return removeFromCart(userEmail, productId);
    }

    // Use the cartItemRef function
    const itemRef = cartItemRef(userEmail, productId);
    await updateDoc(itemRef, {
      quantity: newQuantity
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    return { success: false, error };
  }
};

export const clearUserCart = async (userEmail: string) => {
  try {
    const cartRef = collection(db, 'carts');
    const q = query(cartRef, where('userEmail', '==', userEmail));
    const querySnapshot = await getDocs(q);

    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
};

export const getCartCount = async (userEmail: string): Promise<{ itemCount: number, totalQuantity: number }> => {
  try {
    if (!userEmail) {
      return { itemCount: 0, totalQuantity: 0 };
    }

    // Get reference to the cart collection
    const cartRef = cartCollectionRef(userEmail);

    // Get all documents in the cart
    const querySnapshot = await getDocs(cartRef);

    // Count the number of documents
    const itemCount = querySnapshot.size;

    // Calculate the total quantity across all items
    let totalQuantity = 0;
    querySnapshot.forEach(doc => {
      const data = doc.data();
      totalQuantity += (data.quantity || 0);
    });

    return {
      itemCount,     // Number of unique products in cart
      totalQuantity  // Sum of all quantities across products
    };
  } catch (error) {
    console.error('Error counting cart items:', error);
    return { itemCount: 0, totalQuantity: 0 };
  }
};

/////// Product Functions ///////////

// Upload product images to Firebase Storage
export const uploadProductImages = async (imageFiles: File[], category: string): Promise<string[]> => {
  try {
    const imageUrls: string[] = [];

    for (const file of imageFiles) {
      // Properly handle file extension including WebP
      let fileExtension = file.name.split('.').pop()?.toLowerCase();

      // If no extension is detected or it's not valid, determine it from the MIME type
      if (!fileExtension || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
        switch (file.type) {
          case 'image/jpeg':
            fileExtension = 'jpg';
            break;
          case 'image/png':
            fileExtension = 'png';
            break;
          case 'image/gif':
            fileExtension = 'gif';
            break;
          case 'image/webp':
            fileExtension = 'webp';
            break;
          default:
            fileExtension = 'jpg'; // Default to jpg if type is unknown
        }
      }

      // Create a unique filename with the correct extension
      const fileName = `products/${category}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      imageUrls.push(downloadUrl);
    }

    return imageUrls;
  } catch (error) {
    console.error("Error uploading product images:", error);
    throw new Error(`Failed to upload images: ${(error as Error).message}`);
  }
};

// Add a new product to Firestore
export const createProduct = async (productData: Omit<Product, 'id'>, category: string) => {
  try {
    // Validate category is provided
    if (!category) {
      return {
        success: false,
        error: new Error('Category is required'),
        message: 'Failed to create product: Category is required'
      };
    }

    // Validate that productData is not undefined
    if (!productData) {
      return {
        success: false,
        error: new Error('Product data is required'),
        message: 'Failed to create product: Product data is required'
      };
    }

    // Filter out undefined values to prevent Firebase errors
    const filteredData: Partial<Product> = {};

    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Use a type-safe approach if possible, otherwise keep assertion
        // This assertion is often necessary when dynamically assigning properties
        (filteredData as Record<string, unknown>)[key] = value;
      }
    });

    // Add timestamp fields
    const productWithTimestamps = {
      ...filteredData,
      category, // Ensure category is included in the data
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Store in the main products collection
    const docRef = await addDoc(collection(firestore, 'products', category, 'items'), productWithTimestamps);

    // Also store in the "All Categories" collection with the same data
    try {
      const allCategoriesRef = collection(firestore, 'products', 'All categories', 'items');
      await setDoc(doc(allCategoriesRef, docRef.id), {
        ...productWithTimestamps,
        originalCategory: category, // Add the original category for reference
      });
    } catch (allCatError) {
      console.error('Error storing in All Categories:', allCatError);
      // Continue anyway since the main category storage succeeded
    }
    // const AllCategoriesdocRef = await addDoc(collection(firestore, 'products', 'All Categories', 'items'), productWithTimestamps);

    return {
      success: true,
      id: docRef.id,
      message: 'Product added successfully'
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      error,
      message: `Failed to create product: ${(error as Error).message}`
    };
  }
};

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(firestore, 'products');
    const snapshot = await getDocs(productsRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

// Get a single product by ID
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const docRef = doc(firestore, 'products', productId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Product;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
};

// Function to fetch products by category
export const fetchProductsByCategory = async (category?: string): Promise<Product[]> => {
  try {
    if (!category || category === 'All Categories') {
      // Use the existing function to get all products across categories
      return await getAllProductsFromSubcollections();
    } else {
      // Fetch from specific category subcollection
      const itemsCollectionRef = collection(db, 'products', category, 'items');
      const itemsSnapshot = await getDocs(itemsCollectionRef);

      return itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        category // Ensure category is included
      } as Product));
    }
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

// Get all products from subcollections
export const getAllProductsFromSubcollections = async (): Promise<Product[]> => {
  try {
    // 1. Get all category documents in the products collection
    const categoriesRef = collection(db, 'products');
    const categoriesSnapshot = await getDocs(categoriesRef);

    console.log(`Number of categories found: ${categoriesSnapshot.size}`);

    console.log(categoriesSnapshot.empty);

    if (categoriesSnapshot.empty) {
      console.log('No categories found.');
      return [];
    }

    // 2. For each category, get all items in its subcollection
    const allProductsPromises = categoriesSnapshot.docs.map(async (categoryDoc) => {
      const categoryName = categoryDoc.id;
      console.log(`Fetching items for category 222222: ${categoryName}`);

      // // Get the items subcollection for this category
      // const itemsRef = collection(db, 'products', categoryName, 'items');
      // const itemsSnapshot = await getDocs(itemsRef);

      // // Map the items data and include the parent category
      // return itemsSnapshot.docs.map(itemDoc => ({
      //   id: itemDoc.id,
      //   ...itemDoc.data(),
      //   category: categoryName // Make sure category is included
      // })) as Product[];

      const itemsRef = collection(db, 'products', categoryName, 'items');
      const itemsSnapshot = await getDocs(itemsRef);
      return itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        category: doc.data().category || categoryName, // Include the category
      })) as Product[];

      // getDoc
    });

    // 3. Wait for all queries to complete and combine results
    const productsNestedArrays = await Promise.all(allProductsPromises);

    // 4. Flatten the array of arrays into a single array of products
    const allProducts = productsNestedArrays.flat();

    return allProducts;
  } catch (error) {
    console.error('Error getting all products from subcollections:', error);
    throw error;
  }
};

export const getProductsCollectionStructure = async () => {
  try {
    // Get all category documents in the products collection
    const categoriesRef = collection(db, 'products');
    const categoriesSnapshot = await getDocs(categoriesRef);

    const categoryCount = categoriesSnapshot.size;
    console.log(`Number of categories (documents) in products collection: ${categoryCount}`);

    // For each category, count the items in its subcollection
    const categoryDetails = [];
    let totalProductCount = 0;

    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryId = categoryDoc.id;

      // Get items in this category's subcollection
      const itemsRef = collection(db, 'products', categoryId, 'items');
      const itemsSnapshot = await getDocs(itemsRef);
      const itemCount = itemsSnapshot.size;

      console.log(`Category '${categoryId}' has ${itemCount} products`);
      totalProductCount += itemCount;

      categoryDetails.push({
        id: categoryId,
        name: categoryDoc.data().name || categoryId,
        productCount: itemCount
      });
    }

    console.log(`Total number of products across all categories: ${totalProductCount}`);

    return {
      categoryCount,
      totalProductCount,
      categoryDetails
    };
  } catch (error) {
    console.error("Error analyzing products collection:", error);
    return {
      categoryCount: 0,
      totalProductCount: 0,
      categoryDetails: []
    };
  }
};

/////// Sign out function

// Add a custom sign out function that also cleans up data
export const signOutAndCleanup = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      if (user.email) {
        // Delete chat data
        await deleteAllUserChats(user.email);

        // Also clear user cart data using email
        await clearUserCart(user.email);
      }
    }

    // Then sign the user out
    return await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error during sign out and cleanup:", error);
    throw error;
  }
};


/////// Admin Functions ///////////

// Check if a user is an admin - with expanded checks for different role structures
export const checkUserIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    if (!userId) return false;

    // First check standard users collection
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      // Check different possible role structures
      if (
        userData?.role === 'admin' ||
        userData?.isAdmin === true ||
        userData?.userType === 'admin'
      ) {
        return true;
      }
    }

    // If not found in users, check dedicated admins collection
    const adminRef = doc(db, 'administrators', userId);
    const adminSnap = await getDoc(adminRef);

    if (adminSnap.exists()) {
      return true; // User exists in the administrators collection
    }

    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Get all admin user IDs - useful for filtering out admins from customer lists
export const getAdminUserIds = async (): Promise<string[]> => {
  try {
    const adminIds: string[] = [];

    // Check users collection for admin roles
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    usersSnapshot.forEach(userDoc => {
      const userData = userDoc.data();
      if (
        userData?.role === 'admin' ||
        userData?.isAdmin === true ||
        userData?.userType === 'admin'
      ) {
        adminIds.push(userDoc.id);
      }
    });

    // Check dedicated administrators collection if it exists
    try {
      const adminsRef = collection(db, 'administrators');
      const adminsSnapshot = await getDocs(adminsRef);

      adminsSnapshot.forEach(adminDoc => {
        adminIds.push(adminDoc.id);
      });
    } catch (adminError) {
      // If administrators collection doesn't exist, just continue
      console.log('No administrators collection found', adminError);
    }

    return adminIds;
  } catch (error) {
    console.error('Error getting admin user IDs:', error);
    return [];
  }
};

// Function to listen to cart changes in real-time
export const subscribeToCartChanges = (
  userEmail: string | null | undefined,
  onCartUpdate: (items: CartItem[]) => void,
  onError: (error: Error) => void
) => {
  if (!userEmail) {
    onCartUpdate([]);
    return () => { };
  }

  const unsubscribe = onSnapshot(cartCollectionRef(userEmail), (snapshot) => {
    const items: CartItem[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as CartItem);
    });
    onCartUpdate(items);
  }, onError);

  return unsubscribe;
};

// Function to update cart item quantity
export const updateCartQuantity = async (userEmail: string, id: string, newQuantity: number) => {
  if (newQuantity < 1) return { success: false, error: 'Quantity must be at least 1' };

  try {
    await updateDoc(cartItemRef(userEmail, id), {
      quantity: newQuantity
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating quantity:", error);
    return { success: false, error };
  }
};

// Function to remove item from cart
export const removeCartItem = async (userEmail: string, id: string) => {
  try {
    await deleteDoc(cartItemRef(userEmail, id));
    return { success: true };
  } catch (error) {
    console.error("Error removing item:", error);
    return { success: false, error };
  }
};

// Function to clear the entire cart
export const clearCart = async (userEmail: string, cartItems: CartItem[]) => {
  if (!userEmail) return { success: false, error: 'User email is required' };

  try {
    // Delete each cart item individually
    const deletePromises = cartItems.map(item =>
      deleteDoc(cartItemRef(userEmail, item.id))
    );
    await Promise.all(deletePromises);
    return { success: true };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return { success: false, error };
  }
};

// Function to add a purchase to user's purchase history
export const addPurchaseToHistory = async (userId: string, purchaseData: {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  date: string;
  paymentMethod: string;
  orderId: string;
}) => {
  try {
    if (!userId) throw new Error('User ID is required');

    // Add to the purchase history collection
    const purchaseHistoryRef = collection(db, 'users', userId, 'purchaseHistory');

    await addDoc(purchaseHistoryRef, {
      ...purchaseData,
      createdAt: serverTimestamp()
    });

    console.log('Purchase added to history successfully');
    return true;
  } catch (error) {
    console.error('Error adding purchase to history:', error);
    return false;
  }
};

export const fetchCartItems = async (userEmail: string): Promise<CartItem[]> => {
  try {
    if (!userEmail) {
      return [];
    }

    const querySnapshot = await getDocs(cartCollectionRef(userEmail));

    const items: CartItem[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      items.push({
        id: doc.id,
        productId: data.productId || doc.id,
        name: data.name || 'Unknown Product',
        price: data.price || 0,
        quantity: data.quantity || 1,
        imageUrl: data.imageUrl || '/placeholder-product.jpg',
        addedAt: data.addedAt ? data.addedAt.toDate() : new Date()
      });
    });

    // Sort by most recently added
    // items.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
    // Sort by most recently added
    items.sort((a, b) => {
      // Get timestamp for item a
      const dateA = a.addedAt instanceof Date
        ? a.addedAt
        : (a.addedAt && typeof a.addedAt === 'object' && 'toDate' in a.addedAt)
          ? a.addedAt.toDate()
          : new Date(0);

      // Get timestamp for item b
      const dateB = b.addedAt instanceof Date
        ? b.addedAt
        : (b.addedAt && typeof b.addedAt === 'object' && 'toDate' in b.addedAt)
          ? b.addedAt.toDate()
          : new Date(0);

      return dateB.getTime() - dateA.getTime();
    });

    return items;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return [];
  }
};

export async function fetchCartWishListProductsItems(userEmail: string) {
  const cartItems = await fetchCartItems(userEmail);
  const wishlistItems = await fetchWishlistItems(userEmail);
  const products = await fetchProductsByCategory();
  return { cartItems, wishlistItems, products };
}

// Export necessary Firebase functions and instances
export {
  app, auth, db, storage, analytics, firestore, user, userEmail,
  // Firestore functions needed elsewhere
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  increment,
  setDoc,
  serverTimestamp,
  onSnapshot
};
