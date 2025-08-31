'use client';

import { useTranslations } from '@/components/providers/TranslationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, Fish, Scale, Trophy } from 'lucide-react';

export default function SectorOverview() {
  const t = useTranslations('common');

  const sectorStats = [
    {
      sector: 'A',
      competitors: 20,
      totalFish: 234,
      totalWeight: 67.8,
      topCompetitor: 'Sami Said',
      status: 'active',
    },
    {
      sector: 'B',
      competitors: 20,
      totalFish: 198,
      totalWeight: 52.3,
      topCompetitor: 'Akram Ben Abdallah',
      status: 'active',
    },
    {
      sector: 'C',
      competitors: 20,
      totalFish: 176,
      totalWeight: 48.9,
      topCompetitor: 'Bassem Mezelini',
      status: 'active',
    },
    {
      sector: 'D',
      competitors: 20,
      totalFish: 165,
      totalWeight: 44.2,
      topCompetitor: 'Hamdi Gdara',
      status: 'active',
    },
    {
      sector: 'E',
      competitors: 20,
      totalFish: 142,
      totalWeight: 38.7,
      topCompetitor: 'Tayssir Dimassi',
      status: 'active',
    },
    {
      sector: 'F',
      competitors: 20,
      totalFish: 132,
      totalWeight: 35.6,
      topCompetitor: 'Mounir El Haddad',
      status: 'active',
    },
  ];

  const totalStats = {
    competitors: sectorStats.reduce((sum, sector) => sum + sector.competitors, 0),
    totalFish: sectorStats.reduce((sum, sector) => sum + sector.totalFish, 0),
    totalWeight: sectorStats.reduce((sum, sector) => sum + sector.totalWeight, 0),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sector Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-ocean-50 dark:bg-ocean-900/20 rounded-lg">
            <Users className="w-6 h-6 mx-auto mb-2 text-ocean-600" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalStats.competitors}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Competitors</div>
          </div>
          <div className="text-center p-4 bg-sand-50 dark:bg-sand-900/20 rounded-lg">
            <Fish className="w-6 h-6 mx-auto mb-2 text-sand-600" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalStats.totalFish}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Fish</div>
          </div>
          <div className="text-center p-4 bg-coral-50 dark:bg-coral-900/20 rounded-lg">
            <Scale className="w-6 h-6 mx-auto mb-2 text-coral-600" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalStats.totalWeight.toFixed(1)}kg
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Weight</div>
          </div>
        </div>

        {/* Sector Details */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Sector Performance</h3>
          {sectorStats.map((sector) => (
            <div key={sector.sector} className={`p-3 rounded-lg border-l-4 sector-${sector.sector.toLowerCase()}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Sector {sector.sector}
                  </h4>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {sector.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                  <Trophy className="w-4 h-4" />
                  <span>{sector.topCompetitor}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {sector.competitors}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Competitors</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {sector.totalFish}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Fish</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {sector.totalWeight}kg
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Weight</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Ranking */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Top Performing Sectors</h4>
          <div className="space-y-2">
            {sectorStats
              .sort((a, b) => b.totalFish - a.totalFish)
              .slice(0, 3)
              .map((sector, index) => (
                <div key={sector.sector} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      'bg-amber-600'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium">Sector {sector.sector}</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {sector.totalFish} fish
                  </span>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}