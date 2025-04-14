'use client';

import React, { useState, useEffect } from 'react';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch,
  FiRefreshCw
} from 'react-icons/fi';
import { Coupon } from '@/types';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, generateCouponCode, generateSimpleCouponCode } from '@/app/services/couponService';
import { formatCurrency } from '@/utils/formatters';
import { Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [filterUserType, setFilterUserType] = useState<string | undefined>(undefined);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreCoupons, setHasMoreCoupons] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initial coupon form state
  const initialCouponForm = {
    code: '',
    type: 'percentage' as const,
    value: 0,
    minPurchase: 0,
    maxDiscount: 0,
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Default to 1 month validity
    userType: 'all' as const,
    description: '',
    usageLimit: 0,
    isActive: true,
    products: [] as string[],
    categories: [] as string[]
  };

  const [couponForm, setCouponForm] = useState({ ...initialCouponForm });

  // Load coupons on mount and when refreshTrigger changes
  useEffect(() => {
    fetchCoupons();
  }, [refreshTrigger, filterActive, filterUserType]);

  // Filter coupons when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCoupons(coupons);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = coupons.filter(
        coupon => 
          coupon.code.toLowerCase().includes(query) ||
          coupon.description.toLowerCase().includes(query)
      );
      setFilteredCoupons(filtered);
    }
  }, [searchQuery, coupons]);

  const fetchCoupons = async (loadMore = false) => {
    try {
      setLoading(true);
      const lastVisibleDoc = loadMore ? lastVisible : null;
      const { coupons: newCoupons, lastVisible: newLastVisible, hasMore } = await getCoupons(
        lastVisibleDoc,
        20,
        filterActive,
        filterUserType
      );
      
      if (loadMore) {
        setCoupons(prev => [...prev, ...newCoupons]);
        setFilteredCoupons(prev => [...prev, ...newCoupons]);
      } else {
        setCoupons(newCoupons);
        setFilteredCoupons(newCoupons);
      }
      
      setLastVisible(newLastVisible);
      setHasMoreCoupons(hasMore);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    try {
      // Validate form
      if (!validateCouponForm()) return;
      
      // Convert dates to Timestamps
      const formattedData = {
        ...couponForm,
        startDate: Timestamp.fromDate(new Date(couponForm.startDate)),
        endDate: Timestamp.fromDate(new Date(couponForm.endDate))
      };
      
      await createCoupon(formattedData);
      toast.success('Coupon created successfully');
      setIsCreateModalOpen(false);
      setCouponForm({ ...initialCouponForm });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error creating coupon:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create coupon');
      }
    }
  };

  const handleUpdateCoupon = async () => {
    try {
      if (!selectedCoupon || !validateCouponForm()) return;
      
      // Convert dates to Timestamps
      const formattedData = {
        ...couponForm,
        startDate: Timestamp.fromDate(new Date(couponForm.startDate)),
        endDate: Timestamp.fromDate(new Date(couponForm.endDate))
      };
      
      await updateCoupon(selectedCoupon.id, formattedData);
      toast.success('Coupon updated successfully');
      setIsEditModalOpen(false);
      setSelectedCoupon(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating coupon:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update coupon');
      }
    }
  };

  const handleDeleteCoupon = async () => {
    try {
      if (!selectedCoupon) return;
      
      await deleteCoupon(selectedCoupon.id);
      toast.success('Coupon deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedCoupon(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const handleEditClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    // Format dates for the form
    setCouponForm({
      ...coupon,
      startDate: coupon.startDate instanceof Date ? coupon.startDate : new Date(coupon.startDate),
      endDate: coupon.endDate instanceof Date ? coupon.endDate : new Date(coupon.endDate)
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setCouponForm({
        ...couponForm,
        [name]: value === '' ? 0 : parseFloat(value)
      });
    } else if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setCouponForm({
        ...couponForm,
        [name]: target.checked
      });
    } else if (name === 'startDate' || name === 'endDate') {
      setCouponForm({
        ...couponForm,
        [name]: new Date(value)
      });
    } else {
      setCouponForm({
        ...couponForm,
        [name]: value
      });
    }
  };

  const validateCouponForm = () => {
    // Basic validation
    if (!couponForm.code.trim()) {
      toast.error('Coupon code is required');
      return false;
    }
    
    if (couponForm.value <= 0) {
      toast.error('Coupon value must be greater than 0');
      return false;
    }
    
    if (couponForm.type === 'percentage' && couponForm.value > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return false;
    }
    
    if (new Date(couponForm.startDate) > new Date(couponForm.endDate)) {
      toast.error('Start date cannot be after end date');
      return false;
    }
    
    return true;
  };

  const resetFilters = () => {
    setFilterActive(undefined);
    setFilterUserType(undefined);
    setSearchQuery('');
  };

  return (
    <div className="p-6">
      <div className="flex flex-col mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white sm:mb-0">
          Coupon Management
        </h1>
        <button
          onClick={() => {
            setCouponForm({ ...initialCouponForm });
            setIsCreateModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2 space-x-2 font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <FiPlus className="text-lg" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <FiSearch className="absolute text-gray-400 left-3 top-3" />
          </div>
        </div>
        
        <div>
          <select
            value={filterActive === undefined ? '' : filterActive.toString()}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setFilterActive(undefined);
              } else {
                setFilterActive(value === 'true');
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            aria-label="Filter by coupon status"
            title="Filter by coupon status"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        
        <div>
          <select
            value={filterUserType || ''}
            onChange={(e) => setFilterUserType(e.target.value || undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            aria-label="Filter by user type"
            title="Filter by user type"
          >
            <option value="">All User Types</option>
            <option value="all">Any User</option>
            <option value="new">New Members</option>
            <option value="loyal">Loyal Members</option>
          </select>
        </div>

        {(filterActive !== undefined || filterUserType !== undefined || searchQuery) && (
          <div className="flex justify-end md:col-span-4">
            <button
              onClick={resetFilters}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <FiRefreshCw />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Coupons Table */}
      <div className="overflow-hidden bg-white shadow dark:bg-gray-800 sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                  Code
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                  Discount
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                  User Type
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                  Validity
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                  Usage
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {loading && filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                    No coupons found
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      {coupon.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                      {coupon.minPurchase && coupon.minPurchase > 0 && ` (Min: ${formatCurrency(coupon.minPurchase)})`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                      <span className="capitalize">{coupon.userType}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                      {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${coupon.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                      {coupon.usageCount} 
                      {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleEditClick(coupon)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          aria-label={`Edit coupon ${coupon.code}`}
                          title={`Edit coupon ${coupon.code}`}
                        >
                          <FiEdit2 className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(coupon)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          aria-label={`Delete coupon ${coupon.code}`}
                          title={`Delete coupon ${coupon.code}`}
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        {hasMoreCoupons && (
          <div className="flex justify-center p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => fetchCoupons(true)}
              disabled={loading}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-gray-400 dark:disabled:text-gray-500"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Coupon</h3>
            </div>
            
            <div className="p-6">
              <CouponForm 
                couponForm={couponForm} 
                handleInputChange={handleInputChange} 
              />
            </div>
            
            <div className="flex justify-end px-6 py-4 space-x-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCoupon}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Coupon Modal */}
      {isEditModalOpen && selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Coupon</h3>
            </div>
            
            <div className="p-6">
              <CouponForm 
                couponForm={couponForm} 
                handleInputChange={handleInputChange} 
              />
            </div>
            
            <div className="flex justify-end px-6 py-4 space-x-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCoupon}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
          <div className="w-full max-w-md mx-4 bg-white rounded-lg dark:bg-gray-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Coupon</h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete the coupon <strong>{selectedCoupon.code}</strong>? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end px-6 py-4 space-x-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCoupon}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CouponFormProps {
  couponForm: typeof initialCouponForm;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

// Component for coupon form fields
function CouponForm({ couponForm, handleInputChange }: CouponFormProps) {
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  
  const handleGenerateCode = async () => {
    try {
      setIsGeneratingCode(true);
      
      // Generate a coupon code with options based on the form
      const prefix = couponForm.description.split(' ')[0]?.toUpperCase().substring(0, 4) || '';
      
      let code;
      try {
        // Try the advanced encrypted code generator first
        code = await generateCouponCode({
          prefix,
          length: 8,
          useNumbers: true,
          useLetters: true,
          separator: '-',
          segmentLength: 4,
          discountValue: couponForm.value,
          discountType: couponForm.type
        });
      } catch (cryptoError) {
        console.error('Advanced code generation failed:', cryptoError);
        
        // Fall back to simple code generator if encryption fails
        code = await generateSimpleCouponCode({
          prefix,
          length: 8,
          useNumbers: true,
          useLetters: true,
          separator: '-',
          segmentLength: 4
        });
        
        toast('Using simplified code generator (encryption not available)', {
          icon: '⚠️'
        });
      }
      
      // Update the form with the generated code
      handleInputChange({
        target: {
          name: 'code',
          value: code,
          type: 'text'
        }
      } as React.ChangeEvent<HTMLInputElement>);
      
      toast.success('Secure coupon code generated');
    } catch (error) {
      console.error('Error generating coupon code:', error);
      toast.error('Failed to generate coupon code');
    } finally {
      setIsGeneratingCode(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Coupon Code*
        </label>
        <div className="flex">
          <input
            type="text"
            name="code"
            value={couponForm.code}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-l-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="E.g., WELCOME20"
            required
          />
          <button
            type="button"
            onClick={handleGenerateCode}
            disabled={isGeneratingCode}
            className="flex items-center justify-center px-3 py-2 text-gray-700 transition-colors border border-l-0 border-gray-300 rounded-r-md bg-gray-50 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
            title="Generate secure code"
          >
            {isGeneratingCode ? (
              <div className="w-5 h-5 border-2 border-gray-300 rounded-full border-t-blue-600 animate-spin"></div>
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </div>
      
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Discount Type*
        </label>
        <select
          name="type"
          value={couponForm.type}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          aria-label="Discount type"
          title="Select discount type"
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed Amount</option>
        </select>
      </div>
      
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {couponForm.type === 'percentage' ? 'Discount Percentage*' : 'Discount Amount*'}
        </label>
        <input
          type="number"
          name="value"
          value={couponForm.value}
          onChange={handleInputChange}
          min="0"
          max={couponForm.type === 'percentage' ? 100 : undefined}
          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder={couponForm.type === 'percentage' ? 'E.g., 20' : 'E.g., 10.00'}
          required
        />
        {couponForm.type === 'percentage' && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enter a value between 1 and 100
          </p>
        )}
      </div>
      
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          User Type*
        </label>
        <select
          name="userType"
          value={couponForm.userType}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          aria-label="User type"
          title="Select user type eligibility"
        >
          <option value="all">All Users</option>
          <option value="new">New Members (≤ 30 days)</option>
          <option value="loyal">Loyal Members (≥ 90 days)</option>
        </select>
      </div>
      
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Start Date*
        </label>
        <input
          type="date"
          name="startDate"
          value={new Date(couponForm.startDate).toISOString().split('T')[0]}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          title="Coupon start date"
          aria-label="Coupon start date"
        />
      </div>
      
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          End Date*
        </label>
        <input
          type="date"
          name="endDate"
          value={new Date(couponForm.endDate).toISOString().split('T')[0]}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          title="Coupon end date"
          aria-label="Coupon end date"
        />
      </div>
      
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Minimum Purchase Amount
        </label>
        <input
          type="number"
          name="minPurchase"
          value={couponForm.minPurchase}
          onChange={handleInputChange}
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="0.00"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Leave as 0 for no minimum
        </p>
      </div>
      
      {couponForm.type === 'percentage' && (
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Maximum Discount Amount
          </label>
          <input
            type="number"
            name="maxDiscount"
            value={couponForm.maxDiscount}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="0.00"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave as 0 for no maximum
          </p>
        </div>
      )}
      
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Usage Limit
        </label>
        <input
          type="number"
          name="usageLimit"
          value={couponForm.usageLimit}
          onChange={handleInputChange}
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="0"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Leave as 0 for unlimited usage
        </p>
      </div>
      
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Status
        </label>
        <div className="mt-2">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={couponForm.isActive}
              onChange={(e) => 
                handleInputChange({
                  ...e,
                  target: {
                    ...e.target,
                    name: 'isActive',
                    value: e.target.checked ? 'true' : 'false',
                    type: 'checkbox'
                  }
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              aria-label="Coupon active status"
              title="Mark coupon as active"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
          </label>
        </div>
      </div>
      
      <div className="md:col-span-2">
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          name="description"
          value={couponForm.description}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Describe what this coupon is for..."
        ></textarea>
      </div>
    </div>
  );
} 