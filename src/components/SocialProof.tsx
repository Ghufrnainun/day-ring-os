import React from 'react';
import { Shield, Lock, TrendingUp, Calendar, Zap } from 'lucide-react';
import DayRing from './DayRing';

const SocialProof: React.FC = () => {
  const chips = [{
    icon: Lock,
    label: 'Private by default'
  }, {
    icon: TrendingUp,
    label: 'Serious finance'
  }, {
    icon: Calendar,
    label: 'Day-first design'
  }, {
    icon: Shield,
    label: 'No data selling'
  }, {
    icon: Zap,
    label: 'Fast & focused'
  }];
  return <section className="py-16 relative overflow-hidden">
      {/* Subtle orbit background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
        <DayRing className="!absolute !inset-0" />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {chips.map((chip, index) => <div key={index} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${index === 1 ? 'border-2 border-accent bg-accent/10 text-foreground' : 'border border-border bg-card/50 text-muted-foreground'}`}>
              <chip.icon size={16} className={index === 1 ? 'text-secondary' : ''} />
              <span>{chip.label}</span>
            </div>)}
        </div>
      </div>
    </section>;
};
export default SocialProof;