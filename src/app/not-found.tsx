import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-700 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-md">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-2">Page non trouvée</h2>
          <p className="text-ocean-200">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 bg-white text-ocean-600 px-6 py-3 rounded-lg font-medium hover:bg-ocean-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Retour à l'accueil</span>
          </Link>
          
          <div className="text-sm text-ocean-300">
            <p>Ou essayez ces liens :</p>
            <div className="mt-2 space-x-4">
              <Link href="/login" className="hover:text-white underline">
                Connexion
              </Link>
              <Link href="/#classement-general" className="hover:text-white underline">
                Classements
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}