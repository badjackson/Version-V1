'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-700 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-md">
        <div className="mb-8">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-3xl font-bold mb-4">Une erreur s'est produite</h1>
          <p className="text-ocean-200 mb-2">
            Quelque chose s'est mal passé. Veuillez réessayer.
          </p>
          {error.message && (
            <p className="text-sm text-red-300 bg-red-900/20 p-3 rounded-lg mt-4">
              {error.message}
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={reset}
            variant="secondary"
            className="w-full"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Réessayer
          </Button>
          
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 text-ocean-200 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Retour à l'accueil</span>
          </Link>
        </div>
      </div>
    </div>
  );
}