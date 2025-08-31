'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Play, Pause, Volume2, Maximize } from 'lucide-react';

export default function LiveStream() {
  const t = useTranslations('common');
  const { publicAppearanceSettings } = useFirestore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamSettings, setStreamSettings] = useState({
    description: 'Regardez la compétition se dérouler en temps réel avec nos caméras positionnées sur tous les secteurs de pêche.',
    streamUrl: ''
  });

  // Load stream settings from Firebase
  useEffect(() => {
    if (publicAppearanceSettings) {
      setStreamSettings({
        description: publicAppearanceSettings.streamDescription || 'Regardez la compétition se dérouler en temps réel avec nos caméras positionnées sur tous les secteurs de pêche.',
        streamUrl: publicAppearanceSettings.streamUrl || ''
      });
    }
  }, [publicAppearanceSettings]);

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // YouTube
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Facebook
    if (url.includes('facebook.com')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
    }
    
    return url;
  };

  return (
    <section id="live-stream" className="py-16 bg-gradient-to-br from-ocean-50 to-sand-50 dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Direct Live
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {streamSettings.description}
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Diffusion en Direct de la Compétition</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-red-600 font-semibold">EN DIRECT</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
              {streamSettings.streamUrl ? (
                <iframe
                  src={getEmbedUrl(streamSettings.streamUrl)}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                      {isPlaying ? (
                        <Pause className="w-8 h-8" />
                      ) : (
                        <Play className="w-8 h-8 ml-1" />
                      )}
                    </div>
                    <p className="text-lg font-semibold">Diffusion en Direct</p>
                    <p className="text-sm text-gray-300">Cliquez pour {isPlaying ? 'mettre en pause' : 'lire'}</p>
                  </div>
                </div>
              )}
              
              {!streamSettings.streamUrl && (
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute inset-0 w-full h-full bg-transparent hover:bg-black/10 transition-colors"
                />
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!streamSettings.streamUrl && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  1 247 spectateurs
                </span>
                <Button variant="ghost" size="sm">
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}