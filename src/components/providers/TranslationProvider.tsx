'use client';

import { ReactNode, createContext, useContext } from 'react';
import messages from '@messages/fr.json';

interface TranslationContextType {
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function useTranslations(namespace?: string) {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationProvider');
  }
  
  return (key: string) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const keys = fullKey.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return typeof value === 'string' ? value : fullKey;
  };
}

interface Props {
  children: ReactNode;
}

export function TranslationProvider({ children }: Props) {
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <TranslationContext.Provider value={{ t }}>
      {children}
    </TranslationContext.Provider>
  );
}