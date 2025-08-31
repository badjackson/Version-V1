'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';
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
  ChevronLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatWeight, formatNumber, formatTime } from '@/lib/utils';

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

export default function HourlyDataEntry() {
  const t = useTranslations('judge');
  const { currentUser } = useCurrentUser();
  const { 
    competitors: firestoreCompetitors, 
    hourlyEntries: firestoreHourlyEntries,
    auditLog,
    saveHourlyEntry 
  } = useFirestore();
  
  const [currentHour, setCurrentHour] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isOnlineSimulation, setIsOnlineSimulation] = useState(true);

  // Editor state
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null);
  const [fishCount, setFishCount] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Get judge's assigned sector
  const judgeSector = currentUser?.sector || 'A';

  // Get competitors for judge's sector from Firebase
  const mockCompetitors = useMemo(() => {
    return firestoreCompetitors
      .filter(comp => comp.sector === judgeSector)
      .map(comp => ({
        id: comp.id,
        boxNumber: comp.boxNumber,
        boxCode: comp.boxCode,
        name: comp.fullName,
        equipe: comp.equipe,
        sector: comp.sector
      }));
  }, [firestoreCompetitors, judgeSector]);

  // Get entries for current hour and sector from Firebase
  const entries = useMemo(() => {
    const hourEntries: { [competitorId: string]: HourlyEntry } = {};
    
    firestoreHourlyEntries
      .filter(entry => entry.sector === judgeSector && entry.hour === currentHour)
      .forEach(entry => {
        hourEntries[entry.competitorId] = {
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
    
    return hourEntries;
  }, [firestoreHourlyEntries, judgeSector, currentHour]);

  // Set initial online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    setIsOnlineSimulation(navigator.onLine);
  }, []);

  // Filter competitors based on search and incomplete filter
  const filteredCompetitors = useMemo(() => {
    let filtered = mockCompetitors;
    
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
        const entry = entries[comp.id];
        return !entry || !['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status);
      });
    }
    
    return filtered;
  }, [mockCompetitors, searchQuery, showIncompleteOnly, entries]);

  // Get selected competitor and entry
  const selectedCompetitor = selectedCompetitorId 
    ? mockCompetitors.find(c => c.id === selectedCompetitorId)
    : null;
  
  const selectedEntry = selectedCompetitorId 
    ? entries[selectedCompetitorId]
    : null;

  // Auto-set weight to 0 when fish count is 0
  useEffect(() => {
    if (fishCount === '0') {
      setTotalWeight('0');
    }
  }, [fishCount]);

  // Load entry data when competitor is selected
  useEffect(() => {
    if (selectedCompetitorId) {
      const entry = entries[selectedCompetitorId];
      if (entry && entry.status !== 'empty') {
        setFishCount(entry.fishCount.toString());
        setTotalWeight(entry.totalWeight.toString());
      } else {
        setFishCount('');
        setTotalWeight('');
      }
      setErrors({});
    }
  }, [selectedCompetitorId, entries]);

  // Get entry status for competitor
  const getEntryStatus = (competitorId: string): HourlyEntry['status'] => {
    const entry = entries[competitorId];
    return entry?.status || 'empty';
  };

  // Get action icon and tooltip
  const getActionIcon = (status: HourlyEntry['status']) => {
    switch (status) {
      case 'locked_judge':
        return { icon: Lock, tooltip: 'Verrouillé (Juge) - lecture seule', color: 'text-green-600' };
      case 'locked_admin':
        return { icon: Lock, tooltip: 'Verrouillé (Admin) - lecture seule', color: 'text-orange-600' };
      case 'offline_judge':
      case 'offline_admin':
        return { icon: CloudOff, tooltip: 'Hors ligne (en attente)', color: 'text-amber-600' };
      case 'error':
        return { icon: AlertTriangle, tooltip: 'Corriger et sauvegarder', color: 'text-red-600' };
      case 'in_progress':
        return { icon: Edit, tooltip: 'Continuer', color: 'text-blue-600' };
      default:
        return { icon: Edit, tooltip: 'Saisir les données', color: 'text-gray-600' };
    }
  };

  // Get row styling based on status
  const getRowStyling = (status: HourlyEntry['status']) => {
    switch (status) {
      case 'locked_judge':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'locked_admin':
        return 'bg-orange-50 dark:bg-orange-900/20';
      case 'offline_judge':
      case 'offline_admin':
        return 'bg-amber-50 dark:bg-amber-900/20';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'in_progress':
        return 'bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'hover:bg-gray-50 dark:hover:bg-gray-800';
    }
  };

  // Get border styling based on status
  const getBorderStyling = (status: HourlyEntry['status']) => {
    switch (status) {
      case 'locked_judge':
        return 'border-l-4 border-green-500';
      case 'locked_admin':
        return 'border-l-4 border-orange-500';
      case 'offline_judge':
      case 'offline_admin':
        return 'border-l-4 border-amber-500';
      case 'error':
        return 'border-l-4 border-red-500';
      case 'in_progress':
        return 'border-l-4 border-blue-500';
      default:
        return '';
    }
  };

  // Get status badge
  const getStatusBadge = (status: HourlyEntry['status']) => {
    switch (status) {
      case 'locked_judge':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Verrouillé (Juge)</Badge>;
      case 'locked_admin':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">Verrouillé (Admin)</Badge>;
      case 'offline_judge':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">Hors ligne (Juge)</Badge>;
      case 'offline_admin':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">Hors ligne (Admin)</Badge>;
      case 'error':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">Erreur</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">En cours</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">Vide</Badge>;
    }
  };

  // Handle row selection
  const handleRowSelect = (competitorId: string) => {
    const entry = entries[competitorId];
    // Don't allow selection of locked entries
    if (entry && ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status)) {
      return;
    }
    setSelectedCompetitorId(competitorId);
    setIsEditorCollapsed(false);
  };

  // Find next missing entry
  const findNextMissing = () => {
    // Sort competitors by box number to ensure proper order
    const sortedCompetitors = [...mockCompetitors].sort((a, b) => a.boxNumber - b.boxNumber);
    const nextMissing = sortedCompetitors.find(comp => {
      const entry = entries[comp.id];
      return !entry || !['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status);
    });
    
    if (nextMissing) {
      setSelectedCompetitorId(nextMissing.id);
      setIsEditorCollapsed(false);
    }
  };

  // Validation
  const validateEntry = () => {
    const newErrors: { [key: string]: string } = {};

    if (!fishCount.trim()) {
      newErrors.fishCount = t('fishCountRequired');
    } else if (parseInt(fishCount) < 0) {
      newErrors.fishCount = t('fishCountMustBePositive');
    }

    if (!totalWeight.trim()) {
      newErrors.totalWeight = t('totalWeightRequired');
    } else if (parseInt(totalWeight) < 0) {
      newErrors.totalWeight = t('totalWeightMustBePositive');
    }

    if (parseInt(fishCount) === 0 && parseInt(totalWeight) !== 0) {
      newErrors.totalWeight = t('weightMustBeZeroWhenNoFish');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save entry
  const handleSaveEntry = async (saveAndNext = false) => {
    if (!validateEntry() || !selectedCompetitor) return;

    setIsSaving(true);

    const entryData = {
      id: `${judgeSector}-${currentHour}-${selectedCompetitor.id}`,
      sector: judgeSector,
      hour: currentHour,
      competitorId: selectedCompetitor.id,
      boxNumber: selectedCompetitor.boxNumber,
      fishCount: parseInt(fishCount),
      totalWeight: parseInt(totalWeight),
      status: isOnlineSimulation ? 'locked_judge' : 'offline_judge',
      source: 'Judge',
      updatedBy: currentUser?.username || 'judge'
    };

    try {
      await saveHourlyEntry(entryData);
    } catch (error) {
      console.error('Error saving to Firebase:', error);
    }

    setTimeout(() => {
      setIsSaving(false);
      
      if (saveAndNext) {
        // Find next incomplete competitor by box order
        const sortedCompetitors = [...mockCompetitors].sort((a, b) => a.boxNumber - b.boxNumber);
        const nextCompetitor = sortedCompetitors.find(comp => {
          const compEntry = entries[comp.id];
          return !compEntry || !['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(compEntry.status);
        });
        
        // Clear form first
        setFishCount('');
        setTotalWeight('');
        setErrors({});
        
        if (nextCompetitor) {
          // Move to next incomplete competitor
          setSelectedCompetitorId(nextCompetitor.id);
          
          // Scroll to and highlight the row
          setTimeout(() => {
            const rowElement = document.querySelector(`[data-competitor-id="${nextCompetitor.id}"]`);
            if (rowElement) {
              rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              rowElement.classList.add('ring-2', 'ring-blue-500');
              setTimeout(() => {
                rowElement.classList.remove('ring-2', 'ring-blue-500');
              }, 1000);
            }
          }, 100);
          
          // Focus the fish count input
          setTimeout(() => {
            const fishCountInput = document.querySelector('#fishCountInput') as HTMLInputElement;
            if (fishCountInput) {
              fishCountInput.focus();
            }
          }, 200);
        } else {
          // All entries complete
          setSelectedCompetitorId(null);
          
          // Show success banner
          const banner = document.createElement('div');
          banner.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg text-sm z-50 shadow-lg';
          banner.textContent = `H${currentHour} terminée (${mockCompetitors.length}/${mockCompetitors.length})`;
          document.body.appendChild(banner);
          
          setTimeout(() => {
            if (document.body.contains(banner)) {
              document.body.removeChild(banner);
            }
          }, 3000);
        }
      } else {
        // Regular save - just clear form but keep same competitor selected
        setFishCount('');
        setTotalWeight('');
        setErrors({});
        
        // Focus the fish count input
        setTimeout(() => {
          const fishCountInput = document.querySelector('#fishCountInput') as HTMLInputElement;
          if (fishCountInput) {
            fishCountInput.focus();
          }
        }, 100);
      }
    }, 800);
  };

  // Check if there are any incomplete competitors
  const hasIncompleteCompetitors = useMemo(() => {
    return mockCompetitors.some(comp => {
      const entry = entries[comp.id];
      return !entry || !['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status);
    });
  }, [mockCompetitors, entries]);

  // Check if entry is already saved/locked
  const isEntryLocked = selectedEntry && ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(selectedEntry.status);

  // Calculate completion stats
  const completedEntries = mockCompetitors.filter(comp => {
    const entry = entries[comp.id];
    return entry && ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status);
  }).length;

  const totalCompetitors = mockCompetitors.length;

  return (
    <div className="h-screen flex flex-col">
      {/* Connection Status Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isOnlineSimulation ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                <span className="text-gray-900 dark:text-white">
                  {isOnlineSimulation ? t('online') : t('offline')}
                </span>
              </span>
              {syncQueue > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {syncQueue} {t('syncQueue')}
                </Badge>
              )}
              <button
                onClick={() => setIsOnlineSimulation(!isOnlineSimulation)}
                className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {isOnlineSimulation ? 'Simuler hors ligne' : 'Simuler en ligne'}
              </button>
            </div>
            <Badge variant="secondary" className={`bg-sectors-${judgeSector} text-white`}>
              <MapPin className="w-3 h-3 mr-1" />
              {t('sectorA').replace('A', judgeSector)}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={findNextMissing}
            className="flex items-center space-x-1"
          >
            <SkipForward className="w-4 h-4" />
            <span>{t('nextMissing')}</span>
          </Button>
        </div>
      </div>

      {/* Hour Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5, 6, 7].map(hour => (
              <Button
                key={hour}
                variant={currentHour === hour ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setCurrentHour(hour)}
                className="flex items-center space-x-1"
              >
                <span>H{hour}</span>
              </Button>
            ))}
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedEntries / totalCompetitors) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="text-gray-900 dark:text-white">{completedEntries}/{totalCompetitors}</span>
              </span>
            </div>
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
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <Button
              variant={showIncompleteOnly ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
              className="flex items-center space-x-1"
            >
              <Filter className="w-4 h-4" />
              <span>{t('incompleteOnly')}</span>
            </Button>
          </div>
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
                    {t('action')}
                  </th>
                  <th className="sticky left-16 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                    {t('boxNumber')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('competitor')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('club')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('fishCountShort')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('totalWeightShort')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('hour')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('status')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCompetitors.map(competitor => {
                  const entry = entries[competitor.id];
                  const status = getEntryStatus(competitor.id);
                  const actionIcon = getActionIcon(status);
                  const isSelected = selectedCompetitorId === competitor.id;
                  const isLocked = ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(status);
                  
                  return (
                    <tr 
                      key={competitor.id}
                      className={`${getRowStyling(status)} ${getBorderStyling(status)} ${isSelected ? 'ring-2 ring-ocean-500' : ''} ${isLocked ? '' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      onClick={() => handleRowSelect(competitor.id)}
                      data-competitor-id={competitor.id}
                    >
                      {/* Action Column - Sticky */}
                      <td className={`sticky left-0 ${getRowStyling(status)} px-4 py-4 border-r border-gray-200 dark:border-gray-700`}>
                        <button
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${actionIcon.color} ${isLocked ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                          title={actionIcon.tooltip}
                          disabled={isLocked}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isLocked) {
                              handleRowSelect(competitor.id);
                            }
                          }}
                        >
                          <actionIcon.icon className="w-4 h-4" />
                        </button>
                      </td>
                      
                      {/* Box Number - Sticky */}
                      <td className={`sticky left-16 ${getRowStyling(status)} px-4 py-4 border-r border-gray-200 dark:border-gray-700`}>
                        <span className="font-bold text-gray-900 dark:text-white">
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
                        <span className="text-gray-900 dark:text-white">
                          {competitor.equipe}
                        </span>
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
                    {t('editorTitle').replace('{hour}', currentHour.toString())}
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
                          <span className="text-sm text-gray-600 dark:text-gray-400">{t('competitor')}:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedCompetitor.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{t('club')}:</span>
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

                    {/* Entry Status */}
                    {selectedEntry && selectedEntry.status === 'locked_judge' ? (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lock className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800 dark:text-green-200">
                            {t('entryLocked')}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">{t('fishCount')}:</span>
                            <span className="ml-2 font-medium">{selectedEntry.fishCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Poids total:</span>
                            <span className="ml-2 font-medium">{formatWeight(selectedEntry.totalWeight)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {t('adminOnlyModify')}
                        </p>
                      </div>
                    ) : selectedEntry && selectedEntry.status === 'locked_admin' ? (
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lock className="w-5 h-5 text-orange-600" />
                          <span className="font-medium text-orange-800 dark:text-orange-200">
                            {t('entryLocked')}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">{t('fishCount')}:</span>
                            <span className="ml-2 font-medium">{selectedEntry.fishCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Poids total:</span>
                            <span className="ml-2 font-medium">{formatWeight(selectedEntry.totalWeight)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {t('adminOnlyModify')}
                        </p>
                      </div>
                    ) : selectedEntry && (selectedEntry.status === 'offline_judge' || selectedEntry.status === 'offline_admin') ? (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <CloudOff className="w-5 h-5 text-amber-600" />
                          <span className="font-medium text-amber-800 dark:text-amber-200">
                            Mode hors ligne
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">{t('fishCount')}:</span>
                            <span className="ml-2 font-medium">{selectedEntry.fishCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Poids total:</span>
                            <span className="ml-2 font-medium">{formatWeight(selectedEntry.totalWeight)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {t('offlineEntryNote')}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Data Entry Fields */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              <Fish className="w-4 h-4 inline mr-1" />
                              {t('fishCountLabel')}
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
                                id="fishCountInput"
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
                              {t('totalWeightLabel')}
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
                            <p className="text-xs text-gray-500 mt-1">
                              {t('autoWeightNote')}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <Button
                            variant="primary"
                            onClick={() => handleSaveEntry(false)}
                            className="w-full"
                            disabled={!fishCount.trim() || !totalWeight.trim() || isSaving || isEntryLocked || Object.keys(errors).length > 0}
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            {isSaving ? t('saving') : t('save')}
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => handleSaveEntry(true)}
                            className="w-full"
                            disabled={!fishCount.trim() || !totalWeight.trim() || isSaving || isEntryLocked || !hasIncompleteCompetitors || Object.keys(errors).length > 0}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {!hasIncompleteCompetitors ? t('noMoreRows') : t('saveAndNext')}
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
                            {t('cancel')}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <Fish className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{t('selectRowToStart')}</p>
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