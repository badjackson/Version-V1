import HourlyDataEntry from '@/components/judge/HourlyDataEntry';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prises - Panel Juge',
  description: 'Saisie horaire des données de prises de la compétition',
};

export default function JudgePrisesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prises</h1>
          <p className="text-gray-600 dark:text-gray-300">Saisie horaire des données de prises de la compétition</p>
        </div>
      </div>
      
      <HourlyDataEntry />
    </div>
  );
}