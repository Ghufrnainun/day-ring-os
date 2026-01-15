import React from 'react';
import ScrollReveal from './ScrollReveal';
import Link from 'next/link';

const FinalCTA: React.FC = () => {
  return (
    <section
      id="cta"
      className="py-24 sm:py-32 relative overflow-hidden bg-gradient-to-b from-surface/50 via-primary/5 to-surface/60"
    >
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/10" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <ScrollReveal>
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-6">
            Start with one day.
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <p className="text-xl text-muted-foreground mb-8">
            No credit card. No onboarding marathon. Just you and today.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <Link
            href="/register"
            className="btn-primary text-lg px-10 py-4 btn-press hover-glow inline-block rounded-full"
          >
            Create your first day
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            No pressure. Start with one day.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FinalCTA;
