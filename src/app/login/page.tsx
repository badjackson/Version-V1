'use client';

import LoginForm from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTranslations } from '@/components/providers/TranslationProvider';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations('auth');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-700 flex items-center justify-center p-4">
      {/* Back Arrow */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 flex items-center space-x-2 text-white hover:text-ocean-200 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Retour à l'accueil</span>
      </Link>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Titanium Tunisia Open
          </h1>
          <p className="text-ocean-200">
            {t('loginSubtitle')}
          </p>
        </div>
        
        <Card className="glass border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white">{t('login')}</CardTitle>
            <CardDescription className="text-ocean-200">
              {t('loginDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}