'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import dynamic from 'next/dynamic';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { 
  Clock, 
  Users, 
  Fish, 
  Scale, 
  Trophy, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  MapPin,
  Timer,
  Target,
  Award
} from 'lucide-react';

const CountdownOverlay = dynamic(() => import('@/components/ui/CountdownOverlay'), { ssr: false });

export default function JudgeDashboard() {
  const t = useTranslations('common');
  const { currentUser } = useCurrentUser();
  const { 
    competitors: firestoreCompetitors, 
    hourlyEntries: firestoreHourlyEntries, 
    bigCatches: firestoreBigCatches,
    competitionSettings: firestoreCompetitionSettings
  } = useFirestore();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const judgeSector = currentUser?.sector || 'A';

  // Get competition start time from Firebase settings
  const competitionStartTime = useMemo(() => {
    if (firestoreCompetitionSettings?.startDateTime) {
      return new Date(firestoreCompetitionSettings.startDateTime);
    }
    return new Date('2025-01-27T08:00:00'); // Fallback
  }, [firestoreCompetitionSettings]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate competition status
  const competitionStarted = currentTime >= competitionStartTime;
  const timeSinceStart = currentTime.getTime() - competitionStartTime.getTime();
  const currentHour = Math.floor(timeSinceStart / (1000 * 60 * 60)) + 1;
  const timeUntilStart = competitionStartTime.getTime() - currentTime.getTime();

  // Calculate hourly progress from Firebase data
  const hourlyProgress = useMemo(() => {
    const sectorCompetitors = firestoreCompetitors.filter(comp => comp.sector === judgeSector);
    const totalCompetitors = sectorCompetitors.length;
    
    return [1, 2, 3, 4, 5, 6, 7].map(hour => {
      const hourEntries = firestoreHourlyEntries.filter(entry => 
        entry.sector === judgeSector && 
        entry.hour === hour &&
        ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status)
      );
      
      const completed = hourEntries.length === totalCompetitors;
      const unlocked = hour <= currentHour || !competitionStarted;
      
      return {
        hour,
        completed,
        entries: hourEntries.length,
        total: totalCompetitors,
        unlocked
      };
    });
  }, [firestoreHourlyEntries, firestoreCompetitors, judgeSector, currentHour, competitionStarted]);

  // Calculate sector stats from Firebase data
  const sectorStats = useMemo(() => {
    const sectorCompetitors = firestoreCompetitors.filter(comp => comp.sector === judgeSector);
    
    let totalFish = 0;
    let totalWeight = 0;
    let topCompetitor = 'Aucun';
    let maxPoints = 0;
    
    sectorCompetitors.forEach(comp => {
      let compFish = 0;
      let compWeight = 0;
      
      // Calculate from hourly entries
      for (let hour = 1; hour <= 7; hour++) {
        const entry = firestoreHourlyEntries.find(e => 
          e.competitorId === comp.id && 
          e.hour === hour &&
          ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(e.status)
        );
        if (entry) {
          compFish += entry.fishCount;
          compWeight += entry.totalWeight;
        }
      }
      
      totalFish += compFish;
      totalWeight += compWeight;
      
      const points = (compFish * 50) + compWeight;
      if (points > maxPoints) {
        maxPoints = points;
        topCompetitor = comp.fullName;
      }
    });
    
    return {
      sector: judgeSector,
      totalFish,
      totalWeight: totalWeight / 1000, // Convert to kg
      avgWeight: totalFish > 0 ? (totalWeight / totalFish / 1000) : 0,
      topCompetitor,
      rank: 1 // Could be calculated from cross-sector comparison
    };
  }, [firestoreCompetitors, firestoreHourlyEntries, judgeSector]);

  // Generate recent activity from Firebase data
  const recentActivity = useMemo(() => {
    const activities: any[] = [];
    
    // Get recent hourly entries for judge's sector
    const recentHourlyEntries = firestoreHourlyEntries
      .filter(entry => 
        entry.sector === judgeSector &&
        ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status)
      )
      .sort((a, b) => {
        const aTime = a.timestamp?.toDate?.() || new Date(0);
        const bTime = b.timestamp?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      })
      .slice(0, 2);
    
    recentHourlyEntries.forEach(entry => {
      const competitor = firestoreCompetitors.find(c => c.id === entry.competitorId);
      if (competitor) {
        activities.push({
          id: `hourly-${entry.id}`,
          type: 'entry',
          icon: Fish,
          message: `Entrée H${entry.hour} terminée pour ${competitor.boxCode} - ${competitor.fullName}`,
          time: `il y a ${Math.floor((Date.now() - (entry.timestamp?.toDate?.()?.getTime() || 0)) / 60000)} minutes`,
          priority: 'normal',
        });
      }
    });
    
    // Get recent big catches for judge's sector
    const recentBigCatches = firestoreBigCatches
      .filter(entry => 
        entry.sector === judgeSector &&
        ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status)
      )
      .sort((a, b) => {
        const aTime = a.timestamp?.toDate?.() || new Date(0);
        const bTime = b.timestamp?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      })
      .slice(0, 1);
    
    recentBigCatches.forEach(entry => {
      const competitor = firestoreCompetitors.find(c => c.id === entry.competitorId);
      if (competitor) {
        activities.push({
          id: `bigcatch-${entry.id}`,
          type: 'complete',
          icon: Trophy,
          message: `Grosse prise enregistrée pour ${competitor.boxCode} - ${competitor.fullName} (${entry.biggestCatch}g)`,
          time: `il y a ${Math.floor((Date.now() - (entry.timestamp?.toDate?.()?.getTime() || 0)) / 60000)} minutes`,
          priority: 'normal',
        });
      }
    });
    
    // Add system messages if no recent activity
    if (activities.length === 0) {
      activities.push({
        id: 'system-1',
        type: 'hour',
        icon: Clock,
        message: `Secteur ${judgeSector} prêt pour la saisie`,
        time: 'maintenant',
        priority: 'normal',
      });
    }
    
    return activities.slice(0, 4); // Limit to 4 items
  }, [firestoreHourlyEntries, firestoreBigCatches, firestoreCompetitors, judgeSector]);

  const getIconColor = (type: string) => {
    switch (type) {
      case 'entry':
        return 'text-blue-600';
      case 'hour':
        return 'text-orange-600';
      case 'complete':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

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

  return (
    <div className="space-y-6">
      <CountdownOverlay />
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-ocean-600 to-ocean-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Tableau de bord - Juge Secteur {judgeSector}
            </h1>
            <p className="text-ocean-100">
              {competitionStarted 
                ? `Compétition active - Actuellement en H${Math.min(currentHour, 7)}`
                : 'La compétition commence bientôt - Préparez-vous pour la saisie'
              }
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold">
              {competitionStarted ? (
                `H${Math.min(currentHour, 7)}`
              ) : (
                `${Math.floor(timeUntilStart / (1000 * 60 * 60)).toString().padStart(2, '0')}:${Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0')}`
              )}
            </div>
            <div className="text-sm text-ocean-200">
              {competitionStarted ? 'Heure actuelle' : 'Temps avant début'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label.replace('Mon Secteur', `Secteur ${judgeSector}`)}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className={`text-xs ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Progress */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-ocean-600" />
                <span>Progression horaire - Secteur {judgeSector}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hourlyProgress.map((hour) => (
                  <div key={hour.hour} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        hour.completed ? 'bg-green-100 text-green-600' :
                        hour.unlocked ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {hour.completed ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : hour.unlocked ? (
                          <Clock className="w-6 h-6" />
                        ) : (
                          <Timer className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Heure H{hour.hour}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {hour.entries}/{hour.total} entrées terminées
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            hour.completed ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${(hour.entries / hour.total) * 100}%` }}
                        />
                      </div>
                      <Badge variant={
                        hour.completed ? 'default' : 
                        hour.unlocked ? 'secondary' : 'outline'
                      } className={
                        hour.completed ? 'bg-green-100 text-green-800' :
                        hour.unlocked ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }>
                        {hour.completed ? 'Terminé' : 
                         hour.unlocked ? 'Actif' : 'Verrouillé'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sector Performance */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-ocean-600" />
                <span>Performance Secteur {judgeSector}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-br from-ocean-50 to-sand-50 dark:from-ocean-900/20 dark:to-sand-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-ocean-600 mb-1">
                    Secteur {judgeSector}
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Rank #{sectorStats.rank}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Fish className="w-5 h-5 mx-auto mb-1 text-coral-600" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {sectorStats.totalFish}
                    </div>
                    <div className="text-xs text-gray-500">Poissons</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Scale className="w-5 h-5 mx-auto mb-1 text-sand-600" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {sectorStats.totalWeight}kg
                    </div>
                    <div className="text-xs text-gray-500">Poids</div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Trophy className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Leader du secteur
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {sectorStats.topCompetitor}
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {sectorStats.avgWeight}kg
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Poids moyen/poisson
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-ocean-600" />
            <span>Activité récente - Secteur {judgeSector}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <activity.icon className={`w-5 h-5 mt-0.5 ${getIconColor(activity.type)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-300">
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
        </CardContent>
      </Card>
    </div>
  );
}