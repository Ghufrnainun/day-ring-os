import React from 'react';
import DayRing from './DayRing';
import { ArrowDown } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden">
      <DayRing />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] animate-fade-up">
          Your day, under control.
        </h1>
        
        {/* Subheadline */}
        <p className="mt-6 text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-up-delay-1">
          Tasks, habits, and money — in one calm system.
        </p>
        
        {/* Bullets */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 animate-fade-up-delay-2">
          <span className="chip">Today-first clarity</span>
          <span className="chip">Habits without pressure</span>
          <span className="chip-highlight">Finance you can trust</span>
        </div>
        
        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up-delay-3">
          <a href="#cta" className="btn-primary text-base px-8 py-4">
            Create your first day
          </a>
          <a 
            href="#preview" 
            className="btn-secondary text-base px-6 py-4 flex items-center gap-2"
          >
            See the preview
            <ArrowDown size={16} />
          </a>
        </div>
        
        {/* Microcopy */}
        <p className="mt-4 text-sm text-muted-foreground">
          No pressure. Start with one day.
        </p>
        
        {/* Philosophy line */}
        <div className="mt-16 pt-8 border-t border-border max-w-xl mx-auto">
          <p className="text-sm text-muted-foreground italic">
            "Not a habit game. Not a leaderboard. Execution clarity first."
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
