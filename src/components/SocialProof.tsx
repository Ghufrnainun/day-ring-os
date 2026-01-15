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
    <section className="py-12 border-b border-border relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {chips.map((chip, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 bg-surface/50 rounded-full border border-border text-sm text-muted-foreground hover:border-primary/30 transition-colors duration-200"
            >
              <chip.icon size={14} className="text-primary" />
              <span>{chip.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;