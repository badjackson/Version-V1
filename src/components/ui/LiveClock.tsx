'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit', 
      second: '2-digit',
      timeZone: 'Africa/Tunis',
      hour12: false
    });
  };

  if (!mounted || !time) {
    return (
      <div className="flex items-center space-x-2 text-sm font-mono">
        <Clock className="w-4 h-4 text-ocean-600" />
        <span className="text-gray-700 dark:text-gray-300">--:--:--</span>
        <span className="text-xs text-gray-500">Raoued</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm font-mono">
      <Clock className="w-4 h-4 text-ocean-600" />
      <span className="text-gray-700 dark:text-gray-300">{formatTime(time)}</span>
      <span className="text-xs text-gray-500">Raoued</span>
    </div>
  );
}