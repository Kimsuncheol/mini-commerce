'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaRobot, FaUser, FaArrowsAlt } from 'react-icons/fa';
import { IoMdSend } from 'react-icons/io';
import { motion } from 'framer-motion';
import { auth } from '@/firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, saveMessage, getUserChats, deleteAllUserChats } from '@/app/services/chatService';
import { processAIChat } from '@/app/services/aiService';
import productVectorStore from '@/utils/vectorStore';
import Link from 'next/link';
import Image from 'next/image';
import { FiShoppingCart, FiHeart, FiGift, FiInfo, FiExternalLink } from 'react-icons/fi';
import { addToCart } from '@/firebase/firebase';
import { addToWishlist } from '@/firebase/firebase';
import { saveCouponToUser } from '@/app/services/couponService';
import { toast } from 'react-hot-toast';

interface Message extends Omit<ChatMessage, 'timestamp'> {
  id: string;
  timestamp: Date;
}

interface ChattingRoomProps {
  onClose?: () => void;
  initialWidth?: number;
  initialHeight?: number;
}

interface Size {
  width: number;
  height: number;
}

interface ResizeStartInfo {
  edge: 'top' | 'right' | 'bottom' | 'left' | 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';
  initialMousePos: { x: number, y: number };
  initialSize: Size;
}

