'use client';

import { useTranslations } from '@/components/providers/TranslationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Fish, Trophy, User, AlertCircle } from 'lucide-react';

export default function RecentActivity() {
  const t = useTranslations('common');

  const activities = [
    {
      id: 1,
      type: 'catch',
      icon: Fish,
      message: 'Sami Said caught a 120g fish in Sector A',
      time: '2 minutes ago',
      priority: 'normal',
    },
    {
      id: 2,
      type: 'ranking',
      icon: Trophy,
      message: 'Ramzi Dhahak moved to 2nd place',
      time: '5 minutes ago',
      priority: 'high',
    },
    {
      id: 3,
      type: 'competitor',
      icon: User,
      message: 'New competitor registered: Nour Abdennadher',
      time: '12 minutes ago',
      priority: 'normal',
    },
    {
      id: 4,
      type: 'alert',
      icon: AlertCircle,
      message: 'Weather conditions updated for Sector C',
      time: '18 minutes ago',
      priority: 'medium',
    },
    {
      id: 5,
      type: 'catch',
      icon: Fish,
      message: 'Hamdi Gdara caught a 95g fish in Sector D',
      time: '22 minutes ago',
      priority: 'normal',
    },
    {
      id: 6,
      type: 'ranking',
      icon: Trophy,
      message: 'Mohamed Ghazi Jaziri entered top 10',
      time: '28 minutes ago',
      priority: 'medium',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'catch':
        return 'text-blue-600';
      case 'ranking':
        return 'text-yellow-600';
      case 'competitor':
        return 'text-green-600';
      case 'alert':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <activity.icon className={`w-5 h-5 mt-0.5 ${getIconColor(activity.type)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">
                  {activity.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </span>
                  <Badge variant="secondary" className={`text-xs ${getPriorityColor(activity.priority)}`}>
                    {activity.priority}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <button className="text-sm text-ocean-600 hover:text-ocean-700 dark:text-ocean-400 dark:hover:text-ocean-300">
            View all activity
          </button>
        </div>
      </CardContent>
    </Card>
  );
}