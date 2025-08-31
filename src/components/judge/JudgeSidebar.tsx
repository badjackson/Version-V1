'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { 
  LayoutDashboard, 
  Fish, 
  Trophy,
  ShieldCheck, 
  Users, 
  Timer, 
  BarChart3, 
  Bell,
  MessageSquare,
  FileText,
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function JudgeSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('common');
  const { currentUser, logout } = useCurrentUser();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Tableau de bord',
      href: '/judge',
    },
    {
      icon: Fish,
      label: 'Prises',
      href: '/judge/prises',
    },
    {
      icon: Trophy,
      label: 'Grosse Prise',
      href: '/judge/grosse-prise',
    },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Panel Juge
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentUser?.sector ? `Secteur ${currentUser.sector}` : 'Saisie de compétition'}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-ocean-100 text-ocean-700 dark:bg-ocean-900 dark:text-ocean-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3">{t('logout')}</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}