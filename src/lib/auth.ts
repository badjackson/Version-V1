import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface JudgeDoc {
  uid: string;
  role: 'admin' | 'judge';
  sector: string | null;
  name: string;
  username: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: any;
  updatedAt: any;
}

export interface UserSession {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'judge';
  sector?: string | null;
  loginTime: string;
}

// Username to email mapping
const usernameToEmail = (username: string): string => {
  const mappings: { [key: string]: string } = {
    'admin': 'admin@titaniumopen.com',
    'juge.a': 'juge.a@titaniumopen.com',
    'juge.b': 'juge.b@titaniumopen.com',
    'juge.c': 'juge.c@titaniumopen.com',
    'juge.d': 'juge.d@titaniumopen.com',
    'juge.e': 'juge.e@titaniumopen.com',
    'juge.f': 'juge.f@titaniumopen.com',
  };
  
  // If it's already an email, return as is
  if (username.includes('@')) {
    return username;
  }
  
  // Otherwise, map username to email
  return mappings[username] || username;
};

export const loginWithFirebase = async (username: string, password: string) => {
  try {
    const email = usernameToEmail(username);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get judge document from Firestore
    const judgeDoc = await getDoc(doc(db, 'judges', user.uid));
    
    if (!judgeDoc.exists()) {
      // If judge document doesn't exist, create a basic user session for now
      console.warn('Judge document not found for user:', user.uid);
      
      // Special handling for admin users
      const isAdmin = user.email === 'admin@titaniumopen.com' || 
                     user.email === 'admin@titaniumopen.com';
      
      const userData = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Unknown',
        username: user.email?.split('@')[0] || 'unknown',
        role: isAdmin ? 'admin' : 'judge',
        sector: isAdmin ? null : 'A',
        loginTime: new Date().toISOString()
      };
      
      // Store in localStorage
      localStorage.setItem('currentUserSession', JSON.stringify(userData));
      
      return { success: true, user: userData };
    }
    
    const judgeData = judgeDoc.data() as JudgeDoc;
    
    if (judgeData.status !== 'active') {
      throw new Error('User account is inactive');
    }
    
    // Create user session
    const userSession: UserSession = {
      id: user.uid,
      name: judgeData.name,
      username: judgeData.username,
      role: judgeData.role,
      sector: judgeData.sector,
      loginTime: new Date().toISOString()
    };
    
    // Store in localStorage for compatibility with existing code
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUserSession', JSON.stringify(userSession));
      sessionStorage.setItem('currentUserSessionBackup', JSON.stringify(userSession));
      localStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('isAuthenticated', 'true');
    }
    
    return { success: true, user: userSession };
  } catch (error: any) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.code === 'auth/invalid-credential' ? 'Identifiants invalides' : error.message 
    };
  }
};

export const logoutFromFirebase = async () => {
  try {
    await signOut(auth);
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUserSession');
      localStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('currentUserSessionBackup');
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.clear();
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Logout error:', error);
    
    // Handle offline error specifically
    if (error.message?.includes('client is offline') || error.code === 'unavailable') {
      return { 
        success: false, 
        error: 'Impossible de se connecter à Firebase. Vérifiez votre connexion internet et la configuration Firebase.' 
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Erreur de connexion inconnue' 
    };
  }
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};