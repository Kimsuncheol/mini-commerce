'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '@/types';

type ProductContextType = {
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
};

// Provide default values to avoid errors during development
const defaultContextValue: ProductContextType = {
  selectedProduct: null,
  setSelectedProduct: () => {},
};

const ProductContext = createContext<ProductContextType>(defaultContextValue);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <ProductContext.Provider value={{ selectedProduct, setSelectedProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProductContext() {
  const context = useContext(ProductContext);
  if (!context) {
    console.error('useProductContext must be used within a ProductProvider');
    return defaultContextValue; // Return default value instead of throwing error
  }
  return context;
}
