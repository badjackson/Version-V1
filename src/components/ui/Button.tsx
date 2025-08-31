'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-ocean-600 hover:bg-ocean-700 text-white shadow-sm',
      secondary: 'bg-sand-500 hover:bg-sand-600 text-white shadow-sm',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-900 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-900 dark:hover:bg-gray-800 dark:text-gray-100',
      destructive: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4',
      lg: 'h-12 px-6 text-lg',
    };

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;