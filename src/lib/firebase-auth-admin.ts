import { 
  createUserWithEmailAndPassword,
  updatePassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface JudgeAuthData {
  id?: string;
  name: string;
  email: string;
  password: string;
  sector: string | null;
  role: 'admin' | 'judge';
  status: 'active' | 'inactive';
}

export class FirebaseAuthAdmin {
  // Create user in Firebase Auth and Firestore
  static async createJudge(judgeData: JudgeAuthData) {
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        judgeData.email, 
        judgeData.password
      );
      
      const user = userCredential.user;
      
      // 2. Create judge document in Firestore with UID as ID
      const judgeDoc = {
        uid: user.uid,
        role: judgeData.role,
        sector: judgeData.sector,
        name: judgeData.name,
        username: judgeData.email.split('@')[0],
        email: judgeData.email,
        status: judgeData.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'judges', user.uid), judgeDoc);
      
      // 3. Sign out the newly created user (admin stays logged in)
      await signOut(auth);
      
      return { 
        success: true, 
        uid: user.uid,
        message: `Juge ${judgeData.name} créé avec succès`
      };
    } catch (error: any) {
      console.error('Error creating judge:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        return { 
          success: false, 
          error: 'Cette adresse email est déjà utilisée' 
        };
      } else if (error.code === 'auth/weak-password') {
        return { 
          success: false, 
          error: 'Le mot de passe est trop faible (minimum 6 caractères)' 
        };
      } else if (error.code === 'auth/invalid-email') {
        return { 
          success: false, 
          error: 'Adresse email invalide' 
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Erreur lors de la création du juge' 
      };
    }
  }

  // Update judge in Firestore only (Auth email/password update requires re-auth)
  static async updateJudge(uid: string, judgeData: Partial<JudgeAuthData>) {
    try {
      // Update judge document in Firestore
      const updateData = {
        ...judgeData,
        updatedAt: serverTimestamp()
      };
      
      // Remove password from Firestore update (handled separately)
      delete updateData.password;
      
      await setDoc(doc(db, 'judges', uid), updateData, { merge: true });
      
      return { 
        success: true,
        message: `Juge ${judgeData.name} mis à jour avec succès`
      };
    } catch (error: any) {
      console.error('Error updating judge:', error);
      return { 
        success: false, 
        error: error.message || 'Erreur lors de la mise à jour du juge' 
      };
    }
  }

  // Delete judge from both Auth and Firestore
  static async deleteJudge(uid: string, email: string, password: string) {
    try {
      // Note: Deleting a user from Firebase Auth requires the user to be signed in
      // This is a limitation - in production, you'd need Admin SDK server-side
      
      // For now, we'll just delete from Firestore
      await deleteDoc(doc(db, 'judges', uid));
      
      return { 
        success: true,
        message: 'Juge supprimé de Firestore (Auth nécessite Admin SDK côté serveur)'
      };
    } catch (error: any) {
      console.error('Error deleting judge:', error);
      return { 
        success: false, 
        error: error.message || 'Erreur lors de la suppression du juge' 
      };
    }
  }

  // Get all judges from Firestore
  static async getAllJudges() {
    try {
      const querySnapshot = await getDocs(collection(db, 'judges'));
      const judges = querySnapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      }));
      
      return { success: true, judges };
    } catch (error: any) {
      console.error('Error getting judges:', error);
      return { 
        success: false, 
        error: error.message || 'Erreur lors de la récupération des juges',
        judges: []
      };
    }
  }

  // Check if email is available
  static async isEmailAvailable(email: string, excludeUid?: string) {
    try {
      const q = query(
        collection(db, 'judges'), 
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(q);
      
      // If excluding a UID (for updates), filter it out
      const existingJudges = querySnapshot.docs.filter(doc => 
        excludeUid ? doc.id !== excludeUid : true
      );
      
      return existingJudges.length === 0;
    } catch (error) {
      console.error('Error checking email availability:', error);
      return false;
    }
  }

  // Validate judge data
  static validateJudgeData(judgeData: JudgeAuthData, isEditing = false, excludeUid?: string) {
    const errors: { [key: string]: string } = {};

    if (!judgeData.name?.trim()) {
      errors.name = 'Nom et prénom requis';
    }

    if (!judgeData.email?.trim()) {
      errors.email = 'Adresse email requise';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(judgeData.email)) {
      errors.email = 'Adresse email invalide';
    }

    if (!isEditing && !judgeData.password?.trim()) {
      errors.password = 'Mot de passe requis';
    } else if (judgeData.password && judgeData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    return errors;
  }
}