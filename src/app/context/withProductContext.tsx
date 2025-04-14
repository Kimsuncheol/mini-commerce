'use client';

import { ProductProvider } from './ProductContext';
import { ReactNode } from 'react';

export function withProductContext(Component: React.ComponentType<any>) {
  return function WithProductContextWrapper(props: any) {
    return (
      <ProductProvider>
        <Component {...props} />
      </ProductProvider>
    );
  };
}
