'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DayRingProps {
  progress?: number; // 0 to 100
  size?: number;
  className?: string;
}

export function DayRing({ progress = 0, size = 280, className }: DayRingProps) {
  // Calculate circle properties
  const center = size / 2;
  const strokeWidth = size * 0.08; // responsive stroke
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      {/* Container for the SVG */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background Ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30 dark:text-muted/20"
        />

        {/* Progress Ring */}
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          className="text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]"
        />
      </svg>

      {/* Inner Content (e.g., Time or percentage) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tracking-tighter tabular-nums">
          {progress}%
        </span>
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">
          Day Complete
        </span>
      </div>
    </div>
  );
}
