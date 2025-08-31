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
  HOURLY_DATA: 'hourlyData',
  GROSSE_PRISE: 'grossePrise',
  JUDGES: 'judges',
  USERS: 'users',
  COMPETITION_SETTINGS: 'competitionSettings',
  AUDIT_LOG: 'auditLog'
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
  lastUpdate: Timestamp;
  source: 'Admin';
  status: 'active' | 'inactive';
}

// Hourly data interface
export interface HourlyDataDoc {
  id: string;
  competitorId: string;
  sector: string;
  hour: number;
  boxNumber: number;
  fishCount: number;
  totalWeight: number;
  status: 'empty' | 'in_progress' | 'locked_judge' | 'locked_admin' | 'offline_judge' | 'offline_admin' | 'error';
  timestamp: Timestamp;
  source: 'Judge' | 'Admin';
  syncRetries?: number;
  errorMessage?: string;
}

// Grosse prise interface
export interface GrossePriseDoc {
  id: string;
  competitorId: string;
  sector: string;
  boxNumber: number;
  biggestCatch: number;
  status: 'empty' | 'in_progress' | 'locked_judge' | 'locked_admin' | 'offline_judge' | 'offline_admin' | 'error';
  timestamp: Timestamp;
  source: 'Judge' | 'Admin';
  syncRetries?: number;
  errorMessage?: string;
}

// Judge interface
export interface JudgeDoc {
  id: string;
  fullName: string;
  sector: string | null;
  username: string;
  password: string;
  lastLogin?: Timestamp;
  status: 'active' | 'inactive';
}

// User interface
export interface UserDoc {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'judge';
  status: 'active' | 'inactive';
  password: string;
  lastLogin?: Timestamp;
  createdAt: Timestamp;
}

// Competition settings interface
export interface CompetitionSettingsDoc {
  id: string;
  startDateTime: string;
  endDateTime: string;
  soundEnabled: boolean;
  lastUpdate: Timestamp;
}

// Generic CRUD operations
export class FirestoreService {
  // Create or update document
  static async setDocument<T>(collectionName: string, docId: string, data: Partial<T>) {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, {
        ...data,
        lastUpdate: serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error(`Error setting document in ${collectionName}:`, error);
      return { success: false, error };
    }
  }

  // Get single document
  static async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      return null;
    }
  }

  // Get all documents from collection
  static async getCollection<T>(collectionName: string): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error(`Error getting collection ${collectionName}:`, error);
      return [];
    }
  }

  // Get documents with query
  static async getDocumentsWhere<T>(
    collectionName: string, 
    field: string, 
    operator: any, 
    value: any
  ): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), where(field, operator, value));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error);
      return [];
    }
  }

  // Delete document
  static async deleteDocument(collectionName: string, docId: string) {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      return { success: true };
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      return { success: false, error };
    }
  }

  // Listen to real-time updates
  static subscribeToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    errorCallback?: (error: Error) => void
  ) {
    try {
      const unsubscribe = onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as T[];
          callback(data);
        },
        (error) => {
          console.error(`Error listening to ${collectionName}:`, error);
          if (errorCallback) errorCallback(error);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up listener for ${collectionName}:`, error);
      if (errorCallback) errorCallback(error as Error);
      return () => {};
    }
  }

  // Listen to single document
  static subscribeToDocument<T>(
    collectionName: string,
    docId: string,
    callback: (data: T | null) => void,
    errorCallback?: (error: Error) => void
  ) {
    try {
      const unsubscribe = onSnapshot(
        doc(db, collectionName, docId),
        (doc) => {
          if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() } as T);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error(`Error listening to document ${docId} in ${collectionName}:`, error);
          if (errorCallback) errorCallback(error);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up document listener for ${collectionName}/${docId}:`, error);
      if (errorCallback) errorCallback(error as Error);
      return () => {};
    }
  }
}

// Specialized services for each data type
export class CompetitorService {
  static async saveCompetitor(competitor: Omit<CompetitorDoc, 'lastUpdate'>) {
    return FirestoreService.setDocument(COLLECTIONS.COMPETITORS, competitor.id, competitor);
  }

  static async getCompetitor(id: string) {
    return FirestoreService.getDocument<CompetitorDoc>(COLLECTIONS.COMPETITORS, id);
  }

  static async getAllCompetitors() {
    return FirestoreService.getCollection<CompetitorDoc>(COLLECTIONS.COMPETITORS);
  }

  static async getCompetitorsBySector(sector: string) {
    return FirestoreService.getDocumentsWhere<CompetitorDoc>(
      COLLECTIONS.COMPETITORS, 
      'sector', 
      '==', 
      sector
    );
  }

