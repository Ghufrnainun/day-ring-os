import React from 'react';
import DayRing from './DayRing';
import ScrollReveal from './ScrollReveal';

const FinalCTA: React.FC = () => {
  return (
    <section id="cta" className="py-24 sm:py-32 relative overflow-hidden">
      <DayRing className="opacity-40" />
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <ScrollReveal>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Start with one day.
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <p className="text-xl text-muted-foreground mb-8">
            No credit card. No onboarding marathon. Just you and today.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <a href="#" className="btn-primary text-lg px-10 py-4 btn-press hover-glow inline-block">
            Create your first day
          </a>
          <p className="mt-4 text-sm text-muted-foreground">
            No pressure. Start with one day.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FinalCTA;
