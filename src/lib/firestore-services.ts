import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Collection names
export const COLLECTIONS = {
  COMPETITORS: 'competitors',
  HOURLY_ENTRIES: 'hourly_entries',
  BIG_CATCHES: 'big_catches',
  JUDGES: 'judges',
  COMPETITION_SETTINGS: 'competitionSettings',
  PUBLIC_APPEARANCE_SETTINGS: 'publicAppearanceSettings'
} as const;

// Competitor interface
export interface CompetitorDoc {
  id: string;
  sector: string;
  boxNumber: number;
  boxCode: string;
  fullName: string;
  equipe: string;
  photo: string;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Calculated fields (updated by AdminCalculsLive)
  nbPrisesGlobal?: number;
  poidsTotal?: number;
  grossePrise?: number;
  points?: number;
  coefficientSecteur?: number;
  classementSecteur?: number;
}

// Hourly entry interface
export interface HourlyEntryDoc {
  id: string;
  sector: string;
  hour: number;
  competitorId: string;
  boxNumber: number;
  fishCount: number;
  totalWeight: number;
  status: 'empty' | 'in_progress' | 'locked_judge' | 'locked_admin' | 'offline_judge' | 'offline_admin' | 'error';
  source: 'Judge' | 'Admin';
  updatedBy: string;
  timestamp: Timestamp;
}

// Big catch interface
export interface BigCatchDoc {
  id: string;
  sector: string;
  competitorId: string;
  boxNumber: number;
  biggestCatch: number;
  status: 'empty' | 'in_progress' | 'locked_judge' | 'locked_admin' | 'offline_judge' | 'offline_admin' | 'error';
  source: 'Judge' | 'Admin';
  updatedBy: string;
  timestamp: Timestamp;
}

// Judge interface
export interface JudgeDoc {
  uid: string;
  role: 'admin' | 'judge';
  sector: string | null;
  name: string;
  username: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Competition settings interface
export interface CompetitionSettingsDoc {
  id: string;
  startDateTime: string;
  endDateTime: string;
  soundEnabled: boolean;
  updatedAt: Timestamp;
}

// Public appearance settings interface
export interface PublicAppearanceSettingsDoc {
  id: string;
  logos: {
    light: string;
    dark: string;
  };
  sponsors: Array<{
    id: string;
    name: string;
    logo: string;
    tier: 'title' | 'gold' | 'silver' | 'bronze';
  }>;
  socialLinks: {
    youtube: string;
    facebook: string;
    instagram: string;
    website: string;
  };
  footerText: string;
  streamDescription: string;
  streamUrl: string;
  updatedAt: Timestamp;
}

// Competitor Service
export class CompetitorService {
  static async saveCompetitor(competitor: Omit<CompetitorDoc, 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = doc(db, COLLECTIONS.COMPETITORS, competitor.id);
      await setDoc(docRef, {
        ...competitor,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error saving competitor:', error);
      return { success: false, error };
    }
  }

  static async getAllCompetitors(): Promise<CompetitorDoc[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.COMPETITORS));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CompetitorDoc[];
    } catch (error) {
      console.error('Error getting competitors:', error);
      return [];
    }
  }

  static subscribeToCompetitors(callback: (competitors: CompetitorDoc[]) => void) {
    return onSnapshot(
      collection(db, COLLECTIONS.COMPETITORS),
      (snapshot) => {
        const competitors = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CompetitorDoc[];
        callback(competitors);
      },
      (error) => {
        console.error('Error listening to competitors:', error);
      }
    );
  }

  static async deleteCompetitor(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.COMPETITORS, id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting competitor:', error);
      return { success: false, error };
    }
  }
}

