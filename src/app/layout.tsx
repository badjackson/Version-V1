import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { TranslationProvider } from '@/components/providers/TranslationProvider';
import FirestoreSyncProvider from '@/components/providers/FirestoreSyncProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Titanium Tunisia Open - Compétition de Pêche',
  description: 'Système officiel de gestion de tournoi pour la compétition de pêche Titanium Tunisia Open',
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)', color: '#0891b2' }
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tunisia Open',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var theme = savedTheme || systemTheme;
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SocketProvider>
            <TranslationProvider>
              <FirestoreSyncProvider>
                {children}
              </FirestoreSyncProvider>
            </TranslationProvider>
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}