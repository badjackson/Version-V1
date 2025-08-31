'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trophy, Users, Fish, Timer } from 'lucide-react';

export default function StatsDashboard() {
  const [stats, setStats] = useState({
    competitors: 120,
    fishCaught: 0,
    sectors: 6,
    hoursLeft: '0:00:00'
  });

  // Get Firebase data from context
  const { 
    competitors: firestoreCompetitors, 
    hourlyEntries: firestoreHourlyEntries, 
    competitionSettings: firestoreCompetitionSettings 
  } = useFirestore();

  // Calculate live statistics from Firebase data
  useEffect(() => {
    // Calculate total fish from Firebase hourly entries
    let totalFishCaught = 0;
    firestoreHourlyEntries.forEach(entry => {
      if (['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status)) {
        totalFishCaught += entry.fishCount || 0;
      }
    });

    // Calculate hours left from Firebase competition settings
    let hoursLeft = '0:00:00';
    if (firestoreCompetitionSettings?.endDateTime) {
      const now = new Date();
      const endTime = new Date(firestoreCompetitionSettings.endDateTime);
      const timeLeft = endTime.getTime() - now.getTime();
      
      if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        hoursLeft = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
    }

    setStats({
      competitors: firestoreCompetitors.length,
      fishCaught: totalFishCaught,
      sectors: 6,
      hoursLeft
    });
  }, [firestoreCompetitors, firestoreHourlyEntries, firestoreCompetitionSettings]);

  const statsData = [
    { icon: Users, value: stats.competitors.toString(), label: 'Compétiteurs', color: 'text-blue-600' },
    { icon: Fish, value: stats.fishCaught.toLocaleString('fr-FR'), label: 'Poissons capturés', color: 'text-green-600' },
    { icon: Trophy, value: stats.sectors.toString(), label: 'Secteurs', color: 'text-yellow-600' },
    { icon: Timer, value: stats.hoursLeft, label: 'Heures restantes', color: 'text-red-600' },
  ];

  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Statistiques de la compétition
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Données de la compétition en temps réel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <stat.icon className={`w-8 h-8 mx-auto ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}