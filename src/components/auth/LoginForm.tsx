'use client';

import { useState } from 'react';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { useRouter } from 'next/navigation';
import { loginWithFirebase } from '@/lib/auth';
import Button from '@/components/ui/Button';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Use Firebase Auth
    const result = await loginWithFirebase(username, password);
    
    setIsLoading(false);
    
    if (result.success && result.user) {
      // Redirect based on role
      if (result.user.role === 'admin') {
        router.push('/admin');
      } else if (result.user.role === 'judge') {
        router.push('/judge');
      }
    } else {
      setError(result.error || t('invalidCredentials'));
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
            {t('username')}
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
            {t('password')}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? t('loading') : t('loginButton')}
        </Button>
      </form>
    </div>
  );
}