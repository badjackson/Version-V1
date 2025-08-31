'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { 
  Search,
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
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';

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

export default function LiveRankings() {
  const { competitors, hourlyEntries, bigCatches, publicAppearanceSettings } = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('classementGeneral');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAll, setShowAll] = useState(false);

  const sectors = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Calculate live data for all competitors
  const calculatedCompetitors = useMemo(() => {
    // First, calculate sector rankings
    const competitorsBySector: { [sector: string]: CalculatedCompetitor[] } = {};
    
    sectors.forEach(sector => {
      const sectorCompetitors = competitors.filter(comp => comp.sector === sector);
      
      // Calculate totals for each competitor in this sector
      const sectorCalculated: CalculatedCompetitor[] = sectorCompetitors.map(competitor => {
        let nbPrisesGlobal = 0;
        let poidsTotal = 0;
        let lastValidEntry: Date | undefined;
        
        // Sum across all 7 hours
        for (let hour = 1; hour <= 7; hour++) {
          const entries = hourlyEntries.filter(entry => 
            entry.competitorId === competitor.id && 
            entry.hour === hour &&
            ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status)
          );
          
          entries.forEach(entry => {
            nbPrisesGlobal += entry.fishCount;
            poidsTotal += entry.totalWeight;
            
            if (entry.timestamp && (!lastValidEntry || entry.timestamp > lastValidEntry)) {
              lastValidEntry = entry.timestamp;
            }
          });
        }
        
        // Get grosse prise
        const grossePriseEntry = bigCatches.find(entry => 
          entry.competitorId === competitor.id &&
          ['locked_judge', 'locked_admin', 'offline_judge', 'offline_admin'].includes(entry.status)
        );
        const grossePrise = grossePriseEntry ? grossePriseEntry.biggestCatch : 0;
        
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
  }, [competitors, hourlyEntries, bigCatches]);

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

  // Display competitors (top 10 or all)
  const displayedCompetitors = showAll ? filteredCompetitors : filteredCompetitors.slice(0, 10);
  const hiddenCount = filteredCompetitors.length - 10;

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

  const getCurrentLogo = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark && publicAppearanceSettings?.logos?.dark) {
      return publicAppearanceSettings.logos.dark;
    } else if (!isDark && publicAppearanceSettings?.logos?.light) {
      return publicAppearanceSettings.logos.light;
    }
    return null;
  };

  const handleDownloadPDF = () => {
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

    const logoHtml = getCurrentLogo() 
      ? `<img src="${getCurrentLogo()}" alt="Titanium Tunisia Open" style="height: 80px; margin: 0 auto 20px auto; display: block;" />`
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
            .text-center { text-align: center; }
            .font-mono { font-family: 'Courier New', monospace; }
            .sector-badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: bold;
              margin-left: 5px;
            }
            .sector-A { background-color: #ef4444; color: white; }
            .sector-B { background-color: #f97316; color: white; }
            .sector-C { background-color: #eab308; color: white; }
            .sector-D { background-color: #22c55e; color: white; }
            .sector-E { background-color: #3b82f6; color: white; }
            .sector-F { background-color: #8b5cf6; color: white; }
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
    `;

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
            </div>

            {/* Top 10 / Show All Toggle */}
            {!showAll && hiddenCount > 0 && (
              <div className="mb-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(true)}
                  className="flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Afficher le reste ({hiddenCount} compétiteurs)</span>
                </Button>
              </div>
            )}

            {showAll && (
              <div className="mb-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(false)}
                  className="flex items-center space-x-2"
                >
                  <EyeOff className="w-4 h-4" />
                  <span>Afficher seulement le Top 10</span>
                </Button>
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
                      const isBlurred = !showAll && index >= 10;
                      
                      return (
                        <motion.tr
                          key={competitor.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: isBlurred ? 0.3 : 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.02 }}
                          className={cn(
                            isTopThree && 'bg-yellow-50 dark:bg-yellow-900/10',
                            'hover:bg-gray-50 dark:hover:bg-gray-800',
                            isBlurred && 'blur-sm'
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

            {/* Hidden rows indicator */}
            {!showAll && hiddenCount > 0 && (
              <div className="mt-6 text-center">
                <span>{hiddenCount} autres compétiteurs masqués</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}