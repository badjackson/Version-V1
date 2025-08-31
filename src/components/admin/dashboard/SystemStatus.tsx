'use client';

import { useTranslations } from '@/components/providers/TranslationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Server, Database, Wifi, Shield, Clock } from 'lucide-react';

export default function SystemStatus() {
  const t = useTranslations('common');

  const systemComponents = [
    {
      name: 'Web Server',
      icon: Server,
      status: 'operational',
      uptime: '99.9%',
      lastCheck: '30s ago',
    },
    {
      name: 'Database',
      icon: Database,
      status: 'operational',
      uptime: '99.8%',
      lastCheck: '45s ago',
    },
    {
      name: 'WebSocket',
      icon: Wifi,
      status: 'operational',
      uptime: '99.7%',
      lastCheck: '15s ago',
    },
    {
      name: 'Security',
      icon: Shield,
      status: 'operational',
      uptime: '100%',
      lastCheck: '1m ago',
    },
    {
      name: 'Timer Service',
      icon: Clock,
      status: 'operational',
      uptime: '99.9%',
      lastCheck: '20s ago',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'down':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {systemComponents.map((component, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <component.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className={`w-2 h-2 rounded-full ${getStatusIndicator(component.status)}`} />
              </div>
              
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                {component.name}
              </h3>
              
              <Badge variant="secondary" className={`mb-2 ${getStatusColor(component.status)}`}>
                {component.status}
              </Badge>
              
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>Uptime: {component.uptime}</div>
                <div>Last check: {component.lastCheck}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              All Systems Operational
            </h3>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            All services are running normally. Competition data is being processed in real-time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}