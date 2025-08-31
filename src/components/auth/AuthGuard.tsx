'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface Props {
  children: ReactNode;
  requiredRole?: 'admin' | 'judge';
}

export function AuthGuard({ children, requiredRole }: Props) {
  const { currentUser, isLoading } = useCurrentUser();
  const router = useRouter();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-ocean-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!currentUser) {
    router.push('/login');
    return null;
  }

  // Check role authorization
  if (requiredRole && currentUser.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Accès non autorisé
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}