'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { 
  Save, 
  Trash2,
  Edit,
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Mail,
  MapPin,
  Key
} from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { FirebaseAuthAdmin, type JudgeAuthData } from '@/lib/firebase-auth-admin';

// Liste des juges par défaut à initialiser dans Firebase Auth
const defaultJudges: JudgeAuthData[] = [
  {
    role: 'admin',
    sector: null,
    name: 'Admin User',
    email: 'admin@titaniumopen.com',
    password: '2050@5020',
    status: 'active'
  },
  {
    role: 'judge',
    sector: 'A',
    name: 'Juge A',
    email: 'juge.a@titaniumopen.com',
    password: '#Juge@A',
    status: 'active'
  },
  {
    role: 'judge',
    sector: 'B',
    name: 'Juge B',
    email: 'juge.b@titaniumopen.com',
    password: '#Juge@B',
    status: 'active'
  },
  {
    role: 'judge',
    sector: 'C',
    name: 'Juge C',
    email: 'juge.c@titaniumopen.com',
    password: '#Juge@C',
    status: 'active'
  },
  {
    role: 'judge',
    sector: 'D',
    name: 'Juge D',
    email: 'juge.d@titaniumopen.com',
    password: '#Juge@D',
    status: 'active'
  },
  {
    role: 'judge',
    sector: 'E',
    name: 'Juge E',
    email: 'juge.e@titaniumopen.com',
    password: '#Juge@E',
    status: 'active'
  },
  {
    role: 'judge',
    sector: 'F',
    name: 'Juge F',
    email: 'juge.f@titaniumopen.com',
    password: '#Juge@F',
    status: 'active'
  }
];

interface Judge {
  id: string;
  uid: string;
  name: string;
  sector: string | null;
  username: string;
  email: string;
  role: 'admin' | 'judge';
  status: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

export default function AdminJuges() {
  const { judges: firestoreJudges } = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [judges, setJudges] = useState<Judge[]>([]);
  
  // Editor state
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    email: '',
    password: '',
    role: 'judge' as 'admin' | 'judge'
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  const sectors = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Load judges from Firebase
  useEffect(() => {
    const loadJudges = async () => {
      setIsLoading(true);
      try {
        // Load from Firestore real-time subscription instead
        // The useFirestore hook will handle this automatically
      } catch (error) {
        console.error('Error loading judges:', error);
      }
      setIsLoading(false);
    };

    // Don't load manually, let Firestore subscription handle it
    setIsLoading(false);
  }, []);

  // Also sync with Firestore real-time updates
  useEffect(() => {
    // Always sync with Firestore, even if empty
    const convertedJudges = firestoreJudges.map(judge => ({
      id: judge.uid,
      uid: judge.uid,
      name: judge.name,
      sector: judge.sector,
      username: judge.username,
      email: judge.email,
      role: judge.role,
      status: judge.status,
      createdAt: judge.createdAt,
      updatedAt: judge.updatedAt
    }));
    setJudges(convertedJudges);
    setIsLoading(false);
  }, [firestoreJudges]);
  
  // Initialize default judges if Firebase Auth is empty
  const initializeDefaultJudges = async () => {
    setIsInitializing(true);
    
    try {
      let created = 0;
      let skipped = 0;
      let errors = 0;
      
      for (const judge of defaultJudges) {
        const result = await FirebaseAuthAdmin.createJudge(judge);
        if (result.success) {
          created++;
        } else {
          // Check if it's an "already exists" error
          if (result.error?.includes('email-already-in-use') || 
              result.error?.includes('Cette adresse email est déjà utilisée')) {
            console.warn(`${judge.name} already exists, skipping...`);
            skipped++;
          } else {
            console.error(`Error creating ${judge.name}:`, result.error);
            errors++;
          }
        }
      }
      
      // Reload judges list
      // The Firestore subscription will automatically update the list
      let message = `✅ ${created} juges créés avec succès`;
      if (skipped > 0) {
        message += `\n⚠️ ${skipped} juges déjà existants (ignorés)`;
      }
      if (errors > 0) {
        message += `\n❌ ${errors} erreurs`;
      }
      alert(message);
    } catch (error) {
      console.error('Error initializing judges:', error);
      alert('Erreur lors de l\'initialisation des juges');
    }
    
    setIsInitializing(false);
  };

  // Filter judges
  const filteredJudges = useMemo(() => {
    let filtered = judges;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(judge => 
        judge.name.toLowerCase().includes(query) ||
        judge.email.toLowerCase().includes(query) ||
        judge.username.toLowerCase().includes(query)
      );
    }
    
    if (sectorFilter !== 'all') {
      if (sectorFilter === 'unassigned') {
        filtered = filtered.filter(judge => !judge.sector);
      } else if (sectorFilter === 'admin') {
        filtered = filtered.filter(judge => judge.role === 'admin');
      } else {
        filtered = filtered.filter(judge => judge.sector === sectorFilter);
      }
    }
    
    return filtered;
  }, [judges, searchQuery, sectorFilter]);

