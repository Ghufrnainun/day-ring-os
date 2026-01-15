import React from 'react';
import { cn } from '@/lib/utils';

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'simple' | 'numbered';
  number?: number;
  label?: string;
}

const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  className = '',
  variant = 'default',
  number,
  label,
}) => {
  const baseStyles =
    'relative bg-card/60 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden transition-all duration-300 group';

  if (variant === 'numbered' && number !== undefined) {
    return (
      <div className={cn('relative', className)}>
        {/* Number tab - Floating Style */}
        <div className="absolute -top-3 -left-3 z-20">
          <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold rounded-2xl shadow-lg border border-white/20">
            {number}
          </span>
        </div>
        <div
          className={cn(
            baseStyles,
            'rounded-[2rem] p-8 hover:shadow-2xl hover:-translate-y-1 hover:border-primary/20',
            className
          )}
        >
          {/* Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-50" />

          {children}
        </div>
      </div>
    );
  }

  if (variant === 'simple') {
    return (
      <div className="relative pt-2">
        {label && (
          <div className="absolute -top-1 left-6 z-20">
            <span className="inline-block px-3 py-1 bg-accent/90 backdrop-blur text-foreground text-[10px] uppercase tracking-wider font-bold rounded-full shadow-lg border border-white/20">
              {label}
            </span>
          </div>
        )}
        <div
          className={cn(
            baseStyles,
            'rounded-3xl p-6 hover:border-primary/20',
            className
          )}
        >
          {children}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        baseStyles,
        'rounded-[2rem] hover:shadow-2xl hover:scale-[1.005] hover:border-primary/20',
        className
      )}
    >
      {/* Top Highlight for Glass effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50" />

      {children}
    </div>
  );
};

export default PremiumCard;