// Mini component for product card
interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  discount?: number;
  originalPrice?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ id, name, price, imageUrl, discount, originalPrice }) => {
  const [user] = useAuthState(auth);

  const handleAddToCart = async () => {
    if (!user || !user.email) {
      toast.error('Please sign in to add items to your cart');
      return;
    }
    
    try {
      const result = await addToCart(user.email, {
        id,
        name,
        price,
        imageUrl,
      }, 1);
      
      if (result.success) {
        toast.success(`${name} added to cart!`);
      } else {
        toast.error('Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error adding item to cart');
    }
  };

  const handleAddToWishlist = async () => {
    if (!user || !user.email) {
      toast.error('Please sign in to add items to your wishlist');
      return;
    }
    
    try {
      const result = await addToWishlist(user.email, {
        id,
        name,
        price,
        imageUrl,
      });
      
      if (result.success) {
        if (result.isDuplicate) {
          toast.success(`${name} is already in your wishlist`);
        } else {
          toast.success(`${name} added to wishlist!`);
        }
      } else {
        toast.error('Failed to add item to wishlist');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Error adding item to wishlist');
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden w-full max-w-[300px] bg-white dark:bg-gray-700 shadow-sm">
      <div className="relative h-32 bg-gray-200">
        {imageUrl ? (
          <Image 
            src={imageUrl} 
            alt={name} 
            layout="fill" 
            objectFit="cover" 
            className="object-contain"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <FiInfo size={24} />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="mb-1 text-sm font-medium truncate">{name}</div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-sm font-bold">${price.toFixed(2)}</span>
            {originalPrice && (
              <span className="ml-2 text-xs text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
            )}
          </div>
          {discount && <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-sm">{discount}% OFF</span>}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleAddToCart}
            className="flex items-center justify-center flex-1 px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            <FiShoppingCart className="mr-1" />
            Add to Cart
          </button>
          <button
            onClick={handleAddToWishlist}
            className="p-1 text-gray-600 border border-gray-300 rounded hover:text-pink-600"
          >
            <FiHeart />
          </button>
          <Link href={`/products/${id}`} passHref>
            <a className="p-1 text-gray-600 border border-gray-300 rounded hover:text-blue-600">
              <FiExternalLink />
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Mini component for coupon card
interface CouponCardProps {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  endDate: Date | string;
}

const CouponCard: React.FC<CouponCardProps> = ({ id, code, type, value, description, endDate }) => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async () => {
    if (!user || !user.uid) {
      toast.error('Please sign in to claim this coupon');
      return;
    }
    
    setLoading(true);
    try {
      const result = await saveCouponToUser(user.uid, id);
      
      if (result.success) {
        if (result.alreadySaved) {
          toast.success('Coupon already in your account!');
        } else {
          toast.success('Coupon added to your account!');
        }
        setClaimed(true);
      }
    } catch (error) {
      console.error('Error claiming coupon:', error);
      toast.error('Failed to claim coupon');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="border rounded-lg overflow-hidden w-full max-w-[280px] bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-sm">
      <div className="p-3 bg-blue-100 border-b border-blue-200 dark:border-blue-800 dark:bg-blue-900/50">
        <div className="text-lg font-bold text-center">
          {type === 'percentage' ? `${value}% OFF` : `$${value.toFixed(2)} OFF`}
        </div>
      </div>
      <div className="p-3">
        <div className="px-2 py-1 mb-2 font-mono text-sm text-center bg-white rounded dark:bg-gray-800">
          {code}
        </div>
        <p className="mb-2 text-xs text-gray-600 dark:text-gray-300">{description}</p>
        <div className="flex justify-between mb-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Valid until:</span>
          <span>{formatDate(endDate)}</span>
        </div>
        {claimed ? (
          <div className="px-2 py-1 text-xs text-center text-green-700 bg-green-100 rounded dark:bg-green-900/30 dark:text-green-400">
            Coupon Claimed ✓
          </div>
        ) : (
          <button
            onClick={handleClaim}
            disabled={loading}
            className="w-full flex items-center justify-center py-1.5 px-2 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? (
              <span className="w-4 h-4 mr-1 border-2 border-white rounded-full border-t-transparent animate-spin"></span>
            ) : (
              <FiGift className="mr-1" />
            )}
            {loading ? 'Claiming...' : 'Get Coupon'}
          </button>
        )}
      </div>
    </div>
  );
};

// Component that parses and displays chat message content with rich components
const MessageContent = ({ content }: { content: string }) => {
  // Parse the message content for special component markers
  const renderContent = () => {
    try {
      // Check if content has component markers
      if (content.includes('[[PRODUCT:') || content.includes('[[COUPON:')) {
        // Split the content into text and component parts
        const parts: React.ReactNode[] = [];
        let remainingContent = content;
        let lastIndex = 0;
        
        // Function to extract component data
        const extractComponent = (marker: string, endMarker: string, startIndex: number) => {
          const endIndex = remainingContent.indexOf(endMarker, startIndex + marker.length);
          if (endIndex === -1) return null;
          
          try {
            const jsonStr = remainingContent.substring(startIndex + marker.length, endIndex);
            const componentData = JSON.parse(jsonStr);
            
            // Add text before component
            if (startIndex > lastIndex) {
              parts.push(remainingContent.substring(lastIndex, startIndex));
            }
            
            // Update last index
            lastIndex = endIndex + endMarker.length;
            
            return componentData;
          } catch (e) {
            console.error('Error parsing component data:', e);
            return null;
          }
        };
        
        // Process the content to find and render components
        while (remainingContent.length > 0) {
          // Look for product component
          const productIndex = remainingContent.indexOf('[[PRODUCT:');
          const couponIndex = remainingContent.indexOf('[[COUPON:');
          
          // Find the first occurring component
          let nextComponentIndex = -1;
          if (productIndex !== -1 && couponIndex !== -1) {
            nextComponentIndex = Math.min(productIndex, couponIndex);
          } else if (productIndex !== -1) {
            nextComponentIndex = productIndex;
          } else if (couponIndex !== -1) {
            nextComponentIndex = couponIndex;
          }
          
          // If no components found, add remaining text and break
          if (nextComponentIndex === -1) {
            if (lastIndex < remainingContent.length) {
              parts.push(remainingContent.substring(lastIndex));
            }
            break;
          }
          
          // Extract and add the component based on type
          if (nextComponentIndex === productIndex) {
            const productData = extractComponent('[[PRODUCT:', ']]', productIndex);
            if (productData) {
              parts.push(
                <div key={`product-${parts.length}`} className="my-2">
                  <ProductCard 
                    id={productData.id}
                    name={productData.name}
                    price={productData.price}
                    imageUrl={productData.imageUrl}
                    originalPrice={productData.originalPrice}
                    discount={productData.discount}
                  />
                </div>
              );
            }
          } else if (nextComponentIndex === couponIndex) {
            const couponData = extractComponent('[[COUPON:', ']]', couponIndex);
            if (couponData) {
              parts.push(
                <div key={`coupon-${parts.length}`} className="my-2">
                  <CouponCard 
                    id={couponData.id}
                    code={couponData.code}
                    type={couponData.type}
                    value={couponData.value}
                    description={couponData.description}
                    endDate={couponData.endDate}
                  />
                </div>
              );
            }
          }
          
          // Update remaining content
          remainingContent = remainingContent.substring(lastIndex);
          lastIndex = 0;
        }
        
        return parts;
      }
      
      // If no components, just return the text
      return content;
    } catch (error) {
      console.error('Error rendering message content:', error);
      return content;
    }
  };
  
  return <>{renderContent()}</>;
};

// Helper function to convert Firebase Timestamp to Date
const convertTimestamp = (timestamp: unknown): Date => {
  if (timestamp instanceof Date) return timestamp;
  
  // Check for objects with toDate method or seconds property
  if (timestamp && typeof timestamp === 'object') {
    const maybeTimestamp = timestamp as Record<string, unknown>;
    
    // Check for Firestore Timestamp-like object with toDate method
    if ('toDate' in maybeTimestamp && 
        typeof maybeTimestamp.toDate === 'function') {
      // Call toDate and ensure we get a Date back
      const toDateFn = maybeTimestamp.toDate as () => Date;
      return toDateFn();
    }
    
    // Check for objects with seconds property
    if ('seconds' in maybeTimestamp && 
        typeof maybeTimestamp.seconds === 'number') {
      return new Date(maybeTimestamp.seconds as number * 1000);
    }
  }
  
  // Default to current time if we can't convert
  return new Date();
};

function ChattingRoom({ onClose, initialWidth = 400, initialHeight = 450 }: ChattingRoomProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [user] = useAuthState(auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [vectorStoreReady, setVectorStoreReady] = useState(false);

  // Enhanced resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeInfo, setResizeInfo] = useState<ResizeStartInfo | null>(null);
  const [size, setSize] = useState<Size>({ 
    width: initialWidth, 
    height: initialHeight 
  });
  
  // Adjust min and max size based on screen size
  const [minSize, setMinSize] = useState({ width: 300, height: 350 });
  const [maxSize, setMaxSize] = useState({ width: 800, height: 800 });
  const resizableRef = useRef<HTMLDivElement>(null);

  // Initialize vector store for product searches
  useEffect(() => {
    const initVectorStore = async () => {
      try {
        await productVectorStore.initialize();
        setVectorStoreReady(true);
      } catch (error) {
        console.error('Error initializing product vector store:', error);
        // Continue without RAG if initialization fails
        setVectorStoreReady(false);
      }
    };
    
    initVectorStore();
  }, []);

  // Update size constraints based on screen width
  useEffect(() => {
    const updateSizeConstraints = () => {
      // Update size constraints based on screen width
      if (window.innerWidth < 640) { // sm breakpoint
        setMinSize({ width: 280, height: 300 });
        setMaxSize({ width: window.innerWidth - 40, height: window.innerHeight - 100 });
      } else if (window.innerWidth < 768) { // md breakpoint
        setMinSize({ width: 300, height: 350 });
        setMaxSize({ width: Math.min(600, window.innerWidth - 60), height: window.innerHeight - 120 });
      } else {
        setMinSize({ width: 320, height: 400 });
        setMaxSize({ width: Math.min(800, window.innerWidth - 80), height: window.innerHeight - 140 });
      }
    };
    
    updateSizeConstraints();
    
    // Update size when props change or window is resized
    const handleResize = () => {
      updateSizeConstraints();
      
      // Ensure current size is within new constraints
      setSize(prevSize => ({
        width: Math.min(Math.max(prevSize.width, minSize.width), maxSize.width),
        height: Math.min(Math.max(prevSize.height, minSize.height), maxSize.height)
      }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Update size when initial props change
  useEffect(() => {
    setSize({
      width: initialWidth,
      height: initialHeight
    });
  }, [initialWidth, initialHeight]);

  // Welcome message
  useEffect(() => {
    const welcomeMessage = vectorStoreReady
      ? 'Hello! How can I help you today? You can ask me about our products, pricing, or any other shopping questions.'
      : 'Hello! How can I help you today?';
      
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      },
    ]);
  }, [vectorStoreReady]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Resize event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeInfo) return;

      e.preventDefault();
      const { edge, initialMousePos, initialSize } = resizeInfo;

      let newWidth = initialSize.width;
      let newHeight = initialSize.height;

      // Calculate size changes based on which edge is being dragged
      if (edge.includes('right')) {
        newWidth = Math.min(
          Math.max(minSize.width, initialSize.width + (e.clientX - initialMousePos.x)),
          maxSize.width
        );
      } else if (edge.includes('left')) {
        const deltaX = initialMousePos.x - e.clientX;
        newWidth = Math.min(
          Math.max(minSize.width, initialSize.width + deltaX),
          maxSize.width
        );
      }

      if (edge.includes('bottom')) {
        newHeight = Math.min(
          Math.max(minSize.height, initialSize.height + (e.clientY - initialMousePos.y)),
          maxSize.height
        );
      } else if (edge.includes('top')) {
        const deltaY = initialMousePos.y - e.clientY;
        newHeight = Math.min(
          Math.max(minSize.height, initialSize.height + deltaY),
          maxSize.height
        );
      }

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeInfo(null);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing && resizeInfo) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Set cursor based on the edge being resized
      const edge = resizeInfo.edge;
      if (edge === 'topLeft' || edge === 'bottomRight') {
        document.body.style.cursor = 'nwse-resize';
      } else if (edge === 'topRight' || edge === 'bottomLeft') {
        document.body.style.cursor = 'nesw-resize';
      } else if (edge === 'left' || edge === 'right') {
        document.body.style.cursor = 'ew-resize';
      } else if (edge === 'top' || edge === 'bottom') {
        document.body.style.cursor = 'ns-resize';
      }
      
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeInfo, minSize, maxSize]);

  // Start resizing with info about which edge is being dragged
  const handleResizeStart = (e: React.MouseEvent, edge: ResizeStartInfo['edge']) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeInfo({
      edge,
      initialMousePos: { x: e.clientX, y: e.clientY },
      initialSize: { ...size }
    });
  };

  // Calculate message area max height based on chat container size
  const getMessageAreaHeight = () => {
    return size.height - 120; // Adjust based on header and input area height
  };

  // Load chat history if user is logged in
  useEffect(() => {
    // Guard against null email
    const email = user?.email;
    if (!email) return;

    const loadChatHistory = async () => {
      try {
        const userChats = await getUserChats(email);

        if (userChats.length > 0) {
          const formattedMessages = userChats.map(chat => ({
            id: uuidv4(),
            role: chat.role,
            content: chat.content,
            timestamp: convertTimestamp(chat.timestamp),
          }));

          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, [user?.email]);

  // Format timestamp to display in a friendly way
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date >= today;
    const isYesterday = date >= yesterday && date < today;

    if (isToday) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  // Get conversation history formatted for AI
  const getChatHistory = () => {
    return messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessageContent = message.trim();

    // Create and display user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    // Save user message if logged in
    const email = user?.email;
    if (email) {
      const chatMessage: ChatMessage = {
        role: 'user',
        content: userMessageContent,
        timestamp: new Date(),
      };

      await saveMessage(email, chatMessage);
    }

    try {
      // Get AI response using the aiService with RAG enhancement
      const chatHistory = getChatHistory();
      
      // Process the query with RAG, passing the user email for cart/wishlist functionality
      const aiResponseText = await processAIChat(
        userMessageContent, 
        chatHistory,
        undefined,
        user?.email
      );

      // Create AI message object
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date(),
      };

      // Display AI message
      setMessages(prev => [...prev, aiMessage]);

      // Save AI message if logged in
      if (email) {
        const chatMessage: ChatMessage = {
          role: 'assistant',
          content: aiResponseText,
          timestamp: new Date(),
        };

        await saveMessage(email, chatMessage);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Show error message
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, an error occurred while generating a response. Please try again later.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Clear chat history
  const handleClearChat = async () => {
    const email = user?.email;
    if (email && confirm('Do you want to delete all chat history?')) {
      await deleteAllUserChats(email);
      const welcomeMessage = vectorStoreReady
        ? 'Chat history has been deleted. Let\'s start a new conversation! You can ask me about our products or any shopping-related questions.'
        : 'Chat history has been deleted. Let\'s start a new conversation!';
        
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      }]);
    }
  };

  // Reset to initial size instead of hardcoded values
  const handleResetSize = () => {
    setSize({ width: initialWidth, height: initialHeight });
  };

  return (
    <div
      ref={resizableRef}
      className={`relative flex flex-col overflow-hidden bg-white shadow-lg dark:bg-gray-800 rounded-b-2xl z-[5000] ${isResizing ? 'transition-none' : 'transition-all duration-200 ease-in-out'}`}
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        maxWidth: '100%',
        maxHeight: '100%',
        boxShadow: isResizing ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : undefined
      }}
    >
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 text-white bg-blue-600 dark:bg-blue-800">
        <div className="flex items-center space-x-2">
          <FaRobot className="text-xl" />
          <h3 className="font-medium">AI Chatbot Assistant</h3>
        </div>
        <div className="flex items-center">
          {/* Reset size button */}
          <button
            onClick={handleResetSize}
            className="p-1 mr-2 text-white rounded-full hover:bg-blue-700 dark:hover:bg-blue-900"
            title="Reset size"
          >
            <FaArrowsAlt />
          </button>

          {/* Clear chat button */}
          {user?.email && (
            <button
              onClick={handleClearChat}
              className="p-1 mr-2 text-white rounded-full hover:bg-blue-700 dark:hover:bg-blue-900"
              title="Clear chat history"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 text-white rounded-full hover:bg-blue-700 dark:hover:bg-blue-900"
            title="Close chat"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Messages area with dynamic max height based on container size */}
      <div
        ref={chatContainerRef}
        className="flex-grow p-4 space-y-3 overflow-y-auto bg-gray-50 dark:bg-gray-900"
        style={{
          scrollBehavior: 'smooth',
          maxHeight: `${getMessageAreaHeight()}px`
        }}
      >
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col">
            {/* max-w-[75%] */}
              <div
                className={`p-3 rounded-xl ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none dark:bg-blue-700'
                    : 'bg-gray-200 text-gray-800 rounded-bl-none dark:bg-gray-700 dark:text-gray-100'
                }`}
              >
                <div className="flex items-center mb-1 space-x-2">
                  {msg.role === 'user' ? (
                    <FaUser className="text-xs text-blue-200" />
                  ) : (
                    <FaRobot className="text-xs text-gray-600 dark:text-gray-300" />
                  )}
                  <span className={`text-xs ${
                    msg.role === 'user'
                      ? 'text-blue-200'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {msg.role === 'user' ? '나' : 'AI 챗봇'}
                  </span>
                </div>
                <div className="text-sm whitespace-pre-wrap">
                  <MessageContent content={msg.content} />
                </div>
              </div>

              {/* Timestamp display */}
              <span
                className={`text-xs mt-1 ${
                  msg.role === 'user' ? 'text-right text-gray-500' : 'text-left text-gray-500'
                }`}
              >
                {formatTimestamp(msg.timestamp)}
              </span>
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 p-3 rounded-xl rounded-bl-none max-w-[75%]">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-600 rounded-full dark:bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full dark:bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full dark:bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t dark:bg-gray-800 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow px-4 py-2 text-black bg-white border rounded-full dark:text-white dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600"
            disabled={loading}
          />
          <button
            type="submit"
            title="Send message"
            disabled={!message.trim() || loading}
            className={`p-2 rounded-full ${
              !message.trim() || loading
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
            } text-white`}
          >
            <IoMdSend size={20} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {!user ? 'Chat history will be saved when you log in.' : ''}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {vectorStoreReady ? '🔍 RAG enabled' : ''} {size.width} x {size.height}
          </p>
        </div>
      </form>

      {/* Resize handles */}
      {/* Bottom right corner */}
      <div
        className={`absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 cursor-nwse-resize group hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-bl-xl ${isResizing && resizeInfo?.edge === 'bottomRight' ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
        onMouseDown={(e) => handleResizeStart(e, 'bottomRight')}
        title="Resize"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 10 10"
          className={`text-gray-400 fill-current dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 ${isResizing && resizeInfo?.edge === 'bottomRight' ? 'text-blue-500 dark:text-blue-400 scale-110' : ''}`}
        >
          <path d="M0 8h2v2H0zm4-4h2v6H4zm4-4h2v10H8z" />
        </svg>
      </div>
      
      {/* Bottom edge */}
      <div 
        className={`absolute bottom-0 left-8 right-8 h-2 cursor-ns-resize hover:bg-blue-50 dark:hover:bg-blue-900/30 ${isResizing && resizeInfo?.edge === 'bottom' ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
        onMouseDown={(e) => handleResizeStart(e, 'bottom')}
      />
      
      {/* Right edge */}
      <div 
        className={`absolute top-8 bottom-8 right-0 w-2 cursor-ew-resize hover:bg-blue-50 dark:hover:bg-blue-900/30 ${isResizing && resizeInfo?.edge === 'right' ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
        onMouseDown={(e) => handleResizeStart(e, 'right')}
      />
      
      {/* Bottom left corner */}
      <div
        className={`absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize hover:bg-blue-50 dark:hover:bg-blue-900/30 ${isResizing && resizeInfo?.edge === 'bottomLeft' ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
        onMouseDown={(e) => handleResizeStart(e, 'bottomLeft')}
      />
      
      {/* Size indicator - appears during resize */}
      {isResizing && (
        <div className="absolute px-2 py-1 text-xs text-white bg-blue-600 rounded-md shadow-md bottom-8 right-8 whitespace-nowrap">
          {size.width} × {size.height}
        </div>
      )}
    </div>
  );
}

export default ChattingRoom;