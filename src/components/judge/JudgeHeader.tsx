'use client';

import { useState } from 'react';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { useRouter } from 'next/navigation';
import { LogOut, User, Bell, Settings, Search, Maximize, Globe, Sun, Moon } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import LiveClock from '@/components/ui/LiveClock';
import CompetitionCountdown from '@/components/ui/CompetitionCountdown';
import { useTheme } from '@/hooks/useTheme';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function JudgeHeader() {
  const t = useTranslations('common');
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useCurrentUser();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // Implement search functionality for competitors in sector
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
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
              placeholder="Rechercher par nom ou box..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
            />
          </form>
        </div>

        {/* Center - Time and Countdown */}
        <div className="hidden md:flex items-center space-x-6">
          <LiveClock />
          <CompetitionCountdown />
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Fullscreen toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-gray-600 dark:text-gray-300"
          >
            <Maximize className="w-5 h-5" />
          </Button>

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
                    Nouvelle entrée enregistrée
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Synchronisation hors ligne terminée
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Mise à jour de la compétition
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
                {currentUser?.name || 'Judge User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentUser?.sector ? `Secteur ${currentUser.sector}` : 'Non assigné'}
              </p>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}