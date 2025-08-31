'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';

export default function CompetitionTimer() {
  const t = useTranslations('common');
  const [timeLeft, setTimeLeft] = useState({
    hours: 4,
    minutes: 32,
    seconds: 15,
  });
  const [isRunning, setIsRunning] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          setIsRunning(false);
          return prev;
        }

        let newSeconds = prev.seconds - 1;
        let newMinutes = prev.minutes;
        let newHours = prev.hours;

        if (newSeconds < 0) {
          newSeconds = 59;
          newMinutes -= 1;
        }

        if (newMinutes < 0) {
          newMinutes = 59;
          newHours -= 1;
        }

        if (newHours < 0) {
          newHours = 0;
          newMinutes = 0;
          newSeconds = 0;
        }

        return {
          hours: newHours,
          minutes: newMinutes,
          seconds: newSeconds,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-coral-600" />
            <span>Competition Timer</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-2">
              --:--:--
            </div>
            <Badge variant="secondary">Loading...</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isTimeRunningOut = timeLeft.hours === 0 && timeLeft.minutes < 30;
  const isTimeUp = timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-coral-600" />
            <span>Competition Timer</span>
          </div>
          <div className="flex items-center space-x-2">
            {isTimeUp ? (
              <Badge variant="destructive">Time Up!</Badge>
            ) : isTimeRunningOut ? (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Final 30 Minutes
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <div className={`text-6xl font-mono font-bold mb-4 ${
            isTimeUp ? 'text-red-600' : 
            isTimeRunningOut ? 'text-yellow-600' : 
            'text-gray-900 dark:text-white'
          }`}>
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Time Remaining
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {timeLeft.hours}
              </div>
              <div className="text-xs text-gray-500">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {timeLeft.minutes}
              </div>
              <div className="text-xs text-gray-500">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {timeLeft.seconds}
              </div>
              <div className="text-xs text-gray-500">Seconds</div>
            </div>
          </div>

          {/* Competition Info */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">Start Time</div>
                <div className="text-gray-600 dark:text-gray-400">08:00 AM</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">End Time</div>
                <div className="text-gray-600 dark:text-gray-400">16:00 PM</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}