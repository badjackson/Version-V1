'use client';
'use client';

import { useState } from 'react';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { Bell, Search, User } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from '@/hooks/useTheme';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Sun, Moon } from 'lucide-react';

export default function AdminHeader() {
  const t = useTranslations('common');
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // Implement search functionality
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
            />
          </form>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-gray-600 dark:text-gray-300"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative"
              onClick={handleNotificationClick}
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            </Button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    New catch recorded in Sector A
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Competition timer updated
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    System backup completed
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <div className="w-full h-full bg-ocean-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {currentUser?.name || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}