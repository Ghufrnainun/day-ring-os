import React from 'react';

interface DayRingProps {
  className?: string;
}

const DayRing: React.FC<DayRingProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] max-w-none"
        viewBox="0 0 1000 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring */}
        <circle
          cx="500"
          cy="500"
          r="480"
          stroke="hsl(var(--primary))"
          strokeWidth="0.5"
          className="orbit-ring"
          style={{ animationDelay: '0s' }}
        />
        {/* Second ring */}
        <circle
          cx="500"
          cy="500"
          r="400"
          stroke="hsl(var(--primary))"
          strokeWidth="0.75"
          className="orbit-ring"
          style={{ animationDelay: '2s' }}
        />
        {/* Third ring */}
        <circle
          cx="500"
          cy="500"
          r="320"
          stroke="hsl(var(--primary))"
          strokeWidth="1"
          className="orbit-ring"
          style={{ animationDelay: '4s' }}
        />
        {/* Inner ring */}
        <circle
          cx="500"
          cy="500"
          r="240"
          stroke="hsl(var(--primary))"
          strokeWidth="1.25"
          className="orbit-ring"
          style={{ animationDelay: '6s' }}
        />
        {/* Core ring */}
        <circle
          cx="500"
          cy="500"
          r="160"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          className="orbit-ring"
          style={{ animationDelay: '1s' }}
        />
        {/* Accent dots on rings */}
        <circle
          cx="500"
          cy="20"
          r="4"
          fill="hsl(var(--accent))"
          className="orbit-ring"
          style={{ animationDelay: '3s' }}
        />
        <circle
          cx="900"
          cy="500"
          r="3"
          fill="hsl(var(--primary))"
          className="orbit-ring"
          style={{ animationDelay: '5s' }}
        />
        <circle
          cx="180"
          cy="500"
          r="3"
          fill="hsl(var(--secondary))"
          className="orbit-ring"
          style={{ animationDelay: '7s' }}
        />
      </svg>
    </div>
  );
};

export default DayRing;
