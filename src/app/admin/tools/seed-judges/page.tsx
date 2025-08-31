'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { 
  Database, 
  Users, 
  AlertTriangle, 
  Check, 
  X, 
  Copy,
  Trash2,
  RefreshCw,
  Shield,
  Key
} from 'lucide-react';
import { doc, setDoc, deleteDoc, serverTimestamp, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface JudgeData {
  role: 'admin' | 'judge';
  sector: string | null;
  name: string;
  username: string;
  email: string;
  status: 'active';
}

interface UIDMapping {
  name: string;
  email: string;
  username: string;
  sector: string | null;
  uid: string;
}

const defaultJudges: JudgeData[] = [
  {
    role: 'admin',
    sector: null,
    name: 'Admin User',
    username: 'Black@2050',
    email: 'admin@titanium-f7b50.com',
    status: 'active'
  },
  {
    role: 'judge',
    sector: 'A',
    name: 'Juge A',
    username: 'juge.a',
    email: 'juge.a@titanium-f7b50.com',
    status: 'active'
  },
  {
    role: 'judge',
    sector: 'B',
    name: 'Juge B',
    username: 'juge.b',
    email: 'juge.b@titanium-f7b50.com',
    status: 'active'
  },
  {
    role: 'judge',
    sector: 'C',
    name: 'Juge C',
    username: 'juge.c',
    email: 'juge.c@titanium-f7b50.com',
    status: 'active'
  },
  {
    role: 'judge',
    sector: 'D',
    name: 'Juge D',
    username: 'juge.d',
    email: 'juge.d@titanium-f7b50.com',
    status: 'active'
  },
  {
    role: 'judge',
    sector: 'E',
    name: 'Juge E',
    username: 'juge.e',
    email: 'juge.e@titanium-f7b50.com',
    status: 'active'
  },
  {
    role: 'judge',
    sector: 'F',
    name: 'Juge F',
    username: 'juge.f',
    email: 'juge.f@titanium-f7b50.com',
    status: 'active'
  }
];

export default function SeedJudgesPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [uidMappings, setUidMappings] = useState<UIDMapping[]>(
    defaultJudges.map(judge => ({
      name: judge.name,
      email: judge.email,
      username: judge.username,
      sector: judge.sector,
      uid: ''
    }))
  );
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachResult, setAttachResult] = useState<{
    created: number;
    updated: number;
    deleted: number;
    details: string[];
  } | null>(null);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h1>
            <p className="text-gray-600">Cette page n'est disponible qu'en développement.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSeedByEmail = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    
    try {
      let created = 0;
      let updated = 0;
      
      for (const judge of defaultJudges) {
        const docRef = doc(db, 'judges', judge.email);
        await setDoc(docRef, {
          ...judge,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        // Check if document existed before
        const existingDoc = await getDocs(collection(db, 'judges'));
        const existed = existingDoc.docs.some(d => d.id === judge.email);
        
        if (existed) {
          updated++;
        } else {
          created++;
        }
      }
      
      setSeedResult(`✅ Seed terminé: ${created} créés, ${updated} mis à jour`);
    } catch (error: any) {
      console.error('Seed error:', error);
      setSeedResult(`❌ Erreur: ${error.message}`);
    }
    
    setIsSeeding(false);
  };

  const handleUidChange = (index: number, uid: string) => {
    setUidMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, uid } : mapping
    ));
  };

  const handleAttachUIDs = async () => {
    setIsAttaching(true);
    setAttachResult(null);
    
    try {
      let created = 0;
      let updated = 0;
      let deleted = 0;
      const details: string[] = [];
      
      // Get existing documents to check for old email-based IDs
      const existingDocs = await getDocs(collection(db, 'judges'));
      const existingEmailDocs = existingDocs.docs.filter(doc => doc.id.includes('@'));
      
      for (const mapping of uidMappings) {
        if (!mapping.uid.trim()) {
          details.push(`⚠️ UID manquant pour ${mapping.name}`);
          continue;
        }
        
        const judge = defaultJudges.find(j => j.email === mapping.email);
        if (!judge) continue;
        
        // Create/update document with UID as ID
        const docRef = doc(db, 'judges', mapping.uid);
        await setDoc(docRef, {
          uid: mapping.uid,
          ...judge,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        // Check if this was an update or create
        const existingUidDoc = existingDocs.docs.find(d => d.id === mapping.uid);
        if (existingUidDoc) {
          updated++;
          details.push(`✅ Mis à jour: ${mapping.name} (${mapping.uid})`);
        } else {
          created++;
          details.push(`✅ Créé: ${mapping.name} (${mapping.uid})`);
        }
        
        // Delete old email-based document if it exists
        const oldEmailDoc = existingEmailDocs.find(d => d.id === mapping.email);
        if (oldEmailDoc) {
          await deleteDoc(doc(db, 'judges', mapping.email));
          deleted++;
          details.push(`🗑️ Supprimé ancien doc: ${mapping.email}`);
        }
      }
      
      setAttachResult({ created, updated, deleted, details });
    } catch (error: any) {
      console.error('Attach UIDs error:', error);
      setAttachResult({
        created: 0,
        updated: 0,
        deleted: 0,
        details: [`❌ Erreur: ${error.message}`]
      });
    }
    
    setIsAttaching(false);
  };

  const copyEmailsToClipboard = () => {
    const emails = defaultJudges.map(j => j.email).join('\n');
    navigator.clipboard.writeText(emails);
    alert('Emails copiés dans le presse-papiers');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Seed Judges Collection
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Outil de développement pour initialiser la collection Firestore judges
        </p>
        
        {/* Security Warning */}
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                ⚠️ Page de développement uniquement
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                Cette page n'est accessible qu'en mode développement et sera automatiquement désactivée en production.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Seeding */}
        <div className="space-y-6">
          {/* Step 1: Seed by Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-ocean-600" />
                <span>Étape 1: Seed by Email/Username</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Crée 7 documents dans la collection judges avec des IDs temporaires (email).
                Pratique pour commencer avant d'avoir les UIDs Firebase Auth.
              </p>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Comptes qui seront créés:
                </h4>
                <div className="space-y-1 text-sm">
                  {defaultJudges.map((judge, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-blue-700 dark:text-blue-300">
                        {judge.name} ({judge.username})
                      </span>
                      <Badge className={judge.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {judge.role === 'admin' ? 'Admin' : `Secteur ${judge.sector}`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="primary"
                  onClick={handleSeedByEmail}
                  disabled={isSeeding}
                  className="flex-1"
                >
                  {isSeeding ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  Seed by Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyEmailsToClipboard}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              {seedResult && (
                <div className={`p-3 rounded-lg ${
                  seedResult.includes('✅') ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                }`}>
                  {seedResult}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Attach UIDs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-ocean-600" />
                <span>Étape 2: Attach UIDs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Finalise en attachant les UIDs Firebase Auth. Colle les UIDs depuis la console Firebase → Authentication → Users.
              </p>
              
              <div className="space-y-3">
                {uidMappings.map((mapping, index) => (
                  <div key={index} className="grid grid-cols-3 gap-3 items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {mapping.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {mapping.email}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {mapping.username} • {mapping.sector || 'Admin'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={mapping.uid}
                        onChange={(e) => handleUidChange(index, e.target.value)}
                        placeholder="Coller l'UID Firebase Auth ici"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <Button
                variant="primary"
                onClick={handleAttachUIDs}
                disabled={isAttaching || uidMappings.some(m => !m.uid.trim())}
                className="w-full"
              >
                {isAttaching ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Key className="w-4 h-4 mr-2" />
                )}
                Attach UIDs et Finaliser
              </Button>
              
              {attachResult && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                      Rapport d'exécution:
                    </h4>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <div>✅ Créés: {attachResult.created}</div>
                      <div>🔄 Mis à jour: {attachResult.updated}</div>
                      <div>🗑️ Supprimés: {attachResult.deleted}</div>
                    </div>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                      Détails:
                    </h4>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      {attachResult.details.map((detail, index) => (
                        <div key={index}>{detail}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Instructions & Security */}
        <div className="space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-ocean-600" />
                <span>Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    1. Créer les comptes Firebase Auth
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300">
                    Dans la console Firebase → Authentication → Users, créez manuellement les 7 comptes avec les emails et mots de passe correspondants.
                  </p>
                </div>
                
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    2. Seed initial (optionnel)
                  </h4>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Utilisez "Seed by Email" pour créer rapidement les documents judges avec des IDs temporaires.
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                    3. Finaliser avec UIDs
                  </h4>
                  <p className="text-green-700 dark:text-green-300">
                    Copiez les UIDs depuis Firebase Auth et utilisez "Attach UIDs" pour créer les documents finaux.
                  </p>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Mots de passe par défaut:
                </h4>
                <div className="space-y-1 text-xs font-mono text-gray-600 dark:text-gray-400">
                  <div>admin@titaniumopen.com → 2050@5020</div>
                  <div>juge.a@titaniumopen.com → #Juge@A</div>
                  <div>juge.b@titaniumopen.com → #Juge@B</div>
                  <div>juge.c@titaniumopen.com → #Juge@C</div>
                  <div>juge.d@titaniumopen.com → #Juge@D</div>
                  <div>juge.e@titaniumopen.com → #Juge@E</div>
                  <div>juge.f@titaniumopen.com → #Juge@F</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Rules Reminder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-red-600" />
                <span>Règles de sécurité</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  🚨 Rappel important
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  Actuellement en mode DEV (règles ouvertes). Passer aux règles PROD quand les UIDs sont attachés.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                    <strong>RULES_DEV.md:</strong> Règles ouvertes (développement)
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                    <strong>RULES_PROD.md:</strong> Règles sécurisées (production)
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Après avoir attaché les UIDs, appliquez les règles PROD dans la console Firebase pour sécuriser l'accès.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>État actuel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Mode:</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Développement
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Règles Firestore:</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    DEV (ouvertes)
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Collection judges:</span>
                  <Badge variant="outline">
                    À initialiser
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}