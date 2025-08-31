'use client';

import { useTranslations } from '@/components/providers/TranslationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Fish, Scale, TrendingUp } from 'lucide-react';

export default function LiveMetrics() {
  const t = useTranslations('common');

  const metrics = [
    {
      icon: Fish,
      label: 'Total Fish Caught',
      value: '1,247',
      trend: '+23',
      trendType: 'positive' as const,
    },
    {
      icon: Scale,
      label: 'Total Weight',
      value: '342.5kg',
      trend: '+12.3kg',
      trendType: 'positive' as const,
    },
    {
      icon: TrendingUp,
      label: 'Avg per Hour',
      value: '156',
      trend: '+8',
      trendType: 'positive' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          Live Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <metric.icon className="w-5 h-5 text-ocean-600" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.label}
                  </div>
                </div>
              </div>
              <div className={`text-sm font-medium ${
                metric.trendType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trend}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-sand-50 dark:bg-sand-900/20 rounded-lg">
          <div className="text-sm text-sand-700 dark:text-sand-300">
            <strong>Peak Hour:</strong> 14:00-15:00 (234 fish caught)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}