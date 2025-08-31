'use client';

import { useTranslations } from '@/components/providers/TranslationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trophy, Users, Clock, MapPin } from 'lucide-react';

export default function CompetitionOverview() {
  const t = useTranslations('common');

  const competitionStats = [
    {
      icon: Users,
      label: 'Total Competitors',
      value: '120',
      change: '+5',
      changeType: 'positive' as const,
    },
    {
      icon: Trophy,
      label: 'Active Sectors',
      value: '6',
      change: '0',
      changeType: 'neutral' as const,
    },
    {
      icon: Clock,
      label: 'Time Remaining',
      value: '4:32:15',
      change: '-',
      changeType: 'neutral' as const,
    },
    {
      icon: MapPin,
      label: 'Beach Zones',
      value: '3',
      change: '0',
      changeType: 'neutral' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competition Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {competitionStats.map((stat, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <stat.icon className="w-8 h-8 mx-auto mb-2 text-ocean-600" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {stat.label}
              </div>
              {stat.change !== '-' && (
                <div className={`text-xs ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  'text-gray-500'
                }`}>
                  {stat.changeType === 'positive' ? '+' : ''}{stat.change}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-ocean-50 dark:bg-ocean-900/20 rounded-lg">
          <h3 className="font-semibold text-ocean-900 dark:text-ocean-100 mb-2">
            Current Status
          </h3>
          <p className="text-sm text-ocean-700 dark:text-ocean-300">
            Competition is currently active. All sectors are operational and competitors are actively fishing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}