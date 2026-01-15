import React from 'react';
import DayRing from './DayRing';

const Philosophy: React.FC = () => {
  const principles = [
    { text: 'Calm execution > performance theater', emphasis: true },
    { text: 'Empty days are allowed', emphasis: false },
    { text: 'Your data stays yours', emphasis: false },
    { text: 'Done is better than perfect', emphasis: true },
  ];

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <DayRing className="opacity-30" />
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-12">
          Our Philosophy
        </h2>

        <div className="space-y-6">
          {principles.map((principle, index) => (
            <p
              key={index}
              className={`text-xl sm:text-2xl leading-relaxed ${
                principle.emphasis 
                  ? 'font-display font-bold text-foreground' 
                  : 'text-muted-foreground'
              }`}
            >
              "{principle.text}"
            </p>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-muted-foreground">
            Built for people who want to do less, better.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Philosophy;
