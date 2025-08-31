'use client';

import { useEffect, ReactNode, useState, useCallback, createContext, useContext } from 'react';
import { subscribeHourlyAll, subscribeBigCatchAll } from '@/lib/firestore-entries';
import { 
  CompetitorService,
  HourlyEntryService,
  BigCatchService,
  JudgeService,
  CompetitionSettingsService,
  PublicAppearanceService,
  auditLog,
  type CompetitorDoc,
  type HourlyEntryDoc,
  type BigCatchDoc,
  type JudgeDoc,
  type CompetitionSettingsDoc,
  type PublicAppearanceSettingsDoc
} from '@/lib/firestore-services';

interface FirestoreContextType {
  // Data
  competitors: CompetitorDoc[];
  judges: JudgeDoc[];
  hourlyEntries: HourlyEntryDoc[];
  bigCatches: BigCatchDoc[];
  competitionSettings: CompetitionSettingsDoc | null;
  publicAppearanceSettings: PublicAppearanceSettingsDoc | null;
  
  // Loading states
  competitorsLoading: boolean;
  judgesLoading: boolean;
  hourlyEntriesLoading: boolean;
  bigCatchesLoading: boolean;
  
  // Actions
  saveCompetitor: (competitor: Omit<CompetitorDoc, 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteCompetitor: (id: string) => Promise<void>;
  saveJudge: (judge: Omit<JudgeDoc, 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteJudge: (uid: string) => Promise<void>;
  saveHourlyEntry: (entry: Omit<HourlyEntryDoc, 'timestamp'>) => Promise<void>;
  saveBigCatch: (entry: Omit<BigCatchDoc, 'timestamp'>) => Promise<void>;
  saveCompetitionSettings: (settings: Omit<CompetitionSettingsDoc, 'updatedAt'>) => Promise<void>;
  savePublicAppearanceSettings: (settings: Omit<PublicAppearanceSettingsDoc, 'updatedAt'>) => Promise<void>;
  auditLog: (entry: any) => Promise<void>;
}

const FirestoreContext = createContext<FirestoreContextType | undefined>(undefined);

export function useFirestore() {
  const context = useContext(FirestoreContext);
  if (!context) {
    throw new Error('useFirestore must be used within a FirestoreSyncProvider');
  }
  return context;
}

export default function FirestoreSyncProvider({ children }: { children: ReactNode }) {
  // Data states
  const [competitors, setCompetitors] = useState<CompetitorDoc[]>([]);
  const [judges, setJudges] = useState<JudgeDoc[]>([]);
  const [hourlyEntries, setHourlyEntries] = useState<HourlyEntryDoc[]>([]);
  const [bigCatches, setBigCatches] = useState<BigCatchDoc[]>([]);
  const [competitionSettings, setCompetitionSettings] = useState<CompetitionSettingsDoc | null>(null);
  const [publicAppearanceSettings, setPublicAppearanceSettings] = useState<PublicAppearanceSettingsDoc | null>(null);
  
  // Loading states
  const [competitorsLoading, setCompetitorsLoading] = useState(true);
  const [judgesLoading, setJudgesLoading] = useState(true);
  const [hourlyEntriesLoading, setHourlyEntriesLoading] = useState(true);
  const [bigCatchesLoading, setBigCatchesLoading] = useState(true);

  // Debug: Log judges data
  useEffect(() => {
    console.log('Firestore judges updated:', judges.length, judges);
  }, [judges]);

  useEffect(() => {
    // Subscribe to competitors
    const unsubscribeCompetitors = CompetitorService.subscribeToCompetitors((data) => {
      setCompetitors(data);
      setCompetitorsLoading(false);
    });

    // Subscribe to judges
    const unsubscribeJudges = JudgeService.subscribeToJudges((data) => {
      console.log('Judges subscription update:', data.length, data);
      setJudges(data);
      setJudgesLoading(false);
    });

    // Subscribe to hourly entries
    const unsubscribeHourlyEntries = HourlyEntryService.subscribeToHourlyEntries((data) => {
      setHourlyEntries(data);
      setHourlyEntriesLoading(false);
    });

    // Subscribe to big catches
    const unsubscribeBigCatches = BigCatchService.subscribeToBigCatches((data) => {
      setBigCatches(data);
      setBigCatchesLoading(false);
    });

    // Subscribe to competition settings
    const unsubscribeCompetitionSettings = CompetitionSettingsService.subscribeToSettings((data) => {
      setCompetitionSettings(data);
    });

    // Subscribe to public appearance settings
    const unsubscribePublicAppearance = PublicAppearanceService.subscribeToSettings((data) => {
      setPublicAppearanceSettings(data);
    });

    return () => {
      unsubscribeCompetitors();
      unsubscribeJudges();
      unsubscribeHourlyEntries();
      unsubscribeBigCatches();
      unsubscribeCompetitionSettings();
      unsubscribePublicAppearance();
    };
  }, []);

  // Initialize competitors if empty
  useEffect(() => {
    if (competitors.length === 0 && !competitorsLoading) {
      initializeCompetitors();
    }
  }, [competitors.length, competitorsLoading]);

  const initializeCompetitors = async () => {
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

    for (const comp of officialCompetitors) {
      const competitorData: Omit<CompetitorDoc, 'createdAt' | 'updatedAt'> = {
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
        await CompetitorService.saveCompetitor(competitorData);
      } catch (error) {
        console.error('Error initializing competitor:', error);
      }
    }
  };

  // Action functions
  const saveCompetitor = useCallback(async (competitor: Omit<CompetitorDoc, 'createdAt' | 'updatedAt'>) => {
    try {
      await CompetitorService.saveCompetitor(competitor);
    } catch (error) {
      console.error('Error saving competitor:', error);
      throw error;
    }
  }, []);

  const deleteCompetitor = useCallback(async (id: string) => {
    try {
      await CompetitorService.deleteCompetitor(id);
    } catch (error) {
      console.error('Error deleting competitor:', error);
      throw error;
    }
  }, []);

  const saveJudge = useCallback(async (judge: Omit<JudgeDoc, 'createdAt' | 'updatedAt'>) => {
    try {
      await JudgeService.saveJudge(judge);
    } catch (error) {
      console.error('Error saving judge:', error);
      throw error;
    }
  }, []);

  const deleteJudge = useCallback(async (uid: string) => {
    try {
      await JudgeService.deleteJudge(uid);
    } catch (error) {
      console.error('Error deleting judge:', error);
      throw error;
    }
  }, []);

  const saveHourlyEntry = useCallback(async (entry: Omit<HourlyEntryDoc, 'timestamp'>) => {
    try {
      await HourlyEntryService.saveHourlyEntry(entry);
    } catch (error) {
      console.error('Error saving hourly entry:', error);
      throw error;
    }
  }, []);

  const saveBigCatch = useCallback(async (entry: Omit<BigCatchDoc, 'timestamp'>) => {
    try {
      await BigCatchService.saveBigCatch(entry);
    } catch (error) {
      console.error('Error saving big catch:', error);
      throw error;
    }
  }, []);

  const saveCompetitionSettingsData = useCallback(async (settings: Omit<CompetitionSettingsDoc, 'updatedAt'>) => {
    try {
      await CompetitionSettingsService.saveSettings(settings);
    } catch (error) {
      console.error('Error saving competition settings:', error);
      throw error;
    }
  }, []);

  const savePublicAppearanceSettingsData = useCallback(async (settings: Omit<PublicAppearanceSettingsDoc, 'updatedAt'>) => {
    try {
      await PublicAppearanceService.saveSettings(settings);
    } catch (error) {
      console.error('Error saving public appearance settings:', error);
      throw error;
    }
  }, []);

  const contextValue: FirestoreContextType = {
    // Data
    competitors,
    judges,
    hourlyEntries,
    bigCatches,
    competitionSettings,
    publicAppearanceSettings,
    
    // Loading states
    competitorsLoading,
    judgesLoading,
    hourlyEntriesLoading,
    bigCatchesLoading,
    
    // Actions
    saveCompetitor,
    deleteCompetitor,
    saveJudge,
    deleteJudge,
    saveHourlyEntry,
    saveBigCatch,
    saveCompetitionSettings: saveCompetitionSettingsData,
    savePublicAppearanceSettings: savePublicAppearanceSettingsData,
    auditLog
  };

  return (
    <FirestoreContext.Provider value={contextValue}>
      {children}
    </FirestoreContext.Provider>
  );
}