'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { Card, CardContent } from '@/components/ui/Card';

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  tier: 'title' | 'gold' | 'silver' | 'bronze';
}

export default function Sponsors() {
  const t = useTranslations('common');
  const { publicAppearanceSettings } = useFirestore();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  // Load sponsors from Firebase
  useEffect(() => {
    if (publicAppearanceSettings?.sponsors) {
      // Filter out sponsors with empty names or logos
      const validSponsors = publicAppearanceSettings.sponsors.filter((s: Sponsor) => 
        s.name && s.name.trim() !== '' && s.logo && s.logo.trim() !== ''
      );
      setSponsors(validSponsors);
    }
  }, [publicAppearanceSettings]);

  if (sponsors.length === 0) {
    return null; // Don't show section if no sponsors
  }

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'title': return 'Sponsor Titre';
      case 'gold': return 'Sponsor Or';
      case 'silver': return 'Sponsor Argent';
      case 'bronze': return 'Sponsor Bronze';
      default: return 'Sponsor';
    }
  };

  const getTierOrder = (tier: string) => {
    switch (tier) {
      case 'title': return 1;
      case 'gold': return 2;
      case 'silver': return 3;
      case 'bronze': return 4;
      default: return 5;
    }
  };

  // Sort sponsors by tier
  const sortedSponsors = [...sponsors].sort((a, b) => getTierOrder(a.tier) - getTierOrder(b.tier));

  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Nos Partenaires
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Merci à nos partenaires qui rendent cette compétition possible
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedSponsors.map((sponsor, index) => (
            <Card key={sponsor.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-full h-20 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {sponsor.logo ? (
                    <img 
                      src={sponsor.logo} 
                      alt={sponsor.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 font-semibold text-sm">
                      {sponsor.name}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {sponsor.name}
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getTierLabel(sponsor.tier)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}