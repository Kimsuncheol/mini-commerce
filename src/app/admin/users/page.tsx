'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { getUsers, updateUserRole } from '@/app/services/userService';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import Image from 'next/image';
import { debounce } from 'lodash';

// Icon components
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// Skeleton Loading Component
const UserTableSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, index) => (
      <div key={index} className="p-4 bg-white border rounded-lg dark:bg-gray-800 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-300 rounded-full dark:bg-gray-600"></div>
          <div className="flex-1 space-y-2">
            <div className="w-3/4 h-4 bg-gray-300 rounded dark:bg-gray-600"></div>
            <div className="w-1/2 h-3 bg-gray-300 rounded dark:bg-gray-600"></div>
          </div>
          <div className="w-24 h-8 bg-gray-300 rounded dark:bg-gray-600"></div>
        </div>
      </div>
    ))}
  </div>
);

// UserRow Component
interface UserRowProps {
  user: User;
  onRoleChange: (userId: string, newRole: 'admin' | 'user') => void;
  isUpdating: boolean;
}

const UserRow: React.FC<UserRowProps> = ({ user, onRoleChange, isUpdating }) => {
  const formattedDate = user.createdAt instanceof Date
    ? user.createdAt.toLocaleDateString()
    : new Date(user.createdAt).toLocaleDateString();

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-3">
        <div className="flex items-center">
          {user.photoURL ? (
            <div className="w-10 h-10 mr-3 overflow-hidden rounded-full">
              <Image
                src={user.photoURL}
                alt={user.displayName || user.email}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-10 h-10 mr-3 bg-gray-200 rounded-full dark:bg-gray-600">
              <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                {(user.displayName || user.email).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium dark:text-white">{user.displayName || 'No Name'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-3">
        <span className="px-3 py-1 text-xs font-medium rounded-full">
          {formattedDate}
        </span>
      </td>
      <td className="px-6 py-3">
        <select 
          className="px-3 py-1 text-sm border rounded-lg"
          value={user.role}
          onChange={(e) => onRoleChange(user.id, e.target.value as 'admin' | 'user')}
          disabled={isUpdating}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </td>
      <td className="px-6 py-3 text-right">
        <button className="px-4 py-1 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600">
          View Details
        </button>
      </td>
    </tr>
  );
};

function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [updating, setUpdating] = useState<string | null>(null);
  
  const loadUsers = async (reset = false) => {
    try {
      setLoading(true);
      const lastDoc = reset ? null : lastVisible;
      const result = await getUsers(lastDoc, 10, filterRole || undefined, searchTerm || undefined);
      
      if (reset) {
        setUsers(result.users);
      } else {
        setUsers(prev => [...prev, ...result.users]);
      }
      
      setLastVisible(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      loadUsers(true);
    }, 500),
    [searchTerm, filterRole]
  );

  useEffect(() => {
    loadUsers(true);
  }, []);

  useEffect(() => {
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [searchTerm, filterRole, debouncedSearch]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      setUpdating(userId);
      await updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error("Error updating user role:", error);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your application users and their roles</p>
      </div>
      
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search users by name or email"
            className="w-full py-2 pl-10 pr-4 border rounded-lg focus:ring focus:ring-blue-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative w-full md:w-48">
          <select
            className="w-full p-2 pr-10 border rounded-lg appearance-none focus:ring focus:ring-blue-200"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDownIcon />
          </div>
        </div>
      </div>
      
      {/* User Table */}
      <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
        {loading && users.length === 0 ? (
          <UserTableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                    User
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                    Joined Date
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                    Role
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {users.map(user => (
                  <UserRow 
                    key={user.id}
                    user={user}
                    onRoleChange={handleRoleChange}
                    isUpdating={updating === user.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Empty state */}
        {!loading && users.length === 0 && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 text-blue-500 bg-blue-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">No users found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter to find what you're looking for.</p>
          </div>
        )}
        
        {/* Load more */}
        {hasMore && users.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => loadUsers()}
              disabled={loading}
              className="w-full py-2 text-center text-gray-600 transition bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
            >
              {loading ? 'Loading...' : 'Load More Users'}
            </button>
          </div>
        )}
      </div>
      
      {/* Loading indicator for more data */}
      {loading && users.length > 0 && (
        <div className="flex justify-center mt-4">
          <div className="w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;