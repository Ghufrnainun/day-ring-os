import React from 'react';

interface DayRingProps {
  className?: string;
}

const DayRing: React.FC<DayRingProps> = ({ className = '' }) => {
  // Ring configurations from outer to inner
  const rings = [
    { r: 480, strokeWidth: 0.5, delay: 0 },
    { r: 400, strokeWidth: 0.75, delay: 0.8 },
    { r: 320, strokeWidth: 1, delay: 1.6 },
    { r: 240, strokeWidth: 1.25, delay: 2.4 },
    { r: 160, strokeWidth: 1.5, delay: 3.2 },
  ];

  return (
    <div className={`fixed inset-0 overflow-visible pointer-events-none ${className}`}>
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] max-w-none"
        viewBox="0 0 1000 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient for the glow effect - very subtle */}
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(var(--accent))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>

        {rings.map((ring, index) => (
          <circle
            key={index}
            cx="500"
            cy="500"
            r={ring.r}
            stroke="hsl(var(--primary))"
            strokeWidth={ring.strokeWidth}
            fill="none"
            className="orbit-ring-sequential"
            style={{
              animationDelay: `${ring.delay}s`,
            }}
          />
        ))}

        {/* Accent dots that pulse along with the rings */}
        <circle
          cx="500"
          cy="20"
          r="4"
          fill="hsl(var(--accent))"
          className="orbit-dot"
          style={{ animationDelay: '0s' }}
        />
        <circle
          cx="900"
          cy="500"
          r="3"
          fill="hsl(var(--primary))"
          className="orbit-dot"
          style={{ animationDelay: '1.6s' }}
        />
        <circle
          cx="180"
          cy="500"
          r="3"
          fill="hsl(var(--secondary))"
          className="orbit-dot"
          style={{ animationDelay: '3.2s' }}
        />
      </svg>
    </div>
  );
};

export default DayRing;
