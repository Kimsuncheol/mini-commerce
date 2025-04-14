'use client';

import { useState, useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface DraggableOptions {
  initialPosition?: Position;
  onPositionChange?: (position: Position) => void;
  bounds?: { 
    minX?: number;
    maxX?: number; 
    minY?: number;
    maxY?: number;
  };
}

export function useDraggable({
  initialPosition = { x: 0, y: 0 },
  onPositionChange,
  bounds,
}: DraggableOptions = {}) {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Use ref to track if the position needs initialization
  const isInitialized = useRef(false);
  const prevInitialPosition = useRef(initialPosition);

  // Only set initial position once or when it significantly changes
  useEffect(() => {
    const hasPositionChanged = 
      prevInitialPosition.current.x !== initialPosition.x || 
      prevInitialPosition.current.y !== initialPosition.y;
    
    if (!isInitialized.current || hasPositionChanged) {
      if (initialPosition.x !== 0 || initialPosition.y !== 0) {
        setPosition(initialPosition);
        isInitialized.current = true;
        prevInitialPosition.current = initialPosition;
      }
    }
  }, [initialPosition]);

  // Call the onPositionChange callback when position changes
  // We need to use a ref to avoid an infinite loop
  const positionRef = useRef(position);
  useEffect(() => {
    positionRef.current = position;
    if (onPositionChange) {
      onPositionChange(position);
    }
  }, [position, onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };
  
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragOffset({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      
      // Apply bounds if provided
      if (bounds) {
        if (bounds.minX !== undefined) newX = Math.max(bounds.minX, newX);
        if (bounds.maxX !== undefined) newX = Math.min(bounds.maxX, newX);
        if (bounds.minY !== undefined) newY = Math.max(bounds.minY, newY);
        if (bounds.maxY !== undefined) newY = Math.min(bounds.maxY, newY);
      }
      
      setPosition({ x: newX, y: newY });
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      
      let newX = e.touches[0].clientX - dragOffset.x;
      let newY = e.touches[0].clientY - dragOffset.y;
      
      // Apply bounds if provided
      if (bounds) {
        if (bounds.minX !== undefined) newX = Math.max(bounds.minX, newX);
        if (bounds.maxX !== undefined) newX = Math.min(bounds.maxX, newX);
        if (bounds.minY !== undefined) newY = Math.max(bounds.minY, newY);
        if (bounds.maxY !== undefined) newY = Math.min(bounds.maxY, newY);
      }
      
      setPosition({ x: newX, y: newY });
    };
    
    const handleStop = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleStop);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleStop);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleStop);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleStop);
    };
  }, [isDragging, dragOffset, bounds]);

  return {
    position,
    setPosition,
    isDragging,
    dragHandlers: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
    }
  };
}
