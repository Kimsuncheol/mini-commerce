import { db, firestore } from '@/firebase/firebase';
import { User } from '@/types';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp
} from 'firebase/firestore';

// Get users with pagination
export const getUsers = async (
  lastVisible: QueryDocumentSnapshot<DocumentData> | null = null,
  limitCount: number = 10,
  filterRole?: string,
  searchTerm?: string
) => {
  try {
    let usersQuery = collection(firestore, 'users');
    let constraints: any[] = [];
    
    // Apply role filter if provided
    if (filterRole) {
      constraints.push(where('role', '==', filterRole));
    }
    
    // Apply sorting
    constraints.push(orderBy('createdAt', 'desc'));
    
    // Apply pagination
    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }
    
    constraints.push(limit(limitCount));
    
    const q = query(usersQuery, ...constraints);
    const querySnapshot = await getDocs(q);
    
    let users: User[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      
      // If there's a search term, filter client-side
      if (searchTerm && searchTerm.length > 0) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !userData.displayName?.toLowerCase().includes(searchLower) &&
          !userData.email.toLowerCase().includes(searchLower)
        ) {
          return;
        }
      }
      
      users.push({
        id: doc.id,
        ...userData,
        createdAt: userData.createdAt instanceof Timestamp 
          ? userData.createdAt.toDate() 
          : userData.createdAt
      } as User);
    });
    
    // Get the last visible document for pagination
    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return {
      users,
      lastVisible: lastVisibleDoc,
      hasMore: querySnapshot.docs.length >= limitCount
    };
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: userDoc.id,
        ...userData,
        createdAt: userData.createdAt instanceof Timestamp 
          ? userData.createdAt.toDate() 
          : userData.createdAt
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

// Update user role
export const updateUserRole = async (userId: string, role: 'admin' | 'user'): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role });
    return;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};
