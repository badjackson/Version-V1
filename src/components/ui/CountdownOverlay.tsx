'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/components/providers/FirestoreSyncProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Volume2 } from 'lucide-react';

interface CompetitionSettings {
  startDateTime: string;
  endDateTime: string;
  soundEnabled: boolean;
}

export default function CountdownOverlay() {
  const { competitionSettings: firestoreCompetitionSettings } = useFirestore();
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(60);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!firestoreCompetitionSettings?.startDateTime || !mounted) return;

    const checkCountdown = () => {
      const now = new Date();
      const startTime = new Date(firestoreCompetitionSettings.startDateTime);
      const timeUntilStart = startTime.getTime() - now.getTime();
      const secondsUntilStart = Math.floor(timeUntilStart / 1000);

      // Start countdown at exactly T-60
      if (secondsUntilStart <= 60 && secondsUntilStart > 0 && !showCountdown) {
        setShowCountdown(true);
        setCountdownSeconds(secondsUntilStart);
      }

      // Update countdown if active
      if (showCountdown && secondsUntilStart > 0) {
        setCountdownSeconds(secondsUntilStart);
      }

      // End countdown
      if (showCountdown && secondsUntilStart <= 0) {
        setCountdownSeconds(0);
        
        // Show "GO!" for 3 seconds then hide
        setTimeout(() => {
          setShowCountdown(false);
        }, 3000);
      }
    };

    const timer = setInterval(checkCountdown, 1000);
    checkCountdown(); // Initial check

    return () => clearInterval(timer);
  }, [firestoreCompetitionSettings, showCountdown, mounted]);

  // Play sound effect
  useEffect(() => {
    if (!firestoreCompetitionSettings?.soundEnabled || !showCountdown) return;

    if (countdownSeconds <= 10 && countdownSeconds > 0) {
      // Beep for last 10 seconds
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio fails
    } else if (countdownSeconds === 0) {
      // Horn sound for "GO!"
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }, [countdownSeconds, firestoreCompetitionSettings?.soundEnabled, showCountdown]);

  if (!mounted || !firestoreCompetitionSettings) return null;

  return (
    <AnimatePresence>
      {showCountdown && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center text-white"
          >
            {countdownSeconds > 0 ? (
              <>
                <motion.div
                  key={countdownSeconds}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-9xl md:text-[12rem] font-bold mb-8"
                  style={{
                    textShadow: '0 0 30px rgba(255,255,255,0.5)',
                    color: countdownSeconds <= 10 ? '#ef4444' : '#ffffff'
                  }}
                >
                  {countdownSeconds}
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center space-x-3 text-2xl md:text-3xl font-semibold">
                    <Timer className="w-8 h-8" />
                    <span>Début de la compétition</span>
                  </div>
                  
                  <div className="text-lg md:text-xl text-gray-300">
                    Préparez-vous pour le démarrage
                  </div>
                  
                  {competitionSettings?.soundEnabled && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                      <Volume2 className="w-4 h-4" />
                      <span>Son activé</span>
                    </div>
                  )}
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-6"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    color: ['#22c55e', '#16a34a', '#22c55e']
                  }}
                  transition={{ duration: 1, repeat: 2 }}
                  className="text-8xl md:text-[10rem] font-bold"
                  style={{ textShadow: '0 0 40px rgba(34,197,94,0.8)' }}
                >
                  GO!
                </motion.div>
                
                <div className="text-2xl md:text-3xl font-semibold text-green-400">
                  Compétition démarrée !
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}