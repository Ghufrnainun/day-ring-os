import React from 'react';
import PremiumCard from './PremiumCard';
import ScrollReveal from './ScrollReveal';
import { CheckSquare, RefreshCw, Wallet } from 'lucide-react';

const Modules: React.FC = () => {
  const modules = [
    {
      icon: CheckSquare,
      label: 'Core',
      title: 'Daily Planner',
      description:
        'The heart of Orbit. Plan your day, check off tasks, and stay focused on what matters right now.',
      features: ['Today-first view', 'Timed tasks', 'Quick capture'],
      highlight: true,
    },
    {
      icon: RefreshCw,
      label: 'Optional',
      title: 'Habits',
      description:
        'Build habits without the pressure. No gamification, no guilt — just gentle consistency.',
      features: ['Flexible streaks', 'No punishment', 'Weekly rhythms'],
      highlight: false,
    },
    {
      icon: Wallet,
      label: 'Optional',
      title: 'Finance',
      description:
        'Track spending with intention. See where your money goes without the complexity.',
      features: ['Multi-account', 'Transaction log', 'Monthly review'],
      highlight: false,
    },
  ];

  return (
    <section
      id="features"
      className="py-20 sm:py-28 bg-[hsl(162_20%_95%)] relative overflow-hidden"
    >
      {/* Subtle background blob */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase bg-accent/15 text-accent-foreground mb-4">
              Features
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
              Three modules, one focus
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Use what you need. Ignore the rest.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <PremiumCard
                variant="simple"
                label={module.label}
                className={`p-6 pt-8 h-full ${
                  module.highlight ? 'border-primary/40 hover-glow' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-all duration-200 hover:bg-primary/20 hover:scale-105 cursor-pointer">
                  <module.icon size={24} className="text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  {module.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {module.description}
                </p>
                <ul className="space-y-2">
                  {module.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-foreground group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary transition-transform duration-200 group-hover:scale-150" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </PremiumCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Modules;
