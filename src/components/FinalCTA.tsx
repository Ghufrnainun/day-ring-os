import React from 'react';
import DayRing from './DayRing';

const FinalCTA: React.FC = () => {
  return (
    <section id="cta" className="py-24 sm:py-32 relative overflow-hidden">
      <DayRing className="opacity-40" />
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-6">
          Start with one day.
        </h2>
        <p className="text-xl text-muted-foreground mb-8">
          No credit card. No onboarding marathon. Just you and today.
        </p>
        <a href="#" className="btn-primary text-lg px-10 py-4">
          Create your first day
        </a>
        <p className="mt-4 text-sm text-muted-foreground">
          No pressure. Start with one day.
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;
