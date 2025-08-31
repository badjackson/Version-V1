'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Check, Clock, Fish, Trophy, Activity, MapPin, Users, TrendingUp } from 'lucide-react';
import { formatTime, formatWeight, formatNumber } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const CountdownOverlay = dynamic(() => import('@/components/ui/CountdownOverlay'), { ssr: false });

interface SectorProgress {
  sector: string;
  hours: { [hour: number]: { completed: number; total: number } };
  color: string;
}

interface ActivityItem {
  id: string;
  sector: string;
  hour?: number;
  type: 'entry' | 'bigCatch';
  boxCode: string;
  competitorName: string;
  fishCount?: number;
  totalWeight?: number;
  biggestCatch?: number;
  timestamp: Date;
  source: 'Judge' | 'Admin';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentHour, setCurrentHour] = useState(3);
  const [sectorProgress, setSectorProgress] = useState<SectorProgress[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Mock data - replace with real API calls
  useEffect(() => {
    setMounted(true);
    
    // Initialize sector progress
    const sectors = [
      { sector: 'A', color: 'bg-sectors-A', textColor: 'text-sectors-A' },
      { sector: 'B', color: 'bg-sectors-B', textColor: 'text-sectors-B' },
      { sector: 'C', color: 'bg-sectors-C', textColor: 'text-sectors-C' },
      { sector: 'D', color: 'bg-sectors-D', textColor: 'text-sectors-D' },
      { sector: 'E', color: 'bg-sectors-E', textColor: 'text-sectors-E' },
      { sector: 'F', color: 'bg-sectors-F', textColor: 'text-sectors-F' },
    ];

    const progress = sectors.map(s => ({
      sector: s.sector,
      color: s.color,
      hours: {
        1: { completed: 20, total: 20 },
        2: { completed: 20, total: 20 },
        3: { completed: 15, total: 20 },
        4: { completed: 8, total: 20 },
        5: { completed: 0, total: 20 },
        6: { completed: 0, total: 20 },
        7: { completed: 0, total: 20 },
      }
    }));

    setSectorProgress(progress);

    // Mock recent activity
    const activity: ActivityItem[] = [
      {
        id: '1',
        sector: 'A',
        hour: 3,
        type: 'entry',
        boxCode: 'A15',
        competitorName: 'Mohamed Taieb Korbi',
        fishCount: 3,
        totalWeight: 450,
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        source: 'Judge'
      },
      {
        id: '2',
        sector: 'B',
        type: 'bigCatch',
        boxCode: 'B08',
        competitorName: 'Walid Safraoui',
        biggestCatch: 1200,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        source: 'Admin'
      },
      {
        id: '3',
        sector: 'A',
        hour: 3,
        type: 'entry',
        boxCode: 'A03',
        competitorName: 'Nour Abdennadher',
        fishCount: 2,
        totalWeight: 320,
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        source: 'Judge'
      }
    ];

    setRecentActivity(activity);
  }, []);

  const handleCellClick = (sector: string, hour: number) => {
    router.push(`/admin/prises?sector=${sector}&hour=${hour}`);
  };

  const handleActivityClick = (item: ActivityItem) => {
    if (item.type === 'entry' && item.hour) {
      router.push(`/admin/prises?sector=${item.sector}&hour=${item.hour}&box=${item.boxCode}`);
    } else if (item.type === 'bigCatch') {
      router.push(`/admin/grosse-prise?sector=${item.sector}&box=${item.boxCode}`);
    }
  };

  const getSectorColor = (sector: string) => {
    const colors: { [key: string]: string } = {
      A: 'bg-sectors-A',
      B: 'bg-sectors-B',
      C: 'bg-sectors-C',
      D: 'bg-sectors-D',
      E: 'bg-sectors-E',
      F: 'bg-sectors-F',
    };
    return colors[sector] || 'bg-gray-500';
  };

  if (!mounted) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <CountdownOverlay />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
        <p className="text-gray-600 dark:text-gray-300">Vue d'ensemble de la compétition en temps réel</p>
      </div>

      {/* Sector × Hour Progress Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-ocean-600" />
            <span>Progression par Secteur et Heure</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-400">Secteur</th>
                  {[1, 2, 3, 4, 5, 6, 7].map(hour => (
                    <th key={hour} className="text-center p-3 font-medium text-gray-600 dark:text-gray-400">
                      H{hour}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectorProgress.map(sector => (
                  <tr key={sector.sector} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="p-3">
                      <Badge className={`${getSectorColor(sector.sector)} text-white`}>
                        Secteur {sector.sector}
                      </Badge>
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7].map(hour => {
                      const hourData = sector.hours[hour];
                      const isComplete = hourData.completed === hourData.total;
                      const percentage = (hourData.completed / hourData.total) * 100;
                      
                      return (
                        <td key={hour} className="p-3">
                          <button
                            onClick={() => handleCellClick(sector.sector, hour)}
                            className="w-full p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                <span className="text-gray-900 dark:text-white">{hourData.completed}/{hourData.total}</span>
                              </span>
                              {isComplete && (
                                <Check className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Hour Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-ocean-600" />
                <span>Heure Actuelle - H{currentHour}</span>
              </div>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5, 6, 7].map(hour => (
                  <Button
                    key={hour}
                    variant={currentHour === hour ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentHour(hour)}
                    className="px-2 py-1 text-xs"
                  >
                    H{hour}
                  </Button>
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {sectorProgress.slice(0, 6).map(sector => {
                const hourData = sector.hours[currentHour];
                const percentage = (hourData.completed / hourData.total) * 100;
                
                return (
                  <div key={sector.sector} className="text-center">
                    <div className={`w-12 h-12 ${getSectorColor(sector.sector)} rounded-lg flex items-center justify-center text-white font-bold mb-2 mx-auto`}>
                      {sector.sector}
                    </div>
                    <div className="text-sm font-medium mb-1">
                      <span className="text-gray-900 dark:text-white">{hourData.completed}</span>
                      <span className="text-gray-600 dark:text-gray-300">/20</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-green-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-ocean-600" />
              <span>Activité en Temps Réel</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleActivityClick(item)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {item.type === 'entry' ? (
                        <Fish className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Trophy className="w-4 h-4 text-yellow-600" />
                      )}
                      <Badge className={`${getSectorColor(item.sector)} text-white text-xs`}>
                        {item.sector}
                      </Badge>
                      {item.hour && (
                        <Badge variant="outline" className="text-xs">
                          H{item.hour}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(item.timestamp)}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="font-medium text-sm">
                      <span className="text-gray-900 dark:text-white">{item.boxCode} - {item.competitorName}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {item.type === 'entry' ? (
                        <>
                          {item.fishCount} prises • {formatWeight(item.totalWeight || 0)}
                        </>
                      ) : (
                        <>
                          Grosse prise: {formatWeight(item.biggestCatch || 0)}
                        </>
                      )}
                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                        par {item.source}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sector KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {sectorProgress.map(sector => {
          const hourData = sector.hours[currentHour];
          const offlinePending = 2; // Mock data
          const lastActivity = new Date(Date.now() - 5 * 60 * 1000);
          
          return (
            <Card key={sector.sector}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={`${getSectorColor(sector.sector)} text-white`}>
                    Secteur {sector.sector}
                  </Badge>
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Terminé:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{hourData.completed}</span>
                    <span className="text-gray-600 dark:text-gray-300">/20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Hors ligne:</span>
                    <span className="font-medium text-amber-600 dark:text-amber-300">{offlinePending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Dernière:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatTime(lastActivity)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}