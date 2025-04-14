'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Product } from '@/types';

interface ProductImageGalleryProps {
  product: Product;
}

export default function ProductImageGallery({ product }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const productImages = product.images?.length ? product.images : [product.imageUrl];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
        <Carousel
          selectedItem={selectedImage}
          onChange={setSelectedImage}
          showArrows={true}
          showStatus={false}
          showIndicators={productImages.length > 1}
          infiniteLoop={true}
          className="product-carousel"
        >
          {productImages.map((imageUrl, index) => (
            <div key={index} className="relative w-full pt-[100%]">
              <Image
                src={imageUrl}
                alt={`${product.name} - Image ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
                priority={index === 0}
              />
            </div>
          ))}
        </Carousel>
      </div>

      {productImages.length > 1 && (
        <div className="flex space-x-2 overflow-auto">
          {productImages.map((imageUrl, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              aria-label={`View product image ${index + 1}`}
              className={`relative w-20 h-20 border-2 rounded-md overflow-hidden flex-shrink-0
               ${selectedImage === index ? 'border-blue-600' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <Image
                src={imageUrl}
                alt={`Thumbnail ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
