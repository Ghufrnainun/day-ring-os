import React from 'react';
import { Shield, Lock, TrendingUp, Calendar, Zap } from 'lucide-react';

const SocialProof: React.FC = () => {
  const chips = [
    { icon: Lock, label: 'Private by default' },
    { icon: TrendingUp, label: 'Serious finance' },
    { icon: Calendar, label: 'Day-first design' },
    { icon: Shield, label: 'No data selling' },
    { icon: Zap, label: 'Fast & focused' },
  ];

  return (
    <section className="py-12 border-y border-border bg-surface/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {chips.map((chip, index) => (
            <div
              key={index}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                index === 1 
                  ? 'border-2 border-accent bg-accent/10 text-foreground' 
                  : 'border border-border bg-card/50 text-muted-foreground'
              }`}
            >
              <chip.icon size={16} className={index === 1 ? 'text-secondary' : ''} />
              <span>{chip.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
