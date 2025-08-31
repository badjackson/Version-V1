'use client';

import { useState, useEffect } from 'react';
import { Calendar, Cloud, Sun, CloudRain, CloudSnow } from 'lucide-react';

export default function PublicDateWeather() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [weather, setWeather] = useState({
    temp: 22,
    condition: 'sunny',
    humidity: 65,
    wind: 12
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date());
    
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Africa/Tunis'
    });
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="w-4 h-4 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="w-4 h-4 text-blue-500" />;
      case 'snowy':
        return <CloudSnow className="w-4 h-4 text-blue-300" />;
      default:
        return <Sun className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return 'Ensoleillé';
      case 'cloudy':
        return 'Nuageux';
      case 'rainy':
        return 'Pluvieux';
      case 'snowy':
        return 'Neigeux';
      default:
        return 'Ensoleillé';
    }
  };

  if (!mounted || !currentDate) {
    return (
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-ocean-600" />
          <span className="text-gray-700 dark:text-gray-300">Chargement...</span>
        </div>
        <div className="flex items-center space-x-2">
          <Cloud className="w-4 h-4 text-gray-500" />
          <span className="text-gray-700 dark:text-gray-300">--°C</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4 text-sm">
      {/* Date */}
      <div className="flex items-center space-x-2">
        <Calendar className="w-4 h-4 text-ocean-600" />
        <span className="text-gray-700 dark:text-gray-300 capitalize">
          {formatDate(currentDate)}
        </span>
      </div>
      
      {/* Weather */}
      <div className="flex items-center space-x-2">
        {getWeatherIcon(weather.condition)}
        <span className="text-gray-700 dark:text-gray-300">
          {weather.temp}°C
        </span>
        <span className="text-xs text-gray-500">
          Raoued
        </span>
      </div>
    </div>
  );
}