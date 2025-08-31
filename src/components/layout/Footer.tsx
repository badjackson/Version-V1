'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { Facebook, Instagram, Youtube, Globe, ArrowUp } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function Footer() {
  const t = useTranslations('common');
  const { theme } = useTheme();
  const { publicAppearanceSettings } = useFirestore();
  const [footerSettings, setFooterSettings] = useState({
    text: 'La compétition de pêche de référence en Tunisie, rassemblant les meilleurs pêcheurs de la région pour une expérience inoubliable sur la côte méditerranéenne.',
    socialLinks: {
      youtube: '',
      facebook: '',
      instagram: '',
      website: ''
    },
    logos: {
      light: '',
      dark: ''
    }
  });

  // Load footer settings from Firebase
  useEffect(() => {
    if (publicAppearanceSettings) {
      setFooterSettings({
        text: publicAppearanceSettings.footerText || 'La compétition de pêche de référence en Tunisie, rassemblant les meilleurs pêcheurs de la région pour une expérience inoubliable sur la côte méditerranéenne.',
        socialLinks: publicAppearanceSettings.socialLinks || {
          youtube: '',
          facebook: '',
          instagram: '',
          website: ''
        },
        logos: publicAppearanceSettings.logos || { light: '', dark: '' }
      });
    }
  }, [publicAppearanceSettings]);

  const socialIcons = [
    { 
      icon: Youtube, 
      href: footerSettings.socialLinks.youtube, 
      label: 'YouTube',
      color: 'hover:bg-red-600'
    },
    { 
      icon: Facebook, 
      href: footerSettings.socialLinks.facebook, 
      label: 'Facebook',
      color: 'hover:bg-blue-600'
    },
    { 
      icon: Instagram, 
      href: footerSettings.socialLinks.instagram, 
      label: 'Instagram',
      color: 'hover:bg-pink-600'
    },
    { 
      icon: Globe, 
      href: footerSettings.socialLinks.website, 
      label: 'Site Web',
      color: 'hover:bg-gray-600'
    },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCurrentLogo = () => {
    // Always use dark logo for footer only
    if (footerSettings.logos.dark) {
      return footerSettings.logos.dark;
    }
    return null;
  };

  return (
    <footer className="bg-gray-900 text-white relative">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-8">
          {/* Logo */}
          {getCurrentLogo() && (
            <div className="flex justify-center">
              <img 
                src={getCurrentLogo()} 
                alt="Titanium Tunisia Open"
                className="h-12 sm:h-16 md:h-20 w-auto max-w-[150px] sm:max-w-[200px] md:max-w-[250px] object-contain"
              />
            </div>
          )}

          {/* Editable Text */}
          <div className="max-w-2xl mx-auto">
            <p className="text-gray-200 text-lg leading-relaxed">
              {footerSettings.text}
            </p>
          </div>

          {/* Social Media Icons - Only show if at least one link is configured */}
          {(footerSettings.socialLinks.youtube || footerSettings.socialLinks.facebook || footerSettings.socialLinks.instagram || footerSettings.socialLinks.website) && (
            <div className="flex justify-center space-x-4">
              {footerSettings.socialLinks.youtube && (
                <a
                  href={footerSettings.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors shadow-lg"
                  aria-label="YouTube"
                >
                  <Youtube className="w-6 h-6 text-white" />
                </a>
              )}
              {footerSettings.socialLinks.facebook && (
                <a
                  href={footerSettings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors shadow-lg"
                  aria-label="Facebook"
                >
                  <Facebook className="w-6 h-6 text-white" />
                </a>
              )}
              {footerSettings.socialLinks.instagram && (
                <a
                  href={footerSettings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full flex items-center justify-center transition-colors shadow-lg"
                  aria-label="Instagram"
                >
                  <Instagram className="w-6 h-6 text-white" />
                </a>
              )}
              {footerSettings.socialLinks.website && (
                <a
                  href={footerSettings.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors shadow-lg"
                  aria-label="Site Web"
                >
                  <Globe className="w-6 h-6 text-white" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className="absolute bottom-6 right-6 w-12 h-12 bg-ocean-600 hover:bg-ocean-500 rounded-full flex items-center justify-center transition-colors shadow-lg"
        aria-label="Retour en haut"
      >
        <ArrowUp className="w-6 h-6 text-white" />
      </button>
    </footer>
  );
}