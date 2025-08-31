'use client';

import { useThemeContext } from '@/components/providers/ThemeProvider';

export function useTheme() {
  const { theme, setTheme } = useThemeContext();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return { theme, toggleTheme, setTheme };
}