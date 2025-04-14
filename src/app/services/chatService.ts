import { firestore } from '@/firebase/firebase';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, where, doc, deleteDoc, writeBatch } from 'firebase/firestore';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  recommendedProduct: React.ReactNode;
  timestamp: Date | Timestamp;
}

export const saveMessage = async (userEmail: string, message: ChatMessage) => {
  try {
    if (!userEmail) {
      console.error("Cannot save message: No user email provided");
      return null;
    }
    
    // Create a reference to the user's chat collection
    const userChatRef = collection(firestore, 'chats', userEmail, 'chats');
    // const userChatRef = collection(firestore, 'users', userEmail, 'chats');
    
    // Add the message with server timestamp
    const messageData = {
      ...message,
      timestamp: Timestamp.now()
    };
    
    const docRef = await addDoc(userChatRef, messageData);
    return docRef.id;
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
};

export const getUserChats = async (userEmail: string) => {
  try {
    if (!userEmail) {
      return [];
    }
    
    // Get the user's chat collection with messages ordered by timestamp
    const userChatRef = collection(firestore, 'users', userEmail, 'chats');
    const q = query(userChatRef, orderBy('timestamp', 'asc'));
    
    const querySnapshot = await getDocs(q);
    const messages: ChatMessage[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        role: data.role,
        content: data.content,
        timestamp: data.timestamp.toDate()
      });
    });
    
    return messages;
  } catch (error) {
    console.error("Error fetching user chats:", error);
    return [];
  }
};

export const deleteAllUserChats = async (userEmail: string) => {
  try {
    if (!userEmail) {
      console.error("Cannot delete messages: No user email provided");
      return false;
    }

    // Reference to the user's chat collection
    const userChatRef = collection(firestore, 'users', userEmail, 'chats');
    const querySnapshot = await getDocs(userChatRef);
    
    // If there are no messages, return early
    if (querySnapshot.empty) {
      return true;
    }
    
    // Use batch delete for better performance and atomicity
    const batch = writeBatch(firestore);
    
    querySnapshot.forEach((document) => {
      batch.delete(doc(firestore, 'users', userEmail, 'chats', document.id));
    });
    
    // Commit the batch delete
    await batch.commit();
    console.log(`Successfully deleted all chats for user: ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Error deleting user chats:", error);
    return false;
  }
};
