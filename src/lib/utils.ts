import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)}kg`;
  }
  return `${grams}g`;
}

export function formatTime(date: Date): string {
  return date.toLocaleString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Africa/Tunis',
    hour12: false
  });
}

export function calculateCoefficient(
  totalPoints: number,
  totalFish: number,
  sectorTotalFish: number
): number {
  if (sectorTotalFish === 0) return 0;
  return totalPoints * (totalFish / sectorTotalFish);
}

export function calculatePoints(fishCount: number, totalWeight: number): number {
  return fishCount * 50 + totalWeight;
}

export function getSectorColor(sector: string): string {
  const colors: { [key: string]: string } = {
    A: '#3b82f6',
    B: '#10b981',
    C: '#f59e0b',
    D: '#ef4444',
    E: '#8b5cf6',
    F: '#06b6d4',
  };
  return colors[sector] || '#6b7280';
}

export function getFlagUrl(countryCode: string): string {
  return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}