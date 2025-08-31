'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CompetitorAvatar from '@/components/ui/CompetitorAvatar';
import { 
  Save, 
  Trash2,
  Edit,
  Search,
  Plus,
  Download,
  ChevronRight,
  ChevronLeft,
  User,
  Upload,
  Eye,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { formatTime } from '@/lib/utils';

// Generate available box numbers for each sector
const generateAvailableBoxes = (sector: string, takenBoxes: number[]): { value: number; label: string }[] => {
  const boxes = [];
  for (let i = 1; i <= 20; i++) {
    if (!takenBoxes.includes(i)) {
      boxes.push({
        value: i,
        label: `${sector}${String(i).padStart(2, '0')}`
      });
    }
  }
  return boxes;
};

export default function AdminCompetiteurs() {
  const { competitors, saveCompetitor, deleteCompetitor } = useFirestore();
  const [activeSector, setActiveSector] = useState('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  
  // Editor state
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    sector: 'A',
    boxNumber: 1,
    fullName: '',
    equipe: '',
    photo: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<any>(null);

  const sectors = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Initialize competitors in Firebase if empty
  useEffect(() => {
    if (competitors.length > 0) return; // Already have data
    
    const officialCompetitors = [
      // Sector A
      { sector: 'A', boxNumber: 1, fullName: 'Sami Said', equipe: 'OPEN' },
      { sector: 'A', boxNumber: 2, fullName: 'Ramzi Dhahak', equipe: 'TST' },
      { sector: 'A', boxNumber: 3, fullName: 'Nour Abdennadher', equipe: 'AS MARSA' },
      { sector: 'A', boxNumber: 4, fullName: 'Zied Ferjani', equipe: 'OPEN' },
      { sector: 'A', boxNumber: 5, fullName: 'Slim Baklouti', equipe: 'CPSS' },
      { sector: 'A', boxNumber: 6, fullName: 'Mohamed Nour Zribi', equipe: 'PLANET' },
      { sector: 'A', boxNumber: 7, fullName: 'Yassine Bellil', equipe: 'TST' },
      { sector: 'A', boxNumber: 8, fullName: 'Foued Baccouche', equipe: 'OPEN' },
      { sector: 'A', boxNumber: 9, fullName: 'Fredj Gharbi', equipe: 'ETOILE BLEUE SOUSSE' },
      { sector: 'A', boxNumber: 10, fullName: 'Mohamed Maarfi', equipe: 'PIRANHA' },
      { sector: 'A', boxNumber: 11, fullName: 'Aymen Ben Hmida', equipe: 'CPS NABEUL' },
      { sector: 'A', boxNumber: 12, fullName: 'Riadh Ajmi', equipe: 'TST' },
      { sector: 'A', boxNumber: 13, fullName: 'Sidali Guir', equipe: 'ECOSIUM' },
      { sector: 'A', boxNumber: 14, fullName: 'Kais Masmoudi', equipe: 'OPEN' },
      { sector: 'A', boxNumber: 15, fullName: 'Mohamed Taieb Korbi', equipe: 'TST' },
      { sector: 'A', boxNumber: 16, fullName: 'Elyes Benzarti', equipe: 'PLANET' },
      { sector: 'A', boxNumber: 17, fullName: 'Zied Kefi', equipe: 'PIRANHA' },
      { sector: 'A', boxNumber: 18, fullName: 'Hamdi Naili', equipe: 'OPEN' },
      { sector: 'A', boxNumber: 19, fullName: 'Heni Kolsi', equipe: 'TEAM MAJD' },
      { sector: 'A', boxNumber: 20, fullName: 'Yacine Kidar', equipe: 'PLANET DZ' },
      
      // Sector B
      { sector: 'B', boxNumber: 1, fullName: 'Akram Ben Abdallah', equipe: 'AS MARSA' },
      { sector: 'B', boxNumber: 2, fullName: 'Ramzi Soukah', equipe: 'CPS NABEUL' },
      { sector: 'B', boxNumber: 3, fullName: 'Wajdi Lajmi', equipe: 'PIRANHA' },
      { sector: 'B', boxNumber: 4, fullName: 'Saief Loudhaief', equipe: 'TST' },
      { sector: 'B', boxNumber: 5, fullName: 'Hammadi Fakhfekh', equipe: 'CPSS' },
      { sector: 'B', boxNumber: 6, fullName: 'Ilyes Bessiuod', equipe: 'OPEN' },
      { sector: 'B', boxNumber: 7, fullName: 'Med Wajdi Cherif', equipe: 'PLANET' },
      { sector: 'B', boxNumber: 8, fullName: 'Walid Safraoui', equipe: 'TST' },
      { sector: 'B', boxNumber: 9, fullName: 'Bilal Sefsaf', equipe: 'OPEN' },
      { sector: 'B', boxNumber: 10, fullName: 'Abdelmonem Elgliou', equipe: 'PIRANHA' },
      { sector: 'B', boxNumber: 11, fullName: 'Hamza Krifi', equipe: 'TPL' },
      { sector: 'B', boxNumber: 12, fullName: 'Kamel Bahloul', equipe: 'ORCA' },
      { sector: 'B', boxNumber: 13, fullName: 'Ridha Wahid', equipe: 'OPEN' },
      { sector: 'B', boxNumber: 14, fullName: 'Amen Souayha', equipe: 'PLANET' },
      { sector: 'B', boxNumber: 15, fullName: 'Fatma Ktifi', equipe: 'TST' },
      { sector: 'B', boxNumber: 16, fullName: 'Nizar Mbarek', equipe: 'ETOILE BLEUE SOUSSE' },
      { sector: 'B', boxNumber: 17, fullName: 'Mohamed Anouer Belhessin Bay', equipe: 'PIRANHA' },
      { sector: 'B', boxNumber: 18, fullName: 'Ali Ouesleti', equipe: 'TPL' },
      { sector: 'B', boxNumber: 19, fullName: 'Walid Ben Jrad', equipe: 'TST' },
      { sector: 'B', boxNumber: 20, fullName: 'Mohamed Saber Haouari', equipe: 'PIRANHA' },
      
      // Sector C
      { sector: 'C', boxNumber: 1, fullName: 'Bassem Mezelini', equipe: 'PIRANHA' },
      { sector: 'C', boxNumber: 2, fullName: 'Rami Jomni', equipe: 'TST' },
      { sector: 'C', boxNumber: 3, fullName: 'Hassen Ben Amor', equipe: 'OPEN' },
      { sector: 'C', boxNumber: 4, fullName: 'Bilel Ennouri', equipe: 'TPL' },
      { sector: 'C', boxNumber: 5, fullName: 'Ramzi Ben Amor', equipe: 'OPEN' },
      { sector: 'C', boxNumber: 6, fullName: 'Youssef Ben Hamed', equipe: 'PLANET' },
      { sector: 'C', boxNumber: 7, fullName: 'Redouane Mechkour', equipe: 'MINA FISHING DZ' },
      { sector: 'C', boxNumber: 8, fullName: 'Chiheb Bayar', equipe: 'TST' },
      { sector: 'C', boxNumber: 9, fullName: 'Zied Zarrouk', equipe: 'PIRANHA' },
      { sector: 'C', boxNumber: 10, fullName: 'Yassine Mannai', equipe: 'AS MARSA' },
      { sector: 'C', boxNumber: 11, fullName: 'Abdelkader Sami Khalfi', equipe: 'TSC DZ' },
      { sector: 'C', boxNumber: 12, fullName: 'Bechir Ben Aoun', equipe: 'TST' },
      { sector: 'C', boxNumber: 13, fullName: 'Faouzi Berkane', equipe: 'SÉTIFIEN DZ' },
      { sector: 'C', boxNumber: 14, fullName: 'Rami Gdich', equipe: 'CPSS' },
      { sector: 'C', boxNumber: 15, fullName: 'Walid Gharbi', equipe: 'OPEN' },
      { sector: 'C', boxNumber: 16, fullName: 'Mohamed Chedli Cherif', equipe: 'PLANET' },
      { sector: 'C', boxNumber: 17, fullName: 'Aladain Letaief', equipe: 'ETOILE BLEUE SOUSSE' },
      { sector: 'C', boxNumber: 18, fullName: 'Riadh Jaouadi', equipe: 'TST' },
      { sector: 'C', boxNumber: 19, fullName: 'Ramzi Idoudi', equipe: 'PIRANHA' },
      { sector: 'C', boxNumber: 20, fullName: 'Faten Jemmali', equipe: 'CPS NABEUL' },
      
      // Sector D
      { sector: 'D', boxNumber: 1, fullName: 'Hamdi Gdara', equipe: 'MED FISHING' },
      { sector: 'D', boxNumber: 2, fullName: 'Mohamed Ghazi Jaziri', equipe: 'PIRANHA' },
      { sector: 'D', boxNumber: 3, fullName: 'Amar Nechat', equipe: 'OPEN' },
      { sector: 'D', boxNumber: 4, fullName: 'Moheb Salah', equipe: 'TPL' },
      { sector: 'D', boxNumber: 5, fullName: 'Marwen Douiri', equipe: 'TST' },
      { sector: 'D', boxNumber: 6, fullName: 'Mohamed Douss', equipe: 'PLANET' },
      { sector: 'D', boxNumber: 7, fullName: 'Mohamed El Kefi', equipe: 'CPS NABEUL' },
      { sector: 'D', boxNumber: 8, fullName: 'Marouen Zouari', equipe: 'TST' },
      { sector: 'D', boxNumber: 9, fullName: 'Saif Allah Ben Zarga', equipe: 'PIRANHA' },
      { sector: 'D', boxNumber: 10, fullName: 'Mehdi Sayadi', equipe: 'ORCA' },
      { sector: 'D', boxNumber: 11, fullName: 'Anouar Chouat', equipe: 'AS MARSA' },
      { sector: 'D', boxNumber: 12, fullName: 'Noureddine Ben Khedija', equipe: 'ETOILE BLEUE SOUSSE' },
      { sector: 'D', boxNumber: 13, fullName: 'Mhamed Gannar', equipe: 'TST' },
      { sector: 'D', boxNumber: 14, fullName: 'Nebil Bousselmi', equipe: 'PIRANHA' },
      { sector: 'D', boxNumber: 15, fullName: 'Mokhtar Ramdani', equipe: 'SÉTIFIEN DZ' },
      { sector: 'D', boxNumber: 16, fullName: 'Brahim ALIANI', equipe: 'TST' },
      { sector: 'D', boxNumber: 17, fullName: 'Walid Hakim', equipe: 'CPSS' },
      { sector: 'D', boxNumber: 18, fullName: 'Reda Guenfissi', equipe: 'ECOSIUM' },
      { sector: 'D', boxNumber: 19, fullName: 'Mohamed Mokaddem', equipe: 'PLANET' },
      { sector: 'D', boxNumber: 20, fullName: 'Taib Maaoui', equipe: 'PIRANHA' },
      
      // Sector E
      { sector: 'E', boxNumber: 1, fullName: 'Tayssir Dimassi', equipe: 'OPEN' },
      { sector: 'E', boxNumber: 2, fullName: 'Mohamed Amir Nasri', equipe: 'PIRANHA' },
      { sector: 'E', boxNumber: 3, fullName: 'Karim Hammoudi', equipe: 'OPEN' },
      { sector: 'E', boxNumber: 4, fullName: 'Abdelkader Zouari', equipe: 'CPSS' },
      { sector: 'E', boxNumber: 5, fullName: 'Natalia Trounova', equipe: 'TPL' },
      { sector: 'E', boxNumber: 6, fullName: 'Tawfik Orfi', equipe: 'TST' },
      { sector: 'E', boxNumber: 7, fullName: 'Mohamed Turki', equipe: 'PIRANHA' },
      { sector: 'E', boxNumber: 8, fullName: 'Seifeddine Touil', equipe: 'CN RAS JEBAL' },
      { sector: 'E', boxNumber: 9, fullName: 'Bilel Mayara', equipe: 'CPS NABEUL' },
      { sector: 'E', boxNumber: 10, fullName: 'Anis El Feiz', equipe: 'TST' },
      { sector: 'E', boxNumber: 11, fullName: 'Tarik Zebairi', equipe: 'Horizon Atlantique' },
      { sector: 'E', boxNumber: 12, fullName: 'Assaad Troudi', equipe: 'AS MARSA' },
      { sector: 'E', boxNumber: 13, fullName: 'Riadh M', equipe: 'PIRANHA' },
      { sector: 'E', boxNumber: 14, fullName: 'Mohamed Amine Ben Aouana', equipe: 'ETOILE BLEUE SOUSSE' },
      { sector: 'E', boxNumber: 15, fullName: 'Amine Boussaa', equipe: 'TST' },
      { sector: 'E', boxNumber: 16, fullName: 'Rami Trigui', equipe: 'CPSS' },
      { sector: 'E', boxNumber: 17, fullName: 'Nizar Welhazi', equipe: 'PLANET' },
      { sector: 'E', boxNumber: 18, fullName: 'Aymen Ben Arfaa', equipe: 'PIRANHA' },
      { sector: 'E', boxNumber: 19, fullName: 'Oussema Klai', equipe: 'OPEN' },
      { sector: 'E', boxNumber: 20, fullName: 'Mariem Hakim Safraoui', equipe: 'TST' },
      
      // Sector F
      { sector: 'F', boxNumber: 1, fullName: 'Mounir El Haddad', equipe: 'TST' },
      { sector: 'F', boxNumber: 2, fullName: 'Mohamed Bouazra', equipe: 'CPS NABEUL' },
      { sector: 'F', boxNumber: 3, fullName: 'Karim Mokaddem', equipe: 'AS MARSA' },
      { sector: 'F', boxNumber: 4, fullName: 'Mohamed Abouda', equipe: 'ETOILE BLEUE SOUSSE' },
      { sector: 'F', boxNumber: 5, fullName: 'Ghassen Souissi', equipe: 'PIRANHA' },
      { sector: 'F', boxNumber: 6, fullName: 'Ibrahim Merwan Touami', equipe: 'OPEN' },
      { sector: 'F', boxNumber: 7, fullName: 'Maher Ben Taieb', equipe: 'TST' },
      { sector: 'F', boxNumber: 8, fullName: 'Elaine Vredenburg', equipe: 'HSV de Slufter' },
      { sector: 'F', boxNumber: 9, fullName: 'Mohamed Larbi Agli', equipe: 'OPEN' },
      { sector: 'F', boxNumber: 10, fullName: 'Souhail Smaoui', equipe: 'CPSS' },
      { sector: 'F', boxNumber: 11, fullName: 'Rayen Galai', equipe: 'PIRANHA' },
      { sector: 'F', boxNumber: 12, fullName: 'Akram khelifa', equipe: 'OPEN' },
      { sector: 'F', boxNumber: 13, fullName: 'Mhamed Belalgia', equipe: 'TST' },
      { sector: 'F', boxNumber: 14, fullName: 'Mahdi Karoui', equipe: 'TPL' },
      { sector: 'F', boxNumber: 15, fullName: 'Foued Harzalleoui', equipe: 'AS MARSA' },
      { sector: 'F', boxNumber: 16, fullName: 'Khalil Issaoui', equipe: 'CPS NABEUL' },
      { sector: 'F', boxNumber: 17, fullName: 'Hichem Bouzouita', equipe: 'TST' },
      { sector: 'F', boxNumber: 18, fullName: 'Seif Eddine Ben Ayed', equipe: 'PIRANHA' },
      { sector: 'F', boxNumber: 19, fullName: 'Hassen Lanssari', equipe: 'PLANET' },
      { sector: 'F', boxNumber: 20, fullName: 'Nejah Abdeljawed', equipe: 'TST' }
    ];

    // Save each competitor to Firebase
    const initializeCompetitors = async () => {
      for (const comp of officialCompetitors) {
        const competitorData = {
          id: `comp-${comp.sector.toLowerCase()}-${comp.boxNumber}`,
          sector: comp.sector,
          boxNumber: comp.boxNumber,
          boxCode: `${comp.sector}${String(comp.boxNumber).padStart(2, '0')}`,
          fullName: comp.fullName,
          equipe: comp.equipe,
          photo: `https://images.pexels.com/photos/${1000000 + Math.floor(Math.random() * 1000000)}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=150&h=150`,
          status: 'active'
        };
        
        try {
          await saveCompetitor({
            ...competitorData,
            status: 'active' as 'active' | 'inactive'
          });
        } catch (error) {
          console.error('Error saving competitor:', error);
        }
      }
    };

    initializeCompetitors();
  }, [competitors, saveCompetitor]);

  // Group competitors by sector for display
  const competitorsBySector = useMemo(() => {
    const grouped: { [sector: string]: any[] } = {};
    competitors.forEach(comp => {
      if (!grouped[comp.sector]) {
        grouped[comp.sector] = [];
      }
      grouped[comp.sector].push(comp);
    });
    return grouped;
  }, [competitors]);

  // Get current sector competitors
  const currentCompetitors = competitorsBySector[activeSector] || [];

  // Get taken box numbers for current sector
  const takenBoxNumbers = currentCompetitors.map(c => c.boxNumber);

  // Get available boxes for form
  const availableBoxes = useMemo(() => {
    if (isEditing && selectedCompetitor) {
      // When editing, include current box number
      const otherTakenBoxes = takenBoxNumbers.filter(box => box !== selectedCompetitor.boxNumber);
      return generateAvailableBoxes(formData.sector, otherTakenBoxes);
    }
    return generateAvailableBoxes(formData.sector, competitorsBySector[formData.sector]?.map(c => c.boxNumber) || []);
  }, [formData.sector, competitorsBySector, isEditing, selectedCompetitor, takenBoxNumbers]);

  // Filter competitors
  const filteredCompetitors = useMemo(() => {
    if (!searchQuery) return currentCompetitors;
    
    const query = searchQuery.toLowerCase();
    return currentCompetitors.filter(comp => 
      comp.fullName.toLowerCase().includes(query) ||
      comp.equipe.toLowerCase().includes(query) ||
      comp.boxCode.toLowerCase().includes(query)
    );
  }, [currentCompetitors, searchQuery]);

  // Update selected competitor when ID or competitors change
  useEffect(() => {
    const competitor = selectedCompetitorId 
      ? currentCompetitors.find(c => c.id === selectedCompetitorId)
      : null;
    setSelectedCompetitor(competitor);
  }, [selectedCompetitorId, currentCompetitors]);

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

  const handleRowSelect = (competitorId: string) => {
    setSelectedCompetitorId(competitorId);
    setIsEditorCollapsed(false);
    
    const competitor = currentCompetitors.find(c => c.id === competitorId);
    if (competitor) {
      setIsEditing(true);
      setFormData({
        sector: competitor.sector,
        boxNumber: competitor.boxNumber,
        fullName: competitor.fullName,
        equipe: competitor.equipe,
        photo: competitor.photo
      });
      setPhotoPreview(competitor.photo);
    }
    setErrors({});
  };

  const handleAddNew = () => {
    setSelectedCompetitorId(null);
    setIsEditing(false);
    setFormData({
      sector: activeSector,
      boxNumber: availableBoxes[0]?.value || 1,
      fullName: '',
      equipe: '',
      photo: ''
    });
    setPhotoPreview(null);
    setErrors({});
    setIsEditorCollapsed(false);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nom et prénom requis';
    }

    if (!formData.equipe.trim()) {
      newErrors.equipe = 'Équipe requise';
    }

    // Check for duplicate box number
    const existingCompetitor = competitorsBySector[formData.sector]?.find(c => 
      c.boxNumber === formData.boxNumber && c.id !== selectedCompetitorId
    );
    if (existingCompetitor) {
      newErrors.boxNumber = `Box ${formData.sector}${String(formData.boxNumber).padStart(2, '0')} est déjà prise par ${existingCompetitor.fullName}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    const competitorData = {
      id: selectedCompetitorId || `comp-${formData.sector.toLowerCase()}-${formData.boxNumber}`,
      sector: formData.sector,
      boxNumber: formData.boxNumber,
      boxCode: `${formData.sector}${String(formData.boxNumber).padStart(2, '0')}`,
      fullName: formData.fullName,
      equipe: formData.equipe,
      photo: formData.photo || `https://images.pexels.com/photos/${1000000 + Math.floor(Math.random() * 1000000)}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=150&h=150`,
      status: 'active' as 'active' | 'inactive'
    };

    try {
      await saveCompetitor(competitorData);
      
      setIsSaving(false);
      setSelectedCompetitorId(null);
      setIsEditing(false);
      setFormData({
        sector: activeSector,
        boxNumber: 1,
        fullName: '',
        equipe: '',
        photo: ''
      });
      setPhotoPreview(null);
      setErrors({});
    } catch (error) {
      console.error('Error saving competitor:', error);
      setIsSaving(false);
      alert('Erreur lors de la sauvegarde du compétiteur');
    }
  };

  const handleDelete = async () => {
    if (!selectedCompetitor) return;

    setIsSaving(true);

    try {
      await deleteCompetitor(selectedCompetitor.id);
      
      setIsSaving(false);
      setSelectedCompetitorId(null);
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setFormData({
        sector: activeSector,
        boxNumber: 1,
        fullName: '',
        equipe: '',
        photo: ''
      });
      setPhotoPreview(null);
    } catch (error) {
      console.error('Error deleting competitor:', error);
      setIsSaving(false);
      alert('Erreur lors de la suppression du compétiteur');
    }
  };

  const handleCancel = () => {
    setSelectedCompetitorId(null);
    setIsEditing(false);
    setFormData({
      sector: activeSector,
      boxNumber: 1,
      fullName: '',
      equipe: '',
      photo: ''
    });
    setPhotoPreview(null);
    setErrors({});
    setShowDeleteConfirm(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, photo: result }));
        status: 'active' as 'active' | 'inactive'
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Box N°', 'Nom et Prénom', 'Équipe', 'Dernière MAJ', 'Source', 'Statut'];
    const rows = filteredCompetitors.map(comp => [
      comp.boxCode,
      comp.fullName,
      comp.equipe,
      comp.updatedAt ? formatTime(comp.updatedAt.toDate()) : '',
      'Admin',
      comp.status || 'active'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `competitors-sector-${activeSector}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Compétiteurs</h1>
            <p className="text-gray-600 dark:text-gray-300">Gestion des compétiteurs par secteur</p>
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
              Secteur {sector} ({competitorsBySector[sector]?.length || 0})
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
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
            >
              <Download className="w-4 h-4 mr-1" />
              Exporter CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddNew}
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter un compétiteur
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="sticky left-0 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    BOX N°
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Photo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nom et Prénom
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Équipe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dernière MAJ
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
                  const isSelected = selectedCompetitorId === competitor.id;
                  
                  return (
                    <tr 
                      key={competitor.id}
                      className={`${isSelected ? 'ring-2 ring-ocean-500 bg-ocean-50 dark:bg-ocean-900/20' : ''} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                      onClick={() => handleRowSelect(competitor.id)}
                    >
                      <td className="sticky left-0 bg-white dark:bg-gray-900 px-4 py-4 border-r border-gray-200 dark:border-gray-700">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-ocean-600 hover:bg-ocean-100 dark:hover:bg-ocean-900/20">
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">{competitor.boxCode}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <CompetitorAvatar
                          photo={competitor.photo}
                          name={competitor.fullName}
                          sector={competitor.sector}
                          size="md"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {competitor.fullName}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-gray-900 dark:text-white">
                          {competitor.equipe}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {competitor.updatedAt ? (
                          <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                            {formatTime(competitor.updatedAt.toDate())}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs">
                          Admin
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge 
                          variant="secondary" 
                          className={competitor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {competitor.status === 'active' ? 'Actif' : 'Inactif'}
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
                    {isEditing ? 'Modifier Compétiteur' : 'Nouveau Compétiteur'}
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
                  {/* Sector Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Secteur *
                    </label>
                    <select
                      value={formData.sector}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        sector: e.target.value,
                        boxNumber: 1 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {sectors.map(sector => (
                        <option key={sector} value={sector}>Secteur {sector}</option>
                      ))}
                    </select>
                  </div>

                  {/* Box Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      BOX N° *
                    </label>
                    <select
                      value={formData.boxNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, boxNumber: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {availableBoxes.map(box => (
                        <option key={box.value} value={box.value}>{box.label}</option>
                      ))}
                    </select>
                    {errors.boxNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.boxNumber}</p>
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom et Prénom *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Nom et prénom du compétiteur"
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Team */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Équipe *
                    </label>
                    <input
                      type="text"
                      value={formData.equipe}
                      onChange={(e) => setFormData(prev => ({ ...prev, equipe: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Nom de l'équipe"
                    />
                    {errors.equipe && (
                      <p className="text-red-500 text-xs mt-1">{errors.equipe}</p>
                    )}
                  </div>

                  {/* Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Photo
                    </label>
                    <div className="space-y-3">
                      {photoPreview && (
                        <div className="flex justify-center">
                          <CompetitorAvatar
                            photo={photoPreview}
                            name={formData.fullName || 'Preview'}
                            sector={formData.sector}
                            size="xl"
                            className="w-20 h-20"
                          />
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label
                          htmlFor="photo-upload"
                          className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choisir une photo
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      className="w-full"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Sauvegarder
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
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Êtes-vous sûr de vouloir supprimer <strong>{selectedCompetitor?.fullName}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </>
  );
}
