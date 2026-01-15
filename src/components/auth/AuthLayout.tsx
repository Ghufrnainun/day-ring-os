'use client';

import React from 'react';
import DayRing from '@/components/DayRing';
import Link from 'next/link';
import Image from 'next/image';
import PremiumCard from '@/components/PremiumCard';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grain Texture */}
        <div className="absolute inset-0 bg-grain opacity-80" />

        {/* Centered Orbit Animation - Pulsing Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20">
          <div className="absolute inset-0 border border-primary/20 rounded-full animate-[spin_60s_linear_infinite]" />
          <div className="absolute inset-[100px] border border-primary/10 rounded-full animate-[spin_45s_linear_infinite_reverse]" />
          <div className="absolute inset-[200px] border border-primary/10 rounded-full animate-[spin_30s_linear_infinite]" />
        </div>

        {/* DayRing component kept as subtle center anchor */}
        <DayRing className="opacity-30 scale-150 blur-sm" />
      </div>

      {/* Main Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex flex-row items-center justify-center gap-3"
          >
            <div className="relative w-16 h-16 transition-transform duration-300 hover:scale-105 shadow-glow-lg rounded-full">
              <Image
                src="/3dlogo.png"
                alt="Orbit 3D Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-4xl font-display font-bold tracking-tight text-primary drop-shadow-sm">
              Orbit
            </h1>
          </Link>
        </div>

        {/* Premium Rounded Card */}
        <PremiumCard className="p-8 shadow-2xl border-white/20">
          {children}
        </PremiumCard>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 text-center text-xs text-muted-foreground"
        >
          <div className="flex justify-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors hover:underline underline-offset-4 decoration-primary/30"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors hover:underline underline-offset-4 decoration-primary/30"
            >
              Terms of Service
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
