'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import Button from '@/components/ui/Button';
import { 
  Clock, 
  Users, 
  Shield, 
  Database, 
  Bell, 
  Palette, 
  Save, 
  RotateCcw,
  Calendar,
  Trash2,
  AlertTriangle,
  Timer,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface CompetitionSettings {
  startDateTime: string;
  endDateTime: string;
  soundEnabled: boolean;
}

interface ResetConfirmation {
  show: boolean;
  confirmText: string;
  isValid: boolean;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    competitionDuration: 7,
    maxCompetitors: 20,
    pointsPerFish: 50,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    theme: 'system'
  });

  const [competitionSettings, setCompetitionSettings] = useState<CompetitionSettings>({
    startDateTime: '',
    endDateTime: '',
    soundEnabled: true
  });

  const [resetConfirmation, setResetConfirmation] = useState<ResetConfirmation>({
    show: false,
    confirmText: '',
    isValid: false
  });

  const [isResetting, setIsResetting] = useState(false);

  const { theme, toggleTheme, setTheme } = useTheme();
  const router = useRouter();

  // Load competition settings on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('competitionSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setCompetitionSettings(parsed);
        } catch (error) {
          console.error('Error loading competition settings:', error);
        }
      } else {
        // Default to tomorrow 8:00 AM - 4:00 PM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const startTime = new Date(tomorrow);
        startTime.setHours(8, 0, 0, 0);
        
        const endTime = new Date(tomorrow);
        endTime.setHours(16, 0, 0, 0);
        
        const defaultSettings = {
          startDateTime: startTime.toISOString().slice(0, 16),
          endDateTime: endTime.toISOString().slice(0, 16),
          soundEnabled: true
        };
        
        setCompetitionSettings(defaultSettings);
        localStorage.setItem('competitionSettings', JSON.stringify(defaultSettings));
      }
    }
  }, []);

  // Update reset confirmation validity
  useEffect(() => {
    setResetConfirmation(prev => ({
      ...prev,
      isValid: prev.confirmText === 'RESET'
    }));
  }, [resetConfirmation.confirmText]);

  const handleSaveChanges = () => {
    // Apply theme changes
    if (settings.theme !== 'system') {
      setTheme(settings.theme as 'light' | 'dark');
    }
    
    console.log('Saving settings:', settings);
    alert('Paramètres sauvegardés avec succès !');
  };

  const handleSaveCompetitionSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('competitionSettings', JSON.stringify(competitionSettings));
      
      // Trigger storage event for live updates
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'competitionSettings',
        newValue: JSON.stringify(competitionSettings)
      }));
    }
    
    console.log('Saving competition settings:', competitionSettings);
    alert('Paramètres de compétition sauvegardés avec succès !');
  };

  const handleResetDefaults = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres par défaut ?')) {
      setSettings({
        competitionDuration: 8,
        maxCompetitors: 20,
        pointsPerFish: 50,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        theme: 'system'
      });
      console.log('Paramètres réinitialisés par défaut');
      alert('Paramètres réinitialisés par défaut !');
    }
  };

  const handleDataReset = () => {
    if (!resetConfirmation.isValid) return;

    setIsResetting(true);

    // Clear only data entries, not competitors or judges
    if (typeof window !== 'undefined') {
      // Clear hourly data
      localStorage.removeItem('hourlyData');
      
      // Clear grosse prise data
      localStorage.removeItem('grossePriseData');
      
      // Trigger storage events for live updates
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'hourlyData',
        newValue: null
      }));
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'grossePriseData',
        newValue: null
      }));

      // Create audit entry
      const auditEntry = {
        id: Date.now().toString(),
        action: 'DATA_RESET',
        user: 'Admin User',
        timestamp: new Date().toISOString(),
        details: 'Reset des données de prises et grosse prise',
        affectedData: ['hourlyData', 'grossePriseData']
      };

      const existingAudit = JSON.parse(localStorage.getItem('auditLog') || '[]');
      existingAudit.unshift(auditEntry);
      localStorage.setItem('auditLog', JSON.stringify(existingAudit.slice(0, 100))); // Keep last 100 entries
    }

    setTimeout(() => {
      setIsResetting(false);
      setResetConfirmation({
        show: false,
        confirmText: '',
        isValid: false
      });
      
      alert('Reset des données terminé avec succès !');
    }, 2000);
  };

  const handleBackupNow = () => {
    console.log('Démarrage de la sauvegarde...');
    alert('Sauvegarde démarrée avec succès !');
  };

  const handleManageUsers = () => {
    console.log('Ouverture de la gestion des utilisateurs...');
    router.push('/admin/users');
  };

  const handleAddUser = () => {
    router.push('/admin/users');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="text-gray-600 dark:text-gray-300">Configurer les paramètres de compétition et système</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={handleResetDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
          <Button variant="primary" size="sm" onClick={handleSaveChanges}>
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Competition Timing Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-ocean-600" />
            <span>Paramètres de Timing de Compétition</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date/Heure de début (Africa/Tunis)
              </label>
              <input
                type="datetime-local"
                value={competitionSettings.startDateTime}
                onChange={(e) => setCompetitionSettings(prev => ({
                  ...prev,
                  startDateTime: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date/Heure de fin (Africa/Tunis)
              </label>
              <input
                type="datetime-local"
                value={competitionSettings.endDateTime}
                onChange={(e) => setCompetitionSettings(prev => ({
                  ...prev,
                  endDateTime: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="soundEnabled"
              checked={competitionSettings.soundEnabled}
              onChange={(e) => setCompetitionSettings(prev => ({
                ...prev,
                soundEnabled: e.target.checked
              }))}
              className="w-4 h-4 text-ocean-600 border-gray-300 rounded focus:ring-ocean-500"
            />
            <label htmlFor="soundEnabled" className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
              {competitionSettings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-ocean-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
              <span>Activer le son pour le compte à rebours</span>
            </label>
          </div>

          <Button variant="primary" onClick={handleSaveCompetitionSettings}>
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder les paramètres de timing
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-ocean-600" />
            <span>Gestion des Données</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  Reset des Données de Compétition
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  Cette action supprimera toutes les données de prises (H1-H7) et grosse prise de tous les secteurs. 
                  Les compétiteurs, juges et paramètres seront conservés.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                      Tapez "RESET" pour confirmer:
                    </label>
                    <input
                      type="text"
                      value={resetConfirmation.confirmText}
                      onChange={(e) => setResetConfirmation(prev => ({
                        ...prev,
                        confirmText: e.target.value
                      }))}
                      className="w-full max-w-xs px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Tapez RESET"
                    />
                  </div>
                  
                  <Button
                    variant="destructive"
                    onClick={() => setResetConfirmation(prev => ({ ...prev, show: true }))}
                    disabled={!resetConfirmation.isValid}
                    className="flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Reset des Données</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competition Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-ocean-600" />
            <span>Paramètres de Compétition</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Durée de la compétition (heures)
              </label>
              <input
                type="number"
                value={settings.competitionDuration}
                onChange={(e) => setSettings({...settings, competitionDuration: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum de compétiteurs par secteur
              </label>
              <input
                type="number"
                value={settings.maxCompetitors}
                onChange={(e) => setSettings({...settings, maxCompetitors: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Points par poisson
              </label>
              <input
                type="number"
                value={settings.pointsPerFish}
                onChange={(e) => setSettings({...settings, pointsPerFish: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-ocean-600" />
            <span>Gestion des utilisateurs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Administrateurs</h3>
              <div className="text-2xl font-bold text-ocean-600 mb-1">3</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Utilisateurs admin actifs</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Juges</h3>
              <div className="text-2xl font-bold text-sand-600 mb-1">12</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Utilisateurs juge actifs</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Compétiteurs</h3>
              <div className="text-2xl font-bold text-coral-600 mb-1">120</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Compétiteurs inscrits</div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" size="sm" onClick={handleManageUsers}>
              Gérer les utilisateurs
            </Button>
            <Button variant="outline" size="sm" onClick={handleAddUser}>
              Ajouter un utilisateur
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-ocean-600" />
            <span>Paramètres de sécurité</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Protection du contenu</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Empêcher la copie et le clic droit</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Activé
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Filigrane</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Afficher le filigrane de sécurité</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Activé
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Délai d'expiration de session</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Déconnexion automatique après inactivité</p>
              </div>
              <select className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option>30 minutes</option>
                <option>1 heure</option>
                <option>2 heures</option>
                <option>Jamais</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-ocean-600" />
              <span>Paramètres de base de données</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Sauvegarde automatique</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Quotidienne
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rétention des données</span>
                <span className="text-sm font-medium">1 an</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dernière sauvegarde</span>
                <span className="text-sm font-medium">Il y a 2 heures</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleBackupNow}>
              Sauvegarder maintenant
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-ocean-600" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                  className="w-4 h-4 text-ocean-600 border-gray-300 rounded focus:ring-ocean-500"
                />
                <label htmlFor="emailNotifications" className="text-sm text-gray-700 dark:text-gray-300">
                  Notifications par email
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="pushNotifications"
                  checked={settings.pushNotifications}
                  onChange={(e) => setSettings({...settings, pushNotifications: e.target.checked})}
                  className="w-4 h-4 text-ocean-600 border-gray-300 rounded focus:ring-ocean-500"
                />
                <label htmlFor="pushNotifications" className="text-sm text-gray-700 dark:text-gray-300">
                  Notifications push
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="smsNotifications"
                  checked={settings.smsNotifications}
                  onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})}
                  className="w-4 h-4 text-ocean-600 border-gray-300 rounded focus:ring-ocean-500"
                />
                <label htmlFor="smsNotifications" className="text-sm text-gray-700 dark:text-gray-300">
                  Notifications SMS
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-ocean-600" />
            <span>Apparence</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thème
              </label>
              <select 
                value={settings.theme}
                onChange={(e) => setSettings({...settings, theme: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="system">Système par défaut</option>
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Modal */}
      {resetConfirmation.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Confirmer le Reset des Données</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Vous êtes sur le point de supprimer <strong>toutes les données de prises</strong> :
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                  <li>• Données horaires H1-H7 (tous secteurs)</li>
                  <li>• Données de grosse prise (tous secteurs)</li>
                  <li>• Classements et calculs associés</li>
                </ul>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Cette action est irréversible !
                </p>
                
                <div className="flex space-x-3">
                  <Button
                    variant="destructive"
                    onClick={handleDataReset}
                    className="flex-1"
                    disabled={!resetConfirmation.isValid || isResetting}
                  >
                    {isResetting ? (
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    {isResetting ? 'Reset en cours...' : 'Confirmer le Reset'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setResetConfirmation({
                      show: false,
                      confirmText: '',
                      isValid: false
                    })}
                    className="flex-1"
                    disabled={isResetting}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}