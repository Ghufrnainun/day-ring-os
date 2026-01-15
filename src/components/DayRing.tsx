import React from 'react';

interface DayRingProps {
  className?: string;
}

const DayRing: React.FC<DayRingProps> = ({ className = '' }) => {
  // Ring configurations - more compact, focused on hero
  const rings = [
    { r: 280, strokeWidth: 0.3, delay: 0 },
    { r: 220, strokeWidth: 0.5, delay: 0.6 },
    { r: 160, strokeWidth: 0.8, delay: 1.2 },
    { r: 100, strokeWidth: 1.0, delay: 1.8 },
  ];

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      <svg
        className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] max-w-none"
        viewBox="0 0 600 600"
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
            cx="300"
            cy="300"
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
          cx="300"
          cy="20"
          r="3"
          fill="hsl(var(--accent))"
          className="orbit-dot"
          style={{ animationDelay: '0s' }}
        />
        <circle
          cx="560"
          cy="300"
          r="2.5"
          fill="hsl(var(--primary))"
          className="orbit-dot"
          style={{ animationDelay: '1.2s' }}
        />
      </svg>
    </div>
  );
};

export default DayRing;
