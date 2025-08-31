'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';
import Link from 'next/link';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { Sun, Moon, Maximize, LogIn, Clock, Calendar, Cloud } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import Button from '@/components/ui/Button';
import dynamic from 'next/dynamic';

const LiveClock = dynamic(() => import('@/components/ui/LiveClock'), { ssr: false });
const CompetitionCountdown = dynamic(() => import('@/components/ui/CompetitionCountdown'), { ssr: false });
const PublicDateWeather = dynamic(() => import('@/components/ui/PublicDateWeather'), { ssr: false });

export default function Header() {
  const t = useTranslations('common');
  const { theme, toggleTheme } = useTheme();
  const { publicAppearanceSettings } = useFirestore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [logoSettings, setLogoSettings] = useState({ light: '', dark: '' });

  // Load logo settings from Firebase
  useEffect(() => {
    if (publicAppearanceSettings?.logos) {
      setLogoSettings(publicAppearanceSettings.logos);
    }
  }, [publicAppearanceSettings]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getCurrentLogo = () => {
    if (theme === 'dark' && logoSettings.dark) {
      return logoSettings.dark;
    } else if (theme === 'light' && logoSettings.light) {
      return logoSettings.light;
    }
    return null;
  };
  return (
    <header className="sticky top-0 z-50 glass border-b border-white/20 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            {getCurrentLogo() ? (
              <img 
                src={getCurrentLogo()} 
                alt="Titanium Tunisia Open"
                className="h-8 sm:h-10 md:h-12 w-auto max-w-[120px] sm:max-w-[150px] md:max-w-[200px] object-contain"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ocean-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl md:text-2xl">T</span>
              </div>
            )}
          </Link>

          {/* Center - Time, Date, Weather, and Countdown (Public only) */}
          <div className="hidden md:flex items-center space-x-6">
            <PublicDateWeather />
            <LiveClock />
            <CompetitionCountdown />
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-gray-600 dark:text-gray-300"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-gray-600 dark:text-gray-300"
            >
              <Maximize className="w-5 h-5" />
            </Button>
            
            <Link href="/login">
              <Button variant="primary" size="sm" className="flex items-center space-x-2 bg-[#004aad] hover:bg-[#003a8a] border-[#004aad]">
                <LogIn className="w-4 h-4" />
                <span>{t('login')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}