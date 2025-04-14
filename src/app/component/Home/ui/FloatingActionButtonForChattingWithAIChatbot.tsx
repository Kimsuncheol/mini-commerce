'use client';

import React, { useState, useEffect } from 'react';
import { FaRobot, FaTimes } from 'react-icons/fa';
import ChattingRoom from '../ChattingRoom';
import { motion, AnimatePresence } from 'framer-motion';

function FloatingActionButtonForChattingWithAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialWidth, setInitialWidth] = useState(400);
  const [initialHeight, setInitialHeight] = useState(500);
  
  // Update dimensions based on screen size
  useEffect(() => {
    const updateDimensions = () => {
      if (window.innerWidth < 640) { // sm breakpoint
        setInitialWidth(320);
        setInitialHeight(450);
      } else if (window.innerWidth < 768) { // md breakpoint
        setInitialWidth(350);
        setInitialHeight(480);
      } else {
        setInitialWidth(400);
        setInitialHeight(500);
      }
    };
    
    // Initial update
    updateDimensions();
    
    // Update on resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed z-[9999] shadow-2xl bottom-24 right-6 sm:right-10 md:right-16 rounded-2xl dark:shadow-gray-900"
            style={{ 
              width: `${initialWidth}px`,
              height: `${initialHeight}px`
            }}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <ChattingRoom onClose={toggleChat} initialWidth={initialWidth} initialHeight={initialHeight} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleChat}
        className={`fixed z-[9999] bottom-6 right-6 sm:right-10 md:right-16 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg ${
          isOpen ? 'bg-red-500 dark:bg-red-600' : 'bg-blue-600 dark:bg-blue-700'
        } text-white focus:outline-none`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <FaTimes size={24} />
        ) : (
          <div className="relative">
            <FaRobot size={24} className="sm:text-[28px]" />
            <motion.div
              className="absolute w-2 h-2 bg-green-400 rounded-full sm:w-3 sm:h-3 dark:bg-green-500 -top-1 -right-1"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          </div>
        )}
      </motion.button>
    </>
  );
}

export default FloatingActionButtonForChattingWithAIChatbot;