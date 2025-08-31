'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { logoutFromFirebase } from '@/lib/auth';
import { JudgeService } from '@/lib/firestore-services';

export interface UserSession {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'judge';
  sector?: string | null;
  loginTime: string;
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get judge data from Firestore
          const judgeData = await JudgeService.getJudgeByUid(user.uid);
          
          if (judgeData && judgeData.status === 'active') {
            const userSession: UserSession = {
              id: user.uid,
              name: judgeData.name,
              username: judgeData.username,
              role: judgeData.role,
              sector: judgeData.sector,
              loginTime: new Date().toISOString()
            };
            setCurrentUser(userSession);
          } else {
            // Fallback for admin or if judge doc doesn't exist
            const isAdmin = user.email === 'admin@titaniumopen.com' || 
                           user.email === 'admin@titanium-f7b50.com';
            
            const userSession: UserSession = {
              id: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'Unknown',
              username: user.email?.split('@')[0] || 'unknown',
              role: isAdmin ? 'admin' : 'judge',
              sector: isAdmin ? null : 'A',
              loginTime: new Date().toISOString()
            };
            setCurrentUser(userSession);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });
              // Fallback for admin or if judge doc doesn't exist - check email for admin
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser') {
        if (e.newValue) {
          try {
            const user = JSON.parse(e.newValue);
            setCurrentUser(user);
          } catch (error) {
            // Fallback on error - still allow admin access
            if (user.email === 'admin@titanium-f7b50.com') {
              const userSession: UserSession = {
                id: user.uid,
                name: 'Admin User',
                username: 'admin',
                role: 'admin',
                sector: null,
                loginTime: new Date().toISOString()
              };
              setCurrentUser(userSession);
            } else {
              setCurrentUser(null);
            }
          }
        } else {
          setCurrentUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = async () => {
    try {
      await logoutFromFirebase();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    currentUser,
    isLoading,
    logout,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    isJudge: currentUser?.role === 'judge',
    assignedSector: currentUser?.sector
  };
}