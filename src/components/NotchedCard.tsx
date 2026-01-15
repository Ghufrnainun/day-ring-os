import React from 'react';

interface NotchedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'simple' | 'numbered';
  number?: number;
  label?: string;
}

const NotchedCard: React.FC<NotchedCardProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  number,
  label
}) => {
  if (variant === 'numbered' && number !== undefined) {
    return (
      <div className={`relative ${className}`}>
        {/* Number tab */}
        <div className="absolute -top-3 left-6 z-10">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground text-sm font-bold rounded-lg shadow-soft">
            {number}
          </span>
        </div>
        <div className="notched-card p-6 pt-8">
          {children}
        </div>
      </div>
    );
  }

  if (variant === 'simple') {
    return (
      <div className={`notched-card-simple ${className}`}>
        {label && (
          <div className="absolute top-0 left-4 -translate-y-1/2">
            <span className="inline-block px-3 py-1 bg-accent text-foreground text-xs font-semibold rounded-full">
              {label}
            </span>
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className={`notched-card ${className}`}>
      {children}
    </div>
  );
};

export default NotchedCard;
