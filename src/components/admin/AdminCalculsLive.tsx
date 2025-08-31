'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { 
  Search,
  Filter,
  Download,
  ArrowUpDown,
  Trophy,
  Medal,
  Award,
  Wifi,
  WifiOff
} from 'lucide-react';
import { formatWeight, formatNumber, formatTime } from '@/lib/utils';

interface Competitor {
  id: string;
  boxNumber: number;
  boxCode: string;
  name: string;
  equipe: string;
  sector: string;
}

interface CalculatedCompetitor {
  id: string;
  boxNumber: number;
  boxCode: string;
  name: string;
  equipe: string;
  sector: string;
  nbPrisesGlobal: number;
  poidsTotal: number;
  grossePrise: number;
  points: number;
  coefficient: number;
  classement: number;
  lastValidEntry?: Date;
}

interface SectorTotals {
  nbPrisesGlobal: number;
  poidsTotal: number;
  points: number;
  grossePriseMax: number;
}

export default function AdminCalculsLive() {
  const searchParams = useSearchParams();
  const sectors = ['A', 'B', 'C', 'D', 'E', 'F'];
  const { 
    competitors: firestoreCompetitors, 
    hourlyEntries: firestoreHourlyEntries, 
    bigCatches: firestoreBigCatches,
    saveCompetitor
  } = useFirestore();
  
  const [activeSector, setActiveSector] = useState(searchParams.get('sector') || 'A');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('classement');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<string>('all');
  const [isOnline, setIsOnline] = useState(true);

  // Set initial online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Convert Firebase data to local format for calculations
  const hourlyDataByCompetitor = useMemo(() => {
    const data: { [competitorId: string]: { [hour: number]: any } } = {};
    
    firestoreHourlyEntries.forEach(entry => {
      if (!data[entry.competitorId]) {
        data[entry.competitorId] = {};
      }
      data[entry.competitorId][entry.hour] = {
        fishCount: entry.fishCount,
        totalWeight: entry.totalWeight,
        status: entry.status,
        timestamp: entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date()
      };
    });
    
    return data;
  }, [firestoreHourlyEntries]);
  
  const bigCatchesByCompetitor = useMemo(() => {
    const data: { [competitorId: string]: any } = {};
    
    firestoreBigCatches.forEach(entry => {
      data[entry.competitorId] = {
        biggestCatch: entry.biggestCatch,
        status: entry.status,
        timestamp: entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date()
      };
    });
    
    return data;
  }, [firestoreBigCatches]);

  // Calculate live data for current sector
  const calculatedCompetitors = useMemo(() => {
    const currentCompetitors = firestoreCompetitors.filter(comp => comp.sector === activeSector);
    
    // Calculate totals for each competitor
    const calculated: CalculatedCompetitor[] = currentCompetitors.map(competitor => {
      let nbPrisesGlobal = 0;
      let poidsTotal = 0;
      let lastValidEntry: Date | undefined;
      
      // Sum across all 7 hours
      for (let hour = 1; hour <= 7; hour++) {
        const entry = hourlyDataByCompetitor[competitor.id]?.[hour];
        
        if (entry && ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status)) {
          nbPrisesGlobal += entry.fishCount;
          poidsTotal += entry.totalWeight;
          
          if (entry.timestamp && (!lastValidEntry || entry.timestamp > lastValidEntry)) {
            lastValidEntry = entry.timestamp;
          }
        }
      }
      
      // Get grosse prise
      const grossePriseEntry = bigCatchesByCompetitor[competitor.id];
      const grossePrise = grossePriseEntry && ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(grossePriseEntry.status) 
        ? grossePriseEntry.biggestCatch 
        : 0;
      
      // Calculate points: (Nb Prises × 50) + Poids Total
      const points = (nbPrisesGlobal * 50) + poidsTotal;
      
      return {
        id: competitor.id,
        boxNumber: competitor.boxNumber,
        boxCode: competitor.boxCode,
        name: competitor.fullName,
        equipe: competitor.equipe,
        sector: competitor.sector,
        nbPrisesGlobal,
        poidsTotal,
        grossePrise,
        points,
        coefficient: 0, // Will be calculated after we have sector totals
        classement: 0, // Will be calculated after sorting
        lastValidEntry
      };
    });
    
    // Calculate sector total for coefficient calculation
    const sectorTotalNbPrises = calculated.reduce((sum, comp) => sum + comp.nbPrisesGlobal, 0);
    
    // Calculate coefficients: (Points × Nb Prises) / Total Nb Prises Secteur
    calculated.forEach(comp => {
      if (sectorTotalNbPrises > 0) {
        comp.coefficient = (comp.points * comp.nbPrisesGlobal) / sectorTotalNbPrises;
      } else {
        comp.coefficient = 0;
      }
    });
    
    // Sort by Points (desc) for sector ranking
    const sorted = [...calculated].sort((a, b) => {
      return b.points - a.points; // Sort by Points (desc)
    });
    
    // Assign sector rankings (1-20)
    sorted.forEach((comp, index) => {
      comp.classement = index + 1;
    });
    
    // Save calculated data back to Firebase
    sorted.forEach(async (comp) => {
      try {
        const competitorData = {
          id: comp.id,
          sector: comp.sector,
          boxNumber: comp.boxNumber,
          boxCode: comp.boxCode,
          fullName: comp.name,
          equipe: comp.equipe,
          photo: firestoreCompetitors.find(c => c.id === comp.id)?.photo || '',
          status: 'active',
          // Add calculated fields
          nbPrisesGlobal: comp.nbPrisesGlobal,
          poidsTotal: comp.poidsTotal,
          grossePrise: comp.grossePrise,
          points: comp.points,
          coefficientSecteur: comp.coefficient,
          classementSecteur: comp.classement
        };
        
        await saveCompetitor(competitorData);
      } catch (error) {
        console.error('Error saving calculated data to Firebase:', error);
      }
    });
    
    return sorted;
  }, [firestoreCompetitors, hourlyDataByCompetitor, bigCatchesByCompetitor, activeSector]);

  // Calculate sector totals
  const sectorTotals = useMemo((): SectorTotals => {
    return {
      nbPrisesGlobal: calculatedCompetitors.reduce((sum, comp) => sum + comp.nbPrisesGlobal, 0),
      poidsTotal: calculatedCompetitors.reduce((sum, comp) => sum + comp.poidsTotal, 0),
      points: calculatedCompetitors.reduce((sum, comp) => sum + comp.points, 0),
      grossePriseMax: Math.max(0, ...calculatedCompetitors.map(comp => comp.grossePrise))
    };
  }, [calculatedCompetitors]);

  // Apply sorting
  const sortedCompetitors = useMemo(() => {
    if (sortField === 'classement') {
      return calculatedCompetitors; // Already sorted by classement
    }
    
    return [...calculatedCompetitors].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;
      
      switch (sortField) {
        case 'boxNumber':
          aValue = a.boxNumber;
          bValue = b.boxNumber;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'equipe':
          aValue = a.equipe.toLowerCase();
          bValue = b.equipe.toLowerCase();
          break;
        case 'points':
          aValue = a.points;
          bValue = b.points;
          break;
        case 'nbPrisesGlobal':
          aValue = a.nbPrisesGlobal;
          bValue = b.nbPrisesGlobal;
          break;
        case 'poidsTotal':
          aValue = a.poidsTotal;
          bValue = b.poidsTotal;
          break;
        case 'grossePrise':
          aValue = a.grossePrise;
          bValue = b.grossePrise;
          break;
        case 'coefficient':
          aValue = a.coefficient;
          bValue = b.coefficient;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
      } else {
        return sortDirection === 'desc' ? (bValue as number) - (aValue as number) : (aValue as number) - (bValue as number);
      }
    });
  }, [calculatedCompetitors, sortField, sortDirection]);

  // Apply filters
  const filteredCompetitors = useMemo(() => {
    let filtered = sortedCompetitors;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comp => 
        comp.name.toLowerCase().includes(query) ||
        comp.equipe.toLowerCase().includes(query) ||
        comp.boxCode.toLowerCase().includes(query)
      );
    }
    
    // Type filters
    switch (filterType) {
      case 'top3':
        filtered = filtered.slice(0, 3);
        break;
      case 'top10':
        filtered = filtered.slice(0, 10);
        break;
      case 'withGrossePrise':
        filtered = filtered.filter(comp => comp.grossePrise > 0);
        break;
    }
    
    return filtered;
  }, [sortedCompetitors, searchQuery, filterType]);

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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to desc for most fields
    }
  };

  const formatCoefficient = (value: number): string => {
    return value.toLocaleString('fr-FR', { 
      minimumFractionDigits: 3, 
      maximumFractionDigits: 3 
    });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Box N°', 
      'Compétiteur', 
      'Équipe', 
      'Nb Prises global', 
      'Poids Total global (g)', 
      'Grosse prise (g)', 
      'Points', 
      'Coefficient secteur', 
      'Classement Secteur'
    ];
    
    const rows = filteredCompetitors.map(comp => [
      comp.boxCode,
      comp.name,
      comp.equipe,
      comp.nbPrisesGlobal,
      comp.poidsTotal,
      comp.grossePrise,
      comp.points,
      formatCoefficient(comp.coefficient),
      comp.classement
    ]);

    // Add totals row
    rows.push([
      'TOTAL',
      '—',
      '—',
      sectorTotals.nbPrisesGlobal,
      sectorTotals.poidsTotal,
      sectorTotals.grossePriseMax,
      sectorTotals.points,
      '—',
      '—'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calculs-live-${activeSector}.csv`;
    a.click();
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calculs Live</h1>
            <p className="text-gray-600 dark:text-gray-300">Totaux et classements en temps réel par secteur</p>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-600">Mise à jour automatique</span>
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
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">Tous</option>
              <option value="top3">Top 3</option>
              <option value="top10">Top 10</option>
              <option value="withGrossePrise">Avec grosse prise</option>
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

      {/* Main Content - Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              <th 
                className="sticky left-0 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('boxNumber')}
              >
                <div className="flex items-center space-x-1">
                  <span>BOX N°</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Compétiteur</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('equipe')}
              >
                <div className="flex items-center space-x-1">
                  <span>Équipe</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('nbPrisesGlobal')}
              >
                <div className="flex items-center space-x-1">
                  <span>Nb Prises global</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('poidsTotal')}
              >
                <div className="flex items-center space-x-1">
                  <span>Poids Total global (g)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('grossePrise')}
              >
                <div className="flex items-center space-x-1">
                  <span>Grosse prise (g)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('points')}
              >
                <div className="flex items-center space-x-1">
                  <span>Points</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('coefficient')}
              >
                <div className="flex items-center space-x-1">
                  <span>Coefficient secteur</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('classementSecteur')}
              >
                <div className="flex items-center space-x-1">
                  <span>Classement Secteur</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCompetitors.map(competitor => {
              const isTopThree = competitor.classement <= 3;
              
              return (
                <tr 
                  key={competitor.id}
                  className={`${isTopThree ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''} hover:bg-gray-50 dark:hover:bg-gray-800`}
                >
                  {/* Box Number - Sticky */}
                  <td className="sticky left-0 bg-white dark:bg-gray-900 px-4 py-4 border-r border-gray-200 dark:border-gray-700">
                    <span className="font-mono font-semibold text-gray-900 dark:text-white">
                      {competitor.boxCode}
                    </span>
                  </td>
                  
                  {/* Competitor */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {competitor.name}
                    </span>
                  </td>
                  
                  {/* Équipe */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-gray-800 dark:text-gray-200">{competitor.equipe}</span>
                  </td>
                  
                  {/* Nb Prises global */}
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {competitor.nbPrisesGlobal}
                    </span>
                  </td>
                  
                  {/* Poids Total global */}
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatNumber(competitor.poidsTotal)}
                    </span>
                  </td>
                  
                  {/* Grosse prise */}
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {competitor.grossePrise > 0 ? formatNumber(competitor.grossePrise) : '—'}
                    </span>
                  </td>
                  
                  {/* Points */}
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="font-bold text-lg text-ocean-600 dark:text-ocean-400">
                      {formatNumber(competitor.points)}
                    </span>
                  </td>
                  
                  {/* Coefficient secteur */}
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="font-mono text-sm text-gray-800 dark:text-gray-200">
                      {formatCoefficient(competitor.coefficient)}
                    </span>
                  </td>
                  
                  {/* Classement */}
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {competitor.nbPrisesGlobal === 0 && competitor.poidsTotal === 0 && competitor.grossePrise === 0 ? (
                        <span className="text-gray-400 dark:text-gray-500">—</span>
                      ) : (
                        <>
                          {competitor.classement <= 3 && getRankIcon(competitor.classement)}
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {competitor.classement}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {/* Totals Row */}
            <tr className="bg-gray-100 dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-600">
              <td className="sticky left-0 bg-gray-100 dark:bg-gray-800 px-4 py-4 border-r border-gray-200 dark:border-gray-700">
                <span className="font-bold text-gray-900 dark:text-gray-100">TOTAL</span>
              </td>
              <td className="px-4 py-4 text-gray-500 dark:text-gray-400">—</td>
              <td className="px-4 py-4 text-gray-500 dark:text-gray-400">—</td>
              <td className="px-4 py-4 text-center">
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatNumber(sectorTotals.nbPrisesGlobal)}
                </span>
              </td>
              <td className="px-4 py-4 text-center">
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatNumber(sectorTotals.poidsTotal)}
                </span>
              </td>
              <td className="px-4 py-4 text-center">
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {sectorTotals.grossePriseMax > 0 ? formatNumber(sectorTotals.grossePriseMax) : '—'}
                </span>
              </td>
              <td className="px-4 py-4 text-center">
                <span className="font-bold text-ocean-600 dark:text-ocean-400">
                  {formatNumber(sectorTotals.points)}
                </span>
              </td>
              <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">—</td>
              <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}