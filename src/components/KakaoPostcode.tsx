"use client";
import React from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Define types for the Daum Postcode API
declare global {
  interface Window {
    daum: any;
  }
}

interface KakaoPostcodeProps {
  onComplete: (data: any) => void;
  onClose: () => void;
}

const KakaoPostcodeComponent: React.FC<KakaoPostcodeProps> = ({ onComplete, onClose }) => {
  const postcodeContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef<boolean>(false);
  const [mounted, setMounted] = React.useState<boolean>(false);

  // Load the Daum Postcode script
  useEffect(() => {
    setMounted(true);
    
    if (typeof window === 'undefined') return;
    
    if (!scriptLoadedRef.current) {
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        initializePostcode();
      };
      document.head.appendChild(script);

      return () => {
        // Optional cleanup - remove script if component unmounts during loading
        if (!scriptLoadedRef.current) {
          document.head.removeChild(script);
        }
      };
    } else {
      initializePostcode();
    }
  }, []);

  // Initialize the postcode lookup
  const initializePostcode = () => {
    if (
      typeof window !== 'undefined' && 
      window.daum && 
      postcodeContainerRef.current
    ) {
      new window.daum.Postcode({
        oncomplete: (data: any) => {
          onComplete(data);
        },
        width: '100%',
        height: '100%',
        maxSuggestItems: 5
      }).embed(postcodeContainerRef.current);
    }
  };

  // Handle click outside to close the modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Use a portal to render the modal on top of everything
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute p-1 text-gray-400 transition-colors rounded-full top-3 right-3 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="px-4 pt-4 mb-4 text-xl font-semibold text-gray-900 dark:text-white">Find Your Address</h2>
        <div className="relative w-full overflow-hidden bg-white rounded" style={{ height: "400px" }}>
          <div ref={postcodeContainerRef} style={{ width: "100%", height: "100%" }} />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default KakaoPostcodeComponent;
