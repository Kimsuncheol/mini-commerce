'use client';

import React, { useState, ChangeEvent, FormEvent, useEffect, useRef, DragEvent } from 'react';
import { firestore, storage, uploadProductImages, createProduct } from '@/firebase/firebase';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from '@/types';
import BackButton from '@/app/component/ui/BackButton';
import { PRODUCT_CATEGORIES } from '@/constants/categories';
import { FiZap } from 'react-icons/fi';

// Extending the Product interface for form input handling
// Using string values for numeric fields during form entry
type ProductFormData = Omit<Product, 'id' | 'price' | 'stock' | 'rating' | 'reviewCount' | 'createdAt'> & {
  price: string;
  stock: string;
  discountRate: string; // New field for discount percentage
  images: string[];
};

function AddNewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [keyFeatures, setKeyFeatures] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    originalPrice: undefined, // Will be calculated based on discount
    discountRate: '', // New field for discount percentage
    category: '',
    stock: '',
    imageUrl: '', // Will be set to the first uploaded image
    images: [],
    featured: false,
    rating: 0,
    reviewCount: 0,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const generateDescription = async () => {
    if (!formData.name) {
      toast.error('Please enter a product name first');
      return;
    }

    try {
      setGeneratingDescription(true);

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: formData.name,
          category: formData.category,
          features: keyFeatures,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate description');
      }

      const data = await response.json();

      if (data.description) {
        setFormData(prev => ({
          ...prev,
          description: data.description.trim(),
        }));
        toast.success('Description generated successfully!');
      } else {
        toast.error('No description was generated. Please try again.');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate description. Please try again.');
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Process files (used by both drag-and-drop and file input)
  const processFiles = (files: File[]) => {
    // Check for valid image types including WebP
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validFiles = files.filter(file => validTypes.includes(file.type));
    const invalidCount = files.length - validFiles.length;

    if (invalidCount > 0) {
      toast.error(`${invalidCount} file(s) were not in supported format. Please use JPEG, PNG, GIF, or WebP.`);
    }

    if (validFiles.length === 0) return;

    // Preview images
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);

    // Store file objects for upload
    setImageFiles(prev => [...prev, ...validFiles]);

    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} image${validFiles.length > 1 ? 's' : ''} added successfully!`);
    }
  };

  // Handle file input change
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      processFiles(filesArray);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set isDragging to false if we're leaving the dropzone
    // and not entering a child element
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      processFiles(filesArray);
    }
  };

  const removeImage = (index: number) => {
    const updatedFiles = [...imageFiles];
    const updatedPreviews = [...previewUrls];

    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index]);

    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);

    setImageFiles(updatedFiles);
    setPreviewUrls(updatedPreviews);
  };

  // Calculate original price when price or discount rate changes
  useEffect(() => {
    if (formData.price && formData.discountRate) {
      const currentPrice = parseFloat(formData.price);
      const discountRate = parseFloat(formData.discountRate);

      if (!isNaN(currentPrice) && !isNaN(discountRate) && discountRate > 0) {
        // If there's a discount, calculate what the original price would have been
        const originalPrice = currentPrice / (1 - discountRate / 100);
        setFormData(prev => ({
          ...prev,
          originalPrice: parseFloat(originalPrice.toFixed(2))
        }));
      } else {
        // If no discount, clear the originalPrice
        setFormData(prev => ({
          ...prev,
          originalPrice: undefined
        }));
      }
    } else {
      // If price or discount rate is empty, clear the originalPrice
      setFormData(prev => ({
        ...prev,
        originalPrice: undefined
      }));
    }
  }, [formData.price, formData.discountRate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.description || imageFiles.length === 0) {
      toast.error('Please fill in all required fields and upload at least one image');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a product category');
      return;
    }

    try {
      setLoading(true);

      // Upload images to Firebase Storage using the new function
      const imageUrls = await uploadProductImages(imageFiles, formData.category);

      // Prepare product data including discount information
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice, // Include the calculated original price if it exists
        stock: parseInt(formData.stock || '0'),
        images: imageUrls,
        imageUrl: imageUrls[0], // Set the first image as primary imageUrl
        rating: 0, // Default rating for new products
        reviewCount: 0, // Default review count for new products
      };

      // Remove the discountRate field as it's not part of the Product interface
      delete (productData as any).discountRate;

      // Create product, passing category as required
      const result = await createProduct(
        productData, 
        formData.category // Category is now required
      );

      if (result.success) {
        toast.success('Product added successfully!');
        router.push('/admin/products');
      } else {
        toast.error(result.message || 'Failed to add product. Please try again.');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(`Failed to add product: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl p-6 mx-auto">
      {/* Header area with navigation */}
      <div className="flex items-center mb-6 space-x-4">
        <BackButton destination="/admin/products" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column - Product Details */}
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Product Description <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateDescription}
                  disabled={generatingDescription || !formData.name}
                  className="flex items-center px-3 py-1 text-xs text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed"
                >
                  <FiZap className="w-3 h-3 mr-1" />
                  {generatingDescription ? 'Generating...' : 'Auto-write'}
                </button>
              </div>

              {/* Key features input for better AI description generation */}
              <div className="mb-2">
                <label htmlFor="keyFeatures" className="block text-xs text-gray-500 dark:text-gray-400">
                  Key features (comma separated, helps with AI generation)
                </label>
                <input
                  type="text"
                  id="keyFeatures"
                  value={keyFeatures}
                  onChange={(e) => setKeyFeatures(e.target.value)}
                  placeholder="durable, waterproof, lightweight, etc."
                  className="w-full px-3 py-1 text-xs border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={generatingDescription ? 'Generating description...' : 'Enter product description or use auto-write'}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Price ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="discountRate" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Discount Rate (%)
                </label>
                <input
                  type="number"
                  id="discountRate"
                  name="discountRate"
                  value={formData.discountRate}
                  onChange={handleInputChange}
                  min="0"
                  max="99"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Display calculated original price if discount is applied */}
            {formData.originalPrice && (
              <div className="px-4 py-3 text-sm bg-gray-100 rounded-md dark:bg-gray-700">
                <p className="font-medium text-gray-700 dark:text-gray-200">
                  Original Price: ${formData.originalPrice.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This will be displayed as the "before" price with a strikethrough.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="stock" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="category" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {PRODUCT_CATEGORIES.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured || false}
                onChange={handleCheckboxChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500"
              />
              <label htmlFor="featured" className="block ml-2 text-sm text-gray-700 dark:text-gray-200">
                Featured Product
              </label>
            </div>
          </div>

          {/* Right Column - Image Upload */}
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                Product Images <span className="text-red-500">*</span>
              </label>

              {/* Updated drop zone with drag and drop handlers */}
              <div 
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md transition-colors
                  ${isDragging 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600'}`}
              >
                <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <label htmlFor="file-upload" className="relative font-medium text-blue-600 bg-white rounded-md cursor-pointer dark:text-blue-400 dark:bg-transparent hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 dark:focus-within:ring-offset-gray-800">
                    <span>Upload images</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only" 
                      multiple 
                      onChange={handleImageUpload} 
                      accept="image/jpeg,image/png,image/gif,image/webp"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, GIF, WebP up to 10MB each
                </p>
                {isDragging && (
                  <div className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                    Drop images here
                  </div>
                )}
              </div>
            </div>

            {/* Image Previews */}
            {previewUrls.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">Image Previews</h4>
                <div className="grid grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="w-full overflow-hidden bg-gray-100 rounded-lg dark:bg-gray-700 aspect-w-1 aspect-h-1">
                        <Image 
                          src={url} 
                          alt={`Product image ${index + 1}`} 
                          className="object-cover object-center" 
                          width={200} 
                          height={200}
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute p-1 text-white transition-opacity bg-red-500 rounded-full opacity-0 top-1 right-1 group-hover:opacity-100"
                        aria-label="Remove image"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end mt-8 space-x-4">
          <button 
            type="button" 
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:bg-blue-300 dark:disabled:bg-blue-800 dark:disabled:text-gray-300"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              'Add Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddNewProductPage;