'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
  fishCount: number;
  totalWeight: number;
  status: string;
  timestamp?: Date;
}

interface GrossePriseEntry {
  competitorId: string;
  biggestCatch: number;
  status: string;
  timestamp?: Date;
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
  coefficientSecteur: number;
  classementSecteur: number;
  classementGeneral: number;
  lastValidEntry?: Date;
}

export default function LiveGeneralRanking() {
  const { 
    competitors: firestoreCompetitors, 
    hourlyEntries: firestoreHourlyEntries, 
    bigCatches: firestoreBigCatches,
    publicAppearanceSettings: firestorePublicSettings,
    auditLog 
  } = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('classementGeneral');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const sectors = ['A', 'B', 'C', 'D', 'E', 'F'];

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

  // Calculate live data for all competitors
  const calculatedCompetitors = useMemo(() => {
    // First, calculate sector rankings
    const competitorsBySector: { [sector: string]: CalculatedCompetitor[] } = {};
    
    sectors.forEach(sector => {
      const sectorCompetitors = firestoreCompetitors.filter(comp => comp.sector === sector);
      
      // Calculate totals for each competitor in this sector
      const sectorCalculated: CalculatedCompetitor[] = sectorCompetitors.map(competitor => {
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
        
        // Calculate points
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
          coefficientSecteur: 0, // Will be calculated after we have sector totals
          classementSecteur: 0, // Will be calculated after sorting
          classementGeneral: 0, // Will be calculated in general ranking
          lastValidEntry
        };
      });
      
      // Calculate sector total for coefficient calculation
      const sectorTotalNbPrises = sectorCalculated.reduce((sum, comp) => sum + comp.nbPrisesGlobal, 0);
      
      // Calculate coefficients
      sectorCalculated.forEach(comp => {
        if (sectorTotalNbPrises > 0) {
          comp.coefficientSecteur = (comp.points * comp.nbPrisesGlobal) / sectorTotalNbPrises;
        } else {
          comp.coefficientSecteur = 0;
        }
      });
      
      // Sort by points (desc), then by grosse prise (desc), then by earliest last valid entry for sector ranking
      const sectorSorted = [...sectorCalculated].sort((a, b) => {
        return b.points - a.points; // Sort by Points (desc) only
      });
      
      // Assign sector rankings
      sectorSorted.forEach((comp, index) => {
        comp.classementSecteur = index + 1;
      });
      
      competitorsBySector[sector] = sectorSorted;
    });
    
    // Now build general ranking by place groups
    const generalRanking: CalculatedCompetitor[] = [];
    
    // Process each place (1st through 20th)
    for (let place = 1; place <= 20; place++) {
      const placeGroup: CalculatedCompetitor[] = [];
      
      // Collect all competitors at this place from each sector
      sectors.forEach(sector => {
        const sectorCompetitors = competitorsBySector[sector] || [];
        const competitorAtPlace = sectorCompetitors.find(comp => comp.classementSecteur === place);
        if (competitorAtPlace) {
          placeGroup.push(competitorAtPlace);
        }
      });
      
      // Sort this place group by coefficient (desc), then tie-breakers
      placeGroup.sort((a, b) => {
        // Sort by Coefficient secteur (desc), then by Grosse prise (desc)
        if (b.coefficientSecteur !== a.coefficientSecteur) {
          return b.coefficientSecteur - a.coefficientSecteur;
        }
        return b.grossePrise - a.grossePrise;
      });
      
      // Add to general ranking
      generalRanking.push(...placeGroup);
    }
    
    // Handle zero-coefficient competitors (place at bottom with rank 120)
    const zeroCoeffCompetitors = generalRanking.filter(comp => comp.coefficientSecteur === 0);
    const nonZeroCompetitors = generalRanking.filter(comp => comp.coefficientSecteur > 0);
    
    // Assign general rankings
    nonZeroCompetitors.forEach((comp, index) => {
      comp.classementGeneral = index + 1;
    });
    
    zeroCoeffCompetitors.forEach(comp => {
      comp.classementGeneral = 120;
    });
    
    return [...nonZeroCompetitors, ...zeroCoeffCompetitors];
  }, [firestoreCompetitors, hourlyDataByCompetitor, bigCatchesByCompetitor]);

  // Apply sorting
  const sortedCompetitors = useMemo(() => {
    if (sortField === 'classementGeneral') {
      return calculatedCompetitors; // Already sorted by general ranking
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
        case 'nbPrisesGlobal':
          aValue = a.nbPrisesGlobal;
          bValue = b.nbPrisesGlobal;
          break;
        case 'grossePrise':
          aValue = a.grossePrise;
          bValue = b.grossePrise;
          break;
        case 'classementSecteur':
          aValue = a.classementSecteur;
          bValue = b.classementSecteur;
          break;
        case 'coefficientSecteur':
          aValue = a.coefficientSecteur;
          bValue = b.coefficientSecteur;
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
    
    // Sector filter
    if (sectorFilter !== 'all') {
      filtered = filtered.filter(comp => comp.sector === sectorFilter);
    }
    
    return filtered;
  }, [sortedCompetitors, searchQuery, sectorFilter]);

  // Check if we should auto-expand based on search results
  const shouldAutoExpand = useMemo(() => {
    if (!searchQuery) return false;
    
    // Check if any search results are beyond top 10
    const searchResults = filteredCompetitors;
    const top10Ids = filteredCompetitors.slice(0, 10).map(c => c.id);
    return searchResults.some(comp => !top10Ids.includes(comp.id));
  }, [searchQuery, filteredCompetitors]);

  // Auto-expand when search has results beyond top 10
  useEffect(() => {
    if (shouldAutoExpand && !isExpanded) {
      setIsExpanded(true);
    }
  }, [shouldAutoExpand, isExpanded]);

  // Display logic
  const displayedCompetitors = isExpanded ? filteredCompetitors : filteredCompetitors.slice(0, 10);
  const hiddenCount = Math.max(0, filteredCompetitors.length - 10);
  const showToggleButton = filteredCompetitors.length > 10;

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
      setSortDirection(field === 'classementGeneral' || field === 'classementSecteur' ? 'asc' : 'desc');
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
      action: 'EXPORT_GENERAL_RANKING',
      details: `Export PDF classement général - ${filteredCompetitors.length} compétiteurs`,
      metadata: { sectorFilter, searchQuery, totalCompetitors: filteredCompetitors.length }
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
          <title>Classement Général - Titanium Tunisia Open</title>
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
            .sector-badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              color: white;
              font-size: 9px;
              font-weight: bold;
              margin-left: 4px;
            }
            .sector-A { background-color: #3b82f6; }
            .sector-B { background-color: #10b981; }
            .sector-C { background-color: #f59e0b; }
            .sector-D { background-color: #ef4444; }
            .sector-E { background-color: #8b5cf6; }
            .sector-F { background-color: #06b6d4; }
            .text-center { text-align: center; }
            .font-mono { font-family: 'Courier New', monospace; }
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
          
          <h2 style="color: #0ea5e9; margin-bottom: 20px;">Classement Général</h2>
          
          <table>
            <thead>
              <tr>
                <th>Box N°</th>
                <th>Compétiteur</th>
                <th>Équipe</th>
                <th>Nb Prises global</th>
                <th>Grosse prise (g)</th>
                <th>Classement secteur</th>
                <th>Coefficient secteur</th>
                <th>Classement Général</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCompetitors.map(comp => `
                <tr class="${comp.classementGeneral <= 3 ? `rank-${comp.classementGeneral}` : ''}">
                  <td class="font-mono">${comp.boxCode}</td>
                  <td>
                    ${comp.name}
                    <span class="sector-badge sector-${comp.sector}">${comp.sector}</span>
                  </td>
                  <td>${comp.equipe}</td>
                  <td class="text-center">${comp.nbPrisesGlobal}</td>
                  <td class="text-center">${comp.grossePrise > 0 ? formatNumber(comp.grossePrise) : '—'}</td>
                  <td class="text-center">${comp.classementSecteur}</td>
                  <td class="text-center font-mono">${formatCoefficient(comp.coefficientSecteur)}</td>
                  <td class="text-center"><strong>${comp.classementGeneral}</strong></td>
                </tr>
              `).join('')}
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
    a.download = `classement-general-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="classement-general" className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Classement général (en direct)
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Classement global de la compétition, mis à jour en temps réel
          </p>
        </div>

        <Card className="max-w-7xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span>Classement Général en Direct</span>
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
              <div className="flex items-center gap-4">
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">Tous les secteurs</option>
                  {sectors.map(sector => (
                    <option key={sector} value={sector}>Secteur {sector}</option>
                  ))}
                </select>
                
                {/* Toggle Button */}
                {showToggleButton && (
                  <Button
                    variant="outline"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center space-x-2 whitespace-nowrap"
                  >
                    {isExpanded ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Masquer le reste</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Afficher le reste ({hiddenCount})</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Search notice for hidden results */}
            {searchQuery && !isExpanded && shouldAutoExpand && (
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                  Des résultats se trouvent au-delà du Top 10 — 
                  <button 
                    onClick={() => setIsExpanded(true)}
                    className="ml-1 underline hover:no-underline font-medium"
                  >
                    Afficher le reste
                  </button>
                </p>
              </div>
            )}

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
                      onClick={() => handleSort('grossePrise')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Grosse prise (g)</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('classementSecteur')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Classement secteur</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('coefficientSecteur')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Coefficient secteur</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('classementGeneral')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Classement Général</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence>
                    {displayedCompetitors.map((competitor, index) => {
                      const isTopThree = competitor.classementGeneral <= 3;
                      const isInTop10 = index < 10;
                      
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
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {competitor.name}
                              </span>
                              <Badge className={cn('text-xs', getSectorColor(competitor.sector))}>
                                {competitor.sector}
                              </Badge>
                            </div>
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
                          
                          {/* Grosse prise */}
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {competitor.grossePrise > 0 ? formatNumber(competitor.grossePrise) : '—'}
                            </span>
                          </td>
                          
                          {/* Classement secteur */}
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-1">
                              {competitor.nbPrisesGlobal === 0 && competitor.poidsTotal === 0 && competitor.grossePrise === 0 ? (
                                <span className="text-gray-400 dark:text-gray-500">—</span>
                              ) : (
                                <>
                                  {competitor.classementSecteur <= 3 && getRankIcon(competitor.classementSecteur)}
                                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {competitor.classementSecteur}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                          
                          {/* Coefficient secteur */}
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            {competitor.nbPrisesGlobal === 0 && competitor.poidsTotal === 0 && competitor.grossePrise === 0 ? (
                              <span className="text-gray-400 dark:text-gray-500">—</span>
                            ) : (
                              <span className="font-mono text-sm text-gray-800 dark:text-gray-200">
                                {formatCoefficient(competitor.coefficientSecteur)}
                              </span>
                            )}
                          </td>
                          
                          {/* Classement Général */}
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-1">
                              {competitor.nbPrisesGlobal === 0 && competitor.poidsTotal === 0 && competitor.grossePrise === 0 ? (
                                <span className="text-gray-400 dark:text-gray-500">—</span>
                              ) : (
                                <>
                                  {competitor.classementGeneral <= 3 && getRankIcon(competitor.classementGeneral)}
                                  <span className={cn('font-bold text-lg', 
                                    competitor.classementGeneral === 1 ? 'text-yellow-600' :
                                    competitor.classementGeneral === 2 ? 'text-gray-500' :
                                    competitor.classementGeneral === 3 ? 'text-amber-600' :
                                    competitor.classementGeneral === 120 ? 'text-gray-400' :
                                    'text-ocean-600'
                                  )}>
                                    {competitor.classementGeneral}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Collapsed state indicator */}
            {!isExpanded && hiddenCount > 0 && (
              <div className="mt-6 text-center">
                <div className="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                  {hiddenCount} autres compétiteurs — 
                  <button 
                    onClick={() => setIsExpanded(true)}
                    className="ml-1 text-ocean-600 dark:text-ocean-400 hover:underline font-medium"
                  >
                    Afficher le reste
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}