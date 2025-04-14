import React, { memo } from 'react';
import { FiUser, FiSettings, FiShoppingBag, FiHeart } from 'react-icons/fi';

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}

const TabButton = memo(({ isActive, onClick, icon: Icon, label }: TabButtonProps) => (
  <button 
    onClick={onClick}
    className={`px-6 py-4 flex items-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ${
      isActive 
        ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-750'
    }`}
  >
    <Icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
    {label}
  </button>
));

TabButton.displayName = 'TabButton';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabNavigation = memo(({ activeTab, onTabChange }: TabNavigationProps) => {
  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'orders', label: 'Orders', icon: FiShoppingBag },
    { id: 'wishlist', label: 'Wishlist', icon: FiHeart },
    { id: 'settings', label: 'Settings', icon: FiSettings }
  ];

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <TabButton 
            key={tab.id}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            icon={tab.icon}
            label={tab.label}
          />
        ))}
      </div>
    </div>
  );
});

TabNavigation.displayName = 'TabNavigation';
export default TabNavigation;