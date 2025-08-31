import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-ocean-600 text-white',
      secondary: 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
      destructive: 'bg-red-600 text-white',
      outline: 'border border-gray-300 bg-transparent text-gray-900 dark:border-gray-600 dark:text-gray-100',
    };

    return (
      <div
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };