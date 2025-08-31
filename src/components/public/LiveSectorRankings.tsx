'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { formatWeight, formatNumber, formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
  classementSecteur: number;
  lastValidEntry?: Date;
}

interface SectorTotals {
  nbPrisesGlobal: number;
  poidsTotal: number;
  points: number;
  grossePriseMax: number;
}

export default function LiveSectorRankings() {
  const { 
    competitors: firestoreCompetitors, 
    hourlyEntries: firestoreHourlyEntries, 
    bigCatches: firestoreBigCatches,
    publicAppearanceSettings: firestorePublicSettings,
    auditLog 
  } = useFirestore();
  
  const sectors = ['A', 'B', 'C', 'D', 'E', 'F'];
  const [activeSector, setActiveSector] = useState('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('classementSecteur');
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
      
      // Calculate points: (Nb Prises global × 50) + Poids Total global
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
        classementSecteur: 0, // Will be calculated after sorting
        lastValidEntry
      };
    });
    
    // Calculate sector total for coefficient calculation
    const sectorTotalNbPrises = calculated.reduce((sum, comp) => sum + comp.nbPrisesGlobal, 0);
    
    // Calculate coefficients: (Points × Nb Prises global) / (Σ Nb Prises global secteur)
    calculated.forEach(comp => {
      if (sectorTotalNbPrises > 0) {
        comp.coefficient = (comp.points * comp.nbPrisesGlobal) / sectorTotalNbPrises;
      } else {
        comp.coefficient = 0;
      }
    });
    
    // Sort by Points (desc) for sector ranking
    const sorted = [...calculated].sort((a, b) => {
      return b.points - a.points; // Sort by Points (desc) only
    });
    
    // Assign sector rankings
    sorted.forEach((comp, index) => {
      comp.classementSecteur = index + 1;
    });
    
    return sorted;
  }, [firestoreCompetitors, hourlyDataByCompetitor, bigCatchesByCompetitor, activeSector]);

  // Calculate sector totals
  const sectorTotals = useMemo(() => {
    const totals: SectorTotals = {
      nbPrisesGlobal: 0,
      poidsTotal: 0,
      points: 0,
      grossePriseMax: 0
    };
    
    calculatedCompetitors.forEach(comp => {
      totals.nbPrisesGlobal += comp.nbPrisesGlobal;
      totals.poidsTotal += comp.poidsTotal;
      totals.points += comp.points;
      if (comp.grossePrise > totals.grossePriseMax) {
        totals.grossePriseMax = comp.grossePrise;
      }
    });
    
    return totals;
  }, [calculatedCompetitors]);

  // Apply sorting
  const sortedCompetitors = useMemo(() => {
    if (sortField === 'classementSecteur') {
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
      setSortDirection(field === 'classementSecteur' ? 'asc' : 'desc');
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

  const handleDownloadPDF = () => {
    // Log export action to Firebase
    auditLog({
      action: 'EXPORT_SECTOR_RANKING',
      details: `Export PDF classement secteur ${activeSector} - ${filteredCompetitors.length} compétiteurs`,
      metadata: { sector: activeSector, searchQuery, filterType, totalCompetitors: filteredCompetitors.length }
    });
    
    const currentDate = new Date().toLocaleDateString('fr-FR', { 
      timeZone: 'Africa/Tunis',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const currentTime = new Date().toLocaleTimeString('fr-FR', {
      timeZone: 'Africa/Tunis',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const logoHtml = firestorePublicSettings?.logos?.light || firestorePublicSettings?.logos?.dark
      ? `<img src="${firestorePublicSettings.logos.light || firestorePublicSettings.logos.dark}" alt="Titanium Tunisia Open" style="height: 80px; margin: 0 auto 20px auto; display: block;" />`
      : `<div style="text-align: center; margin-bottom: 20px;">
           <h1 style="color: #0ea5e9; font-size: 24px; margin: 0;">Titanium Tunisia Open</h1>
         </div>`;

    const tableHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Classement Secteur ${activeSector} - Titanium Tunisia Open</title>
          <style>
            @page { 
              size: A4; 
              margin: 20mm; 
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              font-size: 12px;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #0ea5e9;
              padding-bottom: 20px;
            }
            .tagline {
              font-style: italic;
              color: #666;
              margin: 10px 0;
              font-size: 14px;
            }
            .event-info {
              font-weight: bold;
              color: #0ea5e9;
              margin: 10px 0;
              font-size: 16px;
            }
            .disclaimer {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 10px;
              margin: 20px 0;
              border-radius: 4px;
              font-style: italic;
              text-align: center;
            }
            .meta-info {
              text-align: right;
              margin-bottom: 20px;
              color: #666;
              font-size: 11px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
              font-size: 11px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px 8px; 
              text-align: left; 
            }
            th { 
              background-color: #f8f9fa; 
              font-weight: bold;
              font-size: 10px;
              text-transform: uppercase;
            }
            .rank-1 { background-color: #fff3cd; }
            .rank-2 { background-color: #f8f9fa; }
            .rank-3 { background-color: #ffeaa7; }
            .text-center { text-align: center; }
            .font-mono { font-family: 'Courier New', monospace; }
            .totals-row { 
              background-color: #f8f9fa; 
              border-top: 2px solid #dee2e6; 
              font-weight: bold; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoHtml}
            <div class="tagline">The most luxurious Surfcasting competition in the world</div>
            <div class="event-info">TITANIUM TUNISIA OPEN - 6 septembre 2025 - Raoued, Tunisie</div>
            <div class="disclaimer">
              Classement provisoire — susceptible d'être modifié jusqu'à publication des résultats officiels.
            </div>
          </div>
          
          <div class="meta-info">
            Généré le ${currentDate} à ${currentTime} (Raoued, Tunisie)
          </div>
          
          <h2 style="color: #0ea5e9; margin-bottom: 20px;">Classement Secteur ${activeSector}</h2>
          
          <table>
            <thead>
              <tr>
                <th>Box N°</th>
                <th>Compétiteur</th>
                <th>Équipe</th>
                <th>Nb Prises global</th>
                <th>Poids Total global (g)</th>
                <th>Grosse prise (g)</th>
                <th>Points</th>
                <th>Coefficient secteur</th>
                <th>Classement Secteur</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCompetitors.map(comp => `
                <tr class="${comp.classementSecteur <= 3 ? `rank-${comp.classementSecteur}` : ''}">
                  <td class="font-mono">${comp.boxCode}</td>
                  <td>${comp.name}</td>
                  <td>${comp.equipe}</td>
                  <td class="text-center">${comp.nbPrisesGlobal}</td>
                  <td class="text-center">${formatNumber(comp.poidsTotal)}</td>
                  <td class="text-center">${comp.grossePrise > 0 ? formatNumber(comp.grossePrise) : '—'}</td>
                  <td class="text-center">${formatNumber(comp.points)}</td>
                  <td class="text-center font-mono">${formatCoefficient(comp.coefficient)}</td>
                  <td class="text-center"><strong>${comp.classementSecteur}</strong></td>
                </tr>
              `).join('')}
              <tr class="totals-row">
                <td class="font-mono">TOTAL</td>
                <td>—</td>
                <td>—</td>
                <td class="text-center">${formatNumber(sectorTotals.nbPrisesGlobal)}</td>
                <td class="text-center">${formatNumber(sectorTotals.poidsTotal)}</td>
                <td class="text-center">${sectorTotals.grossePriseMax > 0 ? formatNumber(sectorTotals.grossePriseMax) : '—'}</td>
                <td class="text-center">${formatNumber(sectorTotals.points)}</td>
                <td class="text-center">—</td>
                <td class="text-center">—</td>
              </tr>
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 10px;">
            Document généré automatiquement par le système Titanium Tunisia Open
          </div>
        </body>
      </html>
    `.trim();

    // Create and download PDF-ready HTML
    const blob = new Blob([tableHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classement-secteur-${activeSector}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="classement-secteur" className="py-16 bg-gradient-to-br from-sand-50 to-coral-50 dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Classement par secteur (en direct)
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Classements détaillés par secteur avec calculs en temps réel
          </p>
        </div>

        <Card className="max-w-7xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span>Classement Secteur {activeSector} en Direct</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger en PDF</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Sector Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {sectors.map(sector => (
                <button
                  key={sector}
                  onClick={() => setActiveSector(sector)}
                  className={`px-4 py-2 rounded-full transition-all font-medium ${
                    activeSector === sector
                      ? getSectorColor(sector)
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Secteur {sector}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
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

            {/* Connection Status */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">Connecté - Données en temps réel</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">Hors ligne - Dernières données disponibles</span>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {filteredCompetitors.length} compétiteur{filteredCompetitors.length > 1 ? 's' : ''} affiché{filteredCompetitors.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th 
                      className="sticky left-0 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('boxNumber')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Box N°</span>
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
                  <AnimatePresence>
                    {filteredCompetitors.map((competitor, index) => {
                      const isTopThree = competitor.classementSecteur <= 3;
                      
                      return (
                        <motion.tr
                          key={competitor.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.02 }}
                          className={cn(
                            isTopThree && 'bg-yellow-50 dark:bg-yellow-900/10',
                            'hover:bg-gray-50 dark:hover:bg-gray-800'
                          )}
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
                          
                          {/* Classement Secteur */}
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-1">
                              {competitor.nbPrisesGlobal === 0 && competitor.poidsTotal === 0 && competitor.grossePrise === 0 ? (
                                <span className="text-gray-400 dark:text-gray-500">—</span>
                              ) : (
                                <>
                                  {competitor.classementSecteur <= 3 && getRankIcon(competitor.classementSecteur)}
                                  <span className={cn('font-bold text-lg', 
                                    competitor.classementSecteur === 1 ? 'text-yellow-600' :
                                    competitor.classementSecteur === 2 ? 'text-gray-500' :
                                    competitor.classementSecteur === 3 ? 'text-amber-600' :
                                    'text-ocean-600'
                                  )}>
                                    {competitor.classementSecteur}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  
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

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-ocean-600 dark:text-ocean-400">
                  {calculatedCompetitors.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Compétiteurs</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(sectorTotals.nbPrisesGlobal)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Prises totales</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatWeight(sectorTotals.poidsTotal)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Poids total</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {sectorTotals.grossePriseMax > 0 ? formatWeight(sectorTotals.grossePriseMax) : '—'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Plus grosse prise</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}