'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { 
  Save, 
  Check, 
  Fish, 
  Scale, 
  Users, 
  Wifi, 
  WifiOff, 
  Loader2, 
  X, 
  RefreshCw, 
  MapPin, 
  Info,
  Edit,
  Lock,
  CloudOff,
  AlertTriangle,
  Search,
  Filter,
  SkipForward,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  Download
} from 'lucide-react';
import { formatWeight, formatNumber, formatTime } from '@/lib/utils';
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface Competitor {
  id: string;
  boxNumber: number;
  boxCode: string;
  name: string;
  equipe: string;
  sector: string;
}

interface HourlyEntry {
  competitorId: string;
  boxNumber: number;
  fishCount: number;
  totalWeight: number;
  status: 'empty' | 'in_progress' | 'locked_judge' | 'locked_admin' | 'offline_judge' | 'offline_admin' | 'error';
  timestamp?: Date;
  source: 'Judge' | 'Admin';
  syncRetries?: number;
  errorMessage?: string;
}

interface HourStatus {
  hour: number;
  entries: { [competitorId: string]: HourlyEntry };
  completedCount: number;
}

export default function AdminPrises() {
  const searchParams = useSearchParams();
  const { currentUser } = useCurrentUser();
  const { 
    competitors: firestoreCompetitors, 
    hourlyEntries: firestoreHourlyEntries, 
    saveHourlyEntry 
  } = useFirestore();
  
  const sectors = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  const [activeSector, setActiveSector] = useState(searchParams.get('sector') || 'A');
  const [currentHour, setCurrentHour] = useState(parseInt(searchParams.get('hour') || '1'));
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isOnlineSimulation, setIsOnlineSimulation] = useState(true);
  
  // Convert Firebase competitors to local format
  const competitorsBySector = useMemo(() => {
    const grouped: { [sector: string]: Competitor[] } = {};
    firestoreCompetitors.forEach(comp => {
      if (!grouped[comp.sector]) {
        grouped[comp.sector] = [];
      }
      grouped[comp.sector].push({
        id: comp.id,
        boxNumber: comp.boxNumber,
        boxCode: comp.boxCode,
        name: comp.fullName,
        equipe: comp.equipe,
        sector: comp.sector
      });
    });
    return grouped;
  }, [firestoreCompetitors]);

  // Convert Firebase hourly entries to local format
  const hourStatuses = useMemo(() => {
    const statuses: { [sector: string]: { [hour: number]: HourStatus } } = {};
    
    sectors.forEach(sector => {
      statuses[sector] = {};
      for (let h = 1; h <= 7; h++) {
        const entries: { [competitorId: string]: HourlyEntry } = {};
        
        // Get entries for this sector and hour
        const sectorHourEntries = firestoreHourlyEntries.filter(entry => 
          entry.sector === sector && entry.hour === h
        );
        
        sectorHourEntries.forEach(entry => {
          entries[entry.competitorId] = {
            competitorId: entry.competitorId,
            boxNumber: entry.boxNumber,
            fishCount: entry.fishCount,
            totalWeight: entry.totalWeight,
            status: entry.status,
            timestamp: entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(),
            source: entry.source,
            syncRetries: 0
          };
        });
        
        statuses[sector][h] = {
          hour: h,
          entries,
          completedCount: Object.values(entries).filter(e => 
            ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(e.status)
          ).length
        };
      }
    });
    
    return statuses;
  }, [firestoreHourlyEntries]);

  // Editor state
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null);
  const [fishCount, setFishCount] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const currentCompetitors = competitorsBySector[activeSector] || [];
  
  // Get current hour status
  const currentHourStatus = useMemo(() => {
    return hourStatuses[activeSector]?.[currentHour] || {
      hour: currentHour,
      entries: {},
      completedCount: 0
    };
  }, [hourStatuses, activeSector, currentHour]);

  // Get selected competitor and entry
  const selectedCompetitor = selectedCompetitorId 
    ? currentCompetitors.find(c => c.id === selectedCompetitorId)
    : null;
  
  const selectedEntry = selectedCompetitorId 
    ? currentHourStatus.entries[selectedCompetitorId]
    : null;

  // Filter competitors
  const filteredCompetitors = useMemo(() => {
    let filtered = currentCompetitors;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comp => 
        comp.name.toLowerCase().includes(query) ||
        comp.equipe.toLowerCase().includes(query) ||
        comp.boxCode.toLowerCase().includes(query)
      );
    }
    
    if (showIncompleteOnly) {
      filtered = filtered.filter(comp => {
        const entry = currentHourStatus.entries[comp.id];
        return !entry || !['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(comp => {
        const entry = currentHourStatus.entries[comp.id];
        return entry?.status === statusFilter || (!entry && statusFilter === 'empty');
      });
    }
    
    return filtered;
  }, [currentCompetitors, searchQuery, showIncompleteOnly, statusFilter, currentHourStatus.entries]);

  // Set initial online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    setIsOnlineSimulation(navigator.onLine);
  }, []);

  // Auto-set weight to 0 when fish count is 0
  useEffect(() => {
    if (fishCount === '0') {
      setTotalWeight('0');
    }
  }, [fishCount]);

  // Load entry data when competitor is selected
  useEffect(() => {
    if (selectedCompetitorId) {
      const entry = currentHourStatus.entries[selectedCompetitorId];
      if (entry && entry.status !== 'empty') {
        setFishCount(entry.fishCount.toString());
        setTotalWeight(entry.totalWeight.toString());
      } else {
        setFishCount('');
        setTotalWeight('');
      }
      setErrors({});
    }
  }, [selectedCompetitorId, currentHourStatus.entries]);

  const getSectorColor = (sector: string) => {
    const colors: { [key: string]: string } = {
      A: 'bg-sectors-A text-white',
      B: 'bg-sectors-B text-white',
      C: 'bg-sectors-C text-white',
      D: 'bg-sectors-D text-white',
      E: 'bg-sectors-E text-white',
      F: 'bg-sectors-F text-white',
    };
    return colors[sector] || 'bg-gray-500 text-white';
  };

  const getEntryStatus = (competitorId: string): HourlyEntry['status'] => {
    const entry = currentHourStatus.entries[competitorId];
    return entry?.status || 'empty';
  };

  const getActionIcon = (status: HourlyEntry['status']) => {
    switch (status) {
      case 'locked_judge':
        return { icon: Lock, tooltip: 'Verrouillé par Juge', color: 'text-green-600' };
      case 'locked_admin':
        return { icon: Lock, tooltip: 'Verrouillé par Admin', color: 'text-orange-600' };
      case 'offline_judge':
      case 'offline_admin':
        return { icon: CloudOff, tooltip: 'Hors ligne', color: 'text-amber-600' };
      case 'error':
        return { icon: AlertTriangle, tooltip: 'Erreur', color: 'text-red-600' };
      case 'in_progress':
        return { icon: Edit, tooltip: 'En cours', color: 'text-blue-600' };
      default:
        return { icon: Edit, tooltip: 'Saisir les données', color: 'text-gray-600' };
    }
  };

  const getRowStyling = (status: HourlyEntry['status']) => {
    switch (status) {
      case 'locked_judge':
        return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500';
      case 'locked_admin':
        return 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500';
      case 'offline_judge':
      case 'offline_admin':
        return 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500';
      case 'in_progress':
        return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500';
      default:
        return 'hover:bg-gray-50 dark:hover:bg-gray-800';
    }
  };

  const getStatusBadge = (status: HourlyEntry['status']) => {
    switch (status) {
      case 'locked_judge':
        return <Badge className="bg-green-100 text-green-800">Verrouillé (Juge)</Badge>;
      case 'locked_admin':
        return <Badge className="bg-orange-100 text-orange-800">Verrouillé (Admin)</Badge>;
      case 'offline_judge':
        return <Badge className="bg-amber-100 text-amber-800">Hors ligne (Juge)</Badge>;
      case 'offline_admin':
        return <Badge className="bg-amber-100 text-amber-800">Hors ligne (Admin)</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erreur</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      default:
        return <Badge variant="outline">Vide</Badge>;
    }
  };

  const handleRowSelect = (competitorId: string) => {
    setSelectedCompetitorId(competitorId);
    setIsEditorCollapsed(false);
  };

  const validateEntry = () => {
    const newErrors: { [key: string]: string } = {};

    if (!fishCount.trim()) {
      newErrors.fishCount = 'Nombre de prises requis';
    } else if (parseInt(fishCount) < 0) {
      newErrors.fishCount = 'Le nombre de prises doit être ≥ 0';
    }

    if (!totalWeight.trim()) {
      newErrors.totalWeight = 'Poids total requis';
    } else if (parseInt(totalWeight) < 0) {
      newErrors.totalWeight = 'Le poids total doit être ≥ 0';
    }

    if (parseInt(fishCount) === 0 && parseInt(totalWeight) !== 0) {
      newErrors.totalWeight = 'Le poids total doit être 0 quand le nombre de prises est 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEntry = async (saveAndNext = false) => {
    if (!validateEntry() || !selectedCompetitor) return;

    setIsSaving(true);

    const entryData = {
      id: `${activeSector}-${currentHour}-${selectedCompetitor.id}`,
      sector: activeSector,
      hour: currentHour,
      competitorId: selectedCompetitor.id,
      boxNumber: selectedCompetitor.boxNumber,
      fishCount: parseInt(fishCount),
      totalWeight: parseInt(totalWeight),
      status: isOnlineSimulation ? 'locked_admin' : 'offline_admin',
      source: 'Admin',
      updatedBy: currentUser?.username || 'admin'
    };

    try {
      await saveHourlyEntry(entryData);
      console.log('Data saved to Firebase successfully');
    } catch (error) {
      console.error('Error saving to Firebase:', error instanceof Error ? error.message : error);
    }

    // Simulate save
    setTimeout(() => {
      setIsSaving(false);
      setFishCount('');
      setTotalWeight('');
      setErrors({});
      
      if (saveAndNext) {
        // Find next incomplete competitor
        const nextCompetitor = currentCompetitors.find(comp => 
          !currentHourStatus.entries[comp.id] || 
          !['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(currentHourStatus.entries[comp.id].status)
        );
        
        if (nextCompetitor) {
          setSelectedCompetitorId(nextCompetitor.id);
        } else {
          setSelectedCompetitorId(null);
        }
      }
    }, 800);
  };

  const handleExportCSV = () => {
    const headers = ['Box N°', 'Compétiteur', 'Club', 'Nb de prises', 'Poids total (g)', 'Heure', 'Source', 'Statut'];
    const rows = filteredCompetitors.map(comp => {
      const entry = currentHourStatus.entries[comp.id];
      return [
        comp.boxCode,
        comp.name,
        comp.equipe,
        entry?.fishCount || 0,
        entry?.totalWeight || 0,
        entry?.timestamp ? formatTime(entry.timestamp) : '',
        entry?.source || '',
        entry?.status || 'Vide'
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prises-${activeSector}-H${currentHour}.csv`;
    a.click();
  };

  // Calculate progress for current hour
  const completedEntries = Object.values(currentHourStatus.entries).filter(e => 
    ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(e.status)
  ).length;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prises</h1>
            <p className="text-gray-600 dark:text-gray-300">Gestion des données de prises par secteur et heure</p>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>
        </div>
      </div>

      {/* Sector Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex space-x-1">
          {sectors.map(sector => (
            <Button
              key={sector}
              variant={activeSector === sector ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveSector(sector)}
              className={activeSector === sector ? getSectorColor(sector) : ''}
            >
              Secteur {sector}
            </Button>
          ))}
        </div>
      </div>

      {/* Hour Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5, 6, 7].map(hour => {
              const hourStatus = hourStatuses[activeSector]?.[hour];
              const completed = Object.values(hourStatus?.entries || {}).filter(e => 
                ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(e.status)
              ).length;
              const isComplete = completed === 20;
              
              return (
                <Button
                  key={hour}
                  variant={currentHour === hour ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentHour(hour)}
                  className="flex items-center px-4 py-2 min-w-[60px]"
                >
                  <span className="font-semibold mr-2">H{hour}</span>
                  {isComplete && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </Button>
              );
            })}
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedEntries / 20) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {isOnlineSimulation ? 'En ligne' : 'Hors ligne'}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{completedEntries}/{currentCompetitors.length}</span>
            </div>
            <button
              onClick={() => setIsOnlineSimulation(!isOnlineSimulation)}
              className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {isOnlineSimulation ? 'Simuler hors ligne' : 'Simuler en ligne'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom ou box..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <Button
              variant={showIncompleteOnly ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
            >
              <Filter className="w-4 h-4 mr-1" />
              Incomplets seulement
            </Button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="empty">Vide</option>
              <option value="locked_judge">Verrouillé (Juge)</option>
              <option value="locked_admin">Verrouillé (Admin)</option>
              <option value="offline_judge">Hors ligne (Juge)</option>
              <option value="offline_admin">Hors ligne (Admin)</option>
              <option value="error">Erreur</option>
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
          >
            <Download className="w-4 h-4 mr-1" />
            Exporter CSV
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
                  <th className="sticky left-16 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                    BOX N°
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nom et Prénom
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Équipe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nb de prises
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Poids total (g)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Heure
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCompetitors.map(competitor => {
                  const entry = currentHourStatus.entries[competitor.id];
                  const status = getEntryStatus(competitor.id);
                  const actionIcon = getActionIcon(status);
                  const isSelected = selectedCompetitorId === competitor.id;
                  const isLocked = ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(status);
                  
                  return (
                    <tr 
                      key={competitor.id}
                      className={`${getRowStyling(status)} ${isSelected ? 'ring-2 ring-ocean-500' : ''} cursor-pointer`}
                      onClick={() => handleRowSelect(competitor.id)}
                    >
                      <td className={`sticky left-0 ${getRowStyling(status)} px-4 py-4 border-r border-gray-200 dark:border-gray-700`}>
                        <button className={`w-8 h-8 rounded-lg flex items-center justify-center ${actionIcon.color}`}>
                          <actionIcon.icon className="w-4 h-4" />
                        </button>
                      </td>
                      {/* Box Number - Sticky */}
                      <td className={`sticky left-16 ${isLocked ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-900'} px-4 py-4 border-r border-gray-200 dark:border-gray-700`}>
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">
                          {competitor.boxCode}
                        </span>
                      </td>
                      
                      {/* Competitor */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {competitor.name}
                        </span>
                      </td>
                      {/* Équipe */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-gray-900 dark:text-white">{competitor.equipe}</span>
                      </td>
                      
                      {/* Fish Count */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {entry ? <span className="font-semibold text-gray-900 dark:text-white">{entry.fishCount}</span> : <span className="text-gray-400 dark:text-gray-500">-</span>}
                      </td>
                      
                      {/* Total Weight */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {entry ? <span className="font-semibold text-gray-900 dark:text-white">{formatWeight(entry.totalWeight)}</span> : <span className="text-gray-400 dark:text-gray-500">-</span>}
                      </td>
                      
                      {/* Timestamp */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {entry?.timestamp ? (
                          <span className="font-mono text-sm text-gray-600 dark:text-gray-300">{formatTime(entry.timestamp)}</span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      
                      {/* Source */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {entry?.source ? (
                          <Badge variant="outline" className="text-xs">{entry.source}</Badge>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(status)}
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
                    Éditeur - {activeSector}H{currentHour}
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
                {selectedCompetitor ? (
                  <div className="space-y-6">
                    {/* Competitor Identity */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">BOX N°:</span>
                          <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedCompetitor.boxCode}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Compétiteur:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedCompetitor.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Équipe:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedCompetitor.equipe}</span>
                        </div>
                        {selectedEntry && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Source:</span>
                              <Badge variant="outline" className="text-xs">{selectedEntry.source}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Dernière MAJ:</span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedEntry.timestamp ? formatTime(selectedEntry.timestamp) : '-'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Data Entry Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Fish className="w-4 h-4 inline mr-1" />
                          Nb de prises *
                        </label>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFishCount(Math.max(0, parseInt(fishCount) - 1 || 0).toString())}
                            disabled={parseInt(fishCount) <= 0}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <input
                            type="number"
                            min="0"
                            value={fishCount}
                            onChange={(e) => setFishCount(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center"
                            placeholder="0"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFishCount((parseInt(fishCount) + 1 || 1).toString())}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {errors.fishCount && (
                          <p className="text-red-500 text-xs mt-1">{errors.fishCount}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Scale className="w-4 h-4 inline mr-1" />
                          Poids total (g) *
                        </label>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTotalWeight(Math.max(0, parseInt(totalWeight) - 1 || 0).toString())}
                            disabled={parseInt(totalWeight) <= 0 || parseInt(fishCount) === 0}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <input
                            type="number"
                            min="0"
                            value={totalWeight}
                            onChange={(e) => setTotalWeight(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center"
                            placeholder="0"
                            disabled={parseInt(fishCount) === 0}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTotalWeight((parseInt(totalWeight) + 1 || 1).toString())}
                            disabled={parseInt(fishCount) === 0}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {errors.totalWeight && (
                          <p className="text-red-500 text-xs mt-1">{errors.totalWeight}</p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        variant="primary"
                        onClick={() => handleSaveEntry(false)}
                        className="w-full"
                        disabled={!fishCount.trim() || !totalWeight.trim() || isSaving || Object.keys(errors).length > 0}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {selectedEntry ? 'Mettre à jour' : 'Sauvegarder'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleSaveEntry(true)}
                        className="w-full"
                        disabled={!fishCount.trim() || !totalWeight.trim() || isSaving || Object.keys(errors).length > 0}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {selectedEntry ? 'Mettre à jour & Suivant' : 'Sauvegarder & Suivant'}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedCompetitorId(null);
                          setFishCount('');
                          setTotalWeight('');
                          setErrors({});
                        }}
                        className="w-full"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <Edit className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Sélectionnez une ligne pour commencer</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}