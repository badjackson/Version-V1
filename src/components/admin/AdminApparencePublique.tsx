'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Save, 
  Upload, 
  Eye, 
  Image, 
  Globe, 
  Youtube, 
  Facebook, 
  Instagram, 
  FileText,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { type PublicAppearanceSettingsDoc } from '@/lib/firestore-services';

export default function AdminApparencePublique() {
  const { publicAppearanceSettings, savePublicAppearanceSettings } = useFirestore();
  const [settings, setSettings] = useState({
    logos: {
      light: '',
      dark: ''
    },
    sponsors: [
      {
        id: '1',
        name: 'Titanium Corp',
        logo: '',
        tier: 'title'
      },
      {
        id: '2',
        name: 'Marine Equipment Ltd',
        logo: '',
        tier: 'gold'
      },
      {
        id: '3',
        name: 'Fishing Gear Pro',
        logo: '',
        tier: 'silver'
      },
      {
        id: '4',
        name: 'Ocean Sports',
        logo: '',
        tier: 'bronze'
      }
    ] as Array<{
      id: string;
      name: string;
      logo: string;
      tier: 'title' | 'gold' | 'silver' | 'bronze';
    }>,
    socialLinks: {
      youtube: '',
      facebook: '',
      instagram: '',
      website: ''
    },
    footerText: 'La compétition de pêche de référence en Tunisie, rassemblant les meilleurs pêcheurs de la région pour une expérience inoubliable sur la côte méditerranéenne.',
    streamDescription: 'Regardez la compétition se dérouler en temps réel avec nos caméras positionnées sur tous les secteurs de pêche.',
    streamUrl: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from Firestore
  useEffect(() => {
    if (publicAppearanceSettings) {
      setSettings({
        logos: publicAppearanceSettings.logos,
        sponsors: publicAppearanceSettings.sponsors,
        socialLinks: publicAppearanceSettings.socialLinks,
        footerText: publicAppearanceSettings.footerText,
        streamDescription: publicAppearanceSettings.streamDescription,
        streamUrl: publicAppearanceSettings.streamUrl
      });
    }
  }, [publicAppearanceSettings]);

  const handleSave = () => {
    setIsSaving(true);
    
    const settingsData: Omit<PublicAppearanceSettingsDoc, 'updatedAt'> = {
      id: 'main',
      ...settings
    };
    
    try {
      savePublicAppearanceSettings(settingsData);
      setTimeout(() => {
        setIsSaving(false);
        alert('Paramètres d\'apparence sauvegardés avec succès !');
      }, 800);
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      setIsSaving(false);
      alert('Erreur lors de la sauvegarde des paramètres');
    }
  };

  // Helper function to save to Firestore
  const saveToFirestore = async (updatedSettings: typeof settings) => {
    const settingsData: Omit<PublicAppearanceSettingsDoc, 'updatedAt'> = {
      id: 'main',
      ...updatedSettings
    };
    
    try {
      await savePublicAppearanceSettings(settingsData);
    } catch (error) {
      console.error('Error saving to Firestore:', error);
    }
  };

  const handleLogoUpload = (type: 'light' | 'dark') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB for logos)
      if (file.size > 2 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Veuillez choisir une image de moins de 2MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const newSettings = {
          ...settings,
          logos: {
            ...settings.logos,
            [type]: result
          }
        };
        
        setSettings(newSettings);
        saveToFirestore(newSettings);
      };
      reader.onerror = () => {
        alert('Erreur lors de la lecture du fichier. Veuillez réessayer.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSponsorLogoUpload = (sponsorId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 1MB for sponsor logos)
      if (file.size > 1024 * 1024) {
        alert('Le fichier est trop volumineux. Veuillez choisir une image de moins de 1MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const updatedSettings = {
          ...settings,
          sponsors: settings.sponsors.map(sponsor =>
            sponsor.id === sponsorId
              ? { ...sponsor, logo: result }
              : sponsor
          )
        };
        
        setSettings(updatedSettings);
        
        // Force immediate save for sponsor logo uploads
        saveToFirestore(updatedSettings);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add function to clear logo
  const clearLogo = (type: 'light' | 'dark') => {
    const updatedSettings = {
      ...settings,
      logos: {
        ...settings.logos,
        [type]: ''
      }
    };
    
    setSettings(updatedSettings);
    saveToFirestore(updatedSettings);
  };

  const addSponsor = () => {
    const newSponsor = {
      id: Date.now().toString(),
      name: '',
      logo: '',
      tier: 'bronze' as const
    };
    const updatedSettings = {
      ...settings,
      sponsors: [...settings.sponsors, newSponsor]
    };
    setSettings(updatedSettings);
    saveToFirestore(updatedSettings);
  };

  const removeSponsor = (sponsorId: string) => {
    const updatedSettings = {
      ...settings,
      sponsors: settings.sponsors.filter(s => s.id !== sponsorId)
    };
    setSettings(updatedSettings);
    saveToFirestore(updatedSettings);
  };

  const updateSponsor = (sponsorId: string, field: string, value: string) => {
    const updatedSettings = {
      ...settings,
      sponsors: settings.sponsors.map(sponsor =>
        sponsor.id === sponsorId
          ? { ...sponsor, [field]: value }
          : sponsor
      )
    };
    setSettings(updatedSettings);
    
    // Auto-save sponsor updates with debounce
    setTimeout(() => {
      saveToFirestore(updatedSettings);
    }, 1000);
  };

  const restoreFromBackup = () => {
    // Placeholder function
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Apparence publique</h1>
          <p className="text-gray-600 dark:text-gray-300">Personnaliser l'apparence du site public</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <Button
              variant={previewMode === 'desktop' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === 'tablet' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('tablet')}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={restoreFromBackup}>
            Restaurer
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Settings */}
        <div className="space-y-6">
          {/* Site Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Image className="w-5 h-5 text-ocean-600" />
                <span>Identité du site</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Light Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logo (version claire)
                </label>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Une fois uploadé, le logo sera sauvegardé automatiquement et persistera entre les sessions.
                </div>
                <div className="space-y-3">
                  {settings.logos.light && (
                    <div className="flex justify-center p-4 bg-white rounded-lg border">
                      <img 
                        src={settings.logos.light} 
                        alt="Logo clair"
                        className="h-16 w-auto"
                      />
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload('light')}
                      className="hidden"
                      id="light-logo-upload"
                    />
                    <label
                      htmlFor="light-logo-upload"
                      className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {settings.logos.light ? 'Remplacer' : 'Choisir'} le logo clair
                    </label>
                    {settings.logos.light && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearLogo('light')}
                        className="text-red-600 hover:text-red-700"
                      >
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dark Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logo (version sombre)
                </label>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Logo utilisé sur les fonds sombres et dans le pied de page.
                </div>
                <div className="space-y-3">
                  {settings.logos.dark && (
                    <div className="flex justify-center p-4 bg-gray-900 rounded-lg border">
                      <img 
                        src={settings.logos.dark} 
                        alt="Logo sombre"
                        className="h-16 w-auto"
                      />
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload('dark')}
                      className="hidden"
                      id="dark-logo-upload"
                    />
                    <label
                      htmlFor="dark-logo-upload"
                      className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {settings.logos.dark ? 'Remplacer' : 'Choisir'} le logo sombre
                    </label>
                    {settings.logos.dark && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearLogo('dark')}
                        className="text-red-600 hover:text-red-700"
                      >
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-ocean-600" />
                <span>Réseaux sociaux</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Youtube className="w-4 h-4 inline mr-1" />
                  YouTube
                </label>
                <input
                  type="url"
                  value={settings.socialLinks.youtube}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, youtube: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="https://youtube.com/@tunisiaopen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Facebook className="w-4 h-4 inline mr-1" />
                  Facebook
                </label>
                <input
                  type="url"
                  value={settings.socialLinks.facebook}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="https://facebook.com/tunisiaopen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Instagram className="w-4 h-4 inline mr-1" />
                  Instagram
                </label>
                <input
                  type="url"
                  value={settings.socialLinks.instagram}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="https://instagram.com/tunisiaopen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Site Web
                </label>
                <input
                  type="url"
                  value={settings.socialLinks.website}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, website: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="https://tunisiaopen.com"
                />
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Info:</strong> Les liens sociaux sont sauvegardés automatiquement et apparaîtront dans le pied de page du site public.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer Text */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-ocean-600" />
                <span>Texte du pied de page</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={settings.footerText}
                onChange={(e) => setSettings(prev => ({ ...prev, footerText: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Texte descriptif affiché dans le pied de page..."
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Ce texte apparaîtra dans le pied de page du site public et sera sauvegardé automatiquement.
              </div>
            </CardContent>
          </Card>

          {/* Live Stream */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Youtube className="w-5 h-5 text-ocean-600" />
                <span>Diffusion en direct</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={settings.streamDescription}
                  onChange={(e) => setSettings(prev => ({ ...prev, streamDescription: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Description de la diffusion en direct..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL de diffusion (YouTube/Facebook)
                </label>
                <input
                  type="url"
                  value={settings.streamUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, streamUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="https://youtube.com/watch?v=... ou https://facebook.com/..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sponsors */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Image className="w-5 h-5 text-ocean-600" />
                  <span>Sponsors</span>
                </div>
                <Button variant="outline" size="sm" onClick={addSponsor}>
                  <Upload className="w-4 h-4 mr-1" />
                  Ajouter un sponsor
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.sponsors.map((sponsor, index) => (
                  <div key={sponsor.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Sponsor #{index + 1}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSponsor(sponsor.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Supprimer
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nom
                          </label>
                          <input
                            type="text"
                            value={sponsor.name}
                            onChange={(e) => updateSponsor(sponsor.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            placeholder="Nom du sponsor"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Niveau
                          </label>
                          <select
                            value={sponsor.tier}
                            onChange={(e) => updateSponsor(sponsor.id, 'tier', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="title">Titre</option>
                            <option value="gold">Or</option>
                            <option value="silver">Argent</option>
                            <option value="bronze">Bronze</option>
                          </select>
                        </div>
                      </div>

                      {sponsor.logo && (
                        <div className="flex justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <img 
                            src={sponsor.logo} 
                            alt={sponsor.name}
                            className="h-12 w-auto"
                          />
                        </div>
                      )}

                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSponsorLogoUpload(sponsor.id, e)}
                          className="hidden"
                          id={`sponsor-logo-${sponsor.id}`}
                        />
                        <label
                          htmlFor={`sponsor-logo-${sponsor.id}`}
                          className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choisir le logo
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-ocean-600" />
                <span>Aperçu</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
                previewMode === 'mobile' ? 'max-w-sm mx-auto' :
                previewMode === 'tablet' ? 'max-w-md mx-auto' :
                'w-full'
              }`}>
                {/* Header Preview */}
                <div className="bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {settings.logos.light || settings.logos.dark ? (
                        <img 
                          src={settings.logos.light || settings.logos.dark} 
                          alt="Logo"
                          className="h-8 w-auto"
                        />
                      ) : (
                        <div className="w-8 h-8 ocean-gradient rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">T</span>
                        </div>
                      )}
                      <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                          Tunisia Open
                        </h1>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Preview */}
                <div className="bg-gray-900 text-white p-6">
                  <div className="text-center space-y-4">
                    {/* Logo */}
                    <div className="flex justify-center">
                      {settings.logos.dark || settings.logos.light ? (
                        <img 
                          src={settings.logos.dark || settings.logos.light} 
                          alt="Logo"
                          className="h-12 w-auto"
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 ocean-gradient rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">T</span>
                          </div>
                          <span className="text-lg font-bold">Tunisia Open</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Text */}
                    <p className="text-gray-300 text-sm max-w-md mx-auto">
                      {settings.footerText}
                    </p>

                    {/* Social Icons */}
                    <div className="flex justify-center space-x-3">
                      {settings.socialLinks.youtube && (
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                          <Youtube className="w-4 h-4" />
                        </div>
                      )}
                      {settings.socialLinks.facebook && (
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <Facebook className="w-4 h-4" />
                        </div>
                      )}
                      {settings.socialLinks.instagram && (
                        <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                          <Instagram className="w-4 h-4" />
                        </div>
                      )}
                      {settings.socialLinks.website && (
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <Globe className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sponsors Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu des sponsors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {settings.sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    {sponsor.logo ? (
                      <img 
                        src={sponsor.logo} 
                        alt={sponsor.name}
                        className="h-8 w-auto mx-auto mb-2"
                      />
                    ) : (
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2 flex items-center justify-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{sponsor.name || 'Logo'}</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-600 dark:text-gray-300 capitalize">
                      {sponsor.tier}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}