'use client';

import React, { useEffect, useState, useRef, DragEvent } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, uploadProductImages } from '@/firebase/firebase';
import { Product } from '@/types';
import Image from 'next/image';
import BackButton from '@/app/component/ui/BackButton';
import { generateProductDescription } from '@/app/services/productService';

function ProductDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const category = searchParams.get('category') || '';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [imageUploaded, setImageUploaded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || !category) {
        setError('Missing product ID or category');
        setLoading(false);
        return;
      }

      try {
        const productRef = doc(db, 'products', category, 'items', productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const productData = {
            id: productSnap.id,
            ...productSnap.data(),
            category
          } as Product;

          setProduct(productData);
          setEditedProduct(productData);

          // Calculate initial discount rate if originalPrice exists
          if (productData.originalPrice && productData.price) {
            const calculatedDiscountRate = Math.round(
              ((productData.originalPrice - productData.price) / productData.originalPrice) * 100
            );
            setDiscountRate(calculatedDiscountRate);
          }
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editedProduct) return;

    const { name, value } = e.target;

    // Handle numeric inputs
    if (name === 'price' || name === 'originalPrice' || name === 'stock') {
      const numValue = name === 'stock' ? parseInt(value) : parseFloat(value);
      setEditedProduct({
        ...editedProduct,
        [name]: isNaN(numValue) ? 0 : numValue
      });

      // If original price changes, update discount rate
      if (name === 'originalPrice' && !isNaN(numValue) && numValue > 0 && editedProduct.price > 0) {
        const newDiscountRate = Math.round(
          ((numValue - editedProduct.price) / numValue) * 100
        );
        setDiscountRate(Math.max(0, newDiscountRate));
      }

      // If price changes, update discount rate
      if (name === 'price' && !isNaN(numValue) && editedProduct.originalPrice && editedProduct.originalPrice > 0) {
        const newDiscountRate = Math.round(
          ((editedProduct.originalPrice - numValue) / editedProduct.originalPrice) * 100
        );
        setDiscountRate(Math.max(0, newDiscountRate));
      }
    } else {
      setEditedProduct({
        ...editedProduct,
        [name]: value
      });
    }
  };

  const handleDiscountRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedProduct) return;

    const newRate = parseInt(e.target.value);
    setDiscountRate(isNaN(newRate) ? 0 : Math.min(100, Math.max(0, newRate)));

    // If discount rate changes, update originalPrice
    if (editedProduct.price && !isNaN(newRate) && newRate > 0) {
      // Calculate original price based on discount: original = price / (1 - discount/100)
      const calculatedOriginalPrice = parseFloat(
        (editedProduct.price / (1 - newRate / 100)).toFixed(2)
      );

      setEditedProduct({
        ...editedProduct,
        originalPrice: calculatedOriginalPrice
      });
    } else if (newRate === 0) {
      // If discount is removed, clear the original price
      setEditedProduct({
        ...editedProduct,
        originalPrice: undefined
      });
    }
  };

  const handleToggleFeatured = () => {
    if (!editedProduct) return;
    setEditedProduct({
      ...editedProduct,
      featured: !editedProduct.featured
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setImageFile(file);
    setImageUploaded(true);

    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    processSelectedFile(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUploaded(false);
  };

  const handleGenerateDescription = async () => {
    if (!editedProduct) return;

    setIsGeneratingDescription(true);
    try {
      // Gather key product features based on available data
      const features = [
        editedProduct.featured ? 'Featured product' : '',
        editedProduct.originalPrice ? `${discountRate}% discount` : '',
        // Add more product attributes that might be relevant for description
      ].filter(Boolean).join(', ');

      const description = await generateProductDescription(
        editedProduct.name,
        editedProduct.category || category,
        features
      );

      setEditedProduct({
        ...editedProduct,
        description: description
      });
    } catch (err) {
      console.error('Error generating description:', err);
      alert(`Failed to generate description: ${(err as Error).message}`);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSave = async () => {
    if (!editedProduct || !category) return;

    // Add validation for description
    if (!editedProduct.description) {
      alert('Product description is required.');
      return;
    }

    setIsSaving(true);

    try {
      // Upload new image if one was selected
      let updatedImageUrl = editedProduct.imageUrl;
      if (imageFile) {
        const imageUrls = await uploadProductImages([imageFile], category);
        if (imageUrls.length > 0) {
          updatedImageUrl = imageUrls[0];
        }
      }

      // Prepare data for update
      const productRef = doc(db, 'products', category, 'items', productId);
      const AllcategoriesRef = doc(db, 'products', 'All categories', 'items', productId);
      const updates = {
        name: editedProduct.name,
        price: editedProduct.price,
        originalPrice: editedProduct.originalPrice || null,
        stock: editedProduct.stock,
        description: editedProduct.description,
        featured: editedProduct.featured,
        imageUrl: updatedImageUrl,
        updatedAt: new Date()
      };

      // Update in database
      await updateDoc(productRef, updates);
      await updateDoc(AllcategoriesRef, updates);

      // Update the local state
      setProduct({
        ...editedProduct,
        imageUrl: updatedImageUrl
      });

      // Exit edit mode
      setIsEditing(false);
      setImageFile(null);
      setImagePreview(null);
      setImageUploaded(false);

      // Show success message
      alert('Product updated successfully!');
    } catch (err) {
      console.error('Error updating product:', err);
      alert(`Failed to update product: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original product data
    setEditedProduct(product);

    // Reset discount rate based on original data
    if (product?.originalPrice && product.price) {
      const calculatedDiscountRate = Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      );
      setDiscountRate(calculatedDiscountRate);
    } else {
      setDiscountRate(0);
    }

    setIsEditing(false);
    setImageFile(null);
    setImagePreview(null);
    setImageUploaded(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product || !editedProduct) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
          <BackButton destination="/admin/products" />
          <div className="mt-4 text-red-500">{error || 'Product not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BackButton destination="/admin/products" />
            <h1 className="ml-4 text-2xl font-bold text-gray-800 dark:text-white">
              {isEditing ? 'Edit Product' : 'Product Details'}
            </h1>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Edit Product
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <div
              className={`relative overflow-hidden bg-gray-100 rounded-lg aspect-square dark:bg-gray-700 ${isEditing && isDraggingOver ? 'border-2 border-dashed border-blue-500 bg-blue-50 dark:bg-gray-600' : ''
                }`}
            >
              {isEditing ? (
                <>
                  {(imagePreview || editedProduct.imageUrl) && (
                    <Image
                      src={imagePreview || editedProduct.imageUrl}
                      alt={editedProduct.name}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-lg"
                    />
                  )}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center transition-opacity bg-black bg-opacity-50"
                    onClick={triggerFileInput}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                    />
                    <div className="flex flex-col items-center p-6 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        className="w-12 h-12 mb-3 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm font-medium text-white">
                        {isDraggingOver ? 'Drop to upload' : 'Click or drag to upload'}
                      </p>
                      <p className="text-xs text-gray-300">
                        PNG, JPG, WebP or GIF (Max 5MB)
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                product.imageUrl && (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
                )
              )}
            </div>

            {/* Compact image preview section that appears after upload */}
            {isEditing && imageUploaded && imagePreview && (
              <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploaded Image</h3>
                  <button
                    onClick={handleRemoveImage}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative w-16 h-16 overflow-hidden bg-gray-200 rounded-md">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {imageFile?.name} ({(imageFile?.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Ready to save
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editedProduct.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white bg-gray-50">
                    {editedProduct.category} <span className="text-xs text-gray-500">(cannot change)</span>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Price ($)</label>
                    <input
                      type="number"
                      name="price"
                      value={editedProduct.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Original Price ($)</label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={editedProduct.originalPrice || ''}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Discount Rate Input */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Discount Rate (%)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={discountRate}
                      onChange={handleDiscountRateChange}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <span className="ml-2 text-lg font-semibold">%</span>
                  </div>
                  {discountRate > 0 && (
                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                      This product is on sale! Original price: ${editedProduct.originalPrice?.toFixed(2)},
                      Discounted price: ${editedProduct.price?.toFixed(2)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={editedProduct.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description <span className="text-red-500">*</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={isGeneratingDescription}
                      className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:bg-purple-400"
                    >
                      {isGeneratingDescription ? 'Generating...' : 'Auto-generate description'}
                    </button>
                  </label>
                  <textarea
                    name="description"
                    value={editedProduct.description || ''}
                    onChange={handleInputChange}
                    rows={5}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  ></textarea>
                  {!editedProduct.description && (
                    <p className="mt-1 text-sm text-red-500">Description is required</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      checked={editedProduct.featured || false}
                      onChange={handleToggleFeatured}
                      className="w-4 h-4 mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured Product</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{product.category}</p>
                <div>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">${product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                      <span className="ml-2 text-lg text-gray-500 line-through dark:text-gray-400">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                    {product.originalPrice && (
                      <span className="ml-2 text-sm font-medium text-red-500">{discountRate}% OFF</span>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Description</h3>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap dark:text-gray-300">{product.description}</p>
                </div>
                <div>
                  <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">
                    Stock: {product.stock}
                  </span>
                  {product.featured && (
                    <span className="inline-flex items-center px-3 py-1 ml-2 text-sm font-medium text-white bg-yellow-500 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;