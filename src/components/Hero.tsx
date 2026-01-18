import React from 'react';
import { ArrowDown } from 'lucide-react';
import Link from 'next/link';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-24">
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center">
        {/* Badge/Pill */}
        <div className="mb-8 animate-fade-up animate-float">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm font-medium text-primary tracking-wide shadow-sm backdrop-blur-sm">
            v1.0 is now live
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-sans text-6xl sm:text-7xl lg:text-8xl font-medium text-foreground tracking-tight leading-[0.95] animate-fade-up-delay-1 text-balance drop-shadow-sm">
          Run your day <br className="hidden sm:block" />
          <span className="font-serif italic text-primary">with clarity.</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-8 text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up-delay-2 text-balance font-light">
          Plan tasks. Repeat habits gently. Track money with trust{' '}
          <br className="hidden sm:block" />— all in one calm place.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up-delay-3 w-full sm:w-auto">
          <div className="flex flex-col items-center">
            <div className="group flex items-center gap-2 p-1 pl-2 bg-background/60 backdrop-blur-md border border-input rounded-full shadow-sm hover:shadow-md transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-12 px-4 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none w-64 text-sm"
              />
              <Link
                href="/register"
                className="h-11 px-8 rounded-full bg-[#2F4F4F] text-white font-medium hover:bg-[#2F4F4F]/90 transition-all shadow-glow flex items-center justify-center min-w-[140px]"
              >
                Create your first day
              </Link>

            </div>
            <p className="mt-4 text-xs font-medium text-muted-foreground/80 flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 block"></span>{' '}
                No guilt
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 block"></span>{' '}
                No streak pressure
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 block"></span>{' '}
                Free early access
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
