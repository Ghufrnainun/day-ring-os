import { cn } from '@/lib/utils';
import Image from 'next/image';

interface OrbitLogoProps {
  className?: string;
  size?: number;
}

export function OrbitLogo({ className, size = 32 }: OrbitLogoProps) {
  return (
    <Image
      src="/logoNoBG.png"
      alt="Orbit"
      width={size}
      height={size}
      className={cn('object-contain', className)}
    />
  );
}