// Hourly Entry Service
export class HourlyEntryService {
  static async saveHourlyEntry(entry: Omit<HourlyEntryDoc, 'timestamp'>) {
    try {
      const docId = `${entry.sector}-${entry.hour}-${entry.competitorId}`;
      const docRef = doc(db, COLLECTIONS.HOURLY_ENTRIES, docId);
      await setDoc(docRef, {
        ...entry,
        id: docId,
        timestamp: serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error saving hourly entry:', error);
      return { success: false, error };
    }
  }

  static subscribeToHourlyEntries(callback: (entries: HourlyEntryDoc[]) => void) {
    return onSnapshot(
      collection(db, COLLECTIONS.HOURLY_ENTRIES),
      (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as HourlyEntryDoc[];
        callback(entries);
      },
      (error) => {
        console.error('Error listening to hourly entries:', error);
      }
    );
  }
}

// Big Catch Service
export class BigCatchService {
  static async saveBigCatch(entry: Omit<BigCatchDoc, 'timestamp'>) {
    try {
      const docId = `${entry.sector}-${entry.competitorId}`;
      const docRef = doc(db, COLLECTIONS.BIG_CATCHES, docId);
      await setDoc(docRef, {
        ...entry,
        id: docId,
        timestamp: serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error saving big catch:', error);
      return { success: false, error };
    }
  }

  static subscribeToBigCatches(callback: (entries: BigCatchDoc[]) => void) {
    return onSnapshot(
      collection(db, COLLECTIONS.BIG_CATCHES),
      (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BigCatchDoc[];
        callback(entries);
      },
      (error) => {
        console.error('Error listening to big catches:', error);
      }
    );
  }
}

// Judge Service
export class JudgeService {
  static async getAllJudges(): Promise<JudgeDoc[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.JUDGES));
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as JudgeDoc[];
    } catch (error) {
      console.error('Error getting all judges:', error);
      return [];
    }
  }

  static async saveJudge(judge: Omit<JudgeDoc, 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = doc(db, COLLECTIONS.JUDGES, judge.uid);
      await setDoc(docRef, {
        ...judge,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error saving judge:', error);
      return { success: false, error };
    }
  }

  static async getJudgeByUid(uid: string): Promise<JudgeDoc | null> {
    try {
      const docRef = doc(db, COLLECTIONS.JUDGES, uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { uid: docSnap.id, ...docSnap.data() } as JudgeDoc;
      }
      return null;
    } catch (error) {
      console.error('Error getting judge:', error);
      return null;
    }
  }

  static subscribeToJudges(callback: (judges: JudgeDoc[]) => void) {
    return onSnapshot(
      collection(db, COLLECTIONS.JUDGES),
      (snapshot) => {
        const judges = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as JudgeDoc[];
        callback(judges);
      },
      (error) => {
        console.error('Error listening to judges:', error);
      }
    );
  }

  static async deleteJudge(uid: string) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.JUDGES, uid));
      return { success: true };
    } catch (error) {
      console.error('Error deleting judge:', error);
      return { success: false, error };
    }
  }
}

// Competition Settings Service
export class CompetitionSettingsService {
  static async saveSettings(settings: Omit<CompetitionSettingsDoc, 'updatedAt'>) {
    try {
      const docRef = doc(db, COLLECTIONS.COMPETITION_SETTINGS, 'main');
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error saving competition settings:', error);
      return { success: false, error };
    }
  }

  static async getSettings(): Promise<CompetitionSettingsDoc | null> {
    try {
      const docRef = doc(db, COLLECTIONS.COMPETITION_SETTINGS, 'main');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as CompetitionSettingsDoc;
      }
      return null;
    } catch (error) {
      console.error('Error getting competition settings:', error);
      return null;
    }
  }

  static subscribeToSettings(callback: (settings: CompetitionSettingsDoc | null) => void) {
    return onSnapshot(
      doc(db, COLLECTIONS.COMPETITION_SETTINGS, 'main'),
      (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as CompetitionSettingsDoc);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to competition settings:', error);
      }
    );
  }
}

// Public Appearance Settings Service
export class PublicAppearanceService {
  static async saveSettings(settings: Omit<PublicAppearanceSettingsDoc, 'updatedAt'>) {
    try {
      const docRef = doc(db, COLLECTIONS.PUBLIC_APPEARANCE_SETTINGS, 'main');
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error saving public appearance settings:', error);
      return { success: false, error };
    }
  }

  static async getSettings(): Promise<PublicAppearanceSettingsDoc | null> {
    try {
      const docRef = doc(db, COLLECTIONS.PUBLIC_APPEARANCE_SETTINGS, 'main');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as PublicAppearanceSettingsDoc;
      }
      return null;
    } catch (error) {
      console.error('Error getting public appearance settings:', error);
      return null;
    }
  }

  static subscribeToSettings(callback: (settings: PublicAppearanceSettingsDoc | null) => void) {
    return onSnapshot(
      doc(db, COLLECTIONS.PUBLIC_APPEARANCE_SETTINGS, 'main'),
      (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as PublicAppearanceSettingsDoc);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to public appearance settings:', error);
        callback(null);
      }
    );
  }
}

// Export convenience functions for direct use
export const saveCompetitionSettings = CompetitionSettingsService.saveSettings;
export const savePublicAppearanceSettings = PublicAppearanceService.saveSettings;

// Audit Log Service
export interface AuditLogDoc {
  id: string;
  action: string;
  details: string;
  metadata?: any;
  timestamp: Timestamp;
  userId?: string;
}

export async function auditLog(entry: {
  action: string;
  details: string;
  metadata?: any;
  userId?: string;
}) {
  try {
    const docRef = doc(collection(db, 'auditLog'));
    await setDoc(docRef, {
      ...entry,
      id: docRef.id,
      timestamp: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving audit log:', error);
    return { success: false, error };
  }
}