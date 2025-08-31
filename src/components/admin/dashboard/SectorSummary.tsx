'use client';

import { useTranslations } from '@/components/providers/TranslationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function SectorSummary() {
  const t = useTranslations('common');

  const sectors = [
    {
      id: 'A',
      name: 'Sector A',
      competitors: 20,
      totalFish: 234,
      totalWeight: 67.8,
      status: 'active',
      topCompetitor: 'Sami Said',
    },
    {
      id: 'B',
      name: 'Sector B',
      competitors: 20,
      totalFish: 198,
      totalWeight: 52.3,
      status: 'active',
      topCompetitor: 'Akram Ben Abdallah',
    },
    {
      id: 'C',
      name: 'Sector C',
      competitors: 20,
      totalFish: 176,
      totalWeight: 48.9,
      status: 'active',
      topCompetitor: 'Bassem Mezelini',
    },
    {
      id: 'D',
      name: 'Sector D',
      competitors: 20,
      totalFish: 165,
      totalWeight: 44.2,
      status: 'active',
      topCompetitor: 'Hamdi Gdara',
    },
    {
      id: 'E',
      name: 'Sector E',
      competitors: 20,
      totalFish: 142,
      totalWeight: 38.7,
      status: 'active',
      topCompetitor: 'Tayssir Dimassi',
    },
    {
      id: 'F',
      name: 'Sector F',
      competitors: 20,
      totalFish: 132,
      totalWeight: 35.6,
      status: 'active',
      topCompetitor: 'Mounir El Haddad',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sector Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sectors.map((sector) => (
            <div key={sector.id} className={`p-4 rounded-lg border-l-4 sector-${sector.id.toLowerCase()}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {sector.name}
                  </h3>
                  <Badge variant="outline" className={`sector-${sector.id.toLowerCase()}`}>
                    {sector.competitors} competitors
                  </Badge>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {sector.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {sector.totalFish}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Fish Caught</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {sector.totalWeight}kg
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Total Weight</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {sector.topCompetitor}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Top Performer</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}