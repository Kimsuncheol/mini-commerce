import React, { useCallback, memo } from 'react';
import Image from 'next/image';
import { FiUser, FiCamera } from 'react-icons/fi';
import { storage, db } from '@/firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '@/types';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  onUpdateMessage: (message: string) => void;
}

const ProfileHeader = memo(({ profile, onUpdateMessage }: ProfileHeaderProps) => {
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !profile?.uid) return;
    
    const file = e.target.files[0];
    
    try {
      onUpdateMessage('Uploading photo...');
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `users/${profile.uid}/profile_photo`);
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update in Firestore
      await updateDoc(doc(db, 'users', profile.uid), {
        photoURL: downloadURL
      });
      
      // Reload the page to show the updated photo
      window.location.reload();
      
      onUpdateMessage('Photo updated successfully!');
    } catch (error) {
      console.error("Error uploading photo:", error);
      onUpdateMessage('Error uploading photo. Please try again.');
    }
  }, [profile?.uid, onUpdateMessage]);

  return (
    <div className="p-6 text-white bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-indigo-900">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        {/* Profile Photo */}
        <div className="relative group">
          <div className="overflow-hidden transition-transform transform bg-gray-200 border-4 border-white rounded-full shadow-lg w-28 h-28 group-hover:scale-105 dark:bg-gray-700 dark:border-gray-600">
            {profile?.photoURL ? (
              <Image 
                src={profile.photoURL} 
                alt={profile.displayName}
                width={112} 
                height={112}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-blue-600 bg-blue-100 dark:bg-gray-800 dark:text-blue-300">
                <FiUser size={50} />
              </div>
            )}
          </div>
          
          {/* Photo Upload Icon */}
          <label 
            htmlFor="photo-upload" 
            className="absolute bottom-0 right-0 p-2 transition-colors duration-200 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-pointer hover:bg-blue-50 dark:bg-gray-800 dark:border-blue-400"
            title="Change profile picture"
          >
            <input 
              id="photo-upload" 
              type="file" 
              accept="image/*" 
              className="hidden"
              onChange={handlePhotoUpload} 
            />
            <FiCamera size={18} className="text-blue-600 dark:text-blue-400" />
          </label>
        </div>
        
        {/* User Info */}
        <div className="text-center md:text-left md:ml-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">{profile?.displayName}</h1>
          <p className="mt-1 text-blue-100">{profile?.email}</p>
          <p className="mt-2 text-sm font-medium text-blue-200">
            <span className="opacity-75">Member since </span> 
            {profile?.joinedDate || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
});

ProfileHeader.displayName = 'ProfileHeader';
export default ProfileHeader;