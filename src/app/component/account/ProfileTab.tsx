import React, { useState, useCallback, memo, useEffect } from 'react';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { UserProfile } from '@/types';

interface ProfileViewProps {
  profile: UserProfile | null;
  onEdit: () => void;
}

const ProfileView = memo(({ profile, onEdit }: ProfileViewProps) => (
  <div className="p-6 bg-white border border-gray-100 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
      <button 
        onClick={onEdit}
        className="flex items-center gap-1 px-3 py-1.5 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
      >
        <FiEdit2 size={16} />
        Edit
      </button>
    </div>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</h3>
        <p className="text-lg text-gray-900 dark:text-white">{profile?.displayName}</p>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</h3>
        <p className="text-lg text-gray-900 dark:text-white">{profile?.email}</p>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</h3>
        <p className="text-lg text-gray-900 dark:text-white">{profile?.phone || 'Not provided'}</p>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</h3>
        <p className="text-lg text-gray-900 dark:text-white">{profile?.address || 'Not provided'}</p>
      </div>
    </div>
  </div>
));

ProfileView.displayName = 'ProfileView';

interface ProfileEditFormProps {
  profile: UserProfile | null;
  onCancel: () => void;
  onSubmit: (formData: any) => void;
}

const ProfileEditForm = memo(({ profile, onCancel, onSubmit }: ProfileEditFormProps) => {
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    email: profile?.email || '',
    address: profile?.address || '',
    phone: profile?.phone || '',
  });

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        email: profile.email || '',
        address: profile.address || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white border border-gray-100 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Personal Information</h2>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1.5 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-650"
          >
            <FiX size={16} />
            Cancel
          </button>
          <button 
            type="submit"
            className="flex items-center gap-1 px-3 py-1.5 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            <FiCheck size={16} />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            value={formData.displayName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            disabled
            className="w-full px-3 py-2 text-gray-500 border border-gray-300 rounded-md shadow-sm bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Enter your phone number"
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Address
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Enter your address"
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
    </form>
  );
});

ProfileEditForm.displayName = 'ProfileEditForm';

interface ProfileTabProps {
  profile: UserProfile | null;
  onUpdateMessage: (message: string) => void;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const ProfileTab = memo(({ profile, onUpdateMessage, setProfile }: ProfileTabProps) => {
  const [editing, setEditing] = useState(false);

  const handleEdit = useCallback(() => {
    setEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    setEditing(false);
  }, []);

  const handleSubmit = useCallback(async (formData: any) => {
    if (!profile?.uid) return;
    
    try {
      onUpdateMessage('Updating profile...');
      
      // Update in Firestore
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName: formData.displayName,
        address: formData.address,
        phone: formData.phone,
      });
      
      // Update profile state
      setProfile(prev => {
        if (!prev) return null;
        return { 
          ...prev, 
          displayName: formData.displayName,
          address: formData.address,
          phone: formData.phone 
        };
      });
      
      onUpdateMessage('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      onUpdateMessage('Error updating profile. Please try again.');
    }
  }, [profile, onUpdateMessage, setProfile]);

  return (
    <div className="space-y-6">
      {!editing ? (
        <ProfileView profile={profile} onEdit={handleEdit} />
      ) : (
        <ProfileEditForm 
          profile={profile} 
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
});

ProfileTab.displayName = 'ProfileTab';
export default ProfileTab;