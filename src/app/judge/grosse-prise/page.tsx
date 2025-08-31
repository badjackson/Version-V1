import GrossePriseEntry from '@/components/judge/GrossePriseEntry';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grosse Prise - Panel Juge',
  description: 'Saisie de la grosse prise par compétiteur',
};

export default function JudgeGrossePrisePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grosse Prise</h1>
          <p className="text-gray-600 dark:text-gray-300">Saisie de la grosse prise par compétiteur</p>
        </div>
      </div>
      
      <GrossePriseEntry />
    </div>
  );
}