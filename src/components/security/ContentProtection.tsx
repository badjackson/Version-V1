'use client';

import { useEffect } from 'react';

export default function ContentProtection() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showTooltip('La copie de contenu est désactivée');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common shortcuts
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'x' || e.key === 's' || e.key === 'u' || e.key === 'p')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'K')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        showTooltip('Les raccourcis clavier sont désactivés');
      }
    };

    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.matches('input, textarea, [contenteditable]')) {
        e.preventDefault();
      }
    };

    const showTooltip = (message: string) => {
      const tooltip = document.createElement('div');
      tooltip.className = 'fixed top-4 right-4 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm z-[10000] pointer-events-none';
      tooltip.textContent = message;
      document.body.appendChild(tooltip);
      
      setTimeout(() => {
        document.body.removeChild(tooltip);
      }, 2000);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    
    // Add protection class to body
    document.body.classList.add('content-protection');

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.body.classList.remove('content-protection');
    };
  }, []);

  return null;
}