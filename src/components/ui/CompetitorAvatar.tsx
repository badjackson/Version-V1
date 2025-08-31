'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompetitorAvatarProps {
  photo?: string;
  name: string;
  sector?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function CompetitorAvatar({ 
  photo, 
  name, 
  sector, 
  className,
  size = 'md'
}: CompetitorAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6', 
    xl: 'w-8 h-8'
  };

  const getSectorColor = (sector?: string) => {
    if (!sector) return 'bg-gray-500';
    
    const colors: { [key: string]: string } = {
      A: 'bg-sectors-A',
      B: 'bg-sectors-B', 
      C: 'bg-sectors-C',
      D: 'bg-sectors-D',
      E: 'bg-sectors-E',
      F: 'bg-sectors-F',
    };
    return colors[sector] || 'bg-gray-500';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasValidPhoto = photo && photo.trim() !== '' && !imageError;

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {hasValidPhoto ? (
        <img 
          src={photo} 
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
      ) : (
        <div className={cn(
          'w-full h-full flex items-center justify-center text-white font-semibold',
          getSectorColor(sector)
        )}>
          {name ? (
            <span className="text-sm">
              {getInitials(name)}
            </span>
          ) : (
            <User className={iconSizes[size]} />
          )}
        </div>
      )}
    </Avatar>
  );
}