  // Get selected judge
  const selectedJudge = selectedJudgeId 
    ? judges.find(j => j.id === selectedJudgeId)
    : null;

  // Get available sectors for form
  const availableSectors = useMemo(() => {
    const assignedSectors = judges
      .filter(j => j.sector && j.role === 'judge' && j.id !== selectedJudgeId)
      .map(j => j.sector);
    
    return sectors.filter(sector => !assignedSectors.includes(sector));
  }, [judges, selectedJudgeId]);

  const handleRowSelect = (judgeId: string) => {
    setSelectedJudgeId(judgeId);
    setIsEditorCollapsed(false);
    
    const judge = judges.find(j => j.id === judgeId);
    if (judge) {
      setIsEditing(true);
      setFormData({
        name: judge.name,
        sector: judge.sector || '',
        email: judge.email,
        password: '', // Don't pre-fill password for security
        role: judge.role
      });
    }
    setErrors({});
    setShowPassword(false);
  };

  const handleAddNew = () => {
    setSelectedJudgeId(null);
    setIsEditing(false);
    setFormData({
      name: '',
      sector: availableSectors[0] || '',
      email: '',
      password: '',
      role: 'judge'
    });
    setErrors({});
    setShowPassword(false);
    setIsEditorCollapsed(false);
  };

