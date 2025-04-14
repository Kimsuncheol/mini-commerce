// import React, { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';

// interface DragContextType {
//   // Common state
//   isDragging: boolean;
//   setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  
//   // Shared refs
//   dragStartRef: React.MutableRefObject<{ x: number; y: number } | null>;
//   animationFrameRef: React.MutableRefObject<number | null>;
  
//   // Shared methods
//   handleDragStart: (e: React.MouseEvent | React.TouchEvent, currentPosition: {x: number, y: number}) => void;
//   handleDragMove: (
//     e: MouseEvent | TouchEvent, 
//     currentPosition: {x: number, y: number}, 
//     setPosition: (pos: {x: number, y: number}) => void,
//     constraints?: { maxX?: number, maxY?: number }
//   ) => void;
//   handleDragEnd: () => void;
  
//   // Utility methods
//   cancelDragAnimation: () => void;
// }

// const DragContext = createContext<DragContextType | undefined>(undefined);

// export function DragProvider({ children }: { children: ReactNode }) {
//   const [isDragging, setIsDragging] = useState(false);
//   const dragStartRef = useRef<{ x: number; y: number } | null>(null);
//   const animationFrameRef = useRef<number | null>(null);

//   // Cancel any pending animation frame
//   const cancelDragAnimation = useCallback(() => {
//     if (animationFrameRef.current) {
//       cancelAnimationFrame(animationFrameRef.current);
//       animationFrameRef.current = null;
//     }
//   }, []);

//   // Start drag operation
//   const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, currentPosition: {x: number, y: number}) => {
//     e.preventDefault();
//     setIsDragging(true);
    
//     const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
//     const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
//     dragStartRef.current = {
//       x: clientX - currentPosition.x,
//       y: clientY - currentPosition.y
//     };
//   }, []);

//   // Handle drag movement with optimized animation frame
//   const handleDragMove = useCallback((
//     e: MouseEvent | TouchEvent, 
//     currentPosition: {x: number, y: number}, 
//     setPosition: (pos: {x: number, y: number}) => void,
//     constraints?: { maxX?: number, maxY?: number }
//   ) => {
//     if (!isDragging || !dragStartRef.current) return;
    
//     // Cancel any pending animation frame
//     cancelDragAnimation();
    
//     // Schedule position update on next animation frame
//     animationFrameRef.current = requestAnimationFrame(() => {
//       const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
//       const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
//       // Calculate new position
//       const newX = clientX - dragStartRef.current!.x;
//       const newY = clientY - dragStartRef.current!.y;
      
//       // Apply constraints
//       const maxX = constraints?.maxX ?? window.innerWidth;
//       const maxY = constraints?.maxY ?? window.innerHeight;
      
//       const boundedX = Math.max(0, Math.min(newX, maxX));
//       const boundedY = Math.max(0, Math.min(newY, maxY));
      
//       // Only update if position actually changed
//       if (boundedX !== currentPosition.x || boundedY !== currentPosition.y) {
//         setPosition({ x: boundedX, y: boundedY });
//       }
      
//       animationFrameRef.current = null;
//     });
//   }, [isDragging, cancelDragAnimation]);

//   // End drag operation
//   const handleDragEnd = useCallback(() => {
//     setIsDragging(false);
//     dragStartRef.current = null;
//     cancelDragAnimation();
//   }, [cancelDragAnimation]);

//   // Clean up on unmount
//   React.useEffect(() => {
//     return () => {
//       cancelDragAnimation();
//     };
//   }, [cancelDragAnimation]);

//   const value = {
//     isDragging,
//     setIsDragging,
//     dragStartRef,
//     animationFrameRef,
//     handleDragStart,
//     handleDragMove,
//     handleDragEnd,
//     cancelDragAnimation
//   };

//   return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
// }

// export function useDrag() {
//   const context = useContext(DragContext);
//   if (context === undefined) {
//     throw new Error('useDrag must be used within a DragProvider');
//   }
//   return context;
// }
