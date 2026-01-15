import React from 'react';
import ScrollReveal from './ScrollReveal';

const Philosophy: React.FC = () => {
  const principles = [
    { text: 'Calm execution > performance theater', emphasis: true },
    { text: 'Empty days are allowed', emphasis: false },
    { text: 'Your data stays yours', emphasis: false },
    { text: 'Done is better than perfect', emphasis: true },
  ];

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-gradient-to-b from-surface/20 via-background to-surface/40">
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <ScrollReveal>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-12">
            Our Philosophy
          </h2>
        </ScrollReveal>

        <div className="space-y-6">
          {principles.map((principle, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <p
                className={`font-serif italic text-xl sm:text-2xl leading-relaxed transition-all duration-300 hover:scale-[1.02] cursor-default ${
                  principle.emphasis 
                    ? 'font-semibold text-foreground' 
                    : 'text-muted-foreground'
                }`}
              >
                "{principle.text}"
              </p>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={400}>
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-muted-foreground">
              Built for people who want to do less, better.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Philosophy;