  const validateForm = async () => {
    const newErrors = FirebaseAuthAdmin.validateJudgeData({
      ...formData,
      status: 'active'
    }, isEditing, selectedJudgeId || undefined);

    // Check email availability for new judges or email changes
    if (formData.email && (!isEditing || (selectedJudge && selectedJudge.email !== formData.email))) {
      const isAvailable = await FirebaseAuthAdmin.isEmailAvailable(formData.email, selectedJudgeId || undefined);
      if (!isAvailable) {
        newErrors.email = 'Cette adresse email est déjà utilisée';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    setIsSaving(true);

    try {
      if (isEditing && selectedJudge) {
        // Update existing judge
        const result = await FirebaseAuthAdmin.updateJudge(selectedJudge.uid, {
          name: formData.name,
          sector: formData.sector || null,
          email: formData.email,
          role: formData.role,
          status: 'active'
        });

        if (result.success) {
          // Update local state
          setJudges(prev => prev.map(j => 
            j.id === selectedJudge.id 
              ? { 
                  ...j, 
                  name: formData.name,
                  sector: formData.sector || null,
                  email: formData.email,
                  username: formData.email.split('@')[0],
                  role: formData.role
                }
              : j
          ));
          
          alert(result.message);
        } else {
          alert(`Erreur: ${result.error}`);
        }
      } else {
        // Create new judge
        const result = await FirebaseAuthAdmin.createJudge({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          sector: formData.sector || null,
          role: formData.role,
          status: 'active'
        });

        if (result.success) {
          // Reload judges list
          const judgesResult = await FirebaseAuthAdmin.getAllJudges();
          if (judgesResult.success) {
            setJudges(judgesResult.judges);
          }
          
          alert(result.message);
        } else {
          alert(`Erreur: ${result.error}`);
        }
      }

      // Reset form
      setSelectedJudgeId(null);
      setIsEditing(false);
      setFormData({
        name: '',
        sector: '',
        email: '',
        password: '',
        role: 'judge'
      });
      setErrors({});
    } catch (error) {
      console.error('Error saving judge:', error);
      alert('Erreur lors de la sauvegarde');
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedJudge) return;

    setIsSaving(true);

    try {
      const result = await FirebaseAuthAdmin.deleteJudge(
        selectedJudge.uid, 
        selectedJudge.email, 
        '' // Password not needed for Firestore deletion
      );

      if (result.success) {
        // Update local state
        setJudges(prev => prev.filter(j => j.id !== selectedJudge.id));
        alert(result.message);
      } else {
        alert(`Erreur: ${result.error}`);
      }

      setSelectedJudgeId(null);
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setFormData({
        name: '',
        sector: '',
        email: '',
        password: '',
        role: 'judge'
      });
    } catch (error) {
      console.error('Error deleting judge:', error);
      alert('Erreur lors de la suppression');
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    setSelectedJudgeId(null);
    setIsEditing(false);
    setFormData({
      name: '',
      sector: '',
      email: '',
      password: '',
      role: 'judge'
    });
    setErrors({});
    setShowDeleteConfirm(false);
    setShowPassword(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-ocean-600" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des juges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Juges</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gestion des juges synchronisée avec Firebase Auth
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-600">Sync Firebase Auth</span>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={initializeDefaultJudges}
              disabled={isInitializing}
              className="flex items-center space-x-1"
            >
              {isInitializing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              <span>Initialiser les 7 juges</span>
            </Button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom ou email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">Tous</option>
              <option value="admin">Administrateurs</option>
              <option value="unassigned">Non affecté</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>Secteur {sector}</option>
              ))}
            </select>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddNew}
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter un juge
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Table */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="sticky left-0 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nom et Prénom
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Secteur
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dernière MAJ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredJudges.map(judge => {
                  const isSelected = selectedJudgeId === judge.id;
                  
                  return (
                    <tr 
                      key={judge.id}
                      className={`${isSelected ? 'ring-2 ring-ocean-500 bg-ocean-50 dark:bg-ocean-900/20' : ''} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                      onClick={() => handleRowSelect(judge.id)}
                    >
                      <td className="sticky left-0 bg-white dark:bg-gray-900 px-4 py-4 border-r border-gray-200 dark:border-gray-700">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-ocean-600 hover:bg-ocean-100 dark:hover:bg-ocean-900/20">
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            judge.role === 'admin' ? 'bg-red-600' : 'bg-ocean-600'
                          }`}>
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {judge.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-sm text-gray-900 dark:text-white">
                            {judge.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge className={judge.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                          {judge.role === 'admin' ? 'Administrateur' : 'Juge'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {judge.sector ? (
                          <Badge className={`bg-sectors-${judge.sector} text-white`}>
                            Secteur {judge.sector}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            {judge.role === 'admin' ? 'Global' : 'Non affecté'}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {judge.updatedAt ? (
                          <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                            {formatTime(judge.updatedAt.toDate())}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge 
                          variant="secondary" 
                          className={judge.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {judge.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel - Editor */}
        <div className={`bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          isEditorCollapsed ? 'w-12' : 'w-96'
        }`}>
          {isEditorCollapsed ? (
            <div className="p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditorCollapsed(false)}
                className="w-full"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {isEditing ? 'Modifier Juge' : 'Nouveau Juge'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditorCollapsed(true)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-6">
                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rôle *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        role: e.target.value as 'admin' | 'judge',
                        sector: e.target.value === 'admin' ? '' : prev.sector
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="judge">Juge</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom et Prénom *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Nom et prénom du juge"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom d'utilisateur (Email) *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="email@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Utilisé comme nom d'utilisateur pour la connexion
                    </p>
                  </div>

                  {/* Sector (only for judges) */}
                  {formData.role === 'judge' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Secteur
                      </label>
                      <select
                        value={formData.sector}
                        onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="">Non affecté</option>
                        {(isEditing ? sectors : availableSectors).map(sector => (
                          <option key={sector} value={sector}>Secteur {sector}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mot de passe {!isEditing && '*'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder={isEditing ? "Laisser vide pour ne pas changer" : "Minimum 6 caractères"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {isEditing ? 'Laisser vide pour conserver le mot de passe actuel' : 'Sera utilisé pour Firebase Auth'}
                    </p>
                  </div>

                  {/* Firebase Auth Info */}
                  {isEditing && selectedJudge && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Key className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Firebase Auth UID
                        </span>
                      </div>
                      <p className="text-xs font-mono text-blue-700 dark:text-blue-300">
                        {selectedJudge.uid}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      className="w-full"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {isEditing ? 'Mettre à jour' : 'Créer dans Firebase Auth'}
                    </Button>
                    
                    {isEditing && (
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full"
                        disabled={isSaving}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      onClick={handleCancel}
                      className="w-full"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Confirmer la suppression</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Êtes-vous sûr de vouloir supprimer <strong>{selectedJudge?.name}</strong> ?
                </p>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Note:</strong> Le compte sera supprimé de Firestore. 
                    La suppression complète de Firebase Auth nécessite l'Admin SDK côté serveur.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="flex-1"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Confirmer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
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