  static subscribeToCompetitors(callback: (competitors: CompetitorDoc[]) => void) {
    return FirestoreService.subscribeToCollection(COLLECTIONS.COMPETITORS, callback);
  }

  static async deleteCompetitor(id: string) {
    return FirestoreService.deleteDocument(COLLECTIONS.COMPETITORS, id);
  }
}

export class HourlyDataService {
  static async saveHourlyEntry(entry: Omit<HourlyDataDoc, 'lastUpdate'>) {
    const docId = `${entry.sector}_${entry.hour}_${entry.competitorId}`;
    return FirestoreService.setDocument(COLLECTIONS.HOURLY_DATA, docId, entry);
  }

  static async getHourlyEntry(sector: string, hour: number, competitorId: string) {
    const docId = `${sector}_${hour}_${competitorId}`;
    return FirestoreService.getDocument<HourlyDataDoc>(COLLECTIONS.HOURLY_DATA, docId);
  }

  static async getHourlyDataBySector(sector: string) {
    return FirestoreService.getDocumentsWhere<HourlyDataDoc>(
      COLLECTIONS.HOURLY_DATA,
      'sector',
      '==',
      sector
    );
  }

  static async getAllHourlyData() {
    return FirestoreService.getCollection<HourlyDataDoc>(COLLECTIONS.HOURLY_DATA);
  }

  static subscribeToHourlyData(callback: (data: HourlyDataDoc[]) => void) {
    return FirestoreService.subscribeToCollection(COLLECTIONS.HOURLY_DATA, callback);
  }
}

export class GrossePriseService {
  static async saveGrossePriseEntry(entry: Omit<GrossePriseDoc, 'lastUpdate'>) {
    const docId = `${entry.sector}_${entry.competitorId}`;
    return FirestoreService.setDocument(COLLECTIONS.GROSSE_PRISE, docId, entry);
  }

  static async getGrossePriseEntry(sector: string, competitorId: string) {
    const docId = `${sector}_${competitorId}`;
    return FirestoreService.getDocument<GrossePriseDoc>(COLLECTIONS.GROSSE_PRISE, docId);
  }

  static async getGrossePriseBySector(sector: string) {
    return FirestoreService.getDocumentsWhere<GrossePriseDoc>(
      COLLECTIONS.GROSSE_PRISE,
      'sector',
      '==',
      sector
    );
  }

  static subscribeToGrossePrise(callback: (data: GrossePriseDoc[]) => void) {
    return FirestoreService.subscribeToCollection(COLLECTIONS.GROSSE_PRISE, callback);
  }
}

export class JudgeService {
  static async saveJudge(judge: Omit<JudgeDoc, 'lastUpdate'>) {
    return FirestoreService.setDocument(COLLECTIONS.JUDGES, judge.id, judge);
  }

  static async getAllJudges() {
    return FirestoreService.getCollection<JudgeDoc>(COLLECTIONS.JUDGES);
  }

  static subscribeToJudges(callback: (judges: JudgeDoc[]) => void) {
    return FirestoreService.subscribeToCollection(COLLECTIONS.JUDGES, callback);
  }

  static async deleteJudge(id: string) {
    return FirestoreService.deleteDocument(COLLECTIONS.JUDGES, id);
  }
}

export class UserService {
  static async saveUser(user: Omit<UserDoc, 'lastUpdate'>) {
    return FirestoreService.setDocument(COLLECTIONS.USERS, user.id, user);
  }

  static async getUser(id: string) {
    return FirestoreService.getDocument<UserDoc>(COLLECTIONS.USERS, id);
  }

  static async getUserByUsername(username: string) {
    const users = await FirestoreService.getDocumentsWhere<UserDoc>(
      COLLECTIONS.USERS,
      'username',
      '==',
      username
    );
    return users[0] || null;
  }

  static async getAllUsers() {
    return FirestoreService.getCollection<UserDoc>(COLLECTIONS.USERS);
  }

  static subscribeToUsers(callback: (users: UserDoc[]) => void) {
    return FirestoreService.subscribeToCollection(COLLECTIONS.USERS, callback);
  }
}

export class CompetitionSettingsService {
  static async saveSettings(settings: Omit<CompetitionSettingsDoc, 'lastUpdate'>) {
    return FirestoreService.setDocument(COLLECTIONS.COMPETITION_SETTINGS, 'main', settings);
  }

  static async getSettings() {
    return FirestoreService.getDocument<CompetitionSettingsDoc>(COLLECTIONS.COMPETITION_SETTINGS, 'main');
  }

  static subscribeToSettings(callback: (settings: CompetitionSettingsDoc | null) => void) {
    return FirestoreService.subscribeToDocument(COLLECTIONS.COMPETITION_SETTINGS, 'main', callback);
  }
}